"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { categories, sizes } from "@/lib/constants";

type EditableProduct = {
  id: string;
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

export function EditProductForm({ product }: { product: EditableProduct }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);

    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    const data = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to update product.");
      return;
    }

    setSuccess("Product updated successfully.");
    router.push(`/products/${product.id}`);
    router.refresh();
  }

  return (
    <form className="stack-card form-card" onSubmit={handleSubmit}>
      <div>
        <span className="eyebrow">Seller tools</span>
        <h2>Edit product</h2>
      </div>

      <label>
        Product title
        <input name="title" defaultValue={product.title} required />
      </label>

      <label>
        Category
        <select name="category" defaultValue={product.category} required>
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
          rows={5}
          defaultValue={product.description}
          required
        />
      </label>

      <div className="grid-two">
        <label>
          Price (UGX)
          <input name="price" type="number" min="1" defaultValue={product.price} required />
        </label>

        <label>
          Stock
          <input name="stock" type="number" min="1" defaultValue={product.stock} required />
        </label>
      </div>

      <div className="grid-two">
        <label>
          Size
          <select name="size" defaultValue={product.size} required>
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label>
          Rating
          <input
            name="rating"
            type="number"
            min="1"
            max="5"
            step="0.5"
            defaultValue={product.rating}
            required
          />
        </label>
      </div>

      <div className="grid-two">
        <label>
          Front image URL or uploaded data URL
          <input name="frontImage" defaultValue={product.frontImage} required />
        </label>
        <label>
          Side image URL or uploaded data URL
          <input name="sideImage" defaultValue={product.sideImage} required />
        </label>
        <label style={{ gridColumn: "span 2" }}>
          Back image URL or uploaded data URL
          <input name="backImage" defaultValue={product.backImage} required />
        </label>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <button className="button" disabled={pending} type="submit">
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
