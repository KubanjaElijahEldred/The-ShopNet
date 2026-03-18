"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

async function readFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

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

  async function handleProfileImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setProfileImageValue(await readFileAsDataUrl(file));
      setError("");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Unable to read the image."
      );
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
      setError(data.error || "Unable to save profile details.");
      return;
    }

    setSuccess("Profile details saved.");
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

      <div className="profile-photo-upload">
        <label className="upload-label">
          <span>Profile image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleProfileImageChange}
            className="file-input"
          />
          {profileImageValue ? (
            <div className="profile-preview-wrap">
              <div className="profile-preview">
                <img src={profileImageValue} alt="Profile preview" />
              </div>
              <p>Tap to replace photo</p>
            </div>
          ) : (
            <div className="upload-placeholder">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20a7 7 0 0 1 14 0" />
              </svg>
              <span>Upload profile image</span>
            </div>
          )}
        </label>
      </div>

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
        {pending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
