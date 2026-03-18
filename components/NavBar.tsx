"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { ThemeToggle } from "./theme/ThemeToggle";
import { NotificationBadge } from "./NotificationBadge";

type Props = {
  user: {
    name: string;
    profileImage?: string;
    role?: "customer" | "admin";
  } | null;
};

type IconName = "home" | "cart" | "profile" | "chat";

type NavLink = {
  href: string;
  label: string;
  icon: IconName;
  showBadge?: boolean;
};

function NavIcon({ name }: { name: IconName }) {
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.8V20a1 1 0 0 0 1 1h4.8v-6.2h2.4V21H18a1 1 0 0 0 1-1V9.8" />
        </svg>
      );
    case "cart":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 4h2l2.1 10.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L21 7H7.2" />
          <circle cx="10" cy="20" r="1.4" />
          <circle cx="18" cy="20" r="1.4" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 6.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-8l-4.5 3v-3H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
        </svg>
      );
    default:
      return null;
  }
}

const links: NavLink[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/cart", label: "Cart", icon: "cart" },
  { href: "/profile", label: "Profile", icon: "profile" },
  { href: "/chat", label: "Chat", icon: "chat", showBadge: true }
];

export function NavBar({ user }: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="navbar-shell">
      <div className="navbar">
        <Logo size="small" linkToHome={true} />

        <SearchBar />

        <nav className="nav-links">
          {links.map((link) => {
            const linkContent = (
              <>
                <span className="nav-link-icon">
                  <NavIcon name={link.icon} />
                </span>
                <span className="nav-link-label">{link.label}</span>
              </>
            );

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${isActive(link.href) ? "active" : ""}`}
              >
                {link.showBadge ? (
                  <NotificationBadge channel="chat">{linkContent}</NotificationBadge>
                ) : (
                  linkContent
                )}
              </Link>
            );
          })}

          <ThemeToggle />
        </nav>

        <div className="nav-user">
          {user ? (
            <>
              <Link href="/profile" className="nav-user-chip">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="nav-user-avatar" />
                ) : (
                  <span className="nav-user-avatar nav-user-avatar-fallback">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="nav-user-name">{user.name}</span>
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button className="nav-auth-button nav-logout" type="submit">
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <Link href="/auth" className="nav-auth-button nav-signin">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
