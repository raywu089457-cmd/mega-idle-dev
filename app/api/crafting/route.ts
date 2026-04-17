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

export async function POST(request: Request) {
  const blocked = requireFeature("crafting");
  if (blocked) return blocked;

  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({ success: false, error: "缺少 itemId" }, { status: 400 });
    }

    const item = ITEMS[itemId];
    if (!item) {
      return NextResponse.json({ success: false, error: "物品不存在" }, { status: 404 });
    }

    const cost = item.cost || {};
    if (!user.canAfford(cost)) {
      return NextResponse.json({ success: false, error: "資源不足" }, { status: 400 });
    }

    // Spend resources
    const spent = user.spendResources(cost);
    if (!spent) {
      return NextResponse.json({ success: false, error: "資源不足" }, { status: 400 });
    }

    // Add item to inventory based on type
    const itemType = item.type;
    switch (itemType) {
      case "weapon":
        user.inventory.weapons.set(itemId, (user.inventory.weapons.get(itemId) || 0) + 1);
        break;
      case "armor":
        user.inventory.armor.set(itemId, (user.inventory.armor.get(itemId) || 0) + 1);
        break;
      case "helmet":
        user.inventory.helmets.set(itemId, (user.inventory.helmets.get(itemId) || 0) + 1);
        break;
      case "accessory":
        user.inventory.accessories.set(itemId, (user.inventory.accessories.get(itemId) || 0) + 1);
        break;
      case "potion":
        user.inventory.potions.set(itemId, (user.inventory.potions.get(itemId) || 0) + 1);
        break;
      default:
        // Generic inventory slot
        break;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        message: `成功製作 ${item.name}`,
        item: {
          id: itemId,
          name: item.name,
          type: item.type,
          stats: item.stats,
        },
      },
    });
  } catch (error) {
    console.error("POST /api/crafting error:", error);
    return NextResponse.json({ success: false, error: "製作失敗" }, { status: 500 });
  }
}
