# Timeline

## 2017 - World Cleanup mapping platform

The World Cleanup Day repository begins as a mobile and web platform for mapping trash ahead of the September 2018 global cleanup. The system grows around trashpoints, accounts, images, geographic clustering, a CouchDB-backed service architecture and mobile/web clients.

The original mobile implementation uses Create React Native App / Expo to move quickly.

## October 23-24, 2017 - Let’s Do It World Open Data

Two related repositories establish a separate open-data track around the same waste problem:

- [`zerowasteestonia/opendata-web`](https://github.com/zerowasteestonia/opendata-web), created 2017-10-23, provides the Let’s Do It World Open Data map and timeline frontend.
- [`zerowasteestonia/opendata-api`](https://github.com/zerowasteestonia/opendata-api), created 2017-10-24, provides the API, PostgreSQL-backed report model, data sources and import machinery.

These are not Git ancestors of YUK. They are part of the wider product and data lineage and demonstrate that public, queryable waste data was already a distinct concern alongside field capture.

## January-March 2018 - vendor handoff

The project transitions away from its original development/operations arrangement. A substantial handover is required across Azure infrastructure, Docker Swarm, Jenkins, CouchDB, Sentry, signing keys, deployment procedures and public/private repository references.

At the same time, the public GitHub project continues receiving work from volunteers and third-party contributors.

## Spring 2018 - Expo and React Native diverge

The incoming development team begins converting the mobile application from the Expo/CRNA environment to regular React Native. This is not a transparent in-place upgrade: previously implemented features do not all survive the transition cleanly, while public and third-party changes continue against the older code.

The result is a temporary split between partially overlapping working trees.

## May 28, 2018 - Haamer fork freezes one branch

`Haamer-Ventures/World-Cleanup-Day` is forked and its `master` ends at:

`05c2832fbf2d198f04f0e41d555ea53243cc0b6d` - `Valid JSON (RFC 4627)`

This snapshot preserves the earlier Expo/open-source generation, including work that would later disappear when the mobile tree was replaced.

## July 2018 - old mobile generation replaced

The main World Cleanup line explicitly removes the old mobile version and introduces the newer regular React Native application. Development continues on that generation through the final active 2018 period.

## August 2, 2018 - later WCD head

The later 2018 line ends at:

`1896cb041df2941ca59cc964bb9a9feb5b666e6a` - `Fix location issue (#355)`

This represents the later World Cleanup / React Native generation used as the final historical baseline for YUK.

## November 20, 2018 - WADE AI

[`zerowasteestonia/wade-ai`](https://github.com/zerowasteestonia/wade-ai) is created. The repository describes the work as an AI algorithm for detecting trash in geolocated images, and its README identifies WADE as a Let’s Do It World project.

WADE is conceptually important to YUK because it moves the waste problem from manual reporting toward machine interpretation of photographic evidence.

It is a project and research ancestor, not a Git ancestor of the YUK repository.

## 2021 - TrashAI continues the computer-vision line

The later [`opensacorg/trash-ai`](https://github.com/opensacorg/trash-ai) project is created as a web-based litter image classification system for research.

The WADE README says WADE was superseded by TrashAI and that TrashAI was initially inspired by WADE. This makes the WADE to TrashAI relationship part of the wider computer-vision lineage even though it is not part of YUK's commit graph.

## September 28, 2022 - Zero Waste Estonia TrashAI fork

[`zerowasteestonia/trash-ai`](https://github.com/zerowasteestonia/trash-ai) is created as an actual GitHub fork of the upstream TrashAI repository.

This fork relationship is real Git history within the TrashAI family, but that history is separate from the YUK repository. For YUK it represents accumulated tooling, classification and research experience around computer-vision-assisted litter analysis.

## 2026 - YUK

The domain `yuk.wtf` is registered and the Haamer fork is forked again to `krishaamer/yuk.wtf` so active development can continue without modifying the historical Haamer Ventures repository.

Two archive branches are created:

- `archive/haamer-expo-2018` → `05c2832`
- `archive/wcd-react-native-2018` → `1896cb0`

Commit `b91228a5e73f4066fc2836ac51b112ac8eaaba2e` (`history: reunite the 2018 World Cleanup lineages`) is created with both historical heads as parents and the August 2018 tree as its content.

`main` starts there.

The implementation then restarts around a camera-first trash creature: photograph an object, let AI interpret the material and likely disposal path, expose uncertainty, and preserve the observation for later use.

The wider architecture recombines lessons from several strands:

- mobile waste capture and field operation from the World Cleanup mapping lineage;
- open, queryable waste data from the 2017 Open Data projects;
- image interpretation from WADE and the later TrashAI lineage;
- persistent observations, provenance and confidence as the basis for a future model of physical waste.

See [`ECOSYSTEM.md`](ECOSYSTEM.md) for the wider family tree and the exact distinction between Git ancestry and project lineage.
