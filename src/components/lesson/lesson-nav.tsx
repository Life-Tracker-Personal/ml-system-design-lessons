"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ListIcon,
  PencilLineIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/toc";

export type NavLesson = { id: string; title: string } | null;

export interface LessonNavProps {
  chapter: string;
  lesson: string;
  hasQuiz: boolean;
  prev: NavLesson;
  next: NavLesson;
  items: TocItem[];
  /** On the quiz page the "quiz" link becomes "back to lesson". */
  variant?: "lesson" | "quiz";
}

/**
 * Compact prev / quiz / next controls. Shared by the desktop sidebar and the
 * mobile jump-to sheet so the quiz is always one tap away — previously it was
 * only reachable by scrolling to the very bottom of the lesson.
 */
function NavActions({
  chapter,
  lesson,
  hasQuiz,
  prev,
  next,
  variant = "lesson",
  className,
}: Omit<LessonNavProps, "items"> & { className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {variant === "lesson" && hasQuiz && (
        <Link
          href={`/c/${chapter}/${lesson}/quiz`}
          className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/8 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/12"
        >
          <PencilLineIcon className="size-3.5 shrink-0 text-primary" />
          Take the quiz
        </Link>
      )}
      {variant === "quiz" && (
        <Link
          href={`/c/${chapter}/${lesson}`}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-primary/40"
        >
          <ArrowLeftIcon className="size-3.5 shrink-0" />
          Back to the lesson
        </Link>
      )}
      <div className="flex gap-1.5">
        {prev && (
          <Link
            href={`/c/${chapter}/${prev.id}`}
            title={prev.title}
            className="group flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span className="truncate">{prev.id}</span>
          </Link>
        )}
        {next && (
          <Link
            href={`/c/${chapter}/${next.id}`}
            title={next.title}
            className="group flex min-w-0 flex-1 items-center justify-end gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <span className="truncate">{next.id}</span>
            <ArrowRightIcon className="size-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

/** Section links with scroll-spy. Extracted so both layouts can use them. */
function SectionLinks({
  items,
  activeSlug,
  onNavigate,
}: {
  items: TocItem[];
  activeSlug?: string | null;
  onNavigate?: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="border-l border-border">
      {items.map((item) => (
        <li key={item.slug}>
          <a
            href={`#${item.slug}`}
            onClick={onNavigate}
            className={cn(
              "-ml-px block border-l-2 py-1 leading-snug transition-colors",
              item.level === 3 ? "pl-6" : "pl-3",
              activeSlug === item.slug
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Mobile "Jump to" bar. The sticky desktop TOC is `lg:` only, so on a phone
 * there was previously no way to reach the quiz, another section, or the
 * next lesson without scrolling the entire lesson.
 */
export function LessonMobileNav(props: LessonNavProps) {
  const { items, ...actions } = props;
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const close = () => detailsRef.current?.removeAttribute("open");

  return (
    <div className="sticky top-14 z-30 -mx-6 mb-6 border-b border-border/60 bg-background/85 px-6 py-2 backdrop-blur-md lg:hidden">
      <details ref={detailsRef} className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
          <ListIcon className="size-4" />
          Jump to
          <ChevronDownIcon className="size-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 space-y-3 pb-2">
          <NavActions {...actions} />
          {items.length > 0 && (
            <nav aria-label="Sections" className="max-h-[45dvh] overflow-y-auto text-sm">
              <SectionLinks items={items} onNavigate={close} />
            </nav>
          )}
        </div>
      </details>
    </div>
  );
}

/**
 * Desktop sidebar: quiz + prev/next pinned above the scroll-spy section list,
 * so they stay in view for the whole lesson.
 */
export function LessonSideNav({
  items,
  activeSlug,
  ...actions
}: LessonNavProps & { activeSlug?: string | null }) {
  return (
    <div className="space-y-5">
      <NavActions {...actions} />
      {items.length > 0 && (
        <nav aria-label="Table of contents" className="text-sm">
          <p className="mb-3 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            On this page
          </p>
          <SectionLinks items={items} activeSlug={activeSlug} />
        </nav>
      )}
    </div>
  );
}
