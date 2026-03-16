"use client";

import { useState } from "react";
import { SignIn, SignUp } from "@clerk/nextjs";

type Mode = "signin" | "signup";

export function UnifiedAuthCard({ initialMode = "signin" }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);

  return (
    <section className="auth-shell">
      <div className="auth-hero">
        <div className="auth-orb orb-one" />
        <div className="auth-orb orb-two" />
        <div className="auth-orb orb-three" />
        <div className="auth-hero-copy">
          <h1>Welcome Back</h1>
          <p>Use one screen for sign in or sign up and start shopping instantly.</p>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-tabs">
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

          <button
            type="button"
            className="auth-google-button"
            disabled
          >
          Continue with Google
        </button>

        <div className="auth-clerk-card">
          {mode === "signin" ? (
            <SignIn
              routing="hash"
              forceRedirectUrl="/"
              appearance={{
                elements: {
                  card: "auth-clerk-inner",
                  rootBox: "auth-clerk-root",
                  footer: "auth-clerk-footer",
                  socialButtonsBlock: "auth-hidden-social"
                }
              }}
            />
          ) : (
            <SignUp
              routing="hash"
              forceRedirectUrl="/"
              appearance={{
                elements: {
                  card: "auth-clerk-inner",
                  rootBox: "auth-clerk-root",
                  footer: "auth-clerk-footer",
                  socialButtonsBlock: "auth-hidden-social"
                }
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
