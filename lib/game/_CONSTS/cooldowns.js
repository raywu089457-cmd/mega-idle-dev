module.exports = {
  // Dispatch cooldown by difficulty (subZone 1=easy, 2=normal, 3=hard)
  dispatch: {
    1: 30000,   // easy: 30 seconds
    2: 30000,   // normal: 30 seconds
    3: 30000,   // hard: 30 seconds
  },
  collect: 30000,      // 30 seconds
  daily: 86400000,    // 24 hours
  wander: 30000,      // 30 seconds per auto-action
  worldBoss: 0,        // no cooldown
  hunter: 60000,      // 60 seconds
};
