# yuk.wtf 💩🤢🤮

**Feed trash to YUK. Map the mess. Keep the evidence.**

YUK is a modern rebuild of the useful World Cleanup product surface on top of its real software lineage. The trash monster is the first capture interface, not the whole product.

The new implementation is built around one durable loop:

`capture → observation → site → verification → intervention → current belief`

A report is evidence. A place persists. A cleanup changes the world without deleting its history.

## What works in the rebuild

### Feed YUK

The homepage supports two capture modes:

- **I'm throwing this away** creates a private personal discard observation.
- **I found this outside** creates litter evidence and, when needed, a persistent waste Site.

YUK analyses the photo, identifies the object/material, gives best-effort disposal guidance and stores the model interpretation with its confidence and provenance.

Human corrections become newer classifications. They do not erase the original model output.

### Evidence and sites

- durable observations in PostgreSQL
- PostGIS geometry
- private original evidence images in Supabase Storage
- versioned classifications
- persistent Sites with observation history
- client-generated IDs and idempotency ledger for future offline sync
- public visibility separated from private/aggregate contribution

### Public waste intelligence

- `/map` shows deliberately imprecise public Sites
- `/sites/:id` shows a Site's evidence history
- `/data` explores public derived data
- `/api/open-data/sites` exposes privacy-safe Site JSON
- `/api/open-data/observations` exposes privacy-safe Observation JSON

Exact evidence geometry and original media do not leave the private evidence layer through these surfaces.

### Cleanup

`/cleanup` records cleanup as an Intervention plus evidence and verification. It does not delete the Site and does not automatically pretend one cleanup report is independent proof that the place remains clean.

## Run it

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

The publishable Supabase project coordinates are included in `.env.example` for future browser/native clients, but the current core evidence tables are not directly accessible from public clients.

## Platform programme

The rebuild is intended to reach functional parity with the useful capabilities spread across the old World Cleanup app, Let's Do It World Open Data, WADE and TrashAI without copying their obsolete implementation choices.

The canonical programme and parity matrix live in [`docs/product/PLATFORM-REBUILD.md`](docs/product/PLATFORM-REBUILD.md).

The next large slices are:

1. site matching, duplicate proposals and merge/unmerge
2. native Expo capture with a real offline operation log
3. authoritative disposal rules, starting with Estonia
4. moderation/admin, redaction and organization stewardship
5. legacy World Cleanup/Open Data imports
6. aggregate material, brand, recurrence, hotspot and cleanup-effectiveness intelligence

## Architecture

The broader architecture thesis is in [`docs/architecture/YUK.md`](docs/architecture/YUK.md).

Core modern entities:

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
