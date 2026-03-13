"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { categories, sizes } from "@/lib/constants";

export function AddProductForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Could not add product.");
      return;
    }

    setSuccess("Product added successfully.");
    router.refresh();
  }

  return (
    <form className="stack-card form-card" onSubmit={handleSubmit}>
      <div>
        <span className="eyebrow">Seller tools</span>
        <h2>Add a new product</h2>
      </div>

      <label>
        Product title
        <input name="title" placeholder="Premium denim jacket" required />
      </label>

      <label>
        Category
        <select name="category" defaultValue="" required>
          <option value="" disabled>
            Select category
          </option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label>
        Description
        <textarea
          name="description"
          placeholder="Describe the product, condition, and standout features."
          rows={5}
          required
        />
      </label>

      <div className="grid-two">
        <label>
          Price (UGX)
          <input name="price" type="number" min="1" required />
        </label>

        <label>
          Stock
          <input name="stock" type="number" min="1" required />
        </label>
      </div>

      <div className="grid-two">
        <label>
          Size
          <select name="size" defaultValue="" required>
            <option value="" disabled>
              Select size
            </option>
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label>
          Rating
          <input name="rating" type="number" min="1" max="5" step="0.5" required />
        </label>
      </div>

      <label>
        Front image URL
        <input name="frontImage" type="url" required />
      </label>

      <label>
        Side image URL
        <input name="sideImage" type="url" required />
      </label>

      <label>
        Back image URL
        <input name="backImage" type="url" required />
      </label>

      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <button className="button" disabled={pending} type="submit">
        {pending ? "Saving..." : "Add product"}
      </button>
    </form>
  );
}
