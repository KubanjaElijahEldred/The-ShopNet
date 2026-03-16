"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function GlobalNav({
  user
}: {
  user: { name: string; profileImage?: string } | null;
}) {
  const [theme, setTheme] = useState<"sunset" | "neon">("sunset");
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("shopnet-home-theme");
    if (savedTheme === "neon" || savedTheme === "sunset") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("shopnet-home-theme", theme);
  }, [theme]);

  if (isAuthPage) {
    return (
      <header className="global-logo-only-bar">
        <Link href="/" className="global-logo-link global-logo-link-strong">
          <img
            src="/image.png"
            alt="ShopNet Logo"
            width={44}
            height={44}
            className="global-logo-image global-logo-image-lg"
          />
          <strong>The ShopNet</strong>
        </Link>
      </header>
    );
  }

  return (
    <header className="dualmode-topbar global-topbar">
      <Link href="/" className="dualmode-brand global-logo-link">
        <img
          src="/image.png"
          alt="ShopNet Logo"
          width={40}
          height={40}
          className="global-logo-image"
        />
        <strong>The ShopNet</strong>
      </Link>

      <form action="/products" method="get" className="dualmode-search shopnet-global-search">
        <input name="q" placeholder="Search for Gadgets, Fashion, and more..." />
        <button type="submit" aria-label="Search">🔍</button>
      </form>

      <div className="dualmode-top-actions">
        <span>⚡ Quick delivery</span>
        <Link href="/" className="dualmode-shop-now">Shop now</Link>
        <Link href="/" aria-label="Home" title="Home">
          🏠
        </Link>
        <Link
          href="/profile"
          aria-label="Profile"
          title={user?.name || "Profile"}
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              width={28}
              height={28}
              style={{
                borderRadius: "999px",
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.35)"
              }}
            />
          ) : (
            "👤"
          )}
        </Link>
        <Link href="/cart" aria-label="Cart">🛒</Link>
        <Link href="/chat" aria-label="Messages">✉️</Link>
        {user ? (
            <span style={{color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", fontWeight: "bold"}}>{user.name}</span>
        ) : (
            <Link href="/login" style={{color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", fontWeight: "bold"}}>Sign In</Link>
        )}
        <button
          type="button"
          className="dualmode-theme-toggle"
          onClick={() => setTheme((current) => (current === "sunset" ? "neon" : "sunset"))}
        >
          {theme === "sunset" ? "Dark Neon" : "Light Orange"}
        </button>
      </div>
    </header>
  );
}
