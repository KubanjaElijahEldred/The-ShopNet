"use client";

import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { GoogleIcon } from "./AuthIcons";

type AuthMode = "signin" | "signup";

type GoogleOAuthButtonProps = {
  mode: AuthMode;
  className?: string;
  iconOnly?: boolean;
  label?: string;
  ariaLabel?: string;
  onError: (message: string) => void;
};

type ButtonVisualProps = Omit<GoogleOAuthButtonProps, "mode" | "onError"> & {
  pending: boolean;
  onClick: () => void;
};

function GoogleButtonVisual({
  className,
  iconOnly = false,
  label = "Continue with Google",
  ariaLabel,
  pending,
  onClick
}: ButtonVisualProps) {
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {iconOnly ? (
        <GoogleIcon />
      ) : (
        <>
          <GoogleIcon />
          <span>{pending ? "Connecting..." : label}</span>
        </>
      )}
    </button>
  );
}

function getClerkErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray((error as { errors?: unknown[] }).errors)
  ) {
    const first = (error as { errors: Array<{ code?: string; message?: string; longMessage?: string }> }).errors[0];
    const code = first?.code?.toLowerCase() || "";
    const text = `${first?.longMessage || ""} ${first?.message || ""}`.toLowerCase();

    if (code.includes("captcha") || text.includes("captcha") || text.includes("turnstile")) {
      return "Captcha verification failed. Disable VPN/ad blocker, refresh the page, and try again.";
    }

    if (first?.longMessage) {
      return first.longMessage;
    }

    if (first?.message) {
      return first.message;
    }
  }

  if (error instanceof Error) {
    const text = error.message.toLowerCase();
    if (text.includes("captcha") || text.includes("turnstile")) {
      return "Captcha verification failed. Disable VPN/ad blocker, refresh the page, and try again.";
    }
    return error.message;
  }

  return "Unable to continue with Google.";
}

function GoogleSignInButton({
  onError,
  ...visualProps
}: Omit<GoogleOAuthButtonProps, "mode">) {
  const { isLoaded, signIn } = useSignIn();
  const [pending, setPending] = useState(false);

  async function continueWithGoogle() {
    onError("");
    setPending(true);

    try {
      if (!isLoaded || !signIn) {
        throw new Error("Google sign-in is still loading. Try again.");
      }

      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/profile"
      });
    } catch (error) {
      onError(getClerkErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <GoogleButtonVisual
      {...visualProps}
      pending={pending}
      onClick={continueWithGoogle}
    />
  );
}

function GoogleSignUpButton({
  onError,
  ...visualProps
}: Omit<GoogleOAuthButtonProps, "mode">) {
  const { isLoaded, signUp } = useSignUp();
  const [pending, setPending] = useState(false);

  async function continueWithGoogle() {
    onError("");
    setPending(true);

    try {
      if (!isLoaded || !signUp) {
        throw new Error("Google sign-up is still loading. Try again.");
      }

      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/profile"
      });
    } catch (error) {
      onError(getClerkErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <GoogleButtonVisual
      {...visualProps}
      pending={pending}
      onClick={continueWithGoogle}
    />
  );
}

export function GoogleOAuthButton({ mode, ...props }: GoogleOAuthButtonProps) {
  if (mode === "signin") {
    return <GoogleSignInButton {...props} />;
  }

  return (
    <GoogleSignUpButton {...props} />
  );
}
