create table if not exists public.yuk_context_features (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.yuk_sources(id) on delete set null,
  source_record_id text,
  kind text not null check (kind in ('protected_area','restricted_access','hazard_zone','sensitive_location','other')),
  name text not null,
  geometry extensions.geography(Geometry, 4326) not null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  instructions text,
  public_visibility text not null default 'public' check (public_visibility in ('private','aggregate','public')),
  valid_from timestamptz,
  valid_to timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, source_record_id)
);

alter table public.yuk_context_features enable row level security;
revoke all on public.yuk_context_features from anon, authenticated;
create index if not exists yuk_context_features_geometry_gist on public.yuk_context_features using gist (geometry);
create index if not exists yuk_context_features_kind_idx on public.yuk_context_features(kind, severity);

alter table public.yuk_media
  add column if not exists public_storage_path text,
  add column if not exists redaction_regions jsonb,
  add column if not exists redaction_model text,
  add column if not exists redacted_at timestamptz;

create or replace function public.yuk_public_nearby_sites(
  p_longitude double precision,
  p_latitude double precision,
  p_radius_m double precision default 5000,
  p_limit integer default 100
)
returns table (
  id uuid,
  title text,
  status text,
  latitude double precision,
  longitude double precision,
  location_accuracy_m integer,
  current_confidence numeric,
  first_observed_at timestamptz,
  last_observed_at timestamptz,
  distance_m double precision
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
    round(extensions.st_y(s.location::extensions.geometry)::numeric, 3)::double precision as latitude,
    round(extensions.st_x(s.location::extensions.geometry)::numeric, 3)::double precision as longitude,
    greatest(coalesce(s.location_accuracy_m, 100), 100) as location_accuracy_m,
    s.current_confidence,
    s.first_observed_at,
    s.last_observed_at,
    extensions.st_distance(
      s.location,
      extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography
    ) as distance_m
  from public.yuk_sites s
  where s.public_visibility = 'public'
    and s.location is not null
    and s.status <> 'archived'
    and extensions.st_dwithin(
      s.location,
      extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography,
      greatest(50, least(p_radius_m, 50000))
    )
  order by distance_m asc
  limit greatest(1, least(p_limit, 500));
$$;

revoke all on function public.yuk_public_nearby_sites(double precision, double precision, double precision, integer) from public, anon, authenticated;
grant execute on function public.yuk_public_nearby_sites(double precision, double precision, double precision, integer) to service_role;

create or replace function public.yuk_context_at_point(
  p_longitude double precision,
  p_latitude double precision,
  p_radius_m double precision default 50
)
returns table (
  id uuid,
  kind text,
  name text,
  severity text,
  instructions text,
  distance_m double precision,
  metadata jsonb
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    f.id,
    f.kind,
    f.name,
    f.severity,
    f.instructions,
    extensions.st_distance(
      f.geometry,
      extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography
    ) as distance_m,
    f.metadata
  from public.yuk_context_features f
  where f.public_visibility <> 'private'
    and (f.valid_from is null or f.valid_from <= now())
    and (f.valid_to is null or f.valid_to >= now())
    and extensions.st_dwithin(
      f.geometry,
      extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography,
      greatest(0, least(p_radius_m, 1000))
    )
  order by
    case f.severity when 'critical' then 4 when 'high' then 3 when 'medium' then 2 else 1 end desc,
    distance_m asc
  limit 20;
$$;

revoke all on function public.yuk_context_at_point(double precision, double precision, double precision) from public, anon, authenticated;
grant execute on function public.yuk_context_at_point(double precision, double precision, double precision) to service_role;

comment on table public.yuk_context_features is 'Versioned spatial context such as protected areas, access restrictions and hazard zones. Source provenance stays attached to each feature.';
comment on function public.yuk_public_nearby_sites is 'Service-only nearby lookup that can use exact query coordinates while returning deliberately rounded public Site geometry.';
comment on function public.yuk_context_at_point is 'Service-only context lookup for safety and protected-area warnings during capture.';
comment on column public.yuk_media.public_storage_path is 'Storage path for a reviewed or automatically redacted derivative. Never populated with an unreviewed original.';
