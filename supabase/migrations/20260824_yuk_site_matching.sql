create table if not exists public.yuk_site_match_proposals (
  id uuid primary key default gen_random_uuid(),
  source_site_id uuid not null references public.yuk_sites(id) on delete cascade,
  candidate_site_id uuid not null references public.yuk_sites(id) on delete cascade,
  observation_id uuid references public.yuk_observations(id) on delete cascade,
  score numeric(4,3) check (score between 0 and 1),
  distance_m numeric,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (source_site_id, candidate_site_id)
);

alter table public.yuk_site_match_proposals enable row level security;
revoke all on public.yuk_site_match_proposals from anon, authenticated;

create index if not exists yuk_site_match_status_idx
on public.yuk_site_match_proposals(status, score desc, created_at desc);

create or replace function public.yuk_nearby_site_candidates(
  p_longitude double precision,
  p_latitude double precision,
  p_radius_m double precision default 120,
  p_limit integer default 5
)
returns table (
  site_id uuid,
  title text,
  status text,
  distance_m double precision,
  last_observed_at timestamptz,
  latest_item text,
  latest_material text
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    s.id,
    s.title,
    s.status,
    extensions.st_distance(
      s.location,
      extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography
    ) as distance_m,
    s.last_observed_at,
    latest.item,
    latest.material
  from public.yuk_sites s
  left join lateral (
    select c.item, c.material
    from public.yuk_observations o
    join public.yuk_classifications c on c.observation_id = o.id
    where o.site_id = s.id
    order by o.observed_at desc, c.is_human_corrected desc, c.created_at desc
    limit 1
  ) latest on true
  where s.location is not null
    and s.status != 'archived'
    and extensions.st_dwithin(
      s.location,
      extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography,
      greatest(1, least(p_radius_m, 1000))
    )
  order by distance_m asc
  limit greatest(1, least(p_limit, 20));
$$;

revoke all on function public.yuk_nearby_site_candidates(double precision, double precision, double precision, integer) from public, anon, authenticated;
grant execute on function public.yuk_nearby_site_candidates(double precision, double precision, double precision, integer) to service_role;

comment on table public.yuk_site_match_proposals is 'Potential duplicate Site relationships that need evidence or human resolution rather than destructive automatic merging.';
comment on function public.yuk_nearby_site_candidates is 'Service-only spatial candidate lookup used during litter ingestion.';
