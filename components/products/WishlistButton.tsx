"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WishlistButton({
  productId,
  initiallySaved
}: {
  productId: string;
  initiallySaved: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, setPending] = useState(false);

  async function toggleWishlist() {
    setPending(true);

    const response = await fetch("/api/wishlist", {
      method: saved ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId })
    });

    setPending(false);

    if (!response.ok) {
      return;
    }

    setSaved(!saved);
    router.refresh();
  }

  return (
    <button
      className="button button-secondary"
      type="button"
      onClick={toggleWishlist}
      disabled={pending}
    >
      {saved ? "Saved" : "Save to wishlist"}
    </button>
  );
}
