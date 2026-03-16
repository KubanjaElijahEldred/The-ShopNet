"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { categories, sizes } from "@/lib/constants";

export function AddProductForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [imageMode, setImageMode] = useState<"url" | "camera" | "gallery">("url");

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

    const createdProductId =
      typeof data?.product?.id === "string" ? data.product.id : "";

    if (createdProductId) {
      router.push(`/products/${createdProductId}`);
    } else {
      router.push("/products?sort=newest");
    }

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

      <div className="stack-card" style={{ background: "rgba(0,0,0,0.02)", padding: "16px", marginTop: "10px" }}>
        <span className="eyebrow" style={{ marginBottom: "12px", display: "block" }}>Add Product Images</span>
        
        <label>
          Image source
          <select 
            value={imageMode} 
            onChange={(e) => setImageMode(e.target.value as any)} 
            style={{ marginBottom: "16px" }}
          >
            <option value="url">Enter Image URLs</option>
            <option value="camera">Take a Photo (Camera)</option>
            <option value="gallery">Choose from Gallery</option>
          </select>
        </label>

        {imageMode === "url" && (
          <div className="grid-two">
            <label>
              Front image URL
              <input name="frontImage" type="url" required />
            </label>
            <label>
              Side image URL
              <input name="sideImage" type="url" required />
            </label>
            <label style={{ gridColumn: "span 2" }}>
              Back image URL
              <input name="backImage" type="url" required />
            </label>
          </div>
        )}

        {imageMode === "camera" && (
          <div style={{ padding: "30px", border: "2px dashed rgba(255,255,255,0.2)", borderRadius: "12px", textAlign: "center", marginBottom: "16px", background: "rgba(0,0,0,0.2)" }}>
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "10px" }}>📷</span>
            <label className="button button-secondary" style={{ cursor: "pointer", display: "inline-block" }}>
              Open Camera
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                style={{ display: "none" }} 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                     const reader = new FileReader();
                     reader.onloadend = () => {
                       const dataUrl = reader.result as string;
                       const front = document.getElementById("camera-front") as HTMLInputElement | null;
                       const side = document.getElementById("camera-side") as HTMLInputElement | null;
                       const back = document.getElementById("camera-back") as HTMLInputElement | null;
                       const preview = document.getElementById("cam-preview") as HTMLImageElement | null;

                       if (front) front.value = dataUrl;
                       if (side) side.value = dataUrl;
                       if (back) back.value = dataUrl;
                       if (preview) {
                         preview.src = dataUrl;
                         preview.style.display = "block";
                       }
                     };
                     reader.readAsDataURL(file);
                   }
                }}
              />
            </label>
            <p className="muted" style={{ marginTop: "10px" }}>Take a photo using your device camera.</p>
            <img id="cam-preview" src="/image.png" alt="Preview" style={{ display: 'none', width: '100%', maxWidth: '200px', margin: '10px auto', borderRadius: '8px' }} />
            
            <input type="hidden" id="camera-front" name="frontImage" value="" />
            <input type="hidden" id="camera-side" name="sideImage" value="" />
            <input type="hidden" id="camera-back" name="backImage" value="" />
          </div>
        )}

        {imageMode === "gallery" && (
          <div style={{ padding: "30px", border: "2px dashed rgba(255,255,255,0.2)", borderRadius: "12px", textAlign: "center", marginBottom: "16px", background: "rgba(0,0,0,0.2)" }}>
             <span style={{ fontSize: "2rem", display: "block", marginBottom: "10px" }}>🖼️</span>
             <label className="button button-secondary" style={{ cursor: "pointer", display: "inline-block" }}>
               Select from Library
               <input 
                 type="file" 
                 accept="image/*" 
                 style={{ display: "none" }} 
                 onChange={(e) => {
                   const file = e.target.files?.[0];
                   if (file) {
                   const reader = new FileReader();
                   reader.onloadend = () => {
                     const dataUrl = reader.result as string;
                     const front = document.getElementById("gallery-front") as HTMLInputElement | null;
                     const side = document.getElementById("gallery-side") as HTMLInputElement | null;
                     const back = document.getElementById("gallery-back") as HTMLInputElement | null;
                     const preview = document.getElementById("gal-preview") as HTMLImageElement | null;

                     if (front) front.value = dataUrl;
                     if (side) side.value = dataUrl;
                     if (back) back.value = dataUrl;
                     if (preview) {
                       preview.src = dataUrl;
                       preview.style.display = "block";
                     }
                   };
                   reader.readAsDataURL(file);
                 }
                 }}
               />
             </label>
             <p className="muted" style={{ marginTop: "10px" }}>Choose an existing photo from your device.</p>
             <img id="gal-preview" src="/image.png" alt="Preview" style={{ display: 'none', width: '100%', maxWidth: '200px', margin: '10px auto', borderRadius: '8px' }} />
             
             <input type="hidden" id="gallery-front" name="frontImage" value="" />
             <input type="hidden" id="gallery-side" name="sideImage" value="" />
             <input type="hidden" id="gallery-back" name="backImage" value="" />
          </div>
        )}
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <button className="button" disabled={pending} type="submit">
        {pending ? "Saving..." : "Add product"}
      </button>
    </form>
  );
}
