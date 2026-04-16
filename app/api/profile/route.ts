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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any = await User.findOne({ userId: session.user.id });

  if (!user) {
    user = new User({
      userId: session.user.id,
      username: session.user.name || `Player_${session.user.id.slice(-4)}`,
      lastTick: new Date(),
    });
    await user.save();
    user = await User.findOne({ userId: session.user.id });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = user as any;

  return Response.json({
    userId: u.userId,
    username: u.username,
    gold: u.gold,
    goldCapacity: u.goldCapacity,
    magicStones: u.magicStones,
    materials: Object.fromEntries(u.materials),
    materialCapacity: u.materialCapacity,
    buildings: u.buildings,
    cooldowns: u.cooldowns,
    statistics: u.statistics,
    unlockedZones: u.unlockedZones,
    worldBoss: u.worldBoss,
  });
}
