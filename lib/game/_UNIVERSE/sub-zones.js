// game/_UNIVERSE/sub-zones.js
// Balanced for casual idle players — heroes feel powerful, progression is satisfying
module.exports = {
  1: {
    name: "翠綠草原",
    sub_zones: [
      { id: 1, name: "草原外圍", difficulty: 1, monsters: [{ name: "哥布林", hp: 25, atk: 4, defense: 1, xp: 12 }, { name: "野狼", hp: 30, atk: 5, defense: 2, xp: 14 }, { name: "強盜", hp: 40, atk: 6, defense: 3, xp: 18 }], gold_reward: 120, stone_drop: [1, 3], xp_multiplier: 1.0, is_boss: false, is_elite: false },
      { id: 2, name: "森林邊緣", difficulty: 2, monsters: [{ name: "狼群領袖", hp: 70, atk: 10, defense: 5, xp: 35, is_elite: true }, { name: "森林盜賊", hp: 60, atk: 12, defense: 4, xp: 28, is_elite: true }], gold_reward: 200, stone_drop: [2, 4], xp_multiplier: 1.5, is_boss: false, is_elite: true },
      { id: 3, name: "灌木叢林深處", difficulty: 3, monsters: [{ name: "叢林守護者", hp: 120, atk: 15, defense: 8, xp: 60, is_boss: true }], gold_reward: 350, stone_drop: [3, 5], xp_multiplier: 2.0, is_boss: true, is_elite: false },
    ],
  },
  2: {
    name: "迷霧山脈",
    sub_zones: [
      { id: 1, name: "山腳", difficulty: 3, monsters: [{ name: "山賊", hp: 80, atk: 12, defense: 6, xp: 50 }], gold_reward: 320, stone_drop: [2, 4], xp_multiplier: 1.0, is_boss: false, is_elite: false },
      { id: 2, name: "山路", difficulty: 4, monsters: [{ name: "石像鬼", hp: 130, atk: 18, defense: 10, xp: 75, is_elite: true }], gold_reward: 480, stone_drop: [3, 5], xp_multiplier: 1.5, is_boss: false, is_elite: true },
      { id: 3, name: "山頂", difficulty: 5, monsters: [{ name: "雪怪王", hp: 250, atk: 28, defense: 15, xp: 120, is_boss: true }], gold_reward: 800, stone_drop: [4, 7], xp_multiplier: 2.0, is_boss: true, is_elite: false },
    ],
  },
  3: {
    name: "深邃洞穴",
    sub_zones: [
      { id: 1, name: "洞穴入口", difficulty: 5, monsters: [{ name: "洞穴蜘蛛", hp: 120, atk: 20, defense: 7, xp: 60 }], gold_reward: 450, stone_drop: [3, 5], xp_multiplier: 1.0, is_boss: false, is_elite: false },
      { id: 2, name: "礦脈深處", difficulty: 6, monsters: [{ name: "礦脈守護者", hp: 200, atk: 28, defense: 12, xp: 100, is_elite: true }], gold_reward: 650, stone_drop: [4, 7], xp_multiplier: 1.5, is_boss: false, is_elite: true },
      { id: 3, name: "黑暗核心", difficulty: 7, monsters: [{ name: "黑暗法師王", hp: 400, atk: 40, defense: 20, xp: 180, is_boss: true }], gold_reward: 1100, stone_drop: [5, 9], xp_multiplier: 2.0, is_boss: true, is_elite: false },
    ],
  },
  4: {
    name: "幽靈要塞",
    sub_zones: [
      { id: 1, name: "外牆", difficulty: 7, monsters: [{ name: "幽靈士兵", hp: 180, atk: 25, defense: 14, xp: 90 }], gold_reward: 700, stone_drop: [4, 7], xp_multiplier: 1.0, is_boss: false, is_elite: false },
      { id: 2, name: "要塞內部", difficulty: 8, monsters: [{ name: "怨靈法師", hp: 280, atk: 35, defense: 18, xp: 130, is_elite: true }], gold_reward: 950, stone_drop: [5, 9], xp_multiplier: 1.5, is_boss: false, is_elite: true },
      { id: 3, name: "領主之間", difficulty: 9, monsters: [{ name: "墮落騎士王", hp: 550, atk: 55, defense: 30, xp: 250, is_boss: true }], gold_reward: 1600, stone_drop: [7, 12], xp_multiplier: 2.0, is_boss: true, is_elite: false },
    ],
  },
  5: {
    name: "烈焰火山",
    sub_zones: [
      { id: 1, name: "火山腳", difficulty: 9, monsters: [{ name: "火元素", hp: 280, atk: 45, defense: 20, xp: 150 }], gold_reward: 1300, stone_drop: [6, 10], xp_multiplier: 1.0, is_boss: false, is_elite: false },
      { id: 2, name: "熔岩地帶", difficulty: 10, monsters: [{ name: "熔岩巨人", hp: 450, atk: 60, defense: 28, xp: 220, is_elite: true }], gold_reward: 1800, stone_drop: [8, 13], xp_multiplier: 1.5, is_boss: false, is_elite: true },
      { id: 3, name: "火山口", difficulty: 11, monsters: [{ name: "火焰巨龍", hp: 800, atk: 80, defense: 40, xp: 400, is_boss: true }], gold_reward: 2800, stone_drop: [10, 16], xp_multiplier: 2.0, is_boss: true, is_elite: false },
    ],
  },
  6: {
    name: "冰霜凍土",
    sub_zones: [
      { id: 1, name: "冰原外圍", difficulty: 11, monsters: [{ name: "冰霜巨人", hp: 500, atk: 65, defense: 32, xp: 280 }], gold_reward: 2200, stone_drop: [8, 13], xp_multiplier: 1.0, is_boss: false, is_elite: false },
      { id: 2, name: "冰洞深處", difficulty: 12, monsters: [{ name: "冰霜元素", hp: 700, atk: 85, defense: 40, xp: 380, is_elite: true }], gold_reward: 3000, stone_drop: [10, 16], xp_multiplier: 1.5, is_boss: false, is_elite: true },
      { id: 3, name: "冰之王座", difficulty: 13, monsters: [{ name: "冰霜巨人王", hp: 1000, atk: 110, defense: 55, xp: 550, is_boss: true }], gold_reward: 4200, stone_drop: [14, 22], xp_multiplier: 2.0, is_boss: true, is_elite: false },
    ],
  },
  7: {
    name: "遠古神殿",
    sub_zones: [
      { id: 1, name: "神殿外圍", difficulty: 13, monsters: [{ name: "神殿守衛", hp: 650, atk: 85, defense: 42, xp: 350 }], gold_reward: 3400, stone_drop: [10, 16], xp_multiplier: 1.0, is_boss: false, is_elite: false },
      { id: 2, name: "神殿中庭", difficulty: 14, monsters: [{ name: "神殿騎士", hp: 850, atk: 105, defense: 50, xp: 480, is_elite: true }], gold_reward: 4400, stone_drop: [12, 19], xp_multiplier: 1.5, is_boss: false, is_elite: true },
      { id: 3, name: "天使長之間", difficulty: 15, monsters: [{ name: "天使長", hp: 1400, atk: 140, defense: 70, xp: 700, is_boss: true }], gold_reward: 6500, stone_drop: [18, 28], xp_multiplier: 2.0, is_boss: true, is_elite: false },
    ],
  },
  8: {
    name: "龍之巢穴",
    sub_zones: [
      { id: 1, name: "龍穴入口", difficulty: 15, monsters: [{ name: "幼龍", hp: 800, atk: 95, defense: 48, xp: 480 }], gold_reward: 5200, stone_drop: [14, 22], xp_multiplier: 1.0, is_boss: false, is_elite: false },
      { id: 2, name: "龍穴中層", difficulty: 17, monsters: [{ name: "成年龍", hp: 1100, atk: 120, defense: 60, xp: 680, is_elite: true }], gold_reward: 7000, stone_drop: [17, 26], xp_multiplier: 1.5, is_boss: false, is_elite: true },
      { id: 3, name: "龍穴核心", difficulty: 20, monsters: [{ name: "終極巨龍", hp: 1800, atk: 160, defense: 80, xp: 950, is_boss: true }], gold_reward: 10500, stone_drop: [25, 40], xp_multiplier: 2.0, is_boss: true, is_elite: false },
    ],
  },
  9: {
    name: "虛空裂隙",
    sub_zones: [
      { id: 1, name: "裂隙入口", difficulty: 17, monsters: [{ name: "虛空行者", hp: 1000, atk: 110, defense: 55, xp: 620 }], gold_reward: 8400, stone_drop: [18, 28], xp_multiplier: 1.0, is_boss: false, is_elite: false },
      { id: 2, name: "虛空深層", difficulty: 20, monsters: [{ name: "虛空監視者", hp: 1400, atk: 140, defense: 70, xp: 850, is_elite: true }], gold_reward: 11500, stone_drop: [22, 34], xp_multiplier: 1.5, is_boss: false, is_elite: true },
      { id: 3, name: "虛空核心", difficulty: 25, monsters: [{ name: "虛空吞噬者", hp: 2500, atk: 200, defense: 100, xp: 1400, is_boss: true }], gold_reward: 16500, stone_drop: [30, 48], xp_multiplier: 2.0, is_boss: true, is_elite: false },
    ],
  },
  10: {
    name: "混沌深淵",
    sub_zones: [
      { id: 1, name: "深淵入口", difficulty: 20, monsters: [{ name: "混沌僕從", hp: 1300, atk: 130, defense: 65, xp: 820 }], gold_reward: 14500, stone_drop: [22, 34], xp_multiplier: 1.0, is_boss: false, is_elite: false },
      { id: 2, name: "混沌領域", difficulty: 25, monsters: [{ name: "混沌衛士", hp: 2000, atk: 180, defense: 90, xp: 1200, is_elite: true }], gold_reward: 20000, stone_drop: [28, 44], xp_multiplier: 1.5, is_boss: false, is_elite: true },
      { id: 3, name: "混沌王座", difficulty: 30, monsters: [{ name: "混沌之主", hp: 3500, atk: 260, defense: 130, xp: 2000, is_boss: true }], gold_reward: 30000, stone_drop: [40, 65], xp_multiplier: 2.0, is_boss: true, is_elite: false },
    ],
  },
};
