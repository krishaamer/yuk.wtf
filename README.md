# yuk.wtf 💩🤢🤮

**Feed trash to YUK. Map the mess. Keep the evidence.**

YUK is a modern rebuild of the useful World Cleanup product surface on top of its real software lineage. The trash monster is the first capture interface, not the whole product.

The new implementation is built around one durable loop:

`capture → observation → site → verification → intervention → current belief`

A report is evidence. A place persists. A cleanup changes the world without deleting its history.

## What works in the rebuild

### Feed YUK

The web and native clients support two capture intents:

- **I'm throwing this away** creates a private personal discard observation.
- **I found this outside** creates litter evidence and, when needed, a persistent waste Site.

YUK analyses the photo, identifies the object/material, maps it to a normalized disposal-rule category and stores the interpretation with confidence and provenance.

For Estonia, disposal guidance is now grounded in a versioned national rule dataset instead of letting the model invent local policy. Human corrections become newer classifications and never erase the original model output.

### Native offline capture

`apps/mobile` is an Expo SDK 57 / React Native client, not a web wrapper.

A native capture is written to SQLite before any network request. It gets a stable UUID, survives app restarts, can be retried later and reuses a previously successful AI interpretation instead of spending another model call after an upload failure.

The server uses the same UUID as an idempotency boundary, so replay is normal behavior rather than a duplicate-report bug.

### Evidence and sites

- durable observations in PostgreSQL
- PostGIS geometry and nearby-Site candidate search
- conservative automatic Site matching
- ambiguous nearby Sites become merge proposals rather than forced merges
- transactional observation + classification + idempotency ingestion
- private original evidence images in Supabase Storage
- versioned classifications
- persistent Sites with observation history
- public visibility separated from private/aggregate contribution

### Public waste intelligence

- `/map` shows deliberately imprecise public Sites
- `/sites/:id` shows a Site's evidence history
- `/data` explores public derived data
- `/api/open-data/sites` exposes privacy-safe Site JSON
- `/api/open-data/observations` exposes privacy-safe Observation JSON

Exact evidence geometry and original media do not leave the private evidence layer through these surfaces.

### Cleanup

`/cleanup` records cleanup as an Intervention plus evidence and verification. It does not delete the Site and does not automatically pretend one cleanup report is independent proof that the place remains clean. If waste is later observed again at a cleaned Site, the model can represent reappearance rather than creating a contradictory new history.

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
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and must never use a `NEXT_PUBLIC_` prefix.

## Run the native app

```bash
cd apps/mobile
npm install
npx expo start
```

Start with Expo Go. The native client defaults to `https://yuk.wtf` for its API and can use `EXPO_PUBLIC_YUK_API_URL` to point at another deployment.

## Platform programme

The rebuild is intended to reach functional parity with the useful capabilities spread across the old World Cleanup app, Let's Do It World Open Data, WADE and TrashAI without copying their obsolete implementation choices.

The canonical programme and parity matrix live in [`docs/product/PLATFORM-REBUILD.md`](docs/product/PLATFORM-REBUILD.md).

The next large slices are moderation/site resolution, legacy data import, organizations/cleanup campaigns, deeper native parity, more jurisdiction adapters, aggregate waste intelligence, internationalization and optional account sync.

## Architecture

The broader architecture thesis is in [`docs/architecture/YUK.md`](docs/architecture/YUK.md).

Core modern entities now include:

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
