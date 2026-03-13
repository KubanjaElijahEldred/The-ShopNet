"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

  return (
    <form className="stack-card form-card" onSubmit={handleSubmit}>
      <div>
        <span className="eyebrow">Welcome back</span>
        <h1>Login to ShopNet</h1>
      </div>

      <label>
        Email address
        <input name="email" type="email" required />
      </label>

      <label>
        Password
        <input name="password" type="password" required />
      </label>

      {error ? <p className="error-text">{error}</p> : null}

      <button className="button" disabled={pending} type="submit">
        {pending ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
