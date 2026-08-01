// Inline SVG figures for the class-imbalance / resampling lesson (c1.11).
// Server-only components with no client JS. Random shapes flow through the
// seeded rng from figure-helpers so builds are reproducible.

import {
  PALETTE,
  figureFrame,
  gauss,
  legendRow,
  linScale,
  polyPath,
  rng,
  xTickLabel,
  yTick,
} from "./figure-helpers";

// ---------------------------------------------------------------------------
// 1. SmoteInterpolation — 2D scatter showing how SMOTE synthesizes points by
//    linear interpolation between a minority point and its k=5 nearest
//    minority neighbours, plus an inset warning that this can leave the
//    minority manifold when the minority class curves in feature space.
// ---------------------------------------------------------------------------
export function SmoteInterpolation({ caption }: { caption?: string }) {
  const W = 640;
  const H = 360;

  // Main scatter panel; leaves room on the right for the inset.
  const plot = { x: 34, y: 24, w: 440, h: 306 };
  const xMin = 0;
  const xMax = 10;
  const yMin = 0;
  const yMax = 8;
  const xToPx = linScale(xMin, xMax, plot.x, plot.x + plot.w);
  const yToPx = linScale(yMin, yMax, plot.y + plot.h, plot.y);

  // Reproducible sample of majority and minority points.
  const r = rng(4711);
  const majority = Array.from({ length: 120 }, () => ({
    x: 5 + gauss(r) * 2.1,
    y: 4 + gauss(r) * 1.5,
  }));
  // Minority — sparse, centred a bit away from the majority mode.
  const minority = Array.from({ length: 15 }, () => ({
    x: 6.6 + gauss(r) * 1.35,
    y: 3.0 + gauss(r) * 1.05,
  }));

  // Highlight one minority point and find its five nearest minority neighbours.
  const highlightIdx = 3;
  const highlighted = minority[highlightIdx]!;
  const kNearest = minority
    .map((p, i) => ({
      i,
      d:
        i === highlightIdx
          ? Number.POSITIVE_INFINITY
          : Math.hypot(p.x - highlighted.x, p.y - highlighted.y),
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 5)
    .map((e) => e.i);

  // Synthetic point along each segment at a reproducible fraction u ∈ (0.25, 0.75).
  const synths = kNearest.map((i) => {
    const p = minority[i]!;
    const u = 0.28 + r() * 0.44;
    return {
      x: highlighted.x + u * (p.x - highlighted.x),
      y: highlighted.y + u * (p.y - highlighted.y),
    };
  });

  // ---- Inset: SMOTE leaves the manifold. Curved (banana) minority. ----
  const inset = { x: 494, y: 30, w: 128, h: 104 };
  const insetInnerX = inset.x + 8;
  const insetInnerTop = inset.y + 26;
  const insetInnerW = inset.w - 16;
  const insetInnerH = inset.h - 34;

  // Banana curve sampled at nBanana positions, with a small radial jitter.
  const rr = rng(9033);
  const nBanana = 22;
  const banana: { x: number; y: number }[] = [];
  for (let i = 0; i < nBanana; i++) {
    const u = 0.06 + (i / (nBanana - 1)) * 0.88;
    const cx = insetInnerX + u * insetInnerW;
    const cy =
      insetInnerTop +
      insetInnerH / 2 +
      Math.sin((u - 0.5) * Math.PI * 2) * insetInnerH * 0.32 +
      (rr() - 0.5) * 3.5;
    banana.push({ x: cx, y: cy });
  }
  // Pick two banana points on opposite sides of the curvature.
  const ptA = banana[Math.floor(nBanana * 0.22)]!;
  const ptB = banana[Math.floor(nBanana * 0.78)]!;
  const midOff = { x: (ptA.x + ptB.x) / 2, y: (ptA.y + ptB.y) / 2 };

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Scatter with one hundred twenty gray majority points and fifteen red minority points. One minority point is highlighted with a black ring; five dashed segments connect it to its nearest minority neighbours, with hollow red circles marking synthesized SMOTE points along each segment. A framed inset in the top-right, titled 'SMOTE can leave the manifold', shows a curved (banana) minority distribution with a synthesized point that falls off the curve.",
    caption,
    children: (
      <>
        {/* Main panel frame. */}
        <rect
          x={plot.x + 0.5}
          y={plot.y + 0.5}
          width={plot.w - 1}
          height={plot.h - 1}
          fill="none"
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.6}
        />

        {/* Majority points. */}
        {majority.map((p, i) => (
          <circle
            key={`maj${i}`}
            cx={xToPx(p.x)}
            cy={yToPx(p.y)}
            r={2.6}
            fill={PALETTE.gray}
            fillOpacity={0.55}
          />
        ))}

        {/* Non-highlighted minority points. */}
        {minority.map((p, i) =>
          i === highlightIdx ? null : (
            <circle
              key={`min${i}`}
              cx={xToPx(p.x)}
              cy={yToPx(p.y)}
              r={4}
              fill={PALETTE.red}
              fillOpacity={0.92}
            />
          ),
        )}

        {/* Dashed segments from the highlighted point to its 5 NN. */}
        {kNearest.map((i) => (
          <line
            key={`seg${i}`}
            x1={xToPx(highlighted.x)}
            y1={yToPx(highlighted.y)}
            x2={xToPx(minority[i]!.x)}
            y2={yToPx(minority[i]!.y)}
            stroke={PALETTE.red}
            strokeWidth={1.1}
            strokeDasharray="4 3"
            opacity={0.65}
          />
        ))}

        {/* Synthetic points along each segment. */}
        {synths.map((p, i) => (
          <circle
            key={`syn${i}`}
            cx={xToPx(p.x)}
            cy={yToPx(p.y)}
            r={4.2}
            fill="none"
            stroke={PALETTE.red}
            strokeWidth={1.6}
          />
        ))}

        {/* Highlighted minority — larger red with a black ring. */}
        <circle
          cx={xToPx(highlighted.x)}
          cy={yToPx(highlighted.y)}
          r={7}
          fill={PALETTE.red}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.7}
        />
        <text
          x={xToPx(highlighted.x) + 11}
          y={yToPx(highlighted.y) + 4}
          className="fill-foreground"
          fontSize={11}
          fontWeight={600}
        >
          xᵢ (minority)
        </text>

        {/* Legend for the main panel. */}
        <g transform={`translate(${plot.x + 10} ${plot.y + plot.h - 60})`}>
          <g>
            <circle cx={7} cy={7} r={3} fill={PALETTE.gray} fillOpacity={0.7} />
            <text
              x={16}
              y={10}
              className="fill-muted-foreground"
              fontSize={10}
            >
              majority
            </text>
          </g>
          <g transform="translate(0 15)">
            <circle cx={7} cy={7} r={4} fill={PALETTE.red} />
            <text
              x={16}
              y={10}
              className="fill-muted-foreground"
              fontSize={10}
            >
              minority
            </text>
          </g>
          <g transform="translate(0 30)">
            <circle
              cx={7}
              cy={7}
              r={4}
              fill="none"
              stroke={PALETTE.red}
              strokeWidth={1.6}
            />
            <text
              x={16}
              y={10}
              className="fill-muted-foreground"
              fontSize={10}
            >
              synthetic (SMOTE)
            </text>
          </g>
        </g>

        {/* Axis titles. */}
        <text
          x={plot.x + plot.w / 2}
          y={H - 6}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          feature x₁
        </text>
        <text
          transform={`translate(14 ${plot.y + plot.h / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          feature x₂
        </text>

        {/* ------------ Inset: SMOTE can leave the manifold ------------ */}
        <rect
          x={inset.x + 0.5}
          y={inset.y + 0.5}
          width={inset.w - 1}
          height={inset.h - 1}
          fill="none"
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.7}
        />
        <text
          x={inset.x + inset.w / 2}
          y={inset.y + 12}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={9}
          fontWeight={600}
        >
          SMOTE can leave
        </text>
        <text
          x={inset.x + inset.w / 2}
          y={inset.y + 22}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={9}
          fontWeight={600}
        >
          the manifold
        </text>

        {/* Banana-shaped minority. */}
        {banana.map((p, i) => (
          <circle
            key={`bp${i}`}
            cx={p.x}
            cy={p.y}
            r={2.2}
            fill={PALETTE.red}
            fillOpacity={0.85}
          />
        ))}

        {/* Chord between the two banana ends and the off-manifold synth. */}
        <line
          x1={ptA.x}
          y1={ptA.y}
          x2={ptB.x}
          y2={ptB.y}
          stroke={PALETTE.red}
          strokeWidth={1}
          strokeDasharray="3 2"
          opacity={0.65}
        />
        <circle
          cx={midOff.x}
          cy={midOff.y}
          r={4}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={1.6}
        />
        <text
          x={midOff.x + 6}
          y={midOff.y - 4}
          className="fill-foreground"
          fontSize={9}
        >
          off-curve
        </text>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 2. SmoteLeakageSplit — two side-by-side flow diagrams contrasting SMOTE
//    applied before vs after the train/val split. The wrong version leaks a
//    single synthetic point into both folds; the right version keeps SMOTE
//    inside the training fold.
// ---------------------------------------------------------------------------
export function SmoteLeakageSplit({ caption }: { caption?: string }) {
  const W = 720;
  const H = 340;

  const panelW = 340;
  const panelH = 296;
  const gap = 24;
  const leftX = 12;
  const rightX = leftX + panelW + gap;
  const panelY = 24;

  // Left / right panel centre x used to place stacked boxes.
  const lcx = leftX + panelW / 2;
  const rcx = rightX + panelW / 2;

  const arrow = "url(#imbal-arrow)";

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two flow diagrams comparing SMOTE order. Left, labelled wrong, shows: Full dataset then SMOTE then Train / Val split, with a synthetic point drawn on the arrow that ends up in both Train and Val boxes. Right, labelled correct, shows: Full dataset then Train / Val split, with SMOTE applied only to the Train branch and Val untouched.",
    caption,
    children: (
      <>
        <defs>
          <marker
            id="imbal-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path
              d="M0,0 L10,5 L0,10 z"
              className="fill-muted-foreground"
            />
          </marker>
        </defs>

        {/* Panel frames. */}
        <rect
          x={leftX + 0.5}
          y={panelY + 0.5}
          width={panelW - 1}
          height={panelH - 1}
          fill={PALETTE.red}
          fillOpacity={0.03}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.7}
        />
        <rect
          x={rightX + 0.5}
          y={panelY + 0.5}
          width={panelW - 1}
          height={panelH - 1}
          fill={PALETTE.green}
          fillOpacity={0.04}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.7}
        />

        {/* ------------------------- LEFT (wrong) ------------------------- */}
        <text
          x={lcx}
          y={panelY + 18}
          textAnchor="middle"
          fill={PALETTE.red}
          fontSize={12}
          fontWeight={700}
        >
          ✕ Wrong: SMOTE before split
        </text>

        {/* Full dataset. */}
        <rect
          x={lcx - 74}
          y={panelY + 32}
          width={148}
          height={30}
          rx={8}
          ry={8}
          fill={PALETTE.blue}
          fillOpacity={0.1}
          stroke={PALETTE.blue}
          strokeWidth={1.3}
        />
        <text
          x={lcx}
          y={panelY + 51}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={11}
          fontWeight={600}
        >
          Full dataset
        </text>

        {/* Arrow to SMOTE. */}
        <line
          x1={lcx}
          y1={panelY + 64}
          x2={lcx}
          y2={panelY + 82}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.4}
          markerEnd={arrow}
        />

        {/* SMOTE. */}
        <rect
          x={lcx - 74}
          y={panelY + 86}
          width={148}
          height={30}
          rx={8}
          ry={8}
          fill={PALETTE.red}
          fillOpacity={0.14}
          stroke={PALETTE.red}
          strokeWidth={1.4}
        />
        <text
          x={lcx}
          y={panelY + 105}
          textAnchor="middle"
          fill={PALETTE.red}
          fontSize={11}
          fontWeight={700}
        >
          SMOTE (whole set)
        </text>

        {/* Arrow to split — synthetic point x' sits on this arrow. */}
        <line
          x1={lcx}
          y1={panelY + 118}
          x2={lcx}
          y2={panelY + 140}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.4}
          markerEnd={arrow}
        />
        <circle
          cx={lcx + 22}
          cy={panelY + 129}
          r={4.5}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={1.6}
        />
        <text
          x={lcx + 30}
          y={panelY + 133}
          fill={PALETTE.red}
          fontSize={10}
        >
          synthetic x'
        </text>

        {/* Split. */}
        <rect
          x={lcx - 84}
          y={panelY + 144}
          width={168}
          height={30}
          rx={8}
          ry={8}
          fill={PALETTE.blue}
          fillOpacity={0.1}
          stroke={PALETTE.blue}
          strokeWidth={1.3}
        />
        <text
          x={lcx}
          y={panelY + 163}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={11}
          fontWeight={600}
        >
          Train / Val split
        </text>

        {/* Two branches down to Train + Val. */}
        <line
          x1={lcx - 40}
          y1={panelY + 176}
          x2={lcx - 60}
          y2={panelY + 208}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.4}
          markerEnd={arrow}
        />
        <line
          x1={lcx + 40}
          y1={panelY + 176}
          x2={lcx + 60}
          y2={panelY + 208}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.4}
          markerEnd={arrow}
        />

        {/* Train box + leaked synth. */}
        <rect
          x={lcx - 122}
          y={panelY + 212}
          width={100}
          height={44}
          rx={8}
          ry={8}
          fill={PALETTE.blue}
          fillOpacity={0.07}
          stroke={PALETTE.blue}
          strokeWidth={1.2}
        />
        <text
          x={lcx - 72}
          y={panelY + 230}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={11}
          fontWeight={600}
        >
          Train
        </text>
        <circle
          cx={lcx - 90}
          cy={panelY + 246}
          r={3.6}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={1.4}
        />
        <text
          x={lcx - 82}
          y={panelY + 249}
          fill={PALETTE.red}
          fontSize={9}
        >
          x'
        </text>

        {/* Val box + leaked synth. */}
        <rect
          x={lcx + 22}
          y={panelY + 212}
          width={100}
          height={44}
          rx={8}
          ry={8}
          fill={PALETTE.blue}
          fillOpacity={0.07}
          stroke={PALETTE.blue}
          strokeWidth={1.2}
        />
        <text
          x={lcx + 72}
          y={panelY + 230}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={11}
          fontWeight={600}
        >
          Val
        </text>
        <circle
          cx={lcx + 54}
          cy={panelY + 246}
          r={3.6}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={1.4}
        />
        <text
          x={lcx + 62}
          y={panelY + 249}
          fill={PALETTE.red}
          fontSize={9}
        >
          x' (leaked!)
        </text>

        <text
          x={lcx}
          y={panelY + 280}
          textAnchor="middle"
          fill={PALETTE.red}
          fontSize={10}
        >
          same synthetic → both folds ⇒ optimistic val score
        </text>

        {/* ------------------------- RIGHT (correct) ------------------------- */}
        <text
          x={rcx}
          y={panelY + 18}
          textAnchor="middle"
          fill={PALETTE.green}
          fontSize={12}
          fontWeight={700}
        >
          ✓ Right: SMOTE inside training fold
        </text>

        <rect
          x={rcx - 74}
          y={panelY + 32}
          width={148}
          height={30}
          rx={8}
          ry={8}
          fill={PALETTE.blue}
          fillOpacity={0.1}
          stroke={PALETTE.blue}
          strokeWidth={1.3}
        />
        <text
          x={rcx}
          y={panelY + 51}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={11}
          fontWeight={600}
        >
          Full dataset
        </text>

        <line
          x1={rcx}
          y1={panelY + 64}
          x2={rcx}
          y2={panelY + 82}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.4}
          markerEnd={arrow}
        />

        <rect
          x={rcx - 84}
          y={panelY + 86}
          width={168}
          height={30}
          rx={8}
          ry={8}
          fill={PALETTE.blue}
          fillOpacity={0.1}
          stroke={PALETTE.blue}
          strokeWidth={1.3}
        />
        <text
          x={rcx}
          y={panelY + 105}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={11}
          fontWeight={600}
        >
          Train / Val split
        </text>

        {/* Two branches to Train + Val. */}
        <line
          x1={rcx - 40}
          y1={panelY + 118}
          x2={rcx - 60}
          y2={panelY + 150}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.4}
          markerEnd={arrow}
        />
        <line
          x1={rcx + 40}
          y1={panelY + 118}
          x2={rcx + 60}
          y2={panelY + 150}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.4}
          markerEnd={arrow}
        />

        {/* Train box. */}
        <rect
          x={rcx - 122}
          y={panelY + 154}
          width={100}
          height={30}
          rx={8}
          ry={8}
          fill={PALETTE.blue}
          fillOpacity={0.1}
          stroke={PALETTE.blue}
          strokeWidth={1.3}
        />
        <text
          x={rcx - 72}
          y={panelY + 173}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={11}
          fontWeight={600}
        >
          Train
        </text>

        {/* Val box (untouched). */}
        <rect
          x={rcx + 22}
          y={panelY + 154}
          width={100}
          height={30}
          rx={8}
          ry={8}
          fill={PALETTE.blue}
          fillOpacity={0.1}
          stroke={PALETTE.blue}
          strokeWidth={1.3}
        />
        <text
          x={rcx + 72}
          y={panelY + 173}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={11}
          fontWeight={600}
        >
          Val
        </text>

        {/* Arrow from Train down to SMOTE-only-on-train. */}
        <line
          x1={rcx - 72}
          y1={panelY + 186}
          x2={rcx - 72}
          y2={panelY + 214}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.4}
          markerEnd={arrow}
        />

        <rect
          x={rcx - 132}
          y={panelY + 218}
          width={120}
          height={30}
          rx={8}
          ry={8}
          fill={PALETTE.green}
          fillOpacity={0.14}
          stroke={PALETTE.green}
          strokeWidth={1.4}
        />
        <text
          x={rcx - 72}
          y={panelY + 237}
          textAnchor="middle"
          fill={PALETTE.green}
          fontSize={11}
          fontWeight={700}
        >
          SMOTE (train only)
        </text>

        {/* Val stays clean — annotation. */}
        <text
          x={rcx + 72}
          y={panelY + 200}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={10}
        >
          (no resampling)
        </text>

        <text
          x={rcx}
          y={panelY + 280}
          textAnchor="middle"
          fill={PALETTE.green}
          fontSize={10}
        >
          Val reflects the true (imbalanced) distribution
        </text>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 3. ThresholdShiftEquivalence — two panels showing that "train on true
//    prevalence + move the threshold right" is equivalent to "train on
//    rebalanced data + use 0.5": the shaded TP / FP counts match, only the
//    implied probabilities differ.
// ---------------------------------------------------------------------------
export function ThresholdShiftEquivalence({ caption }: { caption?: string }) {
  const W = 720;
  const H = 360;

  const panelW = 336;
  const panelH = 268;
  const gap = 24;
  const panelY = 46;
  const leftX = 18;
  const rightX = leftX + panelW + gap;

  const inset = { top: 22, right: 20, bottom: 46, left: 44 };
  const plotW = panelW - inset.left - inset.right;
  const plotH = panelH - inset.top - inset.bottom;

  // Score axis for both panels.
  const sMin = -3;
  const sMax = 5;

  const xL = linScale(sMin, sMax, leftX + inset.left, leftX + inset.left + plotW);
  const yL = linScale(0, 1.05, panelY + inset.top + plotH, panelY + inset.top);
  const xR = linScale(sMin, sMax, rightX + inset.left, rightX + inset.left + plotW);
  const yR = linScale(0, 1.05, panelY + inset.top + plotH, panelY + inset.top);

  // Gaussian pdf helper (unit-max normalised for drawing).
  const pdf = (s: number, mu: number, sigma: number) =>
    Math.exp(-0.5 * ((s - mu) / sigma) ** 2);

  // Sample points along the score axis for both curves.
  const N = 161;
  const ss = Array.from(
    { length: N },
    (_, i) => sMin + ((sMax - sMin) * i) / (N - 1),
  );

  // Left panel: imbalanced. Negative bell towers over positive.
  const negAmpL = 1.0;
  const posAmpL = 0.22;
  const muNeg = 0;
  const muPos = 2;
  const sig = 1;
  const negL = (s: number) => negAmpL * pdf(s, muNeg, sig);
  const posL = (s: number) => posAmpL * pdf(s, muPos, sig);
  const thrL = 1.55; // moved right of the midpoint

  // Right panel: rebalanced. Bells matched in height.
  const balAmp = 0.6;
  const negR = (s: number) => balAmp * pdf(s, muNeg, sig);
  const posR = (s: number) => balAmp * pdf(s, muPos, sig);
  const thrR = 1.0; // midpoint = probability 0.5 after rebalance

  // Build the filled-area paths for right-of-threshold shading.
  function areaPath(
    fn: (s: number) => number,
    thr: number,
    xs: (s: number) => number,
    ys: (v: number) => number,
  ): string {
    const pts = ss.filter((s) => s >= thr);
    if (pts.length === 0) return "";
    const first = pts[0]!;
    const last = pts[pts.length - 1]!;
    const top = pts
      .map(
        (s, i) => `${i === 0 ? "M" : "L"}${xs(s).toFixed(1)},${ys(fn(s)).toFixed(1)}`,
      )
      .join(" ");
    return `${top} L${xs(last).toFixed(1)},${ys(0).toFixed(1)} L${xs(first).toFixed(1)},${ys(0).toFixed(1)} Z`;
  }

  const xTicks = [-2, 0, 2, 4];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two panels of overlapping bell curves. Left: an imbalanced score distribution with a large negative bell and small positive bell, threshold moved right to about 1.55. Right: a rebalanced score distribution with equal-height bells and the threshold at 1.0. In both panels the shaded TP and FP areas are visually comparable, illustrating that the two schemes produce the same classifications on the same test set.",
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

        {/* Panel titles (two lines each). */}
        <text
          x={leftX + panelW / 2}
          y={panelY - 20}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
          fontWeight={600}
        >
          Train on true prevalence
        </text>
        <text
          x={leftX + panelW / 2}
          y={panelY - 6}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
        >
          move the threshold right (t* &gt; 0.5)
        </text>

        <text
          x={rightX + panelW / 2}
          y={panelY - 20}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
          fontWeight={600}
        >
          Train on rebalanced data
        </text>
        <text
          x={rightX + panelW / 2}
          y={panelY - 6}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
        >
          use the default threshold 0.5
        </text>

        {/* X-tick labels for each panel. */}
        {xTicks.map((t, i) =>
          xTickLabel({
            key: `Lx${i}`,
            x: xL(t),
            y: panelY + inset.top + plotH + 14,
            label: `${t}`,
          }),
        )}
        {xTicks.map((t, i) =>
          xTickLabel({
            key: `Rx${i}`,
            x: xR(t),
            y: panelY + inset.top + plotH + 14,
            label: `${t}`,
          }),
        )}

        {/* Baseline axis (y=0) inside each panel. */}
        <line
          x1={leftX + inset.left}
          x2={leftX + inset.left + plotW}
          y1={yL(0)}
          y2={yL(0)}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.6}
        />
        <line
          x1={rightX + inset.left}
          x2={rightX + inset.left + plotW}
          y1={yR(0)}
          y2={yR(0)}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.6}
        />

        {/* ---------- LEFT panel: imbalanced + shifted threshold ---------- */}
        {/* Shaded TP (positive bell, right of threshold). */}
        <path
          d={areaPath(posL, thrL, xL, yL)}
          fill={PALETTE.red}
          fillOpacity={0.35}
        />
        {/* Shaded FP (negative bell, right of threshold). */}
        <path
          d={areaPath(negL, thrL, xL, yL)}
          fill={PALETTE.blue}
          fillOpacity={0.3}
        />
        {/* Negative pdf outline. */}
        <path
          d={polyPath(ss, negL, xL, yL)}
          fill="none"
          stroke={PALETTE.blue}
          strokeWidth={2}
        />
        {/* Positive pdf outline. */}
        <path
          d={polyPath(ss, posL, xL, yL)}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={2}
        />
        {/* Threshold marker. */}
        <line
          x1={xL(thrL)}
          x2={xL(thrL)}
          y1={panelY + inset.top}
          y2={yL(0)}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.4}
          strokeDasharray="5 4"
        />
        <text
          x={xL(thrL) + 4}
          y={panelY + inset.top + 12}
          className="fill-foreground"
          fontSize={10}
          fontWeight={600}
        >
          t* ≈ 1.55
        </text>

        {/* TP / FP labels. */}
        <text
          x={xL(2.4)}
          y={yL(0.11)}
          fill={PALETTE.red}
          fontSize={10}
          fontWeight={600}
        >
          TP
        </text>
        <text
          x={xL(1.85)}
          y={yL(0.05)}
          fill={PALETTE.blue}
          fontSize={10}
          fontWeight={600}
        >
          FP
        </text>

        {/* ---------- RIGHT panel: balanced + default 0.5 threshold ---------- */}
        <path
          d={areaPath(posR, thrR, xR, yR)}
          fill={PALETTE.red}
          fillOpacity={0.35}
        />
        <path
          d={areaPath(negR, thrR, xR, yR)}
          fill={PALETTE.blue}
          fillOpacity={0.3}
        />
        <path
          d={polyPath(ss, negR, xR, yR)}
          fill="none"
          stroke={PALETTE.blue}
          strokeWidth={2}
        />
        <path
          d={polyPath(ss, posR, xR, yR)}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={2}
        />
        <line
          x1={xR(thrR)}
          x2={xR(thrR)}
          y1={panelY + inset.top}
          y2={yR(0)}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.4}
          strokeDasharray="5 4"
        />
        <text
          x={xR(thrR) + 4}
          y={panelY + inset.top + 12}
          className="fill-foreground"
          fontSize={10}
          fontWeight={600}
        >
          t = 0.5
        </text>
        <text
          x={xR(2.15)}
          y={yR(0.31)}
          fill={PALETTE.red}
          fontSize={10}
          fontWeight={600}
        >
          TP
        </text>
        <text
          x={xR(1.4)}
          y={yR(0.17)}
          fill={PALETTE.blue}
          fontSize={10}
          fontWeight={600}
        >
          FP
        </text>

        {/* Axis titles. */}
        <text
          x={leftX + panelW / 2}
          y={panelY + panelH + 12}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          score
        </text>
        <text
          x={rightX + panelW / 2}
          y={panelY + panelH + 12}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          score
        </text>
        <text
          transform={`translate(${leftX + 12} ${panelY + panelH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          density
        </text>
        <text
          transform={`translate(${rightX + 12} ${panelY + panelH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          density
        </text>

        {/* Bottom equivalence caption inside the figure. */}
        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={11}
          fontWeight={600}
        >
          same TP / FP counts on the same test set — different implied probabilities
        </text>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 4. CalibrationHarm — reliability diagram with three curves overlaid:
//    a calibrated baseline (blue) that tracks the diagonal, a post-SMOTE
//    curve (red) that sags below the diagonal in the mid-high range (the
//    model over-predicts the minority class), and a prior-corrected curve
//    (green) that returns to the diagonal.
// ---------------------------------------------------------------------------
export function CalibrationHarm({ caption }: { caption?: string }) {
  const W = 560;
  const H = 340;
  const pad = { top: 24, right: 20, bottom: 46, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  // Bin midpoints on [0, 1].
  const bins = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95];

  // Empirical positive rates for each of the three curves.
  //   calibrated ≈ diagonal (small noise)
  //   post-SMOTE ≈ pushed below the diagonal, especially at high confidences
  //   prior-corrected ≈ back on the diagonal (tiny noise)
  const calibrated =   [0.04, 0.16, 0.27, 0.34, 0.46, 0.55, 0.63, 0.76, 0.86, 0.94];
  const postSmote =    [0.06, 0.13, 0.19, 0.24, 0.31, 0.37, 0.45, 0.55, 0.65, 0.76];
  const priorCorrect = [0.05, 0.14, 0.26, 0.36, 0.44, 0.55, 0.66, 0.74, 0.84, 0.93];

  const xToPx = linScale(0, 1, pad.left, pad.left + plotW);
  const yToPx = linScale(0, 1, pad.top + plotH, pad.top);

  const seriesPath = (vals: number[]) =>
    bins
      .map(
        (x, i) =>
          `${i === 0 ? "M" : "L"}${xToPx(x).toFixed(1)},${yToPx(vals[i]!).toFixed(1)}`,
      )
      .join(" ");

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Reliability diagram. A dashed grey diagonal shows perfect calibration. A blue calibrated-baseline curve tracks the diagonal. A red post-SMOTE curve sits below the diagonal in the mid-to-high confidence range, meaning the model over-predicts the minority class. A green prior-corrected curve is back on the diagonal.",
    caption,
    children: (
      <>
        {/* Y-gridlines and labels. */}
        {ticks.map((v, i) =>
          yTick({
            key: i,
            y: yToPx(v),
            label: v.toFixed(2),
            left: pad.left,
            right: pad.left + plotW,
            labelX: pad.left - 8,
          }),
        )}
        {ticks.map((v, i) =>
          xTickLabel({
            key: i,
            x: xToPx(v),
            y: pad.top + plotH + 16,
            label: v.toFixed(2),
          }),
        )}

        {/* Diagonal reference — perfect calibration. */}
        <line
          x1={xToPx(0)}
          y1={yToPx(0)}
          x2={xToPx(1)}
          y2={yToPx(1)}
          stroke={PALETTE.gray}
          strokeWidth={1.4}
          strokeDasharray="5 4"
        />

        {/* Series paths. */}
        <path
          d={seriesPath(calibrated)}
          fill="none"
          stroke={PALETTE.blue}
          strokeWidth={2.3}
        />
        <path
          d={seriesPath(postSmote)}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={2.3}
        />
        <path
          d={seriesPath(priorCorrect)}
          fill="none"
          stroke={PALETTE.green}
          strokeWidth={2.3}
        />

        {/* Series markers. */}
        {bins.map((x, i) => (
          <g key={`m${i}`}>
            <circle
              cx={xToPx(x)}
              cy={yToPx(calibrated[i]!)}
              r={2.8}
              fill={PALETTE.blue}
            />
            <circle
              cx={xToPx(x)}
              cy={yToPx(postSmote[i]!)}
              r={2.8}
              fill={PALETTE.red}
            />
            <circle
              cx={xToPx(x)}
              cy={yToPx(priorCorrect[i]!)}
              r={2.8}
              fill={PALETTE.green}
            />
          </g>
        ))}

        {/* Directional annotation on the SMOTE gap. */}
        <text
          x={xToPx(0.82)}
          y={yToPx(0.62)}
          textAnchor="middle"
          fill={PALETTE.red}
          fontSize={10}
        >
          over-predicts
        </text>
        <text
          x={xToPx(0.82)}
          y={yToPx(0.56)}
          textAnchor="middle"
          fill={PALETTE.red}
          fontSize={10}
        >
          minority ↓
        </text>

        {/* Axis titles. */}
        <text
          x={pad.left + plotW / 2}
          y={H - 6}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          mean predicted probability (bin)
        </text>
        <text
          transform={`translate(13 ${pad.top + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          empirical positive rate
        </text>

        {/* Legend. */}
        <g transform={`translate(${pad.left + 12} ${pad.top + 8})`}>
          {legendRow({
            key: 0,
            color: PALETTE.blue,
            label: "calibrated baseline",
          })}
          <g transform="translate(0 14)">
            {legendRow({
              key: 1,
              color: PALETTE.red,
              label: "post-SMOTE (over-predicts minority)",
            })}
          </g>
          <g transform="translate(0 28)">
            {legendRow({
              key: 2,
              color: PALETTE.green,
              label: "with prior correction",
            })}
          </g>
          <g transform="translate(0 42)">
            {legendRow({
              key: 3,
              color: PALETTE.gray,
              label: "perfect calibration",
              dashed: true,
            })}
          </g>
        </g>
      </>
    ),
  });
}
