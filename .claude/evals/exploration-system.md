---
name: Exploration / Dispatch System Eval
type: capability
layer: unit, api, e2e
file: tests/unit/, tests/api/dispatch.spec.ts, tests/e2e/game-journey.spec.ts
---

# [CAPABILITY EVAL: exploration-system]

## Task
Verify dispatch, exploration, and recall hero flows work end-to-end.

## Success Criteria

### Unit
- [ ] `dispatchHero` sets `isExploring=true`, `currentZone`, `currentSubZone`
- [ ] `dispatchHero` rejects invalid zone (< 1 or > 10)
- [ ] `dispatchHero` rejects invalid difficulty (< 1 or > 3)
- [ ] `dispatchHero` rejects already-exploring heroes
- [ ] `dispatchHero` rejects wandering heroes (territory only)
- [ ] `recallHero` clears `isExploring`, `currentZone`, `currentSubZone`
- [ ] `recallHero` (no heroId) recalls all exploring heroes

### API
- [ ] `POST /api/dispatch` with zone/difficulty dispatches hero successfully
- [ ] `POST /api/dispatch` with `action=recall` recalls specified hero
- [ ] `POST /api/dispatch` with invalid zone returns 400

### E2E
- [ ] Hero can be dispatched from HeroesPanel or DispatchPanel
- [ ] Dispatched hero appears as "探索中" in UI
- [ ] Recall button returns hero to roster

## Grader
Code-based (unit: Vitest, api/e2e: Playwright).

## pass@k Target
Unit: pass^3 = 1.00
API: pass@3 ≥ 0.90
E2E: pass@3 ≥ 0.85 (OAuth + SSE dependencies)
