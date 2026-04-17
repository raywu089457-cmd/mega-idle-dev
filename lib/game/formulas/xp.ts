/**
 * XP Formula - Single Source of Truth
 *
 * Level 1: 100 XP (base)
 * Level 2-15: Fast early game - 100 * 1.5^(level-1)
 * Level 16+: Slow late game - base15 * 1.2^(level-15)
 *   where base15 = 100 * 1.5^14 ≈ 169,000
 */

const XP_BASE = 100;
const XP_EARLY_GROWTH_RATE = 1.5;
const XP_LATE_GROWTH_RATE = 1.2;
const XP_EARLY_MAX_LEVEL = 15;
const XP_BASE_15 = Math.floor(XP_BASE * Math.pow(XP_EARLY_GROWTH_RATE, XP_EARLY_MAX_LEVEL - 1)); // ~169,000

/**
 * Get XP required for a specific level
 */
export function getXpForLevel(level: number): number {
  if (level <= 1) return XP_BASE;
  if (level <= XP_EARLY_MAX_LEVEL) {
    return Math.floor(XP_BASE * Math.pow(XP_EARLY_GROWTH_RATE, level - 1));
  }
  return Math.floor(XP_BASE_15 * Math.pow(XP_LATE_GROWTH_RATE, level - XP_EARLY_MAX_LEVEL));
}

/**
 * Get stat increase for leveling up
 */
export function getStatIncreaseForLevel(newLevel: number): { hp: number; atk: number; def: number } {
  return {
    hp: Math.floor(30 + newLevel * 6),
    atk: Math.floor(35 + newLevel * 6),
    def: Math.floor(20 + newLevel * 3),
  };
}

/**
 * Calculate XP progress as a percentage (0-1)
 */
export function getXpProgress(currentXp: number, level: number): number {
  const xpNeeded = getXpForLevel(level);
  return Math.min(1, currentXp / xpNeeded);
}