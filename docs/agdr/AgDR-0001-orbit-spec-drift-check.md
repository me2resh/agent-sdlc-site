---
id: AgDR-0001
timestamp: 2026-10-31T00:00:00Z
agent: claude
model: claude-opus-5-5
trigger: user-prompt
status: executed
---

# ORBIT spec drift check

> In the context of the ORBIT site falling behind the spec repository, facing silent drift, I decided to add a weekly drift workflow like the AgDR one to achieve early detection, accepting one more scheduled workflow.

## Context

- The ORBIT pages lagged the spec repository by 12 commits.
- The AgDR pages already have a weekly drift check that runs green.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Weekly workflow like AgDR (chosen) | Same pattern, low cost | One more workflow |
| Check on each PR only | No schedule | Misses changes in the spec repository |
| Manual review | No work now | The drift comes back |

## Decision

Chosen: **a weekly workflow**, because it reuses a pattern that already works and catches spec changes made in the other repository.

## Consequences

- A spec change shows up within a week.
- The workflow reports drift and changes no page.

## Artifacts

- Issue #45
- `.github/workflows/orbit-spec-drift.yml`
