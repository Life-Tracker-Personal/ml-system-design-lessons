# Curriculum plan

The lesson list for this ML-interview-prep course. Authoring standard lives in
`.claude/skills/authoring-lessons/` — including §11 on **figures**, which is a hard bar:
every lesson ships with 2–4 inline SVG figures where a whiteboard sketch would help.
Reference lessons that set the bar: `c1.1`, `c1.2`, and (as of the figure sweep) `c1.4`.
Real interview questions + expected-answer rubrics by company (for the system-design-rehearsal
track and "Interview gotchas" sections) live in `.claude/skills/interview-questions/`.

## Chapter roadmap (planned)

The book's spine moves from paradigm-agnostic foundations → deep-learning mechanics →
architectures → a separate reinforcement-learning paradigm. Only Chapter 1 is partly
written; the rest are planned placement, not yet authored.

| Chapter | Title | Covers | Status |
|---|---|---|---|
| 1 | Data & ML foundations | data, losses, linear/logistic models, evaluation | 🟡 in progress |
| 2 | Deep learning fundamentals | MLPs, backprop, optimization, normalization, regularization | ⬜ planned |
| 3 | Architectures | **CNNs** (weight sharing / translation equivariance), sequence models/RNNs, **Transformers** (Q/K/V, self-attention) | ⬜ planned |
| 4 | Sequence / LLM & generative | language models, pretraining, generative models (optional bridge) | ⬜ planned |
| 5 | Reinforcement learning | MDPs, Bellman, value/policy methods, policy gradients; RLHF/DPO bridge to Ch 4 | ⬜ planned |

> **Why CNNs + Transformers share a chapter but RL does not.** CNNs and Transformers are
> both supervised-learning *architectures* and belong together once Ch 2 establishes backprop
> and optimization. RL is a different *paradigm* (agent/environment/reward, MDPs, Bellman) and
> earns its own chapter rather than being folded in with architectures. The authoring skill §4
> already anticipates Transformer content ("Q vs K: which part of the role is forced by the
> architecture and which is just the human label?").

## Chapter 1 — Data & ML foundations

| Lesson | Title | Status |
|---|---|---|
| c1.1 | Data foundations (OLTP/OLAP, splits, leakage) | ✅ written |
| c1.2 | Regression losses (loss = −log p(noise)) | ✅ written |
| c1.3 | Classification losses (cross-entropy, focal, class-balanced; calibration) | ✅ written |
| c1.4 | Linear & logistic regression (OLS/MLE, regularization, VIF, PCA) | ✅ written |
| c1.5 | Trees & ensembles (CART, bagging/RF, boosting/GBDT, stacking) | ✅ written |
| c1.6 | Kernel methods & instance-based (SVM, kNN) | ✅ written |
| c1.7 | Unsupervised learning (clustering + nonlinear embeddings) | ✅ written |
| c1.8 | Naive Bayes & probabilistic (generative vs. discriminative) | ✅ written |
| c1.9 | Model selection & validation (bias-variance, CV, tuning) | ✅ written |
| c1.10 | Evaluation metrics (AUC=concordance, ROC vs PR, calibration) | ✅ written — built to the spec below |
| c1.11 | Class imbalance & resampling (threshold-moving, prior correction) | ✅ written |

> **Sort-order gotcha (resolved):** `listLessons` now sorts with `localeCompare(..., { numeric: true })`,
> so `c1.10`/`c1.11` order after `c1.9` (not after `c1.1`). No id zero-padding needed.

---

## c1.10 — Evaluation metrics (planned)

c1.1 already forward-references this lesson for "full derivations and edge cases" of the
classification-metric vocabulary (`c1.1.mdx:412`). Build it to the c1.1/c1.2 depth bar
(60-min lesson + 12-question quiz).

### ROC / AUC — required interview-grade depth

The current c1.1 treatment is a deliberately-brief refresher (2 bullets, `c1.1.mdx:403–410`).
A Google-AI-overview level treatment (TPR vs FPR, "0.5 = random, 1.0 = perfect", "threshold-
agnostic / scale-invariant", "use PR-AUC when imbalanced") is the **floor, not the ceiling** —
that depth is the whole point for interviews. c1.10 must go past it:

- **AUC = concordance probability, derived.** Prove AUC equals $P(\text{score}_+ > \text{score}_-)$
  for a random positive/negative pair, and that this is exactly the **Mann–Whitney U / Wilcoxon
  rank-sum** statistic ($\text{AUC} = U / (n_+ n_-)$). This is the organizing thesis for the ROC
  half: AUC is a *ranking* statistic, not a threshold statistic.
- **Why ROC is invariant to class balance — and PR is not.** Mechanism, not assertion: TPR and FPR
  are each computed *within* one class (column-normalized), so changing the positive:negative ratio
  leaves the ROC curve unchanged; precision mixes both classes, so PR moves with prevalence. Quantify
  with a worked example (e.g. 1% vs 50% positive, same scorer → identical ROC-AUC, very different
  PR-AUC and precision).
- **The imbalanced-data trap, made precise.** Why a 0.9 ROC-AUC can be useless at 1% positives:
  a tiny FPR still floods the flagged set with negatives because there are 99× more of them.
  Tie to the c1.1 quiz "95%-accuracy trap" (`c1.1.quiz.mdx:527`) so the threads connect.
- **ROC vs PR dominance.** A classifier that dominates in ROC space dominates in PR space
  (Davis & Goadrich 2006) — but the *converse* and the *area* relationship do not transfer.
  Good "challenge the standard story" material.
- **Ranking vs calibration.** AUC is invariant to any monotonic transform of scores, so a model
  with perfect AUC can be terribly *calibrated*. Motivates log-loss / Brier / reliability diagrams
  as the calibration counterpart.
- **Edge cases / gotchas.** AUC < 0.5 → flip the sign; partial AUC when only low-FPR region matters;
  ties in scores (the convex-hull / trapezoidal subtlety); multiclass AUC (one-vs-rest macro/micro);
  AUC's blind spot to where on the curve you actually operate.

### Other metrics the lesson should cover (to round out the chapter)

Confusion matrix → precision/recall/F1 (and Fβ), PR-AUC, log-loss & Brier score, calibration
(reliability diagrams, Platt / isotonic), threshold selection (Youden's J, cost-sensitive),
and metric choice as a function of the business cost matrix.

### Authoring reminders for c1.10
- Lead with the one-sentence thesis (likely: *AUC is a ranking statistic — the concordance
  probability — which is exactly why it ignores class balance and says nothing about calibration*).
- Each "what you'll be able to do" bullet maps 1:1 to a quiz question.
- Library claims version-accurate with mechanism named (e.g. `sklearn.metrics.roc_auc_score`
  uses the trapezoidal rule; `average_precision_score` vs `auc(recall, precision)` differ).
- Cite primary sources: Hanley & McNeil 1982 (AUC = Wilcoxon), Davis & Goadrich 2006 (ROC↔PR),
  Saito & Rehmsmeier 2015 (PRC for imbalanced data).
