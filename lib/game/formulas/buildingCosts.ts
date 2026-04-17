/**
 * Building Costs Formula - Single Source of Truth
 */

export interface BuildingCostFormula {
  (level: number): Record<string, number>;
}

export const BUILDING_COST_FORMULAS: Record<string, BuildingCostFormula> = {
  castle: (level) => ({ gold: Math.floor(100 * Math.pow(level, 2)) }),
  tavern: (level) => ({ gold: Math.floor(50 * Math.pow(level, 2)), wood: Math.floor(20 * level) }),
  monument: (level) => ({ gold: Math.floor(80 * Math.pow(level, 2)) }),
  warehouse: (level) => ({ gold: Math.floor(30 * Math.pow(level, 2)), wood: Math.floor(15 * level) }),
  weaponShop: (level) => ({ gold: Math.floor(40 * Math.pow(level, 2)) }),
  armorShop: (level) => ({ gold: Math.floor(40 * Math.pow(level, 2)) }),
  potionShop: (level) => ({ gold: Math.floor(40 * Math.pow(level, 2)) }),
  lumberMill: (level) => ({ gold: Math.floor(60 * Math.pow(level, 2)), wood: Math.floor(20 * level) }),
  mine: (level) => ({ gold: Math.floor(60 * Math.pow(level, 2)), iron: Math.floor(20 * level) }),
  herbGarden: (level) => ({ gold: Math.floor(60 * Math.pow(level, 2)), herbs: Math.floor(20 * level) }),
  guildHall: (level) => ({ gold: Math.floor(100 * Math.pow(level, 2)), wood: Math.floor(30 * level), iron: Math.floor(10 * level) }),
  barracks: (level) => ({ gold: Math.floor(100 * Math.pow(level, 2)), wood: Math.floor(30 * level), iron: Math.floor(10 * level) }),
  archery: (level) => ({ gold: Math.floor(80 * Math.pow(level, 2)), wood: Math.floor(40 * level) }),
};

export const VALID_BUILDINGS = Object.keys(BUILDING_COST_FORMULAS);

export function getBuildingCost(building: string, level: number): Record<string, number> {
  const formula = BUILDING_COST_FORMULAS[building];
  if (!formula) return {};
  return formula(level);
}