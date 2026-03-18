"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ImageSlideshow } from "./ImageSlideshow";

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

export function DualModeHome({ products, query, totalMatches, noMatch }: Props) {
  const [theme, setTheme] = useState<"sunset" | "neon">("sunset");

  useEffect(() => {
    const updateTheme = () => {
      setTheme(document.documentElement.dataset.theme === "dark" ? "neon" : "sunset");
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });

    window.addEventListener("shopnet-theme-change", updateTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("shopnet-theme-change", updateTheme);
    };
  }, []);

  const heroProducts = useMemo(() => pickWithWrap(products, 4, 0), [products]);
  const popularProducts = useMemo(() => pickWithWrap(products, 5, 6), [products]);
  const needProducts = useMemo(() => pickWithWrap(products, 5, 10), [products]);

  return (
    <div className={`dualmode-home-shell dualmode-home--${theme}`}>
      <section className="dualmode-home-frame">
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
                    <Link
                      href={`/chat?productId=${product.id}`}
                      aria-label={`Chat about ${product.title}`}
                    >
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
          <Link href="/auth">Create account</Link>
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
            <p>VISA • mastercard • tabby • Apple Pay</p>
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
