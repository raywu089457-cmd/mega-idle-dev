// 資源名稱中文化
export const RESOURCE_NAMES: Record<string, string> = {
  gold: '黃金',
  magicStones: '魔法石',
  magic_stone: '魔法石', // 別名相容
  fruit: '水果',
  water: '水',
  wood: '木頭',
  iron: '鐵礦',
  herbs: '草藥',
  rations: '口糧',
  drinking_water: '飲用水',
  potions: '藥水',
};

// 建築名稱中文化
export const BUILDING_NAMES: Record<string, string> = {
  castle: '城堡',
  tavern: '酒館',
  monument: '紀念碑',
  warehouse: '倉庫',
  guildHall: '公會大廳',
  weaponShop: '武器店',
  armorShop: '盔甲店',
  potionShop: '藥水店',
  lumberMill: '伐木場',
  mine: '礦場',
  herbGarden: '草藥園',
  barracks: '兵營',
  archery: '弓箭塔',
};

// 地圖名稱 + 等級 (使用 sub-zones.js 的名稱和 base difficulty 作為等級)
export const ZONE_NAMES: Record<number, string> = {
  1: '翠綠草原 (Lv.1)',
  2: '迷霧山脈 (Lv.3)',
  3: '深邃洞穴 (Lv.5)',
  4: '幽靈要塞 (Lv.7)',
  5: '烈焰火山 (Lv.9)',
  6: '冰霜凍土 (Lv.11)',
  7: '遠古神殿 (Lv.13)',
  8: '龍之巢穴 (Lv.15)',
  9: '虛空裂隙 (Lv.17)',
  10: '混沌深淵 (Lv.20)',
};
