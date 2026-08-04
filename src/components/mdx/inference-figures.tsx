// Figures for the inference half of c1.4: why the reference distribution is
// Student's t rather than a Normal, and what a p-value is as an area.
//
// Server components, deterministic, no client JS — see figure-helpers.tsx.

import {
  figureFrame,
  PALETTE,
  linScale,
  polyPath,
  yTick,
  xTickLabel,
  axisTitles,
  legendRow,
} from "./figure-helpers";

/* ---------------------------------------------------------------- */
/* Student-t density                                                 */
/* ---------------------------------------------------------------- */

// Lanczos log-gamma: the t density needs Γ((ν+1)/2)/Γ(ν/2), which overflows
// if computed as a ratio of gammas for large ν.
const LANCZOS = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012,
  9.9843695780195716e-6, 1.5056327351493116e-7,
];

function logGamma(z: number): number {
  if (z < 0.5) {
    // Reflection: Γ(z)Γ(1−z) = π / sin(πz)
    return (
      Math.log(Math.PI / Math.abs(Math.sin(Math.PI * z))) - logGamma(1 - z)
    );
  }
  const x = z - 1;
  let a = 0.99999999999980993;
  const t = x + 7.5;
  for (let i = 0; i < LANCZOS.length; i++) a += LANCZOS[i] / (x + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Student-t density with ν degrees of freedom. */
function tPdf(x: number, nu: number): number {
  const logC =
    logGamma((nu + 1) / 2) - 0.5 * Math.log(nu * Math.PI) - logGamma(nu / 2);
  return Math.exp(logC - ((nu + 1) / 2) * Math.log1p((x * x) / nu));
}

/** Standard Normal density. */
function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/** Sample points across [a, b]. */
function grid(a: number, b: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
}

/** Closed path for the area under f between x0 and x1, down to the baseline. */
function areaPath(
  x0: number,
  x1: number,
  f: (x: number) => number,
  xToPx: (x: number) => number,
  yToPx: (y: number) => number,
  baselinePx: number,
): string {
  const xs = grid(x0, x1, 48);
  const top = xs
    .map(
      (x, i) =>
        `${i === 0 ? "M" : "L"}${xToPx(x).toFixed(1)},${yToPx(f(x)).toFixed(1)}`,
    )
    .join(" ");
  return `${top} L${xToPx(x1).toFixed(1)},${baselinePx.toFixed(1)} L${xToPx(x0).toFixed(1)},${baselinePx.toFixed(1)} Z`;
}

/* ---------------------------------------------------------------- */
/* 1. t vs Normal: same centre, heavier tails                        */
/* ---------------------------------------------------------------- */

/**
 * Why the table says t and not z: with σ estimated from the same small
 * sample, the reference distribution has to be wider in the tails.
 */
export function TvsNormalTails() {
  const W = 560;
  const H = 300;
  const pad = { top: 18, right: 16, bottom: 44, left: 46 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const xMin = -4.6;
  const xMax = 4.6;
  const yMax = 0.42;

  const xToPx = linScale(xMin, xMax, pad.left, pad.left + plotW);
  const yToPx = linScale(0, yMax, pad.top + plotH, pad.top);
  const baseline = pad.top + plotH;
  const xs = grid(xMin, xMax, 220);

  const series = [
    { nu: Infinity, color: PALETTE.blue, label: "Normal (σ known)" },
    { nu: 10, color: PALETTE.amber, label: "t, df = 10" },
    { nu: 2, color: PALETTE.red, label: "t, df = 2" },
  ];
  const dens = (nu: number) => (x: number) =>
    nu === Infinity ? normPdf(x) : tPdf(x, nu);

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Student t densities for 2 and 10 degrees of freedom overlaid on the standard Normal. All three peak at zero; the t curves are lower at the centre and higher in the tails, so more probability sits beyond plus or minus 1.96.",
    caption:
      "Same centre, fatter tails. Beyond ±1.96 the Normal keeps 5.0% of its area; t₁₀ keeps 7.8%, t₂ keeps 18.9% — which is why small samples need a bigger t before you call it significant.",
    children: (
      <>
        {[0, 0.1, 0.2, 0.3, 0.4].map((v) =>
          yTick({
            y: yToPx(v),
            label: v.toFixed(1),
            left: pad.left,
            right: pad.left + plotW,
            labelX: pad.left - 6,
            key: v,
          }),
        )}

        {/* tail region beyond the Normal's ±1.96 cutoff */}
        {[
          [1.96, xMax],
          [xMin, -1.96],
        ].map(([a, b], i) => (
          <path
            key={`tail${i}`}
            d={areaPath(a, b, dens(2), xToPx, yToPx, baseline)}
            fill={PALETTE.red}
            opacity={0.14}
          />
        ))}

        {[-1.96, 1.96].map((c) => (
          <line
            key={`cut${c}`}
            x1={xToPx(c)}
            x2={xToPx(c)}
            y1={pad.top}
            y2={baseline}
            stroke={PALETTE.gray}
            strokeWidth={1.2}
            strokeDasharray="4 4"
          />
        ))}
        <text
          x={xToPx(1.96) + 5}
          y={pad.top + 12}
          className="fill-muted-foreground"
          fontSize={11}
        >
          ±1.96
        </text>

        {series.map((s) => (
          <path
            key={s.label}
            d={polyPath(xs, dens(s.nu), xToPx, yToPx)}
            fill="none"
            stroke={s.color}
            strokeWidth={2.2}
          />
        ))}

        {[-4, -2, 0, 2, 4].map((v) =>
          xTickLabel({
            x: xToPx(v),
            y: baseline + 16,
            label: String(v),
            key: v,
          }),
        )}

        {axisTitles({
          xLabel: "t-statistic",
          yLabel: "density",
          plotW,
          plotH,
          pad,
          H,
        })}

        <g transform={`translate(${pad.left + 12} ${pad.top + 6})`}>
          {series.map((s, i) => (
            <g key={s.label} transform={`translate(0 ${i * 15})`}>
              {legendRow({ color: s.color, label: s.label, key: i })}
            </g>
          ))}
        </g>
      </>
    ),
  });
}

/* ---------------------------------------------------------------- */
/* 2. The 95% cutoff shrinks toward 1.96 as df grows                 */
/* ---------------------------------------------------------------- */

/**
 * The practical payoff of "t not z": the bar you must clear depends on how
 * many degrees of freedom you have, and only collapses to 1.96 for large n.
 */
export function TCriticalVsDf() {
  const W = 560;
  const H = 280;
  const pad = { top: 18, right: 18, bottom: 46, left: 46 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  // Two-sided 95% critical values, standard table values.
  const pts: { label: string; t: number }[] = [
    { label: "1", t: 12.71 },
    { label: "2", t: 4.30 },
    { label: "3", t: 3.18 },
    { label: "5", t: 2.57 },
    { label: "10", t: 2.23 },
    { label: "20", t: 2.09 },
    { label: "30", t: 2.04 },
    { label: "60", t: 2.00 },
    { label: "∞", t: 1.96 },
  ];

  // Categorical spacing: df is wildly non-linear, and the shape we want to
  // show is "steep early, flat after ~30".
  const xAt = (i: number) =>
    pad.left + (plotW * (i + 0.5)) / pts.length;
  const yMax = 5.2;
  const yToPx = linScale(1.8, yMax, pad.top + plotH, pad.top);

  const path = pts
    .map((p, i) => {
      const y = yToPx(Math.min(p.t, yMax));
      return `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two-sided 95 percent critical value against degrees of freedom. It falls steeply from 12.71 at one degree of freedom to about 2.2 at ten, then flattens toward the Normal value of 1.96.",
    caption:
      "The significance bar depends on sample size. With df = 1 you need |t| > 12.7; by df = 30 it is 2.04, essentially the Normal's 1.96. 'Is |t| > 2?' is a large-sample shortcut, not a law.",
    children: (
      <>
        {[2, 3, 4, 5].map((v) =>
          yTick({
            y: yToPx(v),
            label: v.toFixed(1),
            left: pad.left,
            right: pad.left + plotW,
            labelX: pad.left - 6,
            key: v,
          }),
        )}

        {/* Normal asymptote */}
        <line
          x1={pad.left}
          x2={pad.left + plotW}
          y1={yToPx(1.96)}
          y2={yToPx(1.96)}
          stroke={PALETTE.blue}
          strokeWidth={1.6}
          strokeDasharray="5 4"
        />
        <text
          x={pad.left + plotW - 4}
          y={yToPx(1.96) - 6}
          textAnchor="end"
          fill={PALETTE.blue}
          fontSize={11}
        >
          Normal: 1.96
        </text>

        <path d={path} fill="none" stroke={PALETTE.red} strokeWidth={2.2} />

        {pts.map((p, i) => {
          const clipped = p.t > yMax;
          return (
            <g key={p.label}>
              {!clipped && (
                <circle
                  cx={xAt(i)}
                  cy={yToPx(p.t)}
                  r={3}
                  fill={PALETTE.red}
                />
              )}
              {clipped && (
                <text
                  x={xAt(i)}
                  y={pad.top + 12}
                  textAnchor="middle"
                  fill={PALETTE.red}
                  fontSize={11}
                >
                  12.71 ↑
                </text>
              )}
              {xTickLabel({
                x: xAt(i),
                y: pad.top + plotH + 16,
                label: p.label,
                key: i,
              })}
            </g>
          );
        })}

        {axisTitles({
          xLabel: "degrees of freedom (n − p)",
          yLabel: "|t| needed at 5%",
          plotW,
          plotH,
          pad,
          H,
        })}
      </>
    ),
  });
}

/* ---------------------------------------------------------------- */
/* 3. The p-value is an area                                         */
/* ---------------------------------------------------------------- */

/**
 * The single most-misread number in a regression table, drawn as what it
 * actually is: tail area under the null distribution.
 */
export function PValueAsArea() {
  const W = 560;
  const H = 280;
  const pad = { top: 18, right: 16, bottom: 46, left: 46 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const xMin = -4.6;
  const xMax = 4.6;
  const nu = 25;
  const tObs = 2.4;

  const xToPx = linScale(xMin, xMax, pad.left, pad.left + plotW);
  const yToPx = linScale(0, 0.42, pad.top + plotH, pad.top);
  const baseline = pad.top + plotH;
  const xs = grid(xMin, xMax, 220);
  const f = (x: number) => tPdf(x, nu);

  return figureFrame({
    W,
    H,
    ariaLabel:
      "A t density centred at zero with the two tails beyond plus and minus 2.4 shaded. The shaded area is the two-sided p-value; the unshaded bulk is the range of t-statistics the null hypothesis produces routinely.",
    caption:
      "A p-value is the shaded area, not a probability about your hypothesis. If β were truly 0, sampling noise alone would push |t| past 2.4 about 2.4% of the time — so p ≈ 0.024.",
    children: (
      <>
        {[0, 0.1, 0.2, 0.3, 0.4].map((v) =>
          yTick({
            y: yToPx(v),
            label: v.toFixed(1),
            left: pad.left,
            right: pad.left + plotW,
            labelX: pad.left - 6,
            key: v,
          }),
        )}

        {[
          [tObs, xMax],
          [xMin, -tObs],
        ].map(([a, b], i) => (
          <path
            key={`p${i}`}
            d={areaPath(a, b, f, xToPx, yToPx, baseline)}
            fill={PALETTE.red}
            opacity={0.32}
          />
        ))}

        <path
          d={polyPath(xs, f, xToPx, yToPx)}
          fill="none"
          stroke={PALETTE.gray}
          strokeWidth={2.2}
        />

        {[-tObs, tObs].map((c) => (
          <line
            key={`o${c}`}
            x1={xToPx(c)}
            x2={xToPx(c)}
            y1={yToPx(f(c))}
            y2={baseline}
            stroke={PALETTE.red}
            strokeWidth={1.6}
          />
        ))}

        <text
          x={xToPx(tObs)}
          y={pad.top + 14}
          textAnchor="middle"
          fill={PALETTE.red}
          fontSize={11}
        >
          observed t = 2.4
        </text>
        <text
          x={xToPx(0)}
          y={yToPx(0.19)}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
        >
          what H₀ produces routinely
        </text>

        {[-4, -2, 0, 2, 4].map((v) =>
          xTickLabel({
            x: xToPx(v),
            y: baseline + 16,
            label: String(v),
            key: v,
          }),
        )}

        {axisTitles({
          xLabel: "t-statistic if H₀ (β = 0) were true",
          yLabel: "density",
          plotW,
          plotH,
          pad,
          H,
        })}
      </>
    ),
  });
}
