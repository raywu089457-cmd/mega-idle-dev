const axios = require("axios");
const mongoose = require("mongoose");
const User = require("../models/User");
const { HeroManagementService } = require("../lib/game/services/HeroManagementService");

const MONGODB_URI = process.env.MONGODB_URI;
const WANDERING_SPAWN_CHANCE = 0.3;

// Inline subZones data - avoids module resolution issues across deployments
const subZones = {
  1: { name: "翠綠草原", sub_zones: [{ id: 1, name: "草原外圍", difficulty: 1, monsters: [{ name: "哥布林", hp: 25, atk: 4, defense: 1, xp: 12 }, { name: "野狼", hp: 30, atk: 5, defense: 2, xp: 14 }, { name: "強盜", hp: 40, atk: 6, defense: 3, xp: 18 }], gold_reward: 120, xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "森林邊緣", difficulty: 2, monsters: [{ name: "狼群領袖", hp: 70, atk: 10, defense: 5, xp: 35, is_elite: true }, { name: "森林盜賊", hp: 60, atk: 12, defense: 4, xp: 28, is_elite: true }], gold_reward: 200, xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "灌木叢林深處", difficulty: 3, monsters: [{ name: "叢林守護者", hp: 120, atk: 15, defense: 8, xp: 60, is_boss: true }], gold_reward: 350, xp_multiplier: 2.0, is_boss: true }] },
  2: { name: "迷霧山脈", sub_zones: [{ id: 1, name: "山腳", difficulty: 3, monsters: [{ name: "山賊", hp: 80, atk: 12, defense: 6, xp: 50 }], gold_reward: 320, xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "山路", difficulty: 4, monsters: [{ name: "石像鬼", hp: 130, atk: 18, defense: 10, xp: 75, is_elite: true }], gold_reward: 480, xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "山頂", difficulty: 5, monsters: [{ name: "雪怪王", hp: 250, atk: 28, defense: 15, xp: 120, is_boss: true }], gold_reward: 800, xp_multiplier: 2.0, is_boss: true }] },
  3: { name: "深邃洞穴", sub_zones: [{ id: 1, name: "洞穴入口", difficulty: 5, monsters: [{ name: "洞穴蜘蛛", hp: 120, atk: 20, defense: 7, xp: 60 }], gold_reward: 450, xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "礦脈深處", difficulty: 6, monsters: [{ name: "礦脈守護者", hp: 200, atk: 28, defense: 12, xp: 100, is_elite: true }], gold_reward: 650, xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "黑暗核心", difficulty: 7, monsters: [{ name: "黑暗法師王", hp: 400, atk: 40, defense: 20, xp: 180, is_boss: true }], gold_reward: 1100, xp_multiplier: 2.0, is_boss: true }] },
  4: { name: "幽靈要塞", sub_zones: [{ id: 1, name: "外牆", difficulty: 7, monsters: [{ name: "幽靈士兵", hp: 180, atk: 25, defense: 14, xp: 90 }], gold_reward: 700, xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "要塞內部", difficulty: 8, monsters: [{ name: "怨靈法師", hp: 280, atk: 35, defense: 18, xp: 130, is_elite: true }], gold_reward: 950, xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "領主之間", difficulty: 9, monsters: [{ name: "墮落騎士王", hp: 550, atk: 55, defense: 30, xp: 250, is_boss: true }], gold_reward: 1600, xp_multiplier: 2.0, is_boss: true }] },
  5: { name: "烈焰火山", sub_zones: [{ id: 1, name: "火山腳", difficulty: 9, monsters: [{ name: "火元素", hp: 280, atk: 45, defense: 20, xp: 150 }], gold_reward: 1300, xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "熔岩地帶", difficulty: 10, monsters: [{ name: "熔岩巨人", hp: 450, atk: 60, defense: 28, xp: 220, is_elite: true }], gold_reward: 1800, xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "火山口", difficulty: 11, monsters: [{ name: "火焰巨龍", hp: 800, atk: 80, defense: 40, xp: 400, is_boss: true }], gold_reward: 2800, xp_multiplier: 2.0, is_boss: true }] },
  6: { name: "冰霜凍土", sub_zones: [{ id: 1, name: "冰原外圍", difficulty: 11, monsters: [{ name: "冰霜巨人", hp: 500, atk: 65, defense: 32, xp: 280 }], gold_reward: 2200, xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "冰洞深處", difficulty: 12, monsters: [{ name: "冰霜元素", hp: 700, atk: 85, defense: 40, xp: 380, is_elite: true }], gold_reward: 3000, xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "冰之王座", difficulty: 13, monsters: [{ name: "冰霜巨人王", hp: 1000, atk: 110, defense: 55, xp: 550, is_boss: true }], gold_reward: 4200, xp_multiplier: 2.0, is_boss: true }] },
  7: { name: "遠古神殿", sub_zones: [{ id: 1, name: "神殿外圍", difficulty: 13, monsters: [{ name: "神殿守衛", hp: 650, atk: 85, defense: 42, xp: 350 }], gold_reward: 3400, xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "神殿中庭", difficulty: 14, monsters: [{ name: "神殿騎士", hp: 850, atk: 105, defense: 50, xp: 480, is_elite: true }], gold_reward: 4400, xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "天使長之間", difficulty: 15, monsters: [{ name: "天使長", hp: 1400, atk: 140, defense: 70, xp: 700, is_boss: true }], gold_reward: 6500, xp_multiplier: 2.0, is_boss: true }] },
  8: { name: "龍之巢穴", sub_zones: [{ id: 1, name: "龍穴入口", difficulty: 15, monsters: [{ name: "幼龍", hp: 800, atk: 95, defense: 48, xp: 480 }], gold_reward: 5200, xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "龍穴中層", difficulty: 17, monsters: [{ name: "成年龍", hp: 1100, atk: 120, defense: 60, xp: 680, is_elite: true }], gold_reward: 7000, xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "龍穴核心", difficulty: 20, monsters: [{ name: "終極巨龍", hp: 1800, atk: 160, defense: 80, xp: 950, is_boss: true }], gold_reward: 10500, xp_multiplier: 2.0, is_boss: true }] },
  9: { name: "虛空裂隙", sub_zones: [{ id: 1, name: "裂隙入口", difficulty: 17, monsters: [{ name: "虛空行者", hp: 1000, atk: 110, defense: 55, xp: 620 }], gold_reward: 8400, xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "虛空深層", difficulty: 20, monsters: [{ name: "虛空監視者", hp: 1400, atk: 140, defense: 70, xp: 850, is_elite: true }], gold_reward: 11500, xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "虛空核心", difficulty: 25, monsters: [{ name: "虛空吞噬者", hp: 2500, atk: 200, defense: 100, xp: 1400, is_boss: true }], gold_reward: 16500, xp_multiplier: 2.0, is_boss: true }] },
  10: { name: "混沌深淵", sub_zones: [{ id: 1, name: "深淵入口", difficulty: 20, monsters: [{ name: "混沌僕從", hp: 1300, atk: 130, defense: 65, xp: 820 }], gold_reward: 14500, xp_multiplier: 1.0, is_boss: false }, { id: 2, name: "混沌領域", difficulty: 25, monsters: [{ name: "混沌衛士", hp: 2000, atk: 180, defense: 90, xp: 1200, is_elite: true }], gold_reward: 20000, xp_multiplier: 1.5, is_boss: false, is_elite: true }, { id: 3, name: "混沌王座", difficulty: 30, monsters: [{ name: "混沌之主", hp: 3500, atk: 260, defense: 130, xp: 2000, is_boss: true }], gold_reward: 30000, xp_multiplier: 2.0, is_boss: true }] },
};

async function connectDB() {
  console.log(`[connectDB] MONGODB_URI available: ${!!MONGODB_URI}`);
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  if (mongoose.connection.readyState === 0) {
    console.log(`[connectDB] Connecting to MongoDB...`);
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log(`[connectDB] Connected successfully`);
  } else {
    console.log(`[connectDB] Already connected, state: ${mongoose.connection.readyState}`);
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
  // Defensive: ensure heroes.roster exists and is an array
  if (!user.heroes?.roster || !Array.isArray(user.heroes.roster)) {
    console.error(`[exploration] User ${user.userId} has no heroes.roster (heroes=${JSON.stringify(user.heroes)}), skipping`);
    return;
  }
  const exploringHeroes = user.heroes.roster.filter(h => h.isExploring);

  if (exploringHeroes.length === 0) {
    // Clear orphaned exploration state
    if (user.explorationState) {
      user.explorationState = null;
      user.markModified('explorationState');
      await user.save();
    }
    return;
  }

  const heroZone = exploringHeroes[0].currentZone;
  const heroSubZone = exploringHeroes[0].currentSubZone;
  const zoneData = subZones[heroZone];
  if (!zoneData) {
    console.error(`[exploration] Invalid zone ${heroZone}`);
    return;
  }

  const subZoneData = zoneData.sub_zones.find(sz => sz.id === heroSubZone);
  if (!subZoneData) {
    console.error(`[exploration] Invalid subZone ${heroSubZone} in zone ${heroZone}`);
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
      zone: heroZone,
      subZone: heroSubZone,
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
    console.log(`[exploration] New combat started - zone:${heroZone} subZone:${heroSubZone} enemy:${primaryMonster.name} HP:${primaryMonster.hp}`);
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
  let users;
  try {
    users = await User.find({});
  } catch (err) {
    console.error(`[tick] ERROR finding users:`, err.message);
    return;
  }
  console.log(`[tick] ${new Date().toISOString()} Processing ${users.length} user(s)`);

  for (const user of users) {
    console.log(`[tick] Processing user ${user.userId} (${user.username})`);
    try {
      // 1. Run idle tick (monument production, tavern, potion shop)
      await user.processIdleTick();
      console.log(`[tick] Idle tick done for ${user.userId}, gold=${user.gold}, monumentLevel=${user.buildings?.monument?.level}`);

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
        materials: user.materials instanceof Map ? Object.fromEntries(user.materials.entries()) : user.materials,
        materialCapacity: user.materialCapacity,
        buildings: user.buildings,
        heroes: {
          roster: Array.isArray(user.heroes?.roster) ? user.heroes.roster : [],
          territoryHeroCap: user.territoryHeroCap,
          wanderingHeroCap: user.wanderingHeroCap,
        },
        teams: user.teams instanceof Map ? Object.fromEntries(user.teams.entries()) : user.teams,
        battleLogs: user.battleLogs,
        guild: user.guild,
        statistics: user.statistics,
        unlockedZones: Array.isArray(user.unlockedZones) ? user.unlockedZones : [],
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
  console.log(`[worker] MONGODB_URI set: ${!!MONGODB_URI}`);

  try {
    await connectDB();
    console.log("[worker] Connected to MongoDB");

    // Main worker loop - runs every 5 seconds
    let tickCount = 0;
    setInterval(async () => {
      tickCount++;
      console.log(`[tick] ${new Date().toISOString()} Tick #${tickCount} START`);
      try {
        await processAllUsers();
      } catch (err) {
        console.error(`[tick] FATAL ERROR in tick #${tickCount}:`, err);
      }
      console.log(`[tick] ${new Date().toISOString()} Tick #${tickCount} END`);
    }, 5000);

    console.log("[worker] Worker tick started - processing every 5 seconds");
  } catch (err) {
    console.error("[worker] Failed to start:", err);
    process.exit(1);
  }
}

main();