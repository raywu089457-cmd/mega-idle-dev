// game/combat/targeting.js

// 攻擊範圍常數
const ATTACK_RANGE = {
  MELEE: 'melee',
  MID: 'mid',
  LONG: 'long',
};

// 怪物優先攻擊順序：近戰 > 中距離 > 遠距離
const RANGE_PRIORITY = [ATTACK_RANGE.MELEE, ATTACK_RANGE.MID, ATTACK_RANGE.LONG];

/**
 * 根據英雄職業獲取攻擊範圍
 */
function getAttackRangeForClass(heroClass) {
  switch (heroClass?.toLowerCase()) {
    case 'swordsman':
    case 'warrior':
    case 'paladin':
      return ATTACK_RANGE.MELEE;
    case 'thief':
    case 'rogue':
      return ATTACK_RANGE.MID;
    case 'archer':
    case 'ranger':
    case 'mage':
    case 'priest':
      return ATTACK_RANGE.LONG;
    default:
      return ATTACK_RANGE.MELEE;
  }
}

/**
 * 獲取怪物攻擊目標（優先近戰，再選最低 HP）
 */
function getMonsterTarget(aliveHeroes) {
  for (const rangeType of RANGE_PRIORITY) {
    const candidates = aliveHeroes.filter(
      h => h.attackRange === rangeType && h.currentHp > 0
    );
    if (candidates.length > 0) {
      return candidates.reduce((a, b) =>
        a.currentHp < b.currentHp ? a : b
      );
    }
  }
  return aliveHeroes.find(h => h.currentHp > 0) || null;
}

module.exports = {
  ATTACK_RANGE,
  RANGE_PRIORITY,
  getAttackRangeForClass,
  getMonsterTarget,
};
