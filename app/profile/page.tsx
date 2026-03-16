import Link from "next/link";
import { redirect } from "next/navigation";
import { getProducts, getWishlistItems } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { ProfileClientView } from "@/components/profile/ProfileClientView";

export default async function ProfilePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  let products: Awaited<ReturnType<typeof getProducts>> = [];
  let wishlistItems: Awaited<ReturnType<typeof getWishlistItems>> = [];

  try {
    [products, wishlistItems] = await Promise.all([
      getProducts({ imageMode: "front" }),
      getWishlistItems(user.id)
    ]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load your profile data.";

    return (
      <div className="stack-page">
        <section className="stack-card">
          <span className="eyebrow">Database</span>
          <h1>Unable to load profile data</h1>
          <p className="muted">
            ShopNet could not reach MongoDB. Check Atlas network access and your
            `MONGODB_URI`, then reload this page.
          </p>
          <p className="muted">{message}</p>
          <Link href="/" className="button button-secondary">
            Back home
          </Link>
        </section>
      </div>
    );
  }

  const myProducts = products.filter((product) => product.ownerId === user.id);

  return (
    <ProfileClientView 
        user={{ ...user, mobileNumber: user.mobileNumber || "", profileImage: user.profileImage || "", shippingAddress: user.shippingAddress || "" }} 
        myProducts={myProducts} 
        wishlistItems={wishlistItems} 
    />
  );
}
