"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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

type AddProductFormProps = {
  mode?: "create" | "edit";
  product?: EditableProduct;
  onCancel?: () => void;
};

function resolveInitialImageMode(product?: EditableProduct) {
  if (!product) {
    return "url" as const;
  }

  const usesWebUrls = [product.frontImage, product.sideImage, product.backImage].every((value) =>
    value.startsWith("http")
  );

  return usesWebUrls ? "url" : "upload";
}

export function AddProductForm({
  mode = "create",
  product,
  onCancel
}: AddProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [imageMode, setImageMode] = useState<"url" | "camera" | "upload">(
    resolveInitialImageMode(product)
  );
  const [frontImage, setFrontImage] = useState(product?.frontImage || "");
  const [sideImage, setSideImage] = useState(product?.sideImage || "");
  const [backImage, setBackImage] = useState(product?.backImage || "");

  function resetImages() {
    setFrontImage("");
    setSideImage("");
    setBackImage("");
  }

  function handleFileCapture(
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    if (imageMode !== "url") {
      payload.frontImage = frontImage || "";
      payload.sideImage = sideImage || "";
      payload.backImage = backImage || "";
    }

    const endpoint = mode === "edit" && product ? `/api/products/${product.id}` : "/api/products";
    const method = mode === "edit" ? "PATCH" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || `Could not ${mode === "edit" ? "update" : "add"} product.`);
      return;
    }

    setSuccess(mode === "edit" ? "Product updated successfully." : "Product added successfully.");

    if (mode === "create") {
      event.currentTarget.reset();
      resetImages();
      setImageMode("url");
    } else {
      onCancel?.();
    }

    router.refresh();
  }

  return (
    <form className="stack-card form-card" onSubmit={handleSubmit}>
      <div>
        <span className="eyebrow">Seller tools</span>
        <h2>{mode === "edit" ? "Update product" : "Add a new product"}</h2>
      </div>

      <label>
        Product title
        <input
          name="title"
          placeholder="Premium denim jacket"
          defaultValue={product?.title || ""}
          required
        />
      </label>

      <label>
        Category
        <select name="category" defaultValue={product?.category || ""} required>
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
          defaultValue={product?.description || ""}
          required
        />
      </label>

      <div className="grid-two">
        <label>
          Price (UGX)
          <input
            name="price"
            type="number"
            min="1"
            defaultValue={product?.price || ""}
            required
          />
        </label>

        <label>
          Stock
          <input
            name="stock"
            type="number"
            min="1"
            defaultValue={product?.stock || ""}
            required
          />
        </label>
      </div>

      <div className="grid-two">
        <label>
          Size
          <select name="size" defaultValue={product?.size || ""} required>
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
          <input
            name="rating"
            type="number"
            min="1"
            max="5"
            step="0.5"
            defaultValue={product?.rating || ""}
            required
          />
        </label>
      </div>

      <div className="product-image-tabs">
        <label>Image source</label>
        <div className="unified-auth-toggles">
          <button
            type="button"
            className={imageMode === "url" ? "active" : ""}
            onClick={() => setImageMode("url")}
          >
            Image URLs
          </button>
          <button
            type="button"
            className={imageMode === "camera" ? "active" : ""}
            onClick={() => setImageMode("camera")}
          >
            Take images
          </button>
          <button
            type="button"
            className={imageMode === "upload" ? "active" : ""}
            onClick={() => setImageMode("upload")}
          >
            Upload images
          </button>
        </div>
      </div>

      {imageMode === "url" ? (
        <div className="image-inputs-group">
          <label>
            Front image URL
            <input
              name="frontImage"
              type="text"
              defaultValue={product?.frontImage || ""}
              required
            />
          </label>
          <label>
            Back image URL
            <input
              name="backImage"
              type="text"
              defaultValue={product?.backImage || ""}
              required
            />
          </label>
          <label>
            Side image URL
            <input
              name="sideImage"
              type="text"
              defaultValue={product?.sideImage || ""}
              required
            />
          </label>
        </div>
      ) : null}

      {imageMode === "camera" ? (
        <div className="image-inputs-group">
          <p className="muted">
            Use your camera to capture the front, back, and side of the product.
          </p>
          <label>
            Take front photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              required={!frontImage}
              onChange={(event) => handleFileCapture(event, setFrontImage)}
            />
            {frontImage ? <img src={frontImage} alt="Front preview" className="image-preview" /> : null}
          </label>
          <label>
            Take back photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              required={!backImage}
              onChange={(event) => handleFileCapture(event, setBackImage)}
            />
            {backImage ? <img src={backImage} alt="Back preview" className="image-preview" /> : null}
          </label>
          <label>
            Take side photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              required={!sideImage}
              onChange={(event) => handleFileCapture(event, setSideImage)}
            />
            {sideImage ? <img src={sideImage} alt="Side preview" className="image-preview" /> : null}
          </label>
        </div>
      ) : null}

      {imageMode === "upload" ? (
        <div className="image-inputs-group">
          <p className="muted">
            Upload front, back, and side images from your gallery.
          </p>
          <label>
            Upload front image
            <input
              type="file"
              accept="image/*"
              required={!frontImage}
              onChange={(event) => handleFileCapture(event, setFrontImage)}
            />
            {frontImage ? <img src={frontImage} alt="Front preview" className="image-preview" /> : null}
          </label>
          <label>
            Upload back image
            <input
              type="file"
              accept="image/*"
              required={!backImage}
              onChange={(event) => handleFileCapture(event, setBackImage)}
            />
            {backImage ? <img src={backImage} alt="Back preview" className="image-preview" /> : null}
          </label>
          <label>
            Upload side image
            <input
              type="file"
              accept="image/*"
              required={!sideImage}
              onChange={(event) => handleFileCapture(event, setSideImage)}
            />
            {sideImage ? <img src={sideImage} alt="Side preview" className="image-preview" /> : null}
          </label>
        </div>
      ) : null}

      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <div className="inline-actions wrap-actions">
        <button className="button" disabled={pending} type="submit">
          {pending
            ? mode === "edit"
              ? "Saving..."
              : "Creating..."
            : mode === "edit"
              ? "Save changes"
              : "Add product"}
        </button>
        {mode === "edit" ? (
          <button
            className="button button-secondary"
            type="button"
            disabled={pending}
            onClick={() => onCancel?.()}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
