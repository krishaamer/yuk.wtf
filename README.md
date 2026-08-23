# yuk.wtf 💩🤢🤮

**Feed trash to YUK. Map the mess. Keep the evidence.**

YUK is a modern rebuild of the useful World Cleanup product surface on top of its real software lineage. The trash monster is the first capture interface, not the whole product.

The implementation is built around one durable loop:

`capture → observation → site → verification → intervention → current belief`

A report is evidence. A place persists. A cleanup changes the world without deleting its history.

## What works in the rebuild

### Feed YUK

The web and native clients support two capture intents:

- **I'm throwing this away** creates a private personal discard observation.
- **I found this outside** creates litter evidence and, when needed, a persistent waste Site.

YUK analyses the photo, identifies the object/material, maps it to a normalized disposal-rule category and stores the interpretation with confidence and provenance.

For Estonia, disposal guidance is grounded in a versioned national rule dataset instead of letting the model invent local policy. Human corrections become newer classifications and never erase the original model output.

### Native offline capture

`apps/mobile` is an Expo / React Native client, not a web wrapper.

A native capture is written to SQLite before any network request. It gets a stable UUID, survives app restarts, can be retried later and reuses a previously successful AI interpretation instead of spending another model call after an upload failure.

Synced native observations can be corrected from the phone, and synced litter Sites can create cleanup interventions without falling back to the web app.

### Evidence, Sites and duplicate resolution

- durable observations in PostgreSQL
- PostGIS geometry and nearby-Site candidate search
- conservative automatic Site matching
- ambiguous nearby Sites become merge proposals rather than forced merges
- operator-reviewed merges are auditable and reversible
- transactional observation + classification + idempotency ingestion
- private original evidence images in Supabase Storage
- versioned classifications and moderation state
- persistent Sites with observation history
- public visibility separated from private/aggregate contribution

### Cleanup and campaigns

Cleanup is modeled as evidence-backed intervention rather than deletion.

A cleanup transaction:

- creates the cleanup Observation, Intervention and Verification together
- sets the Site to `cleaned`, leaving `verified_clean` for later independent verification
- can advance a linked campaign target to completed
- is idempotent when replayed with the same client UUID
- preserves the earlier Site history

YUK now has Organizations, Jurisdictions, time-bounded Stewardship and cleanup Campaigns. These coordinate action around Sites without owning the underlying evidence or making team membership mandatory for basic reporting.

Public surfaces:

- `/organizations`
- `/campaigns`
- `/cleanup`

Protected operator surface:

- `/admin/operations`

### Public waste intelligence

- `/map` shows deliberately imprecise public Sites
- `/sites/:id` shows a Site's evidence history
- `/data` explores aggregate material, brand and hotspot intelligence
- `/history` preserves the inherited Open Data reporting curve as historical aggregate data

Open-data APIs currently include:

- `/api/open-data/sites`
- `/api/open-data/observations`
- `/api/open-data/materials`
- `/api/open-data/brands`
- `/api/open-data/heatmap`
- `/api/open-data/organizations`
- `/api/open-data/campaigns`
- `/api/open-data/history`

Exact evidence geometry and original media do not leave the private evidence layer through these surfaces.

### Moderation

`/admin/moderation` is disabled unless `YUK_ADMIN_TOKEN` is configured server-side.

Operators can:

- accept or reject ambiguous Site matches
- undo active Site merges
- review low-confidence machine classifications without deleting them
- decide whether public evidence media needs redaction or must be blocked

The queue exists because uncertainty is part of the model, not something YUK hides.

### Historical Open Data

The historical Let's Do It World Open Data graph is imported as 98 provenance-bearing monthly aggregate points from 2009 through January 2018, ending at 217,317 cumulative reports.

Those numbers remain aggregate history. YUK does not expand them into fabricated individual Observations or claim the historical waste still exists.

## Run the web app

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required server environment:

```bash
OPENAI_API_KEY=...
OPENAI_VISION_MODEL=gpt-5-mini
SUPABASE_URL=https://suhdyvgijlismwfglsvf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
YUK_ADMIN_TOKEN=...
```

`SUPABASE_SERVICE_ROLE_KEY` and `YUK_ADMIN_TOKEN` are server-only and must never use a `NEXT_PUBLIC_` prefix.

`YUK_ADMIN_TOKEN` is only needed for operator surfaces. The public product does not require it.

## Run the native app

```bash
cd apps/mobile
npm install
npx expo start
```

The native client defaults to `https://yuk.wtf` for its API and can use `EXPO_PUBLIC_YUK_API_URL` to point at another deployment.

## Platform programme

The rebuild aims for functional parity with the useful capabilities spread across the old World Cleanup app, Let's Do It World Open Data, WADE and TrashAI without copying their obsolete implementation choices.

The canonical programme and parity matrix live in [`docs/product/PLATFORM-REBUILD.md`](docs/product/PLATFORM-REBUILD.md).

The remaining major slices are attributable legacy individual-record imports, richer native nearby/map flows, automated media redaction, more jurisdictional disposal adapters, protected-area/hazard context, internationalization, optional identity/account sync and deeper research intelligence.

## Architecture

The broader architecture thesis is in [`docs/architecture/YUK.md`](docs/architecture/YUK.md).

Core modern entities now include:

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

Database migrations live in `supabase/migrations/`.

## Lineage

This repository intentionally preserves the project's real Git genealogy rather than copying old code into a supposedly clean repository.

Two surviving 2018 development generations are preserved as immutable archive branches:

- [`archive/haamer-expo-2018`](../../tree/archive/haamer-expo-2018), ending at `05c2832`
- [`archive/wcd-react-native-2018`](../../tree/archive/wcd-react-native-2018), ending at `1896cb0`

The histories were explicitly reunited in 2026 by commit `b91228a`. Historical runtime code remains available through Git history and archive branches, but is no longer part of the active application tree.

YUK also has a wider product/research lineage that is not literal Git ancestry: the Let's Do It World Open Data web/API projects, WADE AI and TrashAI. Together they trace the evolution from manual waste mapping toward open waste datasets and machine interpretation of litter imagery.

For the archaeology, see:

- [`docs/archaeology/README.md`](docs/archaeology/README.md)
- [`docs/archaeology/TIMELINE.md`](docs/archaeology/TIMELINE.md)
- [`docs/archaeology/INHERITANCE.md`](docs/archaeology/INHERITANCE.md)
- [`docs/archaeology/EXTENDED-LINEAGE.md`](docs/archaeology/EXTENDED-LINEAGE.md)
- [`docs/archaeology/SECURITY.md`](docs/archaeology/SECURITY.md)

## License

Historical code retains its existing GPL-3.0 licensing and notices. New code preserves applicable obligations from inherited GPL-licensed material.
