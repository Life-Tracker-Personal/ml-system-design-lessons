// Inline SVG figures for the model-selection & validation lesson (c1.9).
// Server-only: no client JS, no charting dependency, no external assets.
// Shapes are computed from closed forms so builds are reproducible; no
// pseudo-randomness is required for these four figures.

import {
  PALETTE,
  axisTitles,
  figureFrame,
  legendRow,
  linScale,
  polyPath,
  xTickLabel,
  yTick,
} from "./figure-helpers";

// ---------------------------------------------------------------------------
// 1. BiasVarianceUCurve — bias², variance, and their sum + noise floor
// ---------------------------------------------------------------------------
export function BiasVarianceUCurve({ caption }: { caption?: string }) {
  const W = 560;
  const H = 340;
  const pad = { top: 22, right: 20, bottom: 46, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const xMin = 0;
  const xMax = 10;
  const yMin = 0;
  const yMax = 3;
  const xToPx = linScale(xMin, xMax, pad.left, pad.left + plotW);
  const yToPx = linScale(yMin, yMax, pad.top + plotH, pad.top);

  // Analytic decomposition: bias² decays exponentially with complexity,
  // variance grows exponentially, and a constant floor represents σ².
  const noise = 0.3;
  const bias2 = (x: number) => 2.4 * Math.exp(-0.55 * x) + 0.1;
  const variance = (x: number) => 0.1 * Math.exp(0.32 * x);
  const total = (x: number) => bias2(x) + variance(x) + noise;

  const N = 401;
  const xs = Array.from(
    { length: N },
    (_, i) => xMin + ((xMax - xMin) * i) / (N - 1),
  );

  // Locate the total-error minimum for the sweet-spot vertical.
  let minX = xs[0];
  let minY = total(xs[0]);
  for (const x of xs) {
    const y = total(x);
    if (y < minY) {
      minY = y;
      minX = x;
    }
  }

  const xTicks = [0, 2, 4, 6, 8, 10];
  const yTicks = [0, 1, 2, 3];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Bias-variance decomposition. A decreasing blue bias-squared curve, an increasing red variance curve, and their sum plus a horizontal irreducible-noise floor forming an amber U-shaped total-error curve with a marked sweet-spot minimum.",
    caption,
    children: (
      <>
        {yTicks.map((v, i) =>
          yTick({
            y: yToPx(v),
            label: v.toFixed(0),
            left: pad.left,
            right: W - pad.right,
            labelX: pad.left - 8,
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

        {/* irreducible-noise floor */}
        <line
          x1={pad.left}
          x2={W - pad.right}
          y1={yToPx(noise)}
          y2={yToPx(noise)}
          stroke={PALETTE.gray}
          strokeWidth={1.2}
          strokeDasharray="5 4"
          opacity={0.85}
        />
        <text
          x={W - pad.right - 6}
          y={yToPx(noise) - 6}
          textAnchor="end"
          fill={PALETTE.gray}
          fontSize={11}
        >
          irreducible noise σ² = 0.3
        </text>

        {/* sweet-spot vertical at the total-error minimum */}
        <line
          x1={xToPx(minX)}
          x2={xToPx(minX)}
          y1={pad.top}
          y2={pad.top + plotH}
          stroke={PALETTE.amber}
          strokeWidth={1.2}
          strokeDasharray="4 4"
          opacity={0.75}
        />
        <text
          x={xToPx(minX) + 6}
          y={pad.top + 12}
          fill={PALETTE.amber}
          fontSize={11}
        >
          sweet spot
        </text>

        {/* series curves: bias², variance, total */}
        <path
          d={polyPath(xs, bias2, xToPx, yToPx)}
          fill="none"
          stroke={PALETTE.blue}
          strokeWidth={2.2}
        />
        <path
          d={polyPath(xs, variance, xToPx, yToPx)}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={2.2}
        />
        <path
          d={polyPath(xs, total, xToPx, yToPx)}
          fill="none"
          stroke={PALETTE.amber}
          strokeWidth={2.6}
        />

        {axisTitles({
          xLabel: "model complexity",
          yLabel: "expected error",
          plotW,
          plotH,
          pad,
          H,
        })}

        {/* legend — lower-left, between the total-error curve and the variance rise */}
        <g transform={`translate(${pad.left + 16} ${pad.top + plotH - 84})`}>
          <g transform="translate(0 0)">
            {legendRow({ color: PALETTE.blue, label: "bias²", key: "b" })}
          </g>
          <g transform="translate(0 16)">
            {legendRow({ color: PALETTE.red, label: "variance", key: "v" })}
          </g>
          <g transform="translate(0 32)">
            {legendRow({
              color: PALETTE.amber,
              label: "total error  =  bias² + variance + σ²",
              key: "t",
            })}
          </g>
        </g>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 2. DoubleDescent — classical U, spike at p/n = 1, then a lower modern min
// ---------------------------------------------------------------------------
export function DoubleDescent({ caption }: { caption?: string }) {
  const W = 560;
  const H = 340;
  const pad = { top: 22, right: 20, bottom: 46, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const xMin = 0;
  const xMax = 3;
  const yMin = 0;
  const yMax = 2;
  const xToPx = linScale(xMin, xMax, pad.left, pad.left + plotW);
  const yToPx = linScale(yMin, yMax, pad.top + plotH, pad.top);

  // Piecewise C^0 construction that is continuous at x = 0.5 and x = 1 but
  // has a slope discontinuity at the interpolation threshold, producing a
  // visible spike. Constants are chosen so the classical minimum (< 1) sits
  // above the modern minimum (> 1).
  const risk = (x: number) => {
    if (x <= 0.5) return 0.55 + 1.8 * (x - 0.5) ** 2;
    if (x <= 1.0) return 0.55 + 5.4 * (x - 0.5) ** 2;
    return (
      0.35 +
      1.55 * Math.exp(-2.2 * (x - 1)) +
      0.15 * Math.max(0, x - 2.5) ** 2
    );
  };

  const N = 801;
  const xs = Array.from(
    { length: N },
    (_, i) => xMin + ((xMax - xMin) * i) / (N - 1),
  );

  let classicalX = 0.5;
  let classicalY = risk(0.5);
  let modernX = 2.5;
  let modernY = risk(2.5);
  for (const x of xs) {
    const y = risk(x);
    if (x < 1 && y < classicalY) {
      classicalY = y;
      classicalX = x;
    }
    if (x > 1 && y < modernY) {
      modernY = y;
      modernX = x;
    }
  }

  const xTicks = [0, 0.5, 1, 1.5, 2, 2.5, 3];
  const yTicks = [0, 0.5, 1, 1.5, 2];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Double-descent test-risk curve. A classical U-shape rises to a sharp spike at the interpolation threshold where the parameter count equals the sample size, then descends again to a lower modern minimum beyond it.",
    caption,
    children: (
      <>
        {yTicks.map((v, i) =>
          yTick({
            y: yToPx(v),
            label: v.toFixed(1),
            left: pad.left,
            right: W - pad.right,
            labelX: pad.left - 8,
            key: i,
          }),
        )}
        {xTicks.map((t, i) =>
          xTickLabel({
            x: xToPx(t),
            y: pad.top + plotH + 16,
            label: t.toString(),
            key: i,
          }),
        )}

        {/* interpolation-threshold vertical */}
        <line
          x1={xToPx(1)}
          x2={xToPx(1)}
          y1={pad.top}
          y2={pad.top + plotH}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.75}
        />
        <text
          x={xToPx(1) - 6}
          y={pad.top + 14}
          textAnchor="end"
          className="fill-foreground"
          fontSize={11}
        >
          interpolation threshold  p / n = 1
        </text>

        {/* the risk curve */}
        <path
          d={polyPath(xs, risk, xToPx, yToPx)}
          fill="none"
          stroke={PALETTE.blue}
          strokeWidth={2.4}
        />

        {/* classical minimum marker + label */}
        <circle
          cx={xToPx(classicalX)}
          cy={yToPx(classicalY)}
          r={4}
          fill={PALETTE.red}
        />
        <text
          x={xToPx(classicalX)}
          y={yToPx(classicalY) + 20}
          textAnchor="middle"
          fill={PALETTE.red}
          fontSize={11}
        >
          classical minimum
        </text>

        {/* modern minimum marker + label */}
        <circle
          cx={xToPx(modernX)}
          cy={yToPx(modernY)}
          r={4}
          fill={PALETTE.amber}
        />
        <text
          x={xToPx(modernX)}
          y={yToPx(modernY) + 20}
          textAnchor="middle"
          fill={PALETTE.amber}
          fontSize={11}
        >
          modern minimum
        </text>

        {axisTitles({
          xLabel: "capacity  p / n",
          yLabel: "test risk",
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
// 3. CvFoldStrip — K=5, K=10, and LOO fold-assignment strips
// ---------------------------------------------------------------------------
export function CvFoldStrip({ caption }: { caption?: string }) {
  const W = 640;
  const H = 380;

  const labelCol = 20;
  const foldLabelCol = 90;
  const blocksL = 104;
  const blocksR = 440;
  const annotCol = 456;
  const blocksW = blocksR - blocksL;
  const blockGap = 2;
  const dataH = 12;
  const foldH = 11;
  const foldGap = 3;
  const foldStep = foldH + foldGap;

  type StripArgs = {
    yTop: number;
    label: string;
    k: number;
    folds: number[]; // 0-based indices of val fold for each shown row
    ellipsis?: boolean;
    annotation: string;
    subAnnotation?: string;
    footNote?: string;
  };

  const renderStrip = (a: StripArgs) => {
    const blockW = (blocksW - blockGap * (a.k - 1)) / a.k;
    const labelY = a.yTop + 12;
    const dataY = a.yTop + 22;
    const foldY0 = dataY + dataH + 6;
    const footY = foldY0 + a.folds.length * foldStep + 10;

    return (
      <g>
        {/* K label */}
        <text
          x={labelCol}
          y={labelY}
          className="fill-foreground"
          fontSize={13}
          fontWeight={600}
        >
          {a.label}
        </text>

        {/* data header row (all n samples) */}
        {Array.from({ length: a.k }, (_, i) => (
          <rect
            key={`d${i}`}
            x={blocksL + i * (blockW + blockGap)}
            y={dataY}
            width={blockW}
            height={dataH}
            className="fill-muted-foreground/25 stroke-border"
            strokeWidth={0.6}
          />
        ))}

        {/* one row per shown fold: red = val, blue = train */}
        {a.folds.map((valIdx, rowIdx) => {
          const fy = foldY0 + rowIdx * foldStep;
          return (
            <g key={`f${rowIdx}`}>
              <text
                x={foldLabelCol}
                y={fy + foldH - 2}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={10}
              >
                fold {valIdx + 1}
              </text>
              {Array.from({ length: a.k }, (_, i) => (
                <rect
                  key={`b${i}`}
                  x={blocksL + i * (blockW + blockGap)}
                  y={fy}
                  width={blockW}
                  height={foldH}
                  fill={i === valIdx ? PALETTE.red : PALETTE.blue}
                  fillOpacity={i === valIdx ? 0.85 : 0.55}
                />
              ))}
            </g>
          );
        })}

        {/* optional ellipsis to indicate more folds not drawn */}
        {a.ellipsis && (
          <text
            x={blocksL + blocksW / 2}
            y={footY}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={14}
          >
            …
          </text>
        )}

        {/* optional foot-note under the strip */}
        {a.footNote && (
          <text
            x={blocksL + blocksW / 2}
            y={footY}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={10}
          >
            {a.footNote}
          </text>
        )}

        {/* right-side annotation */}
        <text
          x={annotCol}
          y={foldY0 + foldH - 2}
          className="fill-foreground"
          fontSize={11}
        >
          {a.annotation}
        </text>
        {a.subAnnotation && (
          <text
            x={annotCol}
            y={foldY0 + foldH + 12}
            className="fill-muted-foreground"
            fontSize={10}
          >
            {a.subAnnotation}
          </text>
        )}
      </g>
    );
  };

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Cross-validation fold-assignment strips. Top: K=5 with five rows, each row's held-out fold coloured red and training folds blue. Middle: K=10 with three rows shown and an ellipsis for the remaining seven. Bottom: leave-one-out with one row of twenty blocks and a note that nineteen more folds follow.",
    caption,
    children: (
      <>
        {/* colour legend at the top */}
        <g transform={`translate(${labelCol} 8)`}>
          <rect
            x={0}
            y={0}
            width={12}
            height={10}
            fill={PALETTE.blue}
            fillOpacity={0.55}
          />
          <text
            x={16}
            y={9}
            className="fill-muted-foreground"
            fontSize={11}
          >
            train
          </text>
          <rect
            x={70}
            y={0}
            width={12}
            height={10}
            fill={PALETTE.red}
            fillOpacity={0.85}
          />
          <text
            x={86}
            y={9}
            className="fill-muted-foreground"
            fontSize={11}
          >
            validation
          </text>
          <rect
            x={168}
            y={0}
            width={12}
            height={10}
            className="fill-muted-foreground/25 stroke-border"
            strokeWidth={0.6}
          />
          <text
            x={184}
            y={9}
            className="fill-muted-foreground"
            fontSize={11}
          >
            all n samples
          </text>
        </g>

        {renderStrip({
          yTop: 34,
          label: "K = 5",
          k: 5,
          folds: [0, 1, 2, 3, 4],
          annotation: "5-fold cross-validation",
          subAnnotation: "lower variance, higher bias",
        })}

        {renderStrip({
          yTop: 168,
          label: "K = 10",
          k: 10,
          folds: [0, 1, 2],
          ellipsis: true,
          annotation: "10-fold cross-validation",
          subAnnotation: "conventional default",
        })}

        {renderStrip({
          yTop: 286,
          label: "LOO  (K = n)",
          k: 20,
          folds: [0],
          footNote: "×  (n − 1) more folds not drawn",
          annotation: "leave-one-out cross-validation",
          subAnnotation: "higher variance, lower bias",
        })}
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 4. LearningCurveDiag — high-bias vs high-variance regimes side by side
// ---------------------------------------------------------------------------
export function LearningCurveDiag({ caption }: { caption?: string }) {
  const W = 720;
  const H = 340;
  const halfW = W / 2;

  const pad = { top: 42, right: 24, bottom: 46, left: 52 };
  const plotW = halfW - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const nMin = 10;
  const nMax = 500;
  const yMin = 0;
  const yMax = 0.8;

  // Log-scaled x so the "diminishing returns" shape reads correctly.
  const logMin = Math.log10(nMin);
  const logMax = Math.log10(nMax);
  const toPct = (n: number) => (Math.log10(n) - logMin) / (logMax - logMin);
  const xToPxL = (n: number) => pad.left + toPct(n) * plotW;
  const xToPxR = (n: number) => halfW + pad.left + toPct(n) * plotW;
  const yToPx = (y: number) =>
    pad.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  const nSamples = 80;
  const ns = Array.from(
    { length: nSamples },
    (_, i) => nMin * Math.pow(nMax / nMin, i / (nSamples - 1)),
  );

  // High-bias regime: both curves plateau at a shared, high error floor.
  const hbTrain = (n: number) => 0.4 - 0.34 * Math.exp(-n / 130);
  const hbVal = (n: number) => 0.42 + 0.32 * Math.exp(-n / 120);
  // High-variance regime: train stays low, val stays high — persistent gap.
  const hvTrain = (n: number) => 0.05 + 0.04 * Math.exp(-n / 90);
  const hvVal = (n: number) => 0.42 + 0.24 * Math.exp(-n / 140);

  const xTicks = [10, 50, 100, 500];
  const yTicks = [0, 0.2, 0.4, 0.6, 0.8];

  const renderPanel = (
    xToPx: (n: number) => number,
    trainFn: (n: number) => number,
    valFn: (n: number) => number,
    title: string,
    subtitle: string,
    panelLeft: number,
    keyPrefix: string,
  ) => (
    <g>
      {/* panel title & subtitle */}
      <text
        x={panelLeft + halfW / 2}
        y={20}
        textAnchor="middle"
        className="fill-foreground"
        fontSize={13}
        fontWeight={600}
      >
        {title}
      </text>
      <text
        x={panelLeft + halfW / 2}
        y={34}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize={11}
      >
        {subtitle}
      </text>

      {/* y gridlines & labels (per panel, so both plots read the same) */}
      {yTicks.map((v, i) =>
        yTick({
          y: yToPx(v),
          label: v.toFixed(1),
          left: panelLeft + pad.left,
          right: panelLeft + halfW - pad.right,
          labelX: panelLeft + pad.left - 8,
          key: `${keyPrefix}y${i}`,
        }),
      )}

      {/* x tick labels */}
      {xTicks.map((t, i) =>
        xTickLabel({
          x: xToPx(t),
          y: pad.top + plotH + 16,
          label: String(t),
          key: `${keyPrefix}x${i}`,
        }),
      )}

      {/* validation error — dashed */}
      <path
        d={polyPath(ns, valFn, xToPx, yToPx)}
        fill="none"
        stroke={PALETTE.red}
        strokeWidth={2.2}
        strokeDasharray="6 4"
      />

      {/* training error — solid */}
      <path
        d={polyPath(ns, trainFn, xToPx, yToPx)}
        fill="none"
        stroke={PALETTE.blue}
        strokeWidth={2.2}
      />

      {/* x-axis title */}
      <text
        x={panelLeft + pad.left + plotW / 2}
        y={H - 6}
        textAnchor="middle"
        className="fill-foreground"
        fontSize={12}
      >
        training-set size n  (log)
      </text>

      {/* rotated y-axis title */}
      <text
        transform={`translate(${panelLeft + 13} ${pad.top + plotH / 2}) rotate(-90)`}
        textAnchor="middle"
        className="fill-foreground"
        fontSize={12}
      >
        error
      </text>

      {/* per-panel legend, top-right of the plot area */}
      <g
        transform={`translate(${panelLeft + halfW - pad.right - 118} ${pad.top + 6})`}
      >
        <g transform="translate(0 0)">
          {legendRow({
            color: PALETTE.blue,
            label: "train",
            key: `${keyPrefix}lt`,
          })}
        </g>
        <g transform="translate(0 16)">
          {legendRow({
            color: PALETTE.red,
            label: "validation",
            dashed: true,
            key: `${keyPrefix}lv`,
          })}
        </g>
      </g>
    </g>
  );

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two learning-curve panels. Left, high-bias regime: solid blue training error and dashed red validation error both converge to a high error floor near 0.4 with only a small gap. Right, high-variance regime: training error stays near 0.05 while validation error stays near 0.42, leaving a large persistent gap between the two curves.",
    caption,
    children: (
      <>
        {renderPanel(
          xToPxL,
          hbTrain,
          hbVal,
          "High-bias regime",
          "underfit — curves meet at a high floor",
          0,
          "L",
        )}
        {renderPanel(
          xToPxR,
          hvTrain,
          hvVal,
          "High-variance regime",
          "overfit — persistent gap between curves",
          halfW,
          "R",
        )}

        {/* vertical divider between panels */}
        <line
          x1={halfW}
          x2={halfW}
          y1={pad.top - 20}
          y2={H - pad.bottom + 20}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.5}
        />
      </>
    ),
  });
}
