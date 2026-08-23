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

- Expo SDK 57 + React Native + Expo Router
- camera and foreground location capture
- SQLite durable local operation log
- client-generated UUIDs
- retryable/idempotent synchronization
- AI output cached locally after the first successful analysis so an upload retry does not spend another model call

The native client lives in `apps/mobile`. It is intentionally a second runtime rather than a web wrapper and is compatible with an Expo Go-first development flow.

### Data

- Supabase / PostgreSQL
- PostGIS for geometry and nearby-site matching
- private Storage bucket for original evidence
- RLS on every YUK core table
- public-safe derived views for deliberately publishable records
- transactional observation/classification/idempotency ingestion

### AI and rules

Models create versioned interpretations of evidence. They never become the source of truth by overwriting observations. Human corrections create later classifications with explicit provenance.

Disposal recognition and disposal policy are separate. The model chooses a normalized rule key; where YUK has authoritative jurisdiction data, the rule dataset replaces the model's disposal guess. Estonia is the first seeded national ruleset.

## Product surfaces

| Historical capability | YUK model | Surface | Status in rebuild |
| --- | --- | --- | --- |
| Report trashpoint | Observation + optional Site | web + native monster capture | implemented foundation |
| Nearby trash map | Site current-belief projection | `/map` | implemented foundation |
| Trashpoint detail | Site evidence history | `/sites/:id` | implemented foundation |
| Photo evidence | private Media | capture + Storage | implemented foundation |
| Categories / amount | versioned Classification | AI + correction | implemented foundation |
| Correct bad report | superseding Classification / Verification | correction UI | implemented foundation |
| Cleaned status | Intervention + Verification | `/cleanup` | implemented foundation |
| Open data web | public-safe derived views | `/data` | implemented foundation |
| Open data API | JSON views | `/api/open-data/*` | implemented foundation |
| Offline reporting | SQLite operation log + idempotent server ingest | native capture + stomach queue | implemented foundation |
| Teams | Organization | organization surfaces | schema ready |
| Events / cleanup campaigns | Intervention + Organization | cleanup/event surfaces | schema ready |
| Areas / leaders | jurisdiction + stewardship | organization/admin | to build |
| Internationalization | locale-independent domain + translated UI | web/mobile | to build |
| Authentication | private identity separate from evidence | account surfaces | to build |
| Moderation | verification/merge/redaction queues | admin | to build |
| Duplicate trashpoints | spatial + evidence matching and merge proposals | ingestion pipeline | implemented foundation |
| AI litter recognition | Classification | analysis pipeline | implemented foundation |
| WADE / TrashAI datasets | Source + imported Observation | import jobs | schema ready |
| Legacy WCD records | Source + imported Observation | import jobs | schema ready |
| Disposal guidance | versioned authoritative rule | monster | Estonia national foundation implemented |
| Brand intelligence | classification + aggregate views | data explorer | schema ready |
| Public heatmaps | derived site/observation views | map | to build |
| Protected areas / hazards | contextual layers + classification | capture/map | to build |

## Domain invariants

### Sites are not reports

A Site is a persistent physical place or waste entity. Observations can be attached to a Site after capture. Matching carries uncertainty: strong nearby evidence can attach automatically, while ambiguous candidates become merge proposals rather than destructive guesses.

### Cleanups do not delete sites

A cleanup creates an Intervention and evidence. The Site remains because its history remains useful and waste can reappear. A later litter observation on a cleaned Site can move the believed state to `reappeared`.

### Corrections do not rewrite model output

A human correction creates a new Classification that supersedes the previous interpretation. Re-running a model follows the same rule.

### Exact evidence is private by default

Original media and exact observation geometry are private. Public views publish deliberately reduced geometry and can later expose only redacted media derivatives.

### Public data is derived

Clients never read the core evidence tables directly. Public data comes from views that explicitly select what is safe to expose and is mediated through YUK's server API.

### Offline means data integrity

The native client writes a capture to SQLite before making a network request. A user can close the app, reconnect later and replay the operation using the same UUID. The database serializes that client operation and returns the original observation rather than producing a duplicate.

### Disposal rules outrank model guesses

AI recognizes the object/material and maps it to a normalized rule key. When an authoritative rule exists for the jurisdiction and date, that rule supplies the disposal guidance. The model does not get to invent local policy.

## Current platform tables

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
- `yuk_site_match_proposals`

## Public contract

The initial open-data contract is intentionally small:

- `/api/open-data/sites`
- `/api/open-data/observations`

These endpoints expose only database views whose geometry is rounded before it leaves PostgreSQL.

## Repository direction

The second runtime now exists at `apps/mobile`, but the root Next.js app stays in place for this slice so the production deployment is not churned solely for directory aesthetics.

As genuinely shared code grows, move toward:

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

Move code when two runtimes actually need the shared package, not just because a monorepo diagram looks cleaner.

## Import strategy

Historical and research systems are sources, not current truth.

- World Cleanup Day legacy records → observations with `source = wcd-legacy`
- Let's Do It World Open Data → observations with `source = ldiw-open-data`
- WADE → classifications / source records with `source = wade-ai`
- TrashAI → classifications / source records with `source = trash-ai`

Imported coordinates and classifications retain their original timestamps and provenance. Import time is stored separately from observed time.

## Next large slices

1. **Moderation and site resolution:** accept/reject merge proposals, explicit merge/unmerge, uncertain classifications, evidence redaction and cleanup verification.
2. **Legacy import:** World Cleanup + Open Data first, then WADE / TrashAI lineage data where licensing and structure allow.
3. **Organizations and campaigns:** teams, cleanup campaigns, stewardship and jurisdiction roles on the new model.
4. **Native parity:** correction flow, nearby Site review, cleanup before/after capture, background retry and public nearby map.
5. **Jurisdiction adapters:** municipal Estonia overrides where national rules are insufficient, followed by other countries.
6. **Aggregate intelligence:** material, brand, recurrence, cleanup effectiveness, hotspots and research exports.
7. **Internationalization and identity:** global language support plus optional account sync without making identity mandatory for basic contribution.

The rebuild is complete when the historical system's useful capabilities are represented by the modern domain model and accessible through YUK surfaces, not when every old screen has been copied pixel-for-pixel.
