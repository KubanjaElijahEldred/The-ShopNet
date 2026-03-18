import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/auth", request.url));
}
