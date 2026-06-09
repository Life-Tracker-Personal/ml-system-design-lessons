// Self-contained SVG chart for regression-loss lessons. No charting dependency:
// the curves are simple closed forms, so we sample them and emit an SVG path.
// Rendered as a server component (no client JS) inside the MDX pipeline.

type Variant = "loss" | "gradient";

type SeriesKey = "mse" | "mae" | "huber";

const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  // Distinct hues chosen for legibility on both the light and dark card
  // backgrounds (the warm-amber --chart tokens are too close to tell apart).
  { key: "mse", label: "MSE", color: "#dc2626" }, // red — the fragile one
  { key: "mae", label: "MAE", color: "#2563eb" }, // blue — constant gradient
  { key: "huber", label: "Huber", color: "#d97706" }, // amber — the hybrid
];

// Constants dropped (1/2 on the squared terms) so Huber's quadratic branch
// overlays MSE exactly for |r| < delta and then peels off — the whole point of
// the picture. This matches the lesson's note that the 1/n, 1/2 constants do not
// move the minimum.
function lossValue(key: SeriesKey, r: number, delta: number): number {
  const a = Math.abs(r);
  if (key === "mse") return 0.5 * r * r;
  if (key === "mae") return a;
  return a <= delta ? 0.5 * r * r : delta * (a - 0.5 * delta); // huber
}

function gradValue(key: SeriesKey, r: number, delta: number): number {
  const a = Math.abs(r);
  const sign = r > 0 ? 1 : r < 0 ? -1 : 0;
  if (key === "mse") return r;
  if (key === "mae") return sign;
  return a <= delta ? r : delta * sign; // huber: saturates at ±delta
}

export function LossChart({
  variant = "loss",
  delta = 1,
  rMax = 3,
  caption,
}: {
  variant?: Variant;
  delta?: number;
  rMax?: number;
  caption?: string;
}) {
  const W = 560;
  const H = 340;
  const pad = { top: 18, right: 18, bottom: 46, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const N = 241;
  const xs = Array.from({ length: N }, (_, i) => -rMax + (2 * rMax * i) / (N - 1));
  const f = variant === "loss" ? gradOrLoss(variant) : gradOrLoss(variant);

  // y-range across all series
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const s of SERIES) {
    for (const x of xs) {
      const y = f(s.key, x, delta);
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
  }
  if (variant === "loss") yMin = 0; // loss floor is 0
  const span = yMax - yMin || 1;
  const yPadTop = span * 0.08;
  const yPadBot = variant === "gradient" ? span * 0.08 : 0;
  yMin -= yPadBot;
  yMax += yPadTop;

  const xToPx = (x: number) => pad.left + ((x + rMax) / (2 * rMax)) * plotW;
  const yToPx = (y: number) =>
    pad.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  const pathFor = (key: SeriesKey) =>
    xs
      .map(
        (x, i) =>
          `${i === 0 ? "M" : "L"}${xToPx(x).toFixed(1)},${yToPx(
            f(key, x, delta),
          ).toFixed(1)}`,
      )
      .join(" ");

  // ticks
  const xTicks = Array.from(new Set([-rMax, -delta, 0, delta, rMax])).sort(
    (a, b) => a - b,
  );
  const yTickCount = 5;
  const yTicks = Array.from({ length: yTickCount }, (_, i) => {
    const v = yMin + ((yMax - yMin) * i) / (yTickCount - 1);
    return v;
  });

  const yLabel = variant === "loss" ? "loss  𝓛(r)" : "gradient  ∂𝓛/∂r";
  const zeroY = yToPx(0);

  return (
    <figure className="my-6">
      <div className="rounded-lg border border-border bg-card p-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${variant === "loss" ? "Loss" : "Gradient"} versus residual for MSE, MAE and Huber`}
        >
          {/* horizontal gridlines + y tick labels */}
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
                  {formatTick(v)}
                </text>
              </g>
            );
          })}

          {/* threshold markers at ±delta */}
          {[-delta, delta].map((d, i) => (
            <g key={`d${i}`}>
              <line
                x1={xToPx(d)}
                x2={xToPx(d)}
                y1={pad.top}
                y2={pad.top + plotH}
                className="text-muted-foreground"
                stroke="currentColor"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.45}
              />
              <text
                x={xToPx(d)}
                y={pad.top + plotH + 30}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={11}
              >
                {d < 0 ? "−δ" : "δ"}
              </text>
            </g>
          ))}

          {/* x axis (baseline at y = 0) */}
          <line
            x1={pad.left}
            x2={W - pad.right}
            y1={zeroY}
            y2={zeroY}
            className="text-foreground"
            stroke="currentColor"
            strokeWidth={1.25}
            opacity={0.55}
          />

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
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </text>
          ))}

          {/* axis titles */}
          <text
            x={pad.left + plotW / 2}
            y={H - 6}
            textAnchor="middle"
            className="fill-foreground"
            fontSize={12}
          >
            residual r = y − ŷ
          </text>
          <text
            transform={`translate(13 ${pad.top + plotH / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-foreground"
            fontSize={12}
          >
            {yLabel}
          </text>

          {/* series */}
          {SERIES.map((s) => (
            <path
              key={s.key}
              d={pathFor(s.key)}
              fill="none"
              stroke={s.color}
              strokeWidth={2.25}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* legend */}
        <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1">
          {SERIES.map((s) => (
            <span
              key={s.key}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <span
                aria-hidden
                className="inline-block h-0.5 w-5 rounded"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function gradOrLoss(variant: Variant) {
  return variant === "loss" ? lossValue : gradValue;
}

function formatTick(v: number): string {
  if (Math.abs(v) < 1e-9) return "0";
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1);
}
