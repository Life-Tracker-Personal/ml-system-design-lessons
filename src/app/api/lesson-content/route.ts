import { NextRequest, NextResponse } from "next/server";
import { getLesson, getQuiz, listLessons } from "@/lib/lessons";

// Both segments are interpolated into a filesystem path, so constrain them to
// the exact shape real ids take (c1, c1.10) — never let `..` or a separator in.
const CHAPTER_RE = /^c\d{1,2}$/;
const LESSON_RE = /^c\d{1,2}\.\d{1,2}$/;

/**
 * Serves lesson/quiz text to the in-browser tutor so it can answer FROM the
 * book instead of from pretraining alone. Read-only; content is already public.
 */
export async function GET(req: NextRequest) {
  const chapter = req.nextUrl.searchParams.get("chapter") ?? "";
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const kind = req.nextUrl.searchParams.get("kind") === "quiz" ? "quiz" : "lesson";

  if (!CHAPTER_RE.test(chapter)) {
    return NextResponse.json({ error: "bad chapter" }, { status: 400 });
  }

  // No id → just the book map (used so the tutor can point at other lessons).
  if (!id) {
    const lessons = await listLessons(chapter);
    return NextResponse.json({
      chapter,
      lessons: lessons.map((l) => ({ id: l.id, title: l.title })),
    });
  }

  if (!LESSON_RE.test(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  const [doc, lessons] = await Promise.all([
    kind === "quiz" ? getQuiz(chapter, id) : getLesson(chapter, id),
    listLessons(chapter),
  ]);
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    chapter,
    id,
    kind,
    title: doc.meta.title,
    content: doc.content,
    lessons: lessons.map((l) => ({ id: l.id, title: l.title })),
  });
}
