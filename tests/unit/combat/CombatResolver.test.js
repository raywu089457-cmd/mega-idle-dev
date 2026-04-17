import { describe, it, expect, vi, afterEach } from 'vitest';
import { CombatResolver, Enemy } from '../../../lib/game/combat/CombatResolver.js';

afterEach(() => vi.restoreAllMocks());

const makeHero = (overrides = {}) => ({
  name: 'TestHero',
  atk: 20,
  defense: 5,
  maxHp: 100,
  currentHp: 100,
  attackRange: 'melee',
  ...overrides,
});

const makeSubZone = (overrides = {}) => ({
  monsters: [{ name: 'Slime', hp: 30, atk: 5, defense: 0, xp: 10 }],
  is_elite: false,
  is_boss: false,
  xp_multiplier: 1,
  gold_reward: 50,
  stone_drop: [1, 3],
  difficulty: 1,
  ...overrides,
});

describe('Enemy', () => {
  it('constructs with base stats', () => {
    const e = new Enemy({ name: 'Goblin', hp: 40, atk: 8, defense: 2, xp: 5 });
    expect(e.maxHp).toBe(40);
    expect(e.atk).toBe(8);
    expect(e.isElite).toBeFalsy(); // undefined when monsterData has no is_elite field
    expect(e.isBoss).toBeFalsy();
  });

  it('elite multiplies HP by 1.5 and ATK by 1.3', () => {
    const e = new Enemy({ name: 'Goblin', hp: 40, atk: 10 }, true);
    expect(e.maxHp).toBe(Math.floor(40 * 1.5));
    expect(e.atk).toBe(Math.floor(10 * 1.3));
  });

  it('boss multiplies HP by 2 and ATK by 1.5', () => {
    const e = new Enemy({ name: 'Dragon', hp: 100, atk: 20 }, false, true);
    expect(e.maxHp).toBe(200);
    expect(e.atk).toBe(30);
  });

  it('isAlive returns false when currentHp <= 0', () => {
    const e = new Enemy({ name: 'Slime', hp: 10, atk: 1 });
    e.currentHp = 0;
    expect(e.isAlive()).toBe(false);
  });
});

describe('CombatResolver.resolveCombat', () => {
  const resolver = new CombatResolver();

  it('returns victory=false when no heroes', () => {
    const result = resolver.resolveCombat([], makeSubZone());
    expect(result.victory).toBe(false);
    expect(result.logMessages).toContain('沒有可戰鬥的英雄');
  });

  it('returns victory=false when no monsters', () => {
    const result = resolver.resolveCombat([makeHero()], makeSubZone({ monsters: [] }));
    expect(result.victory).toBe(false);
    expect(result.logMessages).toContain('沒有可戰鬥的怪物');
  });

  it('powerful hero defeats weak monster → victory=true', () => {
    // Hero ATK=100, monster HP=10 → dead in round 1 (no crit needed)
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // no crit, no drops
    const hero = makeHero({ atk: 100, defense: 50 });
    const sz = makeSubZone({ monsters: [{ name: 'Rat', hp: 10, atk: 1, defense: 0, xp: 5 }] });
    const result = resolver.resolveCombat([hero], sz);
    expect(result.victory).toBe(true);
    expect(result.goldReward).toBe(50);
    expect(result.xpGained).toBe(5);
  });

  it('weak hero loses to strong monster → victory=false', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const hero = makeHero({ atk: 1, defense: 0, maxHp: 5, currentHp: 5 });
    const sz = makeSubZone({ monsters: [{ name: 'Dragon', hp: 9999, atk: 9999, defense: 0, xp: 100 }] });
    const result = resolver.resolveCombat([hero], sz);
    expect(result.victory).toBe(false);
  });

  it('dead heroes revived at 50% HP after combat', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const hero = makeHero({ atk: 1, defense: 0, maxHp: 100, currentHp: 100 });
    const sz = makeSubZone({ monsters: [{ name: 'BossKiller', hp: 9999, atk: 200, defense: 0, xp: 100 }] });
    resolver.resolveCombat([hero], sz);
    // Hero was killed and revived
    expect(hero.currentHp).toBe(50); // Math.floor(100/2)
  });

  it('combat resolves within maxRounds (50)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    // Both sides can't kill each other (very high def, very low atk)
    const hero = makeHero({ atk: 1, defense: 999, maxHp: 9999, currentHp: 9999 });
    const sz = makeSubZone({ monsters: [{ name: 'Shield', hp: 9999, atk: 1, defense: 999, xp: 1 }] });
    const result = resolver.resolveCombat([hero], sz);
    const roundMessages = result.logMessages.filter(m => m.startsWith('第'));
    expect(roundMessages.length).toBeLessThanOrEqual(50);
  });
});
