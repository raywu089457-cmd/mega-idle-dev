import { NextRequest, NextResponse } from "next/server";
import { broadcast } from "@/lib/broadcast";

const WORKER_SECRET = process.env.WORKER_SECRET;

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-worker-secret");

  if (!WORKER_SECRET || secret !== WORKER_SECRET) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { userId, ...data } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    broadcast("user-update", { userId, ...data });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[broadcast] Internal broadcast error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
