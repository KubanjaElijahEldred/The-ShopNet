"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductOwnerControls({
  productId,
  redirectOnDelete,
  showViewLink = true
}: {
  productId: string;
  redirectOnDelete?: string;
  showViewLink?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this product? This will also remove it from carts and wishlists."
    );

    if (!confirmed) {
      return;
    }

    setPending(true);
    setError("");

    const response = await fetch(`/api/products/${productId}`, {
      method: "DELETE"
    });

    const data = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to delete product.");
      return;
    }

    if (redirectOnDelete) {
      router.push(redirectOnDelete);
      return;
    }

    router.refresh();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
      {showViewLink ? (
        <Link href={`/products/${productId}`} className="button button-secondary">
          View
        </Link>
      ) : null}
      <Link href={`/products/${productId}/edit`} className="button button-secondary">
        Edit
      </Link>
      <button
        type="button"
        className="button button-secondary"
        onClick={handleDelete}
        disabled={pending}
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
      {error ? <p className="error-text" style={{ margin: 0 }}>{error}</p> : null}
    </div>
  );
}
