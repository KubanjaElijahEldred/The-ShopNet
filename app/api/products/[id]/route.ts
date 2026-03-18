import { NextResponse } from "next/server";
import { deleteProduct, updateProduct } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { productSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Please login first." }, { status: 401 });
    }

    const { id } = await context.params;
    const payload = await request.json();
    const data = productSchema.parse(payload);
    const product = await updateProduct(id, user.id, data, user.role === "admin");

    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Please login first." }, { status: 401 });
    }

    const { id } = await context.params;
    await deleteProduct(id, user.id, user.role === "admin");

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
