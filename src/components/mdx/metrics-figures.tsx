// Inline SVG figures for the evaluation-metrics lesson (c1.10).
// Server-only components with no client JS and no charting dependency.
// Every shape is derived from a closed form; there is no randomness in this
// file (all three panels are deterministic function plots), so no seeded rng
// is needed.

import {
  PALETTE,
  figureFrame,
  legendRow,
  linScale,
  polyPath,
  xTickLabel,
  yTick,
} from "./figure-helpers";

// Standard-Normal CDF via Abramowitz & Stegun 26.2.17 (~1e-6 accuracy).
// Used by ThresholdSweep to derive precision/recall/cost from a Gaussian
// score model — this keeps the three curves internally consistent, so the
// student sees a self-consistent picture rather than three hand-drawn shapes.
function ncdf(z: number): number {
  const az = Math.abs(z);
  const t = 1 / (1 + 0.2316419 * az);
  const d = 0.3989422804014327 * Math.exp(-0.5 * z * z);
  const p =
    d *
    t *
    (0.319381530 +
      t *
        (-0.356563782 +
          t *
            (1.781477937 +
              t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

// ---------------------------------------------------------------------------
// 1. ConfusionMatrixHeat — 2x2 grid with row / column marginal shading and
//    metric annotations that expose the "row-normalized vs column-normalized"
//    directions used by recall, precision and FPR.
// ---------------------------------------------------------------------------
export function ConfusionMatrixHeat({ caption }: { caption?: string }) {
  const W = 560;
  const H = 340;

  // Grid geometry. Rows = Actual (top = +), Cols = Predicted (left = +).
  const cellW = 100;
  const cellH = 92;
  const gx = 108;
  const gy = 54;
  const matrixW = cellW * 2;
  const matrixH = cellH * 2;

  const cells = [
    { row: 0, col: 0, label: "TP", value: 80 },
    { row: 0, col: 1, label: "FN", value: 20 },
    { row: 1, col: 0, label: "FP", value: 15 },
    { row: 1, col: 1, label: "TN", value: 85 },
  ] as const;

  const cellCX = (col: number) => gx + col * cellW + cellW / 2;
  const cellCY = (row: number) => gy + row * cellH + cellH / 2;

  return figureFrame({
    W,
    H,
    ariaLabel:
      "A two-by-two confusion matrix with actual on the rows and predicted on the columns. Cells: TP eighty top-left, FN twenty top-right, FP fifteen bottom-left, TN eighty-five bottom-right. Column shading highlights the predicted-positive and predicted-negative columns and a red row overlay highlights the actual-positive row, exposing the row- vs column-normalization used by recall, precision and FPR.",
    caption,
    children: (
      <>
        {/* Column shade — left col (predicted +, precision denominator). */}
        <rect
          x={gx}
          y={gy}
          width={cellW}
          height={matrixH}
          fill={PALETTE.blue}
          opacity={0.11}
        />
        {/* Column shade — right col (predicted -), a slightly different tint. */}
        <rect
          x={gx + cellW}
          y={gy}
          width={cellW}
          height={matrixH}
          fill={PALETTE.blue}
          opacity={0.045}
        />
        {/* Row overlay — top row (actual +, recall denominator). */}
        <rect
          x={gx}
          y={gy}
          width={matrixW}
          height={cellH}
          fill={PALETTE.red}
          opacity={0.11}
        />

        {/* Cell borders. */}
        {cells.map((c) => (
          <rect
            key={`b${c.row}${c.col}`}
            x={gx + c.col * cellW}
            y={gy + c.row * cellH}
            width={cellW}
            height={cellH}
            fill="none"
            className="text-border"
            stroke="currentColor"
            strokeWidth={1.4}
          />
        ))}

        {/* Cell labels + counts. */}
        {cells.map((c) => (
          <g key={`c${c.row}${c.col}`}>
            <text
              x={cellCX(c.col)}
              y={cellCY(c.row) - 6}
              textAnchor="middle"
              className="fill-foreground"
              fontSize={13}
              fontWeight={600}
            >
              {c.label}
            </text>
            <text
              x={cellCX(c.col)}
              y={cellCY(c.row) + 18}
              textAnchor="middle"
              className="fill-foreground"
              fontSize={18}
            >
              {c.value}
            </text>
          </g>
        ))}

        {/* Column headers (Predicted). */}
        <text
          x={gx + matrixW / 2}
          y={gy - 30}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
          fontWeight={600}
        >
          Predicted
        </text>
        <text
          x={cellCX(0)}
          y={gy - 10}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
        >
          positive
        </text>
        <text
          x={cellCX(1)}
          y={gy - 10}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
        >
          negative
        </text>

        {/* Row headers (Actual). */}
        <text
          transform={`translate(${gx - 50} ${gy + matrixH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
          fontWeight={600}
        >
          Actual
        </text>
        <text
          x={gx - 8}
          y={cellCY(0) + 4}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={11}
        >
          positive
        </text>
        <text
          x={gx - 8}
          y={cellCY(1) + 4}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={11}
        >
          negative
        </text>

        {/* Right-side metric annotations, colour-keyed to the shading. */}
        <g transform={`translate(${gx + matrixW + 22} ${gy + 4})`}>
          <text
            x={0}
            y={0}
            fill={PALETTE.red}
            fontSize={11}
            fontWeight={600}
          >
            Recall / TPR = TP / (TP + FN)
          </text>
          <text
            x={0}
            y={14}
            className="fill-muted-foreground"
            fontSize={10}
          >
            row-normalized · top row
          </text>

          <text
            x={0}
            y={42}
            fill={PALETTE.blue}
            fontSize={11}
            fontWeight={600}
          >
            Precision = TP / (TP + FP)
          </text>
          <text
            x={0}
            y={56}
            className="fill-muted-foreground"
            fontSize={10}
          >
            column-normalized · left column
          </text>

          <text
            x={0}
            y={84}
            fill={PALETTE.blue}
            fontSize={11}
            fontWeight={600}
          >
            FPR = FP / (FP + TN)
          </text>
          <text
            x={0}
            y={98}
            className="fill-muted-foreground"
            fontSize={10}
          >
            column-normalized · actual− col
          </text>

          <text
            x={0}
            y={130}
            className="fill-muted-foreground"
            fontSize={10}
          >
            Precision = 80 / 95 ≈ 0.842
          </text>
          <text
            x={0}
            y={144}
            className="fill-muted-foreground"
            fontSize={10}
          >
            Recall = 80 / 100 = 0.800
          </text>
          <text
            x={0}
            y={158}
            className="fill-muted-foreground"
            fontSize={10}
          >
            FPR = 15 / 100 = 0.150
          </text>
        </g>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 2. RocPrSideBySide — two panels. Left: ROC for π=0.5 and π=0.01 sit on top
//    of one another (ROC is prevalence-invariant). Right: PR curves diverge
//    — π=0.5 stays high, π=0.01 collapses toward its 0.01 baseline.
// ---------------------------------------------------------------------------
export function RocPrSideBySide({ caption }: { caption?: string }) {
  const W = 720;
  const H = 360;

  const panelW = 330;
  const panelH = 278;
  const gap = 24;
  const panelY = 32;
  const leftX = 18;
  const rightX = leftX + panelW + gap;

  const inset = { top: 16, right: 18, bottom: 40, left: 44 };
  const plotW = panelW - inset.left - inset.right;
  const plotH = panelH - inset.top - inset.bottom;

  // Hand-crafted (FPR, TPR) samples that pass through (0.10, 0.90) — this is
  // the "t = 0.5" annotation anchor used by both PR curves.
  const rocPts: { fpr: number; tpr: number }[] = [
    { fpr: 0.000, tpr: 0.000 },
    { fpr: 0.005, tpr: 0.120 },
    { fpr: 0.015, tpr: 0.320 },
    { fpr: 0.030, tpr: 0.520 },
    { fpr: 0.050, tpr: 0.680 },
    { fpr: 0.075, tpr: 0.820 },
    { fpr: 0.100, tpr: 0.900 },
    { fpr: 0.140, tpr: 0.940 },
    { fpr: 0.200, tpr: 0.965 },
    { fpr: 0.300, tpr: 0.982 },
    { fpr: 0.450, tpr: 0.992 },
    { fpr: 0.650, tpr: 0.997 },
    { fpr: 0.850, tpr: 0.9995 },
    { fpr: 1.000, tpr: 1.000 },
  ];

  // Second ROC (π=0.01) shifted by at most 0.02 in TPR — the point of the
  // panel is that the two curves are visually indistinguishable.
  const rocPts2: { fpr: number; tpr: number }[] = rocPts.map((p) => ({
    fpr: p.fpr,
    tpr: p.tpr > 0.01 && p.tpr < 0.98 ? Math.max(0, p.tpr - 0.02) : p.tpr,
  }));

  // PR is derived from the same ROC + prevalence:
  //   precision = π · TPR / (π · TPR + (1 − π) · FPR)
  //   recall    = TPR
  const prPts = (pi: number) =>
    rocPts
      .filter((p) => p.tpr > 0.005) // avoid the undefined precision at TPR=0
      .map((p) => {
        const num = pi * p.tpr;
        const denom = num + (1 - pi) * p.fpr;
        return { recall: p.tpr, precision: denom > 0 ? num / denom : 1 };
      });

  const pr05 = prPts(0.5);
  const pr01 = prPts(0.01);

  // Pixel scales for each panel.
  const xL = linScale(0, 1, leftX + inset.left, leftX + inset.left + plotW);
  const yL = linScale(0, 1, panelY + inset.top + plotH, panelY + inset.top);
  const xR = linScale(0, 1, rightX + inset.left, rightX + inset.left + plotW);
  const yR = linScale(0, 1, panelY + inset.top + plotH, panelY + inset.top);

  const rocPath = (
    pts: { fpr: number; tpr: number }[],
    xs: (v: number) => number,
    ys: (v: number) => number,
  ) =>
    pts
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${xs(p.fpr).toFixed(1)},${ys(p.tpr).toFixed(1)}`,
      )
      .join(" ");

  const prPath = (
    pts: { recall: number; precision: number }[],
    xs: (v: number) => number,
    ys: (v: number) => number,
  ) =>
    pts
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${xs(p.recall).toFixed(1)},${ys(p.precision).toFixed(1)}`,
      )
      .join(" ");

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two panels. Left: ROC curves for prevalence 0.5 and 0.01 lie on top of one another above a diagonal chance line — ROC is prevalence-invariant. Right: PR curves for the same two prevalences split apart, with the balanced (0.5) curve staying near one and the rare-positive (0.01) curve collapsing near its 0.01 baseline; the t=0.5 operating point sits at precision 0.90 on the first curve and 0.083 on the second.",
    caption,
    children: (
      <>
        {/* Panel frames. */}
        <rect
          x={leftX + 0.5}
          y={panelY + 0.5}
          width={panelW - 1}
          height={panelH - 1}
          fill="none"
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.6}
        />
        <rect
          x={rightX + 0.5}
          y={panelY + 0.5}
          width={panelW - 1}
          height={panelH - 1}
          fill="none"
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.6}
        />

        {/* Panel titles. */}
        <text
          x={leftX + panelW / 2}
          y={panelY - 10}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
          fontWeight={600}
        >
          ROC — prevalence-invariant
        </text>
        <text
          x={rightX + panelW / 2}
          y={panelY - 10}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
          fontWeight={600}
        >
          PR — prevalence-sensitive
        </text>

        {/* Y-gridlines and labels — left panel. */}
        {ticks.map((v, i) =>
          yTick({
            key: `L${i}`,
            y: yL(v),
            label: `${v}`,
            left: leftX + inset.left,
            right: leftX + inset.left + plotW,
            labelX: leftX + inset.left - 6,
          }),
        )}
        {ticks.map((v, i) =>
          xTickLabel({
            key: `Lx${i}`,
            x: xL(v),
            y: panelY + inset.top + plotH + 14,
            label: `${v}`,
          }),
        )}

        {/* Y-gridlines and labels — right panel. */}
        {ticks.map((v, i) =>
          yTick({
            key: `R${i}`,
            y: yR(v),
            label: `${v}`,
            left: rightX + inset.left,
            right: rightX + inset.left + plotW,
            labelX: rightX + inset.left - 6,
          }),
        )}
        {ticks.map((v, i) =>
          xTickLabel({
            key: `Rx${i}`,
            x: xR(v),
            y: panelY + inset.top + plotH + 14,
            label: `${v}`,
          }),
        )}

        {/* ROC — diagonal chance line. */}
        <line
          x1={xL(0)}
          y1={yL(0)}
          x2={xL(1)}
          y2={yL(1)}
          stroke={PALETTE.gray}
          strokeWidth={1.4}
          strokeDasharray="5 4"
        />
        {/* ROC — π=0.5 (blue). */}
        <path
          d={rocPath(rocPts, xL, yL)}
          fill="none"
          stroke={PALETTE.blue}
          strokeWidth={2.4}
        />
        {/* ROC — π=0.01 (amber, dashed). Visually overlapping. */}
        <path
          d={rocPath(rocPts2, xL, yL)}
          fill="none"
          stroke={PALETTE.amber}
          strokeWidth={1.9}
          strokeDasharray="4 3"
          opacity={0.85}
        />
        {/* t=0.5 point marker on ROC. */}
        <circle cx={xL(0.1)} cy={yL(0.9)} r={3.6} fill={PALETTE.blue} />
        <text
          x={xL(0.1) + 8}
          y={yL(0.9) - 6}
          className="fill-foreground"
          fontSize={10}
        >
          t = 0.5
        </text>
        <text
          x={xL(0.62)}
          y={yL(0.72)}
          className="fill-muted-foreground"
          fontSize={11}
        >
          curves overlap
        </text>
        <text
          x={xL(0.62)}
          y={yL(0.66)}
          className="fill-muted-foreground"
          fontSize={11}
        >
          (ROC ignores π)
        </text>

        {/* ROC axis titles. */}
        <text
          x={leftX + panelW / 2}
          y={panelY + panelH + 12}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          FPR
        </text>
        <text
          transform={`translate(${leftX + 12} ${panelY + panelH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          TPR
        </text>

        {/* PR — dashed baselines at each prevalence. */}
        <line
          x1={xR(0)}
          x2={xR(1)}
          y1={yR(0.5)}
          y2={yR(0.5)}
          stroke={PALETTE.blue}
          strokeWidth={1.1}
          strokeDasharray="4 3"
          opacity={0.55}
        />
        <line
          x1={xR(0)}
          x2={xR(1)}
          y1={yR(0.01)}
          y2={yR(0.01)}
          stroke={PALETTE.amber}
          strokeWidth={1.1}
          strokeDasharray="4 3"
          opacity={0.75}
        />
        <text
          x={xR(1) - 4}
          y={yR(0.5) - 4}
          textAnchor="end"
          fill={PALETTE.blue}
          fontSize={9}
        >
          baseline π=0.5
        </text>
        <text
          x={xR(1) - 4}
          y={yR(0.01) - 4}
          textAnchor="end"
          fill={PALETTE.amber}
          fontSize={9}
        >
          baseline π=0.01
        </text>

        {/* PR — π=0.5 curve. */}
        <path
          d={prPath(pr05, xR, yR)}
          fill="none"
          stroke={PALETTE.blue}
          strokeWidth={2.4}
        />
        {/* PR — π=0.01 curve. */}
        <path
          d={prPath(pr01, xR, yR)}
          fill="none"
          stroke={PALETTE.amber}
          strokeWidth={2.4}
        />

        {/* t=0.5 point on π=0.5 PR at (recall=0.9, precision=0.9). */}
        <circle cx={xR(0.9)} cy={yR(0.9)} r={3.6} fill={PALETTE.blue} />
        <text
          x={xR(0.9) - 6}
          y={yR(0.9) - 8}
          textAnchor="end"
          fill={PALETTE.blue}
          fontSize={10}
        >
          t=0.5: precision=0.90
        </text>
        {/* t=0.5 point on π=0.01 PR at (recall=0.9, precision=0.083). */}
        <circle cx={xR(0.9)} cy={yR(0.083)} r={3.6} fill={PALETTE.amber} />
        <text
          x={xR(0.9) - 6}
          y={yR(0.083) - 8}
          textAnchor="end"
          fill={PALETTE.amber}
          fontSize={10}
        >
          t=0.5: precision=0.083
        </text>

        {/* PR axis titles. */}
        <text
          x={rightX + panelW / 2}
          y={panelY + panelH + 12}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          Recall
        </text>
        <text
          transform={`translate(${rightX + 12} ${panelY + panelH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          Precision
        </text>

        {/* Legend along the bottom. */}
        <g transform={`translate(${W / 2 - 190} ${H - 16})`}>
          {legendRow({
            key: 0,
            color: PALETTE.blue,
            label: "π = 0.5 (balanced)",
          })}
          <g transform="translate(150 0)">
            {legendRow({
              key: 1,
              color: PALETTE.amber,
              label: "π = 0.01 (rare positive)",
            })}
          </g>
          <g transform="translate(310 0)">
            {legendRow({
              key: 2,
              color: PALETTE.gray,
              label: "chance / baseline",
              dashed: true,
            })}
          </g>
        </g>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 3. ThresholdSweep — precision, recall and expected cost as a function of
//    threshold t. Cost lives on a secondary y-axis. Two vertical dashed
//    marks show the cost-optimal t* (min cost) and the Youden's-J t (max
//    TPR − FPR).
// ---------------------------------------------------------------------------
export function ThresholdSweep({ caption }: { caption?: string }) {
  const W = 640;
  const H = 340;
  const pad = { top: 40, right: 68, bottom: 46, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  // Score model — positive class ~ N(1, 0.5), negative ~ N(0, 0.5),
  // prevalence 0.3, FN 3.5x costlier than FP. With these constants the
  // Bayes-optimal threshold lands at t* ≈ 0.40 and Youden's J at 0.50.
  const mu1 = 1;
  const mu0 = 0;
  const sigma = 0.5;
  const pi = 0.3;
  const cFN = 3.5;
  const cFP = 1;

  const recallOf = (t: number) => 1 - ncdf((t - mu1) / sigma);
  const fprOf = (t: number) => 1 - ncdf((t - mu0) / sigma);
  const precisionOf = (t: number) => {
    const tp = pi * recallOf(t);
    const fp = (1 - pi) * fprOf(t);
    return tp + fp > 0 ? tp / (tp + fp) : 1;
  };
  const costOf = (t: number) =>
    cFN * pi * (1 - recallOf(t)) + cFP * (1 - pi) * fprOf(t);

  // Dense sampling for smooth curves and for locating t* / t_J.
  const N = 241;
  const ts = Array.from({ length: N }, (_, i) => i / (N - 1));

  let tStar = 0;
  let tJ = 0;
  let bestCost = Number.POSITIVE_INFINITY;
  let bestJ = -Number.POSITIVE_INFINITY;
  let costMax = 0;
  for (const t of ts) {
    const c = costOf(t);
    if (c < bestCost) {
      bestCost = c;
      tStar = t;
    }
    if (c > costMax) costMax = c;
    const j = recallOf(t) - fprOf(t);
    if (j > bestJ) {
      bestJ = j;
      tJ = t;
    }
  }

  const xToPx = linScale(0, 1, pad.left, pad.left + plotW);
  const yToPx = linScale(0, 1, pad.top + plotH, pad.top);
  const yToPxCost = linScale(0, costMax * 1.05, pad.top + plotH, pad.top);

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = [0, 0.25, 0.5, 0.75, 1];
  const costTickFracs = [0, 0.25, 0.5, 0.75, 1];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Threshold-sweep chart. As threshold t moves from zero to one, precision rises and recall falls; an expected-cost curve on a secondary axis is U-shaped with its minimum near t=0.4. Two vertical dashed lines mark the cost-optimal threshold t-star and the Youden's-J threshold t-J.",
    caption,
    children: (
      <>
        {/* Y-gridlines + primary tick labels. */}
        {yTicks.map((v, i) =>
          yTick({
            key: i,
            y: yToPx(v),
            label: `${v}`,
            left: pad.left,
            right: pad.left + plotW,
            labelX: pad.left - 8,
          }),
        )}

        {/* X-tick labels. */}
        {xTicks.map((t, i) =>
          xTickLabel({
            key: i,
            x: xToPx(t),
            y: pad.top + plotH + 16,
            label: `${t}`,
          }),
        )}

        {/* Secondary cost-axis tick labels (right). */}
        {costTickFracs.map((frac, i) => {
          const c = frac * costMax * 1.05;
          return (
            <text
              key={`ct${i}`}
              x={pad.left + plotW + 8}
              y={yToPxCost(c) + 3.5}
              textAnchor="start"
              fill={PALETTE.amber}
              fontSize={10}
            >
              {c.toFixed(2)}
            </text>
          );
        })}

        {/* Cost-optimal t*. */}
        <line
          x1={xToPx(tStar)}
          x2={xToPx(tStar)}
          y1={pad.top}
          y2={pad.top + plotH}
          stroke={PALETTE.amber}
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />
        <text
          x={xToPx(tStar)}
          y={pad.top - 20}
          textAnchor="middle"
          fill={PALETTE.amber}
          fontSize={11}
          fontWeight={600}
        >
          cost-optimal t*
        </text>
        <text
          x={xToPx(tStar)}
          y={pad.top - 8}
          textAnchor="middle"
          fill={PALETTE.amber}
          fontSize={10}
        >
          t* ≈ {tStar.toFixed(2)}
        </text>

        {/* Youden's J. */}
        <line
          x1={xToPx(tJ)}
          x2={xToPx(tJ)}
          y1={pad.top}
          y2={pad.top + plotH}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.4}
          strokeDasharray="4 4"
          opacity={0.85}
        />
        <text
          x={xToPx(tJ)}
          y={pad.top - 20}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
          fontWeight={600}
        >
          Youden's J
        </text>
        <text
          x={xToPx(tJ)}
          y={pad.top - 8}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={10}
        >
          t_J = {tJ.toFixed(2)}
        </text>

        {/* Precision curve. */}
        <path
          d={polyPath(ts, precisionOf, xToPx, yToPx)}
          fill="none"
          stroke={PALETTE.blue}
          strokeWidth={2.3}
        />
        {/* Recall curve. */}
        <path
          d={polyPath(ts, recallOf, xToPx, yToPx)}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={2.3}
        />
        {/* Cost curve (secondary axis). */}
        <path
          d={polyPath(ts, costOf, xToPx, yToPxCost)}
          fill="none"
          stroke={PALETTE.amber}
          strokeWidth={2.3}
        />

        {/* Axis titles. */}
        <text
          x={pad.left + plotW / 2}
          y={H - 6}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          threshold t
        </text>
        <text
          transform={`translate(13 ${pad.top + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          precision / recall
        </text>
        <text
          transform={`translate(${W - 14} ${pad.top + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          fill={PALETTE.amber}
          fontSize={12}
        >
          expected cost
        </text>

        {/* Legend. */}
        <g transform={`translate(${pad.left + 8} ${pad.top + 10})`}>
          {legendRow({
            key: 0,
            color: PALETTE.blue,
            label: "precision",
          })}
          <g transform="translate(0 14)">
            {legendRow({
              key: 1,
              color: PALETTE.red,
              label: "recall",
            })}
          </g>
          <g transform="translate(0 28)">
            {legendRow({
              key: 2,
              color: PALETTE.amber,
              label: `expected cost  (c_FN=${cFN}, c_FP=${cFP})`,
            })}
          </g>
        </g>
      </>
    ),
  });
}
