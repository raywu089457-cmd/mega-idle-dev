module.exports = {
  // ========== 武器 ==========
  "Iron Sword": {
    name: "鐵劍",
    type: "weapon",
    cost: { iron: 20, wood: 10 },
    price: 100,
    stats: { attack: 5, defense: 0, hp: 0 },
  },
  "Steel Sword": {
    name: "鋼劍",
    type: "weapon",
    cost: { iron: 40, wood: 15 },
    price: 200,
    stats: { attack: 10, defense: 0, hp: 0 },
  },
  "Magic Staff": {
    name: "魔法杖",
    type: "weapon",
    cost: { iron: 15, herbs: 20 },
    price: 180,
    stats: { attack: 15, defense: 0, hp: -5 },
  },
  "Battle Axe": {
    name: "戰斧",
    type: "weapon",
    cost: { iron: 35, wood: 20 },
    price: 180,
    stats: { attack: 12, defense: 0, hp: 0 },
  },
  "Longbow": {
    name: "長弓",
    type: "weapon",
    cost: { wood: 30, herbs: 10 },
    price: 150,
    stats: { attack: 8, defense: 0, hp: 0 },
  },
  "Dagger": {
    name: "匕首",
    type: "weapon",
    cost: { iron: 10, wood: 5 },
    price: 60,
    stats: { attack: 3, defense: 0, hp: 0 },
  },
  "Warhammer": {
    name: "戰錘",
    type: "weapon",
    cost: { iron: 50, wood: 25 },
    price: 250,
    stats: { attack: 14, defense: 2, hp: 0 },
  },
  "Crystal Wand": {
    name: "水晶魔杖",
    type: "weapon",
    cost: { iron: 10, herbs: 40, magic_stone: 5 },
    price: 350,
    stats: { attack: 20, defense: 0, hp: -10 },
  },

  // ========== 盔甲 ==========
  "Leather Armor": {
    name: "皮甲",
    type: "armor",
    cost: { herbs: 15 },
    price: 80,
    stats: { attack: 0, defense: 3, hp: 10 },
  },
  "Iron Armor": {
    name: "鐵甲",
    type: "armor",
    cost: { iron: 30, wood: 15 },
    price: 150,
    stats: { attack: 0, defense: 8, hp: 20 },
  },
  "Steel Armor": {
    name: "鋼甲",
    type: "armor",
    cost: { iron: 60, wood: 25 },
    price: 300,
    stats: { attack: 0, defense: 15, hp: 40 },
  },
  "Chain Mail": {
    name: "鎖甲",
    type: "armor",
    cost: { iron: 45, herbs: 10 },
    price: 220,
    stats: { attack: 0, defense: 10, hp: 15 },
  },
  "Plate Armor": {
    name: "板甲",
    type: "armor",
    cost: { iron: 80, wood: 20, magic_stone: 5 },
    price: 400,
    stats: { attack: 0, defense: 20, hp: 50 },
  },
  "Mage Robes": {
    name: "法師長袍",
    type: "armor",
    cost: { herbs: 30, water: 20 },
    price: 160,
    stats: { attack: 3, defense: 5, hp: 5 },
  },

  // ========== 頭盔 ==========
  "Iron Helmet": {
    name: "鐵頭盔",
    type: "helmet",
    cost: { iron: 20 },
    price: 80,
    stats: { attack: 0, defense: 4, hp: 5 },
  },
  "Steel Helmet": {
    name: "鋼頭盔",
    type: "helmet",
    cost: { iron: 35 },
    price: 140,
    stats: { attack: 0, defense: 6, hp: 8 },
  },
  "Wizard Hat": {
    name: "巫師帽",
    type: "helmet",
    cost: { herbs: 20, magic_stone: 2 },
    price: 120,
    stats: { attack: 3, defense: 2, hp: 0 },
  },
  "Knight Helm": {
    name: "騎士頭盔",
    type: "helmet",
    cost: { iron: 40, wood: 10 },
    price: 180,
    stats: { attack: 0, defense: 8, hp: 10 },
  },

  // ========== 飾品 ==========
  "Health Pendant": {
    name: "生命項鍊",
    type: "accessory",
    cost: { herbs: 25 },
    price: 120,
    stats: { attack: 0, defense: 0, hp: 30 },
  },
  "Power Ring": {
    name: "力量戒指",
    type: "accessory",
    cost: { iron: 15 },
    price: 100,
    stats: { attack: 5, defense: 0, hp: 0 },
  },
  "Defense Ring": {
    name: "防禦戒指",
    type: "accessory",
    cost: { iron: 20 },
    price: 120,
    stats: { attack: 0, defense: 5, hp: 0 },
  },
  "Magic Pendant": {
    name: "魔法項鍊",
    type: "accessory",
    cost: { herbs: 30, magic_stone: 3 },
    price: 200,
    stats: { attack: 8, defense: 0, hp: 0 },
  },
  "Shield Amulet": {
    name: "盾牌護符",
    type: "accessory",
    cost: { iron: 25, herbs: 15 },
    price: 150,
    stats: { attack: 0, defense: 6, hp: 10 },
  },
  "Lucky Charm": {
    name: "幸運符",
    type: "accessory",
    cost: { magic_stone: 5 },
    price: 180,
    stats: { attack: 2, defense: 2, hp: 10 },
  },

  // ========== 藥水 (消耗品) ==========
  "Small Healing Potion": {
    name: "小型治療藥水",
    type: "potion",
    cost: { herbs: 5, water: 3 },
    price: 30,
    healing: 30,
    stats: { hp: 0 },
  },
  "Large Healing Potion": {
    name: "大型治療藥水",
    type: "potion",
    cost: { herbs: 15, water: 10 },
    price: 80,
    healing: 100,
    stats: { hp: 0 },
  },
  "Mana Potion": {
    name: "魔法藥水",
    type: "potion",
    cost: { herbs: 10, water: 5, magic_stone: 1 },
    price: 100,
    healing: 0,
    stats: { attack: 5 },
  },

  // ========== 傳說測試物品 (debug 用) ==========
  "Legendary Sword": {
    name: "傳說勝利之劍",
    type: "weapon",
    cost: {},
    price: 0,
    stats: { attack: 999970, defense: 0, hp: 0 },
    isLegendary: true,
  },
  "Legendary Armor": {
    name: "傳說金屬鎧甲",
    type: "armor",
    cost: {},
    price: 0,
    stats: { attack: 0, defense: 999990, hp: 0 },
    isLegendary: true,
  },
  "Legendary Helmet": {
    name: "傳說冠冕頭盔",
    type: "helmet",
    cost: {},
    price: 0,
    stats: { attack: 0, defense: 499995, hp: 50000 },
    isLegendary: true,
  },
  "Legendary Accessory": {
    name: "傳說守護護符",
    type: "accessory",
    cost: {},
    price: 0,
    stats: { attack: 250000, defense: 250000, hp: 250000 },
    isLegendary: true,
  },
};

// Slot mapping for equipment
module.exports.SLOT_MAP = {
  weapon: "weapon",
  armor: "armor",
  helmet: "helmet",
  accessory: "accessory",
};

// Get item by name
module.exports.getItem = (name) => module.exports[name];

// Get items by type
module.exports.getItemsByType = (type) => {
  return Object.entries(module.exports)
    .filter(([key, val]) => val && val.type === type)
    .reduce((acc, [key, val]) => {
      acc[key] = val;
      return acc;
    }, {});
};

// Calculate total stats from equipment object
module.exports.calculateEquipmentStats = (equipment) => {
  const total = { attack: 0, defense: 0, hp: 0 };
  if (!equipment) return total;

  Object.values(equipment).forEach(itemName => {
    if (itemName && module.exports[itemName]) {
      const stats = module.exports[itemName].stats;
      total.attack += stats.attack || 0;
      total.defense += stats.defense || 0;
      total.hp += stats.hp || 0;
    }
  });

  return total;
};