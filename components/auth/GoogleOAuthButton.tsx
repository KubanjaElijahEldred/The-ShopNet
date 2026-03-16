"use client";

import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { GoogleIcon } from "./AuthIcons";

type Mode = "signin" | "signup";

type GoogleOAuthButtonProps = {
  mode: Mode;
  className?: string;
  iconOnly?: boolean;
  label?: string;
  onError: (message: string) => void;
};

export function GoogleOAuthButton({
  mode,
  className,
  iconOnly = false,
  label = "Continue with Google",
  onError
}: GoogleOAuthButtonProps) {
  const { isLoaded: signInLoaded, signIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const [pending, setPending] = useState(false);

  async function continueWithGoogle() {
    onError("");
    setPending(true);

    try {
      if (mode === "signin") {
        if (!signInLoaded || !signIn) {
          throw new Error("Google sign-in is still loading. Try again in a moment.");
        }

        await signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/profile"
        });
        return;
      }

      if (!signUpLoaded || !signUp) {
        throw new Error("Google sign-up is still loading. Try again in a moment.");
      }

      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/profile"
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to continue with Google.";
      onError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={continueWithGoogle}
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
