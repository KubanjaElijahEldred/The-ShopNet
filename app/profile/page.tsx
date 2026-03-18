import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { ProfileContactForm } from "@/components/forms/ProfileContactForm";
import { getProducts, getWishlistItems } from "@/lib/data";
import { getSessionUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth");
  }

  const [products, wishlist] = await Promise.all([
    getProducts(),
    getWishlistItems(user.id)
  ]);
  const myProducts = products.filter((product) => product.ownerId === user.id);

  return (
    <div className="profile-layout">
      <section className="stack-card profile-hero-card">
        <div className="profile-hero-header">
          <div className="profile-hero-avatar">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} />
            ) : (
              <span>{user.name.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div>
            <span className="eyebrow">Account</span>
            <h1>{user.name}</h1>
            <p className="muted">{user.email}</p>
            <p className="muted">Location: {user.location}</p>
          </div>
        </div>

        <div className="profile-detail-grid">
          <div>
            <strong>Mobile number</strong>
            <p>{user.mobileNumber || "Not added yet"}</p>
          </div>
          <div>
            <strong>Shipping address</strong>
            <p>{user.shippingAddress || "Not added yet"}</p>
          </div>
        </div>

        <div className="inline-actions wrap-actions">
          <Link href="/products" className="button">
            Manage products
          </Link>
          <Link href="/orders" className="button button-secondary">
            Order history
          </Link>
          <Link href="/dashboard" className="button button-secondary">
            Seller dashboard
          </Link>
          {user.role === "admin" ? (
            <Link href="/admin" className="button button-secondary">
              Admin dashboard
            </Link>
          ) : null}
          <form action="/api/auth/logout" method="POST">
            <button className="button button-secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </section>

      <ProfileContactForm
        mobileNumber={user.mobileNumber}
        profileImage={user.profileImage}
        shippingAddress={user.shippingAddress}
      />

      <section className="stack-card">
        <div className="section-header">
          <div>
            <span className="eyebrow">Wishlist</span>
            <h2>Saved items</h2>
          </div>
          <Link href="/wishlist" className="button button-secondary">
            Open wishlist
          </Link>
        </div>

        {wishlist.length === 0 ? (
          <p className="muted">You have not saved any products yet.</p>
        ) : (
          <div className="product-grid">
            {wishlist.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={{ ...product, rating: product.rating || 5 }} />
            ))}
          </div>
        )}
      </section>

      <section className="stack-card">
        <div className="section-header">
          <div>
            <span className="eyebrow">Your products</span>
            <h2>Listings you own</h2>
          </div>
          <Link href="/products" className="button button-secondary">
            Open product manager
          </Link>
        </div>

        {myProducts.length === 0 ? (
          <p className="muted">You have not added any products yet.</p>
        ) : (
          <div className="owner-products">
            {myProducts.map((product) => (
              <article key={product.id} className="owner-product">
                <img src={product.frontImage} alt={product.title} />
                <div>
                  <h3>{product.title}</h3>
                  <p>{product.category}</p>
                  <p>UGX {product.price.toLocaleString()}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
