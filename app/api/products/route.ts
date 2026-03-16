import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createProduct, getProducts } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { productSchema } from "@/lib/validators";

function statusFromMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("timed out") ||
    normalized.includes("skipping new mongodb attempts") ||
    normalized.includes("mongodb")
  ) {
    return 503;
  }

  return 400;
}

export async function GET() {
  try {
    const products = await getProducts({ imageMode: "front" });
    return NextResponse.json({ products });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load products.";
    return NextResponse.json({ error: message }, { status: statusFromMessage(message) });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login before adding a product." },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const data = productSchema.parse(payload);
    const product = await createProduct({
      ownerId: user.id,
      ...data
    });

    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid product details." },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Unable to create product.";
    return NextResponse.json({ error: message }, { status: statusFromMessage(message) });
  }
}
