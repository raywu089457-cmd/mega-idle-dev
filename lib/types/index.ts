// =============================================================================
// Hero Types
// =============================================================================

export type HeroType = "territory" | "wandering";
export type Rarity = "F" | "E" | "D" | "C" | "B" | "A" | "S";
export type AttackRange = "melee" | "mid" | "long";

export interface HeroEquipment {
  weapon: string | null;
  armor: string | null;
  helmet: string | null;
  accessory: string | null;
}

export interface Hero {
  id: string;
  name: string;
  heroNumber: number;
  type: HeroType;
  profession: string;
  rarity: Rarity;
  level: number;
  atk: number;
  def: number;
  maxHp: number;
  currentHp: number;
  experience: number;
  totalXp: number;
  isExploring: boolean;
  currentZone: number | null;
  currentSubZone: number | null;
  lastZone: number | null;
  lastSubZone: number | null;
  currentTeamIdx: number | null;
  hunger: number;
  thirst: number;
  attackRange: AttackRange;
  equipment: HeroEquipment;
}

export interface HeroRoster {
  usedTerritorySlots: number;
  usedWanderingSlots: number;
  nextTerritoryNumber: number;
  nextWanderingNumber: number;
  roster: Hero[];
}

// =============================================================================
// Resource Types
// =============================================================================

export type MaterialType = "fruit" | "water" | "wood" | "iron" | "herbs" | "rations" | "drinking_water" | "potions";

export interface Resources {
  gold: number;
  magicStones: number;
  materials: Partial<Record<MaterialType, number>>;
}

// =============================================================================
// Building Types
// =============================================================================

export type BuildingType =
  | "castle" | "tavern" | "monument" | "warehouse"
  | "weaponShop" | "armorShop" | "potionShop"
  | "lumberMill" | "mine" | "herbGarden"
  | "guildHall" | "barracks" | "archery";

export interface BuildingLevel {
  level: number;
}

export interface Buildings {
  castle: BuildingLevel;
  tavern: BuildingLevel;
  monument: BuildingLevel;
  warehouse: BuildingLevel;
  guildHall: BuildingLevel;
  weaponShop: BuildingLevel;
  armorShop: BuildingLevel;
  potionShop: BuildingLevel;
  lumberMill: BuildingLevel;
  mine: BuildingLevel;
  herbGarden: BuildingLevel;
  barracks: BuildingLevel;
  archery: BuildingLevel;
}

// =============================================================================
// Item Types
// =============================================================================

export type ItemType = "weapon" | "armor" | "helmet" | "accessory";

export interface ItemStats {
  attack?: number;
  defense?: number;
  hp?: number;
}

export interface ItemCost {
  gold?: number;
  fruit?: number;
  water?: number;
  wood?: number;
  iron?: number;
  herbs?: number;
  magic_stone?: number;
  rations?: number;
  drinking_water?: number;
}

export interface ItemEntry {
  name: string;
  type: ItemType;
  cost: ItemCost;
  price: number;
  stats: ItemStats;
  isLegendary?: boolean;
}

// =============================================================================
// Team Types
// =============================================================================

export type TeamIndex = "0" | "1" | "2" | "3" | "4";

export interface Teams {
  "0": string[];
  "1": string[];
  "2": string[];
  "3": string[];
  "4": string[];
}

// =============================================================================
// Battle Log Types
// =============================================================================

export type BattleLogCategory = "team_combat" | "solo_combat" | "worldboss" | "other";

export interface BattleLog {
  id: string;
  category: BattleLogCategory;
  timestamp: number;
  zone: number | null;
  difficulty: number | null;
  teamIdx: number | null;
  heroName: string | null;
  heroNames: string[];
  victory: boolean;
  damageDealt: number;
  xpGained: number;
  goldReward: number;
  magicStonesFound: number;
  logMessages: string[];
  event: string | null;
  description: string | null;
}

// =============================================================================
// Exploration Types
// =============================================================================

export interface ExplorationHeroState {
  id: string;
  name: string;
  atk: number;
  def: number;
  currentHp: number;
  maxHp: number;
}

export interface ExplorationState {
  zone: number;
  subZone: number;
  enemyName: string;
  enemyCurrentHp: number;
  enemyMaxHp: number;
  enemyAtk: number;
  enemyDef: number;
  isBoss: boolean;
  isElite: boolean;
  heroes: ExplorationHeroState[];
  round: number;
  logMessages: string[];
  goldReward: number;
  xpReward: number;
}

// =============================================================================
// User Snapshot Types
// =============================================================================

export interface HeroSnapshot {
  heroId: string;
  hp: number;
  maxHp: number;
  hunger: number;
  thirst: number;
  isExploring: boolean;
  zone: number;
  subZone: number;
  explorationTicks: number;
  level: number;
}

export interface ResourceSnapshot {
  gold: number;
  materials: Partial<Record<MaterialType, number>>;
  lastContribution: number;
}

export interface LastSnapshots {
  heroes: HeroSnapshot[];
  resources: ResourceSnapshot;
}

// =============================================================================
// Inventory Types
// =============================================================================

export interface Inventory {
  weapons: Partial<Record<string, number>>;
  armor: Partial<Record<string, number>>;
  helmets: Partial<Record<string, number>>;
  accessories: Partial<Record<string, number>>;
  potions: Partial<Record<string, number>>;
}

// =============================================================================
// Army Types
// =============================================================================

export interface ArmyUnits {
  archery: Partial<Record<string, number>>;
  barracks: Partial<Record<string, number>>;
}

export interface ArmorySlots {
  helmet: Partial<Record<string, number>>;
  chest: Partial<Record<string, number>>;
  legging: Partial<Record<string, number>>;
  weapon: Partial<Record<string, number>>;
}

// =============================================================================
// Guild Types
// =============================================================================

export interface GuildTaskReward {
  gold: number;
  magicStone: number;
}

export interface GuildTask {
  id: number;
  type: "kill" | "collect" | "explore";
  description: string;
  target: number;
  progress: number;
  reward: GuildTaskReward;
  completed: boolean;
}

export interface Guild {
  name: string;
  level: number;
  totalDamageToBoss: number;
  tasksCompleted: number;
  contribution: number;
  dailyTasks: GuildTask[];
  lastTaskRefresh: number;
}

// =============================================================================
// Cooldown Types
// =============================================================================

export interface Cooldowns {
  dispatch: Date | null;
  daily: Date | null;
  weekly: Date | null;
  build: Date | null;
}

// =============================================================================
// World Boss Types
// =============================================================================

export interface WorldBossState {
  totalDamage: number;
  lastAttack: number;
}

// =============================================================================
// Statistics Types
// =============================================================================

export interface Statistics {
  hunts: number;
  explorations: number;
  wins: number;
  losses: number;
  goldEarned: number;
  goldSpent: number;
  goldFromWandering: number;
  goldFromExploration: number;
  heroesRecruited: number;
  heroesTrained: number;
  heroesExpelled: number;
  buildingsBuilt: number;
  buildingsUpgraded: number;
  dailyClaims: number;
  weeklyClaims: number;
  consecutiveDays: number;
  consecutiveWeeks: number;
  zonesExplored: Partial<Record<number, number>>;
  bossesDefeated: number;
  firstPlayTime: Date;
  lastActiveTime: Date;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface GameSnapshot {
  userId: string;
  username: string;
  gold: number;
  goldCapacity: number;
  magicStones: number;
  materials: Partial<Record<MaterialType, number>>;
  materialCapacity: number;
  buildings: Buildings;
  heroes: {
    roster: Hero[];
    territoryHeroCap: number;
    wanderingHeroCap: number;
  };
  teams: Teams;
  battleLogs: BattleLog[];
  guild: Guild;
  statistics: Statistics;
  unlockedZones: number[];
  worldBoss: WorldBossState;
  cooldowns: Cooldowns;
  lastActiveTime: Date;
  army?: {
    units: ArmyUnits;
    armory: ArmorySlots;
  };
  inventory?: Inventory;
  productionRates?: Partial<Record<MaterialType, number>>;
}