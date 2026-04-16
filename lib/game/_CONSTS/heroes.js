module.exports = {
  classes: ["Warrior", "Archer", "Mage", "Rogue", "Paladin", "Ranger"],

  baseStats: {
    Warrior: { hp: 120, attack: 12, defense: 8 },
    Archer: { hp: 80, attack: 15, defense: 4 },
    Mage: { hp: 70, attack: 18, defense: 3 },
    Rogue: { hp: 90, attack: 14, defense: 5 },
    Paladin: { hp: 140, attack: 8, defense: 12 },
    Ranger: { hp: 85, attack: 13, defense: 6 },
  },

  wanderingTypes: ["Mercenary", "Knight Errant", "Wandering Mage", "Rogue Scout", "Cavalier"],

  levelMultiplier: 1.15, // Stats increase 15% per level

  // 各職業初始裝備
  // 支援 heroes.js 職業名稱，也相容 HeroManagementService 的 WANDERING_HERO_TYPES 命名
  startingEquipment: {
    // Heroes.js 職業
    Warrior: { weapon: "Iron Sword", armor: "Iron Armor" },
    Archer: { weapon: "Longbow", armor: "Leather Armor" },
    Mage: { weapon: "Magic Staff", armor: "Mage Robes" },
    Rogue: { weapon: "Dagger", armor: "Leather Armor" },
    Paladin: { weapon: "Warhammer", armor: "Steel Armor" },
    Ranger: { weapon: "Longbow", armor: "Chain Mail" },
    // WANDERING_HERO_TYPES 相容 (全部5種)
    swordsman: { weapon: "Iron Sword", armor: "Iron Armor" },
    thief: { weapon: "Dagger", armor: "Leather Armor" },
    archer: { weapon: "Longbow", armor: "Leather Armor" },
    mage: { weapon: "Magic Staff", armor: "Mage Robes" },
    priest: { weapon: "Warhammer", armor: "Chain Mail" },
  },
};
