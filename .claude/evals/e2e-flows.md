---
name: E2E Critical Flows Eval
type: capability
layer: e2e
file: tests/e2e/
---

# [CAPABILITY EVAL: e2e-flows]

## Task
Verify the critical user journeys complete successfully in a real browser.

## Flows

### F1: Landing Page
- [ ] `/` renders login page with Discord button
- [ ] Page title contains game name

### F2: Authentication
- [ ] Discord OAuth login succeeds with test credentials
- [ ] After login, redirect to `/game`
- [ ] `/game` page loads without JS errors

### F3: Game Shell
- [ ] Navigation tabs render (英雄, 派遣, 隊伍, 建築, ...)
- [ ] SSE `/api/events` connection established (no network error in console)
- [ ] Gold / resource values visible in UI

### F4: Hero Recruit
- [ ] HeroesPanel loads and shows wandering heroes
- [ ] Recruit button triggers recruit and hero appears in territory list

### F5: Dispatch
- [ ] DispatchPanel loads zone list
- [ ] Dispatching a hero changes status to "探索中"

### F6: Building Upgrade
- [ ] BuildingsPanel shows current building levels
- [ ] Upgrade button triggers build action (or shows cost error)

## Grader
Code-based (Playwright browser assertions).
Human review required for OAuth flakiness (HUMAN REVIEW trigger).

## pass@k Target
F1, F3: pass^3 = 1.00 (static pages)
F2: pass@3 ≥ 0.85 (Discord OAuth fragile)
F4, F5, F6: pass@3 ≥ 0.90
