/**
 * Phase 5 Background Worker
 * Runs idle tick processing for all users every 5 seconds.
 * Handles monument production, tavern, potion shop, and wandering hero spawning.
 * Calls internal broadcast endpoint after each user tick.
 */

const mongoose = require("mongoose");
const axios = require("axios");
const User = require("../models/User");
const { HeroManagementService } = require("../lib/game/services/HeroManagementService");

const TICK_INTERVAL_MS = 5000;
const WANDERING_SPAWN_CHANCE = 0.30;

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

async function processAllUsers() {
  const users = await User.find({});
  console.log(`[tick] Processing ${users.length} user(s)`);

  for (const user of users) {
    try {
      // 1. Run idle tick (monument production, tavern, potion shop)
      await user.processIdleTick();

      // 2. Wandering hero spawning (30% chance per user per tick if under cap)
      const canSpawnWandering =
        user.heroes.usedWanderingSlots < user.wanderingHeroCap;
      if (canSpawnWandering && Math.random() < WANDERING_SPAWN_CHANCE) {
        HeroManagementService.createWanderingHero(user);
        await user.save();
      }

      // 3. Broadcast update to connected clients (full snapshot matching /api/user response)
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
        battleLogs: user.battleHistory,
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
      console.error("[worker] Tick error:", err.message);
    }
  }, TICK_INTERVAL_MS);

  console.log(`[worker] Idle loop running every ${TICK_INTERVAL_MS / 1000}s`);
}

main().catch((err) => {
  console.error("[worker] Fatal error:", err.message);
  process.exit(1);
});
