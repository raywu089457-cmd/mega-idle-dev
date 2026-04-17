---
name: Combat System Eval
type: capability
layer: unit
file: tests/unit/combat/
---

# [CAPABILITY EVAL: combat-system]

## Task
Verify the turn-based combat engine produces correct, deterministic results given seeded inputs.

## Success Criteria
- [ ] `calculateCrit` returns `isCrit=false` and original damage at 0% roll
- [ ] `calculateCrit` returns `isCrit=true` and 1.5× damage at 9% roll (< 10% threshold)
- [ ] `getMonsterTarget` prefers melee over mid over long range heroes
- [ ] `getMonsterTarget` selects lowest HP hero among same-range candidates
- [ ] `CombatResolver.resolveCombat` returns `victory=true` when heroes > monster
- [ ] `CombatResolver.resolveCombat` returns `victory=false` when no heroes provided
- [ ] Elite enemy has 1.5× HP and 1.3× ATK vs base monster
- [ ] Boss enemy has 2× HP and 1.5× ATK vs base monster
- [ ] Defeated heroes are revived at 50% HP after combat
- [ ] Victory yields `goldReward`, `xpGained` from subZone definition
- [ ] Combat terminates within 50 rounds regardless of outcome

## Expected Output
All assertions pass, no flaky results (logic is deterministic when Math.random is mocked).

## Grader
Code-based (Vitest assertions with vi.spyOn Math.random).

## pass@k Target
pass^3 = 1.00 (pure logic — must never flake)
