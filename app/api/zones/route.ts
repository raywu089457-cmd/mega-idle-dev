import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { zones } from "@/lib/game/_UNIVERSE";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  await connectDB();
  return User.findOne({ userId: session.user.id }) as Promise<any>;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const unlockedZones = user.unlockedZones || [1];

    // Get user's exploration stats per zone
    const zoneStats = user.statistics?.zonesExplored || new Map();

    const zonesWithStatus = zones.map((zone: any) => ({
      id: zone.id,
      name: zone.name,
      subZones: zone.subZones,
      difficulty: zone.difficulty,
      boss: zone.boss,
      unlocked: unlockedZones.includes(zone.id),
      explorationCount: zoneStats.get?.(String(zone.id)) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        zones: zonesWithStatus,
        unlockedZones,
      },
    });
  } catch (error) {
    console.error("GET /api/zones error:", error);
    return NextResponse.json({ success: false, error: "獲取區域資訊失敗" }, { status: 500 });
  }
}
