"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { imageFileToDataUrl } from "@/lib/client/image-utils";

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
  const [profileImageValue, setProfileImageValue] = useState(profileImage || "");

  useEffect(() => {
    setProfileImageValue(profileImage || "");
  }, [profileImage]);

  async function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");

    try {
      const compressed = await imageFileToDataUrl(file, {
        maxDimension: 360,
        quality: 0.78
      });
      setProfileImageValue(compressed);
    } catch (photoError) {
      const message =
        photoError instanceof Error
          ? photoError.message
          : "Unable to process selected image.";
      setError(message);
    }
  }

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
        profileImage: profileImageValue,
        shippingAddress: formData.get("shippingAddress")
      })
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to save mobile number.");
      return;
    }

    setSuccess("Profile details updated.");
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
        Profile photo (camera or gallery)
        <input
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleProfilePhotoChange}
        />
      </label>
      {profileImageValue ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={profileImageValue}
            alt="Profile preview"
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "999px",
              objectFit: "cover",
              border: "2px solid rgba(20, 35, 60, 0.12)"
            }}
          />
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setProfileImageValue("")}
          >
            Remove photo
          </button>
        </div>
      ) : null}
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
        {pending ? "Saving..." : "Save profile details"}
      </button>
    </form>
  );
}
