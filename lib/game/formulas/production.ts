/**
 * Production Formulas - Single Source of Truth
 *
 * These formulas calculate production rates for buildings that generate or consume materials.
 * All production logic MUST use these functions - no hardcoded values in business logic.
 */

// =============================================================================
// Idle Tick Configuration
// =============================================================================

/** Idle tick interval in milliseconds (5 seconds) */
export const IDLE_TICK_INTERVAL_MS = 5000;

/**
 * Get number of ticks to apply based on elapsed time.
 * Always returns at least 1 tick to ensure production continues even if worker is delayed.
 */
export function getTicksToApply(elapsedMs: number): number {
  const ticks = Math.floor(elapsedMs / IDLE_TICK_INTERVAL_MS);
  return Math.max(1, ticks);
}

// =============================================================================
// Monument Production Formulas
// =============================================================================

/**
 * Monument base production per tick (before bonuses).
 * Generous base production for casual players — satisfying idle gains.
 */
export const MONUMENT_BASE_PRODUCTION = 5;

/**
 * Monument bonus multiplier per level.
 * Formula: monument_bonus = 1 + (level * 0.12)
 * Level 1: 1.12x, Level 5: 1.60x, Level 10: 2.20x
 */
export function getMonumentBonus(level: number): number {
  return 1 + level * 0.12;
}

/**
 * Lumber Mill bonus multiplier per level.
 * Formula: lumberMill_bonus = 1 + (level * 0.5)
 * Level 1: 1.5x, Level 5: 3.0x, Level 10: 6.0x
 */
export function getLumberMillBonus(level: number): number {
  return 1 + level * 0.5;
}

/**
 * Mine bonus multiplier per level.
 * Formula: mine_bonus = 1 + (level * 0.5)
 */
export function getMineBonus(level: number): number {
  return 1 + level * 0.5;
}

/**
 * Herb Garden bonus multiplier per level.
 * Formula: herbGarden_bonus = 1 + (level * 0.5)
 */
export function getHerbGardenBonus(level: number): number {
  return 1 + level * 0.5;
}

/**
 * Calculate material production from Monument for a single material type.
 *
 * @param monumentLevel - Current monument level (0 = no production)
 * @param lumberMillLevel - Current lumber mill level (0 = no bonus)
 * @param mineLevel - Current mine level (0 = no bonus)
 * @param herbGardenLevel - Current herb garden level (0 = no bonus)
 * @param ticks - Number of ticks to apply
 * @returns Map of material types to amounts produced
 */
export interface MonumentProductionResult {
  fruit: number;
  water: number;
  wood: number;
  iron: number;
  herbs: number;
}

export function getMonumentProduction(
  monumentLevel: number,
  lumberMillLevel: number,
  mineLevel: number,
  herbGardenLevel: number,
  ticks: number
): MonumentProductionResult {
  const result: MonumentProductionResult = { fruit: 0, water: 0, wood: 0, iron: 0, herbs: 0 };

  if (monumentLevel <= 0) return result;

  const monumentBonus = getMonumentBonus(monumentLevel);
  const woodBonus = monumentBonus * getLumberMillBonus(lumberMillLevel);
  const ironBonus = monumentBonus * getMineBonus(mineLevel);
  const herbsBonus = monumentBonus * getHerbGardenBonus(herbGardenLevel);

  const basePerTick = MONUMENT_BASE_PRODUCTION;
  const materials: (keyof MonumentProductionResult)[] = ["fruit", "water", "wood", "iron", "herbs"];

  materials.forEach((mat) => {
    let bonus: number;
    switch (mat) {
      case "wood":
        bonus = woodBonus;
        break;
      case "iron":
        bonus = ironBonus;
        break;
      case "herbs":
        bonus = herbsBonus;
        break;
      default:
        bonus = monumentBonus;
    }
    result[mat] = Math.floor(basePerTick * ticks * bonus);
  });

  return result;
}

// =============================================================================
// Tavern Production Formulas
// =============================================================================

/**
 * Fruit requirement per tavern level.
 * Tavern requires fruit >= 5 * level to operate.
 */
export const TAVERN_FRUIT_COST_PER_LEVEL = 5;

/**
 * Water requirement per tavern level.
 * Tavern requires water >= 5 * level to operate.
 */
export const TAVERN_WATER_COST_PER_LEVEL = 5;

/**
 * Base output per tavern level for rations and drinking water.
 * Output: 3 * tavern_level each
 */
export const TAVERN_OUTPUT_PER_LEVEL = 3;

/**
 * Calculate Tavern production.
 * Consumes fruit + water to produce rations + drinking water.
 *
 * @returns { consumed: { fruit: number, water: number }, produced: { rations: number, drinking_water: number } }
 *          or null if requirements not met
 */
export interface TavernProductionResult {
  consumed: { fruit: number; water: number };
  produced: { rations: number; drinking_water: number };
}

export function getTavernProduction(
  tavernLevel: number,
  availableFruit: number,
  availableWater: number
): TavernProductionResult | null {
  if (tavernLevel <= 0) return null;

  const fruitRequired = TAVERN_FRUIT_COST_PER_LEVEL * tavernLevel;
  const waterRequired = TAVERN_WATER_COST_PER_LEVEL * tavernLevel;

  const fruitConsumed = Math.min(availableFruit, fruitRequired);
  const waterConsumed = Math.min(availableWater, waterRequired);

  // Only produce if we have enough of BOTH resources
  if (fruitConsumed < fruitRequired || waterConsumed < waterRequired) {
    return null;
  }

  const rationsProduced = TAVERN_OUTPUT_PER_LEVEL * tavernLevel;
  const waterProduced = TAVERN_OUTPUT_PER_LEVEL * tavernLevel;

  return {
    consumed: { fruit: fruitConsumed, water: waterConsumed },
    produced: { rations: rationsProduced, drinking_water: waterProduced },
  };
}

// =============================================================================
// Potion Shop Production Formulas
// =============================================================================

/**
 * Herbs requirement per potion shop level.
 * Potion Shop requires herbs >= 3 * level to operate.
 */
export const POTION_SHOP_HERBS_COST_PER_LEVEL = 3;

/**
 * Base output per potion shop level for potions.
 * Output: 2 * potionShop_level
 */
export const POTION_SHOP_OUTPUT_PER_LEVEL = 2;

/**
 * Calculate Potion Shop production.
 * Consumes herbs to produce potions.
 *
 * @returns { consumed: { herbs: number }, produced: { potions: number } }
 *          or null if requirements not met
 */
export interface PotionShopProductionResult {
  consumed: { herbs: number };
  produced: { potions: number };
}

export function getPotionShopProduction(
  potionShopLevel: number,
  availableHerbs: number
): PotionShopProductionResult | null {
  if (potionShopLevel <= 0) return null;

  const herbsRequired = POTION_SHOP_HERBS_COST_PER_LEVEL * potionShopLevel;
  const herbsConsumed = Math.min(availableHerbs, herbsRequired);

  // Only produce if we have enough herbs
  if (herbsConsumed < herbsRequired) {
    return null;
  }

  const potionsProduced = POTION_SHOP_OUTPUT_PER_LEVEL * potionShopLevel;

  return {
    consumed: { herbs: herbsConsumed },
    produced: { potions: potionsProduced },
  };
}
