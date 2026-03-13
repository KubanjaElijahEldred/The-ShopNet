"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CheckoutButton({
  location,
  paymentMethod,
  couponCode,
  disabled
}: {
  location: string;
  paymentMethod: string;
  couponCode?: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function placeOrder() {
    setPending(true);
    setError("");

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, paymentMethod, couponCode })
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to place order.");
      return;
    }

    router.push("/orders");
    router.refresh();
  }

  return (
    <div className="stack-inline">
      <button className="button" type="button" disabled={disabled || pending} onClick={placeOrder}>
        {pending ? "Placing order..." : "Place order"}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}
