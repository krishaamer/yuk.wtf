# Historical security note

The archive branches contain infrastructure and application material from 2017–2018. They are preserved for provenance, not because their operational assumptions are safe today.

Before any historical component is reused, treat every credential-like value, signing reference, provisioning reference, token, `.env` file, registry configuration and infrastructure endpoint in Git history as potentially compromised or obsolete.

## Rules

- Do not deploy from the archive branches.
- Do not reuse historical secrets or signing material.
- Do not assume placeholder-looking values were always placeholders.
- Perform a full-history secret scan before making the modern repository operational.
- Rotate/revoke any credential that could plausibly still resolve to a live service.
- Keep new secrets outside Git history and use a modern secret manager/environment mechanism.
- Do not publish historical user datasets, exact coordinates or provider identifiers without a separate privacy review.
- Treat old dependencies as vulnerable until proven otherwise; do not restore the 2018 dependency graph merely to make it build.

## Historical preservation vs. secret removal

There is a tension between preserving an authentic software artifact and removing exposed secrets from Git history. The current archive branches preserve the inherited public history as received.

If a scan identifies a credential that is still live or otherwise materially dangerous, security takes precedence: revoke it immediately, then decide whether history rewriting is warranted. If history must be rewritten, record what changed and why so the archaeological record remains understandable.

## Modern baseline

The modern YUK implementation should begin from current security defaults rather than incrementally upgrading the historical runtime:

- least-privilege service credentials
- separate development/staging/production environments
- private originals for uploaded media
- automated face/license-plate/document redaction for public derivatives where appropriate
- explicit retention and deletion policy
- privacy-safe public identifiers
- source and model provenance for machine-generated assertions
- auditable administrative changes
- idempotent APIs and synchronization operations

The archive is evidence. It is not a deployment recipe.