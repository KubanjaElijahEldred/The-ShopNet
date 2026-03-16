import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditProductForm } from "@/components/forms/EditProductForm";
import { getProductById } from "@/lib/data";
import { getSessionUser } from "@/lib/session";

export default async function EditProductPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const canManage = product.ownerId === user.id || user.role === "admin";

  if (!canManage) {
    return (
      <div className="stack-page">
        <section className="stack-card">
          <h1>You cannot edit this product</h1>
          <p className="muted">
            Only the owner or an administrator can update this listing.
          </p>
          <Link href={`/products/${id}`} className="button button-secondary">
            Back to product
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="stack-page">
      <section className="stack-card">
        <span className="eyebrow">Product editor</span>
        <h1>Update your listing</h1>
        <p className="muted">
          Save any changes to title, stock, images, and pricing.
        </p>
      </section>

      <EditProductForm product={product} />
    </div>
  );
}
