import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";
import { getSafeAppBaseUrl } from "@/lib/url";

export async function POST() {
  await clearSessionCookie();
  const baseUrl = getSafeAppBaseUrl();
  return NextResponse.redirect(new URL("/login", baseUrl));
}
