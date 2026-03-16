"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

type SlideCard = {
  id: string;
  ownerId?: string;
  title: string;
  image: string;
  price: number;
  saleCut: number;
  category: string;
};

type ImageSlide = {
  id: string;
  headline: string;
  subtitle: string;
  cards: SlideCard[];
};

export function ImageCopySlider({ slides }: { slides: ImageSlide[] }) {
  const [active, setActive] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const headingId = useId();
  const videoSrc = "/slideshow.webm?v=1";

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) {
    return null;
  }

  const current = slides[active];

  return (
    <section className="image-copy-slider" aria-labelledby={headingId}>
      <div className="image-copy-stage">
        <video
          className={`image-copy-video${videoReady ? " ready" : ""}`}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          poster="/image.png"
          preload="metadata"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoError(true)}
        />
        {videoError ? (
          <img
            className="image-copy-fallback"
            src="/image.png"
            alt="ShopNet slideshow preview"
          />
        ) : null}
        <div className="image-copy-video-overlay" />

        <div className="image-copy-head">
          <span className="eyebrow">ShopNet spotlight</span>
          <h2 id={headingId}>{current.headline}</h2>
          <p>{current.subtitle}</p>
        </div>

        <div className="image-copy-video-card" role="status" aria-live="polite">
          <span className="image-copy-video-label">Promo video</span>
          <strong>slideshow.webm</strong>
          <p>
            <span className={videoReady ? "video-dot ready" : "video-dot"} />
            {videoReady ? "Now playing" : "Loading preview..."}
          </p>
        </div>

        <div className="image-copy-dots" aria-label="Slides">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={index === active ? "active" : ""}
              onClick={() => setActive(index)}
              aria-label={`Show ${slide.headline}`}
            />
          ))}
        </div>
      </div>

      <div className="image-copy-grid">
        {current.cards.map((card, index) => (
          <article
            key={card.id}
            className={`image-copy-card${index === 0 ? " featured" : ""}`}
          >
            <span className="image-copy-sale">-{card.saleCut}%</span>
            <img src={card.image} alt={card.title} />
            <div className="image-copy-card-body">
              <p>{card.category}</p>
              <h3>{card.title}</h3>
              <div className="image-copy-prices">
                <span>${Math.round(card.price * 1.3)}</span>
                <strong>${card.price}</strong>
              </div>
              <div className="image-copy-actions">
                <Link href={`/products/${card.id}`}>Add to Cart</Link>
                <Link
                  href={{
                    pathname: "/chat",
                    query: card.ownerId
                      ? { productId: card.id, ownerId: card.ownerId }
                      : { productId: card.id }
                  }}
                  aria-label={`Chat about ${card.title}`}
                >
                  💬
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
