// Inline SVG figures for the trees-and-ensembles lesson (c1.5).
// Every figure is a server component: no client JS, no charting dependency,
// no external image requests. All pseudo-random shapes flow through the
// seeded Mulberry32 in figure-helpers.tsx so builds are reproducible.

import {
  axisTitles,
  figureFrame,
  gauss,
  linScale,
  PALETTE,
  polyPath,
  rng,
  xTickLabel,
  yTick,
} from "./figure-helpers";

type LPt = { x: number; y: number; c: 0 | 1 };

// ---------------------------------------------------------------------------
// 1. TreePartition2D — scatter overlaid with axis-aligned rectangles carved
//    by a shallow (depth-3) decision tree. Shows that a tree partitions the
//    input space into a small number of axis-aligned boxes and classifies by
//    the majority label inside each.
// ---------------------------------------------------------------------------
export function TreePartition2D({ caption }: { caption?: string }) {
  const W = 560;
  const H = 340;
  const pad = { top: 18, right: 18, bottom: 42, left: 46 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const xMin = 0;
  const xMax = 1;
  const yMin = 0;
  const yMax = 1;
  const xToPx = linScale(xMin, xMax, pad.left, pad.left + plotW);
  const yToPx = linScale(yMin, yMax, pad.top + plotH, pad.top);

  // Five Gaussian blobs giving an XOR-flavour partition plus a right-side
  // pocket, so the depth-3 tree carves five rectangles from four splits.
  const r = rng(4211);
  const groups: Array<{ cx: number; cy: number; sd: number; c: 0 | 1; n: number }> = [
    { cx: 0.22, cy: 0.28, sd: 0.09, c: 0, n: 18 }, // R1 red (bottom-left)
    { cx: 0.22, cy: 0.72, sd: 0.09, c: 1, n: 18 }, // R2 blue (top-left)
    { cx: 0.62, cy: 0.24, sd: 0.10, c: 1, n: 18 }, // R3 blue (bottom-right)
    { cx: 0.60, cy: 0.72, sd: 0.09, c: 0, n: 15 }, // R4a red (mid top-right)
    { cx: 0.88, cy: 0.72, sd: 0.06, c: 1, n: 12 }, // R4b blue (far top-right)
  ];
  const pts: LPt[] = [];
  for (const g of groups) {
    for (let i = 0; i < g.n; i++) {
      const x = Math.max(0.02, Math.min(0.98, g.cx + gauss(r) * g.sd));
      const y = Math.max(0.02, Math.min(0.98, g.cy + gauss(r) * g.sd));
      pts.push({ x, y, c: g.c });
    }
  }

  // Split thresholds (chosen by hand to line up with the blobs).
  const s1 = 0.42; // root:  x1 ≤ 0.42
  const s2L = 0.5; // left branch: x2 ≤ 0.5
  const s2R = 0.48; // right branch: x2 ≤ 0.48
  const s3R = 0.78; // top-right sub-branch: x1 ≤ 0.78

  const leaves = [
    { x0: 0, x1: s1, y0: 0, y1: s2L, c: 0 as 0 | 1 }, // R1 red
    { x0: 0, x1: s1, y0: s2L, y1: 1, c: 1 as 0 | 1 }, // R2 blue
    { x0: s1, x1: 1, y0: 0, y1: s2R, c: 1 as 0 | 1 }, // R3 blue
    { x0: s1, x1: s3R, y0: s2R, y1: 1, c: 0 as 0 | 1 }, // R4a red
    { x0: s3R, x1: 1, y0: s2R, y1: 1, c: 1 as 0 | 1 }, // R4b blue
  ];

  const axisTicks = [0, 0.5, 1];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two-dimensional scatter of two coloured classes with axis-aligned rectangles carved by a depth-three decision tree; each rectangle is shaded by its majority class and the split lines are drawn dashed.",
    caption,
    children: (
      <>
        {/* leaf shading */}
        {leaves.map((L, i) => (
          <rect
            key={`leaf${i}`}
            x={xToPx(L.x0)}
            y={yToPx(L.y1)}
            width={xToPx(L.x1) - xToPx(L.x0)}
            height={yToPx(L.y0) - yToPx(L.y1)}
            fill={L.c === 0 ? PALETTE.red : PALETTE.blue}
            fillOpacity={0.15}
          />
        ))}

        {/* plot frame */}
        <rect
          x={pad.left}
          y={pad.top}
          width={plotW}
          height={plotH}
          fill="none"
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.6}
        />

        {/* split lines (dashed) */}
        <line
          x1={xToPx(s1)}
          x2={xToPx(s1)}
          y1={pad.top}
          y2={pad.top + plotH}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeDasharray="6 4"
        />
        <line
          x1={pad.left}
          x2={xToPx(s1)}
          y1={yToPx(s2L)}
          y2={yToPx(s2L)}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeDasharray="6 4"
        />
        <line
          x1={xToPx(s1)}
          x2={pad.left + plotW}
          y1={yToPx(s2R)}
          y2={yToPx(s2R)}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeDasharray="4 4"
          opacity={0.7}
        />
        <line
          x1={xToPx(s3R)}
          x2={xToPx(s3R)}
          y1={yToPx(s2R)}
          y2={pad.top}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeDasharray="4 4"
          opacity={0.7}
        />

        {/* points */}
        {pts.map((p, i) => (
          <circle
            key={`p${i}`}
            cx={xToPx(p.x)}
            cy={yToPx(p.y)}
            r={3.4}
            fill={p.c === 0 ? PALETTE.red : PALETTE.blue}
          />
        ))}

        {/* axis tick labels */}
        {axisTicks.map((t, i) =>
          xTickLabel({
            x: xToPx(t),
            y: pad.top + plotH + 16,
            label: String(t),
            key: `x${i}`,
          }),
        )}
        {axisTicks.map((t, i) => (
          <text
            key={`y${i}`}
            x={pad.left - 6}
            y={yToPx(t) + 3.5}
            textAnchor="end"
            className="fill-muted-foreground"
            fontSize={11}
          >
            {t}
          </text>
        ))}

        {/* split annotations */}
        <text
          x={xToPx(s1) + 5}
          y={pad.top + 14}
          className="fill-foreground"
          fontSize={11}
        >
          x₁ ≤ 0.42
        </text>
        <text
          x={xToPx(0.02)}
          y={yToPx(s2L) - 4}
          className="fill-foreground"
          fontSize={11}
        >
          x₂ ≤ 0.5
        </text>

        {axisTitles({
          xLabel: "x₁",
          yLabel: "x₂",
          plotW,
          plotH,
          pad,
          H,
        })}
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 2. DecorrelationVarianceFloor — for the bagged-tree variance formula
//    Var(ȳ) = ρ σ² + (1-ρ)/B · σ², shows how averaging drives variance to a
//    floor of ρ that only decorrelation (RF's random feature subset) can
//    lower.
// ---------------------------------------------------------------------------
export function DecorrelationVarianceFloor({
  caption,
}: {
  caption?: string;
}) {
  const W = 560;
  const H = 340;
  const pad = { top: 18, right: 130, bottom: 46, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const bMin = 1;
  const bMax = 500;
  const logMin = Math.log10(bMin);
  const logMax = Math.log10(bMax);
  const xToPx = (b: number) =>
    pad.left + ((Math.log10(b) - logMin) / (logMax - logMin)) * plotW;
  const yMin = 0;
  const yMax = 1.05;
  const yToPx = (y: number) =>
    pad.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  const rhoValues = [0, 0.2, 0.5, 0.9];
  const rhoColors = [PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.red];
  const rhoLabels = ["ρ = 0", "ρ = 0.2", "ρ = 0.5", "ρ = 0.9"];

  const N = 200;
  const bs = Array.from({ length: N }, (_, i) =>
    Math.pow(10, logMin + ((logMax - logMin) * i) / (N - 1)),
  );

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = [
    { v: 1, label: "1" },
    { v: 5, label: "5" },
    { v: 10, label: "10" },
    { v: 50, label: "50" },
    { v: 100, label: "100" },
    { v: 500, label: "500" },
  ];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Ensemble variance versus number of trees B on a logarithmic axis, drawn for four inter-tree correlation values. Each curve levels off at its own correlation floor rho, so bagging alone cannot get below the ρ line and random forest lowers ρ by decorrelating trees.",
    caption,
    children: (
      <>
        {yTicks.map((v, i) =>
          yTick({
            y: yToPx(v),
            label: v.toFixed(2),
            left: pad.left,
            right: W - pad.right,
            labelX: pad.left - 6,
            key: i,
          }),
        )}

        {xTicks.map((t, i) =>
          xTickLabel({
            x: xToPx(t.v),
            y: pad.top + plotH + 16,
            label: t.label,
            key: i,
          }),
        )}

        {/* floor lines + curves */}
        {rhoValues.map((rho, i) => {
          const f = (b: number) => rho + (1 - rho) / b;
          const path = polyPath(bs, f, xToPx, yToPx);
          return (
            <g key={`rho${i}`}>
              {rho > 0 ? (
                <line
                  x1={pad.left}
                  x2={W - pad.right}
                  y1={yToPx(rho)}
                  y2={yToPx(rho)}
                  stroke={rhoColors[i]}
                  strokeWidth={1}
                  strokeDasharray="2 3"
                  opacity={0.55}
                />
              ) : null}
              <path
                d={path}
                fill="none"
                stroke={rhoColors[i]}
                strokeWidth={2.2}
              />
            </g>
          );
        })}

        {/* near-curve annotations */}
        <text
          x={xToPx(180)}
          y={yToPx(0.96)}
          textAnchor="middle"
          fill={PALETTE.red}
          fontSize={10.5}
        >
          bagged trees (ρ ≈ 0.9)
        </text>
        <text
          x={xToPx(180)}
          y={yToPx(0.29)}
          textAnchor="middle"
          fill={PALETTE.green}
          fontSize={10.5}
        >
          RF (ρ ≈ 0.3)
        </text>

        {axisTitles({
          xLabel: "number of trees B  (log scale)",
          yLabel: "ensemble variance (× single-tree)",
          plotW,
          plotH,
          pad,
          H,
        })}

        {/* legend */}
        <g transform={`translate(${W - pad.right + 10} ${pad.top + 8})`}>
          {rhoValues.map((_, i) => (
            <g key={`leg${i}`} transform={`translate(0 ${i * 16})`}>
              <line
                x1={0}
                x2={22}
                y1={6}
                y2={6}
                stroke={rhoColors[i]}
                strokeWidth={2.2}
              />
              <text
                x={28}
                y={9}
                className="fill-muted-foreground"
                fontSize={11}
              >
                {rhoLabels[i]}
              </text>
            </g>
          ))}
        </g>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 3. RFvsGBDTErrorCurves — canonical picture: RF's train and test both flatten
//    (adding trees can't overfit); GBDT's train keeps falling to zero while
//    its test curve dips and then climbs, motivating early stopping.
// ---------------------------------------------------------------------------
export function RFvsGBDTErrorCurves({ caption }: { caption?: string }) {
  const W = 560;
  const H = 340;
  const pad = { top: 18, right: 138, bottom: 46, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const bMin = 0;
  const bMax = 500;
  const yMin = 0;
  const yMax = 0.65;
  const xToPx = linScale(bMin, bMax, pad.left, pad.left + plotW);
  const yToPx = linScale(yMax, yMin, pad.top, pad.top + plotH);

  const rfTrain = (b: number) => 0.05 + 0.45 * Math.exp(-b / 22);
  const rfTest = (b: number) => 0.15 + 0.4 * Math.exp(-b / 22);
  const gbdtTrain = (b: number) => 0.55 * Math.exp(-b / 55);
  const gbdtMin = 100;
  const gbdtTest = (b: number) => {
    if (b <= gbdtMin) return 0.13 + 0.42 * Math.exp(-b / 22);
    return 0.1345 + 1.41e-6 * (b - gbdtMin) ** 2;
  };

  const N = 300;
  const bs = Array.from(
    { length: N },
    (_, i) => bMin + ((bMax - bMin) * i) / (N - 1),
  );

  const yTicks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
  const xTicks = [0, 100, 200, 300, 400, 500];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Train and test error curves for random forest and gradient-boosted trees as the number of trees grows. RF's two curves both plateau, while GBDT's train error keeps falling to zero and its test error dips then rises, illustrating overfitting and the need for early stopping.",
    caption,
    children: (
      <>
        {yTicks.map((v, i) =>
          yTick({
            y: yToPx(v),
            label: v.toFixed(1),
            left: pad.left,
            right: W - pad.right,
            labelX: pad.left - 6,
            key: i,
          }),
        )}

        {xTicks.map((t, i) =>
          xTickLabel({
            x: xToPx(t),
            y: pad.top + plotH + 16,
            label: String(t),
            key: i,
          }),
        )}

        {/* early-stop marker */}
        <line
          x1={xToPx(gbdtMin)}
          x2={xToPx(gbdtMin)}
          y1={pad.top}
          y2={pad.top + plotH}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.3}
          strokeDasharray="5 4"
          opacity={0.6}
        />
        <text
          x={xToPx(gbdtMin) + 5}
          y={pad.top + 14}
          className="fill-foreground"
          fontSize={11}
        >
          early-stop here
        </text>

        {/* curves */}
        <path
          d={polyPath(bs, rfTrain, xToPx, yToPx)}
          fill="none"
          stroke={PALETTE.blue}
          strokeWidth={2}
          strokeDasharray="5 4"
        />
        <path
          d={polyPath(bs, rfTest, xToPx, yToPx)}
          fill="none"
          stroke={PALETTE.blue}
          strokeWidth={2.3}
        />
        <path
          d={polyPath(bs, gbdtTrain, xToPx, yToPx)}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={2}
          strokeDasharray="5 4"
        />
        <path
          d={polyPath(bs, gbdtTest, xToPx, yToPx)}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={2.3}
        />

        {axisTitles({
          xLabel: "number of trees B",
          yLabel: "error",
          plotW,
          plotH,
          pad,
          H,
        })}

        {/* legend */}
        <g transform={`translate(${W - pad.right + 8} ${pad.top + 8})`}>
          {[
            { label: "RF  train", color: PALETTE.blue, dashed: true },
            { label: "RF  test", color: PALETTE.blue, dashed: false },
            { label: "GBDT  train", color: PALETTE.red, dashed: true },
            { label: "GBDT  test", color: PALETTE.red, dashed: false },
          ].map((row, i) => (
            <g key={`leg${i}`} transform={`translate(0 ${i * 16})`}>
              <line
                x1={0}
                x2={22}
                y1={6}
                y2={6}
                stroke={row.color}
                strokeWidth={2.2}
                strokeDasharray={row.dashed ? "5 4" : undefined}
              />
              <text
                x={28}
                y={9}
                className="fill-muted-foreground"
                fontSize={11}
              >
                {row.label}
              </text>
            </g>
          ))}
        </g>
      </>
    ),
  });
}
