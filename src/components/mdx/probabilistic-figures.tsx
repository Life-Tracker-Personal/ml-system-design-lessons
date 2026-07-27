// Inline SVG figures for the Naive-Bayes / probabilistic-classifiers lesson
// (c1.8). Server-only: no client JS, no charting dependency, no external
// asset requests. All randomness flows through the deterministic rng() from
// figure-helpers so builds are reproducible.

import {
  PALETTE,
  figureFrame,
  legendRow,
  linScale,
  polyPath,
} from "./figure-helpers";

// ---------------------------------------------------------------------------
// 1. GaussianClassConditionals — two Gaussians + log-odds strip below
// ---------------------------------------------------------------------------
export function GaussianClassConditionals({ caption }: { caption?: string }) {
  const W = 560;
  const H = 420;

  // Top plot: densities. Bottom plot: log-odds. Shared x-range.
  const pad = { top: 20, right: 20, bottom: 46, left: 52 };
  const topH = 240;
  const gap = 22;
  const botH = H - pad.top - pad.bottom - topH - gap;
  const plotW = W - pad.left - pad.right;

  const xMin = -4;
  const xMax = 6;
  const xToPx = linScale(xMin, xMax, pad.left, pad.left + plotW);

  // Class conditionals
  const mu0 = -1;
  const mu1 = 2;
  const sigma = 1.2;
  const norm = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const pdf = (mu: number) => (x: number) =>
    norm * Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));

  // Log-odds for equal priors and equal sigma: linear in x, crossing 0 at 0.5.
  const slope = (mu1 - mu0) / (sigma * sigma);
  const cross = (mu0 + mu1) / 2;
  const logOdds = (x: number) => slope * (x - cross);

  // Top-axis y range for densities.
  const yTopMin = 0;
  const yTopMax = 0.4;
  const yTopToPx = (y: number) =>
    pad.top + (1 - (y - yTopMin) / (yTopMax - yTopMin)) * topH;

  // Bottom-axis y range for log-odds.
  const yBotMin = -6;
  const yBotMax = 6;
  const bTop = pad.top + topH + gap;
  const yBotToPx = (y: number) =>
    bTop + (1 - (y - yBotMin) / (yBotMax - yBotMin)) * botH;

  const N = 201;
  const xs = Array.from(
    { length: N },
    (_, i) => xMin + ((xMax - xMin) * i) / (N - 1),
  );

  const p0Path = polyPath(xs, pdf(mu0), xToPx, yTopToPx);
  const p1Path = polyPath(xs, pdf(mu1), xToPx, yTopToPx);

  // Filled area paths: close along the top-panel baseline.
  const baseY = yTopToPx(0);
  const p0Fill = `${p0Path} L${xToPx(xMax).toFixed(1)},${baseY.toFixed(1)} L${xToPx(xMin).toFixed(1)},${baseY.toFixed(1)} Z`;
  const p1Fill = `${p1Path} L${xToPx(xMax).toFixed(1)},${baseY.toFixed(1)} L${xToPx(xMin).toFixed(1)},${baseY.toFixed(1)} Z`;

  // Restrict the log-odds sample range so the linear curve stays inside
  // the yBot window (|log-odds| ≤ 6). Beyond that the line would extend above
  // the bottom-panel top edge and visually collide with the density plot.
  const loXMax = 0.5 + 6 / slope;
  const loXMin = 0.5 - 6 / slope;
  const xsLo = Array.from(
    { length: 101 },
    (_, i) => loXMin + ((loXMax - loXMin) * i) / 100,
  );
  const loPath = polyPath(xsLo, logOdds, xToPx, yBotToPx);

  const xTicks = [-4, -2, 0, 2, 4, 6];
  const yTopTicks = [0, 0.1, 0.2, 0.3];
  const yBotTicks = [-4, -2, 0, 2, 4];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two panels stacked vertically. Top: two overlapping Gaussian bells centred at minus one (blue) and plus two (red) with equal spread, each filled with a light tint. A vertical dashed line at x equals 0.5 marks the crossover where their densities are equal. Bottom: the log-odds curve log p1 over p0, a rising straight line passing through zero at x equals 0.5 and labelled 'linear boundary in x'.",
    caption,
    children: (
      <>
        {/* -------- TOP: class-conditional densities -------- */}
        {yTopTicks.map((v, i) => {
          const y = yTopToPx(v);
          return (
            <g key={`yt${i}`}>
              <line
                x1={pad.left}
                x2={W - pad.right}
                y1={y}
                y2={y}
                className="text-border"
                stroke="currentColor"
                strokeWidth={1}
                opacity={0.45}
              />
              <text
                x={pad.left - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={11}
              >
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* filled bells */}
        <path d={p0Fill} fill={PALETTE.blue} fillOpacity={0.2} />
        <path d={p1Fill} fill={PALETTE.red} fillOpacity={0.2} />
        <path d={p0Path} fill="none" stroke={PALETTE.blue} strokeWidth={2.2} />
        <path d={p1Path} fill="none" stroke={PALETTE.red} strokeWidth={2.2} />

        {/* crossover */}
        <line
          x1={xToPx(cross)}
          x2={xToPx(cross)}
          y1={pad.top}
          y2={pad.top + topH}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeDasharray="4 3"
          opacity={0.85}
        />
        <text
          x={xToPx(cross) + 6}
          y={pad.top + 14}
          className="fill-foreground"
          fontSize={11}
        >
          x* = 0.5
        </text>

        {/* legend for the top plot */}
        <g transform={`translate(${pad.left + 10} ${pad.top + 8})`}>
          {legendRow({ color: PALETTE.blue, label: "p(x | y = 0)", key: 0 })}
          <g transform="translate(0 16)">
            {legendRow({ color: PALETTE.red, label: "p(x | y = 1)", key: 1 })}
          </g>
        </g>

        {/* top-panel y-axis title */}
        <text
          transform={`translate(13 ${pad.top + topH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          density
        </text>

        {/* -------- BOTTOM: log-odds -------- */}
        {yBotTicks.map((v, i) => {
          const y = yBotToPx(v);
          return (
            <g key={`yb${i}`}>
              <line
                x1={pad.left}
                x2={W - pad.right}
                y1={y}
                y2={y}
                className="text-border"
                stroke="currentColor"
                strokeWidth={1}
                opacity={v === 0 ? 0.75 : 0.4}
              />
              <text
                x={pad.left - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={11}
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* crossover on bottom plot */}
        <line
          x1={xToPx(cross)}
          x2={xToPx(cross)}
          y1={bTop}
          y2={bTop + botH}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeDasharray="4 3"
          opacity={0.85}
        />

        {/* log-odds line */}
        <path d={loPath} fill="none" stroke={PALETTE.amber} strokeWidth={2.3} />

        {/* label */}
        <text
          x={xToPx(xMax) - 6}
          y={yBotToPx(4.4)}
          textAnchor="end"
          fill={PALETTE.amber}
          fontSize={11}
        >
          log p(x|1)/p(x|0)  — linear boundary in x
        </text>

        {/* bottom-panel y-axis title */}
        <text
          transform={`translate(13 ${bTop + botH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          log-odds
        </text>

        {/* shared x tick labels + title on the bottom panel */}
        {xTicks.map((t, i) => (
          <text
            key={`xt${i}`}
            x={xToPx(t)}
            y={bTop + botH + 16}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={11}
          >
            {t}
          </text>
        ))}
        <text
          x={pad.left + plotW / 2}
          y={H - 6}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          feature x
        </text>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 2. NgJordanCurves — test-error vs log n for NB vs logistic regression
// ---------------------------------------------------------------------------
export function NgJordanCurves({ caption }: { caption?: string }) {
  const W = 560;
  const H = 340;
  const pad = { top: 24, right: 20, bottom: 46, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const xMin = 1;
  const xMax = 5;
  const yMin = 0;
  const yMax = 0.55;
  const xToPx = linScale(xMin, xMax, pad.left, pad.left + plotW);
  const yToPx = (y: number) =>
    pad.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  // Naive Bayes: sharp early drop, then plateau near its (higher) asymptote.
  // Curve chosen so f(1)=0.40, f(5)=0.15, monotone-decreasing and convex.
  const nb = (x: number) => 0.15 + 0.25 * Math.exp(-1.05 * (x - 1));
  // Logistic regression: slower drop but a lower asymptote.
  // Curve chosen so f(1)=0.50, f(5)=0.08, monotone-decreasing.
  const lr = (x: number) => 0.05 + 0.45 * Math.exp(-0.6 * (x - 1));

  const N = 201;
  const xs = Array.from(
    { length: N },
    (_, i) => xMin + ((xMax - xMin) * i) / (N - 1),
  );
  const nbPath = polyPath(xs, nb, xToPx, yToPx);
  const lrPath = polyPath(xs, lr, xToPx, yToPx);

  // Crossover band: solve nb(x) = lr(x) numerically. We know it's near 3.5.
  let xCross = 3.5;
  for (let i = 0; i < 60; i++) {
    const d = nb(xCross) - lr(xCross);
    // Derivatives.
    const dn = -1.05 * (nb(xCross) - 0.15);
    const dl = -0.6 * (lr(xCross) - 0.05);
    const grad = dn - dl;
    if (Math.abs(grad) < 1e-9) break;
    xCross -= d / grad;
    if (xCross < xMin || xCross > xMax) {
      xCross = 3.5;
      break;
    }
  }
  const bandHalf = 0.3;

  const xTicks = [1, 2, 3, 4, 5];
  const yTicks = [0, 0.1, 0.2, 0.3, 0.4, 0.5];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Test error against log sample size. The naive-Bayes curve starts around 0.40 and drops quickly, then flattens near 0.15. The logistic-regression curve starts higher near 0.50, falls more slowly, and passes below the naive-Bayes curve near log n about 3.5. A shaded vertical band marks that crossover region.",
    caption,
    children: (
      <>
        {/* y grid + labels */}
        {yTicks.map((v, i) => {
          const y = yToPx(v);
          return (
            <g key={`y${i}`}>
              <line
                x1={pad.left}
                x2={W - pad.right}
                y1={y}
                y2={y}
                className="text-border"
                stroke="currentColor"
                strokeWidth={1}
                opacity={0.5}
              />
              <text
                x={pad.left - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={11}
              >
                {v.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* crossover band */}
        <rect
          x={xToPx(xCross - bandHalf)}
          y={pad.top}
          width={xToPx(xCross + bandHalf) - xToPx(xCross - bandHalf)}
          height={plotH}
          fill={PALETTE.amber}
          opacity={0.1}
        />
        <text
          x={xToPx(xCross)}
          y={pad.top + 14}
          textAnchor="middle"
          fill={PALETTE.amber}
          fontSize={11}
        >
          crossover
        </text>

        {/* x tick labels */}
        {xTicks.map((t, i) => (
          <text
            key={`x${i}`}
            x={xToPx(t)}
            y={pad.top + plotH + 16}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={11}
          >
            {t}
          </text>
        ))}

        {/* curves */}
        <path d={nbPath} fill="none" stroke={PALETTE.blue} strokeWidth={2.4} />
        <path d={lrPath} fill="none" stroke={PALETTE.red} strokeWidth={2.4} />

        {/* legend */}
        <g transform={`translate(${W - pad.right - 200} ${pad.top + 8})`}>
          {legendRow({ color: PALETTE.blue, label: "naive Bayes", key: 0 })}
          <g transform="translate(0 16)">
            {legendRow({
              color: PALETTE.red,
              label: "logistic regression",
              key: 1,
            })}
          </g>
        </g>

        {/* axis titles */}
        <text
          x={pad.left + plotW / 2}
          y={H - 8}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          log n  (training-set size, log scale)
        </text>
        <text
          transform={`translate(13 ${pad.top + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          test error
        </text>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 3. NbReliability — S-shape uncalibrated NB vs Platt-recalibrated
// ---------------------------------------------------------------------------
export function NbReliability({ caption }: { caption?: string }) {
  const W = 560;
  const H = 340;
  const pad = { top: 24, right: 24, bottom: 46, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const xToPx = linScale(0, 1, pad.left, pad.left + plotW);
  const yToPx = (y: number) => pad.top + (1 - y) * plotH;

  // Uncalibrated naive Bayes: overconfident in the mid-range so empirical
  // accuracy dips below the diagonal, but pinned at the (0, 0) and (1, 1)
  // corners because NB's high-confidence extremes still track the majority.
  // Closed form y = p − a·sin(π p) with a = 0.3 gives y(0) = 0, y(1) = 1,
  // y(0.5) ≈ 0.20, and is monotone-increasing (dy/dp ≥ 1 − aπ ≈ 0.06 > 0).
  const nb = (p: number) => p - 0.3 * Math.sin(Math.PI * p);

  // Platt-recalibrated: nearly on the diagonal with a tiny sinusoidal wobble.
  const platt = (p: number) => {
    const wobble = 0.02 * Math.sin((p - 0.5) * 6);
    return Math.max(0, Math.min(1, p + wobble));
  };

  const N = 201;
  const ps = Array.from({ length: N }, (_, i) => i / (N - 1));
  const nbPath = polyPath(ps, nb, xToPx, yToPx);
  const plattPath = polyPath(ps, platt, xToPx, yToPx);

  // Diagonal reference.
  const diagPath = `M${xToPx(0)},${yToPx(0)} L${xToPx(1)},${yToPx(1)}`;

  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1];

  // Annotation arrow endpoints spanning both curves at p ≈ 0.5.
  const arrowP = 0.5;
  const arrowY0 = yToPx(nb(arrowP));
  const arrowY1 = yToPx(platt(arrowP));

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Reliability diagram: predicted confidence on the x axis, empirical accuracy on the y axis, with the ideal diagonal dashed. The uncalibrated naive-Bayes curve is an S-shape that dips below the diagonal in the middle and hugs the axes near zero and one. The Platt-recalibrated curve sits nearly on the diagonal. An arrow between them is labelled AUC unchanged.",
    caption,
    children: (
      <>
        {/* grid + y labels */}
        {ticks.map((v, i) => {
          const y = yToPx(v);
          return (
            <g key={`y${i}`}>
              <line
                x1={pad.left}
                x2={W - pad.right}
                y1={y}
                y2={y}
                className="text-border"
                stroke="currentColor"
                strokeWidth={1}
                opacity={0.45}
              />
              <text
                x={pad.left - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={11}
              >
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* x labels */}
        {ticks.map((t, i) => (
          <text
            key={`x${i}`}
            x={xToPx(t)}
            y={pad.top + plotH + 16}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={11}
          >
            {t.toFixed(1)}
          </text>
        ))}

        {/* diagonal */}
        <path
          d={diagPath}
          fill="none"
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.4}
          strokeDasharray="5 4"
          opacity={0.85}
        />

        {/* curves */}
        <path
          d={nbPath}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={2.4}
        />
        <path
          d={plattPath}
          fill="none"
          stroke={PALETTE.blue}
          strokeWidth={2.4}
        />

        {/* AUC-unchanged annotation */}
        <defs>
          <marker
            id="nb-arrow-start"
            viewBox="0 0 10 10"
            refX="1"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M10,0 L0,5 L10,10 z" fill={PALETTE.amber} />
          </marker>
          <marker
            id="nb-arrow-end"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={PALETTE.amber} />
          </marker>
        </defs>
        <line
          x1={xToPx(arrowP)}
          y1={arrowY0}
          x2={xToPx(arrowP)}
          y2={arrowY1}
          stroke={PALETTE.amber}
          strokeWidth={1.6}
          markerStart="url(#nb-arrow-start)"
          markerEnd="url(#nb-arrow-end)"
        />
        <text
          x={xToPx(arrowP) + 8}
          y={(arrowY0 + arrowY1) / 2 + 3.5}
          fill={PALETTE.amber}
          fontSize={11}
        >
          AUC unchanged
        </text>

        {/* legend */}
        <g transform={`translate(${pad.left + 10} ${pad.top + 8})`}>
          {legendRow({
            color: "currentColor",
            label: "ideal (diagonal)",
            dashed: true,
            key: 0,
          })}
          <g transform="translate(0 16)">
            {legendRow({
              color: PALETTE.red,
              label: "naive Bayes (uncalibrated)",
              key: 1,
            })}
          </g>
          <g transform="translate(0 32)">
            {legendRow({
              color: PALETTE.blue,
              label: "Platt-recalibrated",
              key: 2,
            })}
          </g>
        </g>

        {/* axis titles */}
        <text
          x={pad.left + plotW / 2}
          y={H - 8}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          predicted confidence
        </text>
        <text
          transform={`translate(13 ${pad.top + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          empirical accuracy
        </text>
      </>
    ),
  });
}
