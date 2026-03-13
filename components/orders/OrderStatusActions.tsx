"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrderStatusActions({
  orderId,
  canBuyerCancel,
  canBuyerReturn,
  sellerView
}: {
  orderId: string;
  canBuyerCancel?: boolean;
  canBuyerReturn?: boolean;
  sellerView?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function updateStatus(status: string) {
    setPending(true);
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status })
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="inline-actions wrap-actions">
      {canBuyerCancel ? (
        <button className="button button-secondary" type="button" disabled={pending} onClick={() => updateStatus("Cancelled")}>
          Cancel order
        </button>
      ) : null}
      {canBuyerReturn ? (
        <button className="button button-secondary" type="button" disabled={pending} onClick={() => updateStatus("Return Requested")}>
          Request return
        </button>
      ) : null}
      {sellerView ? (
        <>
          <button className="button button-secondary" type="button" disabled={pending} onClick={() => updateStatus("Confirmed")}>
            Confirm
          </button>
          <button className="button button-secondary" type="button" disabled={pending} onClick={() => updateStatus("Packed")}>
            Pack
          </button>
          <button className="button button-secondary" type="button" disabled={pending} onClick={() => updateStatus("Shipped")}>
            Ship
          </button>
          <button className="button button-secondary" type="button" disabled={pending} onClick={() => updateStatus("Delivered")}>
            Deliver
          </button>
        </>
      ) : null}
    </div>
  );
}
