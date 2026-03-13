import Link from "next/link";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { hasClerkKeys } from "@/lib/clerk-config";

export default function SsoCallbackPage() {
  if (!hasClerkKeys) {
    return (
      <section className="stack-card">
        <h1>Google sign-in is not configured yet</h1>
        <p className="muted">
          Add Clerk API keys in <code>.env.local</code> to enable Continue with Google.
        </p>
        <Link href="/signup" className="button">
          Go to Sign Up
        </Link>
      </section>
    );
  }

  return <AuthenticateWithRedirectCallback />;
}
