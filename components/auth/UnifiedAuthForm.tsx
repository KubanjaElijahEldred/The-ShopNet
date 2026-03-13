"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { demoLocations } from "@/lib/constants";
import { passwordRule } from "@/lib/validators";
import { GoogleIcon, AppleIcon, FacebookIcon, TwitterIcon } from "./AuthIcons";

export function UnifiedAuthForm({ initialMode = "signin" }: { initialMode?: "signin" | "signup" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to sign in.");
      return;
    }

    router.push("/profile");
    router.refresh();
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const formVals = Object.fromEntries(formData.entries());

    // Basic mobile validation bypass if empty
    if (!formVals.mobileNumber) delete formVals.mobileNumber;
    if (!formVals.profileImage) delete formVals.profileImage;
    if (!formVals.shippingAddress) delete formVals.shippingAddress;
    // For the unified UI, we set a default location if not provided
    if (!formVals.location) formVals.location = demoLocations[0];

    // For the unified UI we don't have a confirm password field to save space, but API expects it or we handle it on backend.
    // Ensure we send confirmPassword to match signup requirements if need be.
    formVals.confirmPassword = formVals.password;

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formVals)
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to create account.");
      return;
    }

    setSuccess("Account created successfully!");
    setMode("signin");
  }

  return (
    <div className="unified-auth-container">
      {/* Background Orbs */}
      <div className="unified-orb orb-huge-top-left" />
      <div className="unified-orb orb-large-top-right" />
      <div className="unified-orb orb-med-mid-right" />
      <div className="unified-orb orb-small-bottom-right" />
      <div className="unified-orb orb-med-bottom-left" />

      {/* Main Content Area */}
      <div className="unified-auth-layout">
        <div className="unified-auth-hero">
          <div className="unified-auth-logo">
           {/* Custom logo placeholder to match mockup */}
           <div className="mock-logo">
             <span className="mock-logo-icon">🛒</span>
           </div>
          </div>
          <Image 
            src="/auth-hero-beanbag.png"
            alt="Big Sale Hero"
            width={600}
            height={600}
            className="unified-hero-image"
          />
        </div>

        <div className="unified-auth-card">
          {mode === "signin" ? (
            <div className="unified-form-wrapper">
              <h1 className="unified-heading">Welcome Back!</h1>
              <p className="unified-subdued">Enter personal details to your employee account</p>
              
              <div className="unified-auth-toggles">
                  <button type="button" className="active">Sign in</button>
                  <button type="button" onClick={() => setMode("signup")}>Sign up</button>
              </div>

              <form className="unified-form" onSubmit={handleSignIn}>
                <div className="unified-input-group">
                  <input type="email" name="email" placeholder="Enter Email" required />
                  <label>Email</label>
                </div>

                <div className="unified-input-group">
                  <input type="password" name="password" placeholder="Enter Password" required />
                  <label>Password</label>
                </div>

                {error && <p className="unified-error">{error}</p>}
                {success && <p className="unified-success">{success}</p>}

                <button type="submit" disabled={pending} className="unified-submit-btn">
                  {pending ? "Signing in..." : "Sign in"}
                </button>
              </form>

            </div>
          ) : (
            <div className="unified-form-wrapper">
              <h1 className="unified-heading">Get Started</h1>

              <form className="unified-form" onSubmit={handleSignUp}>
                <div className="unified-input-group">
                  <input type="text" name="name" placeholder="Enter Full Name" required />
                  <label>Full Name</label>
                </div>

                <div className="unified-input-group">
                  <input type="email" name="email" placeholder="Enter Email" required />
                  <label>Email</label>
                </div>

                <div className="unified-input-group">
                  <input type="password" name="password" placeholder="Enter Password" required />
                  <label>Password</label>
                </div>

                <div className="unified-checkbox-group">
                  <input type="checkbox" id="terms" required />
                  <label htmlFor="terms">I agree to the processing of Personal data</label>
                </div>

                {error && <p className="unified-error">{error}</p>}

                <button type="submit" disabled={pending} className="unified-submit-btn">
                  {pending ? "Signing up..." : "Sign up"}
                </button>
              </form>

              <div className="unified-social-divider">
                <span>or sign up with</span>
              </div>

              <div className="unified-social-icons">
                 <button type="button"><FacebookIcon /></button>
                 <button type="button"><TwitterIcon /></button>
                 <button type="button"><GoogleIcon /></button>
                 <button type="button"><AppleIcon /></button>
              </div>

              <p className="unified-switch-text">
                Already have an account? <button type="button" onClick={() => setMode("signin")}>Sign in</button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
