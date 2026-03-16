"use client";

import { useAppTheme } from "@/components/theme/AppThemeProvider";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.25" />
      <path d="M12 2.75v2.5" />
      <path d="M12 18.75v2.5" />
      <path d="M4.93 4.93l1.77 1.77" />
      <path d="M17.3 17.3l1.77 1.77" />
      <path d="M2.75 12h2.5" />
      <path d="M18.75 12h2.5" />
      <path d="M4.93 19.07l1.77-1.77" />
      <path d="M17.3 6.7l1.77-1.77" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.25 14.53A8.75 8.75 0 1 1 9.47 3.75a7 7 0 1 0 10.78 10.78Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useAppTheme();
  const nextThemeLabel = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextThemeLabel} mode`}
      title={`Switch to ${nextThemeLabel} mode`}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className={`theme-toggle-icon ${theme === "light" ? "is-active" : ""}`}>
          <SunIcon />
        </span>
        <span className={`theme-toggle-icon ${theme === "dark" ? "is-active" : ""}`}>
          <MoonIcon />
        </span>
        <span className={`theme-toggle-thumb theme-toggle-thumb--${theme}`} />
      </span>
    </button>
  );
}
