import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import WorldBoss from "@/models/WorldBoss";
import { CombatResolver } from "@/lib/game/combat/CombatResolver";

// Cast WorldBoss to any to access static methods defined on the schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WorldBossAny = WorldBoss as any;

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

    const boss = await WorldBossAny.getBoss();
    await boss.checkRespawn();

    return NextResponse.json({
      success: true,
      data: {
        boss: {
          name: boss.name,
          level: boss.level,
          currentHp: boss.currentHp,
          maxHp: boss.maxHp,
          atk: boss.atk,
          defense: boss.defense,
          isAlive: boss.isAlive,
        },
        userContribution: user.worldBoss?.totalDamage || 0,
      },
    });
  } catch (error) {
    console.error("GET /api/worldboss error:", error);
    return NextResponse.json({ success: false, error: "獲取世界王資訊失敗" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const body = await request.json();
    const { heroIds } = body;

    if (!heroIds || !Array.isArray(heroIds) || heroIds.length === 0) {
      return NextResponse.json({ success: false, error: "缺少 heroIds" }, { status: 400 });
    }

    const boss = await WorldBossAny.getBoss();
    await boss.checkRespawn();

    if (!boss.isAlive) {
      return NextResponse.json({ success: false, error: "世界王已死亡，請等待重生" }, { status: 400 });
    }

    // Find the heroes
    const heroes = heroIds
      .map((id: string) => user.heroes.roster.find((h: any) => h.id === id))
      .filter(Boolean);

    if (heroes.length === 0) {
      return NextResponse.json({ success: false, error: "沒有有效的英雄" }, { status: 400 });
    }

    // Validate hero types - only territory heroes can attack world boss
    const invalidHeroes = heroes.filter((h: any) => h.type !== "territory");
    if (invalidHeroes.length > 0) {
      return NextResponse.json(
        { success: false, error: `流浪英雄不能攻擊世界王: ${invalidHeroes.map((h: any) => h.name).join(", ")}` },
        { status: 400 }
      );
    }

    // Use zone 1, subZone 3 (boss zone) for world boss combat
    // Create a mock subZone for the boss
    const bossSubZone = {
      monsters: [{
        name: boss.name,
        hp: boss.currentHp,
        atk: boss.atk,
        defense: boss.defense,
        xp: 1000,
        is_boss: true,
      }],
      difficulty: boss.level,
      gold_reward: Math.floor(boss.maxHp * 0.01),
      stone_drop: [5, 15],
      xp_multiplier: 2.0,
      is_boss: true,
      is_elite: false,
    };

    const resolver = new CombatResolver();
    const result = resolver.resolveCombat(heroes, bossSubZone, 0);

    // Apply damage to boss
    const totalDamage = heroes.reduce((sum: number, h: any) => {
      // Estimate damage dealt (this is simplified)
      return sum + (h.atk * heroes.length * 2);
    }, 0);

    await boss.applyDamage(totalDamage);

    // Update user stats
    user.worldBoss.totalDamage = (user.worldBoss.totalDamage || 0) + totalDamage;
    user.worldBoss.lastAttack = Date.now();

    if (result.victory) {
      user.gold += result.goldReward;
      user.magicStones += result.magicStonesFound;
      user.statistics.bossesDefeated++;
    }

    // Add battle log
    user.addBattleLog({
      category: "worldboss",
      victory: result.victory,
      damageDealt: totalDamage,
      goldReward: result.goldReward,
      magicStonesFound: result.magicStonesFound,
      heroNames: heroes.map((h: any) => h.name),
      logMessages: result.logMessages,
    });

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        victory: result.victory,
        damageDealt: totalDamage,
        bossCurrentHp: boss.currentHp,
        bossMaxHp: boss.maxHp,
        goldReward: result.goldReward,
        magicStonesFound: result.magicStonesFound,
        logMessages: result.logMessages,
      },
    });
  } catch (error) {
    console.error("POST /api/worldboss error:", error);
    return NextResponse.json({ success: false, error: "世界王攻擊失敗" }, { status: 500 });
  }
}
