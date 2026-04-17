# Mega Idle Dev — Eval Harness

## Overview

Three-layer eval pyramid:

| Layer | Runner | Speed | Coverage |
|-------|--------|-------|----------|
| Unit | Vitest | ~2s | Pure game logic |
| API | Playwright (request) | ~10s | HTTP contracts |
| E2E | Playwright (browser) | ~60s | Critical user flows |

## Run Everything

```bash
# Full harness (unit → api → e2e)
bash scripts/run-evals.sh

# Individual layers
npm run test:unit
npm run test:api
npm run test:e2e
```

## Eval Definitions

| System | Definition File | Layer(s) |
|--------|----------------|----------|
| Combat | [combat-system.md](combat-system.md) | unit |
| Heroes | [hero-system.md](hero-system.md) | unit, api |
| Exploration / Dispatch | [exploration-system.md](exploration-system.md) | unit, api, e2e |
| API Layer | [api-layer.md](api-layer.md) | api |
| E2E Flows | [e2e-flows.md](e2e-flows.md) | e2e |

## Metrics

- **pass@1**: Succeeds on first run — target ≥ 90% per layer
- **pass@3**: Succeeds at least once in 3 runs — target ≥ 95%
- **pass^3**: Succeeds every run (stability) — required for E2E regression suite

## Baseline

Saved in `baseline.json`. Update with:
```bash
node scripts/eval-report.js --save-baseline
```
