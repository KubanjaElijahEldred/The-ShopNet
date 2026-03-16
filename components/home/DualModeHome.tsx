"use client";

import Link from "next/link";
import { ImageSlideshow } from "./ImageSlideshow";
import { useEffect, useMemo, useState } from "react";

type HomeProduct = {
  id: string;
  title: string;
  category: string;
  price: number;
  frontImage: string;
};

type CategoryChip = {
  label: string;
  icon: string;
};

const categoryChips: CategoryChip[] = [
  { label: "Smartphones", icon: "📱" },
  { label: "Laptops", icon: "💻" },
  { label: "Headphones", icon: "🎧" },
  { label: "Fashion", icon: "👗" },
  { label: "Grocery", icon: "🧺" },
  { label: "See all", icon: "➜" }
];

type Props = {
  products: HomeProduct[];
  query?: string;
  totalMatches: number;
  noMatch: boolean;
};

function pickWithWrap(items: HomeProduct[], count: number, start: number) {
  if (!items.length) {
    return [];
  }

  return Array.from({ length: count }).map((_, index) => {
    return items[(start + index) % items.length];
  });
}

function formatPrice(ugxPrice: number) {
  return `$${Math.max(1, Math.round(ugxPrice / 3700))}`;
}

function readSavedTheme() {
  if (typeof window === "undefined") {
    return "sunset" as const;
  }

  const savedTheme = window.localStorage.getItem("shopnet-home-theme");

  return savedTheme === "neon" || savedTheme === "sunset" ? savedTheme : "sunset";
}

export function DualModeHome({ products, query, totalMatches, noMatch }: Props) {
  const [theme, setTheme] = useState<"sunset" | "neon">(readSavedTheme);
  const activeProducts = products;

  useEffect(() => {
    window.localStorage.setItem("shopnet-home-theme", theme);
  }, [theme]);

  const heroProducts = useMemo(() => pickWithWrap(activeProducts, 4, 0), [activeProducts]);
  const popularProducts = useMemo(() => pickWithWrap(activeProducts, 5, 6), [activeProducts]);
  const needProducts = useMemo(() => pickWithWrap(activeProducts, 5, 10), [activeProducts]);

  return (
    <div className={`dualmode-home-shell dualmode-home--${theme}`}>
      <section className="dualmode-home-frame">
        <header className="dualmode-topbar">
          <Link href="/" className="dualmode-brand">
            <span className="dualmode-brand-bag">🛍️</span>
            <strong>The ShopNet</strong>
          </Link>

          <form action="/" method="get" className="dualmode-search">
            <input
              name="q"
              defaultValue={query || ""}
              placeholder="Search for Gadgets, Fashion, and more..."
            />
            <button type="submit" aria-label="Search">
              🔍
            </button>
          </form>

          <div className="dualmode-top-actions">
            <span>⚡ Quick delivery</span>
            <Link href="/products" className="dualmode-shop-now">
              Shop now
            </Link>
            <Link href="/profile" aria-label="Profile">
              👤
            </Link>
            <Link href="/cart" aria-label="Cart">
              🛒
            </Link>
            <Link href="/chat" aria-label="Messages">
              ✉️
            </Link>
            <button
              type="button"
              className="dualmode-theme-toggle"
              onClick={() => setTheme((current) => (current === "sunset" ? "neon" : "sunset"))}
            >
              {theme === "sunset" ? "Dark Neon" : "Light Orange"}
            </button>
          </div>
        </header>

        <section className="dualmode-hero">
          <div className="dualmode-hero-copy">
            <h1>We bring the world to your door</h1>
            <p>
              {totalMatches} items ready for you{query ? ` for "${query}"` : ""}.
            </p>
          </div>

          <div className="dualmode-hero-products">
            {heroProducts.map((product, index) => (
              <article key={`${product.id}-hero-${index}`}>
                <img src={product.frontImage} alt={product.title} />
              </article>
            ))}
          </div>
        </section>

        <section className="dualmode-categories">
          {categoryChips.map((chip) => (
            <Link
              key={chip.label}
              href={
                chip.label === "See all"
                  ? "/products"
                  : `/products?category=${encodeURIComponent(chip.label)}`
              }
              className="dualmode-category-chip"
            >
              <span>{chip.icon}</span>
              <p>{chip.label}</p>
            </Link>
          ))}
        </section>

        <section className="dualmode-section">
          <h2>Hot Deals</h2>
          <ImageSlideshow />
        </section>

        <section className="dualmode-section">
          <h2>Popular This Week</h2>
          <div className="dualmode-popular-grid">
            {popularProducts.map((product, index) => (
              <article key={`${product.id}-popular-${index}`} className="dualmode-popular-card">
                <img src={product.frontImage} alt={product.title} />
                <div className="dualmode-popular-copy">
                  <h3>{product.title}</h3>
                  <p>{formatPrice(product.price)}</p>
                  <div className="dualmode-popular-actions">
                    <Link href={`/products/${product.id}`}>Add to Cart</Link>
                    <Link href={`/chat?productId=${product.id}`} aria-label={`Chat about ${product.title}`}>
                      💬
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dualmode-signup-banner">
          <p>50% Discount on Your First Order! Sign Up Now!</p>
          <Link href="/signup">Create account</Link>
        </section>

        <section className="dualmode-section">
          <h2>You might need</h2>
          <div className="dualmode-needs-grid">
            {needProducts.map((product, index) => (
              <article key={`${product.id}-need-${index}`} className="dualmode-need-card">
                <img src={product.frontImage} alt={product.title} />
                <div className="dualmode-need-footer">
                  <span>{product.category}</span>
                  <Link href={`/products/${product.id}`} aria-label={`Open ${product.title}`}>
                    +
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="dualmode-footer">
          <section>
            <h3>The ShopNet</h3>
            <p>395 Toors arive Sircle Road, Rosemint, Suite 31130, Acra, Acrara</p>
          </section>
          <section>
            <h3>Contact us</h3>
            <p>+020603048760</p>
            <p>+0595336899</p>
            <p>@sabr6618</p>
          </section>
          <section>
            <h3>Departments</h3>
            <p>Smartphones</p>
            <p>Fashion</p>
            <p>Grocery</p>
          </section>
          <section>
            <h3>About us</h3>
            <p>About us</p>
            <p>Contacts</p>
          </section>
          <section>
            <h3>Services</h3>
            <p>Support</p>
            <p>Company</p>
          </section>
          <section>
            <h3>Accepted Payments</h3>
            <p>VISA • mastercard • tabby • Pay</p>
          </section>
        </footer>
      </section>

      {noMatch ? (
        <section className="dualmode-no-match">
          <p>
            No exact products found for &quot;{query}&quot;. Showing close matches from your
            catalog.
          </p>
        </section>
      ) : null}
    </div>
  );
}
