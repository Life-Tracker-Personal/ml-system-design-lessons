import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { listLessons } from "@/lib/lessons";
import { SiteHeader } from "@/components/site/site-header";

export default async function HomePage() {
  const lessons = await listLessons("c1");
  const totalMinutes = lessons.reduce(
    (sum, l) => sum + (l.estimatedMinutes ?? 0),
    0,
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden
        >
          <div className="absolute top-[-40%] left-1/2 h-[460px] w-[860px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(var(--border) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              maskImage:
                "radial-gradient(ellipse 60% 60% at 50% 0%, #000, transparent)",
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 60% at 50% 0%, #000, transparent)",
            }}
          />
        </div>
        <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-primary" />
            Aminian &amp; Xu · ML System Design Interview
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Machine Learning System Design
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Staff+ lessons synthesized from each chapter&apos;s references. Every
            lesson is a ~30-minute deep read for a senior engineer — math from
            first principles, with click-to-expand deep dives.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="font-semibold text-foreground tabular-nums">
                {lessons.length}
              </span>
              {lessons.length === 1 ? "lesson" : "lessons"}
            </span>
            {totalMinutes > 0 && (
              <span className="inline-flex items-center gap-2">
                <span className="size-1 rounded-full bg-border" />
                <span className="tabular-nums">~{totalMinutes} min</span> of
                reading
              </span>
            )}
            <span className="inline-flex items-center gap-2">
              <span className="size-1 rounded-full bg-border" />
              Interview-ready depth
            </span>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Chapter 1 — Introduction &amp; Overview
          </h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
          </span>
        </div>

        <div className="space-y-3">
          {lessons.map((lesson, i) => (
            // Not a <Link> wrapper: the card holds a second link (Quiz), and
            // anchors can't nest. The title link is "stretched" over the card
            // via ::after so the whole card still opens the lesson.
            <div
              key={lesson.id}
              className="group relative flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 sm:gap-5 sm:p-5"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent font-mono text-base font-semibold text-accent-foreground tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {lesson.id}
                  </span>
                </div>
                <h3 className="mt-0.5 text-[1.05rem] font-semibold tracking-tight">
                  <Link
                    href={`/c/c1/${lesson.id}`}
                    className="after:absolute after:inset-0 after:content-['']"
                  >
                    {lesson.title}
                  </Link>
                </h3>
                {lesson.subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {lesson.subtitle}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {lesson.estimatedMinutes && (
                  <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
                    {lesson.estimatedMinutes} min
                  </span>
                )}
                {/* z-10 keeps this above the stretched title link. */}
                <Link
                  href={`/c/c1/${lesson.id}/quiz`}
                  className="relative z-10 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/8 hover:text-foreground"
                >
                  Quiz
                </Link>
                <ArrowRightIcon className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-muted-foreground">
          Synthesized for Tier 1 AI Engineer prep · built with Next.js
        </div>
      </footer>
    </div>
  );
}
