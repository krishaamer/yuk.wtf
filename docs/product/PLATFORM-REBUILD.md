# YUK platform rebuild

YUK is a modern rebuild of the useful World Cleanup product surface, not a modernization of the 2018 dependency tree.

The implementation boundary is:

`capture → observation → site → verification → intervention → current belief`

The trash monster is the first capture surface. It is not the whole product.

## Stack

### Web

- Next.js App Router
- server routes for privileged ingestion
- public server-rendered map, site, organization, campaign, history and open-data surfaces
- protected operator consoles for moderation and campaign operations

### Mobile

- Expo SDK 57 + React Native + Expo Router
- camera and foreground location capture
- SQLite durable local operation log
- client-generated UUIDs
- retryable/idempotent synchronization
- AI output cached locally after the first successful analysis so an upload retry does not spend another model call
- native human correction and cleanup intervention flows

The native client lives in `apps/mobile`. It is intentionally a second runtime rather than a web wrapper.

### Data

- Supabase / PostgreSQL
- PostGIS for geometry and nearby-site matching
- private Storage bucket for original evidence
- RLS on every YUK core table
- public-safe derived views for deliberately publishable records
- transactional observation/classification/idempotency ingestion
- transactional cleanup/intervention/campaign progress updates
- reversible Site merge audit records

### AI and rules

Models create versioned interpretations of evidence. They never become the source of truth by overwriting observations. Human corrections create later classifications with explicit provenance.

Disposal recognition and disposal policy are separate. The model chooses a normalized rule key; where YUK has authoritative jurisdiction data, the rule dataset replaces the model's disposal guess. Estonia is the first seeded national ruleset.

## Product surfaces

| Historical capability | YUK model | Surface | Status in rebuild |
| --- | --- | --- | --- |
| Report trashpoint | Observation + optional Site | web + native monster capture | implemented |
| Nearby trash map | Site current-belief projection | `/map` | implemented foundation |
| Trashpoint detail | Site evidence history | `/sites/:id` | implemented |
| Photo evidence | private Media | capture + Storage | implemented |
| Categories / amount | versioned Classification | AI + correction | implemented foundation |
| Correct bad report | superseding Classification | web + native correction | implemented |
| Cleaned status | Intervention + Verification | web + native cleanup | implemented |
| Open data web | public-safe derived views | `/data` | implemented |
| Open data API | JSON views | `/api/open-data/*` | implemented foundation |
| Offline reporting | SQLite operation log + idempotent server ingest | native capture + stomach queue | implemented |
| Teams | Organization | `/organizations` + admin | implemented foundation |
| Events / cleanup campaigns | Campaign + Intervention + Site targets | `/campaigns` + admin | implemented foundation |
| Areas / leaders | jurisdiction + time-bounded stewardship | organization/admin | implemented foundation |
| Internationalization | locale-independent domain + translated UI | web/mobile | to build |
| Authentication | private identity separate from evidence | account surfaces | to build |
| Moderation | review queues + reversible decisions | `/admin/moderation` | implemented foundation |
| Duplicate trashpoints | spatial/evidence matching + merge proposals | ingestion + admin | implemented |
| Revert bad merge | Site merge audit + unmerge RPC | admin | implemented |
| AI litter recognition | Classification | analysis pipeline | implemented foundation |
| WADE / TrashAI datasets | Source + imported interpretation | import jobs | source model ready |
| Legacy WCD records | Source + imported Observation | import jobs | source model ready |
| Historical Open Data | provenance-preserving aggregate series | `/history` + API | implemented for global report timeline |
| Disposal guidance | versioned authoritative rule | monster | Estonia national foundation implemented |
| Brand intelligence | aggregate Classification view | `/data` + API | implemented foundation |
| Material intelligence | aggregate Classification view | `/data` + API | implemented foundation |
| Public heatmaps | coarse aggregate cells | `/data` + API | implemented foundation |
| Protected areas / hazards | contextual layers + classification | capture/map | to build |

## Domain invariants

### Sites are not reports

A Site is a persistent physical place or waste entity. Observations can be attached to a Site after capture. Matching carries uncertainty: strong nearby evidence can attach automatically, while ambiguous candidates become merge proposals rather than destructive guesses.

### Cleanups do not delete sites

A cleanup creates an Intervention and evidence. The Site remains because its history remains useful and waste can reappear. A reported cleanup moves the Site to `cleaned`; `verified_clean` is reserved for later verification. A later litter observation can move a cleaned Site to `reappeared`.

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

### Coordination does not own evidence

Organizations, stewardship and campaigns coordinate action around Sites. They do not own or erase observations. Reporting remains possible outside an organization or campaign.

### Ambiguous merges are reversible

A Site merge records the source/target relationship and the exact observations/interventions moved. Operators can undo the merge instead of relying on irreversible deduplication.

### Aggregate history stays aggregate

Historical summary counts are stored as provenance-bearing aggregate series. They are not expanded into fabricated Observations. The inherited Open Data global timeline currently preserves 98 monthly points from 2009 through January 2018, ending at 217,317 cumulative reports.

## Current platform tables

- `yuk_sources`
- `yuk_organizations`
- `yuk_jurisdictions`
- `yuk_stewardships`
- `yuk_campaigns`
- `yuk_campaign_sites`
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
- `yuk_site_merges`
- `yuk_legacy_aggregate_series`

## Public contract

Current open-data routes include:

- `/api/open-data/sites`
- `/api/open-data/observations`
- `/api/open-data/materials`
- `/api/open-data/brands`
- `/api/open-data/heatmap`
- `/api/open-data/organizations`
- `/api/open-data/campaigns`
- `/api/open-data/history`

Exact evidence geometry and originals are not exposed through these routes.

## Operator contract

The admin interface is disabled unless `YUK_ADMIN_TOKEN` is configured server-side.

- `/admin/moderation` resolves duplicate proposals, uncertain classifications, public-media review and active merge reverts.
- `/admin/operations` manages organizations, jurisdictions, stewardship, campaigns and campaign Site targets.

Database writes still use the server-only Supabase service role. Neither secret belongs in a public client bundle.

## Historical imports

Historical and research systems are sources, not current truth.

- World Cleanup Day legacy records → attributed legacy Observations when individual evidence is available
- Let's Do It World Open Data aggregate graph → `yuk_legacy_aggregate_series`
- WADE → attributed source/classification material where licensing and record structure allow
- TrashAI → attributed source/classification material where licensing and record structure allow

Imported coordinates and classifications retain original timestamps and provenance. Import time is stored separately from observed time.

## Next large slices

1. **Legacy individual records:** import attributable World Cleanup/Open Data records where the source data is available, while preserving timestamps and source identity.
2. **Native nearby map:** public nearby Sites, explicit candidate review before ambiguous attachment, and richer cleanup before/after capture.
3. **Media privacy pipeline:** automated face/license-plate redaction and safe public derivatives.
4. **Jurisdiction adapters:** municipality-level Estonia overrides where national rules are insufficient, followed by other countries.
5. **Protected and hazard context:** access constraints, protected land and safety layers at capture/map time.
6. **Internationalization:** rebuild the global language architecture rather than treating translation as polish.
7. **Optional identity/account sync:** cross-device personal stomach/history and organization roles without making identity mandatory for basic contribution.
8. **Research intelligence:** recurrence, cleanup effectiveness, material/brand trends and export formats for researchers.

The rebuild is complete when the historical system's useful capabilities are represented by the modern domain model and accessible through YUK surfaces, not when every old screen has been copied pixel-for-pixel.
