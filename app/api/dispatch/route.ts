import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { UserRepository } from "@/lib/repositories/UserRepository";
import { DispatchSchema } from "@/lib/validation/schemas";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  await connectDB();
  return UserRepository.findByIdActive(session.user.id);
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = DispatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.issues.map((e: { message: string }) => e.message).join(", ")
      }, { status: 400 });
    }
    const { heroIds, zone, subZone, difficulty, action } = parsed.data;

    // Handle recall action
    if (action === "recall") {
      const exploringHeroes = user.getExploringHeroes();
      for (const hero of exploringHeroes) {
        hero.lastZone = hero.currentZone;
        hero.lastSubZone = hero.currentSubZone;
        hero.isExploring = false;
        hero.currentZone = null;
        hero.currentSubZone = null;
        user.removeHeroFromTeam(hero.id);
      }
      await user.save();

      return NextResponse.json({
        success: true,
        data: {
          message: `成功召回 ${exploringHeroes.length} 名英雄`,
          recalledCount: exploringHeroes.length,
        },
      });
    }

    // Handle dispatch action
    if (!heroIds || !Array.isArray(heroIds) || heroIds.length === 0) {
      return NextResponse.json({ success: false, error: "缺少 heroIds" }, { status: 400 });
    }

    if (zone === undefined || subZone === undefined) {
      return NextResponse.json({ success: false, error: "缺少 zone 或 subZone" }, { status: 400 });
    }

    const dispatched: string[] = [];
    const failed: string[] = [];

    for (const heroId of heroIds) {
      const hero = user.getHero(heroId);
      if (!hero) {
        failed.push(`${heroId}: 英雄不存在`);
        continue;
      }
      if (hero.isExploring) {
        failed.push(`${hero.name}: 正在探索中`);
        continue;
      }
      if (hero.type !== "territory") {
        failed.push(`${hero.name}: 只能派遣領地英雄`);
        continue;
      }

      hero.isExploring = true;
      hero.currentZone = zone;
      hero.currentSubZone = subZone;
      dispatched.push(hero.name);
    }

    if (dispatched.length > 0) {
      user.cooldowns.dispatch = new Date();
    }

    await user.save();

    // If no heroes were dispatched, return error
    if (dispatched.length === 0) {
      return NextResponse.json({
        success: false,
        error: `派遣失敗: ${failed.join("; ")}`,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        dispatched,
        failed: failed.length > 0 ? failed : undefined,
        message: `成功派遣 ${dispatched.length} 名英雄`,
      },
    });
  } catch (error) {
    console.error("POST /api/dispatch error:", error);
    return NextResponse.json({ success: false, error: "派遣英雄失敗" }, { status: 500 });
  }
}
