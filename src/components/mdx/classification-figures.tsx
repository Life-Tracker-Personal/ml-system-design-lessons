// Inline SVG figures for the classification-losses lesson (c1.3), reused
// across the calibration and rare-event lessons (c1.8, c1.10, c1.11).
// Every figure is a server component with no client JS: shapes are closed
// form or come from a deterministic Mulberry32 rng in figure-helpers.

import {
  PALETTE,
  axisTitles,
  figureFrame,
  legendRow,
  linScale,
  polyPath,
  rng,
  xTickLabel,
  yTick,
} from "./figure-helpers";

// ---------------------------------------------------------------------------
// 1. ClassificationLossCurves — the canonical margin-vs-loss picture that
//    explains why hinge/logistic are convex surrogates for 0-1 and why the
//    sigmoid-plus-MSE combo goes flat on very confidently-wrong predictions.
// ---------------------------------------------------------------------------
export function ClassificationLossCurves({ caption }: { caption?: string }) {
  const W = 560;
  const H = 340;
  const pad = { top: 18, right: 18, bottom: 46, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const mMin = -3;
  const mMax = 3;
  const lMin = 0;
  const lMax = 5;
  const xToPx = linScale(mMin, mMax, pad.left, pad.left + plotW);
  const yToPx = linScale(lMin, lMax, pad.top + plotH, pad.top);

  // Sample the curves densely so hinge/logistic look smooth on curved regions.
  const N = 301;
  const ms = Array.from(
    { length: N },
    (_, i) => mMin + ((mMax - mMin) * i) / (N - 1),
  );

  // Numerically safe logistic loss for large |m|.
  const hinge = (m: number) => Math.max(0, 1 - m);
  const logistic = (m: number) => {
    if (m > 30) return 0;
    if (m < -30) return -m;
    return Math.log(1 + Math.exp(-m));
  };
  const sigmoid = (m: number) => 1 / (1 + Math.exp(-m));
  const sigMse = (m: number) => (sigmoid(m) - 1) ** 2;

  // Clip so runaway values don't extend past the plot in the far-left tail.
  const clip = (y: number) => Math.min(y, lMax + 0.05);

  const hingePath = polyPath(ms, (m) => clip(hinge(m)), xToPx, yToPx);
  const logisticPath = polyPath(ms, (m) => clip(logistic(m)), xToPx, yToPx);
  const sigMsePath = polyPath(ms, sigMse, xToPx, yToPx);
  // 0-1 step: 1 for m<0, 0 for m≥0 — draw as two horizontal segments + jump.
  const stepPath =
    `M${xToPx(mMin).toFixed(1)},${yToPx(1).toFixed(1)} ` +
    `L${xToPx(0).toFixed(1)},${yToPx(1).toFixed(1)} ` +
    `L${xToPx(0).toFixed(1)},${yToPx(0).toFixed(1)} ` +
    `L${xToPx(mMax).toFixed(1)},${yToPx(0).toFixed(1)}`;

  const xTicks = [-3, -2, -1, 0, 1, 2, 3];
  const yTicks = [0, 1, 2, 3, 4, 5];

  const legend: {
    color: string;
    label: string;
    dashed?: boolean;
  }[] = [
    { color: PALETTE.gray, label: "0-1 (step)" },
    { color: PALETTE.red, label: "hinge  max(0, 1 − m)" },
    { color: PALETTE.blue, label: "logistic  log(1 + e⁻ᵐ)" },
    { color: PALETTE.amber, label: "sigmoid + MSE", dashed: true },
  ];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Loss as a function of margin m = y · f(x) on the interval negative three to three. The 0-1 step drops from one to zero at m equals zero. Hinge is piecewise linear, hitting zero at m equals one. Logistic is a smooth convex curve above hinge for negative m. Sigmoid-plus-MSE flattens near zero on both extremes.",
    caption,
    children: (
      <>
        {yTicks.map((v, i) =>
          yTick({
            y: yToPx(v),
            label: `${v}`,
            left: pad.left,
            right: W - pad.right,
            labelX: pad.left - 8,
            key: i,
          }),
        )}
        {xTicks.map((v, i) =>
          xTickLabel({
            x: xToPx(v),
            y: pad.top + plotH + 16,
            label: `${v}`,
            key: i,
          }),
        )}

        {/* m = 0 divider */}
        <line
          x1={xToPx(0)}
          x2={xToPx(0)}
          y1={pad.top}
          y2={pad.top + plotH}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={0.8}
          strokeDasharray="3 3"
          opacity={0.45}
        />

        {/* curves */}
        <path d={stepPath} fill="none" stroke={PALETTE.gray} strokeWidth={2} />
        <path
          d={hingePath}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={2.2}
        />
        <path
          d={logisticPath}
          fill="none"
          stroke={PALETTE.blue}
          strokeWidth={2.2}
        />
        <path
          d={sigMsePath}
          fill="none"
          stroke={PALETTE.amber}
          strokeWidth={2.2}
          strokeDasharray="6 4"
        />

        {axisTitles({
          xLabel: "margin  m = y · f(x)",
          yLabel: "loss",
          plotW,
          plotH,
          pad,
          H,
        })}

        {/* legend */}
        <g
          transform={`translate(${W - pad.right - 190} ${pad.top + 8})`}
        >
          {legend.map((row, i) => (
            <g key={`row${i}`} transform={`translate(0 ${i * 16})`}>
              {legendRow({ ...row, key: i })}
            </g>
          ))}
        </g>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 2. FocalDownweighting — cross-entropy vs focal loss for γ ∈ {0, 1, 2, 5}.
//    Shows how the (1 − p_t)^γ prefactor collapses the loss on easy examples
//    while leaving hard examples nearly untouched.
// ---------------------------------------------------------------------------
export function FocalDownweighting({ caption }: { caption?: string }) {
  const W = 560;
  const H = 340;
  const pad = { top: 18, right: 18, bottom: 46, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const xToPx = linScale(0, 1, pad.left, pad.left + plotW);
  const yToPx = linScale(0, 5, pad.top + plotH, pad.top);

  // Sample p_t on (eps, 1] so -log(p_t) stays finite at the left edge.
  const N = 401;
  const eps = 0.005;
  const ps = Array.from(
    { length: N },
    (_, i) => eps + ((1 - eps) * i) / (N - 1),
  );

  const focal = (gamma: number) => (p: number) =>
    -Math.pow(1 - p, gamma) * Math.log(p);
  // γ = 0 collapses to standard cross-entropy: -log(p_t).

  type Series = { gamma: number; color: string; label: string };
  const seriesList: Series[] = [
    { gamma: 0, color: PALETTE.gray, label: "γ = 0 (cross-entropy)" },
    { gamma: 1, color: PALETTE.blue, label: "γ = 1" },
    { gamma: 2, color: PALETTE.red, label: "γ = 2" },
    { gamma: 5, color: PALETTE.purple, label: "γ = 5" },
  ];

  const clip = (y: number) => Math.min(y, 5.05);
  const paths = seriesList.map((s) =>
    polyPath(ps, (p) => clip(focal(s.gamma)(p)), xToPx, yToPx),
  );

  // Markers on the γ = 2 curve — the classic "easy example" downweight points.
  const markers = [
    { p: 0.9, l: 0.01, dy: -10 },
    { p: 0.968, l: 0.001, dy: 18 },
  ];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Loss versus predicted probability p_t for cross-entropy and focal loss with gamma one, two, and five. All curves diverge as p_t approaches zero. As gamma grows, the curves fall away from cross-entropy on the easy-example side p_t near one.",
    caption,
    children: (
      <>
        {[0, 1, 2, 3, 4, 5].map((v, i) =>
          yTick({
            y: yToPx(v),
            label: `${v}`,
            left: pad.left,
            right: W - pad.right,
            labelX: pad.left - 8,
            key: i,
          }),
        )}
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) =>
          xTickLabel({
            x: xToPx(v),
            y: pad.top + plotH + 16,
            label: `${v}`,
            key: i,
          }),
        )}

        {/* curves */}
        {paths.map((d, i) => (
          <path
            key={`f${i}`}
            d={d}
            fill="none"
            stroke={seriesList[i].color}
            strokeWidth={2.2}
          />
        ))}

        {/* γ = 2 marker points + coordinate labels */}
        {markers.map((m, i) => (
          <g key={`mk${i}`}>
            <circle
              cx={xToPx(m.p)}
              cy={yToPx(m.l)}
              r={3.6}
              fill={PALETTE.red}
              stroke="#ffffff"
              strokeWidth={1}
            />
            <text
              x={xToPx(m.p) + 8}
              y={yToPx(m.l) + m.dy}
              fill={PALETTE.red}
              fontSize={10.5}
              fontWeight={600}
            >
              ({m.p}, {m.l})
            </text>
          </g>
        ))}

        {axisTitles({
          xLabel: "p_t  (predicted prob. of true class)",
          yLabel: "loss",
          plotW,
          plotH,
          pad,
          H,
        })}

        {/* legend */}
        <g
          transform={`translate(${W - pad.right - 180} ${pad.top + 8})`}
        >
          {seriesList.map((row, i) => (
            <g key={`ls${i}`} transform={`translate(0 ${i * 16})`}>
              {legendRow({
                color: row.color,
                label: row.label,
                key: i,
              })}
            </g>
          ))}
        </g>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 3. ReliabilityDiagram — predicted confidence (binned) vs empirical accuracy.
//    Overconfident model sags below the diagonal on the right; temperature
//    scaling pulls the curve back onto it.
// ---------------------------------------------------------------------------
export function ReliabilityDiagram({
  caption,
  showRecalibrated = true,
}: {
  caption?: string;
  showRecalibrated?: boolean;
}) {
  const W = 560;
  const H = 340;
  const pad = { top: 18, right: 18, bottom: 46, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const xToPx = linScale(0, 1, pad.left, pad.left + plotW);
  const yToPx = linScale(0, 1, pad.top + plotH, pad.top);

  // Ten confidence bins centred at 0.05, 0.15, …, 0.95.
  const bins = Array.from({ length: 10 }, (_, i) => 0.05 + i * 0.1);

  // Overconfident calibration curve: pinned near 0.5 at low bins (the model
  // isn't really telling us anything different from base rate there), then
  // rises but stays under the diagonal at high bins (its confident
  // predictions aren't as accurate as it claims).
  const overconf = [0.5, 0.51, 0.52, 0.53, 0.55, 0.58, 0.62, 0.68, 0.74, 0.8];

  // Recalibrated curve: temperature scaling pulls the empirical accuracy back
  // onto the diagonal, with a tiny wiggle so it doesn't look synthetic.
  const rr = rng(4711);
  const recal = bins.map((p) => {
    const jitter = (rr() - 0.5) * 0.03;
    return Math.max(0.02, Math.min(0.98, p + jitter));
  });

  const buildPath = (ys: number[]) =>
    bins
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${xToPx(p).toFixed(1)},${yToPx(ys[i]).toFixed(1)}`,
      )
      .join(" ");

  const overconfPath = buildPath(overconf);
  const recalPath = buildPath(recal);

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const legend: { color: string; label: string; dashed?: boolean }[] = [
    { color: PALETTE.gray, label: "perfect calibration", dashed: true },
    { color: PALETTE.red, label: "overconfident model" },
    ...(showRecalibrated
      ? [{ color: PALETTE.blue, label: "temperature-scaled" }]
      : []),
  ];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Reliability diagram with a dashed diagonal reference. The overconfident curve is pinned near 0.5 at low predicted-confidence bins and sags below the diagonal at high bins. When shown, the temperature-scaled curve tracks the diagonal closely.",
    caption,
    children: (
      <>
        {ticks.map((v, i) =>
          yTick({
            y: yToPx(v),
            label: `${v}`,
            left: pad.left,
            right: W - pad.right,
            labelX: pad.left - 8,
            key: i,
          }),
        )}
        {ticks.map((v, i) =>
          xTickLabel({
            x: xToPx(v),
            y: pad.top + plotH + 16,
            label: `${v}`,
            key: i,
          }),
        )}

        {/* diagonal reference: perfect calibration */}
        <line
          x1={xToPx(0)}
          x2={xToPx(1)}
          y1={yToPx(0)}
          y2={yToPx(1)}
          stroke={PALETTE.gray}
          strokeWidth={1.6}
          strokeDasharray="5 4"
          opacity={0.75}
        />

        {/* overconfident curve */}
        <path
          d={overconfPath}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={2.2}
        />
        {bins.map((p, i) => (
          <circle
            key={`op${i}`}
            cx={xToPx(p)}
            cy={yToPx(overconf[i])}
            r={3.4}
            fill={PALETTE.red}
          />
        ))}

        {/* recalibrated curve */}
        {showRecalibrated && (
          <>
            <path
              d={recalPath}
              fill="none"
              stroke={PALETTE.blue}
              strokeWidth={2.2}
            />
            {bins.map((p, i) => (
              <circle
                key={`rp${i}`}
                cx={xToPx(p)}
                cy={yToPx(recal[i])}
                r={3.4}
                fill={PALETTE.blue}
              />
            ))}
          </>
        )}

        {axisTitles({
          xLabel: "predicted confidence  (bin)",
          yLabel: "empirical accuracy",
          plotW,
          plotH,
          pad,
          H,
        })}

        {/* legend — top-left so it doesn't collide with the sagging curve */}
        <g transform={`translate(${pad.left + 14} ${pad.top + 8})`}>
          {legend.map((row, i) => (
            <g key={`lg${i}`} transform={`translate(0 ${i * 16})`}>
              {legendRow({ ...row, key: i })}
            </g>
          ))}
        </g>
      </>
    ),
  });
}
