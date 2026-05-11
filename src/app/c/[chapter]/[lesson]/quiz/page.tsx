import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuiz } from "@/lib/lessons";
import { MdxContent } from "@/components/mdx/mdx-content";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ chapter: string; lesson: string }>;
}) {
  const { chapter, lesson } = await params;
  const data = await getQuiz(chapter, lesson);
  if (!data) notFound();

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href={`/c/${chapter}/${lesson}`}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Back to lesson
          </Link>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Badge variant="outline">{data.meta.lessonId} · Quiz</Badge>
            {data.meta.estimatedMinutes && (
              <span>{data.meta.estimatedMinutes} min</span>
            )}
          </div>
        </div>
      </header>
      <article className="lesson-prose mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight">{data.meta.title}</h1>
        {data.meta.description && (
          <p className="text-muted-foreground mt-3 mb-8 text-lg">
            {data.meta.description}
          </p>
        )}
        <Separator className="mb-10" />
        <MdxContent source={data.content} />
      </article>
    </div>
  );
}
