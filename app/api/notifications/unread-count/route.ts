import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getUnreadNotificationCount } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel") || undefined;

    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    const count = await getUnreadNotificationCount(user.id, channel);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ count: 0 });
  }
}
