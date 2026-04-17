import { describe, it, expect } from 'vitest';
import { getMonsterTarget, getAttackRangeForClass, ATTACK_RANGE } from '../../../lib/game/combat/targeting.js';

const makeHero = (attackRange, currentHp, name = 'Hero') => ({
  name,
  attackRange,
  currentHp,
});

describe('getMonsterTarget', () => {
  it('prefers melee hero over mid and long range', () => {
    const heroes = [
      makeHero('long', 100, 'Archer'),
      makeHero('mid', 100, 'Thief'),
      makeHero('melee', 100, 'Warrior'),
    ];
    const target = getMonsterTarget(heroes);
    expect(target.name).toBe('Warrior');
  });

  it('prefers mid over long when no melee alive', () => {
    const heroes = [
      makeHero('long', 100, 'Archer'),
      makeHero('mid', 100, 'Thief'),
      makeHero('melee', 0, 'DeadWarrior'),
    ];
    const target = getMonsterTarget(heroes);
    expect(target.name).toBe('Thief');
  });

  it('falls back to long range when only long alive', () => {
    const heroes = [
      makeHero('long', 50, 'Archer'),
      makeHero('melee', 0, 'Dead'),
    ];
    const target = getMonsterTarget(heroes);
    expect(target.name).toBe('Archer');
  });

  it('targets lowest HP hero among same-range candidates', () => {
    const heroes = [
      makeHero('melee', 80, 'WarriorA'),
      makeHero('melee', 30, 'WarriorB'),
      makeHero('melee', 60, 'WarriorC'),
    ];
    const target = getMonsterTarget(heroes);
    expect(target.name).toBe('WarriorB');
  });

  it('returns null when all heroes dead', () => {
    const heroes = [
      makeHero('melee', 0, 'Dead1'),
      makeHero('long', 0, 'Dead2'),
    ];
    const target = getMonsterTarget(heroes);
    expect(target).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(getMonsterTarget([])).toBeNull();
  });
});

describe('getAttackRangeForClass', () => {
  it.each([
    ['swordsman', ATTACK_RANGE.MELEE],
    ['warrior', ATTACK_RANGE.MELEE],
    ['paladin', ATTACK_RANGE.MELEE],
    ['thief', ATTACK_RANGE.MID],
    ['rogue', ATTACK_RANGE.MID],
    ['archer', ATTACK_RANGE.LONG],
    ['ranger', ATTACK_RANGE.LONG],
    ['mage', ATTACK_RANGE.LONG],
    ['priest', ATTACK_RANGE.LONG],
    ['unknown', ATTACK_RANGE.MELEE],
  ])('%s → %s', (cls, expected) => {
    expect(getAttackRangeForClass(cls)).toBe(expected);
  });
});
