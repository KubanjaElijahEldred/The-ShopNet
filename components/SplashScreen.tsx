"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    function hideSplash() {
      window.setTimeout(() => setVisible(false), 120);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", hideSplash, { once: true });
    } else {
      hideSplash();
    }

    const fallback = window.setTimeout(() => setVisible(false), 900);

    return () => {
      document.removeEventListener("DOMContentLoaded", hideSplash);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div className={`app-splash ${visible ? "show" : "hide"}`} aria-hidden={!visible}>
      <img src="/image.png" alt="ShopNet loading" className="app-splash-image" />
    </div>
  );
}
