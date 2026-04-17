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

export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";

    let battleHistory = user.battleLogs || [];

    // Filter by type
    if (type === "worldboss") {
      battleHistory = battleHistory.filter((log: any) => log.category === "worldboss");
    } else if (type === "exploration") {
      battleHistory = battleHistory.filter((log: any) =>
        log.category === "team_combat" || log.category === "solo_combat"
      );
    }

    // Sort by timestamp descending (newest first) and limit to 50
    battleHistory = battleHistory
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, 50);

    return NextResponse.json({
      success: true,
      data: {
        logs: battleHistory,
        total: battleHistory.length,
      },
    });
  } catch (error) {
    console.error("GET /api/logs error:", error);
    return NextResponse.json({ success: false, error: "獲取日誌失敗" }, { status: 500 });
  }
}
