"use client";

import { useEffect, useState } from "react";
import { LessonSideNav, type LessonNavProps } from "./lesson-nav";

/** Scroll-spy over the rendered headings. */
function useActiveSlug(items: LessonNavProps["items"]) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.target as HTMLElement).offsetTop -
              (b.target as HTMLElement).offsetTop,
          );
        if (visible.length > 0) {
          setActiveSlug(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );
    const els = items
      .map((i) => document.getElementById(i.slug))
      .filter((el): el is HTMLElement => el !== null);
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return activeSlug;
}

/**
 * Desktop sidebar navigation: quiz link + prev/next pinned above the
 * scroll-spied section list, so they stay reachable for the whole lesson.
 */
export function Toc(props: LessonNavProps) {
  const activeSlug = useActiveSlug(props.items);
  return <LessonSideNav {...props} activeSlug={activeSlug} />;
}
