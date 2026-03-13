"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileContactForm({
  mobileNumber,
  profileImage,
  shippingAddress
}: {
  mobileNumber?: string;
  profileImage?: string;
  shippingAddress?: string;
}) {
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
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobileNumber: formData.get("mobileNumber"),
        profileImage: formData.get("profileImage"),
        shippingAddress: formData.get("shippingAddress")
      })
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to save mobile number.");
      return;
    }

    setSuccess("Mobile number saved.");
    router.refresh();
  }

  return (
    <form className="stack-card" onSubmit={handleSubmit}>
      <span className="eyebrow">Contact details</span>
      <h2>Seller contact and avatar</h2>
      <label>
        Mobile number
        <input
          name="mobileNumber"
          defaultValue={mobileNumber || ""}
          placeholder="+256700000000"
          required
        />
      </label>
      <label>
        Profile image URL
        <input
          name="profileImage"
          defaultValue={profileImage || ""}
          placeholder="https://example.com/profile-photo.jpg"
        />
      </label>
      <label>
        Default shipping address
        <textarea
          name="shippingAddress"
          defaultValue={shippingAddress || ""}
          rows={4}
          placeholder="Kampala Road, Plot 10, Kampala"
        />
      </label>
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save mobile number"}
      </button>
    </form>
  );
}
