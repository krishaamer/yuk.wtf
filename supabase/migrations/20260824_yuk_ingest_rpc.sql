create or replace function public.yuk_ingest_observation(
  p_client_id uuid,
  p_kind text,
  p_source_id uuid,
  p_site_id uuid,
  p_title text,
  p_longitude double precision,
  p_latitude double precision,
  p_location_accuracy_m integer,
  p_public_visibility text,
  p_confidence numeric,
  p_ai_model text,
  p_observation_metadata jsonb,
  p_classification jsonb
)
returns table (
  observation_id uuid,
  resolved_site_id uuid,
  created boolean
)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_observation_id uuid;
  v_site_id uuid := p_site_id;
  v_location extensions.geography(Point, 4326);
begin
  if p_kind not in ('discard', 'litter') then
    raise exception 'unsupported observation kind';
  end if;

  if p_kind = 'litter' and (p_longitude is null or p_latitude is null) then
    raise exception 'litter observation requires location';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_client_id::text)::bigint);

  select o.id, o.site_id
  into v_observation_id, v_site_id
  from public.yuk_observations o
  where o.client_id = p_client_id
  limit 1;

  if v_observation_id is not null then
    return query select v_observation_id, v_site_id, false;
    return;
  end if;

  if p_longitude is not null and p_latitude is not null then
    v_location := extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography;
  end if;

  if p_kind = 'litter' and v_site_id is null then
    insert into public.yuk_sites (
      title,
      status,
      location,
      location_accuracy_m,
      current_confidence,
      public_visibility
    ) values (
      nullif(trim(p_title), ''),
      'suspected',
      v_location,
      p_location_accuracy_m,
      p_confidence,
      p_public_visibility
    )
    returning id into v_site_id;
  elsif p_kind = 'litter' and v_site_id is not null then
    update public.yuk_sites
    set
      status = case when status in ('cleaned', 'verified_clean') then 'reappeared' else status end,
      public_visibility = case when p_public_visibility = 'public' then 'public' else public_visibility end,
      location = case when p_public_visibility = 'public' then v_location else location end,
      location_accuracy_m = case when p_public_visibility = 'public' then p_location_accuracy_m else location_accuracy_m end,
      current_confidence = greatest(coalesce(current_confidence, 0), coalesce(p_confidence, 0)),
      updated_at = now()
    where id = v_site_id;
  end if;

  insert into public.yuk_observations (
    client_id,
    site_id,
    source_id,
    kind,
    location,
    location_accuracy_m,
    location_precision,
    public_visibility,
    confidence,
    ai_model,
    metadata
  ) values (
    p_client_id,
    v_site_id,
    p_source_id,
    p_kind,
    v_location,
    p_location_accuracy_m,
    case when v_location is null then 'none' else 'exact' end,
    p_public_visibility,
    p_confidence,
    p_ai_model,
    coalesce(p_observation_metadata, '{}'::jsonb)
  )
  returning id into v_observation_id;

  insert into public.yuk_classifications (
    observation_id,
    item,
    material,
    brand,
    hazard,
    quantity_label,
    disposal_bin,
    disposal_destination,
    confidence,
    model,
    payload
  ) values (
    v_observation_id,
    nullif(trim(p_classification->>'item'), ''),
    nullif(trim(p_classification->>'material'), ''),
    nullif(trim(p_classification->>'brand'), ''),
    nullif(trim(p_classification->>'hazard'), ''),
    nullif(trim(p_classification->>'quantityLabel'), ''),
    nullif(trim(p_classification->>'bin'), ''),
    nullif(trim(p_classification->>'destination'), ''),
    p_confidence,
    p_ai_model,
    coalesce(p_classification, '{}'::jsonb)
  );

  insert into public.yuk_sync_ops (
    idempotency_key,
    client_id,
    operation,
    entity_type,
    entity_id,
    status,
    applied_at
  ) values (
    'capture:' || p_client_id::text,
    p_client_id,
    'create',
    'observation',
    v_observation_id,
    'applied',
    now()
  )
  on conflict (idempotency_key) do nothing;

  return query select v_observation_id, v_site_id, true;
end;
$$;

revoke all on function public.yuk_ingest_observation(uuid, text, uuid, uuid, text, double precision, double precision, integer, text, numeric, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.yuk_ingest_observation(uuid, text, uuid, uuid, text, double precision, double precision, integer, text, numeric, text, jsonb, jsonb) to service_role;

comment on function public.yuk_ingest_observation is 'Service-only transactional ingestion for idempotent YUK captures. Media upload remains a separately repairable operation.';
