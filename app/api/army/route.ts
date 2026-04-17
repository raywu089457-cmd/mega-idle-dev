import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { UserRepository } from "@/lib/repositories/UserRepository";
import { ITEMS } from "@/lib/game/types/items";
import { requireFeature } from "@/lib/config/features";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  await connectDB();
  return UserRepository.findByIdActive(session.user.id);
}

const BASE_COSTS: Record<string, Record<string, number>> = {
  archery: { huntsman: 50, archer: 100, ranger: 200, survivalist: 400, sharpshooter: 800 },
  barracks: { peasant: 30, militia: 80, guardsman: 200, knight: 500, berserker: 600, justicar: 1000 },
};

export async function GET() {
  const blocked = requireFeature("army");
  if (blocked) return blocked;

  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        units: user.army?.units || { archery: {}, barracks: {} },
        armory: {
          weapon: Object.fromEntries(user.army?.armory?.weapon || new Map()),
          helmet: Object.fromEntries(user.army?.armory?.helmet || new Map()),
          armor: Object.fromEntries(user.army?.armory?.armor || new Map()),
          accessory: Object.fromEntries(user.army?.armory?.accessory || new Map()),
        },
        buildings: {
          archery: user.buildings?.archery?.level || 0,
          barracks: user.buildings?.barracks?.level || 0,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/army error:", error);
    return NextResponse.json({ success: false, error: "獲取軍隊資訊失敗" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const blocked = requireFeature("army");
  if (blocked) return blocked;

  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const body = await request.json();
    const { action, unitType, buildingType, itemId, count } = body;

    if (!user.army) {
      user.army = { units: { archery: {}, barracks: {} }, armory: { helmet: new Map(), chest: new Map(), legging: new Map(), weapon: new Map() } };
    }

    if (action === "train") {
      if (!unitType || !buildingType) {
        return NextResponse.json({ success: false, error: "缺少 unitType 或 buildingType" }, { status: 400 });
      }

      const buildingLevel = user.buildings?.[buildingType]?.level || 0;
      if (buildingLevel < 1) {
        return NextResponse.json({ success: false, error: `需要先建造 ${buildingType === "archery" ? "弓箭塔" : "兵營"}` }, { status: 400 });
      }

      const baseCost = BASE_COSTS[buildingType]?.[unitType] || 100;
      const cost = Math.floor(baseCost * Math.pow(1.5, Math.max(0, buildingLevel - 1)));
      const trainCount = Math.min(count || 1, 10);

      if (user.gold < cost * trainCount) {
        return NextResponse.json({ success: false, error: "黃金不足" }, { status: 400 });
      }

      user.gold -= cost * trainCount;
      if (!user.army.units[buildingType]) user.army.units[buildingType] = {};
      user.army.units[buildingType][unitType] = (user.army.units[buildingType][unitType] || 0) + trainCount;

      await user.save();
      return NextResponse.json({ success: true, data: { trained: trainCount, unit: unitType, cost: cost * trainCount } });
    }

    if (action === "equip") {
      if (!itemId) {
        return NextResponse.json({ success: false, error: "缺少 itemId" }, { status: 400 });
      }

      const item = ITEMS[itemId as string];
      if (!item) {
        return NextResponse.json({ success: false, error: "物品不存在" }, { status: 404 });
      }

      const slotMap: Record<string, string> = { weapon: "weapon", armor: "armor", helmet: "helmet", accessory: "accessory" };
      const slot = slotMap[item.type];
      if (!slot) {
        return NextResponse.json({ success: false, error: "該物品無法裝備到軍械室" }, { status: 400 });
      }

      const typeToInv: Record<string, string> = { weapon: "weapons", armor: "armor", helmet: "helmets", accessory: "accessories" };
      const invKey = typeToInv[item.type];
      const invMap = user.inventory[invKey];
      if (!invMap || (invMap.get(itemId) || 0) < 1) {
        return NextResponse.json({ success: false, error: "沒有該物品" }, { status: 400 });
      }

      if (!user.army.armory[slot]) user.army.armory[slot] = new Map();
      user.army.armory[slot].set(itemId, (user.army.armory[slot].get(itemId) || 0) + 1);
      invMap.set(itemId, invMap.get(itemId) - 1);
      if (invMap.get(itemId) <= 0) invMap.delete(itemId);

      await user.save();
      return NextResponse.json({ success: true, data: { equipped: itemId, slot } });
    }

    return NextResponse.json({ success: false, error: "無效的操作" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/army error:", error);
    return NextResponse.json({ success: false, error: "軍隊操作失敗" }, { status: 500 });
  }
}
