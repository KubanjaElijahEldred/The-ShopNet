import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ChatForm } from "@/components/forms/ChatForm";
import { ReviewForm } from "@/components/forms/ReviewForm";
import { WishlistButton } from "@/components/products/WishlistButton";
import {
  getProducts,
  getReviewSummaryMap,
  getUserPublicProfiles,
  getWishlistItems
} from "@/lib/data";
import { getSessionUser } from "@/lib/session";

function keywordSet(product: { title: string; description: string; category: string }) {
  return new Set(
    `${product.title} ${product.description} ${product.category}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3)
  );
}

function relatedScore(
  current: { title: string; description: string; category: string },
  candidate: { title: string; description: string; category: string }
) {
  const currentKeywords = keywordSet(current);
  const candidateKeywords = keywordSet(candidate);
  let overlap = 0;

  for (const word of candidateKeywords) {
    if (currentKeywords.has(word)) {
      overlap += 1;
    }
  }

  return (current.category === candidate.category ? 10 : 0) + overlap;
}

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  const [products, reviewMap, ownerProfiles, wishlist] = await Promise.all([
    getProducts(),
    getReviewSummaryMap(),
    getUserPublicProfiles(),
    user ? getWishlistItems(user.id) : Promise.resolve([])
  ]);

  const product = products.find((item) => item.id === id);

  if (!product) {
    notFound();
  }

  const ownerMap = new Map(ownerProfiles.map((profile) => [profile.id, profile]));
  const wishlistIds = new Set(wishlist.map((item) => item.id));
  const summary = reviewMap.get(product.id);
  const relatedProducts = products
    .filter((item) => item.id !== product.id)
    .map((item) => ({
      ...item,
      score: relatedScore(product, item)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.rating - a.rating)
    .slice(0, 4);

  return (
    <div className="stack-page">
      <section className="organic-product-shell">
        <div className="organic-product-hero">
          <div className="organic-product-copy">
            <span className="eyebrow">Fresh pick from ShopNet</span>
            <h1>{product.title}</h1>
            <p>
              {product.description}
            </p>

            <div className="organic-detail-chips">
              <span>{product.category}</span>
              <span>Size {product.size}</span>
              <span>Stock {product.stock}</span>
            </div>

            <div className="organic-price-row">
              <strong>UGX {product.price.toLocaleString()}</strong>
              <span>Seller rating {product.rating}/5</span>
            </div>

            <div className="organic-meta-card">
              <div>
                <strong>Seller contact</strong>
                <p>{ownerMap.get(product.ownerId)?.mobileNumber || "Not added yet"}</p>
              </div>
              <div>
                <strong>Buyer feedback</strong>
                <p>
                  {summary
                    ? `${summary.averageRating.toFixed(1)}/5 from ${summary.reviewCount} reviews`
                    : "No buyer reviews yet"}
                </p>
              </div>
            </div>

            <div className="organic-actions">
              <AddToCartButton productId={product.id} />
              <WishlistButton
                productId={product.id}
                initiallySaved={wishlistIds.has(product.id)}
              />
            </div>
          </div>

          <div className="organic-visual-stage">
            <div className="organic-hero-image-card">
              <img src={product.frontImage} alt={`${product.title} front view`} />
            </div>

            <div className="organic-side-note">
              <div>
                <strong>Quick look</strong>
                <p>Three product angles, direct seller chat and marketplace-safe checkout.</p>
              </div>
              <Link href="/products" className="button button-secondary">
                Back to products
              </Link>
            </div>
          </div>
        </div>

        <div className="organic-gallery-band">
          <img src={product.frontImage} alt={`${product.title} front view`} />
          <img src={product.sideImage} alt={`${product.title} side view`} />
          <img src={product.backImage} alt={`${product.title} back view`} />
        </div>
      </section>

      <section className="organic-info-grid">
        <article className="organic-panel">
          <span className="eyebrow">Overview</span>
          <h2>Why shoppers pick this item</h2>
          <p>{product.description}</p>
          <div className="organic-feature-list">
            <div>
              <strong>Category</strong>
              <p>{product.category}</p>
            </div>
            <div>
              <strong>Size</strong>
              <p>{product.size}</p>
            </div>
            <div>
              <strong>Availability</strong>
              <p>{product.stock} units in stock</p>
            </div>
          </div>
        </article>

        {product.ownerId !== user?.id ? (
          <article className="organic-panel">
            <ChatForm
              user={user ? { id: user.id, name: user.name, email: user.email } : null}
              defaultProductId={product.id}
              recipientId={product.ownerId}
              title="Ask about this product"
              submitLabel="Send to owner"
            />
          </article>
        ) : null}
      </section>

      <section className="organic-panel">
        <div className="section-header">
          <div>
            <span className="eyebrow">In common</span>
            <h2>Products related to {product.title}</h2>
          </div>
        </div>
        <div className="organic-related-grid">
          {relatedProducts.length === 0 ? (
            <p className="muted">No closely related products yet.</p>
          ) : (
            relatedProducts.map((item) => (
              <article key={item.id} className="organic-related-card">
                <img src={item.frontImage} alt={item.title} />
                <div>
                  <span className="eyebrow">{item.category}</span>
                  <h3>{item.title}</h3>
                  <p className="muted">
                    {item.description.slice(0, 88)}
                    {item.description.length > 88 ? "..." : ""}
                  </p>
                  <div className="organic-related-footer">
                    <strong>UGX {item.price.toLocaleString()}</strong>
                    <Link href={`/products/${item.id}`} className="button button-secondary">
                      View
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="organic-panel">
        <div className="section-header">
          <div>
            <span className="eyebrow">Reviews</span>
            <h2>Buyer reviews</h2>
          </div>
        </div>

        {summary?.reviews?.length ? (
          <div className="organic-review-grid">
            {summary.reviews.slice(0, 4).map((review) => (
              <article key={review.id} className="organic-review-card">
                <strong>
                  {review.userName} · {review.rating}/5
                </strong>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No buyer reviews yet.</p>
        )}

        {user ? <ReviewForm productId={product.id} /> : null}
      </section>
    </div>
  );
}
