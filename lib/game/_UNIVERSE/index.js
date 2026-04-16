// game/_UNIVERSE/index.js
const subZones = require('./sub-zones');

const zones = Object.entries(subZones).map(([id, data]) => ({
  id: parseInt(id),
  name: data.name,
  subZones: data.sub_zones,
  difficulty: data.difficulty || 1,
  boss: data.boss,
}));

// Boss definitions for zone completion (for future boss battle feature)
const zoneBosses = {
  1: { name: "叢林守護者", hp: 80, atk: 12, defense: 6 },
  2: { name: "雪怪王", hp: 200, atk: 25, defense: 15 },
  3: { name: "黑暗法師王", hp: 400, atk: 50, defense: 30 },
  4: { name: "墮落騎士王", hp: 600, atk: 70, defense: 45 },
  5: { name: "火焰巨龍", hp: 1000, atk: 100, defense: 60 },
  6: { name: "冰霜巨人王", hp: 1500, atk: 140, defense: 90 },
  7: { name: "天使長", hp: 2200, atk: 200, defense: 130 },
  8: { name: "終極巨龍", hp: 3000, atk: 280, defense: 180 },
  9: { name: "虛空吞噬者", hp: 4000, atk: 380, defense: 240 },
  10: { name: "混沌之主", hp: 6000, atk: 500, defense: 320 },
};

/**
 * Get sub-zone by zone ID and sub-zone index (1-based)
 * @param {Array} zonesList - zones array (pass null to use global export)
 * @param {number} zoneId - zone ID (1-10)
 * @param {number} subZoneIdx - sub-zone index (1-3)
 * @returns {Object|null} sub-zone object or null
 */
function getSubZoneById(zonesList, zoneId, subZoneIdx) {
  const zoneData = subZones[String(zoneId)];
  if (!zoneData || !zoneData.sub_zones) return null;
  const idx = subZoneIdx - 1;
  return zoneData.sub_zones[idx] || null;
}

module.exports = { zones, zoneBosses, getSubZoneById };
