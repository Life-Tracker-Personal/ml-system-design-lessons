/**
 * Gives the tutor knowledge of the book.
 *
 * Before this, the tutor was answering purely from pretraining — it had never
 * seen a single lesson. We ground it in the page the reader is actually on by
 * fetching that lesson's text and injecting it as context. This is deliberate
 * lightweight retrieval (current lesson + a map of lesson titles), not a
 * vector-RAG index over the whole book.
 */

/** Cap injected lesson text so a long lesson can't blow the context window. */
const MAX_CONTEXT_CHARS = 24_000;

export interface LessonRef {
  chapter: string;
  id: string;
  kind: "lesson" | "quiz";
}

export interface BookContext {
  ref: LessonRef;
  title: string;
  content: string;
  truncated: boolean;
  lessons: { id: string; title: string }[];
}

/** Read /c/{chapter}/{lesson}[/quiz] out of the current URL. */
export function detectLessonRef(pathname: string): LessonRef | null {
  const m = /^\/c\/(c\d{1,2})\/(c\d{1,2}\.\d{1,2})(\/quiz)?\/?$/.exec(pathname);
  if (!m) return null;
  return { chapter: m[1], id: m[2], kind: m[3] ? "quiz" : "lesson" };
}

const cache = new Map<string, BookContext>();

export async function fetchBookContext(
  ref: LessonRef,
): Promise<BookContext | null> {
  const key = `${ref.chapter}/${ref.id}/${ref.kind}`;
  const hit = cache.get(key);
  if (hit) return hit;

  try {
    const resp = await fetch(
      `/api/lesson-content?chapter=${encodeURIComponent(ref.chapter)}&id=${encodeURIComponent(ref.id)}&kind=${ref.kind}`,
    );
    if (!resp.ok) return null;
    const data = await resp.json();

    const raw: string = data.content ?? "";
    const truncated = raw.length > MAX_CONTEXT_CHARS;
    const ctx: BookContext = {
      ref,
      title: data.title ?? ref.id,
      content: truncated ? raw.slice(0, MAX_CONTEXT_CHARS) : raw,
      truncated,
      lessons: data.lessons ?? [],
    };
    cache.set(key, ctx);
    return ctx;
  } catch {
    return null;
  }
}

/** The grounding block prepended to the conversation. */
export function buildContextBlock(ctx: BookContext): string {
  const map = ctx.lessons.length
    ? `\n\nOther lessons in this chapter (refer the reader to these by id when relevant):\n${ctx.lessons
        .map((l) => `- ${l.id}: ${l.title}`)
        .join("\n")}`
    : "";

  const what = ctx.ref.kind === "quiz" ? "quiz" : "lesson";

  return (
    `The reader is currently on ${what} ${ctx.ref.id} — "${ctx.title}".\n` +
    `Its full text follows between the markers. Answer FROM this material when ` +
    `the question relates to it, using its notation and examples, and say so ` +
    `explicitly when you go beyond what the ${what} covers.` +
    (ctx.truncated
      ? ` (The text is truncated; if the answer needs a later section, say so.)`
      : "") +
    map +
    `\n\n<<<BOOK_${what.toUpperCase()}_START>>>\n${ctx.content}\n<<<BOOK_${what.toUpperCase()}_END>>>`
  );
}
