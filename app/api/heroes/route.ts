import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { UserRepository } from "@/lib/repositories/UserRepository";
import { HeroManagementService } from "@/lib/game/services/HeroManagementService";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  await connectDB();
  return UserRepository.findByIdActive(session.user.id);
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const territoryHeroes = user.heroes.roster.filter((h: any) => h.type === "territory");
    const wanderingHeroes = user.heroes.roster.filter((h: any) => h.type === "wandering");

    return NextResponse.json({
      success: true,
      data: {
        territoryHeroes,
        wanderingHeroes,
        territoryCap: user.territoryHeroCap,
        wanderingCap: user.wanderingHeroCap,
        usedTerritorySlots: user.heroes.usedTerritorySlots,
        usedWanderingSlots: user.heroes.usedWanderingSlots,
      },
    });
  } catch (error) {
    console.error("GET /api/heroes error:", error);
    return NextResponse.json({ success: false, error: "獲取英雄列表失敗" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const body = await request.json();
    const { action, heroId } = body;

    // Handle recruit action - auto-select a random wandering hero
    if (action === "recruit") {
      const wanderingHeroes = user.getWanderingHeroes();
      if (wanderingHeroes.length === 0) {
        return NextResponse.json({ success: false, error: "沒有流浪英雄可招募" }, { status: 400 });
      }
      // Pick a random wandering hero
      const randomHero = wanderingHeroes[Math.floor(Math.random() * wanderingHeroes.length)];
      const result = HeroManagementService.recruitFromTavern(user, randomHero.id);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.reason }, { status: 400 });
      }
      await user.save();
      return NextResponse.json({
        success: true,
        data: {
          message: `成功招募 ${result.hero.name}`,
          hero: result.hero,
        },
      });
    }

    // Handle single hero recruitment by ID (legacy support)
    if (!heroId) {
      return NextResponse.json({ success: false, error: "缺少 heroId" }, { status: 400 });
    }

    const result = HeroManagementService.recruitFromTavern(user, heroId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.reason }, { status: 400 });
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        message: `成功招募 ${result.hero.name}`,
        hero: result.hero,
      },
    });
  } catch (error) {
    console.error("POST /api/heroes error:", error);
    return NextResponse.json({ success: false, error: "招募英雄失敗" }, { status: 500 });
  }
}
