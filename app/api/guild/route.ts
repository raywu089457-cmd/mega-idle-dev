import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { UserRepository } from "@/lib/repositories/UserRepository";
import { checkAndRefreshTasks, claimTaskReward, updateTaskProgress } from "@/lib/game/guild/guild-tasks";

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

    // Refresh tasks if needed
    checkAndRefreshTasks(user);

    return NextResponse.json({
      success: true,
      data: {
        guild: {
          name: user.guild?.name || "無公會",
          level: user.guild?.level || 0,
          tasksCompleted: user.guild?.tasksCompleted || 0,
          contribution: user.guild?.contribution || 0,
        },
        dailyTasks: user.guild?.dailyTasks || [],
      },
    });
  } catch (error) {
    console.error("GET /api/guild error:", error);
    return NextResponse.json({ success: false, error: "獲取公會資訊失敗" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, action, type, amount, metadata } = body;

    // Handle claim task reward
    if (action === "claim") {
      if (!taskId) {
        return NextResponse.json({ success: false, error: "缺少 taskId" }, { status: 400 });
      }

      const result = claimTaskReward(user, taskId);
      if (!result || !result.success) {
        return NextResponse.json({ success: false, error: result?.message || "領取失敗" }, { status: 400 });
      }

      await user.save();
      return NextResponse.json({
        success: true,
        data: {
          message: "領取獎勵成功",
          reward: result.reward,
        },
      });
    }

    // Handle update task progress
    if (action === "progress") {
      if (!type || !amount) {
        return NextResponse.json({ success: false, error: "缺少 type 或 amount" }, { status: 400 });
      }

      const updated = updateTaskProgress(user, type, amount, metadata || {});
      await user.save();

      return NextResponse.json({
        success: true,
        data: {
          updated,
          dailyTasks: user.guild?.dailyTasks || [],
        },
      });
    }

    return NextResponse.json({ success: false, error: "無效的操作" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/guild error:", error);
    return NextResponse.json({ success: false, error: "公會操作失敗" }, { status: 500 });
  }
}
