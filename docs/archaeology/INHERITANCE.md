# Inheritance

This document is the first-pass product inheritance matrix for YUK. It is deliberately about ideas and failure modes, not about preserving 2018 implementation choices.

| Historical concept | YUK decision | Notes |
| --- | --- | --- |
| Trashpoints as mappable physical waste | **Keep, remodel** | Becomes persistent `Site` rather than a one-off report. |
| Timestamped reports/photos | **Keep, formalize** | Becomes `Observation`, linked to a site when confidence permits. |
| Photo evidence | **Keep** | Originals private by default; public derivatives should support automated redaction. |
| Amount labels: handful / bagful / cartload / truckload | **Keep as optional estimate** | Useful human language, but not the only quantity model. |
| Waste composition taxonomy | **Keep, version** | Store taxonomy/model version and confidence so classifications can evolve. |
| Statuses such as regular / urgent / threat / cleaned / outdated | **Reinvent** | Separate hazard, lifecycle and evidence assertions instead of overloading one status. |
| Cleanup events | **Keep** | A cleanup is an intervention linked to sites/observations, not deletion of history. |
| Teams | **Keep selectively** | Useful for organizations and cleanups; do not make team membership necessary for basic reporting. |
| Geographic areas / leaders | **Reinvent** | Model jurisdiction and stewardship without encoding an overly rigid movement hierarchy. |
| Offline capture | **Keep as core requirement** | Local durable operation log, stable client IDs and idempotent sync from day one. |
| Automatic retry of offline reports | **Keep, redesign** | Old duplicate/lost-report failures make sync correctness a first-class domain problem. |
| Web fallback / LITE | **Keep as principle** | Capture and verification should work on ordinary web devices, not require one app distribution channel. |
| Internationalization | **Keep as core requirement** | Global language support is architecture, not post-launch polish. |
| Social login as identity | **Abandon** | Provider IDs must never be the public/domain identity. Support privacy-preserving auth and anonymous contribution where safe. |
| Public creator names | **Abandon by default** | Historical privacy complaints show reporter identity should be minimized and scoped. |
| Exact GPS as permanent public truth | **Reinvent** | Store evidence geometry and uncertainty; public precision can vary for privacy/safety. |
| 100 m rule for editing a trashpoint | **Abandon** | Stale GPS made legitimate updates impossible. Verification policy should use evidence, role, recency and confidence. |
| User must fill a detailed form | **Abandon** | Primary capture should be camera → automatic context → AI interpretation → user confirmation. |
| CouchDB multi-datacenter dataset IDs exposed to frontend | **Abandon implementation** | Preserve source provenance, but infrastructure topology should not leak into capture UX. |
| Multiple reports about the same physical pile | **Keep, elevate** | This is the reason to separate Site from Observation. Deduplication becomes explicit and probabilistic. |
| “Cleaned” removes the problem | **Abandon** | A site can be cleaned, verified clean, reappear or accumulate new waste. History remains. |
| Protected-area warnings | **Keep** | Safety, protected land, access and hazard context should be structured layers. |
| Open data | **Keep** | Public data should be privacy-safe, source-attributed and machine-readable. |
| AI waste recognition | **Keep, expand** | Models are sensor interpreters that produce classifications/assertions with confidence, never unquestionable truth. |
| Brand recognition | **Keep selectively** | Useful for accountability/research when evidence and taxonomy quality are sufficient. |
| Global heatmaps | **Keep** | Derived views over observations/sites, not substitutes for source evidence. |
| Gamification/leaderboards | **Unresolved** | Can motivate contribution but can also reward noisy or unsafe reporting. Evidence quality comes first. |
| Events as the primary reason to open the app | **Abandon** | The fastest valuable action is seeing or recording waste; events are a later action layer. |

## Product principle

The old system mostly asked: **where are the trashpoints?**

YUK asks: **what does the evidence currently tell us about waste in the physical world, and what action changed it?**

That shift is the architectural boundary between historical inheritance and the new product.