import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { touchUserPresence } from "@/lib/presence";

export async function POST() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await touchUserPresence({ id: user.id, email: user.email });
  return NextResponse.json({ ok: true });
}
