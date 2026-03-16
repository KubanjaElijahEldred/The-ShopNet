"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddToCartButton({ productId, className }: { productId: string; className?: string }) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const router = useRouter();

  async function addToCart() {
    setPending(true);
    setFeedback("");

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 })
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setFeedback(data.error || "Unable to add product.");
      return;
    }

    setFeedback("Added to cart.");
    router.refresh();
  }

  return (
    <div className="inline-actions">
      <button className={className || "button"} onClick={addToCart} disabled={pending} type="button">
        {pending ? "Adding..." : "Add to cart"}
      </button>
      {feedback ? <span className="muted" style={{ display: 'block', fontSize: '12px', marginTop: '4px' }}>{feedback}</span> : null}
    </div>
  );
}
