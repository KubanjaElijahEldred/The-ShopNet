"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { demoLocations } from "@/lib/constants";
import { imageFileToDataUrl } from "@/lib/client/image-utils";
import { GoogleIcon, AppleIcon, FacebookIcon, TwitterIcon } from "./AuthIcons";
import { GoogleOAuthButton } from "./GoogleOAuthButton";

type AuthMode = "signin" | "signup";

export function UnifiedAuthForm({
  initialMode = "signin",
  clerkEnabled = false
}: {
  initialMode?: AuthMode;
  clerkEnabled?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [signinPending, setSigninPending] = useState(false);
  const [signinError, setSigninError] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPending, setSignupPending] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupProfileImage, setSignupProfileImage] = useState("");
  const [signupTerms, setSignupTerms] = useState(false);
  const [signupAsAdmin, setSignupAsAdmin] = useState(false);

  const formatErrorMsg = (err: unknown) => {
    if (typeof err === "string") {
      try {
        const parsed = JSON.parse(err);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          return parsed[0].message;
        }
      } catch {
        return err;
      }
    }

    return "Something went wrong.";
  };

  async function handleSignupPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSignupError("");

    try {
      const compressed = await imageFileToDataUrl(file, {
        maxDimension: 360,
        quality: 0.78
      });
      setSignupProfileImage(compressed);
    } catch (photoError) {
      const message =
        photoError instanceof Error
          ? photoError.message
          : "Unable to capture selected image.";
      setSignupError(message);
    }
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSigninPending(true);
    setSigninError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: signinEmail.trim(),
        password: signinPassword
      })
    });

    const data = await response.json();
    setSigninPending(false);

    if (!response.ok) {
      setSigninError(formatErrorMsg(data.error) || "Unable to sign in.");
      return;
    }

    router.push("/profile");
    router.refresh();
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupPending(true);
    setSignupError("");

    if (!signupTerms) {
      setSignupError("Please accept terms before creating account.");
      setSignupPending(false);
      return;
    }

    const payload: Record<string, string> = {
      name: signupName.trim(),
      email: signupEmail.trim(),
      password: signupPassword,
      confirmPassword: signupPassword,
      role: signupAsAdmin ? "admin" : "user",
      location: demoLocations[0]
    };

    if (signupProfileImage) {
      payload.profileImage = signupProfileImage;
    }

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setSignupPending(false);

    if (!response.ok) {
      setSignupError(formatErrorMsg(data.error) || "Unable to create account.");
      return;
    }

    router.push(signupAsAdmin ? "/admin/dashboard" : "/profile");
    router.refresh();
  }

  return (
    <section className="poster-auth-page">
      <div className="poster-mobile-switch">
        <button
          type="button"
          className={mode === "signin" ? "active" : ""}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={mode === "signup" ? "active" : ""}
          onClick={() => setMode("signup")}
        >
          Sign up
        </button>
      </div>

      <div className="poster-auth-strip">
        <article className="poster-card poster-card-welcome">
          <div className="poster-top poster-top-only">
            <div className="poster-orb orb-a" />
            <div className="poster-orb orb-b" />
            <div className="poster-orb orb-c" />
            <h2 className="poster-sale-title">BIG SALE</h2>
            <Image
              src="/auth-hero-beanbag.png"
              alt="Big sale hero"
              width={360}
              height={320}
              className="poster-hero"
              priority
            />
          </div>
          <div className="poster-card-body poster-card-body-center">
            <h3 className="poster-title">Welcome Back!</h3>
            <p className="poster-subtitle">Enter personal details to your employee account</p>
            <div className="poster-actions">
              <button type="button" onClick={() => setMode("signin")}>
                Sign in
              </button>
              <button type="button" onClick={() => setMode("signup")}>
                Sign up
              </button>
            </div>
          </div>
        </article>

        <article className={`poster-card poster-card-form ${mode === "signup" ? "is-active" : ""}`}>
          <div className="poster-top">
            <div className="poster-orb orb-a" />
            <div className="poster-orb orb-b" />
            <div className="poster-orb orb-c" />
            <div className="poster-brand-logo">
              <img src="/image.png" alt="ShopNet" width={68} height={68} />
            </div>
            <Image
              src="/auth-hero-beanbag.png"
              alt="Big sale hero"
              width={300}
              height={220}
              className="poster-hero poster-hero-compact"
              priority
            />
          </div>
          <div className="poster-card-body">
            <h3 className="poster-title">Get Started</h3>
            <form className="poster-form" onSubmit={handleSignUp}>
              <label>
                Full Name
                <input
                  type="text"
                  value={signupName}
                  onChange={(event) => setSignupName(event.target.value)}
                  placeholder="Enter Full Name"
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(event) => setSignupEmail(event.target.value)}
                  placeholder="Enter Email"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(event) => setSignupPassword(event.target.value)}
                  placeholder="Enter Password"
                  required
                />
              </label>
              <label className="poster-photo-input">
                Add profile photo (camera or gallery)
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleSignupPhotoChange}
                />
              </label>

              {signupProfileImage ? (
                <img
                  src={signupProfileImage}
                  alt="Profile preview"
                  className="poster-photo-preview"
                />
              ) : null}

              <label className="poster-check">
                <input
                  type="checkbox"
                  checked={signupTerms}
                  onChange={(event) => setSignupTerms(event.target.checked)}
                  required
                />
                <span>I agree to the processing of Personal data</span>
              </label>

              <label className="poster-check">
                <input
                  type="checkbox"
                  checked={signupAsAdmin}
                  onChange={(event) => setSignupAsAdmin(event.target.checked)}
                />
                <span>Register as Administrator</span>
              </label>

              {signupError ? <p className="poster-error">{signupError}</p> : null}
              {clerkEnabled ? (
                <div className="poster-clerk-captcha-wrap">
                  <div id="clerk-captcha" />
                </div>
              ) : null}

              <button type="submit" className="poster-submit" disabled={signupPending}>
                {signupPending ? "Signing up..." : "Sign up"}
              </button>

              {clerkEnabled && mode === "signup" ? (
                <GoogleOAuthButton
                  mode="signup"
                  className="poster-google-btn"
                  onError={setSignupError}
                />
              ) : (
                <button
                  type="button"
                  className="poster-google-btn"
                  onClick={() => {
                    if (!clerkEnabled) {
                      setSignupError(
                        "Continue with Google is not configured yet. Add Clerk keys in .env.local and restart npm run dev."
                      );
                      return;
                    }

                    setMode("signup");
                    setSignupError("Select Sign up first, then continue with Google.");
                  }}
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>
              )}
            </form>

            <div className="poster-social-divider">
              <span>or sign up with</span>
            </div>
            <div className="poster-socials">
              <button type="button" aria-label="Facebook">
                <FacebookIcon />
              </button>
              <button type="button" aria-label="Twitter">
                <TwitterIcon />
              </button>
              <button type="button" aria-label="Apple">
                <AppleIcon />
              </button>
            </div>
            <p className="poster-switch">
              Already have an account?
              <button type="button" onClick={() => setMode("signin")}>
                Sign in
              </button>
            </p>
          </div>
        </article>

        <article className={`poster-card poster-card-form ${mode === "signin" ? "is-active" : ""}`}>
          <div className="poster-top">
            <div className="poster-orb orb-a" />
            <div className="poster-orb orb-b" />
            <div className="poster-orb orb-c" />
            <h2 className="poster-sale-title poster-sale-title-small">BIG SALE</h2>
            <Image
              src="/auth-hero-beanbag.png"
              alt="Welcome back hero"
              width={300}
              height={220}
              className="poster-hero poster-hero-compact"
              priority
            />
          </div>
          <div className="poster-card-body">
            <h3 className="poster-title">Welcome back</h3>
            <form className="poster-form" onSubmit={handleSignIn}>
              <label>
                Email
                <input
                  type="email"
                  value={signinEmail}
                  onChange={(event) => setSigninEmail(event.target.value)}
                  placeholder="Enter Email"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={signinPassword}
                  onChange={(event) => setSigninPassword(event.target.value)}
                  placeholder="Enter Password"
                  required
                />
              </label>
              {signinError ? <p className="poster-error">{signinError}</p> : null}
              <button type="submit" className="poster-submit" disabled={signinPending}>
                {signinPending ? "Submitting..." : "Sign in"}
              </button>
              {clerkEnabled && mode === "signin" ? (
                <GoogleOAuthButton
                  mode="signin"
                  className="poster-google-btn"
                  onError={setSigninError}
                />
              ) : (
                <button
                  type="button"
                  className="poster-google-btn"
                  onClick={() => {
                    if (!clerkEnabled) {
                      setSigninError(
                        "Continue with Google is not configured yet. Add Clerk keys in .env.local and restart npm run dev."
                      );
                      return;
                    }

                    setMode("signin");
                    setSigninError("Select Sign in first, then continue with Google.");
                  }}
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>
              )}
            </form>
            <p className="poster-switch">
              Don&apos;t have an account?
              <button type="button" onClick={() => setMode("signup")}>
                Sign up
              </button>
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
