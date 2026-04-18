/**
 * Hero Management Service
 * Handles hero creation, recruitment, training, and dispatch
 */

const WANDERING_HERO_TYPES = [
  { id: 'swordsman', name: '劍士', atkRatio: 4, defRatio: 1, hpRatio: 5, attackRange: 'melee' },
  { id: 'thief', name: '盜賊', atkRatio: 5, defRatio: 2, hpRatio: 3, attackRange: 'mid' },
  { id: 'archer', name: '弓箭手', atkRatio: 6, defRatio: 1, hpRatio: 3, attackRange: 'long' },
  { id: 'mage', name: '法師', atkRatio: 7, defRatio: 0, hpRatio: 3, attackRange: 'mid' },
  { id: 'priest', name: '牧師', atkRatio: 3, defRatio: 3, hpRatio: 4, attackRange: 'melee' },
  { id: 'ranger', name: '遊俠', atkRatio: 5, defRatio: 2, hpRatio: 4, attackRange: 'long' },
];

const RARITY_POINTS = { F: 10, E: 15, D: 20, C: 30, B: 45, A: 70, S: 100 };
const RARITY_WEIGHTS = { F: 0.28, E: 0.28, D: 0.24, C: 0.12, B: 0.05, A: 0.025, S: 0.005 };
const RARITY_NAMES = { F: 'F', E: 'E', D: 'D', C: 'C', B: 'B', A: 'A', S: 'S' };

const STAT_COST_ATK = 0.5;
const STAT_COST_DEF = 2.0;
const STAT_COST_HP = 2.0;

const MAX_HERO_LEVEL = 100;

const _HERO_NAMES = [
  '雲飛', '天翔', '凌風', '破軍', '玄武', '白虎', '青龍', '朱雀', '麒麟', '饕餮',
  '紫霞', '瓊華', '瑤池', '琉璃', '琥珀', '硨磲', '玳瑁', '翡翠', '珊瑚', '珍珠',
  '雲龍', '風虎', '雷鷹', '電獅', '烈焰', '寒冰', '疾風', '暴雪', '狂雷', '天罰',
  '素貞', '婉兒', '昭君', '貂蟬', '西施', '楊妃', '玉環', '飛燕', '貴妃', '神女',
  '夜羅', '幽冥', '虛無', '混沌', '太初', '隕星', '傲天', '裂空', '擎天', '鎮獄',
];

const RARITY_GOLD_REWARDS = { S: 500, A: 300, B: 200, C: 100, D: 50, E: 30, F: 20 };

/**
 * Calculate hero stats based on profession and rarity
 */
function calculateHeroStats(professionId, rarity, level = 1) {
  const totalPoints = RARITY_POINTS[rarity] || 20;
  const profession = WANDERING_HERO_TYPES.find(p => p.id === professionId) || WANDERING_HERO_TYPES[0];

  const atkPoints = totalPoints * profession.atkRatio / 10;
  const defPoints = totalPoints * profession.defRatio / 10;
  const hpPoints = totalPoints * profession.hpRatio / 10;

  const atk = Math.max(1, Math.floor(atkPoints * STAT_COST_ATK));
  const def = Math.max(1, Math.floor(defPoints * STAT_COST_DEF));
  const hp = Math.max(10, Math.floor(hpPoints * STAT_COST_HP));

  // Scale by level
  const levelMult = 1 + (level - 1) * 0.1;
  return {
    atk: Math.floor(atk * levelMult),
    def: Math.floor(def * levelMult),
    hp: Math.floor(hp * levelMult),
  };
}

/**
 * Get XP needed for a specific level
 */
function getXpForLevel(level) {
  if (level <= 1) return 100;
  if (level <= 15) {
    // Fast early: 100 * 1.5^(level-1) — first 15 levels relatively easy
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }
  // Slow late: level 15 base * 1.2^(level-15) — exponential slowdown after 15
  const base15 = Math.floor(100 * Math.pow(1.5, 14)); // ~169,000
  return Math.floor(base15 * Math.pow(1.2, level - 15));
}

/**
 * Get stat increase for leveling up
 */
function getStatIncreaseForLevel(newLevel) {
  // Generous stats for casual players — feel strong quickly
  return {
    hp: Math.floor(30 + newLevel * 6),
    atk: Math.floor(35 + newLevel * 6),
    def: Math.floor(20 + newLevel * 3),
  };
}

/**
 * Roll for hero rarity based on weights
 */
function rollRarity() {
  const roll = Math.random();
  let cumulative = 0;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    cumulative += weight;
    if (roll <= cumulative) return rarity;
  }
  return 'D';
}

const RARITY_GOLD_REWARDS = { S: 500, A: 300, B: 200, C: 100, D: 50, E: 30, F: 20 };

/**
 * Generate a random hero name
 */
function generateRandomName() {
  return _HERO_NAMES[Math.floor(Math.random() * _HERO_NAMES.length)];
}

/**
 * Calculate starting level for wandering hero based on territory heroes
 */
function calculateStartingLevel(user) {
  const territory = user.getTerritoryHeroes();
  if (territory.length === 0) return 1;

  const maxLevel = Math.max(...territory.map(h => h.level));
  return Math.max(1, Math.floor(Math.random() * maxLevel + 1));
}

/**
 * Calculate training cost
 */
function calculateTrainingCost(hero) {
  // Cheap training: 15 * (level-1), very affordable for casual players
  return 15 * Math.max(0, hero.level - 1);
}

class HeroManagementService {
  /**
   * Create a new wandering hero
   * @returns {Object|null} Created hero or null if no slots available
   */
  static createWanderingHero(user) {
    if (user.heroes.usedWanderingSlots >= user.wanderingHeroCap) {
      return null;
    }

    const heroType = WANDERING_HERO_TYPES[Math.floor(Math.random() * WANDERING_HERO_TYPES.length)];
    const rarity = rollRarity();
    const level = calculateStartingLevel(user);

    const stats = calculateHeroStats(heroType.id, rarity, level);

    const heroNumber = user.heroes.nextWanderingNumber++;
    const hero = user.addHero({
      id: `wand_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: generateRandomName(),
      heroNumber,
      type: 'wandering',
      profession: heroType.id,
      rarity,
      level,
      atk: stats.atk,
      def: stats.def,
      maxHp: stats.hp,
      currentHp: stats.hp,
      attackRange: heroType.attackRange || 'melee',
    });

    return hero;
  }

  /**
   * Recruit a wandering hero to territory
   */
  static recruitFromTavern(user, wanderingHeroId, newName = null) {
    // Check territory slots
    if (user.heroes.usedTerritorySlots >= user.territoryHeroCap) {
      return { success: false, reason: '領地英雄槽位已滿' };
    }

    // Check tavern exists
    if ((user.buildings?.tavern?.level || 0) < 1) {
      return { success: false, reason: '需要酒館才能招募' };
    }

    const hero = user.getHero(wanderingHeroId);
    if (!hero || hero.type !== 'wandering') {
      return { success: false, reason: '流浪英雄不存在' };
    }

    // Assign territory hero number (separate sequence from wandering)
    hero.heroNumber = user.heroes.nextTerritoryNumber++;

    // Convert to territory
    hero.type = 'territory';
    hero.name = newName || hero.name;
    hero.isExploring = false;
    hero.currentZone = null;
    hero.currentSubZone = null;
    hero.currentTeamIdx = null;

    // Award gold based on rarity and track in statistics
    const goldReward = RARITY_GOLD_REWARDS[hero.rarity] || 20;
    user.gold += goldReward;
    user.statistics.goldFromWandering += goldReward;

    user.heroes.usedWanderingSlots--;
    user.heroes.usedTerritorySlots++;
    user.statistics.heroesRecruited++;

    return { success: true, hero, goldEarned: goldReward };
  }

  /**
   * Recruit all wandering heroes
   */
  static recruitAll(user) {
    const wandering = user.getWanderingHeroes();
    const results = { recruited: [], failed: [] };

    for (const hero of wandering) {
      if (user.heroes.usedTerritorySlots >= user.territoryHeroCap) {
        results.failed.push(hero.name);
        continue;
      }

      const result = this.recruitFromTavern(user, hero.id);
      if (result.success) {
        results.recruited.push(result.hero.name);
      } else {
        results.failed.push(hero.name);
      }
    }

    return results;
  }

  /**
   * Expel a hero from the kingdom
   */
  static expelHero(user, heroId) {
    const hero = user.getHero(heroId);
    if (!hero) {
      return { success: false, reason: '英雄不存在' };
    }

    // Can't expel exploring heroes
    if (hero.isExploring) {
      return { success: false, reason: '正在探索中的英雄無法驅逐' };
    }

    // Remove from team if in one
    if (hero.currentTeamIdx !== null) {
      user.removeHeroFromTeam(heroId);
    }

    user.removeHero(heroId);
    user.statistics.heroesExpelled++;
    return { success: true };
  }

  /**
   * Train a hero to increase level
   */
  static trainHero(user, heroId) {
    const hero = user.getHero(heroId);
    if (!hero) {
      return { success: false, reason: '英雄不存在' };
    }

    if (hero.type !== 'territory') {
      return { success: false, reason: '只能訓練領地英雄' };
    }

    if (hero.level >= MAX_HERO_LEVEL) {
      return { success: false, reason: '已達最高等級' };
    }

    const cost = calculateTrainingCost(hero);
    if (user.gold < cost) {
      return { success: false, reason: `需要 ${cost} 黃金訓練` };
    }

    user.gold -= cost;
    hero.level++;
    hero.currentHp = hero.maxHp; // Full heal on level up

    const statIncrease = getStatIncreaseForLevel(hero.level);
    hero.maxHp += statIncrease.hp;
    hero.atk += statIncrease.atk;
    hero.def += statIncrease.def;

    user.statistics.heroesTrained++;

    return {
      success: true,
      hero,
      statIncrease,
      newLevel: hero.level,
    };
  }

  /**
   * Dispatch a hero to explore a zone
   */
  static dispatchHero(user, heroId, zone = 1, difficulty = 1, teamIdx = null) {
    const hero = user.getHero(heroId);
    if (!hero) {
      return { success: false, reason: '英雄不存在' };
    }

    if (hero.isExploring) {
      return { success: false, reason: '英雄正在探索中' };
    }

    if (hero.type !== 'territory') {
      return { success: false, reason: '只能派遣領地英雄' };
    }

    // Validate zone range (1-10)
    if (zone < 1 || zone > 10) {
      return { success: false, reason: '無效的區域 (1-10)' };
    }

    // Validate difficulty (1-3)
    if (difficulty < 1 || difficulty > 3) {
      return { success: false, reason: '無效的難度 (1-3)' };
    }

    // Handle team dispatch
    if (teamIdx !== null) {
      // Handle multi-team (comma-separated string like "0,1")
      if (typeof teamIdx === 'string' && teamIdx.includes(',')) {
        // Multi-team: assign to first team for this dispatch
        // Multi-team combat would need separate handling
        const teams = teamIdx.split(',').map((t) => parseInt(t.trim(), 10)).filter((t) => !isNaN(t) && t >= 0 && t <= 4);
        if (teams.length === 0) {
          // No valid team, treat as no team assignment
          user.removeHeroFromTeam(heroId);
        } else {
          // Assign to first team (multi-team exploration combat not yet implemented)
          user.addHeroToTeam(heroId, teams[0]);
        }
      } else if (teamIdx === -2 || teamIdx === -1) {
        // -2 = no_team, -1 = null-like: don't assign to team
        user.removeHeroFromTeam(heroId);
      } else {
        const tIdx = parseInt(teamIdx, 10);
        if (isNaN(tIdx) || tIdx < 0 || tIdx > 4) {
          return { success: false, reason: '無效的團隊 (0-4)' };
        }
        user.addHeroToTeam(heroId, tIdx);
      }
    } else {
      // Remove from any current team
      user.removeHeroFromTeam(heroId);
    }

    hero.isExploring = true;
    hero.currentZone = zone;
    hero.currentSubZone = difficulty;
    hero.explorationTicks = 0;

    return { success: true, hero };
  }

  /**
   * Recall an exploring hero
   */
  static recallHero(user, heroId = null) {
    if (heroId) {
      const hero = user.getHero(heroId);
      if (!hero) {
        return { success: false, reason: '英雄不存在' };
      }
      if (!hero.isExploring) {
        return { success: false, reason: '英雄不在探索中' };
      }

      // Save last zone for display before clearing
      hero.lastZone = hero.currentZone;
      hero.lastSubZone = hero.currentSubZone;
      hero.isExploring = false;
      hero.currentZone = null;
      hero.currentSubZone = null;
      hero.explorationTicks = 0;
      user.removeHeroFromTeam(heroId);

      return { success: true, hero };
    } else {
      // Recall all
      const exploring = user.getExploringHeroes();
      for (const hero of exploring) {
        hero.lastZone = hero.currentZone;
        hero.lastSubZone = hero.currentSubZone;
        hero.isExploring = false;
        hero.currentZone = null;
        hero.currentSubZone = null;
        user.removeHeroFromTeam(hero.id);
      }
      return { success: true, count: exploring.length };
    }
  }

  /**
   * Add XP to a hero and handle level up
   */
  static addXp(user, heroId, xpAmount) {
    const hero = user.getHero(heroId);
    if (!hero) return null;

    hero.experience += xpAmount;
    hero.totalXp += xpAmount;

    let leveledUp = false;
    while (hero.experience >= getXpForLevel(hero.level) && hero.level < MAX_HERO_LEVEL) {
      hero.experience -= getXpForLevel(hero.level);
      hero.level++;
      hero.currentHp = hero.maxHp; // Full heal

      const statIncrease = getStatIncreaseForLevel(hero.level);
      hero.maxHp += statIncrease.hp;
      hero.atk += statIncrease.atk;
      hero.def += statIncrease.def;

      leveledUp = true;
    }

    return { hero, leveledUp };
  }

  /**
   * Apply hunger/thirst damage to hero
   */
  static applyHungerThirst(user, heroId, hungerDecay, thirstDecay) {
    const hero = user.getHero(heroId);
    if (!hero) return null;

    hero.hunger = Math.max(0, hero.hunger - hungerDecay);
    hero.thirst = Math.max(0, hero.thirst - thirstDecay);

    return hero;
  }

  /**
   * Feed a hero with rations
   */
  static feedHero(user, heroId) {
    const hero = user.getHero(heroId);
    if (!hero) return { success: false, reason: '英雄不存在' };

    const rations = user.materials.get('rations') || 0;
    if (rations < 1) {
      return { success: false, reason: '沒有口糧' };
    }

    if (hero.hunger >= 100) {
      return { success: false, reason: '英雄不需要食物' };
    }

    user.materials.set('rations', rations - 1);
    hero.hunger = Math.min(100, hero.hunger + 30);

    return { success: true, hero };
  }

  /**
   * Give water to a hero
   */
  static giveWater(user, heroId) {
    const hero = user.getHero(heroId);
    if (!hero) return { success: false, reason: '英雄不存在' };

    const water = user.materials.get('drinking_water') || 0;
    if (water < 1) {
      return { success: false, reason: '沒有飲用水' };
    }

    if (hero.thirst >= 100) {
      return { success: false, reason: '英雄不需要水' };
    }

    user.materials.set('drinking_water', water - 1);
    hero.thirst = Math.min(100, hero.thirst + 30);

    return { success: true, hero };
  }

  /**
   * Use potion on a hero
   */
  static usePotion(user, heroId) {
    const hero = user.getHero(heroId);
    if (!hero) return { success: false, reason: '英雄不存在' };

    const potions = user.materials.get('potions') || 0;
    if (potions < 1) {
      return { success: false, reason: '沒有藥水' };
    }

    if (hero.currentHp >= hero.maxHp) {
      return { success: false, reason: '英雄生命值已滿' };
    }

    user.materials.set('potions', potions - 1);
    const healAmount = Math.floor(hero.maxHp * 0.5);
    hero.currentHp = Math.min(hero.maxHp, hero.currentHp + healAmount);

    return { success: true, hero, healAmount };
  }

  /**
   * Get hero info for display
   */
  static getHeroInfo(hero) {
    const isAlive = hero.currentHp > 0;
    const isHungry = hero.hunger < 30;
    const isThirsty = hero.thirst < 30;
    const isWeakened = isHungry || isThirsty;

    const effectiveAtk = isWeakened ? Math.floor(hero.atk * 0.5) : hero.atk;
    const effectiveDef = isWeakened ? Math.floor(hero.def * 0.5) : hero.def;

    const profession = WANDERING_HERO_TYPES.find(p => p.id === hero.profession);

    return {
      id: hero.id,
      name: hero.name,
      type: hero.type,
      profession: profession?.name || hero.profession,
      rarity: hero.rarity,
      level: hero.level,
      atk: hero.atk,
      def: hero.def,
      maxHp: hero.maxHp,
      currentHp: hero.currentHp,
      experience: hero.experience,
      xpToNext: getXpForLevel(hero.level),
      xpProgress: hero.experience / getXpForLevel(hero.level),
      isExploring: hero.isExploring,
      currentZone: hero.currentZone,
      currentSubZone: hero.currentSubZone,
      lastZone: hero.lastZone,
      lastSubZone: hero.lastSubZone,
      currentTeamIdx: hero.currentTeamIdx,
      hunger: hero.hunger,
      thirst: hero.thirst,
      attackRange: hero.attackRange || 'melee',
      isAlive,
      isHungry,
      isThirsty,
      isWeakened,
      effectiveAtk,
      effectiveDef,
      equipment: hero.equipment,
    };
  }

  /**
   * Fix and renumber all heroes (wandering and territory) for a user
   * Call this if hero numbers are messed up
   */
  static fixHeroNumbers(user) {
    const wandering = user.getWanderingHeroes();
    const territory = user.getTerritoryHeroes();

    // Renumber wandering heroes in spawn order (1, 2, 3...)
    let nextWandering = 1;
    for (const hero of wandering) {
      hero.heroNumber = nextWandering++;
    }
    user.heroes.nextWanderingNumber = nextWandering;

    // Renumber territory heroes in recruitment order (1, 2, 3...)
    let nextTerritory = 1;
    for (const hero of territory) {
      hero.heroNumber = nextTerritory++;
    }
    user.heroes.nextTerritoryNumber = nextTerritory;

    return { wanderingRenumbered: wandering.length, territoryRenumbered: territory.length };
  }
}

module.exports = {
  HeroManagementService,
  WANDERING_HERO_TYPES,
  RARITY_POINTS,
  RARITY_NAMES,
  calculateHeroStats,
  getXpForLevel,
  getStatIncreaseForLevel,
};
