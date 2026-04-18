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
    const lastDailyClaim = user.cooldowns?.daily ? new Date(user.cooldowns.daily).getTime() : 0;
    if (Date.now() - lastDailyClaim < 86400000) {
      const remaining = 86400000 - (Date.now() - lastDailyClaim);
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      return NextResponse.json({
        success: false,
        error: `冷卻中，請等待 ${hours} 小時 ${minutes} 分鐘`,
      }, { status: 400 });
    }

    // Track consecutive days (check if last claim was ~24h ago, but allow some grace period)
    const hoursSinceLastClaim = (Date.now() - lastDailyClaim) / 3600000;
    // If last claim was between 20-28 hours ago, increment consecutive days
    // Otherwise reset consecutive days (gap in login)
    if (hoursSinceLastClaim >= 20 && hoursSinceLastClaim <= 28) {
      user.statistics.consecutiveDays++;
    } else if (hoursSinceLastClaim > 28) {
      user.statistics.consecutiveDays = 1; // Reset on gap
    }

    // Give daily reward with streak bonus
    // Base: 500 gold + 1 magic stone
    // Streak bonus: +50 gold per consecutive day (capped at +500 bonus)
    // Magic stone: +1 per 7 consecutive days
    const streakBonus = Math.min(user.statistics.consecutiveDays * 50, 500);
    const goldReward = 500 + streakBonus;
    const magicStoneReward = user.statistics.consecutiveDays > 0 && user.statistics.consecutiveDays % 7 === 0 ? 2 : 1;

    user.gold += goldReward;
    user.magicStones += magicStoneReward;
    user.cooldowns.daily = new Date();
    user.statistics.dailyClaims++;

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        message: "領取每日獎勵成功",
        rewards: {
          gold: goldReward,
          magicStones: magicStoneReward,
          streakBonus,
          consecutiveDays: user.statistics.consecutiveDays,
        },
      },
    });
  } catch (error) {
    console.error("POST /api/rewards/daily error:", error);
    return NextResponse.json({ success: false, error: "領取獎勵失敗" }, { status: 500 });
  }
}
