import { getServerSession } from "next-auth/next";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { UserRepository } from "@/lib/repositories/UserRepository";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  let user = await UserRepository.findByIdActive(session.user.id);

  if (!user) {
    user = await UserRepository.findOrCreate(
      session.user.id,
      session.user.name || `Player_${session.user.id.slice(-4)}`
    );
  }

  return Response.json({
    userId: user.userId,
    username: user.username,
    gold: user.gold,
    goldCapacity: user.goldCapacity,
    magicStones: user.magicStones,
    materials: Object.fromEntries(user.materials),
    materialCapacity: user.materialCapacity,
    buildings: user.buildings,
    cooldowns: user.cooldowns,
    statistics: user.statistics,
    unlockedZones: user.unlockedZones,
    worldBoss: user.worldBoss,
  });
}
