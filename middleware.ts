import { NextResponse } from "next/server";
import { getSession } from "next-auth/react";

export async function middleware() {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/game"],
};