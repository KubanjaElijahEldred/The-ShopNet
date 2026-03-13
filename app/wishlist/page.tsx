import { redirect } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { getWishlistItems } from "@/lib/data";
import { getSessionUser } from "@/lib/session";

type WishlistProduct = {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  price: number;
  frontImage: string;
};

export default async function WishlistPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const items = await getWishlistItems(user.id);

  return (
    <div className="stack-page">
      <section className="stack-card">
        <span className="eyebrow">Wishlist</span>
        <h1>Saved products</h1>
        <p className="muted">
          Keep products you want to revisit later, just like larger marketplaces.
        </p>
      </section>

      <section className="product-grid">
        {items.length === 0 ? (
          <div className="stack-card">
            <p className="muted">You have not saved any products yet.</p>
          </div>
        ) : (
          items.map((product: WishlistProduct) => (
            <ProductCard key={product.id} product={{ ...product, rating: 5 }} />
          ))
        )}
      </section>
    </div>
  );
}
