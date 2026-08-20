# Timeline

## 2017 — World Cleanup mapping platform

The World Cleanup Day repository begins as a mobile and web platform for mapping trash ahead of the September 2018 global cleanup. The system grows around trashpoints, accounts, images, geographic clustering, a CouchDB-backed service architecture and mobile/web clients.

The original mobile implementation uses Create React Native App / Expo to move quickly.

## January–March 2018 — vendor handoff

The project transitions away from its original development/operations arrangement. A substantial handover is required across Azure infrastructure, Docker Swarm, Jenkins, CouchDB, Sentry, signing keys, deployment procedures and public/private repository references.

At the same time, the public GitHub project continues receiving work from volunteers and third-party contributors.

## Spring 2018 — Expo and React Native diverge

The incoming development team begins converting the mobile application from the Expo/CRNA environment to regular React Native. This is not a transparent in-place upgrade: previously implemented features do not all survive the transition cleanly, while public and third-party changes continue against the older code.

The result is a temporary split between partially overlapping working trees.

## May 28, 2018 — Haamer fork freezes one branch

`Haamer-Ventures/World-Cleanup-Day` is forked and its `master` ends at:

`05c2832fbf2d198f04f0e41d555ea53243cc0b6d` — `Valid JSON (RFC 4627)`

This snapshot preserves the earlier Expo/open-source generation, including work that would later disappear when the mobile tree was replaced.

## July 2018 — old mobile generation replaced

The main World Cleanup line explicitly removes the old mobile version and introduces the newer regular React Native application. Development continues on that generation through the final active 2018 period.

## August 2, 2018 — later WCD head

The later 2018 line ends at:

`1896cb041df2941ca59cc964bb9a9feb5b666e6a` — `Fix location issue (#355)`

This represents the later World Cleanup / React Native generation used as the final historical baseline for YUK.

## 2019 — waste-detection work expands

The wider project lineage continues into automated waste recognition experiments, including the WADE / Waste Detector work. That research is conceptually relevant to YUK's future observation pipeline, but it is not represented as a claim that the 2018 mobile repository itself already contained the modern YUK architecture.

## 2026 — YUK

The domain `yuk.wtf` is registered and the Haamer fork is forked again to `krishaamer/yuk.wtf` so active development can continue without modifying the historical Haamer Ventures repository.

Two archive branches are created:

- `archive/haamer-expo-2018` → `05c2832`
- `archive/wcd-react-native-2018` → `1896cb0`

Commit `b91228a5e73f4066fc2836ac51b112ac8eaaba2e` (`history: reunite the 2018 World Cleanup lineages`) is created with both historical heads as parents and the August 2018 tree as its content.

`main` starts there.

The next phase is not to keep patching the 2018 application. It is to retain the product lineage while rebuilding the implementation around a persistent world model of waste observations.