"use client";

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "shopnet-theme";
const LEGACY_THEME_STORAGE_KEY = "shopnet-home-theme";
const FALLBACK_THEME_STORAGE_KEY = "theme";

function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.body.dataset.theme = theme;
  window.dispatchEvent(new Event("shopnet-theme-change"));
}

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored =
    localStorage.getItem(THEME_STORAGE_KEY) ||
    localStorage.getItem(FALLBACK_THEME_STORAGE_KEY);
  const legacyStored = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  if (legacyStored === "sunset" || legacyStored === "neon") {
    return legacyStored === "neon" ? "dark" : "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(FALLBACK_THEME_STORAGE_KEY, theme);
    localStorage.setItem(LEGACY_THEME_STORAGE_KEY, theme === "dark" ? "neon" : "sunset");
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
      className="theme-toggle-button"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        // Moon icon for dark mode
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // Sun icon for light mode
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
