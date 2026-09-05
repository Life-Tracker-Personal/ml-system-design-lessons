// Inline SVG figure for c1.5: the hard rank ceiling on how many principal
// components can exist, and why "keep 95% of the variance" is a claim about
// reconstructing X rather than about predicting y.
//
// Server component, no client JS, deterministic by construction.

import {
  PALETTE,
  axisTitles,
  figureFrame,
  xTickLabel,
  yTick,
} from "./figure-helpers";

/**
 * Scree plot for a wide matrix: n = 12 rows, d = 40 columns. Exactly
 * n - 1 = 11 eigenvalues are nonzero and every one after that is exactly
 * zero — not small, zero. The cumulative curve reaches 100% at that cliff.
 */
export function ScreeRankCeiling({ caption }: { caption?: string }) {
  const W = 560;
  const H = 330;
  const pad = { top: 22, right: 46, bottom: 50, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const n = 12;
  const d = 20; // components drawn (the rest are zero too)
  const rank = n - 1; // 11 nonzero components after centering

  // A decaying spectrum on the first `rank` components, exact zeros after.
  const raw = Array.from({ length: d }, (_, j) =>
    j < rank ? Math.exp(-0.42 * j) : 0,
  );
  const total = raw.reduce((a, b) => a + b, 0);
  const share = raw.map((v) => v / total);

  const cum: number[] = [];
  share.reduce((acc, v, i) => {
    cum[i] = acc + v;
    return cum[i];
  }, 0);

  const barW = plotW / d;
  const yToPx = (v: number) => pad.top + (1 - v / 0.36) * plotH;
  const cumToPx = (v: number) => pad.top + (1 - v) * plotH;

  const cumPath = cum
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${(pad.left + barW * (i + 0.5)).toFixed(1)},${cumToPx(v).toFixed(1)}`,
    )
    .join(" ");

  // Where the cumulative curve first crosses 95%.
  const k95 = cum.findIndex((v) => v >= 0.95) + 1;

  return figureFrame({
    W,
    H,
    ariaLabel:
      "A scree plot for a dataset with twelve rows and forty columns. Eleven bars carry variance and every bar after the eleventh is exactly zero, showing the rank ceiling at n minus one.",
    caption,
    children: (
      <>
        {[0, 0.09, 0.18, 0.27, 0.36].map((v, i) =>
          yTick({
            y: yToPx(v),
            label: `${Math.round(v * 100)}%`,
            left: pad.left,
            right: pad.left + plotW,
            labelX: pad.left - 8,
            key: i,
          }),
        )}

        {/* the dead zone past the rank ceiling */}
        <rect
          x={pad.left + barW * rank}
          y={pad.top}
          width={plotW - barW * rank}
          height={plotH}
          className="text-muted-foreground"
          fill="currentColor"
          opacity={0.09}
        />

        {share.map((v, j) => {
          const h = pad.top + plotH - yToPx(v);
          return (
            <rect
              key={`b${j}`}
              x={pad.left + barW * j + barW * 0.16}
              y={yToPx(v)}
              width={barW * 0.68}
              height={Math.max(0, h)}
              fill={j < k95 ? PALETTE.blue : PALETTE.gray}
              opacity={j < rank ? 0.9 : 0.35}
            />
          );
        })}

        {/* rank ceiling */}
        <line
          x1={pad.left + barW * rank}
          x2={pad.left + barW * rank}
          y1={pad.top}
          y2={pad.top + plotH}
          stroke={PALETTE.red}
          strokeWidth={1.6}
          strokeDasharray="5 4"
        />
        <text
          x={pad.left + barW * rank + 6}
          y={pad.top + 14}
          fill={PALETTE.red}
          fontSize={11}
        >
          rank ≤ n − 1 = 11
        </text>
        <text
          x={pad.left + barW * rank + 6}
          y={pad.top + 28}
          fill={PALETTE.red}
          fontSize={11}
        >
          every λ after this is exactly 0
        </text>

        {/* cumulative explained variance */}
        <path d={cumPath} fill="none" stroke={PALETTE.amber} strokeWidth={2.4} />
        <line
          x1={pad.left}
          x2={pad.left + plotW}
          y1={cumToPx(0.95)}
          y2={cumToPx(0.95)}
          stroke={PALETTE.amber}
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.8}
        />
        <text
          x={pad.left + plotW + 5}
          y={cumToPx(0.95) + 3.5}
          fill={PALETTE.amber}
          fontSize={11}
        >
          95%
        </text>
        <text
          x={pad.left + plotW + 5}
          y={cumToPx(1) + 3.5}
          fill={PALETTE.amber}
          fontSize={11}
        >
          100%
        </text>

        {[1, 5, 9, 13, 17].map((t, i) =>
          xTickLabel({
            x: pad.left + barW * (t - 0.5),
            y: pad.top + plotH + 18,
            label: `${t}`,
            key: i,
          }),
        )}

        {axisTitles({
          xLabel: "component index j",
          yLabel: "share of variance",
          plotW,
          plotH,
          pad,
          H,
        })}
      </>
    ),
  });
}
