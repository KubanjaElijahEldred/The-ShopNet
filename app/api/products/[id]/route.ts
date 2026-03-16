import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { deleteProduct, getProductById, updateProduct } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { productUpdateSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function statusFromMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("not found")) {
    return 404;
  }

  if (normalized.includes("cannot")) {
    return 403;
  }

  if (
    normalized.includes("timed out") ||
    normalized.includes("skipping new mongodb attempts") ||
    normalized.includes("mongodb")
  ) {
    return 503;
  }

  return 400;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load product.";
    return NextResponse.json({ error: message }, { status: statusFromMessage(message) });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login before updating a product." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const payload = await request.json();
    const data = productUpdateSchema.parse(payload);
    const product = await updateProduct(id, user.id, data, user.role);
    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid product details." },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unable to update product.";
    return NextResponse.json({ error: message }, { status: statusFromMessage(message) });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login before deleting a product." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const result = await deleteProduct(id, user.id, user.role);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete product.";
    return NextResponse.json({ error: message }, { status: statusFromMessage(message) });
  }
}
