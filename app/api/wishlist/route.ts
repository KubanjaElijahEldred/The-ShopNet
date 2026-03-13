import { NextResponse } from "next/server";
import {
  addWishlistItem,
  getWishlistItems,
  removeWishlistItem
} from "@/lib/data";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ items: [] });
  }

  const items = await getWishlistItems(user.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please login before saving wishlist items." },
      { status: 401 }
    );
  }

  const payload = await request.json();
  const item = await addWishlistItem(user.id, payload.productId);
  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please login before updating your wishlist." },
      { status: 401 }
    );
  }

  const payload = await request.json();
  await removeWishlistItem(user.id, payload.productId);
  return NextResponse.json({ ok: true });
}
