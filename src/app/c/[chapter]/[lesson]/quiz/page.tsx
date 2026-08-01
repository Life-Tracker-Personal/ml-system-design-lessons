import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon } from "lucide-react";
import { getQuiz, listLessons } from "@/lib/lessons";
import { LessonMobileNav } from "@/components/lesson/lesson-nav";
import { MdxContent } from "@/components/mdx/mdx-content";
import { SiteHeader } from "@/components/site/site-header";
import { ReadingProgress } from "@/components/site/reading-progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ chapter: string; lesson: string }>;
}) {
  const { chapter, lesson } = await params;
  const [data, all] = await Promise.all([
    getQuiz(chapter, lesson),
    listLessons(chapter),
  ]);
  if (!data) notFound();

  const idx = all.findIndex((l) => l.id === lesson);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ReadingProgress />
      <SiteHeader>
        <Link
          href={`/c/${chapter}/${lesson}`}
          className="font-mono transition-colors hover:text-foreground"
        >
          {data.meta.lessonId}
        </Link>
        <span className="text-border" aria-hidden>
          /
        </span>
        <span className="font-medium text-foreground">Quiz</span>
      </SiteHeader>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 lg:py-16">
        <LessonMobileNav
          chapter={chapter}
          lesson={lesson}
          hasQuiz
          prev={prev}
          next={next}
          items={[]}
          variant="quiz"
        />
        <header className="mb-10">
          <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
            {data.meta.lessonId} · Quiz
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">
            {data.meta.title}
          </h1>
          {data.meta.description && (
            <p className="mt-3 text-lg text-muted-foreground text-balance">
              {data.meta.description}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Badge variant="outline">Quiz</Badge>
            {data.meta.estimatedMinutes && (
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="size-3.5" />
                {data.meta.estimatedMinutes} min
              </span>
            )}
          </div>
          <Separator className="mt-8" />
        </header>

        <article className="lesson-prose">
          <MdxContent source={data.content} />
        </article>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
          <Link
            href={`/c/${chapter}/${lesson}`}
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Back to the lesson
          </Link>
          {next && (
            <Link
              href={`/c/${chapter}/${next.id}`}
              className="group inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-medium transition-colors hover:border-primary/40"
            >
              <span className="text-muted-foreground">Next lesson:</span>
              <span className="max-w-[18ch] truncate">{next.title}</span>
              <ArrowRightIcon className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
