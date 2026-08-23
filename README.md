# yuk.wtf 💩🤢🤮

**Feed trash to YUK. Learn what it is. Learn where it goes.**

YUK is a fresh trash-monster app built on top of the real historical lineage of the World Cleanup Day waste-mapping software.

Point the camera at something you are about to throw away. YUK eats the photo, identifies the object and materials, gives best-effort disposal guidance, reacts with 💩, 🤢 or 🤮, and remembers what it has eaten on that device.

## The loop

1. Show YUK trash.
2. Feed YUK the photo.
3. YUK analyses the object and reacts.
4. Get a likely bin, destination, explanation and lower-waste alternative.
5. Build a personal material autobiography over time.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set:

```bash
OPENAI_API_KEY=...
OPENAI_VISION_MODEL=gpt-5-mini
```

The API key is only read by the server route.

## What is real in v0.1

- mobile camera / photo picker
- client-side image downscaling
- server-side vision analysis through the OpenAI Responses API
- optional coarse geolocation as analysis context
- 💩 / 🤢 / 🤮 reaction states
- animated trash monster
- best-effort disposal + material explanation
- local device stomach history via `localStorage`
- responsive mobile-first UI
- reduced-motion support

Waste rules are local and change. YUK exposes uncertainty rather than pretending a municipal rule is known. A production version should connect authoritative city and waste-provider datasets while using AI for recognition and explanation.

## Architecture direction

The fresh monster is the new capture and interpretation surface. The broader YUK architecture remains evidence-first: observations, classifications, location, provenance and confidence can later feed a privacy-safe model of physical waste.

See [`docs/architecture/YUK.md`](docs/architecture/YUK.md).

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

## Next

- authoritative local waste-rule adapters
- account sync and cross-device stomach history
- monster evolution based on material mix
- material and brand statistics
- connect personal discard observations to the broader YUK observation model
- public aggregate waste intelligence with privacy controls

## License

Historical code retains its existing GPL-3.0 licensing and notices. New code preserves applicable obligations from inherited GPL-licensed material.
