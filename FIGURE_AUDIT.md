# Figure coverage audit

_Scope: all 34 lessons across Chapters 1–10. "Figures" = inline-SVG figure components
(the `fig-*.tsx` / `*-figures.tsx` server components built on `figure-helpers.tsx`);
`<Quiz>` and `<DeepDive>` are excluded._

## Headline

**The figures pass reached Chapter 1 only.** Chapters 1's nine lessons carry 4–8 figures
each. Chapters 2–10 are almost entirely unillustrated — and several of them are the most
visual topics in the course (attention, optimizer dynamics, ACF/PACF, the efficient
frontier). The gap is not in the lessons I was originally adding charts to (those are fully
covered); it is everything from c2 onward.

| | Lessons | Figures | State |
|---|---|---|---|
| **Chapter 1** — foundations | c1.1–c1.9 (9) | 4–8 each (≈53 total) | ✅ richly illustrated |
| **Chapter 2** — neural nets | c2.1–c2.3 (3) | **1 each** | 🟠 thin |
| **Chapter 3** — transformers | c3.1–c3.3 (3) | **0** | 🔴 none |
| **Chapter 4** — agents | c4.1–c4.2 (2) | **0** | 🔴 none |
| **Chapter 5** — RAG | c5.1–c5.2 (2) | **0** | 🔴 none |
| **Chapter 6** — evals | c6.1–c6.3 (3) | **0** | 🔴 none |
| **Chapter 7** — applied stats | c7.1–c7.2 (2) | **0** | 🔴 none |
| **Chapter 8** — time series | c8.1–c8.3 (3) | **0** | 🔴 none |
| **Chapter 9** — estimation | c9.1 (1) | **0** | 🔴 none |
| **Chapter 9** — bias/variance | c9.2–c9.3 (2) | 3–4 each | ✅ (reuses c1 figures) |
| **Chapter 10** — portfolios | c10.1–c10.3 (3) | **0** | 🔴 none |

Roughly **22 of 34 lessons have zero figures.**

## Highest-value gaps (visual-hungry topics with nothing)

Ranked by how much a reader loses without the picture:

1. **c3.1 Attention & the transformer block** — attention-score heatmap, Q/K/V projection
   flow, multi-head split/concat, the full block (residual + norm + FFN). The single most
   diagram-dependent lesson in the course, with none.
2. **c3.3 Inference, serving & cost** — KV-cache growth vs sequence length, prefill-vs-decode
   split, throughput/latency vs batch size, the memory-bandwidth roofline.
3. **c8.2 Autocorrelation, ARIMA & volatility** — ACF/PACF stem plots, volatility-clustering
   time series, an ARIMA fit. These are *the* canonical time-series plots.
4. **c10.1 Mean–variance** — the efficient frontier with the capital-market line is the
   single most iconic diagram in quantitative finance; the lesson has no figure.
5. **c2.2 Training dynamics / c2.3 Making training work** — optimizer trajectories on a loss
   surface, LR-schedule shapes, gradient-norm/vanishing-gradient curves, BatchNorm effect.
   Only `MomentumRavine` / `LossCurveShapes` exist; the topic can carry several more.
6. **c8.1 Stationarity & spurious regression** — a spurious-regression scatter of two
   independent random walks (high R², nonsense) is a one-glance "aha."
7. **c8.3 Statistics of a track record** — equity curve + drawdown, Sharpe sampling
   distribution, the survivorship/multiple-testing illusion.
8. **c10.2 Factor models** — risk decomposition bar/waterfall (systematic vs idiosyncratic).
9. **c6.3 Statistical rigor in evals** — power curves, CI width vs n, the paired-vs-unpaired
   comparison. c6.1/c6.2 are more procedural and can stay lighter.
10. **c9.1 What makes an estimator good** — bias/variance/consistency as sampling-distribution
    pictures (an `EstimatorIsRandom`-style figure already exists in c1.3 and could be reused).

## Lower-priority / defensible-as-is

- **c4.1–c4.2 (agents)**, **c5.1–c5.2 (RAG)**, **c6.1–c6.2 (evals)**, **c7.1 (applied stats)**
  are largely procedural/architectural prose. They would benefit from 1–2 schematic diagrams
  each (agent loop, RAG pipeline, chunking/retrieval flow) but are not *math-visual* the way
  c3/c8/c10 are. Reasonable to do last.
- **c3.2 What changed since the original paper** — comparative; a small table-like figure of
  architecture variants would help but prose can carry it.

## Notes for whoever fills these

- **Use the existing system.** All figures are server components built on
  `src/components/mdx/figure-helpers.tsx` (`figureFrame`, `PALETTE`, `linScale`, `polyPath`,
  `yTick`, `xTickLabel`, `axisTitles`, `legendRow`, plus seeded `rng`/`gauss`). Group new
  figures per chapter/lesson in a `*-figures.tsx` file and register them in `mdx-content.tsx`.
  Do **not** introduce a parallel/zero-dep approach or a charting dependency.
- **Reuse across chapters is already a pattern** — c9.2/c9.3 reuse `BiasVarianceUCurve`,
  `LearningCurveDiag`, `DecorrelationVarianceFloor`, `RFvsGBDTErrorCurves` from Chapter 1.
  `EstimatorIsRandom`, `ShrinkageCurves`, `DoubleDescent` are similarly reusable in c9.1.
- **Accuracy bar applies to figures too** (authoring skill §7): a misleading diagram is worse
  than none. Time-series and finance plots especially must be computed, not hand-faked.

_Chapter 1 needs no figure work. The effort is Chapters 2–10, ~22 lessons, best done chapter
by chapter starting with c3 (transformers) and the quant chapters c8/c10._
