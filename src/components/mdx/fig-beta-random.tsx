// Figure for c1.3, "Why the beta estimator is random".
//
// Everything here is simulated, not drawn: a fixed design matrix X (12 evenly
// spaced x values), a fixed truth y = 1 + 0.6x, and 2000 independent redraws of
// the noise. Each redraw is refit by the closed-form OLS slope Sxy/Sxx, and the
// resulting slopes are histogrammed. The theoretical curve is N(beta1, sigma^2/Sxx),
// i.e. the diagonal of sigma^2 (X^T X)^-1 for a simple regression.
//
// No client JS, no external assets, deterministic PRNG (Math.random is banned
// in server-rendered figures: server and client must agree).

// Deterministic pseudo-random generator (Mulberry32). Same seed → same figure.
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box–Muller draw from a standard Normal, given an rng().
function gauss(r: () => number): number {
  const u = Math.max(1e-9, r());
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function figureFrame({
  W,
  H,
  ariaLabel,
  caption,
  children,
}: {
  W: number;
  H: number;
  ariaLabel: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="my-6">
      <div className="rounded-lg border border-border bg-card p-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={ariaLabel}
        >
          {children}
        </svg>
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function EstimatorIsRandom({ caption }: { caption?: string }) {
  const W = 760;
  const H = 436;

  // ---------------------------------------------------------------------
  // The experiment. X is held fixed across replications — this is the
  // conditional-on-X story the lesson tells, so only ε is redrawn.
  // ---------------------------------------------------------------------
  const n = 12;
  const beta0True = 1;
  const beta1True = 0.6;
  const sigma = 2;
  const xMaxData = 10;

  const xs = Array.from({ length: n }, (_, i) => (xMaxData * i) / (n - 1));
  const xbar = xs.reduce((s, x) => s + x, 0) / n;
  const sxx = xs.reduce((s, x) => s + (x - xbar) ** 2, 0);
  // SE(β̂₁) = σ / sqrt(Sxx): the (1,1) entry of σ²(XᵀX)⁻¹ for simple regression.
  const seTheory = sigma / Math.sqrt(sxx);

  const R = 2000; // replications simulated
  const SHOWN_LINES = 60; // replications drawn as lines in the left panel
  const SHOWN_CLOUDS = 3; // replications whose scatter is drawn

  const r = rng(20260814);
  const slopes: number[] = [];
  const intercepts: number[] = [];
  const clouds: number[][] = [];

  for (let k = 0; k < R; k++) {
    const ys = xs.map((x) => beta0True + beta1True * x + sigma * gauss(r));
    const ybar = ys.reduce((s, y) => s + y, 0) / n;
    let sxy = 0;
    for (let i = 0; i < n; i++) sxy += (xs[i] - xbar) * (ys[i] - ybar);
    const b1 = sxy / sxx;
    slopes.push(b1);
    intercepts.push(ybar - b1 * xbar);
    if (k < SHOWN_CLOUDS) clouds.push(ys);
  }

  const meanSlope = slopes.reduce((s, b) => s + b, 0) / R;
  const sdSlope = Math.sqrt(
    slopes.reduce((s, b) => s + (b - meanSlope) ** 2, 0) / (R - 1),
  );

  // ---------------------------------------------------------------------
  // Histogram of the 2000 fitted slopes, over ±4.2 theoretical SEs.
  // ---------------------------------------------------------------------
  const nBins = 24;
  const lo = beta1True - 4.2 * seTheory;
  const hi = beta1True + 4.2 * seTheory;
  const binW = (hi - lo) / nBins;
  const counts = new Array<number>(nBins).fill(0);
  for (const b of slopes) {
    const idx = Math.floor((b - lo) / binW);
    if (idx >= 0 && idx < nBins) counts[idx] += 1;
  }
  const maxCount = Math.max(...counts);

  // ---------------------------------------------------------------------
  // Geometry
  // ---------------------------------------------------------------------
  const top = 46;
  const ph = 246;
  const bottom = top + ph;

  const ax0 = 52;
  const aw = 372;
  const bx0 = 486;
  const bw = 244;

  // Chosen to contain the simulated clouds (y from −1.21 to 10.04) and the fan
  // of fitted lines (−1.68 to 9.61), with headroom at the top for the legend.
  const yMin = -2.5;
  const yMax = 13;
  const axPx = (x: number) => ax0 + (x / xMaxData) * aw;
  const ayPx = (y: number) => top + (1 - (y - yMin) / (yMax - yMin)) * ph;

  const bxPx = (b: number) => bx0 + ((b - lo) / (hi - lo)) * bw;
  const maxBarH = ph - 62;
  const cPx = (c: number) => (c / maxCount) * maxBarH;

  const lineFor = (b0: number, b1: number) => ({
    x1: axPx(0),
    y1: ayPx(b0),
    x2: axPx(xMaxData),
    y2: ayPx(b0 + b1 * xMaxData),
  });

  const trueLine = lineFor(beta0True, beta1True);
  const highlight = lineFor(intercepts[0], slopes[0]);

  const yTicksA = [0, 4, 8, 12];
  const xTicksA = [0, 2, 4, 6, 8, 10];
  const xTicksB = [0.0, 0.3, 0.6, 0.9, 1.2];

  // Theoretical sampling density N(β₁, σ²/Sxx), scaled to expected bin counts.
  const densityPts = Array.from({ length: 121 }, (_, i) => {
    const b = lo + ((hi - lo) * i) / 120;
    const z = (b - beta1True) / seTheory;
    const dens = Math.exp(-0.5 * z * z) / (seTheory * Math.sqrt(2 * Math.PI));
    return `${bxPx(b).toFixed(1)},${(bottom - cPx(R * binW * dens)).toFixed(1)}`;
  }).join(" ");

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Left panel: one straight true line in red with sixty faint fitted lines fanning around it, plus faint scatter from three simulated datasets. Right panel: a histogram of two thousand fitted slopes, centred on the true slope, with a bell curve overlaid and a marked plus or minus one standard error width.",
    caption,
    children: (
      <>
        <defs>
          <marker
            id="bir-arrow-end"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#f59e0b" />
          </marker>
          <marker
            id="bir-arrow-start"
            viewBox="0 0 10 10"
            refX="1"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M10,0 L0,5 L10,10 z" fill="#f59e0b" />
          </marker>
        </defs>

        {/* ================= Panel A ================= */}
        <text
          x={ax0}
          y={22}
          className="fill-foreground"
          fontSize={12.5}
          fontWeight={600}
        >
          One truth, 60 samples, 60 fitted lines
        </text>
        <text x={ax0} y={38} className="fill-muted-foreground" fontSize={11}>
          n = 12, the same x values every time, σ = 2, only ε redrawn
        </text>

        {yTicksA.map((v, i) => (
          <g key={`ya${i}`}>
            <line
              x1={ax0}
              x2={ax0 + aw}
              y1={ayPx(v)}
              y2={ayPx(v)}
              className="text-border"
              stroke="currentColor"
              strokeWidth={1}
              opacity={0.5}
            />
            <text
              x={ax0 - 6}
              y={ayPx(v) + 3.5}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize={11}
            >
              {v}
            </text>
          </g>
        ))}
        {xTicksA.map((t, i) => (
          <text
            key={`xa${i}`}
            x={axPx(t)}
            y={bottom + 16}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={11}
          >
            {t}
          </text>
        ))}

        {/* faint scatter from three of the simulated datasets */}
        {clouds.map((ys, k) =>
          ys.map((y, i) => (
            <circle
              key={`c${k}-${i}`}
              cx={axPx(xs[i])}
              cy={ayPx(y)}
              r={2.1}
              fill="#9ca3af"
              opacity={0.5}
            />
          )),
        )}

        {/* the fan: one fitted line per simulated dataset */}
        {slopes.slice(0, SHOWN_LINES).map((b1, k) => {
          const l = lineFor(intercepts[k], b1);
          return (
            <line
              key={`f${k}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="#9ca3af"
              strokeWidth={1}
              opacity={0.32}
            />
          );
        })}

        {/* one sample singled out, with its own fit */}
        <line
          x1={highlight.x1}
          y1={highlight.y1}
          x2={highlight.x2}
          y2={highlight.y2}
          stroke="#2563eb"
          strokeWidth={2}
        />
        {clouds[0].map((y, i) => (
          <circle
            key={`h${i}`}
            cx={axPx(xs[i])}
            cy={ayPx(y)}
            r={3}
            fill="#2563eb"
          />
        ))}

        {/* the fixed truth */}
        <line
          x1={trueLine.x1}
          y1={trueLine.y1}
          x2={trueLine.x2}
          y2={trueLine.y2}
          stroke="#dc2626"
          strokeWidth={2.6}
        />

        <text
          x={axPx(10) - 4}
          y={ayPx(beta0True + beta1True * 10) - 8}
          textAnchor="end"
          fontSize={11.5}
          fill="#dc2626"
          fontWeight={600}
        >
          truth: y = 1 + 0.6x
        </text>
        <text x={ax0 + 8} y={top + 16} fontSize={11.5} fill="#2563eb">
          ─ one sample and its fit, β̂₁ = {slopes[0].toFixed(3)}
        </text>
        <text x={ax0 + 8} y={top + 32} fontSize={11.5} fill="#6b7280">
          ─ 59 other refits of the same model
        </text>
        <text
          x={ax0 + aw / 2}
          y={bottom + 34}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          predictor x
        </text>
        <text
          transform={`translate(14 ${top + ph / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          outcome y
        </text>

        {/* ================= Panel B ================= */}
        <text
          x={bx0}
          y={22}
          className="fill-foreground"
          fontSize={12.5}
          fontWeight={600}
        >
          Where 2000 fitted slopes landed
        </text>
        <text x={bx0} y={38} className="fill-muted-foreground" fontSize={11}>
          the sampling distribution of β̂₁
        </text>

        {/* bars */}
        {counts.map((c, i) => {
          const x = bxPx(lo + i * binW);
          const wpx = bw / nBins;
          const h = cPx(c);
          return (
            <rect
              key={`bar${i}`}
              x={x + 0.6}
              y={bottom - h}
              width={Math.max(0.5, wpx - 1.2)}
              height={h}
              fill="#2563eb"
              opacity={0.45}
            />
          );
        })}

        {/* the theoretical N(β₁, σ²/Sxx) the histogram is supposed to match */}
        <polyline
          points={densityPts}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={1.8}
        />

        {/* the truth, which the distribution is centred on */}
        <line
          x1={bxPx(beta1True)}
          x2={bxPx(beta1True)}
          y1={top + 18}
          y2={bottom}
          stroke="#dc2626"
          strokeWidth={1.8}
          strokeDasharray="5 4"
        />
        <text
          x={bxPx(beta1True)}
          y={top + 10}
          textAnchor="middle"
          fontSize={11.5}
          fill="#dc2626"
          fontWeight={600}
        >
          true β₁ = 0.600
        </text>

        {/* the width a standard error reports */}
        <line
          x1={bxPx(beta1True - seTheory)}
          x2={bxPx(beta1True + seTheory)}
          y1={top + 46}
          y2={top + 46}
          stroke="#f59e0b"
          strokeWidth={1.6}
          markerStart="url(#bir-arrow-start)"
          markerEnd="url(#bir-arrow-end)"
        />
        <text
          x={bxPx(beta1True)}
          y={top + 38}
          textAnchor="middle"
          fontSize={11.5}
          fill="#d97706"
          fontWeight={600}
        >
          ±1 SE = {seTheory.toFixed(3)}
        </text>

        {/* baseline */}
        <line
          x1={bx0}
          x2={bx0 + bw}
          y1={bottom}
          y2={bottom}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.1}
          opacity={0.5}
        />

        {/* rug: the 60 slopes that are drawn as lines in the left panel */}
        {slopes.slice(0, SHOWN_LINES).map((b, i) => (
          <line
            key={`rug${i}`}
            x1={bxPx(b)}
            x2={bxPx(b)}
            y1={bottom + 8}
            y2={bottom + 17}
            stroke={i === 0 ? "#2563eb" : "#9ca3af"}
            strokeWidth={i === 0 ? 2 : 1}
            opacity={i === 0 ? 1 : 0.75}
          />
        ))}
        <text
          x={bx0 + bw / 2}
          y={bottom + 30}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
        >
          each tick is one line from the left panel
        </text>

        {xTicksB.map((t, i) => (
          <text
            key={`xb${i}`}
            x={bxPx(t)}
            y={bottom + 48}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={11}
          >
            {t.toFixed(1)}
          </text>
        ))}
        <text
          x={bx0 + bw / 2}
          y={bottom + 66}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          fitted slope β̂₁
        </text>

        {/* ================= the identity, spelled out ================= */}
        <text
          x={W / 2}
          y={H - 44}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={13}
        >
          β̂ = β + (XᵀX)⁻¹Xᵀε — the fixed first term sets the centre, the noise
          term sets the width
        </text>
        <text
          x={W / 2}
          y={H - 25}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11.5}
        >
          Mean of the 2000 fitted slopes = {meanSlope.toFixed(3)} against a true
          β₁ = 0.600, so the estimator is centred on the truth.
        </text>
        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11.5}
        >
          Their standard deviation = {sdSlope.toFixed(3)}, and the formula σ/√Sxx
          predicts {seTheory.toFixed(3)}. That width is the standard error.
        </text>
      </>
    ),
  });
}
