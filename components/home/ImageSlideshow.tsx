"use client";

import { useState, useEffect } from "react";

const images = [
  "/image-copy-1.png",
  "/image-copy-2.png",
  "/image-copy-3.png",
  "/image-copy-4.png",
  "/image-copy-5.png",
];

export function ImageSlideshow() {
  // Duplicate the images array to ensure seamless infinite scrolling. We double the track length.
  // The CSS translates left by exactly 50% seamlessly.
  const marqueeItems = [...images, ...images];

  return (
    <div className="dualmode-slideshow-marquee">
      <div className="marquee-track">
        {marqueeItems.map((src, index) => (
          <article key={`slide-${index}`} className="dualmode-deal-card">
            <img src={src} alt={`Hot Deal Slide ${index + 1}`} />
            <div className="dualmode-deal-overlay" />
            <div className="dualmode-deal-copy">
              <strong>{index % 2 === 0 ? "Save" : "Discount"}</strong>
              <p>{index % 2 === 0 ? "$23" : "35%"}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
