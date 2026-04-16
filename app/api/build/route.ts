import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  await connectDB();
  return User.findOne({ userId: session.user.id }) as Promise<any>;
}

// Building cost formulas
const BUILDING_COSTS: Record<string, (level: number) => Record<string, number>> = {
  castle: (level) => ({ gold: Math.floor(100 * Math.pow(level, 2)) }),
  tavern: (level) => ({ gold: Math.floor(50 * Math.pow(level, 2)), wood: Math.floor(20 * level) }),
  monument: (level) => ({ gold: Math.floor(80 * Math.pow(level, 2)), stone: Math.floor(30 * level) }),
  warehouse: (level) => ({ gold: Math.floor(30 * Math.pow(level, 2)), wood: Math.floor(15 * level) }),
  weaponShop: (level) => ({ gold: Math.floor(40 * Math.pow(level, 2)) }),
  armorShop: (level) => ({ gold: Math.floor(40 * Math.pow(level, 2)) }),
  potionShop: (level) => ({ gold: Math.floor(40 * Math.pow(level, 2)) }),
  lumberMill: (level) => ({ gold: Math.floor(60 * Math.pow(level, 2)), wood: Math.floor(20 * level) }),
  mine: (level) => ({ gold: Math.floor(60 * Math.pow(level, 2)), wood: Math.floor(20 * level) }),
  herbGarden: (level) => ({ gold: Math.floor(60 * Math.pow(level, 2)), wood: Math.floor(20 * level) }),
  guildHall: (level) => ({ gold: Math.floor(100 * Math.pow(level, 2)), wood: Math.floor(30 * level), iron: Math.floor(10 * level) }),
  barracks: (level) => ({ gold: Math.floor(100 * Math.pow(level, 2)), wood: Math.floor(30 * level), iron: Math.floor(10 * level) }),
};

const VALID_BUILDINGS = Object.keys(BUILDING_COSTS);

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const body = await request.json();
    const { building, action } = body;

    if (!building || !VALID_BUILDINGS.includes(building)) {
      return NextResponse.json({ success: false, error: `無效的建築: ${building}` }, { status: 400 });
    }

    if (!action || !["build", "upgrade"].includes(action)) {
      return NextResponse.json({ success: false, error: "action 必須是 build 或 upgrade" }, { status: 400 });
    }

    const currentLevel = user.getBuildingLevel(building);

    if (action === "build") {
      if (currentLevel > 0) {
        return NextResponse.json({ success: false, error: "建築已存在，請使用升級" }, { status: 400 });
      }
      const cost = BUILDING_COSTS[building](1);
      const result = user.buildStructure(building, cost);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.reason }, { status: 400 });
      }
      await user.save();
      return NextResponse.json({
        success: true,
        data: { message: `成功建造 ${building}`, level: 1 },
      });
    }

    if (action === "upgrade") {
      if (currentLevel === 0) {
        return NextResponse.json({ success: false, error: "建築不存在，請先建造" }, { status: 400 });
      }
      const nextLevel = currentLevel + 1;
      if (nextLevel > 10) {
        return NextResponse.json({ success: false, error: "已達最高等級" }, { status: 400 });
      }
      const cost = BUILDING_COSTS[building](nextLevel);
      const result = user.upgradeBuilding(building, cost);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.reason }, { status: 400 });
      }
      await user.save();
      return NextResponse.json({
        success: true,
        data: { message: `成功升級 ${building} 至 ${nextLevel}`, level: nextLevel },
      });
    }

    return NextResponse.json({ success: false, error: "無效的操作" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/build error:", error);
    return NextResponse.json({ success: false, error: "建築操作失敗" }, { status: 500 });
  }
}
