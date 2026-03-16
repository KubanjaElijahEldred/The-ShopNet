"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SlideProduct = {
  id: string;
  ownerId?: string;
  title: string;
  price: number;
  frontImage: string;
};

type SalesSlide = {
  category: string;
  sale: number;
  items: SlideProduct[];
};

export function CategorySalesSlider({ slides }: { slides: SalesSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) {
    return null;
  }

  const activeSlide = slides[activeIndex];

  return (
    <section className="category-sales-slider">
      <div className="category-slider-head">
        <div>
          <span className="eyebrow">Flash sales</span>
          <h2>{activeSlide.category} deals</h2>
        </div>
        <p>Save up to {activeSlide.sale}% on selected picks</p>
      </div>

      <div className="category-slider-cards">
        {activeSlide.items.map((product, index) => {
          const oldPrice = Math.round((product.price / 3700) * 1.45);
          const nowPrice = Math.max(1, Math.round(product.price / 3700));
          const tag = Math.max(10, activeSlide.sale - index * 5);

          return (
            <article key={product.id} className="category-sale-card">
              <span className="category-sale-tag">-{tag}%</span>
              <img src={product.frontImage} alt={product.title} />

              <div className="category-sale-copy">
                <h3>{product.title}</h3>
                <div className="category-sale-prices">
                  <span>${oldPrice}</span>
                  <strong>${nowPrice}</strong>
                </div>
                <div className="category-sale-actions">
                  <Link href={`/products/${product.id}`}>View product</Link>
                  <Link
                    href={{
                      pathname: "/chat",
                      query: product.ownerId
                        ? { productId: product.id, ownerId: product.ownerId }
                        : { productId: product.id }
                    }}
                    aria-label={`Chat about ${product.title}`}
                  >
                    💬
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="category-slider-dots" aria-label="Category slide controls">
        {slides.map((slide, index) => (
          <button
            key={slide.category}
            type="button"
            className={index === activeIndex ? "active" : ""}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show ${slide.category} deals`}
          />
        ))}
      </div>
    </section>
  );
}
