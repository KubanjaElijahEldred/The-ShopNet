"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setError("");

    const formData = new FormData(form);

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        rating: formData.get("rating"),
        comment: formData.get("comment")
      })
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Could not save review.");
      return;
    }

    form.reset();
    router.refresh();
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <div className="grid-two">
        <label>
          Rating
          <input name="rating" type="number" min="1" max="5" step="0.5" required />
        </label>
        <label>
          Review
          <textarea name="comment" rows={3} required />
        </label>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <button className="button" type="submit" disabled={pending}>
        {pending ? "Posting..." : "Post review"}
      </button>
    </form>
  );
}
