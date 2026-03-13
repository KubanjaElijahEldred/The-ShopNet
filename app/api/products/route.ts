import { NextResponse } from "next/server";
import { createProduct, getProducts } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { productSchema } from "@/lib/validators";

export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ products });
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
    const message =
      error instanceof Error ? error.message : "Unable to create product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
