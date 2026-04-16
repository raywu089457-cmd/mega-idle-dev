import { getServerSession } from "next-auth/next";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  // Find or create user (Discord snowflake ID matches existing MongoDB userId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any = await User.findOne({ userId: session.user.id });

  if (!user) {
    // Auto-create new player on first login
    user = new User({
      userId: session.user.id,
      username: session.user.name || `Player_${session.user.id.slice(-4)}`,
      lastTick: new Date(),
    });
    await user.save();
    user = await User.findOne({ userId: session.user.id });
  }

  // Process offline gains
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (user as any).processIdleTick();

  // Refresh after tick
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user = (await User.findOne({ userId: session.user.id })) as any;

  return Response.json({
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
  });
}
