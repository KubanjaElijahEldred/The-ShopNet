"use client";

import Image from "next/image";
import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { demoLocations } from "@/lib/constants";
import { passwordRule } from "@/lib/validators";
import { Logo } from "@/components/Logo";
import { GoogleIcon } from "./AuthIcons";
import { GoogleOAuthButton } from "./GoogleOAuthButton";

type Mode = "signin" | "signup";

function getErrorMessage(value: unknown) {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed[0]?.message) {
        return parsed[0].message as string;
      }
    } catch {
      return value;
    }
  }

  return "Something went wrong.";
}

function getPasswordStrength(password: string) {
  if (password.length < 8) {
    return "weak";
  }

  if (
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  ) {
    return "strong";
  }

  return "medium";
}

async function readFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

export function UnifiedAuthForm({
  initialMode = "signin",
  clerkEnabled = false
}: {
  initialMode?: Mode;
  clerkEnabled?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isAdminSignup, setIsAdminSignup] = useState(false);
  const [password, setPassword] = useState("");

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleProfileImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setProfileImage("");
      return;
    }

    try {
      setProfileImage(await readFileAsDataUrl(file));
      setError("");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Unable to read the image."
      );
    }
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });
      const data = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(data.error) || "Unable to sign in.");
        return;
      }

      router.push(data.user?.role === "admin" ? "/admin" : "/profile");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Unable to sign in."
      );
    } finally {
      setPending(false);
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    if (!profileImage) {
      setError("Profile photo is required.");
      setPending(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          profileImage,
          role: isAdminSignup ? "admin" : "customer"
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(data.error) || "Unable to create account.");
        return;
      }

      router.push(data.user?.role === "admin" ? "/admin" : "/profile");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create account."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="unified-auth-container">
      <div className="unified-orb orb-huge-top-left" />
      <div className="unified-orb orb-large-top-right" />
      <div className="unified-orb orb-med-mid-right" />
      <div className="unified-orb orb-small-bottom-right" />
      <div className="unified-orb orb-med-bottom-left" />

      <div className="unified-auth-layout">
        <div className="unified-auth-hero">
          <div className="unified-auth-logo">
            <Logo size="large" />
          </div>
          <div className="unified-auth-copy">
            <span className="eyebrow">One account for shopping, selling, chat, and admin</span>
            <h1>Join ShopNet with a stronger, cleaner account flow.</h1>
            <p>
              Use one page to sign in, create your customer account, upload your profile
              photo, or open an admin account with the secure admin password.
            </p>
          </div>
          <Image
            src="/auth-hero-beanbag.png"
            alt="ShopNet auth artwork"
            width={640}
            height={640}
            className="unified-hero-image"
          />
        </div>

        <div className="unified-auth-card">
          <div className="unified-form-wrapper">
            <p className="unified-kicker">ShopNet access</p>
            <h2 className="unified-heading">
              {mode === "signin" ? "Sign in to your account" : "Create your account"}
            </h2>
            <p className="unified-subdued">
              {mode === "signin"
                ? "Use your email and password or continue with Google."
                : "Create one secure ShopNet account for shopping, selling, and messaging."}
            </p>

            <div className="unified-auth-toggles">
              <button
                type="button"
                className={mode === "signin" ? "active" : ""}
                onClick={() => {
                  setMode("signin");
                  setError("");
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={mode === "signup" ? "active" : ""}
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
              >
                Sign up
              </button>
            </div>

            {mode === "signin" ? (
              <form className="unified-form" onSubmit={handleSignIn}>
                <div className="unified-input-group">
                  <input type="email" name="email" placeholder="name@example.com" required />
                  <label>Email address</label>
                </div>

                <div className="unified-input-group">
                  <input type="password" name="password" placeholder="Enter your password" required />
                  <label>Password</label>
                </div>

                {error ? <p className="unified-error">{error}</p> : null}

                <button type="submit" disabled={pending} className="unified-submit-btn">
                  {pending ? "Signing in..." : "Sign in"}
                </button>

                <div className="unified-divider">
                  <span>or continue with</span>
                </div>

                {clerkEnabled ? (
                  <GoogleOAuthButton
                    mode="signin"
                    className="auth-google-button unified-google-button"
                    onError={setError}
                  />
                ) : (
                  <button
                    type="button"
                    className="auth-google-button unified-google-button"
                    onClick={() =>
                      setError(
                        "Continue with Google is not configured yet. Restart the dev server after adding Clerk keys."
                      )
                    }
                  >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </button>
                )}
              </form>
            ) : (
              <form className="unified-form" onSubmit={handleSignUp}>
                <div className="grid-two auth-grid-two">
                  <div className="unified-input-group">
                    <input type="text" name="name" placeholder="Your full name" required />
                    <label>Full name</label>
                  </div>

                  <div className="unified-input-group">
                    <input type="email" name="email" placeholder="name@example.com" required />
                    <label>Email address</label>
                  </div>
                </div>

                <div className="grid-two auth-grid-two">
                  <label className="unified-select-group">
                    <span>Location</span>
                    <select name="location" defaultValue={demoLocations[0]} required>
                      {demoLocations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="unified-input-group">
                    <input name="mobileNumber" placeholder="+256700000000" />
                    <label>Mobile number</label>
                  </div>
                </div>

                <div className="profile-photo-upload">
                  <label className="upload-label">
                    <span>Profile photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleProfileImageUpload}
                      className="file-input"
                    />
                    {profileImage ? (
                      <div className="profile-preview-wrap">
                        <div className="profile-preview">
                          <img src={profileImage} alt="Profile preview" />
                        </div>
                        <p>Profile image ready</p>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <svg viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="8" r="3.5" />
                          <path d="M5 20a7 7 0 0 1 14 0" />
                        </svg>
                        <span>Upload a required profile photo</span>
                      </div>
                    )}
                  </label>
                </div>

                <div className="unified-input-group">
                  <textarea
                    name="shippingAddress"
                    rows={3}
                    placeholder="Default delivery address"
                  />
                  <label>Shipping address</label>
                </div>

                <div className="grid-two auth-grid-two">
                  <div className="unified-input-group">
                    <input
                      type="password"
                      name="password"
                      placeholder="Create a strong password"
                      required
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <label>Password</label>
                  </div>

                  <div className="unified-input-group">
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Repeat your password"
                      required
                    />
                    <label>Confirm password</label>
                  </div>
                </div>

                <div className="password-strength-indicator">
                  <div className={`strength-bar strength-${passwordStrength}`}>
                    <div className="strength-fill" />
                  </div>
                  <p className="unified-helper">
                    <strong>Strong password required:</strong> {passwordRule}
                  </p>
                  <p className={`strength-text strength-${passwordStrength}`}>
                    Strength: <strong>{passwordStrength.toUpperCase()}</strong>
                  </p>
                </div>

                <label className="unified-checkbox-group">
                  <input
                    type="checkbox"
                    checked={isAdminSignup}
                    onChange={(event) => setIsAdminSignup(event.target.checked)}
                  />
                  <span>Sign up as admin</span>
                </label>

                {isAdminSignup ? (
                  <div className="unified-input-group">
                    <input
                      type="password"
                      name="adminPassword"
                      placeholder="Enter admin password"
                      required
                    />
                    <label>Admin password</label>
                  </div>
                ) : null}

                <label className="unified-checkbox-group">
                  <input type="checkbox" required />
                  <span>I agree to the processing of my personal data.</span>
                </label>

                {error ? <p className="unified-error">{error}</p> : null}

                <button type="submit" disabled={pending} className="unified-submit-btn">
                  {pending ? "Creating account..." : "Create account"}
                </button>

                <div className="unified-divider">
                  <span>or continue with</span>
                </div>

                {clerkEnabled ? (
                  <GoogleOAuthButton
                    mode="signup"
                    className="auth-google-button unified-google-button"
                    onError={setError}
                  />
                ) : (
                  <button
                    type="button"
                    className="auth-google-button unified-google-button"
                    onClick={() =>
                      setError(
                        "Continue with Google is not configured yet. Restart the dev server after adding Clerk keys."
                      )
                    }
                  >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
