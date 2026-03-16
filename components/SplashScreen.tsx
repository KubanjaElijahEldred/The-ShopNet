"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    function hideSplash() {
      window.setTimeout(() => setVisible(false), 650);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", hideSplash, { once: true });
    } else {
      hideSplash();
    }

    const fallback = window.setTimeout(() => setVisible(false), 2200);

    return () => {
      document.removeEventListener("DOMContentLoaded", hideSplash);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div className={`app-splash ${visible ? "show" : "hide"}`} aria-hidden={!visible}>
      <div className="app-splash-stack">
        <img src="/image.png" alt="ShopNet loading" className="app-splash-image" />
        <div className="app-splash-powered">
          <img
            src="/imagecopy6.png"
            alt="K.E.E Tech Solutions icon"
            className="app-splash-powered-icon"
          />
          <p>
            Powered by <strong>K.E.E Tech Solutions</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
