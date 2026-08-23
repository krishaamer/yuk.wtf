create extension if not exists pgcrypto;
create extension if not exists postgis with schema extensions;

create table if not exists public.yuk_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null check (kind in ('yuk','legacy','municipality','research','camera','model','import','other')),
  url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.yuk_organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null default 'community',
  website text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.yuk_sites (
  id uuid primary key default gen_random_uuid(),
  title text,
  status text not null default 'suspected' check (status in ('suspected','verified','cleanup_planned','cleaned','verified_clean','reappeared','archived')),
  location extensions.geography(Point, 4326),
  location_accuracy_m integer,
  current_confidence numeric(4,3) check (current_confidence between 0 and 1),
  first_observed_at timestamptz,
  last_observed_at timestamptz,
  public_visibility text not null default 'private' check (public_visibility in ('private','aggregate','public')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.yuk_observations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid,
  site_id uuid references public.yuk_sites(id) on delete set null,
  source_id uuid references public.yuk_sources(id) on delete restrict,
  kind text not null check (kind in ('discard','litter','verification','cleanup','import')),
  observed_at timestamptz not null default now(),
  location extensions.geography(Point, 4326),
  location_accuracy_m integer,
  location_precision text not null default 'none' check (location_precision in ('none','coarse','exact')),
  public_visibility text not null default 'private' check (public_visibility in ('private','aggregate','public')),
  confidence numeric(4,3) check (confidence between 0 and 1),
  ai_model text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (client_id)
);

create table if not exists public.yuk_media (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.yuk_observations(id) on delete cascade,
  storage_path text not null unique,
  media_type text not null default 'image',
  visibility text not null default 'private' check (visibility in ('private','redacted','public')),
  redaction_status text not null default 'pending' check (redaction_status in ('pending','not_needed','processing','ready','blocked')),
  sha256 text,
  width integer,
  height integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.yuk_classifications (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.yuk_observations(id) on delete cascade,
  supersedes_id uuid references public.yuk_classifications(id) on delete set null,
  taxonomy text not null default 'yuk',
  taxonomy_version text not null default '1',
  item text,
  material text,
  brand text,
  hazard text,
  quantity_label text,
  disposal_bin text,
  disposal_destination text,
  confidence numeric(4,3) check (confidence between 0 and 1),
  model text,
  is_human_corrected boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.yuk_verifications (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.yuk_sites(id) on delete cascade,
  observation_id uuid references public.yuk_observations(id) on delete set null,
  assertion text not null check (assertion in ('present','absent','cleaned','hazardous','duplicate','inaccessible','other')),
  confidence numeric(4,3) check (confidence between 0 and 1),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.yuk_interventions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.yuk_organizations(id) on delete set null,
  kind text not null default 'cleanup',
  title text,
  status text not null default 'planned' check (status in ('planned','active','completed','cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  public_visibility text not null default 'private' check (public_visibility in ('private','aggregate','public')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.yuk_intervention_sites (
  intervention_id uuid not null references public.yuk_interventions(id) on delete cascade,
  site_id uuid not null references public.yuk_sites(id) on delete cascade,
  primary key (intervention_id, site_id)
);

create table if not exists public.yuk_disposal_rules (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  jurisdiction text,
  material_key text,
  item_key text,
  bin text not null,
  destination text,
  instructions text,
  source_url text,
  confidence numeric(4,3) not null default 1 check (confidence between 0 and 1),
  valid_from date,
  valid_to date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.yuk_sync_ops (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  client_id uuid,
  operation text not null,
  entity_type text not null,
  entity_id uuid,
  payload_hash text,
  status text not null default 'applied' check (status in ('pending','applied','failed')),
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists yuk_sites_location_gist on public.yuk_sites using gist (location);
create index if not exists yuk_sites_last_observed_idx on public.yuk_sites (last_observed_at desc);
create index if not exists yuk_observations_location_gist on public.yuk_observations using gist (location);
create index if not exists yuk_observations_observed_idx on public.yuk_observations (observed_at desc);
create index if not exists yuk_observations_site_idx on public.yuk_observations (site_id, observed_at desc);
create index if not exists yuk_classifications_observation_idx on public.yuk_classifications (observation_id, created_at desc);
create index if not exists yuk_disposal_rules_lookup_idx on public.yuk_disposal_rules (country_code, jurisdiction, material_key, item_key);

insert into public.yuk_sources (slug, name, kind, url)
values
  ('yuk-web', 'YUK web capture', 'yuk', 'https://yuk.wtf'),
  ('wcd-legacy', 'World Cleanup Day legacy data', 'legacy', 'https://github.com/krishaamer/yuk.wtf'),
  ('wade-ai', 'WADE AI', 'research', 'https://github.com/zerowasteestonia/wade-ai'),
  ('trash-ai', 'TrashAI', 'research', 'https://github.com/zerowasteestonia/trash-ai'),
  ('ldiw-open-data', 'Let''s Do It World Open Data', 'legacy', 'https://github.com/zerowasteestonia/opendata-api')
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('yuk-evidence', 'yuk-evidence', false, 10485760, array['image/jpeg','image/png','image/webp']::text[])
on conflict (id) do update set public = false;

alter table public.yuk_sources enable row level security;
alter table public.yuk_organizations enable row level security;
alter table public.yuk_sites enable row level security;
alter table public.yuk_observations enable row level security;
alter table public.yuk_media enable row level security;
alter table public.yuk_classifications enable row level security;
alter table public.yuk_verifications enable row level security;
alter table public.yuk_interventions enable row level security;
alter table public.yuk_intervention_sites enable row level security;
alter table public.yuk_disposal_rules enable row level security;
alter table public.yuk_sync_ops enable row level security;

create or replace function public.yuk_touch_site()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.site_id is not null then
    update public.yuk_sites
    set
      first_observed_at = coalesce(least(first_observed_at, new.observed_at), new.observed_at),
      last_observed_at = greatest(coalesce(last_observed_at, new.observed_at), new.observed_at),
      updated_at = now()
    where id = new.site_id;
  end if;
  return new;
end;
$$;

drop trigger if exists yuk_observation_touch_site on public.yuk_observations;
create trigger yuk_observation_touch_site
after insert or update of site_id, observed_at on public.yuk_observations
for each row execute function public.yuk_touch_site();

create or replace view public.yuk_public_sites
with (security_barrier = true)
as
select
  s.id,
  s.title,
  s.status,
  round(extensions.st_y(s.location::extensions.geometry)::numeric, 3)::double precision as latitude,
  round(extensions.st_x(s.location::extensions.geometry)::numeric, 3)::double precision as longitude,
  greatest(coalesce(s.location_accuracy_m, 0), 100) as location_accuracy_m,
  s.current_confidence,
  s.first_observed_at,
  s.last_observed_at,
  s.created_at
from public.yuk_sites s
where s.public_visibility = 'public' and s.location is not null;

create or replace view public.yuk_public_observations
with (security_barrier = true)
as
select
  o.id,
  o.site_id,
  o.kind,
  o.observed_at,
  round(extensions.st_y(o.location::extensions.geometry)::numeric, 3)::double precision as latitude,
  round(extensions.st_x(o.location::extensions.geometry)::numeric, 3)::double precision as longitude,
  greatest(coalesce(o.location_accuracy_m, 0), 100) as location_accuracy_m,
  o.confidence,
  c.item,
  c.material,
  c.brand,
  c.hazard,
  c.quantity_label,
  c.confidence as classification_confidence
from public.yuk_observations o
left join lateral (
  select c1.*
  from public.yuk_classifications c1
  where c1.observation_id = o.id
  order by c1.is_human_corrected desc, c1.created_at desc
  limit 1
) c on true
where o.public_visibility = 'public' and o.location is not null;

grant select on public.yuk_public_sites to anon, authenticated;
grant select on public.yuk_public_observations to anon, authenticated;
revoke all on public.yuk_sources from anon, authenticated;
revoke all on public.yuk_organizations from anon, authenticated;
revoke all on public.yuk_sites from anon, authenticated;
revoke all on public.yuk_observations from anon, authenticated;
revoke all on public.yuk_media from anon, authenticated;
revoke all on public.yuk_classifications from anon, authenticated;
revoke all on public.yuk_verifications from anon, authenticated;
revoke all on public.yuk_interventions from anon, authenticated;
revoke all on public.yuk_intervention_sites from anon, authenticated;
revoke all on public.yuk_disposal_rules from anon, authenticated;
revoke all on public.yuk_sync_ops from anon, authenticated;

comment on table public.yuk_sites is 'Persistent physical waste places/entities. Current state is derived from evidence, not destructive updates.';
comment on table public.yuk_observations is 'Timestamped evidence about waste, including personal discards, litter reports, verification and imports.';
comment on table public.yuk_classifications is 'Versioned human/model interpretations of observations. Corrections supersede rather than overwrite.';
comment on table public.yuk_interventions is 'Actions such as cleanups that change physical state without erasing site history.';
comment on table public.yuk_sync_ops is 'Idempotency ledger for offline-first clients.';
