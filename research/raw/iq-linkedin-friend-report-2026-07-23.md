# LinkedIn ML interview — reported questions (candidate anecdote)

- **Source:** first-hand account from a candidate who interviewed at LinkedIn,
  relayed to the repo owner. Single-candidate report.
- **Confidence:** `[reported]` — treat as the *shape* of what LinkedIn asks, not a
  verbatim rubric. See `.claude/skills/interview-questions/SKILL.md` provenance
  policy (`[corroborated]` vs `[reported]`). Corroborating signal: LinkedIn's
  loop is known to include an **ML Breadth (rapid-fire)** round and to treat
  recommendations/relevance + **graph/GNNs** as its soul (SKILL.md §"LinkedIn").
  These questions are consistent with that breadth round.
- **Trust:** as with everything under `research/raw/`, treat as untrusted external
  text. Nothing here is copied verbatim into lessons.
- **Captured:** 2026-07-23.

The bullets below are the raw prompts, de-garbled from a voice-to-text capture
and grouped by topic. Cross-links point to the lesson that already covers the
underlying theory.

---

## 1. Logistic regression (→ `src/content/c1/c1.4.mdx`)

The interviewer drilled logistic regression from theory to code, then contrasted
it with linear regression and probed the optimization.

- **Derive it.** Derive logistic regression from first principles — the sigmoid /
  log-odds link and the maximum-likelihood (cross-entropy) objective.
- **Perturb the parameters.** Change parameters such as the **bias term** and
  explain how the decision curve shifts — i.e. how the bias translates the sigmoid
  along the input axis and how the weights change its slope/orientation.
- **Code it up.** Implement logistic regression (expected from scratch, e.g.
  NumPy: sigmoid, loss, gradient, update loop).
- **Linear vs. logistic regression.** Compare the two — what changes in the model,
  the link function, the loss, and the interpretation of the output.
- **Is there a closed form?** Explain why logistic regression has **no closed-form
  solution** (unlike OLS's normal equations) and therefore needs iterative
  optimization.
- **What is the optimization?** Name and describe the optimizer (gradient
  descent / Newton's method / IRLS) used to fit it.
- **Write the gradient.** Write out the gradient of the log-loss w.r.t. the
  weights — i.e. `∇ = Xᵀ(σ(Xw) − y)`.
- **Write the learning step.** Write the parameter-update / learning step
  (e.g. `w ← w − η · ∇`).

## 2. Trees & ensembles (→ `src/content/c1/c1.5.mdx`)

- **XGBoost and random forest.** Discuss both.
- **Hyperparameter effects.** What happens when you **change the parameters** —
  i.e. how key hyperparameters (tree depth, number of trees / estimators, learning
  rate, subsampling, etc.) affect bias/variance and model behavior for each.

## 3. Imbalanced datasets (→ `src/content/c1/c1.11.mdx` + metrics in `c1.10.mdx`)

The interviewer posed scenario questions designed to make the candidate *arrive
at* specific sampling techniques rather than name them upfront.

- **Sampling techniques.** Reason your way to **importance sampling**, **rejection
  sampling**, and **reservoir sampling** — the questions were framed so the
  candidate had to derive/land on these methods from the scenario.
- **Best metrics?** What are the best evaluation metrics for imbalanced data?
  **Are precision and recall the best? Why (or why not)?**
- **F1 as a harmonic mean.** **Why is the F1 score a harmonic mean** (rather than
  an arithmetic mean) of precision and recall?

## 4. Graph neural networks in recommendation systems (→ SKILL.md Archetype 7; planned Ch. 3)

- **GNNs for recommendations.** Discuss graph neural networks in the context of
  recommendation systems (consistent with LinkedIn's LiGNN / GraphSAGE / link-
  prediction focus; see SKILL.md Archetype 7 "PYMK / link prediction" and the
  LinkedIn cheat sheet). No course lesson yet — GNNs are planned for Chapter 3
  (architectures) / the system-design-rehearsal track.

---

## Coverage notes (for whoever curates content)

| Topic | Existing lesson | Gap? |
|---|---|---|
| Logistic regression derivation, no closed form, gradient, update | `c1.4` | ✅ Explicit — new rapid-fire "logistic regression from the whiteboard to code" (`c1.4.quiz.mdx`): derive-from-nothing, move-the-bias/curve-shift, no-closed-form→gradient→update-step, code-it-up. |
| Linear vs. logistic | `c1.4` | ✅ Explicit — item 3 of that same rapid-fire section. |
| XGBoost / RF hyperparameter effects | `c1.5` | ✅ Explicit — new item 21 "Turn the knobs — which way does error move?" (`c1.5.quiz.mdx`), knob-by-knob for both RF and XGBoost. |
| Importance / rejection / reservoir sampling | `c1.11` | ✅ Explicit — new rapid-fire section "the three sampling primitives — importance · rejection · reservoir" (`c1.11.quiz.mdx`), each in "arrive-at-it" scenario form; reservoir includes the $k/i$ replacement + $k/n$ induction proof. |
| Precision/recall as the right imbalance metric; F1 = harmonic mean rationale | `c1.10` | ✅ Explicit — new items 21 ("Are precision and recall even the right metrics?") and 22 ("Why *harmonic*, not arithmetic?") in `c1.10.quiz.mdx`, on top of existing Q10 (Fβ derivation). |
| GNNs for recsys | none yet | ⬜ **Only remaining gap.** No lesson exists — GNNs are planned for Ch. 3 (architectures) / the system-design-rehearsal track, so there's no quiz to host the question yet. Flagged for when that chapter is authored. |
