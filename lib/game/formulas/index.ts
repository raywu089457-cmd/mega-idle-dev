/**
 * Building Production Formulas - Single Source of Truth
 *
 * All production calculations for Monument, LumberMill, Mine, and HerbGarden
 * MUST use these functions. No hardcoded values allowed in business logic.
 */

// Re-export all building-related formulas
export {
  IDLE_TICK_INTERVAL_MS,
  MONUMENT_BASE_PRODUCTION,
  TAVERN_FRUIT_COST_PER_LEVEL,
  TAVERN_WATER_COST_PER_LEVEL,
  TAVERN_OUTPUT_PER_LEVEL,
  POTION_SHOP_HERBS_COST_PER_LEVEL,
  POTION_SHOP_OUTPUT_PER_LEVEL,
  getTicksToApply,
  getMonumentBonus,
  getLumberMillBonus,
  getMineBonus,
  getHerbGardenBonus,
  getMonumentProduction,
  getTavernProduction,
  getPotionShopProduction,
  type MonumentProductionResult,
  type TavernProductionResult,
  type PotionShopProductionResult,
} from "./production";

// Re-export capacity formulas
export { getGoldCapacity, getMaterialCapacity } from "./capacity";

import {
  getMonumentBonus,
  getLumberMillBonus,
  getMineBonus,
  getHerbGardenBonus,
  MONUMENT_BASE_PRODUCTION,
  type MonumentProductionResult,
} from "./production";

/**
 * Calculate production rates per tick for a single material type.
 * Used by API to expose productionRates in the game snapshot.
 *
 * @param monumentLevel - Current monument level (0 = no production)
 * @param lumberMillLevel - Current lumber mill level (0 = no bonus)
 * @param mineLevel - Current mine level (0 = no bonus)
 * @param herbGardenLevel - Current herb garden level (0 = no bonus)
 * @returns Map of material types to production rates per tick
 */
export function getProductionRates(
  monumentLevel: number,
  lumberMillLevel: number,
  mineLevel: number,
  herbGardenLevel: number
): Record<keyof MonumentProductionResult, number> {
  const monumentBonus = getMonumentBonus(monumentLevel);
  const woodBonus = monumentBonus * getLumberMillBonus(lumberMillLevel);
  const ironBonus = monumentBonus * getMineBonus(mineLevel);
  const herbsBonus = monumentBonus * getHerbGardenBonus(herbGardenLevel);

  return {
    fruit: MONUMENT_BASE_PRODUCTION * monumentBonus,
    water: MONUMENT_BASE_PRODUCTION * monumentBonus,
    wood: MONUMENT_BASE_PRODUCTION * woodBonus,
    iron: MONUMENT_BASE_PRODUCTION * ironBonus,
    herbs: MONUMENT_BASE_PRODUCTION * herbsBonus,
  };
}
