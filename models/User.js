const mongoose = require("mongoose");

// =============================================================================
// Hero Schema - Used within HeroManager
// =============================================================================
const heroSchema = new mongoose.Schema({
  id: String,
  name: String,
  heroNumber: Number,  // Sequential number: w_1, w_2... for wandering, h_1, h_2... for territory
  type: { type: String, enum: ["territory", "wandering"], required: true },
  // Profession (from WANDERING_HERO_TYPES)
  profession: { type: String, default: "swordsman" },
  // Rarity (F, E, D, C, B, A, S)
  rarity: { type: String, default: "D" },
  // Level & Stats
  level: { type: Number, default: 1 },
  atk: { type: Number, default: 10 },
  def: { type: Number, default: 5 },
  maxHp: { type: Number, default: 100 },
  currentHp: { type: Number, default: 100 },
  // XP System
  experience: { type: Number, default: 0 },
  totalXp: { type: Number, default: 0 },
  // Exploration State
  isExploring: { type: Boolean, default: false },
  currentZone: { type: Number, default: null },
  currentSubZone: { type: Number, default: null },
  lastZone: { type: Number, default: null },   // Last explored zone (for display on idle heroes)
  lastSubZone: { type: Number, default: null }, // Last explored sub-zone (for display on idle heroes)
  currentTeamIdx: { type: Number, default: null }, // 0-4 for teams
  // Hunger/Thirst System
  hunger: { type: Number, default: 100 }, // 0-100
  thirst: { type: Number, default: 100 }, // 0-100
  // Attack Range
  attackRange: { type: String, enum: ['melee', 'mid', 'long'], default: 'melee' },
  // Equipment
  equipment: {
    weapon: String,
    armor: String,
    helmet: String,
    accessory: String,
  },
}, { _id: false });

// =============================================================================
// Building Schema - Flat structure for kingdom buildings
// =============================================================================
const kingdomBuildingSchema = new mongoose.Schema({
  level: { type: Number, default: 0 },
}, { _id: false });

// =============================================================================
// User Schema - Main user document
// =============================================================================
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: String,
  email: { type: String, unique: true, sparse: true },
  passwordHash: String,
  authProvider: { type: String, enum: ["discord", "email"], default: "discord" },
  createdAt: { type: Date, default: Date.now },
  lastTick: { type: Date, default: Date.now },

  // Soft delete - timestamp when user deleted, null if active
  deletedAt: { type: Date, default: null },

  // World Boss state
  worldBoss: {
    totalDamage: { type: Number, default: 0 },
    lastAttack: { type: Number, default: 0 },
  },

  // =============================================================================
  // Resources - Kingdom style
  // =============================================================================
  gold: { type: Number, default: 100 },
  magicStones: { type: Number, default: 0 },
  // Materials: fruit, water, wood, iron, herbs, rations, drinking_water, potions
  materials: { type: Map, of: Number, default: () => new Map([
    ["fruit", 50],
    ["water", 50],
    ["wood", 0],
    ["iron", 0],
    ["herbs", 0],
    ["rations", 0],
    ["drinking_water", 0],
    ["potions", 0],
  ])},

  // =============================================================================
  // Hero Manager - Unified hero roster
  // =============================================================================
  heroes: {
    usedTerritorySlots: { type: Number, default: 0 },
    usedWanderingSlots: { type: Number, default: 0 },
    nextTerritoryNumber: { type: Number, default: 1 },  // For h_1, h_2... sequential numbers
    nextWanderingNumber: { type: Number, default: 1 },  // For w_1, w_2... sequential numbers
    roster: { type: [heroSchema], default: [] },
  },

  // =============================================================================
  // Teams - 5 teams for group exploration
  // =============================================================================
  teams: { type: Map, of: [String], default: () => new Map([
    ["0", []],
    ["1", []],
    ["2", []],
    ["3", []],
    ["4", []],
  ])},

  // =============================================================================
  // Battle Logs - Combat history records
  // =============================================================================
  battleLogs: [{
    id: { type: String, default: () => `log_${Date.now()}_${Math.random().toString(36).slice(2,8)}` },
    category: { type: String, enum: ['team_combat', 'solo_combat', 'worldboss', 'other'], required: true },
    timestamp: { type: Number, default: () => Date.now() },
    // combat fields
    zone: { type: Number, default: null },
    difficulty: { type: Number, default: null },
    teamIdx: { type: Number, default: null },
    heroName: { type: String, default: null },
    heroNames: { type: [String], default: [] },
    victory: { type: Boolean, default: false },
    damageDealt: { type: Number, default: 0 },
    xpGained: { type: Number, default: 0 },
    goldReward: { type: Number, default: 0 },
    magicStonesFound: { type: Number, default: 0 },
    logMessages: { type: [String], default: [] },
    // other event fields
    event: { type: String, default: null },
    description: { type: String, default: null },
  }],

  // =============================================================================
  // Snapshots for event detection — compared each tick to detect changes
  // =============================================================================
  lastSnapshots: {
    heroes: [{
      heroId: String,
      hp: Number,
      maxHp: Number,
      hunger: Number,
      thirst: Number,
      isExploring: Boolean,
      zone: Number,
      subZone: Number,
      explorationTicks: Number,
      level: Number,
    }],
    resources: {
      gold: Number,
      materials: { type: Map, of: Number },
      lastContribution: { type: Number, default: 0 },
    },
  },

  // =============================================================================
  // Buildings - Kingdom style (flat structure)
  // =============================================================================
  buildings: {
    castle: { level: { type: Number, default: 1 } },
    tavern: { level: { type: Number, default: 1 } },
    monument: { level: { type: Number, default: 1 } },
    warehouse: { level: { type: Number, default: 0 } },
    guildHall: { level: { type: Number, default: 0 } },
    weaponShop: { level: { type: Number, default: 0 } },
    armorShop: { level: { type: Number, default: 0 } },
    potionShop: { level: { type: Number, default: 0 } },
    lumberMill: { level: { type: Number, default: 0 } },
    mine: { level: { type: Number, default: 0 } },
    herbGarden: { level: { type: Number, default: 0 } },
    barracks: { level: { type: Number, default: 0 } },
    archery: { level: { type: Number, default: 0 } },
  },

  // =============================================================================
  // Guild System - Player guild data
  // =============================================================================
  guild: {
    name: { type: String, default: "無公會" },
    level: { type: Number, default: 0 },
    totalDamageToBoss: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    contribution: { type: Number, default: 0 },
    dailyTasks: [{
      id: { type: Number, default: () => Date.now() },
      type: { type: String, enum: ['kill', 'collect', 'explore'], required: true },
      description: { type: String, required: true },
      target: { type: Number, required: true },
      progress: { type: Number, default: 0 },
      reward: {
        gold: { type: Number, default: 0 },
        magicStone: { type: Number, default: 0 },
      },
      completed: { type: Boolean, default: false },
    }],
    lastTaskRefresh: { type: Number, default: 0 },
  },

  // =============================================================================
  // Inventory - Equipment and items
  // =============================================================================
  inventory: {
    weapons: { type: Map, of: Number, default: new Map() },
    armor: { type: Map, of: Number, default: new Map() },
    helmets: { type: Map, of: Number, default: new Map() },
    accessories: { type: Map, of: Number, default: new Map() },
    potions: { type: Map, of: Number, default: new Map() },
  },

  // =============================================================================
  // Army - Military units and armory equipment
  // =============================================================================
  army: {
    units: {
      archery: {
        huntsman: { type: Number, default: 0 },
        archer: { type: Number, default: 0 },
        ranger: { type: Number, default: 0 },
        survivalist: { type: Number, default: 0 },
        sharpshooter: { type: Number, default: 0 },
      },
      barracks: {
        peasant: { type: Number, default: 5 },
        militia: { type: Number, default: 0 },
        guardsman: { type: Number, default: 0 },
        knight: { type: Number, default: 0 },
        berserker: { type: Number, default: 0 },
        justicar: { type: Number, default: 0 },
      },
    },
    armory: {
      helmet: { type: Map, of: Number, default: new Map() },
      chest: { type: Map, of: Number, default: new Map() },
      legging: { type: Map, of: Number, default: new Map() },
      weapon: { type: Map, of: Number, default: new Map() },
    },
  },

  // =============================================================================
  // Cooldowns
  // =============================================================================
  cooldowns: {
    dispatch: Date,
    daily: Date,
    weekly: Date,
    build: Date,
  },

  // =============================================================================
  // Exploration Combat State (for turn-based tick processing)
  // =============================================================================
  explorationState: {
    zone: Number,
    subZone: Number,
    enemyName: String,
    enemyCurrentHp: Number,
    enemyMaxHp: Number,
    enemyAtk: Number,
    enemyDef: Number,
    isBoss: Boolean,
    isElite: Boolean,
    heroes: [{
      id: String,
      name: String,
      atk: Number,
      def: Number,
      currentHp: Number,
      maxHp: Number,
    }],
    round: Number,
    logMessages: [String],
    goldReward: Number,
    xpReward: Number,
  },

  // =============================================================================
  // Statistics
  // =============================================================================
  statistics: {
    hunts: { type: Number, default: 0 },
    explorations: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    goldEarned: { type: Number, default: 0 },
    goldSpent: { type: Number, default: 0 },
    goldFromWandering: { type: Number, default: 0 },
    goldFromExploration: { type: Number, default: 0 },
    heroesRecruited: { type: Number, default: 0 },
    heroesTrained: { type: Number, default: 0 },
    heroesExpelled: { type: Number, default: 0 },
    buildingsBuilt: { type: Number, default: 0 },
    buildingsUpgraded: { type: Number, default: 0 },
    dailyClaims: { type: Number, default: 0 },
    weeklyClaims: { type: Number, default: 0 },
    consecutiveDays: { type: Number, default: 0 },
    consecutiveWeeks: { type: Number, default: 0 },
    zonesExplored: { type: Map, of: Number, default: new Map() },
    bossesDefeated: { type: Number, default: 0 },
    firstPlayTime: Date,
    lastActiveTime: Date,
  },

  // =============================================================================
  // Exploration Progress
  // =============================================================================
  unlockedZones: { type: [Number], default: [1] },
  currentZone: { type: Number, default: 1 },
  defeatedBosses: { type: [Number], default: [] },
}, { versionKey: false });

// =============================================================================
// Indexes for soft delete and query performance
// =============================================================================
userSchema.index({ deletedAt: 1 });
userSchema.index({ userId: 1, deletedAt: 1 });

// =============================================================================
// Virtual Getters
// =============================================================================

// Gold capacity based on warehouse level — generous for casual players
userSchema.virtual('goldCapacity').get(function() {
  const warehouseLevel = this.buildings?.warehouse?.level || 0;
  return 100000 + (warehouseLevel * 50000);
});

// Material capacity based on warehouse level
userSchema.virtual('materialCapacity').get(function() {
  const warehouseLevel = this.buildings?.warehouse?.level || 0;
  return 500 + (warehouseLevel * 100);
});

// Territory hero cap based on castle level (max 48 for 2 menu rows)
userSchema.virtual('territoryHeroCap').get(function() {
  const castleLevel = this.buildings?.castle?.level || 0;
  return Math.min(5 + (castleLevel * 2), 48);
});

// Wandering hero cap based on castle level (max 72 for 3 menu rows)
userSchema.virtual('wanderingHeroCap').get(function() {
  const castleLevel = this.buildings?.castle?.level || 0;
  return Math.min(10 + (castleLevel * 3), 72);
});

// Battle history - sorted battle logs (newest first, max 50)
userSchema.virtual('battleHistory').get(function() {
  return (this.battleLogs || []).sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
});

// =============================================================================
// Instance Methods - Resources
// =============================================================================

userSchema.methods.addGold = function(amount) {
  const before = this.gold;
  this.gold = Math.min(this.gold + amount, this.goldCapacity);
  const actual = this.gold - before;
  this.statistics.goldEarned += actual;
  return this.save();
};

userSchema.methods.spendGold = function(amount) {
  if (this.gold < amount) return false;
  this.gold -= amount;
  this.statistics.goldSpent += amount;
  return true;
};

userSchema.methods.addMaterial = function(type, amount) {
  const current = this.materials.get(type) || 0;
  const capacity = this.materialCapacity;
  const newAmount = Math.min(current + amount, capacity);
  this.materials.set(type, newAmount);
  return this.save();
};

userSchema.methods.spendMaterial = function(type, amount) {
  const current = this.materials.get(type) || 0;
  if (current < amount) return false;
  this.materials.set(type, current - amount);
  return true;
};

userSchema.methods.canAfford = function(cost) {
  if (cost.gold && this.gold < cost.gold) return false;
  for (const [mat, amt] of Object.entries(cost)) {
    if (mat === 'gold') continue;
    if ((this.materials.get(mat) || 0) < amt) return false;
  }
  return true;
};

userSchema.methods.spendResources = function(cost) {
  if (!this.canAfford(cost)) return false;
  if (cost.gold) this.gold -= cost.gold;
  for (const [mat, amt] of Object.entries(cost)) {
    if (mat === 'gold') continue;
    this.materials.set(mat, (this.materials.get(mat) || 0) - amt);
  }
  return true;
};

// =============================================================================
// Instance Methods - Battle Logs
// =============================================================================

userSchema.methods.addBattleLog = function(entry) {
  if (!this.battleLogs) this.battleLogs = [];
  const now = Date.now();

  // No deduplication for combat logs — every combat encounter is recorded.
  // 50-entry cap naturally handles overflow; explorationResult deduplication
  // is handled upstream in EventDetectionService if needed.

  const logEntry = {
    id: `log_${now}_${Math.random().toString(36).slice(2,8)}`,
    timestamp: now,
    ...entry,
  };
  this.battleLogs.unshift(logEntry);  // newest first
  // Keep max 50 entries
  if (this.battleLogs.length > 50) {
    this.battleLogs = this.battleLogs.slice(0, 50);
  }
  // Mark as modified so Mongoose saves the change
  this.markModified('battleLogs');
  return logEntry;
};

// =============================================================================
// Instance Methods - Buildings
// =============================================================================

userSchema.methods.getBuildingLevel = function(type) {
  return this.buildings?.[type]?.level || 0;
};

userSchema.methods.upgradeBuilding = function(type, cost) {
  if (!this.canAfford(cost)) return { success: false, reason: '資源不足' };
  if (!this.buildings[type]) return { success: false, reason: '建築不存在' };

  const currentLevel = this.buildings[type].level;
  const maxLevel = 10;
  if (currentLevel >= maxLevel) return { success: false, reason: '已達最高等級' };

  this.spendResources(cost);
  this.buildings[type].level++;
  this.statistics.buildingsUpgraded++;

  return { success: true, newLevel: this.buildings[type].level };
};

userSchema.methods.buildStructure = function(type, cost) {
  if (!this.canAfford(cost)) return { success: false, reason: '資源不足' };
  if (this.buildings[type]?.level > 0) return { success: false, reason: '建築已存在' };

  this.spendResources(cost);
  this.buildings[type] = { level: 1 };
  this.statistics.buildingsBuilt++;

  return { success: true };
};

// =============================================================================
// Instance Methods - Heroes
// =============================================================================

userSchema.methods.getHero = function(heroId) {
  return this.heroes.roster.find(h => h.id === heroId);
};

userSchema.methods.getTerritoryHeroes = function() {
  return this.heroes.roster.filter(h => h.type === 'territory');
};

userSchema.methods.getWanderingHeroes = function() {
  return this.heroes.roster.filter(h => h.type === 'wandering');
};

userSchema.methods.getExploringHeroes = function() {
  return this.heroes.roster.filter(h => h.isExploring);
};

userSchema.methods.getIdleHeroes = function() {
  return this.heroes.roster.filter(h => !h.isExploring);
};

userSchema.methods.addHero = function(heroData) {
  const heroesConst = require('../lib/game/_CONSTS/heroes');

  const hero = {
    id: heroData.id || `hero_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: heroData.name,
    type: heroData.type,
    profession: heroData.profession || 'Warrior',
    rarity: heroData.rarity || 'D',
    level: heroData.level || 1,
    atk: heroData.atk || 10,
    def: heroData.def || 5,
    maxHp: heroData.maxHp || 100,
    currentHp: heroData.currentHp || heroData.maxHp || 100,
    experience: 0,
    totalXp: 0,
    isExploring: false,
    currentZone: null,
    currentSubZone: null,
    currentTeamIdx: null,
    hunger: 100,
    thirst: 100,
    attackRange: heroData.attackRange || 'melee',
    equipment: { weapon: null, armor: null, helmet: null, accessory: null },
  };

  // Apply starting equipment based on profession
  const startingEquip = heroesConst.startingEquipment?.[hero.profession];
  if (startingEquip) {
    if (startingEquip.weapon) hero.equipment.weapon = startingEquip.weapon;
    if (startingEquip.armor) hero.equipment.armor = startingEquip.armor;
  }

  this.heroes.roster.push(hero);

  if (hero.type === 'territory') {
    this.heroes.usedTerritorySlots++;
  } else {
    this.heroes.usedWanderingSlots++;
  }

  return hero;
};

userSchema.methods.removeHero = function(heroId) {
  const hero = this.getHero(heroId);
  if (!hero) return null;

  if (hero.type === 'territory') {
    this.heroes.usedTerritorySlots--;
  } else {
    this.heroes.usedWanderingSlots--;
  }

  this.heroes.roster = this.heroes.roster.filter(h => h.id !== heroId);
  return hero;
};

// =============================================================================
// Instance Methods - Tick Processing
// =============================================================================

userSchema.methods.processIdleTick = function() {
  const now = Date.now();
  const tickInterval = 5000; // 5 seconds
  const lastTick = this.lastTick ? new Date(this.lastTick).getTime() : now;

  const elapsed = now - lastTick;
  const ticks = Math.floor(elapsed / tickInterval);

  // Always produce at least 1 tick's worth per call (worker guarantees every 5s)
  const ticksToApply = Math.max(1, ticks);

  if (ticksToApply <= 0) return this;

  // 1. Monument Production - produces raw materials
  // Generous base production for casual players — satisfying idle gains
  const monumentLevel = this.buildings?.monument?.level || 0;
  if (monumentLevel > 0) {
    const baseProduction = 5; // Good idle income
    const monumentBonus = 1 + (monumentLevel * 0.12);

    const materialsToProduce = ['fruit', 'water', 'wood', 'iron', 'herbs'];
    const bonuses = {
      fruit: monumentBonus,
      water: monumentBonus,
      wood: monumentBonus * (1 + (this.buildings?.lumberMill?.level || 0) * 0.5),
      iron: monumentBonus * (1 + (this.buildings?.mine?.level || 0) * 0.5),
      herbs: monumentBonus * (1 + (this.buildings?.herbGarden?.level || 0) * 0.5),
    };

    materialsToProduce.forEach(mat => {
      const produced = Math.floor(baseProduction * ticksToApply * (bonuses[mat] || monumentBonus));
      const current = this.materials.get(mat) || 0;
      const capacity = this.materialCapacity;
      this.materials.set(mat, Math.min(current + produced, capacity));
    });

    // Defensive gold cap after monument production loop
    // Guard against undefined gold (old documents created before this field existed)
    this.gold = Math.min(this.gold ?? 0, this.goldCapacity);
  }

  // 2. Tavern Production - consumes fruit + water -> rations + drinking_water
  const tavernLevel = this.buildings?.tavern?.level || 0;
  if (tavernLevel > 0) {
    const fruitConsumed = Math.min(this.materials.get('fruit') || 0, 5 * tavernLevel);
    const waterConsumed = Math.min(this.materials.get('water') || 0, 5 * tavernLevel);

    if (fruitConsumed >= 5 * tavernLevel && waterConsumed >= 5 * tavernLevel) {
      this.materials.set('fruit', (this.materials.get('fruit') || 0) - fruitConsumed);
      this.materials.set('water', (this.materials.get('water') || 0) - waterConsumed);

      const rationsProduced = 3 * tavernLevel;
      const waterProduced = 3 * tavernLevel;
      this.materials.set('rations', (this.materials.get('rations') || 0) + rationsProduced);
      this.materials.set('drinking_water', (this.materials.get('drinking_water') || 0) + waterProduced);
    }
  }

  // 3. Potion Shop Production - consumes herbs -> potions
  const potionShopLevel = this.buildings?.potionShop?.level || 0;
  if (potionShopLevel > 0) {
    const herbsConsumed = Math.min(this.materials.get('herbs') || 0, 3 * potionShopLevel);

    if (herbsConsumed >= 3 * potionShopLevel) {
      this.materials.set('herbs', (this.materials.get('herbs') || 0) - herbsConsumed);
      const potionsProduced = 2 * potionShopLevel;
      this.materials.set('potions', (this.materials.get('potions') || 0) + potionsProduced);
    }
  }

  this.lastTick = new Date();
  return this.save();
};

// =============================================================================
// Instance Methods - Cooldowns
// =============================================================================

userSchema.methods.setCooldown = function(action) {
  this.cooldowns[action] = new Date();
  return this.save();
};

userSchema.methods.isOnCooldown = function(action) {
  return this.cooldowns?.[action] !== undefined;
};

userSchema.methods.getCooldownRemaining = function(action) {
  const last = this.cooldowns?.[action];
  if (!last) return 0;

  const baseMs = {
    dispatch: 30000,    // 30 seconds — casual friendly
    build: 300000,      // 5 minutes
    daily: 86400000,    // 24 hours
    weekly: 604800000,  // 7 days
  };

  const elapsed = Date.now() - new Date(last).getTime();
  const remaining = (baseMs[action] || 60000) - elapsed;
  return Math.max(0, remaining);
};

// =============================================================================
// Instance Methods - Teams
// =============================================================================

userSchema.methods.addHeroToTeam = function(heroId, teamIdx) {
  if (teamIdx < 0 || teamIdx > 4) return false;
  const hero = this.getHero(heroId);
  if (!hero) return false;

  // Remove from current team
  if (hero.currentTeamIdx !== null) {
    const currentTeam = this.teams.get(String(hero.currentTeamIdx)) || [];
    this.teams.set(String(hero.currentTeamIdx), currentTeam.filter(id => id !== heroId));
  }

  // Add to new team
  const team = this.teams.get(String(teamIdx)) || [];
  if (!team.includes(heroId)) {
    team.push(heroId);
    this.teams.set(String(teamIdx), team);
  }
  hero.currentTeamIdx = teamIdx;

  return true;
};

userSchema.methods.removeHeroFromTeam = function(heroId) {
  const hero = this.getHero(heroId);
  if (!hero || hero.currentTeamIdx === null) return false;

  const team = this.teams.get(String(hero.currentTeamIdx)) || [];
  this.teams.set(String(hero.currentTeamIdx), team.filter(id => id !== heroId));
  hero.currentTeamIdx = null;

  return true;
};

// =============================================================================
// Static Methods
// =============================================================================

userSchema.statics.getOrCreate = async function(userId, username, authProvider = "discord") {
  let user = await this.findOne({ userId });
  if (!user) {
    user = new this({
      userId,
      username,
      authProvider,
      lastTick: new Date(),
      statistics: {
        firstPlayTime: new Date(),
        lastActiveTime: new Date(),
      },
    });
    await user.save();
  }
  return user;
};

userSchema.statics.findByEmail = async function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.register = async function({ email, password, username }) {
  const existing = await this.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new Error("這個電子郵件已經被註冊過了");
  }
  const bcrypt = require("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const user = new this({
    userId,
    username: username || `Player_${userId.slice(-4)}`,
    email: email.toLowerCase(),
    passwordHash,
    authProvider: "email",
    lastTick: new Date(),
    statistics: {
      firstPlayTime: new Date(),
      lastActiveTime: new Date(),
    },
  });
  await user.save();
  return user;
};

userSchema.methods.verifyPassword = async function(password) {
  const bcrypt = require("bcryptjs");
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
