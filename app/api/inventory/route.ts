import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import ITEMS from "@/lib/game/_CONSTS/items";
type ItemEntry = { name: string; type: string; stats?: { attack: number; defense: number; hp: number }; cost?: Record<string, number>; healing?: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ITEMS_TYPED: Record<string, ItemEntry> = ITEMS as any;

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

    return NextResponse.json({
      success: true,
      data: {
        inventory: {
          weapons: Object.fromEntries(user.inventory?.weapons || new Map()),
          armor: Object.fromEntries(user.inventory?.armor || new Map()),
          helmets: Object.fromEntries(user.inventory?.helmets || new Map()),
          accessories: Object.fromEntries(user.inventory?.accessories || new Map()),
          potions: Object.fromEntries(user.inventory?.potions || new Map()),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/inventory error:", error);
    return NextResponse.json({ success: false, error: "獲取背包失敗" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const body = await request.json();
    const { action, itemId, heroId, slot } = body;

    if (action === "equip") {
      if (!itemId || !heroId || !slot) {
        return NextResponse.json({ success: false, error: "缺少 itemId, heroId, 或 slot" }, { status: 400 });
      }

      const hero = user.heroes?.roster?.find((h: any) => h.id === heroId);
      if (!hero) {
        return NextResponse.json({ success: false, error: "英雄不存在" }, { status: 404 });
      }
      if (hero.type !== "territory") {
        return NextResponse.json({ success: false, error: "只能裝備領地英雄" }, { status: 400 });
      }
      if (hero.isExploring) {
        return NextResponse.json({ success: false, error: "探索中的英雄無法裝備" }, { status: 400 });
      }

      const item = ITEMS_TYPED[itemId as string];
      if (!item) {
        return NextResponse.json({ success: false, error: "物品不存在" }, { status: 404 });
      }

      const typeToInv: Record<string, string> = { weapon: "weapons", armor: "armor", helmet: "helmets", accessory: "accessories" };
      const invKey = typeToInv[item.type];
      if (!invKey) {
        return NextResponse.json({ success: false, error: "該物品無法裝備" }, { status: 400 });
      }

      const invMap = user.inventory[invKey];
      if (!invMap || (invMap.get(itemId) || 0) < 1) {
        return NextResponse.json({ success: false, error: "沒有該物品" }, { status: 400 });
      }

      if (!hero.equipment) {
        hero.equipment = { weapon: null, armor: null, helmet: null, accessory: null };
      }
      const currentEquipped = hero.equipment[slot];
      if (currentEquipped) {
        const curItem = ITEMS_TYPED[currentEquipped as string];
        if (curItem) {
          const curInvKey = typeToInv[curItem.type];
          if (curInvKey) {
            user.inventory[curInvKey].set(currentEquipped, (user.inventory[curInvKey].get(currentEquipped) || 0) + 1);
          }
        }
      }

      hero.equipment[slot] = itemId;
      invMap.set(itemId, invMap.get(itemId) - 1);
      if (invMap.get(itemId) <= 0) invMap.delete(itemId);

      await user.save();
      return NextResponse.json({ success: true, data: { equipped: itemId, slot, heroId } });
    }

    if (action === "unequip") {
      if (!heroId || !slot) {
        return NextResponse.json({ success: false, error: "缺少 heroId 或 slot" }, { status: 400 });
      }

      const hero = user.heroes?.roster?.find((h: any) => h.id === heroId);
      if (!hero) {
        return NextResponse.json({ success: false, error: "英雄不存在" }, { status: 404 });
      }

      const itemId = hero.equipment?.[slot];
      if (!itemId) {
        return NextResponse.json({ success: false, error: "該槽位沒有裝備" }, { status: 400 });
      }

      const item = ITEMS_TYPED[itemId as string];
      if (!item) {
        return NextResponse.json({ success: false, error: "物品不存在" }, { status: 404 });
      }

      const typeToInv: Record<string, string> = { weapon: "weapons", armor: "armor", helmet: "helmets", accessory: "accessories" };
      const invKey = typeToInv[item.type];
      if (invKey) {
        user.inventory[invKey].set(itemId, (user.inventory[invKey].get(itemId) || 0) + 1);
      }

      hero.equipment[slot] = null;
      await user.save();
      return NextResponse.json({ success: true, data: { unequipped: itemId, slot, heroId } });
    }

    return NextResponse.json({ success: false, error: "無效的操作" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json({ success: false, error: "背包操作失敗" }, { status: 500 });
  }
}
