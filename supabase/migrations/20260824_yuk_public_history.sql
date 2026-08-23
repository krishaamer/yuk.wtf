create or replace view public.yuk_public_legacy_series
with (security_barrier = true, security_invoker = true)
as
select
  a.series_key,
  a.geography_key,
  a.period_start,
  a.value,
  a.unit,
  a.metadata,
  s.slug as source_slug,
  s.name as source_name,
  s.url as source_url
from public.yuk_legacy_aggregate_series a
join public.yuk_sources s on s.id = a.source_id;

revoke all on public.yuk_public_legacy_series from anon, authenticated;
grant select on public.yuk_public_legacy_series to service_role;

comment on view public.yuk_public_legacy_series is 'Public historical aggregates with source provenance. These are not YUK observations or claims about current waste.';
