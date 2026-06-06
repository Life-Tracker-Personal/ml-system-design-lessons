"use client";

import { MoonIcon, SunIcon } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      title="Toggle theme"
      className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {/* Visibility is driven purely by the `.dark` class so there is no
          hydration mismatch and no client state to manage. */}
      <SunIcon className="hidden size-[1.05rem] dark:block" />
      <MoonIcon className="size-[1.05rem] dark:hidden" />
    </button>
  );
}
