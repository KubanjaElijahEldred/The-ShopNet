import { NextResponse } from "next/server";
import { getNotificationsForUser } from "@/lib/data";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ notifications: [] });
  }

  const notifications = await getNotificationsForUser(user.id);
  return NextResponse.json({ notifications });
}
