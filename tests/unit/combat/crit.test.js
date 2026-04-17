import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateCrit, CRIT_CHANCE, CRIT_MULTIPLIER } from '../../../lib/game/combat/crit.js';

afterEach(() => vi.restoreAllMocks());

describe('calculateCrit', () => {
  it('returns no crit when roll is above CRIT_CHANCE', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = calculateCrit(100);
    expect(result.isCrit).toBe(false);
    expect(result.damage).toBe(100);
  });

  it('returns crit when roll is below CRIT_CHANCE', () => {
    vi.spyOn(Math, 'random').mockReturnValue(CRIT_CHANCE - 0.01);
    const result = calculateCrit(100);
    expect(result.isCrit).toBe(true);
    expect(result.damage).toBe(Math.floor(100 * CRIT_MULTIPLIER));
  });

  it('applies floor to crit damage', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = calculateCrit(7);
    expect(result.damage).toBe(Math.floor(7 * CRIT_MULTIPLIER)); // 10
  });

  it('preserves damage=1 minimum on crit', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = calculateCrit(1);
    expect(result.damage).toBe(Math.floor(1 * CRIT_MULTIPLIER)); // 1
  });

  it('CRIT_CHANCE is 10%', () => {
    expect(CRIT_CHANCE).toBe(0.1);
  });

  it('CRIT_MULTIPLIER is 1.5', () => {
    expect(CRIT_MULTIPLIER).toBe(1.5);
  });
});
