# YUK platform rebuild

YUK is a modern rebuild of the useful World Cleanup product surface, not a modernization of the 2018 dependency tree.

The implementation boundary is:

`capture → observation → site → verification → intervention → current belief`

The trash monster is the first capture surface. It is not the whole product.

## Stack

### Web

- Next.js App Router
- server routes for privileged ingestion
- public server-rendered map, site and open-data surfaces

### Mobile

- Expo + React Native + Expo Router
- shared domain/API contracts with web
- durable local operation log
- client-generated UUIDs
- resumable evidence upload
- background/idempotent synchronization

The mobile app should be added once the domain/API contract is stable enough to share. Do not copy the web DOM UI into React Native.

### Data

- Supabase / PostgreSQL
- PostGIS for geometry
- private Storage bucket for original evidence
- RLS on every YUK core table
- public-safe views for deliberately publishable derived records

### AI

Models create versioned interpretations of evidence. They never become the source of truth by overwriting observations. Human corrections create later classifications with explicit provenance.

## Product surfaces

| Historical capability | YUK model | Surface | Status in rebuild |
| --- | --- | --- | --- |
| Report trashpoint | Observation + optional Site | monster capture | implemented foundation |
| Nearby trash map | Site current-belief projection | `/map` | implemented foundation |
| Trashpoint detail | Site evidence history | `/sites/:id` | implemented foundation |
| Photo evidence | private Media | capture + Storage | implemented foundation |
| Categories / amount | versioned Classification | AI + correction | implemented foundation |
| Correct bad report | superseding Classification / Verification | correction UI | implemented foundation |
| Cleaned status | Intervention + Verification | `/cleanup` | implemented foundation |
| Open data web | public-safe derived views | `/data` | implemented foundation |
| Open data API | JSON views | `/api/open-data/*` | implemented foundation |
| Offline reporting | idempotency ledger + client IDs | mobile sync package | schema/contract ready |
| Teams | Organization | organization surfaces | schema ready |
| Events / cleanup campaigns | Intervention + Organization | cleanup/event surfaces | schema ready |
| Areas / leaders | jurisdiction + stewardship | organization/admin | to build |
| Internationalization | locale-independent domain + translated UI | web/mobile | to build |
| Authentication | private identity separate from evidence | account surfaces | to build |
| Moderation | verification/merge/redaction queues | admin | to build |
| Duplicate trashpoints | probabilistic site matching | ingestion worker | to build |
| AI litter recognition | Classification | analysis pipeline | implemented foundation |
| WADE / TrashAI datasets | Source + imported Observation | import jobs | schema ready |
| Legacy WCD records | Source + imported Observation | import jobs | schema ready |
| Disposal guidance | versioned authoritative rule | monster | schema ready; adapters to build |
| Brand intelligence | classification + aggregate views | data explorer | schema ready |
| Public heatmaps | derived site/observation views | map | to build |
| Protected areas / hazards | contextual layers + classification | capture/map | to build |

## Domain invariants

### Sites are not reports

A Site is a persistent physical place or waste entity. Observations can be attached to a Site after capture. A matching decision is allowed to carry uncertainty.

### Cleanups do not delete sites

A cleanup creates an Intervention and evidence. The Site remains because its history remains useful and waste can reappear.

### Corrections do not rewrite model output

A human correction creates a new Classification that supersedes the previous interpretation. Re-running a model follows the same rule.

### Exact evidence is private by default

Original media and exact observation geometry are private. Public views can publish deliberately reduced geometry and redacted media later.

### Public data is derived

Clients never read the core evidence tables directly. Public data comes from views that explicitly select what is safe to expose.

### Offline means data integrity

A mobile client must be able to create a capture locally, close the app, reconnect days later and submit the same operation repeatedly without producing duplicate observations.

## Initial tables

- `yuk_sources`
- `yuk_organizations`
- `yuk_sites`
- `yuk_observations`
- `yuk_media`
- `yuk_classifications`
- `yuk_verifications`
- `yuk_interventions`
- `yuk_intervention_sites`
- `yuk_disposal_rules`
- `yuk_sync_ops`

## Public contract

The initial open-data contract is intentionally small:

- `/api/open-data/sites`
- `/api/open-data/observations`

These endpoints expose only database views whose geometry is rounded before it leaves PostgreSQL.

## Mobile repository shape

Once mobile work begins, move toward:

```text
apps/
  web/
  mobile/
  admin/
packages/
  domain/
  api/
  sync/
  taxonomy/
  disposal/
  ui-native/
  ui-web/
supabase/
  migrations/
```

Do not move to a monorepo simply to make the tree look architectural. Make the move when a second runtime actually consumes the shared packages.

## Import strategy

Historical and research systems are sources, not current truth.

- World Cleanup Day legacy records → observations with `source = wcd-legacy`
- Let's Do It World Open Data → observations with `source = ldiw-open-data`
- WADE → classifications / source records with `source = wade-ai`
- TrashAI → classifications / source records with `source = trash-ai`

Imported coordinates and classifications retain their original timestamps and provenance. Import time is stored separately from observed time.

## Next large slices

1. **Site matching:** nearby candidate search, duplicate proposals, human merge/unmerge and current-belief projection.
2. **Native capture:** Expo app with offline operation log and background synchronization against the same ingestion contract.
3. **Authoritative disposal:** Estonia first, then jurisdiction adapters with source URLs and validity dates.
4. **Moderation/admin:** uncertain classifications, redaction, duplicate sites, cleanup verification and organization stewardship.
5. **Legacy import:** World Cleanup + Open Data first, then WADE / TrashAI lineage data where licensing and structure allow.
6. **Aggregate intelligence:** material, brand, recurrence, cleanup effectiveness, hotspots and research exports.

The rebuild is complete when the historical system's useful capabilities are represented by the modern domain model and accessible through YUK surfaces, not when every old screen has been copied pixel-for-pixel.
