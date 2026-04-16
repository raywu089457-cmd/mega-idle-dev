// game/_CONSTS/units.js

// 單位屬性定義（從 Mega RPG 遷移）
const UNITS_BY_BUILDING = {
  archery: {
    huntsman: { health: 10, attack: 3, defense: 1 },
    archer: { health: 15, attack: 5, defense: 2 },
    ranger: { health: 20, attack: 8, defense: 3 },
    survivalist: { health: 25, attack: 10, defense: 4 },
    sharpshooter: { health: 30, attack: 15, defense: 5 },
  },
  barracks: {
    peasant: { health: 20, attack: 2, defense: 1 },
    militia: { health: 30, attack: 4, defense: 3 },
    guardsman: { health: 50, attack: 7, defense: 6 },
    knight: { health: 80, attack: 12, defense: 10 },
    berserker: { health: 60, attack: 18, defense: 5 },
    justicar: { health: 100, attack: 15, defense: 15 },
  },
};

// 軍隊加成參數
const ARMY_ATK_CONTRIBUTION_RATE = 0.1;      // 10% ATK 給英雄
const ARMORY_BONUS_PER_ITEM = 0.05;          // 每件裝備 +5%
const MAX_ARMORY_BONUS_MULTIPLIER = 1.5;      // 最高 1.5x

module.exports = {
  UNITS_BY_BUILDING,
  ARMY_ATK_CONTRIBUTION_RATE,
  ARMORY_BONUS_PER_ITEM,
  MAX_ARMORY_BONUS_MULTIPLIER,
};
