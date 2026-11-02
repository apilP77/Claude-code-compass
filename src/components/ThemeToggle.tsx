"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

// The theme lives on <html data-theme>, set before first paint by the script in
// layout.tsx. This button reads and writes it, and announces changes with an
// event so every instance stays in sync.
function subscribe(onChange: () => void) {
  window.addEventListener("themechange", onChange);
  return () => window.removeEventListener("themechange", onChange);
}

function getSnapshot(): Theme | null {
  const value = document.documentElement.dataset.theme;
  return value === "dark" ? "dark" : value === "light" ? "light" : null;
}

function getServerSnapshot(): Theme | null {
  return null;
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode or blocked storage: the choice just won't be remembered.
    }
    window.dispatchEvent(new Event("themechange"));
  }

  const label =
    theme === "dark"
      ? "Switch to light theme"
      : theme === "light"
        ? "Switch to dark theme"
        : "Switch theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line-strong text-fg transition-colors hover:border-ink hover:bg-surface"
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {theme === "dark" ? (
          <>
            <circle cx="10" cy="10" r="3.5" />
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" />
          </>
        ) : (
          <path d="M16.5 11.5A6.5 6.5 0 0 1 8.5 3.5a6.5 6.5 0 1 0 8 8Z" />
        )}
      </svg>
    </button>
  );
}
