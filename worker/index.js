const axios = require("axios");
const mongoose = require("mongoose");
const User = require("../models/User");
const { HeroManagementService } = require("../lib/game/services/HeroManagementService");
const { subZones } = require("../lib/game/_UNIVERSE/sub-zones");

const MONGODB_URI = process.env.MONGODB_URI;
const WANDERING_SPAWN_CHANCE = 0.3;

async function connectDB() {
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
 * TURN-BASED: Execute ONE round per tick, tracking combat state
 */
async function processExploration(user) {
  const exploringHeroes = user.heroes.roster.filter(h => h.isExploring);
  console.log(`[exploration] user:${user.userId} exploring:${exploringHeroes.length} state:${user.explorationState ? "has_state" : "no_state"}`);

  if (exploringHeroes.length === 0) {
    console.log(`[exploration] No exploring heroes for user ${user.userId}, clearing state if exists`);
    // Clear exploration state if no heroes exploring
    if (user.explorationState) {
      user.explorationState = null;
      user.markModified('explorationState');
      await user.save();
    }
    return;
  }

  // Get zone data
  const zoneData = subZones[exploringHeroes[0].currentZone];
  if (!zoneData) {
    console.log(`[exploration] Invalid zone ${exploringHeroes[0].currentZone} for hero ${exploringHeroes[0].name}`);
    return;
  }

  const subZoneData = zoneData.sub_zones.find(sz => sz.id === exploringHeroes[0].currentSubZone);
  if (!subZoneData) {
    console.log(`[exploration] Invalid subZone ${exploringHeroes[0].currentSubZone} in zone ${exploringHeroes[0].currentZone}`);
    return;
  }

  // Check dispatch cooldown only for NEW combat starts (3 seconds for testing)
  // Skip this check if we already have an explorationState (continuing combat)
  if (!user.explorationState) {
    const dispatchCooldown = user.cooldowns?.dispatch;
    if (dispatchCooldown) {
      const cooldownElapsed = Date.now() - new Date(dispatchCooldown).getTime();
      if (cooldownElapsed < 3000) {
        console.log(`[exploration] Cooldown active for new combat, skipping. elapsed:${cooldownElapsed}ms`);
        return;
      }
    }
  }

  // Initialize or continue exploration combat
  if (!user.explorationState) {
    // Start NEW exploration combat
    const monsters = subZoneData.monsters;
    const primaryMonster = monsters[0];

    // Initialize combat state
    user.explorationState = {
      zone: exploringHeroes[0].currentZone,
      subZone: exploringHeroes[0].currentSubZone,
      enemyName: primaryMonster.name,
      enemyCurrentHp: primaryMonster.hp,
      enemyMaxHp: primaryMonster.hp,
      enemyAtk: primaryMonster.atk,
      enemyDef: primaryMonster.defense || 0,
      isBoss: primaryMonster.is_boss || false,
      isElite: primaryMonster.is_elite || false,
      heroes: exploringHeroes.map(h => ({
        id: h.id,
        name: h.name,
        atk: h.atk,
        def: h.def,
        currentHp: h.currentHp,
        maxHp: h.maxHp,
      })),
      round: 0,
      logMessages: [`遭遇 ${primaryMonster.name} (HP:${primaryMonster.hp} ATK:${primaryMonster.atk})`],
      goldReward: subZoneData.gold_reward,
      xpReward: Math.floor(primaryMonster.xp * subZoneData.xp_multiplier),
    };

    user.markModified('explorationState');
    user.cooldowns.dispatch = new Date();
    console.log(`[exploration] New combat started - zone:${exploringHeroes[0].currentZone} subZone:${exploringHeroes[0].currentSubZone} enemy:${primaryMonster.name} HP:${primaryMonster.hp}`);
    await user.save();
    return; // First tick just sets up state, no combat round yet
  }

  // Continue existing exploration combat - execute ONE round
  const state = user.explorationState;
  state.round++;
  user.markModified('explorationState');
  console.log(`[exploration] Continuing round ${state.round} - enemyHP:${state.enemyCurrentHp}/${state.enemyMaxHp} heroes:${state.heroes.filter(h=>h.currentHp>0).length} alive`);

  // Execute one round of combat
  const roundLog = [`第${state.round}回合`];

  // Heroes attack first
  for (const heroState of state.heroes) {
    if (heroState.currentHp <= 0) continue;

    // Calculate damage
    const baseDamage = Math.max(1, heroState.atk - state.enemyDef);
    const isCrit = Math.random() < 0.1; // 10% crit chance
    const damage = isCrit ? Math.floor(baseDamage * 1.5) : baseDamage;

    state.enemyCurrentHp -= damage;
    const critText = isCrit ? '暴擊！' : '';
    roundLog.push(`[${heroState.name}] 攻擊造成 ${damage} 傷害 ${critText}`.trim());

    if (state.enemyCurrentHp <= 0) break; // Enemy died
  }

  // Enemy counter-attacks if still alive
  if (state.enemyCurrentHp > 0 && state.heroes.some(h => h.currentHp > 0)) {
    const aliveHeroes = state.heroes.filter(h => h.currentHp > 0);
    // Target the hero with lowest HP
    const target = aliveHeroes.reduce((min, h) => h.currentHp < min.currentHp ? h : min, aliveHeroes[0]);

    const actualDamage = Math.max(1, state.enemyAtk - target.def);
    target.currentHp -= actualDamage;
    roundLog.push(`[${state.enemyName}] 攻擊 [${target.name}] 造成 ${actualDamage} 傷害 (HP: ${target.currentHp}/${target.maxHp})`);

    if (target.currentHp <= 0) {
      roundLog.push(`[${target.name}] 倒下了！`);
    }
  }

  state.logMessages.push(...roundLog);

  // Check if combat is over
  const enemyDefeated = state.enemyCurrentHp <= 0;
  const heroesDefeated = state.heroes.every(h => h.currentHp <= 0);
  const maxRoundsReached = state.round >= 50;

  if (enemyDefeated || heroesDefeated || maxRoundsReached) {
    // Combat finished - apply results
    const victory = enemyDefeated && !heroesDefeated;

    // Apply results to actual heroes
    for (const hero of exploringHeroes) {
      const heroState = state.heroes.find(h => h.id === hero.id);
      if (heroState) {
        hero.currentHp = Math.max(0, heroState.currentHp);
        hero.experience += Math.floor(state.xpReward / state.heroes.length);
        hero.lastZone = hero.currentZone;
        hero.lastSubZone = hero.currentSubZone;

        // Process level up
        HeroManagementService.addXp(user, hero.id, 0);
      }
    }

    // Give rewards
    if (victory) {
      user.gold = (user.gold || 0) + state.goldReward;
      state.logMessages.push(`戰鬥勝利！獲得 ${state.goldReward} 黃金`);
    } else {
      state.logMessages.push(heroesDefeated ? '英雄全滅！' : '戰鬥超时！');
    }

    // Add battle log
    console.log(`[exploration] Combat ended - victory:${victory} zone:${state.zone} subZone:${state.subZone} heroes:${state.heroes.map(h=>h.name).join(",")}`);
    user.addBattleLog({
      category: state.heroes.length > 1 ? "team_combat" : "solo_combat",
      zone: state.zone,
      difficulty: state.subZone,
      heroNames: state.heroes.map(h => h.name),
      victory,
      goldReward: victory ? state.goldReward : 0,
      xpGained: state.xpReward,
      logMessages: state.logMessages,
    });

    // Unlock boss zone
    if (victory && subZoneData.is_boss && user.unlockedZones) {
      const nextZone = state.zone + 1;
      if (nextZone <= 10 && !user.unlockedZones.includes(nextZone)) {
        user.unlockedZones.push(nextZone);
      }
    }

    // Clear exploration state
    user.explorationState = null;
    user.markModified('explorationState');
    user.cooldowns.dispatch = new Date();
  }

  await user.save();
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

    // Main worker loop - runs every 5 seconds
    setInterval(async () => {
      console.log("[tick] Running worker tick");
      await processAllUsers();
    }, 5000);

    console.log("[worker] Worker tick started - processing every 5 seconds");
  } catch (err) {
    console.error("[worker] Failed to start:", err);
    process.exit(1);
  }
}

main();