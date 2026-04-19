/**
 * WanderingHeroAI Service
 * Handles autonomous exploration, combat, and shopping for wandering heroes
 */

const { CombatResolver } = require('../combat/CombatResolver');
const { getXpForLevel } = require('./HeroManagementService');

// AI Constants
const WANDERING_STATES = {
  IDLE: 'idle',
  EXPLORING: 'exploring',
  FIGHTING: 'fighting',
  RESTING: 'resting',
  SHOPPING: 'shopping',
  DEAD: 'dead',
};

const MIN_TEAM_SIZE = 3;
const MAX_TEAM_SIZE = 5;
const REST_TICKS = 3;
const HP_REGEN_PER_TICK = 0.25; // 25% HP back while resting
const SHOP_CHANCE = 0.3; // 30% chance to shop instead of exploring

// Shopping AI prices
const POTION_PRICE = 50;
const WEAPON_PRICE = 100;
const ARMOR_PRICE = 150;
const HP_THRESHOLD = 0.5; // Buy potion if HP < 50%

// Stone split: 80% to hero, 20% to kingdom
const STONE_SPLIT_HERO = 0.8;
const STONE_SPLIT_KINGDOM = 0.2;

/**
 * @typedef {Object} TickResult
 * @property {number} wanderingHeroGold - Gold earned from wandering hero combat
 * @property {number} wanderingHeroStones - Magic stones contributed to kingdom
 * @property {string[]} messages - Log messages
 */

/**
 * WanderingHeroAI - Autonomous AI for wandering heroes
 */
class WanderingHeroAI {
  /**
   * Process all wandering heroes for one tick
   * @param {Object} user - User document
   * @returns {TickResult} Results of the tick
   */
  async processTick(user) {
    const result = {
      wanderingHeroGold: 0,
      wanderingHeroStones: 0,
      messages: [],
    };

    const wandering = user.getWanderingHeroes();
    if (wandering.length === 0) {
      return result;
    }

    // Group into teams
    const teams = this.groupIntoTeams(wandering);

    for (const [teamIdx, heroes] of Object.entries(teams)) {
      for (const hero of heroes) {
        await this.processHeroTick(hero, user, result);
      }
    }

    return result;
  }

  /**
   * Process single wandering hero tick
   * @param {Object} hero - Hero object
   * @param {Object} user - User document
   * @param {TickResult} result - Accumulated result
   */
  async processHeroTick(hero, user, result) {
    // Skip dead heroes
    if (hero.state === WANDERING_STATES.DEAD) {
      return;
    }

    switch (hero.state) {
      case WANDERING_STATES.IDLE:
        await this.processIdle(hero, user, result);
        break;
      case WANDERING_STATES.EXPLORING:
        await this.processExploring(hero, user, result);
        break;
      case WANDERING_STATES.RESTING:
        await this.processResting(hero, user);
        break;
      case WANDERING_STATES.SHOPPING:
        await this.processShopping(hero, user, result);
        break;
    }
  }

  /**
   * Process IDLE state - decide next action
   * @param {Object} hero - Hero object
   * @param {Object} user - User document
   * @param {TickResult} result - Accumulated result
   */
  async processIdle(hero, user, result) {
    // Get highest unlocked zone
    const highestZone = Math.max(...(user.unlockedZones || [1]));

    // 30% chance to shop if shops exist
    if (Math.random() < SHOP_CHANCE && this.canShop(user)) {
      hero.state = WANDERING_STATES.SHOPPING;
      hero.currentZone = null;
      hero.currentSubZone = null;
      hero.isExploring = false;
      return;
    }

    // Auto-dispatch to highest zone
    hero.state = WANDERING_STATES.EXPLORING;
    hero.currentZone = highestZone;
    hero.currentSubZone = 1; // Easiest sub-zone
    hero.isExploring = true;
    hero.currentTeamIdx = hero.currentTeamIdx ?? this.assignTeamIdx(hero, user);
  }

  /**
   * Process EXPLORING state - resolve combat
   * @param {Object} hero - Hero object
   * @param {Object} user - User document
   * @param {TickResult} result - Accumulated result
   */
  async processExploring(hero, user, result) {
    const subZone = this.getSubZone(hero.currentZone, hero.currentSubZone);
    if (!subZone) {
      hero.state = WANDERING_STATES.IDLE;
      hero.isExploring = false;
      hero.currentZone = null;
      hero.currentSubZone = null;
      return;
    }

    // Get team heroes at same zone
    const teamHeroes = user.heroes.roster.filter(
      h => h.type === 'wandering' &&
        h.currentZone === hero.currentZone &&
        h.currentSubZone === hero.currentSubZone &&
        h.state === WANDERING_STATES.EXPLORING
    );

    // Resolve combat
    const resolver = new CombatResolver();
    const combatResult = resolver.resolveCombat(teamHeroes, subZone, 0);

    if (combatResult.victory) {
      // Gold to kingdom treasury
      user.gold = Math.min(user.gold + combatResult.goldReward, user.goldCapacity);
      result.wanderingHeroGold += combatResult.goldReward;
      user.statistics.goldFromWandering = (user.statistics.goldFromWandering || 0) + combatResult.goldReward;

      // Stone split 80/20
      if (combatResult.magicStonesFound > 0) {
        const heroShare = Math.floor(combatResult.magicStonesFound * STONE_SPLIT_HERO);
        const kingdomShare = combatResult.magicStonesFound - heroShare;
        hero.personalStones += heroShare;
        user.magicStones = (user.magicStones || 0) + kingdomShare;
        result.wanderingHeroStones += kingdomShare;
        user.statistics.stonesFromWandering = (user.statistics.stonesFromWandering || 0) + kingdomShare;
      }

      // XP to hero (average among team)
      const xpPerHero = Math.floor(combatResult.xpGained / teamHeroes.length);
      for (const teamHero of teamHeroes) {
        teamHero.experience += xpPerHero;
        teamHero.totalXp += xpPerHero;
        this.checkLevelUp(teamHero, user);
      }

      // Reset to idle
      for (const teamHero of teamHeroes) {
        teamHero.state = WANDERING_STATES.IDLE;
        teamHero.isExploring = false;
        teamHero.currentZone = null;
        teamHero.currentSubZone = null;
      }
    } else {
      // Defeat - enter resting state (no death in MVP)
      for (const teamHero of teamHeroes) {
        teamHero.state = WANDERING_STATES.RESTING;
        teamHero.restTicks = 0;
        teamHero.isExploring = false;
      }
    }
  }

  /**
   * Process RESTING state - regenerate HP
   * @param {Object} hero - Hero object
   * @param {Object} user - User document
   */
  async processResting(hero, user) {
    const ticksRested = (hero.restTicks || 0) + 1;
    hero.restTicks = ticksRested;

    // Regen 25% HP per tick
    const hpRegen = Math.floor(hero.maxHp * HP_REGEN_PER_TICK);
    hero.currentHp = Math.min(hero.maxHp, hero.currentHp + hpRegen);

    if (ticksRested >= REST_TICKS) {
      hero.state = WANDERING_STATES.IDLE;
      hero.restTicks = 0;
      hero.currentHp = Math.max(hero.currentHp, Math.floor(hero.maxHp * 0.5)); // Min 50% HP
    }
  }

  /**
   * Process SHOPPING state - buy items with personal gold
   * @param {Object} hero - Hero object
   * @param {Object} user - User document
   * @param {TickResult} result - Accumulated result
   */
  async processShopping(hero, user, result) {
    const weaponShopLevel = user.buildings?.weaponShop?.level || 0;
    const armorShopLevel = user.buildings?.armorShop?.level || 0;

    if (weaponShopLevel === 0 && armorShopLevel === 0) {
      hero.state = WANDERING_STATES.IDLE;
      return;
    }

    let purchased = false;

    // Priority 1: Buy potion if HP < 50%
    if (hero.currentHp < hero.maxHp * HP_THRESHOLD && hero.personalGold >= POTION_PRICE) {
      hero.personalGold -= POTION_PRICE;
      user.gold = (user.gold || 0) + POTION_PRICE;
      hero.currentHp = Math.min(hero.maxHp, hero.currentHp + Math.floor(hero.maxHp * 0.5));
      result.wanderingHeroGold += POTION_PRICE;
      user.statistics.goldFromShopping = (user.statistics.goldFromShopping || 0) + POTION_PRICE;
      purchased = true;
    }
    // Priority 2: Buy weapon
    else if (weaponShopLevel > 0 && hero.personalGold >= WEAPON_PRICE) {
      hero.personalGold -= WEAPON_PRICE;
      user.gold = (user.gold || 0) + WEAPON_PRICE;
      result.wanderingHeroGold += WEAPON_PRICE;
      user.statistics.goldFromShopping = (user.statistics.goldFromShopping || 0) + WEAPON_PRICE;
      purchased = true;
    }
    // Priority 3: Buy armor
    else if (armorShopLevel > 0 && hero.personalGold >= ARMOR_PRICE) {
      hero.personalGold -= ARMOR_PRICE;
      user.gold = (user.gold || 0) + ARMOR_PRICE;
      result.wanderingHeroGold += ARMOR_PRICE;
      user.statistics.goldFromShopping = (user.statistics.goldFromShopping || 0) + ARMOR_PRICE;
      purchased = true;
    }

    // Return to idle after shopping
    hero.state = WANDERING_STATES.IDLE;
  }

  /**
   * Group wandering heroes into teams
   * @param {Array} wandering - Array of wandering heroes
   * @returns {Object} Teams keyed by teamIdx
   */
  groupIntoTeams(wandering) {
    const teams = {};
    const idleUnassigned = wandering.filter(
      h => h.state === WANDERING_STATES.IDLE && h.currentTeamIdx === null
    );

    // Form teams from idle unassigned heroes
    for (let i = 0; i < idleUnassigned.length; i += MAX_TEAM_SIZE) {
      const teamIdx = Math.floor(i / MAX_TEAM_SIZE);
      teams[teamIdx] = idleUnassigned.slice(i, i + MAX_TEAM_SIZE);
      for (const h of teams[teamIdx]) {
        h.currentTeamIdx = teamIdx;
      }
    }

    // Add heroes with existing teamIdx
    for (const hero of wandering) {
      if (hero.currentTeamIdx !== null) {
        const idx = hero.currentTeamIdx;
        if (!teams[idx]) {
          teams[idx] = [];
        }
        if (!teams[idx].includes(hero)) {
          teams[idx].push(hero);
        }
      }
    }

    return teams;
  }

  /**
   * Assign team index to hero
   * @param {Object} hero - Hero object
   * @param {Object} user - User document
   * @returns {number} Team index
   */
  assignTeamIdx(hero, user) {
    const wandering = user.getWanderingHeroes();
    const usedIndices = new Set(
      wandering.filter(h => h.currentTeamIdx !== null).map(h => h.currentTeamIdx)
    );
    let idx = 0;
    while (usedIndices.has(idx)) idx++;
    return idx;
  }

  /**
   * Check and process level up
   * @param {Object} hero - Hero object
   * @param {Object} user - User document
   */
  checkLevelUp(hero, user) {
    const { levelMultiplier } = require('../_CONSTS/heroes');
    while (hero.experience >= getXpForLevel(hero.level) && hero.level < 100) {
      hero.experience -= getXpForLevel(hero.level);
      hero.level++;
      hero.maxHp = Math.floor(hero.maxHp * levelMultiplier);
      hero.currentHp = hero.maxHp;
      hero.atk = Math.floor(hero.atk * levelMultiplier);
      hero.def = Math.floor(hero.def * levelMultiplier);
    }
  }

  /**
   * Check if user has any shops
   * @param {Object} user - User document
   * @returns {boolean}
   */
  canShop(user) {
    return (user.buildings?.weaponShop?.level || 0) > 0 ||
           (user.buildings?.armorShop?.level || 0) > 0;
  }

  /**
   * Get sub-zone data
   * @param {number} zone - Zone number
   * @param {number} subZone - Sub-zone number
   * @returns {Object|null} Sub-zone data or null
   */
  getSubZone(zone, subZone) {
    // Import inline to avoid resolution issues across deployments
    const subZones = {
      1: { name: "翠綠草原", sub_zones: [{ id: 1, name: "草原外圍", difficulty: 1, monsters: [{ name: "哥布林", hp: 25, atk: 4, defense: 1, xp: 12 }, { name: "野狼", hp: 30, atk: 5, defense: 2, xp: 14 }, { name: "強盜", hp: 40, atk: 6, defense: 3, xp: 18 }], gold_reward: 120, stone_drop: [1, 3], xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "森林邊緣", difficulty: 2, monsters: [{ name: "狼群領袖", hp: 70, atk: 10, defense: 5, xp: 35, is_elite: true }, { name: "森林盜賊", hp: 60, atk: 12, defense: 4, xp: 28, is_elite: true }], gold_reward: 200, stone_drop: [2, 4], xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "灌木叢林深處", difficulty: 3, monsters: [{ name: "叢林守護者", hp: 120, atk: 15, defense: 8, xp: 60, is_boss: true }], gold_reward: 350, stone_drop: [3, 5], xp_multiplier: 2.0, is_boss: true }] },
      2: { name: "迷霧山脈", sub_zones: [{ id: 1, name: "山腳", difficulty: 3, monsters: [{ name: "山賊", hp: 80, atk: 12, defense: 6, xp: 50 }], gold_reward: 320, stone_drop: [2, 4], xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "山路", difficulty: 4, monsters: [{ name: "石像鬼", hp: 130, atk: 18, defense: 10, xp: 75, is_elite: true }], gold_reward: 480, stone_drop: [3, 5], xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "山頂", difficulty: 5, monsters: [{ name: "雪怪王", hp: 250, atk: 28, defense: 15, xp: 120, is_boss: true }], gold_reward: 800, stone_drop: [4, 7], xp_multiplier: 2.0, is_boss: true }] },
      3: { name: "深邃洞穴", sub_zones: [{ id: 1, name: "洞穴入口", difficulty: 5, monsters: [{ name: "洞穴蜘蛛", hp: 120, atk: 20, defense: 7, xp: 60 }], gold_reward: 450, stone_drop: [3, 5], xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "礦脈深處", difficulty: 6, monsters: [{ name: "礦脈守護者", hp: 200, atk: 28, defense: 12, xp: 100, is_elite: true }], gold_reward: 650, stone_drop: [4, 7], xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "黑暗核心", difficulty: 7, monsters: [{ name: "黑暗法師王", hp: 400, atk: 40, defense: 20, xp: 180, is_boss: true }], gold_reward: 1100, stone_drop: [5, 9], xp_multiplier: 2.0, is_boss: true }] },
      4: { name: "幽靈要塞", sub_zones: [{ id: 1, name: "外牆", difficulty: 7, monsters: [{ name: "幽靈士兵", hp: 180, atk: 25, defense: 14, xp: 90 }], gold_reward: 700, stone_drop: [4, 7], xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "要塞內部", difficulty: 8, monsters: [{ name: "怨靈法師", hp: 280, atk: 35, defense: 18, xp: 130, is_elite: true }], gold_reward: 950, stone_drop: [5, 9], xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "領主之間", difficulty: 9, monsters: [{ name: "墮落騎士王", hp: 550, atk: 55, defense: 30, xp: 250, is_boss: true }], gold_reward: 1600, stone_drop: [7, 12], xp_multiplier: 2.0, is_boss: true }] },
      5: { name: "烈焰火山", sub_zones: [{ id: 1, name: "火山腳", difficulty: 9, monsters: [{ name: "火元素", hp: 280, atk: 45, defense: 20, xp: 150 }], gold_reward: 1300, stone_drop: [6, 10], xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "熔岩地帶", difficulty: 10, monsters: [{ name: "熔岩巨人", hp: 450, atk: 60, defense: 28, xp: 220, is_elite: true }], gold_reward: 1800, stone_drop: [8, 13], xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "火山口", difficulty: 11, monsters: [{ name: "火焰巨龍", hp: 800, atk: 80, defense: 40, xp: 400, is_boss: true }], gold_reward: 2800, stone_drop: [10, 16], xp_multiplier: 2.0, is_boss: true }] },
      6: { name: "冰霜凍土", sub_zones: [{ id: 1, name: "冰原外圍", difficulty: 11, monsters: [{ name: "冰霜巨人", hp: 500, atk: 65, defense: 32, xp: 280 }], gold_reward: 2200, stone_drop: [8, 13], xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "冰洞深處", difficulty: 12, monsters: [{ name: "冰霜元素", hp: 700, atk: 85, defense: 40, xp: 380, is_elite: true }], gold_reward: 3000, stone_drop: [10, 16], xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "冰之王座", difficulty: 13, monsters: [{ name: "冰霜巨人王", hp: 1000, atk: 110, defense: 55, xp: 550, is_boss: true }], gold_reward: 4200, stone_drop: [14, 22], xp_multiplier: 2.0, is_boss: true }] },
      7: { name: "遠古神殿", sub_zones: [{ id: 1, name: "神殿外圍", difficulty: 13, monsters: [{ name: "神殿守衛", hp: 650, atk: 85, defense: 42, xp: 350 }], gold_reward: 3400, stone_drop: [10, 16], xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "神殿中庭", difficulty: 14, monsters: [{ name: "神殿騎士", hp: 850, atk: 105, defense: 50, xp: 480, is_elite: true }], gold_reward: 4400, stone_drop: [12, 19], xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "天使長之間", difficulty: 15, monsters: [{ name: "天使長", hp: 1400, atk: 140, defense: 70, xp: 700, is_boss: true }], gold_reward: 6500, stone_drop: [18, 28], xp_multiplier: 2.0, is_boss: true }] },
      8: { name: "龍之巢穴", sub_zones: [{ id: 1, name: "龍穴入口", difficulty: 15, monsters: [{ name: "幼龍", hp: 800, atk: 95, defense: 48, xp: 480 }], gold_reward: 5200, stone_drop: [14, 22], xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "龍穴中層", difficulty: 17, monsters: [{ name: "成年龍", hp: 1100, atk: 120, defense: 60, xp: 680, is_elite: true }], gold_reward: 7000, stone_drop: [17, 26], xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "龍穴核心", difficulty: 20, monsters: [{ name: "終極巨龍", hp: 1800, atk: 160, defense: 80, xp: 950, is_boss: true }], gold_reward: 10500, stone_drop: [25, 40], xp_multiplier: 2.0, is_boss: true }] },
      9: { name: "虛空裂隙", sub_zones: [{ id: 1, name: "裂隙入口", difficulty: 17, monsters: [{ name: "虛空行者", hp: 1000, atk: 110, defense: 55, xp: 620 }], gold_reward: 8400, stone_drop: [18, 28], xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "虛空深層", difficulty: 20, monsters: [{ name: "虛空監視者", hp: 1400, atk: 140, defense: 70, xp: 850, is_elite: true }], gold_reward: 11500, stone_drop: [22, 34], xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "虛空核心", difficulty: 25, monsters: [{ name: "虛空吞噬者", hp: 2500, atk: 200, defense: 100, xp: 1400, is_boss: true }], gold_reward: 16500, stone_drop: [30, 48], xp_multiplier: 2.0, is_boss: true }] },
      10: { name: "混沌深淵", sub_zones: [{ id: 1, name: "深淵入口", difficulty: 20, monsters: [{ name: "混沌僕從", hp: 1300, atk: 130, defense: 65, xp: 820 }], gold_reward: 14500, stone_drop: [22, 34], xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "混沌領域", difficulty: 25, monsters: [{ name: "混沌衛士", hp: 2000, atk: 180, defense: 90, xp: 1200, is_elite: true }], gold_reward: 20000, stone_drop: [28, 44], xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "混沌王座", difficulty: 30, monsters: [{ name: "混沌之主", hp: 3500, atk: 260, defense: 130, xp: 2000, is_boss: true }], gold_reward: 30000, stone_drop: [40, 65], xp_multiplier: 2.0, is_boss: true }] },
    };

    const zoneData = subZones[zone];
    if (!zoneData) return null;
    return zoneData.sub_zones.find(sz => sz.id === subZone) || null;
  }
}

module.exports = { WanderingHeroAI, WANDERING_STATES };