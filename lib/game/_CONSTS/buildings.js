module.exports = {
  ancientMonument: {
    name: "古蹟",
    description: "被動產生原材料",
    maxLevel: 10,
    baseCost: { gold: 0 },
    upgradeCost: (level) => ({ gold: level * 100 }),
    production: { resourceType: "all_idle", perTick: 3 },
    position: "center",
  },
  castle: {
    name: "城堡",
    description: "解鎖更多英雄槽位",
    maxLevel: 10,
    baseCost: { gold: 500 },
    upgradeCost: (level) => ({ gold: level * 200 }),
    effect: { heroSlotsBonus: 2 },
  },
  tavern: {
    name: "酒館",
    description: "招募英雄",
    maxLevel: 10,
    baseCost: { gold: 300 },
    upgradeCost: (level) => ({ gold: level * 150 }),
    effect: (level) => ({ unlockHeroLevel: level + 1 }),
  },
  trainingGround: {
    name: "訓練場",
    description: "提升英雄屬性",
    maxLevel: 10,
    baseCost: { gold: 400 },
    upgradeCost: (level) => ({ gold: level * 180 }),
    effect: (level) => ({ trainingCostReduction: 0.1 * level }),
  },
  lumberMill: {
    name: "木材廠",
    description: "加速木材獲取 +50%/級",
    maxLevel: 10,
    baseCost: { gold: 200, wood: 50 },
    upgradeCost: (level) => ({ gold: level * 80, wood: level * 30 }),
    production: { resourceType: "wood", bonusPerLevel: 0.5 },
  },
  mine: {
    name: "礦坑",
    description: "加速鐵礦獲取 +50%/級",
    maxLevel: 10,
    baseCost: { gold: 200, iron: 30 },
    upgradeCost: (level) => ({ gold: level * 80, iron: level * 20 }),
    production: { resourceType: "iron", bonusPerLevel: 0.5 },
  },
  herbGarden: {
    name: "藥草園",
    description: "加速草藥獲取 +50%/級",
    maxLevel: 10,
    baseCost: { gold: 200, herbs: 30 },
    upgradeCost: (level) => ({ gold: level * 80, herbs: level * 20 }),
    production: { resourceType: "herbs", bonusPerLevel: 0.5 },
  },
  weaponShop: {
    name: "武器店",
    description: "生產武器供漫遊英雄購買",
    maxLevel: 10,
    baseCost: { gold: 350, wood: 40, iron: 20 },
    upgradeCost: (level) => ({ gold: level * 120, wood: level * 25, iron: level * 15 }),
    effect: (level) => ({ itemProductionBonus: 0.15 * level }),
  },
  armorShop: {
    name: "盔甲店",
    description: "生產盔甲供漫遊英雄購買",
    maxLevel: 10,
    baseCost: { gold: 350, iron: 40, wood: 20 },
    upgradeCost: (level) => ({ gold: level * 120, iron: level * 25, wood: level * 15 }),
    effect: (level) => ({ itemProductionBonus: 0.15 * level }),
  },
  potionShop: {
    name: "藥水店",
    description: "生產藥水供漫遊英雄購買",
    maxLevel: 10,
    baseCost: { gold: 300, herbs: 50, water: 30 },
    upgradeCost: (level) => ({ gold: level * 100, herbs: level * 30, water: level * 20 }),
    effect: (level) => ({ itemProductionBonus: 0.15 * level }),
  },
  vault: {
    name: "王國金庫",
    description: "擴展資源容量 +5000 黃金/+100 材料/槽",
    maxLevel: 10,
    baseCost: { gold: 600 },
    upgradeCost: (level) => ({ gold: level * 250 }),
    effect: (level) => ({ goldCapacityBonus: 5000 * level, materialCapacityBonus: 100 * level }),
  },
  barracks: {
    name: "兵營",
    description: "訓練士兵單位自動巡邏",
    maxLevel: 10,
    baseCost: { gold: 400, wood: 60 },
    upgradeCost: (level) => ({ gold: level * 150, wood: level * 40 }),
    effect: (level) => ({ unitCapacityBonus: 5 * level }),
  },
};

// Grid positions for a 6x6 grid (0-35)
module.exports.GRID_SIZE = 6;
module.exports.GRID_POSITIONS = Array.from({ length: 36 }, (_, i) => ({
  x: i % 6,
  y: Math.floor(i / 6),
  index: i,
}));

// Helper to validate position
module.exports.isValidPosition = (pos) => {
  return Array.isArray(pos) && pos.length === 2 &&
         pos[0] >= 0 && pos[0] < 6 && pos[1] >= 0 && pos[1] < 6;
};

// Get position index (0-35)
module.exports.positionToIndex = (pos) => {
  return pos[1] * 6 + pos[0];
};

// Get position from index
module.exports.indexToPosition = (index) => {
  return [index % 6, Math.floor(index / 6)];
};