import Link from "next/link";
import { SettingsIcon } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground shadow-sm">
              Σ
            </span>
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">
              ML System Design
            </span>
          </Link>
          {children && (
            <>
              <span className="text-border" aria-hidden>
                /
              </span>
              <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                {children}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <SettingsIcon className="size-[1.05rem]" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
