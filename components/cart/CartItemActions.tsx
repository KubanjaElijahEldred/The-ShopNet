"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CartItemActions({
  productId,
  quantity
}: {
  productId: string;
  quantity: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function updateQuantity(nextQuantity: number) {
    setPending(true);
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: nextQuantity })
    });
    setPending(false);
    router.refresh();
  }

  async function removeItem() {
    setPending(true);
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId })
    });
    setPending(false);
    router.refresh();
  }

  async function saveForLater() {
    setPending(true);
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId })
    });
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId })
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="inline-actions wrap-actions">
      <button className="button button-secondary" type="button" onClick={() => updateQuantity(quantity - 1)} disabled={pending}>
        -
      </button>
      <span className="pill">Qty {quantity}</span>
      <button className="button button-secondary" type="button" onClick={() => updateQuantity(quantity + 1)} disabled={pending}>
        +
      </button>
      <button className="button button-secondary" type="button" onClick={saveForLater} disabled={pending}>
        Save for later
      </button>
      <button className="button button-secondary" type="button" onClick={removeItem} disabled={pending}>
        Remove
      </button>
    </div>
  );
}
