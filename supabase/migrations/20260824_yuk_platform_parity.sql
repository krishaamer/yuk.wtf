alter table public.yuk_organizations
  add column if not exists description text,
  add column if not exists country_code text,
  add column if not exists public_visibility text not null default 'public' check (public_visibility in ('private','aggregate','public')),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.yuk_jurisdictions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_code text,
  kind text not null default 'municipality' check (kind in ('country','region','municipality','district','protected_area','other')),
  geometry extensions.geography(MultiPolygon, 4326),
  centroid extensions.geography(Point, 4326),
  public_visibility text not null default 'public' check (public_visibility in ('private','aggregate','public')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.yuk_stewardships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.yuk_organizations(id) on delete cascade,
  jurisdiction_id uuid not null references public.yuk_jurisdictions(id) on delete cascade,
  role text not null check (role in ('steward','operator','partner','researcher')),
  valid_from date,
  valid_to date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, jurisdiction_id, role, valid_from)
);

create table if not exists public.yuk_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  organization_id uuid references public.yuk_organizations(id) on delete set null,
  jurisdiction_id uuid references public.yuk_jurisdictions(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'planned' check (status in ('planned','active','completed','cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  geometry extensions.geography(MultiPolygon, 4326),
  public_visibility text not null default 'public' check (public_visibility in ('private','aggregate','public')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.yuk_campaign_sites (
  campaign_id uuid not null references public.yuk_campaigns(id) on delete cascade,
  site_id uuid not null references public.yuk_sites(id) on delete cascade,
  role text not null default 'target' check (role in ('target','completed','excluded','reference')),
  created_at timestamptz not null default now(),
  primary key (campaign_id, site_id)
);

alter table public.yuk_interventions
  add column if not exists campaign_id uuid references public.yuk_campaigns(id) on delete set null;

create table if not exists public.yuk_site_merges (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references public.yuk_site_match_proposals(id) on delete set null,
  source_site_id uuid not null references public.yuk_sites(id) on delete restrict,
  target_site_id uuid not null references public.yuk_sites(id) on delete restrict,
  source_status_before text not null,
  source_visibility_before text not null,
  moved_observation_ids uuid[] not null default '{}'::uuid[],
  moved_intervention_ids uuid[] not null default '{}'::uuid[],
  created_target_intervention_ids uuid[] not null default '{}'::uuid[],
  reason text,
  status text not null default 'active' check (status in ('active','reverted')),
  merged_at timestamptz not null default now(),
  reverted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.yuk_legacy_aggregate_series (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.yuk_sources(id) on delete restrict,
  series_key text not null,
  geography_key text,
  period_start timestamptz not null,
  value numeric not null,
  unit text not null default 'count',
  metadata jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  unique (source_id, series_key, geography_key, period_start)
);

alter table public.yuk_jurisdictions enable row level security;
alter table public.yuk_stewardships enable row level security;
alter table public.yuk_campaigns enable row level security;
alter table public.yuk_campaign_sites enable row level security;
alter table public.yuk_site_merges enable row level security;
alter table public.yuk_legacy_aggregate_series enable row level security;

revoke all on public.yuk_jurisdictions from anon, authenticated;
revoke all on public.yuk_stewardships from anon, authenticated;
revoke all on public.yuk_campaigns from anon, authenticated;
revoke all on public.yuk_campaign_sites from anon, authenticated;
revoke all on public.yuk_site_merges from anon, authenticated;
revoke all on public.yuk_legacy_aggregate_series from anon, authenticated;

create index if not exists yuk_jurisdictions_geometry_gist on public.yuk_jurisdictions using gist (geometry);
create index if not exists yuk_campaigns_dates_idx on public.yuk_campaigns (starts_at, ends_at);
create index if not exists yuk_campaigns_geometry_gist on public.yuk_campaigns using gist (geometry);
create index if not exists yuk_campaign_sites_site_idx on public.yuk_campaign_sites (site_id, campaign_id);
create index if not exists yuk_site_merges_source_idx on public.yuk_site_merges (source_site_id, status);
create index if not exists yuk_site_merges_target_idx on public.yuk_site_merges (target_site_id, status);
create index if not exists yuk_legacy_series_lookup_idx on public.yuk_legacy_aggregate_series (series_key, geography_key, period_start);

create or replace function public.yuk_refresh_site_bounds(p_site_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, extensions
as $$
begin
  update public.yuk_sites s
  set
    first_observed_at = q.first_observed_at,
    last_observed_at = q.last_observed_at,
    updated_at = now()
  from (
    select
      min(o.observed_at) as first_observed_at,
      max(o.observed_at) as last_observed_at
    from public.yuk_observations o
    where o.site_id = p_site_id
  ) q
  where s.id = p_site_id;
end;
$$;

revoke all on function public.yuk_refresh_site_bounds(uuid) from public, anon, authenticated;
grant execute on function public.yuk_refresh_site_bounds(uuid) to service_role;

create or replace function public.yuk_resolve_site_match_proposal(
  p_proposal_id uuid,
  p_action text,
  p_reason text default null
)
returns table (merge_id uuid, status text)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_proposal public.yuk_site_match_proposals%rowtype;
  v_source public.yuk_sites%rowtype;
  v_merge_id uuid;
  v_observation_ids uuid[] := '{}'::uuid[];
  v_intervention_ids uuid[] := '{}'::uuid[];
  v_created_target_ids uuid[] := '{}'::uuid[];
begin
  if p_action not in ('accept','reject') then
    raise exception 'action must be accept or reject';
  end if;

  select * into v_proposal
  from public.yuk_site_match_proposals
  where id = p_proposal_id
  for update;

  if not found then
    raise exception 'proposal not found';
  end if;

  if v_proposal.status <> 'pending' then
    raise exception 'proposal already resolved';
  end if;

  if p_action = 'reject' then
    update public.yuk_site_match_proposals
    set status = 'rejected', resolved_at = now(), metadata = metadata || jsonb_build_object('resolution_note', p_reason)
    where id = p_proposal_id;
    return query select null::uuid, 'rejected'::text;
    return;
  end if;

  select * into v_source
  from public.yuk_sites
  where id = v_proposal.source_site_id
  for update;

  perform 1 from public.yuk_sites where id = v_proposal.candidate_site_id for update;
  if not found then
    raise exception 'candidate site not found';
  end if;

  select coalesce(array_agg(id), '{}'::uuid[])
  into v_observation_ids
  from public.yuk_observations
  where site_id = v_proposal.source_site_id;

  select coalesce(array_agg(intervention_id), '{}'::uuid[])
  into v_intervention_ids
  from public.yuk_intervention_sites
  where site_id = v_proposal.source_site_id;

  select coalesce(array_agg(src.intervention_id), '{}'::uuid[])
  into v_created_target_ids
  from public.yuk_intervention_sites src
  where src.site_id = v_proposal.source_site_id
    and not exists (
      select 1 from public.yuk_intervention_sites tgt
      where tgt.site_id = v_proposal.candidate_site_id
        and tgt.intervention_id = src.intervention_id
    );

  insert into public.yuk_site_merges (
    proposal_id,
    source_site_id,
    target_site_id,
    source_status_before,
    source_visibility_before,
    moved_observation_ids,
    moved_intervention_ids,
    created_target_intervention_ids,
    reason
  ) values (
    p_proposal_id,
    v_proposal.source_site_id,
    v_proposal.candidate_site_id,
    v_source.status,
    v_source.public_visibility,
    v_observation_ids,
    v_intervention_ids,
    v_created_target_ids,
    p_reason
  ) returning id into v_merge_id;

  update public.yuk_observations
  set site_id = v_proposal.candidate_site_id
  where site_id = v_proposal.source_site_id;

  insert into public.yuk_intervention_sites (intervention_id, site_id)
  select intervention_id, v_proposal.candidate_site_id
  from public.yuk_intervention_sites
  where site_id = v_proposal.source_site_id
  on conflict do nothing;

  delete from public.yuk_intervention_sites
  where site_id = v_proposal.source_site_id;

  update public.yuk_sites
  set status = 'archived', updated_at = now()
  where id = v_proposal.source_site_id;

  update public.yuk_site_match_proposals
  set status = 'accepted', resolved_at = now(), metadata = metadata || jsonb_build_object('resolution_note', p_reason, 'merge_id', v_merge_id)
  where id = p_proposal_id;

  perform public.yuk_refresh_site_bounds(v_proposal.source_site_id);
  perform public.yuk_refresh_site_bounds(v_proposal.candidate_site_id);

  return query select v_merge_id, 'accepted'::text;
end;
$$;

revoke all on function public.yuk_resolve_site_match_proposal(uuid, text, text) from public, anon, authenticated;
grant execute on function public.yuk_resolve_site_match_proposal(uuid, text, text) to service_role;

create or replace function public.yuk_unmerge_sites(
  p_merge_id uuid,
  p_reason text default null
)
returns table (merge_id uuid, status text)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_merge public.yuk_site_merges%rowtype;
begin
  select * into v_merge
  from public.yuk_site_merges
  where id = p_merge_id
  for update;

  if not found then
    raise exception 'merge not found';
  end if;

  if v_merge.status <> 'active' then
    raise exception 'merge is not active';
  end if;

  update public.yuk_observations
  set site_id = v_merge.source_site_id
  where id = any(v_merge.moved_observation_ids)
    and site_id = v_merge.target_site_id;

  insert into public.yuk_intervention_sites (intervention_id, site_id)
  select unnest(v_merge.moved_intervention_ids), v_merge.source_site_id
  on conflict do nothing;

  delete from public.yuk_intervention_sites
  where site_id = v_merge.target_site_id
    and intervention_id = any(v_merge.created_target_intervention_ids);

  update public.yuk_sites
  set
    status = v_merge.source_status_before,
    public_visibility = v_merge.source_visibility_before,
    updated_at = now()
  where id = v_merge.source_site_id;

  update public.yuk_site_merges
  set
    status = 'reverted',
    reverted_at = now(),
    metadata = metadata || jsonb_build_object('revert_note', p_reason)
  where id = p_merge_id;

  perform public.yuk_refresh_site_bounds(v_merge.source_site_id);
  perform public.yuk_refresh_site_bounds(v_merge.target_site_id);

  return query select p_merge_id, 'reverted'::text;
end;
$$;

revoke all on function public.yuk_unmerge_sites(uuid, text) from public, anon, authenticated;
grant execute on function public.yuk_unmerge_sites(uuid, text) to service_role;

create or replace view public.yuk_public_organizations
with (security_barrier = true, security_invoker = true)
as
select id, slug, name, kind, description, country_code, website, created_at, updated_at
from public.yuk_organizations
where public_visibility = 'public';

create or replace view public.yuk_public_campaigns
with (security_barrier = true, security_invoker = true)
as
select
  c.id,
  c.slug,
  c.title,
  c.description,
  c.status,
  c.starts_at,
  c.ends_at,
  c.organization_id,
  o.slug as organization_slug,
  o.name as organization_name,
  c.jurisdiction_id,
  j.slug as jurisdiction_slug,
  j.name as jurisdiction_name,
  c.created_at,
  c.updated_at,
  (select count(*) from public.yuk_campaign_sites cs where cs.campaign_id = c.id) as site_count,
  (select count(*) from public.yuk_interventions i where i.campaign_id = c.id and i.status = 'completed') as completed_interventions
from public.yuk_campaigns c
left join public.yuk_organizations o on o.id = c.organization_id
left join public.yuk_jurisdictions j on j.id = c.jurisdiction_id
where c.public_visibility = 'public';

create or replace view public.yuk_public_material_stats
with (security_barrier = true, security_invoker = true)
as
select
  lower(trim(c.material)) as material,
  count(*)::bigint as observation_count,
  count(distinct o.site_id)::bigint as site_count,
  max(o.observed_at) as last_seen_at
from public.yuk_observations o
join lateral (
  select c1.* from public.yuk_classifications c1
  where c1.observation_id = o.id
  order by c1.is_human_corrected desc, c1.created_at desc
  limit 1
) c on true
where o.public_visibility = 'public'
  and nullif(trim(c.material), '') is not null
group by lower(trim(c.material));

create or replace view public.yuk_public_brand_stats
with (security_barrier = true, security_invoker = true)
as
select
  trim(c.brand) as brand,
  count(*)::bigint as observation_count,
  count(distinct o.site_id)::bigint as site_count,
  max(o.observed_at) as last_seen_at
from public.yuk_observations o
join lateral (
  select c1.* from public.yuk_classifications c1
  where c1.observation_id = o.id
  order by c1.is_human_corrected desc, c1.created_at desc
  limit 1
) c on true
where o.public_visibility = 'public'
  and nullif(trim(c.brand), '') is not null
group by trim(c.brand);

create or replace view public.yuk_public_heatmap
with (security_barrier = true, security_invoker = true)
as
select
  round(extensions.st_y(o.location::extensions.geometry)::numeric, 2)::double precision as latitude,
  round(extensions.st_x(o.location::extensions.geometry)::numeric, 2)::double precision as longitude,
  count(*)::bigint as observation_count,
  count(distinct o.site_id)::bigint as site_count,
  max(o.observed_at) as last_seen_at
from public.yuk_observations o
where o.public_visibility = 'public'
  and o.kind = 'litter'
  and o.location is not null
group by
  round(extensions.st_y(o.location::extensions.geometry)::numeric, 2),
  round(extensions.st_x(o.location::extensions.geometry)::numeric, 2);

create or replace view public.yuk_moderation_queue
with (security_barrier = true, security_invoker = true)
as
select
  p.id,
  'site_match'::text as queue_type,
  greatest(1, round(coalesce(p.score, 0) * 100)::integer) as priority,
  coalesce(s.title, 'Unnamed waste site') || ' ↔ ' || coalesce(t.title, 'Unnamed waste site') as title,
  p.created_at,
  jsonb_build_object(
    'source_site_id', p.source_site_id,
    'candidate_site_id', p.candidate_site_id,
    'observation_id', p.observation_id,
    'score', p.score,
    'distance_m', p.distance_m,
    'metadata', p.metadata
  ) as payload
from public.yuk_site_match_proposals p
join public.yuk_sites s on s.id = p.source_site_id
join public.yuk_sites t on t.id = p.candidate_site_id
where p.status = 'pending'
union all
select
  c.id,
  'classification'::text,
  greatest(1, round((1 - coalesce(c.confidence, 0)) * 100)::integer),
  coalesce(c.item, 'Unclassified observation'),
  c.created_at,
  jsonb_build_object(
    'observation_id', c.observation_id,
    'item', c.item,
    'material', c.material,
    'brand', c.brand,
    'confidence', c.confidence,
    'model', c.model
  )
from public.yuk_classifications c
join public.yuk_observations o on o.id = c.observation_id
where coalesce(c.confidence, 0) < 0.6
  and c.is_human_corrected = false
  and o.public_visibility in ('aggregate','public')
union all
select
  m.id,
  'media_redaction'::text,
  70,
  'Evidence media awaiting redaction',
  m.created_at,
  jsonb_build_object(
    'observation_id', m.observation_id,
    'media_id', m.id,
    'redaction_status', m.redaction_status
  )
from public.yuk_media m
join public.yuk_observations o on o.id = m.observation_id
where m.redaction_status = 'pending'
  and o.public_visibility = 'public';

revoke all on public.yuk_public_organizations from anon, authenticated;
revoke all on public.yuk_public_campaigns from anon, authenticated;
revoke all on public.yuk_public_material_stats from anon, authenticated;
revoke all on public.yuk_public_brand_stats from anon, authenticated;
revoke all on public.yuk_public_heatmap from anon, authenticated;
revoke all on public.yuk_moderation_queue from anon, authenticated;

grant select on public.yuk_public_organizations to service_role;
grant select on public.yuk_public_campaigns to service_role;
grant select on public.yuk_public_material_stats to service_role;
grant select on public.yuk_public_brand_stats to service_role;
grant select on public.yuk_public_heatmap to service_role;
grant select on public.yuk_moderation_queue to service_role;

comment on table public.yuk_campaigns is 'Modern replacement for cleanup events/campaign coordination. Campaigns group target Sites and completed Interventions without becoming the primary evidence model.';
comment on table public.yuk_stewardships is 'Time-bounded organization responsibility for a jurisdiction, replacing rigid area-leader hierarchy.';
comment on table public.yuk_site_merges is 'Reversible audit record for duplicate Site resolution.';
comment on table public.yuk_legacy_aggregate_series is 'Historical aggregate metrics that cannot truthfully be represented as individual observations.';
comment on view public.yuk_moderation_queue is 'Server-only combined queue for ambiguous Site matches, low-confidence classifications and public media awaiting redaction.';
