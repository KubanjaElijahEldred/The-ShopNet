import { NextResponse } from "next/server";
import {
  addCartItem,
  getCartItems,
  removeCartItem,
  updateCartItemQuantity
} from "@/lib/data";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ items: [] });
  }

  const items = await getCartItems(user.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login before adding items to cart." },
        { status: 401 }
      );
    }

    const payload = await request.json();
    await addCartItem(user.id, payload.productId, Number(payload.quantity || 1));

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update cart.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Please login first." }, { status: 401 });
    }

    const payload = await request.json();
    await updateCartItemQuantity(user.id, payload.productId, Number(payload.quantity));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update cart.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Please login first." }, { status: 401 });
    }

    const payload = await request.json();
    await removeCartItem(user.id, payload.productId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update cart.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
