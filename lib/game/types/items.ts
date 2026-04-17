// Items from _CONSTS/items.js - items may not have all ItemEntry fields
type RawItemEntry = {
  name: string;
  type: string;
  cost?: Record<string, number>;
  price?: number;
  stats?: { attack?: number; defense?: number; hp?: number };
  healing?: number;
  isLegendary?: boolean;
};

const ITEMS: Record<string, RawItemEntry> = require("../../_CONSTS/items");

export { ITEMS };
export type { RawItemEntry as ItemEntry };