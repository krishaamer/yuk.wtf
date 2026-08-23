alter table public.yuk_classifications
  add column if not exists moderation_status text not null default 'pending' check (moderation_status in ('pending','accepted','rejected')),
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text;

alter table public.yuk_media
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text;

update public.yuk_classifications
set moderation_status = 'accepted', reviewed_at = coalesce(reviewed_at, created_at), review_note = coalesce(review_note, 'Human correction')
where is_human_corrected = true and moderation_status = 'pending';

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
  and c.moderation_status = 'pending'
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

revoke all on public.yuk_moderation_queue from anon, authenticated;
grant select on public.yuk_moderation_queue to service_role;

comment on column public.yuk_classifications.moderation_status is 'Operator review state for uncertain machine classifications. Review does not rewrite the classification.';
comment on column public.yuk_media.review_note is 'Operator note about redaction/publication handling for evidence media.';
