import { getServerSession } from "next-auth/next";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { UserRepository } from "@/lib/repositories/UserRepository";
import { broadcast } from "@/lib/broadcast";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  let user = await UserRepository.findByIdActive(session.user.id);

  if (!user) {
    return Response.json(
      { error: "帳號已刪除，請重新登入", code: "ACCOUNT_DELETED" },
      { status: 401 }
    );
  }

  const snapshot = {
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
    army: {
      units: user.army?.units || { archery: {}, barracks: {} },
      armory: {
        weapon: Object.fromEntries(user.army?.armory?.weapon || new Map()),
        helmet: Object.fromEntries(user.army?.armory?.helmet || new Map()),
        armor: Object.fromEntries(user.army?.armory?.armor || new Map()),
        accessory: Object.fromEntries(user.army?.armory?.accessory || new Map()),
      },
    },
    inventory: {
      weapons: Object.fromEntries(user.inventory?.weapons || new Map()),
      armor: Object.fromEntries(user.inventory?.armor || new Map()),
      helmets: Object.fromEntries(user.inventory?.helmets || new Map()),
      accessories: Object.fromEntries(user.inventory?.accessories || new Map()),
      potions: Object.fromEntries(user.inventory?.potions || new Map()),
    },
    productionRates: {
      fruit: 5 * (1 + (user.buildings?.lumberMill?.level || 0) * 0.5) * (1 + (user.buildings?.monument?.level || 0) * 0.12),
      water: 5 * (1 + (user.buildings?.monument?.level || 0) * 0.12),
      wood: 5 * (1 + (user.buildings?.lumberMill?.level || 0) * 0.5) * (1 + (user.buildings?.monument?.level || 0) * 0.12),
      iron: 5 * (1 + (user.buildings?.mine?.level || 0) * 0.5) * (1 + (user.buildings?.monument?.level || 0) * 0.12),
      herbs: 5 * (1 + (user.buildings?.herbGarden?.level || 0) * 0.5) * (1 + (user.buildings?.monument?.level || 0) * 0.12),
    },
  };

  // Broadcast update to SSE clients
  broadcast("user-update", snapshot);

  return Response.json(snapshot);
}
