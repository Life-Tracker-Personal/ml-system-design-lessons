import GithubSlugger from "github-slugger";

export type TocItem = {
  level: 2 | 3;
  text: string;
  slug: string;
};

const HEADING_REGEX = /^(#{2,3})\s+(.+?)\s*$/gm;

export function extractToc(mdxSource: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];

  const lines = mdxSource.split("\n");
  let inCodeBlock = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    const text = match[2]
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/&amp;/g, "&");
    const slug = slugger.slug(text);
    items.push({ level, text, slug });
  }

  // Avoid `no-unused-vars` warning if HEADING_REGEX gets dead-code-eliminated
  void HEADING_REGEX;
  return items;
}
