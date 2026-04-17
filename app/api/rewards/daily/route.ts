import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { UserRepository } from "@/lib/repositories/UserRepository";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  await connectDB();
  return UserRepository.findByIdActive(session.user.id);
}

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    // Check cooldown (24 hours = 86400000 ms)
    const lastDaily = user.cooldowns?.daily ? new Date(user.cooldowns.daily).getTime() : 0;
    if (Date.now() - lastDaily < 86400000) {
      const remaining = 86400000 - (Date.now() - lastDaily);
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      return NextResponse.json({
        success: false,
        error: `冷卻中，請等待 ${hours} 小時 ${minutes} 分鐘`,
      }, { status: 400 });
    }

    // Give daily reward
    user.gold += 500;
    user.magicStones += 1;
    user.cooldowns.daily = new Date();
    user.statistics.dailyClaims++;

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        message: "領取每日獎勵成功",
        rewards: {
          gold: 500,
          magicStones: 1,
        },
      },
    });
  } catch (error) {
    console.error("POST /api/rewards/daily error:", error);
    return NextResponse.json({ success: false, error: "領取獎勵失敗" }, { status: 500 });
  }
}
