// game/combat/crit.js

const CRIT_CHANCE = 0.1;       // 10% 暴擊機率
const CRIT_MULTIPLIER = 1.5;    // 1.5x 暴擊傷害

/**
 * 計算暴擊
 * @param {number} damage - 原始傷害
 * @returns {{ damage: number, isCrit: boolean }}
 */
function calculateCrit(damage) {
  const isCrit = Math.random() < CRIT_CHANCE;
  return {
    damage: isCrit ? Math.floor(damage * CRIT_MULTIPLIER) : damage,
    isCrit,
  };
}

module.exports = {
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  calculateCrit,
};
