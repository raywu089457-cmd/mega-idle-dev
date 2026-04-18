import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { UserRepository } from "@/lib/repositories/UserRepository";
import { TeamDispatchSchema } from "@/lib/validation/schemas";
import { requireFeature } from "@/lib/config/features";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  await connectDB();
  return UserRepository.findByIdActive(session.user.id);
}

/**
 * Team Dispatch API
 *
 * Dispatches an entire team (teamIdx 0-4) to explore a zone/subZone.
 * All heroes in the team will fight together (team_combat).
 *
 * POST /api/dispatch/team
 * Body: { teamIdx: 0-4, zone: 1-10, subZone: 1-3, action?: "dispatch" | "recall" }
 */
export async function POST(request: Request) {
  try {
    // Check feature flag
    const blocked = requireFeature("dispatch");
    if (blocked) return blocked;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = TeamDispatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.issues.map((e: { message: string }) => e.message).join(", ")
      }, { status: 400 });
    }
    const { teamIdx, zone, subZone, action } = parsed.data;

    // Handle recall action - recall all exploring heroes from this team
    if (action === "recall") {
      const teamHeroIds = user.teams.get(String(teamIdx)) || [];
      const exploringHeroes: string[] = [];

      for (const heroId of teamHeroIds) {
        const hero = user.getHero(heroId);
        if (hero && hero.isExploring) {
          hero.lastZone = hero.currentZone;
          hero.lastSubZone = hero.currentSubZone;
          hero.isExploring = false;
          hero.currentZone = null;
          hero.currentSubZone = null;
          exploringHeroes.push(hero.name);
        }
      }

      // Remove all heroes from this team (they go back to idle pool)
      // Note: We don't call removeHeroFromTeam here - recall returns to idle pool,
      // team assignment is preserved for next dispatch

      await user.save();

      return NextResponse.json({
        success: true,
        data: {
          message: `成功召回 ${exploringHeroes.length} 名英雄`,
          recalledCount: exploringHeroes.length,
          recalledHeroes: exploringHeroes,
        },
      });
    }

    // Handle dispatch action - dispatch entire team
    const teamHeroIds = user.teams.get(String(teamIdx)) || [];

    if (teamHeroIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: `隊伍 ${teamIdx} 沒有英雄`,
      }, { status: 400 });
    }

    const dispatched: string[] = [];
    const failed: string[] = [];

    for (const heroId of teamHeroIds) {
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

    const category = dispatched.length > 1 ? "team_combat" : "solo_combat";

    return NextResponse.json({
      success: true,
      data: {
        dispatched,
        failed,
        message: dispatched.length > 0
          ? `成功派遣 ${dispatched.length} 名英雄到 第${teamIdx}隊`
          : "派遣失敗",
        category,
        teamIdx,
        zone,
        subZone,
      },
    });
  } catch (error) {
    console.error("POST /api/dispatch/team error:", error);
    return NextResponse.json({ success: false, error: "派遣隊伍失敗" }, { status: 500 });
  }
}
