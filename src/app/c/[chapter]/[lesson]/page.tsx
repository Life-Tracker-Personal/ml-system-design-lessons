import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon } from "lucide-react";
import { getLesson, getQuiz, listLessons } from "@/lib/lessons";
import { MdxContent } from "@/components/mdx/mdx-content";
import { Toc } from "@/components/lesson/toc";
import { SiteHeader } from "@/components/site/site-header";
import { ReadingProgress } from "@/components/site/reading-progress";
import { extractToc } from "@/lib/toc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ chapter: string; lesson: string }>;
}) {
  const { chapter, lesson } = await params;
  const [data, quiz, all] = await Promise.all([
    getLesson(chapter, lesson),
    getQuiz(chapter, lesson),
    listLessons(chapter),
  ]);
  if (!data) notFound();

  const toc = extractToc(data.content);
  const idx = all.findIndex((l) => l.id === lesson);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ReadingProgress />
      <SiteHeader>
        <Link href="/" className="transition-colors hover:text-foreground">
          Chapter {data.meta.chapter}
        </Link>
        <span className="text-border" aria-hidden>
          /
        </span>
        <span className="font-mono text-foreground">{data.meta.id}</span>
      </SiteHeader>

      <div className="mx-auto flex w-full max-w-6xl flex-1 justify-center gap-14 px-6 py-12 lg:py-16">
        <div className="w-full min-w-0 max-w-[720px]">
          <header className="mb-10">
            <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
              Chapter {data.meta.chapter}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">
              {data.meta.title}
            </h1>
            {data.meta.subtitle && (
              <p className="mt-3 text-lg text-muted-foreground text-balance">
                {data.meta.subtitle}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="font-mono">
                {data.meta.id}
              </Badge>
              {data.meta.estimatedMinutes && (
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon className="size-3.5" />
                  {data.meta.estimatedMinutes} min read
                </span>
              )}
              {data.meta.refs && data.meta.refs.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-border" />
                  {data.meta.refs.length} references
                </span>
              )}
            </div>
            <Separator className="mt-8" />
          </header>

          <article className="lesson-prose">
            <MdxContent source={data.content} />
          </article>

          {quiz && (
            <div className="mt-16 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-accent/60 via-card to-card">
              <div className="flex flex-col items-start gap-3 p-6 sm:p-8">
                <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-primary uppercase">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Test your understanding
                </p>
                <h3 className="text-xl font-semibold tracking-tight">
                  {quiz.meta.title}
                </h3>
                {quiz.meta.description && (
                  <p className="max-w-prose text-sm text-muted-foreground">
                    {quiz.meta.description}
                  </p>
                )}
                <Link href={`/c/${chapter}/${lesson}/quiz`} className="mt-3">
                  <Button size="lg" className="h-10 px-5">
                    Take the quiz
                    <ArrowRightIcon />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {(prev || next) && (
            <nav className="mt-14 grid gap-3 border-t border-border pt-8 sm:grid-cols-2">
              {prev ? (
                <Link
                  href={`/c/${chapter}/${prev.id}`}
                  className="group flex flex-col gap-1 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ArrowLeftIcon className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                    Previous
                  </span>
                  <span className="font-medium tracking-tight">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={`/c/${chapter}/${next.id}`}
                  className="group flex flex-col gap-1 rounded-xl border border-border bg-card p-4 text-right transition-colors hover:border-primary/40 sm:items-end"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    Next
                    <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="font-medium tracking-tight">
                    {next.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>

        <aside className="hidden w-[220px] shrink-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8">
            <Toc items={toc} />
          </div>
        </aside>
      </div>
    </div>
  );
}
