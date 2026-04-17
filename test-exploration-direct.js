/**
 * Direct test of exploration worker logic
 * Simulates what the worker does and checks results in the database
 */
require("dotenv").config({ path: "./next-app/.env" });
const mongoose = require("mongoose");
const User = require("./models/User");

async function main() {
  console.log("=== Direct Exploration Worker Test ===\n");

  // Connect to DB
  const MONGODB_URI = processenv.MONGODB_URI || process.env.MONGODB_URI;
  console.log(`Connecting to MongoDB...`);
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
  console.log(`Connected. ReadyState: ${mongoose.connection.readyState}\n`);

  // Find test user
  const user = await User.findOne({});
  if (!user) {
    console.error("No user found!");
    process.exit(1);
  }
  console.log(`User: ${user.username} (${user.userId})`);

  // Check current state
  const exploringHeroes = user.heroes.roster.filter(h => h.isExploring);
  console.log(`Exploring heroes: ${exploringHeroes.length}`);
  console.log(`All heroes:`);
  user.heroes.roster.forEach(h => {
    console.log(`  - ${h.name}: isExploring=${h.isExploring}, currentZone=${h.currentZone}, currentSubZone=${h.currentSubZone}, hp=${h.currentHp}/${h.maxHp}, atk=${h.atk}, def=${h.def}`);
  });
  console.log(`\nexplorationState: ${JSON.stringify(user.explorationState, null, 2)}`);
  console.log(`cooldowns.dispatch: ${user.cooldowns?.dispatch}`);

  // Simulate one tick of processExploration
  console.log("\n=== Simulating processExploration tick ===");

  const { subZones } = require("./lib/game/_UNIVERSE/sub-zones");

  const heroes = user.heroes.roster.filter(h => h.isExploring);
  if (heroes.length === 0) {
    console.log("No exploring heroes - checking if we can dispatch...");

    // Check a territory hero
    const territoryHero = user.heroes.roster.find(h => h.type === "territory" && !h.isExploring);
    if (territoryHero) {
      console.log(`\nTest hero: ${territoryHero.name}`);
      console.log(`  currentZone: ${territoryHero.currentZone}`);
      console.log(`  currentSubZone: ${territoryHero.currentSubZone}`);
      console.log(`  zone data check:`);

      const zone = territoryHero.currentZone || 1;
      const subZone = territoryHero.currentSubZone || 1;
      const zoneData = subZones[zone];
      console.log(`  subZones[${zone}]: ${zoneData ? zoneData.name : "UNDEFINED"}`);
      if (zoneData) {
        const subZoneData = zoneData.sub_zones.find(sz => sz.id === subZone);
        console.log(`  subZone ${subZone}: ${subZoneData ? subZoneData.name : "UNDEFINED"}`);
        if (subZoneData) {
          console.log(`  monsters: ${JSON.stringify(subZoneData.monsters[0])}`);
        }
      }
    }
  } else {
    console.log(`Exploring heroes found: ${heroes.map(h => h.name).join(", ")}`);
    if (user.explorationState) {
      console.log(`\nexplorationState:`);
      console.log(`  round: ${user.explorationState.round}`);
      console.log(`  enemy: ${user.explorationState.enemyName}`);
      console.log(`  enemyHP: ${user.explorationState.enemyCurrentHp}/${user.explorationState.enemyMaxHp}`);
      console.log(`  heroes in state:`);
      user.explorationState.heroes.forEach(h => {
        console.log(`    ${h.name}: hp=${h.currentHp}/${h.maxHp}`);
      });
    } else {
      console.log(`No explorationState yet - need to start combat`);
    }
  }

  // Check battle logs
  console.log(`\nBattle logs: ${user.battleLogs?.length || 0} entries`);
  if (user.battleLogs?.length > 0) {
    user.battleLogs.slice(0, 3).forEach(log => {
      console.log(`  - [${log.category}] ${log.heroNames?.join(",")} ${log.victory ? "VICTORY" : "DEFEAT"}`);
      console.log(`    logs: ${log.logMessages?.slice(0, 5).join(" | ")}`);
    });
  }

  await mongoose.disconnect();
  console.log("\n=== Test complete ===");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
