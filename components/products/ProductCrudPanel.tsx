"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddProductForm } from "@/components/forms/AddProductForm";

type ManagedProduct = {
  id: string;
  ownerId: string;
  ownerName?: string;
  title: string;
  description: string;
  category: string;
  price: number;
  size: string;
  rating: number;
  stock: number;
  frontImage: string;
  sideImage: string;
  backImage: string;
};

type ProductCrudPanelProps = {
  products: ManagedProduct[];
  title: string;
  description: string;
  showCreateForm?: boolean;
  canManageAll?: boolean;
};

export function ProductCrudPanel({
  products,
  title,
  description,
  showCreateForm = true,
  canManageAll = false
}: ProductCrudPanelProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const editingProduct = products.find((product) => product.id === editingId);

  async function handleDelete(productId: string) {
    const shouldDelete = window.confirm("Delete this product from ShopNet?");
    if (!shouldDelete) {
      return;
    }

    setPendingDeleteId(productId);
    setError("");

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE"
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to delete this product.");
        return;
      }

      if (editingId === productId) {
        setEditingId(null);
      }

      router.refresh();
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <section className="stack-page">
      <section className="stack-card">
        <span className="eyebrow">Product manager</span>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
      </section>

      {showCreateForm ? <AddProductForm /> : null}

      {editingProduct ? (
        <AddProductForm
          key={editingProduct.id}
          mode="edit"
          product={editingProduct}
          onCancel={() => setEditingId(null)}
        />
      ) : null}

      {error ? (
        <section className="stack-card">
          <p className="error-text">{error}</p>
        </section>
      ) : null}

      <section className="product-catalog-grid">
        {products.length === 0 ? (
          <article className="catalog-card">
            <div className="catalog-copy">
              <h3>No products yet</h3>
              <p className="muted">
                {canManageAll
                  ? "There are no products to manage right now."
                  : "Add your first product to start selling on ShopNet."}
              </p>
            </div>
          </article>
        ) : (
          products.map((product) => (
            <article key={product.id} className="catalog-card">
              <img src={product.frontImage} alt={product.title} className="catalog-thumb" />
              <div className="catalog-copy">
                <span className="product-category-tag">{product.category}</span>
                <div className="product-card-heading">
                  <h3>{product.title}</h3>
                  <strong className="product-card-price">
                    UGX {product.price.toLocaleString()}
                  </strong>
                </div>
                <p className="muted">
                  Size {product.size} · Stock {product.stock} · Rating {product.rating}/5
                </p>
                {canManageAll && product.ownerName ? (
                  <p className="muted">Owner: {product.ownerName}</p>
                ) : null}
                <div className="inline-actions wrap-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setEditingId(product.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button button-secondary danger-button"
                    disabled={pendingDeleteId === product.id}
                    onClick={() => handleDelete(product.id)}
                  >
                    {pendingDeleteId === product.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
