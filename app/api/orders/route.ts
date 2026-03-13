import { NextResponse } from "next/server";
import { createOrder, getOrdersForUser, updateOrderStatus } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { orderSchema } from "@/lib/validators";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ orders: [] });
  }

  const orders = await getOrdersForUser(user.id);
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login before placing an order." },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const data = orderSchema.parse(payload);
    const order = await createOrder({
      userId: user.id,
      userName: user.name,
      ...data
    });

    return NextResponse.json({ order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to place order.";
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
    const order = await updateOrderStatus(payload.orderId, user.id, payload.status);

    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
