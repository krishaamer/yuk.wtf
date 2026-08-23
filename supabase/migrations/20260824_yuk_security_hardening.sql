alter view public.yuk_public_sites set (security_invoker = true);
alter view public.yuk_public_observations set (security_invoker = true);

revoke all on public.yuk_public_sites from anon, authenticated;
revoke all on public.yuk_public_observations from anon, authenticated;

revoke all on function public.yuk_touch_site() from public, anon, authenticated;
grant execute on function public.yuk_touch_site() to service_role;

comment on view public.yuk_public_sites is 'Privacy-safe public projection. Access is mediated by the YUK server API using service-role credentials.';
comment on view public.yuk_public_observations is 'Privacy-safe public projection. Access is mediated by the YUK server API using service-role credentials.';
