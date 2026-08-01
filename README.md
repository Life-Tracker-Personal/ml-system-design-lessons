# ML interview-prep course

A Next.js 16 + MDX site teaching ML for **top-tier (senior–staff, FAANG / frontier-lab) interviews**. Content lives in `src/content/cX/cX.Y.mdx` (lesson) + `cX.Y.quiz.mdx` (paired quiz), discovered by directory scan — no manifest.

## Standard

Every lesson meets four bars:

1. **Derive, don't state.** Every claim is derived from first principles, quantified with real numbers, or grounded in a named real-world incident. Generic "in practice…" is below the bar.
2. **Plain English before math.** Each idea leads with one sentence of intuition before an equation.
3. **Challenge the standard story.** Every lesson interrogates at least one "rule everybody repeats" — where it's mathematically true, where it's just convention, and where it breaks.
4. **Figures where a whiteboard sketch belongs.** Every idea a working ML engineer would draw on a whiteboard gets an inline SVG figure. Math-only prose is a draft, not a shipped lesson. See `src/components/mdx/figure-helpers.tsx` for the shared helpers and the various `*-figures.tsx` files for the topic-specific components.

The authoring standard (structure, quiz format, MDX gotchas, figure conventions) is codified in `.claude/skills/authoring-lessons/SKILL.md`. Read it before writing new content.

The curriculum outline lives in `PLAN.md`.

## Development

```bash
npm install
npm run dev          # dev server on :3000
npm run build        # production build (also type-checks)
npx tsc --noEmit     # type-check only
```

Lessons render at `/c/<chapter>/<lesson>`, quizzes at `/c/<chapter>/<lesson>/quiz`.

## MDX gotchas that have shipped 500s

- Escape bare `<` and `>` in prose (MDX parses them as JSX).
- Escape or avoid bare `{` / `}` in prose (MDX parses them as JS expressions — a literal set like `{a, b, c}` in prose 500s at request time).
- A clean `npm run build` is not a clean render — MDX compiles per request. Curl the live lesson *and* quiz pages after deploy to confirm 200s.

## Repository layout

- `src/content/cX/` — lessons and quizzes as MDX.
- `src/components/mdx/` — MDX-renderer, `Quiz`, `DeepDive`, and figure components.
- `src/lib/lessons.ts` — lesson discovery (`listLessons`).
- `.claude/skills/authoring-lessons/SKILL.md` — the authoring spec.
- `.claude/skills/interview-questions/SKILL.md` — company-by-company interview-question bank and expected-answer rubrics.
