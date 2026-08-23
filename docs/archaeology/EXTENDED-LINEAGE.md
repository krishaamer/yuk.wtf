# Extended lineage

YUK has two different kinds of ancestry, and they should not be confused.

The **Git lineage** is literal repository ancestry: the two surviving 2018 World Cleanup mobile/platform generations preserved in this repository and explicitly reunited in 2026.

The **extended product/research lineage** is a wider family of projects that grew around the same waste-mapping, open-data and machine-recognition problem space. These repositories are relevant inheritance for YUK, but they are not being claimed as Git parents of `yuk.wtf`.

## Map

```text
World Cleanup mapping platform (2017–2018)
├─ mobile/platform lineage
│  ├─ Haamer / Expo-open-source snapshot
│  └─ later WCD / React Native snapshot
│      └─ reunited as literal YUK Git ancestry (2026)
│
├─ open-data lineage
│  ├─ zerowasteestonia/opendata-api
│  └─ zerowasteestonia/opendata-web
│
└─ machine-recognition lineage
   └─ WADE AI / zerowasteestonia/wade-ai
      └─ TrashAI
         └─ zerowasteestonia/trash-ai snapshot/fork

YUK (2026)
└─ intentionally recombines the useful ideas:
   capture + location + open data + waste recognition + provenance
```

## Open-data branch

### `zerowasteestonia/opendata-api`

The Let's Do It World Open Data API is a Node/PostgreSQL service for waste-report data. Its schema includes reports, report sources, users, resources, country population/resource data and location cache data, and it includes a TrashOut import path.

Repository: <https://github.com/zerowasteestonia/opendata-api>

What YUK should inherit conceptually:

- waste data as an interoperable dataset rather than an app-only artifact
- explicit report/source modeling
- import pipelines from external systems
- separation between the public data layer and capture clients

What YUK should not inherit automatically:

- deployment assumptions
- authentication model
- database schema as-is
- old infrastructure or secrets

### `zerowasteestonia/opendata-web`

The Let's Do It World Open Data web app visualizes the data through maps and timelines and depends on the Open Data API.

Repository: <https://github.com/zerowasteestonia/opendata-web>

What YUK should inherit conceptually:

- waste data needs explorable public views, not only capture UX
- time is a first-class dimension
- maps and aggregate views are derived interfaces over the underlying evidence

## Machine-recognition branch

### WADE AI / `zerowasteestonia/wade-ai`

WADE is explicitly described in its repository as a Let's Do It World project. The repository also records that WADE was later superseded by TrashAI, which was inspired by WADE.

Repository: <https://github.com/zerowasteestonia/wade-ai>

This is an important bridge in YUK's lineage because it moves the problem from **people manually describing waste** toward **machines interpreting photographic evidence**.

### TrashAI / `zerowasteestonia/trash-ai`

TrashAI develops a web workflow where users upload litter photographs and computer vision labels and categorizes the litter. The project describes its value primarily in terms of helping researchers label and categorize litter images.

Repository: <https://github.com/zerowasteestonia/trash-ai>

What YUK should inherit conceptually:

- image-first waste recognition
- structured classification from photographs
- research usefulness of labeled waste imagery
- model output as evidence that can improve over time

YUK extends this direction by making recognition part of a broader observation model. A classification is not the waste object itself and not unquestionable truth. It is a versioned interpretation of evidence with source, confidence and time.

## Why this matters

Seen separately, these projects look like different products: a cleanup map, an open-data portal, an API, a computer-vision experiment and a trash classifier.

Seen as one lineage, the direction is much clearer:

**capture waste → structure the evidence → connect it to place and time → expose it as data → use machines to reduce the cost of interpretation → keep provenance so the model can improve without erasing history.**

That is the larger product inheritance YUK should continue.

## Historical boundary

This document records conceptual and project lineage. It does not assert that these repositories are all direct forks of one another, that they shared a single continuous team, or that YUK owns or officially represents the current versions of those projects.
