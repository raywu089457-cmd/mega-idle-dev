/**
 * Phase 5 Background Worker
 * Runs idle tick processing for all users every 5 seconds.
 * Handles:
 * - Monument, tavern, potion shop production
 * - Exploration battles for dispatched heroes
 * - Wandering hero spawning
 * - Broadcast updates to connected clients
 */

const mongoose = require("mongoose");
const axios = require("axios");
const User = require("../models/User");
const { HeroManagementService } = require("../lib/game/services/HeroManagementService");
const { CombatResolver } = require("../lib/game/combat/CombatResolver");
const subZones = require("../lib/game/_UNIVERSE/sub-zones");

const TICK_INTERVAL_MS = 5000;
const WANDERING_SPAWN_CHANCE = 0.30;
const EXPLORATION_DURATION_MS = 30000; // 30 seconds per exploration

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  return mongoose.connection;
}

async function broadcast(userId, userData) {
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL;
  const WORKER_SECRET = process.env.WORKER_SECRET;

  if (!NEXTAUTH_URL || !WORKER_SECRET) {
    console.error("[broadcast] Missing NEXTAUTH_URL or WORKER_SECRET");
    return;
  }

  try {
    await axios.post(
      `${NEXTAUTH_URL}/api/internal/broadcast`,
      { userId, ...userData },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Worker-Secret": WORKER_SECRET,
        },
        timeout: 10000,
      }
    );
  } catch (err) {
    console.error(`[broadcast] Failed for user ${userId}:`, err.message);
  }
}

/**
 * Process exploration battles for a user's dispatched heroes
 * Heroes stay exploring until recalled, but combat runs every tick
 */
async function processExploration(user) {
  const exploringHeroes = user.heroes.roster.filter(h => h.isExploring);

  if (exploringHeroes.length === 0) return;

  // Get zone data
  const zoneData = subZones[exploringHeroes[0].currentZone];
  if (!zoneData) return;

  const subZoneData = zoneData.sub_zones.find(sz => sz.id === exploringHeroes[0].currentSubZone);
  if (!subZoneData) return;

  // Check if dispatch cooldown has passed (30 seconds)
  const dispatchCooldown = user.cooldowns?.dispatch;
  if (dispatchCooldown) {
    const cooldownElapsed = Date.now() - new Date(dispatchCooldown).getTime();
    if (cooldownElapsed < 30000) {
      // Still in cooldown - don't process, heroes stay exploring
      return;
    }
  }

  // Run combat
  const resolver = new CombatResolver();
  const result = resolver.resolveCombat(exploringHeroes, {
    monsters: subZoneData.monsters,
    difficulty: subZoneData.difficulty,
    gold_reward: subZoneData.gold_reward,
    stone_drop: subZoneData.stone_drop,
    xp_multiplier: subZoneData.xp_multiplier,
    is_boss: subZoneData.is_boss,
    is_elite: subZoneData.is_elite,
  }, 0);

  // Apply results to each hero
  for (const hero of exploringHeroes) {
    if (result.victory) {
      // Victory rewards - XP is accumulated
      const xpGained = Math.floor(result.xpGained / exploringHeroes.length);
      hero.experience += xpGained;
      hero.lastZone = hero.currentZone;
      hero.lastSubZone = hero.currentSubZone;

      // Process level ups (handles XP threshold check + stat increases)
      const levelResult = HeroManagementService.addXp(user, hero.id, 0);
      if (levelResult?.leveledUp) {
        console.log(`[worker] Hero ${hero.name} leveled up to ${hero.level}!`);
      }
    } else {
      // Defeat - lose some hunger/thirst, reduced HP (revived at half HP by CombatResolver)
      hero.hunger = Math.max(0, hero.hunger - 10);
      hero.thirst = Math.max(0, hero.thirst - 10);
      // If hero is too hungry/thirsty, they return home
      if (hero.hunger <= 0 || hero.thirst <= 0) {
        hero.isExploring = false;
        hero.currentZone = null;
        hero.currentSubZone = null;
        user.removeHeroFromTeam(hero.id);
        continue;
      }
    }

    // Consume rations and water if available
    if (hero.hunger < 50 && user.materials.get("rations") > 0) {
      user.materials.set("rations", user.materials.get("rations") - 1);
      hero.hunger = Math.min(100, hero.hunger + 30);
    }
    if (hero.thirst < 50 && user.materials.get("drinking_water") > 0) {
      user.materials.set("drinking_water", user.materials.get("drinking_water") - 1);
      hero.thirst = Math.min(100, hero.thirst + 30);
    }

    // Heroes stay exploring after combat (until recalled or resource depletion)
  }

  // Give gold reward
  if (result.goldReward > 0) {
    user.gold = (user.gold || 0) + result.goldReward;
  }

  // Magic stone drops
  if (result.magicStonesFound > 0) {
    user.magicStones = (user.magicStones || 0) + result.magicStonesFound;
  }

  // Material drops
  for (const [mat, amount] of Object.entries(result.materialsFound)) {
    const current = user.materials.get(mat) || 0;
    user.materials.set(mat, current + amount);
  }

  // Update user statistics
  if (result.victory) {
    user.statistics.wins = (user.statistics.wins || 0) + 1;
  } else {
    user.statistics.losses = (user.statistics.losses || 0) + 1;
  }
  user.statistics.explorations = (user.statistics.explorations || 0) + 1;
  user.statistics.goldEarned = (user.statistics.goldEarned || 0) + result.goldReward;

  // Add battle log
  user.addBattleLog({
    category: exploringHeroes.length > 1 ? "team_combat" : "solo_combat",
    zone: exploringHeroes[0].currentZone,
    difficulty: exploringHeroes[0].currentSubZone,
    teamIdx: exploringHeroes[0].currentTeamIdx,
    heroNames: exploringHeroes.map(h => h.name),
    victory: result.victory,
    damageDealt: result.victory ? result.goldReward * 10 : 0,
    goldReward: result.goldReward,
    xpGained: result.xpGained,
    logMessages: result.logMessages,
  });

  // Unlock next zone if boss was defeated
  if (result.victory && subZoneData.is_boss && user.unlockedZones) {
    const nextZone = exploringHeroes[0].currentZone + 1;
    if (nextZone <= 10 && !user.unlockedZones.includes(nextZone)) {
      user.unlockedZones.push(nextZone);
    }
  }

  // Reset cooldown after successful exploration cycle
  user.cooldowns.dispatch = new Date();
}

async function processAllUsers() {
  const users = await User.find({});
  console.log(`[tick] Processing ${users.length} user(s)`);

  for (const user of users) {
    try {
      // 1. Run idle tick (monument production, tavern, potion shop)
      await user.processIdleTick();

      // 2. Process exploration battles
      await processExploration(user);

      // 3. Wandering hero spawning (30% chance per user per tick if under cap)
      const canSpawnWandering =
        user.heroes.usedWanderingSlots < user.wanderingHeroCap;
      if (canSpawnWandering && Math.random() < WANDERING_SPAWN_CHANCE) {
        HeroManagementService.createWanderingHero(user);
        await user.save();
      }

      // 4. Broadcast update to connected clients (full snapshot matching /api/user response)
      const userData = {
        userId: user.userId,
        username: user.username,
        gold: user.gold,
        goldCapacity: user.goldCapacity,
        magicStones: user.magicStones,
        materials: Object.fromEntries(user.materials),
        materialCapacity: user.materialCapacity,
        buildings: user.buildings,
        heroes: {
          roster: user.heroes?.roster || [],
          territoryHeroCap: user.territoryHeroCap,
          wanderingHeroCap: user.wanderingHeroCap,
        },
        teams: Object.fromEntries(user.teams),
        battleLogs: user.battleLogs,
        guild: user.guild,
        statistics: user.statistics,
        unlockedZones: user.unlockedZones,
        worldBoss: user.worldBoss,
        cooldowns: user.cooldowns,
        lastActiveTime: user.statistics?.lastActiveTime,
      };
      await broadcast(user.userId, userData);
    } catch (err) {
      console.error(`[tick] Error processing user ${user.userId}:`, err.message);
    }
  }
}

async function main() {
  console.log("[worker] Starting Mega Idle background worker");

  try {
    await connectDB();
    console.log("[worker] Connected to MongoDB");
  } catch (err) {
    console.error("[worker] Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }

  setInterval(async () => {
    try {
      await processAllUsers();
    } catch (err) {
      console.error("[tick] Tick error:", err.message);
    }
  }, TICK_INTERVAL_MS);

  console.log(`[worker] Idle loop running every ${TICK_INTERVAL_MS / 1000}s`);
}

main().catch((err) => {
  console.error("[worker] Fatal error:", err.message);
  process.exit(1);
});
