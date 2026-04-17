---
name: Hero System Eval
type: capability
layer: unit, api
file: tests/unit/heroes/, tests/api/heroes.spec.ts
---

# [CAPABILITY EVAL: hero-system]

## Task
Verify hero stat calculation, leveling, and management operations.

## Success Criteria

### Unit (Pure Logic)
- [ ] `calculateHeroStats` scales ATK/DEF/HP correctly by rarity points and profession ratios
- [ ] `getXpForLevel(1)` returns 100
- [ ] `getXpForLevel(2)` returns 150 (100 * 1.5^1)
- [ ] `getStatIncreaseForLevel` returns positive values for any level 1-100
- [ ] `HeroManagementService.trainHero` deducts gold and increases level by 1
- [ ] `HeroManagementService.trainHero` blocks at MAX_HERO_LEVEL (100)
- [ ] `HeroManagementService.trainHero` fails with insufficient gold
- [ ] `HeroManagementService.recruitFromTavern` converts wandering → territory hero
- [ ] `HeroManagementService.recruitFromTavern` fails when territory slots full
- [ ] `HeroManagementService.feedHero` increases hunger by 30, consumes 1 ration
- [ ] `HeroManagementService.giveWater` increases thirst by 30, consumes 1 drinking_water
- [ ] `HeroManagementService.usePotion` heals 50% maxHp, consumes 1 potion
- [ ] `HeroManagementService.addXp` triggers level-up when XP threshold met
- [ ] `getHeroInfo` marks `isWeakened=true` when hunger OR thirst < 30
- [ ] `getHeroInfo` applies 50% ATK/DEF penalty when weakened

### API (HTTP contracts tested with Playwright APIRequestContext)
- [ ] `GET /api/heroes` returns 200 with hero list (authenticated)
- [ ] `GET /api/heroes` returns 401 (unauthenticated)
- [ ] `POST /api/heroes` with valid recruit action succeeds or returns structured error
- [ ] `POST /api/heroes/train` with valid heroId returns updated hero stats

## Grader
Code-based (unit: Vitest, api: Playwright expect).

## pass@k Target
Unit: pass^3 = 1.00
API: pass@3 ≥ 0.90 (network-dependent)
