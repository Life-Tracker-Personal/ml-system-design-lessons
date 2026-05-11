import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

const CONTENT_ROOT = path.join(process.cwd(), "src/content");

export type LessonMeta = {
  id: string;
  chapter: number;
  title: string;
  subtitle?: string;
  refs?: number[];
  estimatedMinutes?: number;
};

export type Lesson = {
  meta: LessonMeta;
  content: string;
};

export async function getLesson(
  chapter: string,
  lesson: string,
): Promise<Lesson | null> {
  try {
    const filePath = path.join(CONTENT_ROOT, chapter, `${lesson}.mdx`);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(raw);
    return { meta: data as LessonMeta, content };
  } catch {
    return null;
  }
}

export type QuizMeta = {
  lessonId: string;
  chapter: number;
  title: string;
  description?: string;
  estimatedMinutes?: number;
};

export type Quiz = {
  meta: QuizMeta;
  content: string;
};

export async function getQuiz(
  chapter: string,
  lesson: string,
): Promise<Quiz | null> {
  try {
    const filePath = path.join(CONTENT_ROOT, chapter, `${lesson}.quiz.mdx`);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(raw);
    return { meta: data as QuizMeta, content };
  } catch {
    return null;
  }
}

export async function listLessons(chapter: string): Promise<LessonMeta[]> {
  try {
    const dirPath = path.join(CONTENT_ROOT, chapter);
    const files = await fs.readdir(dirPath);
    const mdxFiles = files.filter((f) => f.endsWith(".mdx"));
    const metas = await Promise.all(
      mdxFiles.map(async (f) => {
        const raw = await fs.readFile(path.join(dirPath, f), "utf-8");
        const { data } = matter(raw);
        return data as LessonMeta;
      }),
    );
    return metas.sort((a, b) => a.id.localeCompare(b.id));
  } catch {
    return [];
  }
}
