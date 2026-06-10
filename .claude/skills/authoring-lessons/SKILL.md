---
name: authoring-lessons
description: Author or review a lesson or quiz for this ML-interview-prep course (content in src/content/**, files like cX.Y.mdx and cX.Y.quiz.mdx). Encodes the required depth, curiosity, structure, quiz format, difficulty calibration, voice, MDX/component conventions, accuracy bar, and the chapter roadmap so new content matches the c1.1 / c1.2 standard. Use whenever adding a new lesson or quiz, editing an existing one, or judging whether content is interview-grade.
---

# Authoring lessons for the ML-interview-prep course

This app teaches ML for **top-tier (senior–staff, FAANG / frontier-lab) interviews**. Two reference lessons set the bar: `src/content/c1/c1.1.mdx` (Data foundations) and `c1/c1.2.mdx` (Regression losses), each with a paired `*.quiz.mdx`. **Read both before writing new content** — they are the spec. This skill is the written-down version of why they work, so new lessons match without re-deriving the standard each time.

The golden rule: **derive, don't state.** Every claim earns its place by being derived from first principles, quantified with real numbers, or grounded in a named real-world incident. If a sentence could appear in a generic blog post, it's below the bar.

---

## 1. The learner (calibration target)

Calibrate everything to this profile (captured from the learner's own study notes). When in doubt about depth, aim *here*, not at a general audience.

| Dimension | Target |
|---|---|
| **Depth** | High. Comfortable with matrix shapes, variance arguments, architecture tradeoffs, and implementation-level details. Don't simplify to protect the reader. |
| **Teaching style** | Socratic / interview mode: pose a question, answer it, then grade/correct and push deeper. |
| **Explanation order** | **Plain English first, then equations and shapes.** Lead each idea with one sentence of intuition before the math. Avoid code blocks unless code is genuinely the clearest medium. |
| **Curiosity pattern** | Challenges simplifications. Habitually asks whether the "standard story" is *mathematically precise* or *just conventional*. Reward this — see §4. |
| **Background** | A "rusty staff engineer": strong general SWE, may need ML vocabulary re-grounded the first time it's used. Never condescend; never assume they remember a specific term's definition. |

---

## 2. Lesson anatomy (`cX.Y.mdx`)

Follow this section order. Not every section is mandatory, but the **bolded** ones are. Mirror the heading wording from c1.1/c1.2 so the reading experience is consistent.

1. **Frontmatter** (see §6).
2. **`## TL;DR`** — one paragraph. State the single organizing idea, with the key claim in **bold**. This is the thesis the whole lesson defends.
3. **`## What you'll be able to do after this lesson`** — a bulleted list of concrete, testable capabilities, each starting with a verb: *Derive… / Compute… / Prove… / Diagnose… / Defend…*. These map 1:1 onto quiz questions.
4. **`## Why [this topic / why this comes first]`** — motivation framed by **interview and production stakes**, not curriculum logic. (c1.2: "The loss is the spec." c1.1: "every system-design failure I've seen comes back to data.")
5. **`> **Vocabulary primer.`** *(blockquote)* — ground every term the lesson leans on, one line each. State the "rusty staff engineer" assumption.
6. **Core derivation sections** — the heart. Build the idea from first principles with full KaTeX. Show **every step**; don't skip "obvious" algebra. (See §3 for the quality bar inside these.)
7. **`> **Stop and think.`** *(blockquotes, sprinkled in)* — Socratic prompts mid-lesson. Pose a genuine question and embed a *hint*, not the full answer. At least 1–2 per lesson.
8. **`## Tradeoff matrix`** *(GFM table)* — compress the options into a comparison table (axes like: assumption / what it predicts / sensitivity / differentiability / cost).
9. **`## Worked decision walk-throughs`** *(scenarios A/B/C…)* — concrete, numbered situations with real numbers and units, ending in a defended choice.
10. **`## Production failure modes`** *(numbered)* — real ways this bites in production. Each is a mini war-story with a cause and a fix.
11. **`## Interview gotchas`** — bullets mapping *"the question they'll ask"* → *what a strong answer actually contains* (and what the cheap answer misses).
12. **`## Take the quiz`** — one line + link: `**[Take the quiz →](/c/cX/cX.Y/quiz)**`.
13. **`## Cited references`** — list `refs` by number with their file path, then an **External works** subsection citing **primary sources** (papers, author, year) — e.g. Huber 1964, Koenker & Bassett 1978.

Target length ≈ the references; `estimatedMinutes: 60` for a lesson.

---

## 3. The depth bar (what "deep enough" means)

Inside the core sections, every lesson must hit all four:

- **One organizing first-principles idea.** Each lesson reduces to a single reframe that the rest *derives from*, not a list of facts. c1.2: "every regression loss is secretly a noise model (loss = −log p(noise))." c1.1: "every leakage type is one rule — no information unavailable at prediction time." **Find this thesis first; if you can't name it in one sentence, the lesson isn't ready.**
- **Full derivations.** Write the likelihood, take the log, drop constants *with justification*, land on the result, write **QED**. Show shapes for anything tensor-valued. The reader should be able to reproduce it on a whiteboard.
- **Quantified, not vibes.** Replace "MSE is sensitive to outliers" with the computation: *999 residuals ≈1 plus one ≈100 → outlier is 9.1% of the gradient under MSE vs 0.1% under MAE.* Pick concrete numbers and units; do the arithmetic in-text.
- **Named real-world grounding.** At least one real incident or system, by name: CheXNet, Roberts et al. 2021, the Kaggle Mercedes-Benz leak, XGBoost's `reg:absoluteerror`. Generic "in practice…" is not grounding.
- **Stats / quant-research lens (where applicable).** When a topic has a statistics backbone — distributions & noise models, estimators (bias/variance/consistency/BLUE), OLS, PCA, hypothesis testing, calibration — surface the angle a quant-research / hedge-fund / research-lab interviewer probes: *what is the estimator, what's its sampling distribution, which assumption breaks, what's the MLE/Bayesian view.* (Explicit user preference; especially distributions, PCA, OLS.)

---

## 4. Curiosity: challenge the standard story

This is the signature move and the learner's defining trait. **Every lesson and quiz must interrogate at least one "rule everybody repeats."** Show where the conventional wisdom is *exactly right*, where it's *just convention*, and where it *breaks*.

Patterns that do this well (all from the reference quizzes):
- *Construct a counter-example to a rule.* "Construct a case where grouped splits are **worse** than random." "Construct a dataset where Huber is **strictly worse** than both MSE and MAE."
- *Expose a detection method's blind spot.* "A feature passes the drop-column leakage test but is **still** leaking — how?" (redundancy).
- *Separate the mathematical fact from the naming convention.* "Q vs K: which part of the role is forced by the architecture and which is just the human label?"
- *Reframe a property as a consequence, not a primitive.* "Robustness isn't a property of the loss; it's a property of how its gradient magnitude scales with the residual."

If a lesson only confirms what a textbook says, it's missing the point of this course.

---

## 5. Quiz anatomy (`cX.Y.quiz.mdx`)

- **12 questions.** `estimatedMinutes: 45`.
- **Intro paragraph** stating these test understanding/derivation/counter-example construction, **not recall**, and inviting the reader to answer before revealing.
- **A calibration line** giving the staff-level bar, e.g. *"If you can answer 8 of these cleanly, you're calibrated for an ML system-design interview at staff level. If you can answer all 12, you can teach this material."* — or name the must-derive subset ("If you can derive Q1, Q2, Q5, Q7 from scratch on a whiteboard…").
- Each question is a `<Quiz id="N">` block containing:
  - `**QN.** <prompt>` — phrased as **derive / prove / compute exactly / construct / design / show**. Never "what is" or "list."
  - `<details>` → `<summary>Model answer + rubric</summary>` → the full worked answer → a **`**Rubric:**`** bullet list enumerating the exact points that earn credit → `</details>`.
- The model answer is held to the **same depth bar as the lesson** (§3): complete derivations, quantified, with the subtle "bonus" insight a great candidate would add.

**Question-type taxonomy** (aim for a spread, not 12 of one kind):
derivation from first principles · repeat-a-derivation-for-a-variant · exact quantified computation (gradients, influence, variance) · edge-case / pathology (non-differentiability, variance blow-up) · prove a property (continuity, unbiasedness) · prove-via-integral / calculus · closed-form-exists-or-not · invariance / equivariance · **library-specific debugging** (must be version-accurate — see §7) · **construct an adversarial dataset / counter-example** · asymptotic / Taylor analysis · design-a-protocol.

---

## 6. MDX & component mechanics

**Lesson frontmatter** (`LessonMeta` in `src/lib/lessons.ts`):
```yaml
---
id: c1.3            # cX.Y — must match filename and the route
chapter: 1
title: <short title>
subtitle: <one line — often "… — derived from <angle>">
refs: [1, 8, 9]     # reference numbers; optional
estimatedMinutes: 60
---
```

**Quiz frontmatter** (`QuizMeta`):
```yaml
---
lessonId: c1.3
chapter: 1
title: Quiz — <topic>
description: 12 conceptually difficult questions on <topics>.
estimatedMinutes: 45
---
```

**Components available** (registered in `src/components/mdx/mdx-content.tsx`):
- `<Quiz id="N"> … </Quiz>` — the quiz-question card. Quiz file only.
- `<DeepDive title="…"> … </DeepDive>` — collapsible accordion for optional depth that would otherwise break flow. Underused so far; good for tangents a curious reader wants but that aren't core. (Note: it's a client component — keep its children to plain MDX/markdown + math.)
- `<details><summary>…</summary> … </details>` — raw HTML, used for the quiz model-answer reveal.

**Rendering pipeline:** `next-mdx-remote/rsc` with `remark-gfm` (tables, strikethrough), `remark-math` + `rehype-katex` (math), `rehype-slug` (auto heading IDs → in-page anchor links like `#refresher-…` work).

**MDX gotchas — these have caused real 500s in this repo:**
- **Escape bare `<` and `>` in prose.** MDX parses them as JSX. Write inequalities as math (`$<10$ ms`, `$\le$`, `$\ge$`) or wrap in code (`` `<10 ms` ``). A top source of "lesson throws at request time." Grep new files for unescaped `<`/`>` before shipping.
- **Escape or avoid bare `{` / `}` in prose.** MDX parses `{...}` as a JSX expression and evaluates it as JavaScript — a literal set like `{a, b, c}` in prose throws a **request-time 500** (this exact bug 500'd c1.7's quiz: `{spherical, shared variance, equal weight}`). Keep braces inside `$...$` math or `` `code` ``, write `\{`/`\}`, or reword. The `<`/`>` and KaTeX scans do **not** catch this — also scan for bare `{`/`}` outside math/code.
- **A clean build is not a clean render.** `next-mdx-remote/rsc` compiles MDX *per request*, so `npm run build` (and a green Vercel deploy) passes even when a page will 500 when served. **Always `curl` the live lesson *and* quiz pages for `200` after deploy** — it's the only check that exercises the real render path.
- **Math:** `$inline$` and `$$block$$` via KaTeX. Use `\;`, `\!`, `\bigl…\bigr` for spacing as the reference lessons do.
- **In-lesson links:** `/c/cX/cX.Y` for a lesson, `/c/cX/cX.Y/quiz` for its quiz, `#slug` for sections (slug = lowercased heading, non-word chars → `-`).
- **Tables** are GFM; keep a header row + `|---|` separator.

---

## 7. Accuracy bar (non-negotiable)

This course is read by people who will repeat its claims in interviews, so a wrong claim is worse than a missing one.

- **Library/version claims must be current and specific.** The original c1.2 wrongly said XGBoost "refuses to train on MAE"; in fact XGBoost ≥1.7 ships native `reg:absoluteerror` via *adaptive leaf values* (median-of-residuals per leaf — Friedman's LAD-TreeBoost). The zero-Hessian problem only bites a *hand-rolled* objective. **When you cite a library's behavior, name the version and the mechanism.**
- **Cite primary sources**, not blog summaries, for foundational results (the paper, author, year).
- **Distinguish "mathematically true" from "conventionally done."** If something is a convention, say so (this is also good curiosity material — §4).
- When unsure about a current API or result, verify (web/docs) rather than asserting from memory.

---

## 8. Voice & style

- **Plain English sentence first, then the math** (the learner's stated preference). Never open a section with an equation cold.
- **Goal-first — big picture before details.** Open every section, sub-section, and worked example with 1–2 sentences stating *what we're trying to achieve* before any mechanics or math. A consistent bold lead works well and scans nicely: `**Goal — <one-line objective>.**` (Explicit user preference; applies book-wide. See the sampling sections of c1.1 for the pattern.)
- Direct, confident, second person ("you"). Light first-person experience framing is fine where it adds stakes ("every failure I've seen…").
- **Bold the load-bearing claim** in a paragraph; don't bold everything.
- No filler, no hedging, no "in this section we will." Get to the idea.
- Em-dashes and parentheticals for asides are on-brand; keep them earning their keep.

---

## 9. Build conventions & the plan forward

- **Files:** `src/content/cX/cX.Y.mdx` + `cX/cX.Y.quiz.mdx`. Lessons are discovered by directory scan in `src/lib/lessons.ts` (`listLessons`) — **no manifest to update**, just drop the files in.
- **Ordering bug to know:** `listLessons` sorts by `id.localeCompare`, which is *string* order — so `c1.10` sorts **before** `c1.2`. When you reach two-digit lesson numbers, either zero-pad ids (`c1.02`) or fix the sort to be numeric-aware. Flag this before adding `c1.10`.
- **References:** lessons cite `c1/references/NN_*.html` snapshots. That directory doesn't exist yet — create/snapshot referenced sources, or note unreachable ones inline (as c1.1 does for ref 2).
- **Cross-links are forward-declared:** c1.1 already points at **`c1.10 — Evaluation metrics`**. Honor existing forward references when you fill the gaps so links resolve.

**Roadmap status (as of this writing):** only c1.1 and c1.2 exist; there is **no written curriculum doc**. The implied spine is Chapter 1 = data & ML foundations, lessons 1→~10 ending at `c1.10 Evaluation metrics`; lessons c1.3–c1.9 are **not yet fixed**. Known coverage gaps for a *complete* top-tier loop (beyond more breadth lessons): **system-design rehearsal** (open-ended "design X" walk-throughs) and an **ML-coding** dimension — neither exists yet. Maintain the actual lesson list in a `PLAN.md` / `_outline.md` once it's decided, and update this section's status when it is.

---

## 10. Pre-ship checklist

Before considering a lesson + quiz done:

- [ ] Lesson has a **one-sentence organizing thesis** (§3) stated in the TL;DR.
- [ ] Every core claim is **derived, quantified, or named-incident-grounded** — no bare assertions.
- [ ] At least one **"challenge the standard story"** moment in the lesson, and counter-example/adversarial questions in the quiz (§4).
- [ ] Each "what you'll be able to do" bullet has a **matching quiz question**.
- [ ] Quiz: **12 questions**, derive/prove/construct phrasing, each with a **model answer + explicit rubric**, plus the intro + calibration line.
- [ ] **Plain-English-first** ordering throughout; intuition precedes every equation.
- [ ] Every section / sub-section / worked example **opens with a 1–2 sentence goal statement** (big-picture-first, `**Goal — …**`).
- [ ] Where the topic has a statistics backbone (distributions, estimators, OLS, PCA, testing, calibration), the **stats/quant-research angle** is surfaced.
- [ ] All **library claims are version-accurate** with the mechanism named (§7); primary sources cited.
- [ ] **No unescaped `<`/`>`** outside math/code; links and anchors resolve; frontmatter matches the schema.
- [ ] Forward-references (e.g. to `c1.10`) and the `id` sort order are consistent (§9).
