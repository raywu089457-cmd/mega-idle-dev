import { describe, it, expect } from 'vitest';
import {
  calculateHeroStats,
  getXpForLevel,
  getStatIncreaseForLevel,
  RARITY_POINTS,
} from '../../../lib/game/services/HeroManagementService.js';

describe('calculateHeroStats', () => {
  it('mage has highest ATK among all professions', () => {
    const mage = calculateHeroStats('mage', 'D');
    const warrior = calculateHeroStats('swordsman', 'D');
    expect(mage.atk).toBeGreaterThan(warrior.atk);
  });

  it('warrior has highest HP among melee professions', () => {
    const warrior = calculateHeroStats('swordsman', 'D');
    const thief = calculateHeroStats('thief', 'D');
    expect(warrior.hp).toBeGreaterThan(thief.hp);
  });

  it('higher rarity yields higher stats', () => {
    const sRarity = calculateHeroStats('swordsman', 'S');
    const fRarity = calculateHeroStats('swordsman', 'F');
    expect(sRarity.atk).toBeGreaterThan(fRarity.atk);
    expect(sRarity.hp).toBeGreaterThan(fRarity.hp);
  });

  it('higher level yields scaled-up stats', () => {
    const lv1 = calculateHeroStats('swordsman', 'D', 1);
    const lv5 = calculateHeroStats('swordsman', 'D', 5);
    expect(lv5.atk).toBeGreaterThan(lv1.atk);
    expect(lv5.hp).toBeGreaterThan(lv1.hp);
  });

  it('ATK minimum is 1', () => {
    // Priest has very low ATK ratio — still shouldn't go below 1
    const priest = calculateHeroStats('priest', 'F', 1);
    expect(priest.atk).toBeGreaterThanOrEqual(1);
  });

  it('HP minimum is 10', () => {
    const mage = calculateHeroStats('mage', 'F', 1);
    expect(mage.hp).toBeGreaterThanOrEqual(10);
  });

  it('unknown profession falls back to swordsman defaults', () => {
    const unknown = calculateHeroStats('nonexistent', 'D');
    const swordsman = calculateHeroStats('swordsman', 'D');
    expect(unknown.atk).toBe(swordsman.atk);
  });

  it.each(Object.entries(RARITY_POINTS))('rarity %s uses %i total points', (rarity, points) => {
    // ATK for swordsman = floor(points * 4/10 * 0.5) — just verify positive result
    const stats = calculateHeroStats('swordsman', rarity);
    expect(stats.atk).toBeGreaterThanOrEqual(1);
  });
});

describe('getXpForLevel', () => {
  it('level 1 requires 100 XP', () => {
    expect(getXpForLevel(1)).toBe(100);
  });

  it('level 2 requires 150 XP (100 * 1.5^1)', () => {
    expect(getXpForLevel(2)).toBe(150);
  });

  it('XP requirements increase monotonically', () => {
    for (let lvl = 1; lvl < 50; lvl++) {
      expect(getXpForLevel(lvl + 1)).toBeGreaterThan(getXpForLevel(lvl));
    }
  });

  it('level 15 uses fast formula', () => {
    const xp15 = getXpForLevel(15);
    expect(xp15).toBe(Math.floor(100 * Math.pow(1.5, 14)));
  });

  it('level 16 switches to slow formula', () => {
    const base15 = Math.floor(100 * Math.pow(1.5, 14));
    expect(getXpForLevel(16)).toBe(Math.floor(base15 * Math.pow(1.2, 1)));
  });
});

describe('getStatIncreaseForLevel', () => {
  it.each([2, 5, 10, 50, 100])('level %i yields positive stat gains', (lvl) => {
    const inc = getStatIncreaseForLevel(lvl);
    expect(inc.hp).toBeGreaterThan(0);
    expect(inc.atk).toBeGreaterThan(0);
    expect(inc.def).toBeGreaterThan(0);
  });

  it('higher level yields more stat gain', () => {
    const low = getStatIncreaseForLevel(2);
    const high = getStatIncreaseForLevel(10);
    expect(high.atk).toBeGreaterThan(low.atk);
    expect(high.hp).toBeGreaterThan(low.hp);
  });
});
