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

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    // Check cooldown (7 days = 604800000 ms)
    const lastWeekly = user.cooldowns?.weekly ? new Date(user.cooldowns.weekly).getTime() : 0;
    if (Date.now() - lastWeekly < 604800000) {
      const remaining = 604800000 - (Date.now() - lastWeekly);
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);
      return NextResponse.json({
        success: false,
        error: `冷卻中，請等待 ${days} 天 ${hours} 小時`,
      }, { status: 400 });
    }

    // Give weekly reward
    user.gold += 5000;
    user.magicStones += 10;
    user.cooldowns.weekly = new Date();
    user.statistics.weeklyClaims++;

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        message: "領取每週獎勵成功",
        rewards: {
          gold: 5000,
          magicStones: 10,
        },
      },
    });
  } catch (error) {
    console.error("POST /api/rewards/weekly error:", error);
    return NextResponse.json({ success: false, error: "領取獎勵失敗" }, { status: 500 });
  }
}
