# Curriculum plan

The lesson list for this ML-interview-prep course. Authoring standard lives in
`.claude/skills/authoring-lessons/`. Reference lessons that set the bar: `c1.1`, `c1.2`.

## Chapter 1 — Data & ML foundations

| Lesson | Title | Status |
|---|---|---|
| c1.1 | Data foundations (OLTP/OLAP, splits, leakage) | ✅ written |
| c1.2 | Regression losses (loss = −log p(noise)) | ✅ written |
| c1.3 | Classification losses (cross-entropy, focal, class-balanced; calibration) | ✅ written |
| c1.4 | Linear & logistic regression (OLS/MLE, regularization, VIF, PCA) | ✅ written |
| c1.5 | Trees & ensembles (CART, bagging/RF, boosting/GBDT, stacking) | ✅ written |
| c1.6 | Kernel methods & instance-based (SVM, kNN) | ✅ written |
| c1.7–c1.9 | *not yet fixed* | ⬜ TBD |
| c1.10 | Evaluation metrics | ⬜ planned — see spec below |

> **Sort-order gotcha (from authoring skill §9):** `listLessons` sorts by `id.localeCompare`
> (string order), so `c1.10` sorts *before* `c1.2`. Before adding `c1.10`, either zero-pad
> ids (`c1.02`, `c1.10`) or make the sort numeric-aware.

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
