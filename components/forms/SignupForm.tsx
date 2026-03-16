"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { demoLocations } from "@/lib/constants";
import { imageFileToDataUrl } from "@/lib/client/image-utils";
import { passwordRule } from "@/lib/validators";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [profileImageData, setProfileImageData] = useState("");

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
      setProfileImageData(compressed);
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
    const selectedRole = formData.get("role") === "admin" ? "admin" : "user";
    const payload = Object.fromEntries(formData.entries());

    if (profileImageData) {
      payload.profileImage = profileImageData;
    }

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to create account.");
      return;
    }

    setSuccess("Account created successfully. Redirecting...");
    router.push(selectedRole === "admin" ? "/admin/dashboard" : "/profile");
    router.refresh();
  }

  return (
    <form className="stack-card form-card" onSubmit={handleSubmit}>
      <div>
        <span className="eyebrow">Create your ShopNet account</span>
        <h1>Start selling and shopping</h1>
        <p className="muted">{passwordRule}</p>
      </div>

      <label>
        Full name
        <input name="name" placeholder="Jane Seller" required />
      </label>

      <label>
        Email address
        <input name="email" type="email" placeholder="you@example.com" required />
      </label>

      <label>
        Mobile number (optional)
        <input name="mobileNumber" type="tel" placeholder="+256700000000" />
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

      {profileImageData ? (
        <img
          src={profileImageData}
          alt="Profile preview"
          style={{
            width: "76px",
            height: "76px",
            borderRadius: "999px",
            objectFit: "cover",
            border: "2px solid rgba(20, 35, 60, 0.12)"
          }}
        />
      ) : null}

      <label>
        Shipping address (optional)
        <textarea
          name="shippingAddress"
          rows={3}
          placeholder="Kampala Road, Plot 10, Kampala"
        />
      </label>

      <label>
        Location
        <select name="location" defaultValue="" required>
          <option value="" disabled>
            Select your location
          </option>
          {demoLocations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </label>

      <label>
        Account type
        <select name="role" defaultValue="user">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      <label>
        Password
        <input name="password" type="password" required />
      </label>

      <label>
        Confirm password
        <input name="confirmPassword" type="password" required />
      </label>

      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <button className="button" disabled={pending} type="submit">
        {pending ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}
