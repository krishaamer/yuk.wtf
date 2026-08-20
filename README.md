# YUK

**See waste. Map it. Fix it.**

YUK is a 2026 continuation of the waste-mapping software lineage developed for World Cleanup Day. Its public home is **https://yuk.wtf**.

This repository intentionally preserves the project's real Git genealogy rather than copying the old code into a clean repository.

## Lineage

Two surviving 2018 development generations are preserved as immutable archive branches:

- [`archive/haamer-expo-2018`](../../tree/archive/haamer-expo-2018) — the May 28, 2018 Haamer/Open Source snapshot, ending at `05c2832`.
- [`archive/wcd-react-native-2018`](../../tree/archive/wcd-react-native-2018) — the later World Cleanup / React Native generation, ending at `1896cb0` on August 2, 2018.

The histories are explicitly reunited by commit `b91228a` (`history: reunite the 2018 World Cleanup lineages`). The commit was created in 2026 and deliberately records both historical heads as parents. It does **not** claim that this merge happened in 2018.

`main` begins at that reconciliation point. New YUK development will happen from there.

## What YUK inherits

YUK keeps the original ambition — make environmental waste observable and actionable — while changing the core model from a collection of reports into a continuously updated model of physical waste in the world.

The central distinction is:

- **Site** — a persistent real-world place or waste entity.
- **Observation** — timestamped evidence about that site from a person, organization, import, camera or model.

A cleanup is not deletion. It is an event that changes the believed state of a site. A site can be verified clean, reappear, merge with another site, or accumulate new observations over time.

See [`docs/architecture/YUK.md`](docs/architecture/YUK.md).

## Archaeology

The repository is also a historical artifact. Start with:

- [`docs/archaeology/README.md`](docs/archaeology/README.md)
- [`docs/archaeology/TIMELINE.md`](docs/archaeology/TIMELINE.md)
- [`docs/archaeology/INHERITANCE.md`](docs/archaeology/INHERITANCE.md)
- [`docs/archaeology/SECURITY.md`](docs/archaeology/SECURITY.md)

The historical runtime code is preserved for provenance, not as a dependency recommendation. Much of it predates modern mobile, security and infrastructure practice.

## Status

YUK is at the archaeology and architecture stage. The next milestone is **`YUK: begin again`**: remove obsolete runtime code from `main` while preserving all historical material through Git history and the archive branches, then introduce the modern implementation.

## License

Historical code retains its existing GPL-3.0 licensing and notices. New code must preserve applicable obligations from inherited GPL-licensed material.