import { NextResponse } from "next/server";
import { createReview, getReviews } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { getSafeRequestUrl } from "@/lib/url";
import { reviewSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const { searchParams } = getSafeRequestUrl(request, "/api/reviews");
  const productId = searchParams.get("productId") || undefined;
  const reviews = await getReviews(productId);
  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login before leaving a review." },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const data = reviewSchema.parse(payload);
    const review = await createReview({
      ...data,
      userId: user.id,
      userName: user.name
    });

    return NextResponse.json({ review });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save review.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
