import Link from "next/link";
import { listLessons } from "@/lib/lessons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const lessons = await listLessons("c1");

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="text-muted-foreground mb-2 text-sm">
            Aminian &amp; Xu · Machine Learning System Design Interview
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            ML System Design — Staff+ Lessons
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl">
            Synthesized from the references in each chapter. Each lesson is
            ~30 minutes for a senior reader; deep dives are click-to-expand.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-muted-foreground mb-6 text-sm tracking-wider uppercase">
          Chapter 1 — Introduction &amp; Overview
        </h2>
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/c/c1/${lesson.id}`}
              className="block"
            >
              <Card className="hover:border-primary/40 transition-colors">
                <CardContent className="flex items-center justify-between py-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{lesson.id}</Badge>
                      <h3 className="text-lg font-semibold">{lesson.title}</h3>
                    </div>
                    {lesson.subtitle && (
                      <p className="text-muted-foreground mt-1.5 ml-[60px] text-sm">
                        {lesson.subtitle}
                      </p>
                    )}
                  </div>
                  {lesson.estimatedMinutes && (
                    <span className="text-muted-foreground text-sm">
                      {lesson.estimatedMinutes} min
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
