import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

interface RegisterDto {
  email: string;
  password: string;
  username?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, username } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "請填寫電子郵件和密碼" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "密碼至少需要 8 個字元" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await (User as any).register({ email, password, username } as RegisterDto);
    return NextResponse.json({
      success: true,
      data: {
        userId: user.userId,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "註冊失敗";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
