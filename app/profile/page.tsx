import Link from "next/link";
import { redirect } from "next/navigation";
import { AddProductForm } from "@/components/forms/AddProductForm";
import { ProfileContactForm } from "@/components/forms/ProfileContactForm";
import { getProducts } from "@/lib/data";
import { getSessionUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const products = await getProducts();
  const myProducts = products.filter((product) => product.ownerId === user.id);

  return (
    <div className="profile-layout">
      <section className="stack-card">
        <span className="eyebrow">Account</span>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
        <p>Location: {user.location}</p>
        <p>Mobile number: {user.mobileNumber || "Not added yet"}</p>
        <p>Profile image: {user.profileImage || "Not added yet"}</p>
        <p>Shipping address: {user.shippingAddress || "Not added yet"}</p>
        <p className="muted">
          Your location helps ShopNet estimate delivery and checkout totals.
        </p>

        <div className="inline-actions">
          <Link href="/products" className="button button-secondary">
            Browse products
          </Link>
          <Link href="/dashboard" className="button button-secondary">
            Seller dashboard
          </Link>
          <Link href="/orders" className="button button-secondary">
            Order history
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button className="button" type="submit">
              Logout
            </button>
          </form>
        </div>
      </section>

      <AddProductForm />
      <ProfileContactForm
        mobileNumber={user.mobileNumber}
        profileImage={user.profileImage}
        shippingAddress={user.shippingAddress}
      />

      <section className="stack-card">
        <span className="eyebrow">Your products</span>
        <h2>Items you have listed</h2>
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
