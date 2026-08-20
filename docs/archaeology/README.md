# Archaeology

YUK did not start from a clean slate.

The repository descends from the World Cleanup Day mapping platform begun in 2017. In early 2018 the project went through a vendor handoff and a mobile architecture transition from Create React Native App / Expo to a regular React Native application. Open-source and third-party work continued while the commercial rewrite progressed, so for part of 2018 there were multiple partially overlapping code paths rather than one perfectly synchronized source of truth.

By July 2018 the old mobile generation was removed from the main World Cleanup repository and replaced by the newer React Native generation. A Haamer Ventures fork created on May 28, 2018 accidentally preserved the earlier generation.

In 2026 that surviving fork became the starting point for YUK. The later World Cleanup generation was still reachable in the same GitHub fork network, which made it possible to preserve both histories as actual Git ancestry rather than copying files.

## Preserved heads

| Generation | Branch | Commit | Date | Meaning |
| --- | --- | --- | --- | --- |
| Haamer / Expo-open-source | `archive/haamer-expo-2018` | `05c2832` | 2018-05-28 | Surviving pre-replacement mobile generation and contemporaneous platform code |
| WCD / React Native | `archive/wcd-react-native-2018` | `1896cb0` | 2018-08-02 | Later 2018 World Cleanup generation after the mobile replacement |

## Reconciliation

Commit `b91228a` was created in 2026 with both historical heads as parents. Its tree is exactly the August 2018 WCD tree.

This is an **archival reconciliation**, not a historical claim. The two branches were not deliberately maintained as two long-term editions of the product in 2018. The merge commit exists so future Git history can truthfully show that YUK descends from both surviving lines.

## Wider project ecosystem

The repository history is only one part of the story.

Around the same waste-mapping problem, Let’s Do It / World Cleanup work also produced a 2017 Open Data frontend and API, the 2018 WADE AI trash-detection project, and a later TrashAI lineage. Those repositories do not become additional Git parents of YUK, but they are relevant product, data and research ancestors.

See [`ECOSYSTEM.md`](ECOSYSTEM.md) for the wider family tree and the distinction between:

- literal Git ancestry;
- shared project lineage;
- open-data inheritance;
- computer-vision and model inheritance.

The public visual version lives at [`https://yuk.wtf/lineage`](https://yuk.wtf/lineage).

## Rules for historical material

1. Never rewrite the archive branches.
2. Do not force-push them.
3. Do not modernize code on the archive branches.
4. Prefer links to historical commits over copied legacy directories.
5. Treat old infrastructure, credentials, signing material and dependencies as archaeological evidence, not operational configuration.
6. When describing 2018 decisions, distinguish documented facts from later interpretation.
7. Do not imply YUK is the current official World Cleanup Day application or an official Let’s Do It World product without an explicit contemporary relationship.
8. Do not describe related Open Data, WADE or TrashAI repositories as YUK Git ancestors unless Git history actually demonstrates that relationship.

## Why keep this history?

The useful inheritance is not the old dependency graph. It is the accumulated product knowledge: offline field capture, global localization, trashpoint lifecycle, cleanup coordination, teams, areas, events, open data, privacy failures, location failures, synchronization failures and early machine-assisted waste recognition.

YUK can throw away obsolete implementation while retaining the evidence of what was tried.
