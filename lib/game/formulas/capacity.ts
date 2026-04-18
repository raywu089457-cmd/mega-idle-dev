/**
 * Capacity Formula - Single Source of Truth
 *
 * Gold capacity:  100000 + (warehouse_level * 50000)
 * Material capacity: 500 + (warehouse_level * 100)
 */

const GOLD_BASE_CAPACITY = 100000;
const GOLD_PER_WAREHOUSE_LEVEL = 50000;

const MATERIAL_BASE_CAPACITY = 500;
const MATERIAL_PER_WAREHOUSE_LEVEL = 100;

/**
 * Get gold storage capacity based on warehouse level
 */
export function getGoldCapacity(warehouseLevel: number): number {
  return GOLD_BASE_CAPACITY + (warehouseLevel * GOLD_PER_WAREHOUSE_LEVEL);
}

/**
 * Get material storage capacity based on warehouse level
 */
export function getMaterialCapacity(warehouseLevel: number): number {
  return MATERIAL_BASE_CAPACITY + (warehouseLevel * MATERIAL_PER_WAREHOUSE_LEVEL);
}
