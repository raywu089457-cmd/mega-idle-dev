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

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const teams: Record<string, unknown[]> = {};
    for (let i = 0; i < 5; i++) {
      const teamHeroIds = user.teams.get(String(i)) || [];
      const heroes = teamHeroIds
        .map((id: string) => user.heroes.roster.find((h: any) => h.id === id))
        .filter(Boolean);
      teams[String(i)] = heroes;
    }

    return NextResponse.json({
      success: true,
      data: { teams },
    });
  } catch (error) {
    console.error("GET /api/team error:", error);
    return NextResponse.json({ success: false, error: "獲取團隊失敗" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const body = await request.json();
    const { heroId, action, teamIdx } = body;

    if (!heroId) {
      return NextResponse.json({ success: false, error: "缺少 heroId" }, { status: 400 });
    }

    if (!action || !["add", "remove"].includes(action)) {
      return NextResponse.json({ success: false, error: "action 必須是 add 或 remove" }, { status: 400 });
    }

    if (action === "add" && (teamIdx === undefined || teamIdx < 0 || teamIdx > 4)) {
      return NextResponse.json({ success: false, error: "teamIdx 必須是 0-4" }, { status: 400 });
    }

    const hero = user.getHero(heroId);
    if (!hero) {
      return NextResponse.json({ success: false, error: "英雄不存在" }, { status: 404 });
    }
    if (hero.type !== "territory") {
      return NextResponse.json({ success: false, error: "只能操作領地英雄" }, { status: 400 });
    }

    let success: boolean;
    if (action === "add") {
      success = user.addHeroToTeam(heroId, teamIdx);
    } else {
      success = user.removeHeroFromTeam(heroId);
    }

    if (!success) {
      return NextResponse.json({ success: false, error: "操作失敗" }, { status: 400 });
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        message: action === "add" ? `將 ${hero.name} 加入團隊 ${teamIdx}` : `將 ${hero.name} 移出團隊`,
        hero,
      },
    });
  } catch (error) {
    console.error("POST /api/team error:", error);
    return NextResponse.json({ success: false, error: "團隊操作失敗" }, { status: 500 });
  }
}
