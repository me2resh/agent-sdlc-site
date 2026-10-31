# Architecture evolution

Running log of material architecture choices in this repository. Newest first.

## 2026-10-31: ORBIT schema pin, drift report, and phone layout

- **Ticket:** GH-45 / ORBIT pages behind orbit-spec; phone overflow.
- **Change:** Vendor the four ORBIT JSON schemas at a pinned `me2resh/orbit-spec` commit (`scripts/orbit-spec-source.mjs`), with an offline hash check and a weekly drift workflow modelled on the AgDR sync (option A in `2026-09-25-agdr-spec-sync.md`). Publish Plan `revisionNote`. Document the real v0.1.0 install path on the ORBIT quick start. Tighten phone layout through shared tokens (`--gutter`, `overflow-x: clip`, box-sizing) and a one-row scrollable primary nav at 430 px and below.
- **Reasoning:** The site was serving Plan without `revisionNote` while upstream main already had it. Builds must stay offline, so the AgDR pin pattern is reused rather than fetching at build time. Phone sideways scroll and a three-line ORBIT nav came from fixed gutters and a wrapping nav of nine nowrap links; the design-system tokens own the viewport contract, and the shared layout owns the nav behaviour.
- **Out of scope here:** Issue #32 (missing object returns 403). The shared `apps/site/public/404.html` already ships with each site build. Mapping origin 403 and 404 to a 404 response, and the trailing-slash 301, remain an infrastructure change (`docs/design/2026-09-27-edge-redirects.md`).
