// Inline SVG figures for the logistic-regression lesson (c1.4).
//
// Every figure is a server component with no client JS: shapes are computed
// from closed forms so builds are reproducible (Math.random is banned in
// server-rendered artifacts of this project).
//
// Structural marks use design-system classes so both themes work; data series
// use the shared PALETTE hues, which read on both card backgrounds.

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

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/**
 * Separation: scaling beta up raises the log-likelihood forever without
 * reaching a maximum. Left panel shows the fitted curve getting steeper;
 * right panel shows the log-likelihood climbing toward its unattained
 * supremum of zero.
 */
export function SeparationDivergence({ caption }: { caption?: string }) {
  const W = 560;
  const H = 320;
  const pad = { top: 20, right: 16, bottom: 46, left: 46 };
  const gap = 40;
  const panelW = (W - pad.left - pad.right - gap) / 2;
  const plotH = H - pad.top - pad.bottom;

  // Six separable 1-D points: three negatives at x < 0, three positives at x > 0.
  const xs = [-2.4, -1.6, -0.9, 0.9, 1.6, 2.4];
  const ys = [0, 0, 0, 1, 1, 1];

  // ---- Left panel: sigma(c * x) for growing c ----
  const xMin = -3.2;
  const xMax = 3.2;
  const lx = linScale(xMin, xMax, pad.left, pad.left + panelW);
  const ly = linScale(0, 1, pad.top + plotH, pad.top);
  const grid = Array.from({ length: 121 }, (_, i) => xMin + (6.4 * i) / 120);

  const cValues = [1, 3, 12];
  const cColors = [PALETTE.gray, PALETTE.blue, PALETTE.red];

  // ---- Right panel: log-likelihood as a function of c ----
  const loglik = (c: number) =>
    xs.reduce((acc, x, i) => {
      const p = sigmoid(c * x);
      return acc + (ys[i] === 1 ? Math.log(p) : Math.log(1 - p));
    }, 0);

  const rxMin = 0;
  const rxMax = 14;
  const ryMin = -4.4;
  const rLeft = pad.left + panelW + gap;
  const rx = linScale(rxMin, rxMax, rLeft, rLeft + panelW);
  const ry = linScale(ryMin, 0, pad.top + plotH, pad.top);
  const cGrid = Array.from({ length: 141 }, (_, i) => 0.1 + (13.9 * i) / 140);

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two panels showing that under perfect separation the logistic fit never converges: on the left the fitted sigmoid grows steeper as the coefficient is scaled up, and on the right the log-likelihood rises toward zero without ever reaching it.",
    caption,
    children: (
      <>
        {/* ---------------- left panel ---------------- */}
        {[0, 0.5, 1].map((v, i) =>
          yTick({
            y: ly(v),
            label: `${v}`,
            left: pad.left,
            right: pad.left + panelW,
            labelX: pad.left - 7,
            key: `l${i}`,
          }),
        )}

        {cValues.map((c, i) => (
          <path
            key={`c${i}`}
            d={polyPath(grid, (x) => sigmoid(c * x), lx, ly)}
            fill="none"
            stroke={cColors[i]}
            strokeWidth={i === cValues.length - 1 ? 2.4 : 1.8}
            opacity={i === cValues.length - 1 ? 1 : 0.75}
          />
        ))}

        {xs.map((x, i) => (
          <circle
            key={`pt${i}`}
            cx={lx(x)}
            cy={ly(ys[i])}
            r={4}
            fill={ys[i] === 1 ? PALETTE.red : PALETTE.blue}
            stroke="white"
            strokeWidth={1}
          />
        ))}

        {/* the gap that makes the data separable */}
        <line
          x1={lx(0)}
          x2={lx(0)}
          y1={pad.top}
          y2={pad.top + plotH}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.6}
        />

        {[-3, 0, 3].map((t, i) =>
          xTickLabel({
            x: lx(t),
            y: pad.top + plotH + 16,
            label: `${t}`,
            key: `lx${i}`,
          }),
        )}

        <text
          x={pad.left + panelW / 2}
          y={H - 26}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          feature x
        </text>

        <g transform={`translate(${pad.left + 6} ${pad.top + 2})`}>
          {cValues.map((c, i) =>
            legendRow({ color: cColors[i], label: `β = ${c}`, key: i }),
          )}
        </g>

        {/* ---------------- right panel ---------------- */}
        {[0, -1, -2, -3, -4].map((v, i) =>
          yTick({
            y: ry(v),
            label: `${v}`,
            left: rLeft,
            right: rLeft + panelW,
            labelX: rLeft - 7,
            key: `r${i}`,
          }),
        )}

        {/* the supremum, never attained */}
        <line
          x1={rLeft}
          x2={rLeft + panelW}
          y1={ry(0)}
          y2={ry(0)}
          stroke={PALETTE.red}
          strokeWidth={1.4}
          strokeDasharray="5 4"
        />
        <text
          x={rLeft + panelW - 4}
          y={ry(0) - 6}
          textAnchor="end"
          fill={PALETTE.red}
          fontSize={11}
        >
          supremum ℓ = 0, never reached
        </text>

        <path
          d={polyPath(cGrid, loglik, rx, ry)}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={2.4}
        />

        {cValues.map((c, i) => (
          <circle
            key={`rc${i}`}
            cx={rx(c)}
            cy={ry(loglik(c))}
            r={3.6}
            fill={cColors[i]}
          />
        ))}

        {[0, 4, 8, 12].map((t, i) =>
          xTickLabel({
            x: rx(t),
            y: pad.top + plotH + 16,
            label: `${t}`,
            key: `rx${i}`,
          }),
        )}

        <text
          x={rLeft + panelW / 2}
          y={H - 26}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          coefficient scale β
        </text>

        <text
          transform={`translate(13 ${pad.top + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          p(x)
        </text>
      </>
    ),
  });
}

/**
 * The marginal effect of a coefficient on probability is beta * p(1-p),
 * which peaks at 0.25 when p = 0.5 and vanishes in both tails. This is the
 * picture behind the "divide by four" rule and behind why "the probability
 * goes up by beta" is always wrong.
 */
export function MarginalEffectCurve({ caption }: { caption?: string }) {
  const W = 560;
  const H = 320;
  const pad = { top: 20, right: 20, bottom: 48, left: 56 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const etaMin = -6;
  const etaMax = 6;
  const x = linScale(etaMin, etaMax, pad.left, pad.left + plotW);
  const y = linScale(0, 0.28, pad.top + plotH, pad.top);
  const grid = Array.from({ length: 241 }, (_, i) => etaMin + (12 * i) / 240);

  // Three reference points: the peak and two saturated shoulders.
  const marks = [
    { eta: 0, label: "p = 0.5", color: PALETTE.red },
    { eta: 2.2, label: "p ≈ 0.90", color: PALETTE.blue },
    { eta: 4.6, label: "p ≈ 0.99", color: PALETTE.amber },
  ];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "The derivative of the sigmoid, p times one minus p, plotted against the linear score. It peaks at 0.25 where the probability is one half and falls to nearly zero in both tails.",
    caption,
    children: (
      <>
        {[0, 0.05, 0.1, 0.15, 0.2, 0.25].map((v, i) =>
          yTick({
            y: y(v),
            label: v.toFixed(2),
            left: pad.left,
            right: pad.left + plotW,
            labelX: pad.left - 8,
            key: i,
          }),
        )}

        {/* the 0.25 ceiling that gives the divide-by-four rule */}
        <line
          x1={pad.left}
          x2={pad.left + plotW}
          y1={y(0.25)}
          y2={y(0.25)}
          stroke={PALETTE.red}
          strokeWidth={1.2}
          strokeDasharray="5 4"
          opacity={0.85}
        />
        <text
          x={pad.left + plotW - 4}
          y={y(0.25) - 7}
          textAnchor="end"
          fill={PALETTE.red}
          fontSize={11}
        >
          ceiling 0.25 → the “divide by 4” rule
        </text>

        <path
          d={polyPath(grid, (e) => sigmoid(e) * (1 - sigmoid(e)), x, y)}
          fill="none"
          stroke={PALETTE.blue}
          strokeWidth={2.6}
        />

        {marks.map((m, i) => {
          const v = sigmoid(m.eta) * (1 - sigmoid(m.eta));
          return (
            <g key={`m${i}`}>
              <circle cx={x(m.eta)} cy={y(v)} r={4.2} fill={m.color} />
              <text
                x={x(m.eta) + (i === 0 ? 0 : 8)}
                y={y(v) - 10}
                textAnchor={i === 0 ? "middle" : "start"}
                fill={m.color}
                fontSize={11}
              >
                {m.label}
              </text>
            </g>
          );
        })}

        {[-6, -3, 0, 3, 6].map((t, i) =>
          xTickLabel({
            x: x(t),
            y: pad.top + plotH + 18,
            label: `${t}`,
            key: i,
          }),
        )}

        {axisTitles({
          xLabel: "linear score η = xᵀβ",
          yLabel: "dp/dη = p(1−p)",
          plotW,
          plotH,
          pad,
          H,
        })}
      </>
    ),
  });
}

/**
 * Downsampling the negatives shifts the whole fitted curve left along the
 * score axis by exactly log(1/w). Undoing it is a single subtraction on the
 * intercept: the slope, and therefore the ranking, never moved.
 */
export function InterceptShift({ caption }: { caption?: string }) {
  const W = 560;
  const H = 320;
  const pad = { top: 20, right: 20, bottom: 48, left: 56 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const etaMin = -8;
  const etaMax = 4;
  const x = linScale(etaMin, etaMax, pad.left, pad.left + plotW);
  const y = linScale(0, 1, pad.top + plotH, pad.top);
  const grid = Array.from({ length: 241 }, (_, i) => etaMin + (12 * i) / 240);

  // Keep 1 negative in 10: the biased fit sits log(10) ≈ 2.303 to the left.
  const shift = Math.log(10);

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two sigmoid curves of identical shape offset horizontally. The curve fitted on downsampled negatives is shifted left by log of ten; subtracting that constant from the intercept slides it back onto the true curve.",
    caption,
    children: (
      <>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) =>
          yTick({
            y: y(v),
            label: `${v}`,
            left: pad.left,
            right: pad.left + plotW,
            labelX: pad.left - 8,
            key: i,
          }),
        )}

        {/* biased fit: trained on 1-in-10 negatives */}
        <path
          d={polyPath(grid, (e) => sigmoid(e + shift), x, y)}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth={2.6}
        />
        {/* corrected fit */}
        <path
          d={polyPath(grid, (e) => sigmoid(e), x, y)}
          fill="none"
          stroke={PALETTE.blue}
          strokeWidth={2.6}
        />

        {/* the offset, drawn at p = 0.5 where both curves cross their midpoint */}
        <line
          x1={x(-shift)}
          x2={x(0)}
          y1={y(0.5)}
          y2={y(0.5)}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.4}
          markerStart="url(#ishead)"
          markerEnd="url(#ishead)"
        />
        <defs>
          <marker
            id="ishead"
            markerWidth={7}
            markerHeight={7}
            refX={3.5}
            refY={3.5}
            orient="auto"
          >
            <path
              d="M0,3.5 L7,1 L7,6 Z"
              className="fill-foreground"
              transform="rotate(180 3.5 3.5)"
            />
          </marker>
        </defs>
        <text
          x={(x(-shift) + x(0)) / 2}
          y={y(0.5) - 10}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={11.5}
        >
          log(1/w) = log 10 ≈ 2.30
        </text>

        {/* one worked point: score 0 reads 0.5 biased, 0.09 corrected */}
        <circle cx={x(0)} cy={y(sigmoid(shift))} r={4.2} fill={PALETTE.red} />
        <circle cx={x(0)} cy={y(0.5)} r={4.2} fill={PALETTE.blue} />

        {[-8, -6, -4, -2, 0, 2, 4].map((t, i) =>
          xTickLabel({
            x: x(t),
            y: pad.top + plotH + 18,
            label: `${t}`,
            key: i,
          }),
        )}

        <g transform={`translate(${pad.left + 10} ${pad.top + 4})`}>
          {legendRow({
            color: PALETTE.red,
            label: "fitted on downsampled negatives",
            key: 0,
          })}
          <g transform="translate(0 16)">
            {legendRow({
              color: PALETTE.blue,
              label: "after subtracting log(1/w) from the intercept",
              key: 1,
            })}
          </g>
        </g>

        {axisTitles({
          xLabel: "corrected score η = xᵀβ",
          yLabel: "predicted probability",
          plotW,
          plotH,
          pad,
          H,
        })}
      </>
    ),
  });
}
