module.exports = {
  // Dispatch cooldown by difficulty (subZone 1=easy, 2=normal, 3=hard)
  dispatch: {
    1: 1000,   // easy: 1 second (TESTING)
    2: 1000,   // normal: 1 second (TESTING)
    3: 1000,   // hard: 1 second (TESTING)
  },
  collect: 30000,      // 30 seconds
  daily: 86400000,    // 24 hours
  wander: 30000,      // 30 seconds per auto-action
  worldBoss: 0,        // no cooldown
};
