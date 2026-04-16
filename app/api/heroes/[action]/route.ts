import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { HeroManagementService } from "@/lib/game/services/HeroManagementService";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  await connectDB();
  return User.findOne({ userId: session.user.id }) as Promise<any>;
}

const VALID_ACTIONS = ["train", "feed", "water", "potion", "expel", "recruit-all"];

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ success: false, error: `無效的操作: ${action}` }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { heroId } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;

    switch (action) {
      case "train":
        if (!heroId) return NextResponse.json({ success: false, error: "缺少 heroId" }, { status: 400 });
        result = HeroManagementService.trainHero(user, heroId);
        break;
      case "feed":
        if (!heroId) return NextResponse.json({ success: false, error: "缺少 heroId" }, { status: 400 });
        result = HeroManagementService.feedHero(user, heroId);
        break;
      case "water":
        if (!heroId) return NextResponse.json({ success: false, error: "缺少 heroId" }, { status: 400 });
        result = HeroManagementService.giveWater(user, heroId);
        break;
      case "potion":
        if (!heroId) return NextResponse.json({ success: false, error: "缺少 heroId" }, { status: 400 });
        result = HeroManagementService.usePotion(user, heroId);
        break;
      case "expel":
        if (!heroId) return NextResponse.json({ success: false, error: "缺少 heroId" }, { status: 400 });
        result = HeroManagementService.expelHero(user, heroId);
        break;
      case "recruit-all":
        result = HeroManagementService.recruitAll(user);
        break;
      default:
        return NextResponse.json({ success: false, error: `無效的操作: ${action}` }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.reason ?? "操作失敗" }, { status: 400 });
    }

    await user.save();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(`POST /api/heroes/${action} error:`, error);
    return NextResponse.json({ success: false, error: "操作失敗" }, { status: 500 });
  }
}
