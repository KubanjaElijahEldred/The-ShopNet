"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  user: {
    name: string;
  } | null;
};

type IconName =
  | "home"
  | "products"
  | "ai"
  | "notifications"
  | "admin"
  | "wishlist"
  | "orders"
  | "chat"
  | "dashboard"
  | "profile"
  | "signup"
  | "cart";

type NavLink = {
  href: string;
  label: string;
  icon: IconName;
};

function NavIcon({ name }: { name: IconName }) {
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.8V20a1 1 0 0 0 1 1h4.8v-6.2h2.4V21H18a1 1 0 0 0 1-1V9.8" />
        </svg>
      );
    case "products":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
      );
    case "ai":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3v4" />
          <path d="M12 17v4" />
          <path d="m5.6 5.6 2.8 2.8" />
          <path d="m15.6 15.6 2.8 2.8" />
          <path d="M3 12h4" />
          <path d="M17 12h4" />
          <path d="m5.6 18.4 2.8-2.8" />
          <path d="m15.6 8.4 2.8-2.8" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
      );
    case "notifications":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6.8 10.2a5.2 5.2 0 1 1 10.4 0v3.5l1.6 2.3H5.2l1.6-2.3z" />
          <path d="M9.8 18a2.2 2.2 0 0 0 4.4 0" />
        </svg>
      );
    case "admin":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3 5 6v5.4c0 4.2 2.7 7.9 7 9.6 4.3-1.7 7-5.4 7-9.6V6z" />
          <path d="m9.3 12.2 1.8 1.8 3.6-3.6" />
        </svg>
      );
    case "wishlist":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 20.4 4.8 13a4.6 4.6 0 0 1 0-6.4 4.6 4.6 0 0 1 6.5 0L12 7.3l.7-.7a4.6 4.6 0 0 1 6.5 0 4.6 4.6 0 0 1 0 6.4z" />
        </svg>
      );
    case "orders":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="5" y="3.5" width="14" height="17" rx="2" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 6.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-8l-4.5 3v-3H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-6" />
          <path d="M22 20v-9" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "signup":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <path d="M18 8v6" />
          <path d="M15 11h6" />
        </svg>
      );
    case "cart":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 4h2l2.1 10.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L21 7H7.2" />
          <circle cx="10" cy="20" r="1.4" />
          <circle cx="18" cy="20" r="1.4" />
        </svg>
      );
    default:
      return null;
  }
}

const links: NavLink[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/products", label: "Products", icon: "products" },
  { href: "/assistant", label: "AI Agent", icon: "ai" },
  { href: "/notifications", label: "Notifications", icon: "notifications" },
  { href: "/admin", label: "Admin", icon: "admin" },
  { href: "/wishlist", label: "Wishlist", icon: "wishlist" },
  { href: "/orders", label: "Orders", icon: "orders" },
  { href: "/chat", label: "Chat", icon: "chat" },
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/profile", label: "Profile", icon: "profile" },
  { href: "/signup", label: "Sign Up", icon: "signup" },
  { href: "/cart", label: "Cart", icon: "cart" }
];

export function NavBar({ user }: Props) {
  const pathname = usePathname();

  return (
    <header className="navbar-shell">
      <div className="navbar">
        <Link className="brand" href="/">
          <span className="brand-mark">S</span>
          <div>
            <strong>ShopNet</strong>
            <p>Social commerce for sellers and shoppers</p>
          </div>
        </Link>

        <nav className="nav-links">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "active" : ""}
            >
              <span className="nav-link-icon">
                <NavIcon name={link.icon} />
              </span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="nav-user">
          {user ? (
            <>
              <span className="pill">Signed in</span>
              <strong>{user.name}</strong>
            </>
          ) : (
            <span className="pill">Guest</span>
          )}
        </div>
      </div>
    </header>
  );
}
