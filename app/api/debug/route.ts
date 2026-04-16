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

const VALID_ACTIONS = [
  "addGold",
  "addMagicStones",
  "addMaterial",
  "triggerTick",
  "spawnHero",
  "resetCooldowns",
  "fullHeal",
  "resetHeroHunger",
  "addExp",
  "unlockZone",
];

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { success: false, error: `無效的操作: ${action}` },
        { status: 400 }
      );
    }

    let result: Record<string, unknown>;

    switch (action) {
      case "addGold": {
        const amount = Math.max(0, parseInt(params.amount) || 0);
        user.gold = (user.gold || 0) + amount;
        result = { gold: user.gold };
        break;
      }
      case "addMagicStones": {
        const amount = Math.max(0, parseInt(params.amount) || 0);
        user.magicStones = (user.magicStones || 0) + amount;
        result = { magicStones: user.magicStones };
        break;
      }
      case "addMaterial": {
        const { material, amount } = params;
        const amt = Math.max(0, parseInt(amount) || 0);
        if (!material) {
          return NextResponse.json({ success: false, error: "缺少材料名稱" }, { status: 400 });
        }
        const current = user.materials.get(material) || 0;
        user.materials.set(material, current + amt);
        result = { [material]: user.materials.get(material) };
        break;
      }
      case "triggerTick": {
        const count = Math.min(100, Math.max(1, parseInt(params.count) || 1));
        // Process idle tick manually
        user.lastTick = new Date(Date.now() - count * 5000);
        // Recalculate resources from production
        const monument = user.buildings?.monument;
        if (monument?.level > 0) {
          const production = 2 * monument.level * count;
          user.gold = (user.gold || 0) + production;
        }
        result = { ticksProcessed: count, newGold: user.gold };
        break;
      }
      case "spawnHero": {
        const num = Math.min(10, Math.max(1, parseInt(params.count) || 1));
        const spawned = [];
        for (let i = 0; i < num; i++) {
          const hero = user.spawnWanderingHero();
          if (hero) spawned.push(hero.name);
        }
        result = { spawned };
        break;
      }
      case "resetCooldowns": {
        if (user.cooldowns) {
          user.cooldowns = {};
        }
        result = { cooldowns: {} };
        break;
      }
      case "fullHeal": {
        const heroes = user.heroes?.roster || [];
        let healed = 0;
        for (const hero of heroes) {
          if (hero.currentHp < hero.maxHp) {
            hero.currentHp = hero.maxHp;
            healed++;
          }
        }
        result = { healed };
        break;
      }
      case "resetHeroHunger": {
        const heroes = user.heroes?.roster || [];
        let reset = 0;
        for (const hero of heroes) {
          hero.hunger = 100;
          hero.thirst = 100;
          reset++;
        }
        result = { reset };
        break;
      }
      case "addExp": {
        const amount = Math.max(0, parseInt(params.amount) || 0);
        const heroes = user.heroes?.roster || [];
        for (const hero of heroes) {
          hero.experience = (hero.experience || 0) + amount;
        }
        result = { expAdded: amount, heroesAffected: heroes.length };
        break;
      }
      case "unlockZone": {
        const zone = Math.min(10, Math.max(1, parseInt(params.zone) || 1));
        if (!user.unlockedZones) user.unlockedZones = [];
        if (!user.unlockedZones.includes(zone)) {
          user.unlockedZones.push(zone);
        }
        result = { unlockedZones: user.unlockedZones };
        break;
      }
      default:
        return NextResponse.json({ success: false, error: "未實作" }, { status: 400 });
    }

    await user.save();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("POST /api/debug error:", error);
    return NextResponse.json({ success: false, error: "除錯操作失敗" }, { status: 500 });
  }
}
