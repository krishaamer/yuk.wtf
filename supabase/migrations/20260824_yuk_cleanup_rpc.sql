alter table public.yuk_interventions
  add column if not exists source_observation_id uuid references public.yuk_observations(id) on delete set null;

create or replace function public.yuk_record_cleanup(
  p_client_id uuid,
  p_site_id uuid,
  p_source_id uuid,
  p_campaign_id uuid default null,
  p_note text default null,
  p_started_at timestamptz default null,
  p_ended_at timestamptz default null
)
returns table (
  intervention_id uuid,
  observation_id uuid,
  created boolean
)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_intervention_id uuid;
  v_observation_id uuid;
  v_ended_at timestamptz := coalesce(p_ended_at, now());
begin
  perform pg_advisory_xact_lock(hashtext(('cleanup:' || p_client_id::text))::bigint);

  select i.id, i.source_observation_id
  into v_intervention_id, v_observation_id
  from public.yuk_sync_ops s
  join public.yuk_interventions i on i.id = s.entity_id
  where s.idempotency_key = 'cleanup:' || p_client_id::text
  limit 1;

  if v_intervention_id is not null then
    return query select v_intervention_id, v_observation_id, false;
    return;
  end if;

  perform 1 from public.yuk_sites where id = p_site_id and status <> 'archived' for update;
  if not found then raise exception 'site not found'; end if;

  if p_campaign_id is not null then
    perform 1 from public.yuk_campaigns where id = p_campaign_id and status <> 'cancelled' for update;
    if not found then raise exception 'campaign not found or cancelled'; end if;

    insert into public.yuk_campaign_sites (campaign_id, site_id, role)
    values (p_campaign_id, p_site_id, 'target')
    on conflict (campaign_id, site_id) do nothing;
  end if;

  insert into public.yuk_observations (
    client_id,
    site_id,
    source_id,
    kind,
    observed_at,
    location_precision,
    public_visibility,
    confidence,
    notes,
    metadata
  ) values (
    p_client_id,
    p_site_id,
    p_source_id,
    'cleanup',
    v_ended_at,
    'none',
    'aggregate',
    0.75,
    nullif(trim(p_note), ''),
    jsonb_build_object('capture_surface', 'cleanup', 'campaign_id', p_campaign_id)
  ) returning id into v_observation_id;

  insert into public.yuk_interventions (
    campaign_id,
    source_observation_id,
    kind,
    title,
    status,
    starts_at,
    ends_at,
    public_visibility,
    metadata
  ) values (
    p_campaign_id,
    v_observation_id,
    'cleanup',
    'Cleanup reported',
    'completed',
    p_started_at,
    v_ended_at,
    'aggregate',
    jsonb_build_object('note', nullif(trim(p_note), ''))
  ) returning id into v_intervention_id;

  insert into public.yuk_intervention_sites (intervention_id, site_id)
  values (v_intervention_id, p_site_id)
  on conflict do nothing;

  insert into public.yuk_verifications (site_id, observation_id, assertion, confidence, notes)
  values (p_site_id, v_observation_id, 'cleaned', 0.75, nullif(trim(p_note), ''));

  update public.yuk_sites
  set status = 'cleaned', updated_at = now()
  where id = p_site_id and status <> 'archived';

  if p_campaign_id is not null then
    update public.yuk_campaign_sites
    set role = 'completed'
    where campaign_id = p_campaign_id and site_id = p_site_id;
  end if;

  insert into public.yuk_sync_ops (
    idempotency_key,
    client_id,
    operation,
    entity_type,
    entity_id,
    status,
    applied_at
  ) values (
    'cleanup:' || p_client_id::text,
    p_client_id,
    'create',
    'intervention',
    v_intervention_id,
    'applied',
    now()
  );

  return query select v_intervention_id, v_observation_id, true;
end;
$$;

revoke all on function public.yuk_record_cleanup(uuid, uuid, uuid, uuid, text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.yuk_record_cleanup(uuid, uuid, uuid, uuid, text, timestamptz, timestamptz) to service_role;

comment on function public.yuk_record_cleanup is 'Transactional, idempotent cleanup recording. It marks reported state as cleaned, preserves evidence, advances campaign progress, and leaves verified_clean for later independent verification.';
