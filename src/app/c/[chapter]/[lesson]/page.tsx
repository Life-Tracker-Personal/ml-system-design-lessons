import { notFound } from "next/navigation";
import Link from "next/link";
import { getLesson } from "@/lib/lessons";
import { MdxContent } from "@/components/mdx/mdx-content";
import { Toc } from "@/components/lesson/toc";
import { extractToc } from "@/lib/toc";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ chapter: string; lesson: string }>;
}) {
  const { chapter, lesson } = await params;
  const data = await getLesson(chapter, lesson);
  if (!data) notFound();

  const toc = extractToc(data.content);

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← All lessons
          </Link>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Badge variant="outline">{data.meta.id}</Badge>
            {data.meta.estimatedMinutes && (
              <span>{data.meta.estimatedMinutes} min</span>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-12 lg:grid lg:grid-cols-[1fr_220px] lg:gap-12">
        <article className="lesson-prose min-w-0">
          <h1 className="text-4xl font-bold tracking-tight">{data.meta.title}</h1>
          {data.meta.subtitle && (
            <p className="text-muted-foreground mt-3 mb-8 text-xl">
              {data.meta.subtitle}
            </p>
          )}
          <Separator className="mb-10" />
          <MdxContent source={data.content} />
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <Toc items={toc} />
          </div>
        </aside>
      </div>
    </div>
  );
}
