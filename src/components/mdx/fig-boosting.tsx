// Inline SVG figure for the boosting section of c1.6.
//
// Everything drawn here is computed, not placed by hand: the toy dataset comes
// from a deterministic LCG (Math.random is banned in server-rendered figures of
// this project), the trees are fitted by an actual greedy CART variance-reduction
// search over 1-D splits, and the ensemble is advanced by the real update
// f_m = f_{m-1} + nu * h_m. Change the seed and every panel moves together.
//
// Design tokens follow src/components/mdx/regression-figures.tsx: theme-aware
// currentColor/fill classes for structural marks, fixed hues only for data
// accents that must stay distinct on both light and dark card backgrounds.

type Seg = { lo: number; hi: number; v: number };

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

// Approximate Box–Muller draw from a standard Normal, given an rng().
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

// ---------------------------------------------------------------------------
// Greedy CART regression tree on a single feature x ∈ [0, 1].
// At each node it scans every midpoint between consecutive sorted x values and
// keeps the split minimizing SSE_L + SSE_R — the variance-reduction criterion
// of Part 1 — recursing to `depth` with at least `minLeaf` rows per leaf.
// Returns the leaves as constant segments tiling [0, 1].
// ---------------------------------------------------------------------------
function fitRegressionTree(
  xs: number[],
  target: number[],
  depth: number,
  minLeaf: number,
): Seg[] {
  const segs: Seg[] = [];
  const sse = (idx: number[]) => {
    const m = idx.reduce((a, i) => a + target[i], 0) / idx.length;
    return idx.reduce((a, i) => a + (target[i] - m) ** 2, 0);
  };
  const rec = (idx: number[], d: number, lo: number, hi: number) => {
    let best: { sse: number; s: number; L: number[]; R: number[] } | null = null;
    if (d < depth) {
      const s = [...idx].sort((a, b) => xs[a] - xs[b]);
      for (let k = minLeaf; k <= s.length - minLeaf; k++) {
        const L = s.slice(0, k);
        const R = s.slice(k);
        const tot = sse(L) + sse(R);
        if (best === null || tot < best.sse) {
          best = { sse: tot, s: (xs[s[k - 1]] + xs[s[k]]) / 2, L, R };
        }
      }
    }
    if (best === null) {
      segs.push({
        lo,
        hi,
        v: idx.reduce((a, i) => a + target[i], 0) / idx.length,
      });
      return;
    }
    rec(best.L, d + 1, lo, best.s);
    rec(best.R, d + 1, best.s, hi);
  };
  rec(
    xs.map((_, i) => i),
    0,
    0,
    1,
  );
  return segs.sort((a, b) => a.lo - b.lo);
}

function evalStep(segs: Seg[], x: number): number {
  for (let i = 0; i < segs.length; i++) {
    if (x < segs[i].hi || i === segs.length - 1) return segs[i].v;
  }
  return 0;
}

// Re-express any step function as constant pieces over a given breakpoint set.
function stepsFrom(bps: number[], f: (x: number) => number): Seg[] {
  const out: Seg[] = [];
  for (let i = 0; i < bps.length - 1; i++) {
    out.push({ lo: bps[i], hi: bps[i + 1], v: f((bps[i] + bps[i + 1]) / 2) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// BoostingResidualStrip — one round of gradient boosting, in four panels.
// ---------------------------------------------------------------------------
export function BoostingResidualStrip({ caption }: { caption?: string }) {
  const W = 720;
  const H = 462;

  const plotW = 274;
  const plotH = 160;
  const colL = 46;
  const colR = 402;
  const rowT = 52;
  const rowB = 272;
  const YMAX = 1.3;

  const xToPx = (x: number, x0: number) => x0 + x * plotW;
  const yToPx = (y: number, top: number) =>
    top + plotH / 2 - (y * plotH) / (2 * YMAX);

  // ---- toy data: deterministic, 26 rows on an evenly spaced grid ----------
  const NU = 0.5; // the shrinkage ν of f_m = f_{m-1} + ν h_m
  const n = 26;
  const r = rng(20260814);
  const xs = Array.from({ length: n }, (_, i) => i / (n - 1));
  const ys = xs.map(
    (x) => 0.95 * Math.sin(2 * Math.PI * x) + 0.3 * x - 0.15 + 0.11 * gauss(r),
  );

  // ---- run the actual procedure ------------------------------------------
  // f_0 = mean (the constant minimizing squared loss), then one full round.
  const mean = ys.reduce((a, b) => a + b, 0) / n;
  const h1 = fitRegressionTree(
    xs,
    ys.map((y) => y - mean),
    2,
    2,
  );
  const f1 = (x: number) => mean + NU * evalStep(h1, x);

  // Round m = 2. Squared loss ⇒ the pseudo-residual is the plain residual.
  const res = ys.map((y, i) => y - f1(xs[i]));
  const h2 = fitRegressionTree(xs, res, 2, 2);
  const f2 = (x: number) => f1(x) + NU * evalStep(h2, x);

  const sseBefore = res.reduce((a, v) => a + v * v, 0);
  const sseAfter = ys.reduce((a, y, i) => a + (y - f2(xs[i])) ** 2, 0);

  // Step-function geometry.
  const bps1 = [...h1.map((s) => s.lo), 1];
  const bpsBoth = Array.from(
    new Set([...h1.map((s) => s.lo), ...h2.map((s) => s.lo), 1]),
  ).sort((a, b) => a - b);
  const f1Segs = stepsFrom(bps1, f1);
  const f2Segs = stepsFrom(bpsBoth, f2);
  const nuH2 = h2.map((s) => ({ ...s, v: NU * s.v }));

  const stepPath = (segs: Seg[], x0: number, top: number) =>
    segs
      .map(
        (s, i) =>
          `${i === 0 ? "M" : "L"} ${xToPx(s.lo, x0).toFixed(1)},${yToPx(s.v, top).toFixed(1)} L ${xToPx(s.hi, x0).toFixed(1)},${yToPx(s.v, top).toFixed(1)}`,
      )
      .join(" ");

  // ---- reusable panel furniture ------------------------------------------
  const panelBox = (x0: number, top: number, key: string) => (
    <rect
      key={key}
      x={x0}
      y={top}
      width={plotW}
      height={plotH}
      className="text-border"
      stroke="currentColor"
      strokeWidth={1}
      fill="none"
      opacity={0.55}
      rx={4}
    />
  );

  const axes = (x0: number, top: number, tag: string) => (
    <g key={`ax-${tag}`}>
      {/* zero line */}
      <line
        x1={x0}
        y1={yToPx(0, top)}
        x2={x0 + plotW}
        y2={yToPx(0, top)}
        className="text-border"
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.8}
        strokeDasharray="2 3"
      />
      {[-1, 0, 1].map((t) => (
        <text
          key={`yt-${tag}-${t}`}
          x={x0 - 7}
          y={yToPx(t, top) + 4}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={11}
        >
          {t}
        </text>
      ))}
      {[0, 0.5, 1].map((t) => (
        <text
          key={`xt-${tag}-${t}`}
          x={xToPx(t, x0)}
          y={top + plotH + 15}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
        >
          {t}
        </text>
      ))}
      <text
        x={x0 + plotW}
        y={top + plotH + 15}
        textAnchor="start"
        dx={8}
        className="fill-muted-foreground"
        fontSize={11}
      >
        x
      </text>
    </g>
  );

  const title = (x0: number, top: number, label: string, tag: string) => (
    <text
      key={`ti-${tag}`}
      x={x0 - 8}
      y={top - 10}
      className="fill-foreground"
      fontSize={12.5}
      fontWeight={600}
    >
      {label}
    </text>
  );

  const dataDots = (x0: number, top: number, tag: string) =>
    ys.map((y, i) => (
      <circle
        key={`d-${tag}-${i}`}
        cx={xToPx(xs[i], x0)}
        cy={yToPx(y, top)}
        r={2.6}
        className="fill-muted-foreground"
        opacity={0.85}
      />
    ));

  // Highlighted region for the ν annotation: the third leaf of h₂.
  const hiSeg = h2[2];
  const hiX = (hiSeg.lo + hiSeg.hi) / 2;

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Four panels showing one round of gradient boosting on a one-dimensional toy regression. Panel a: 26 data points with the current step-function fit f-one and red vertical gaps between them. Panel b: those gaps redrawn as pseudo-residuals about zero. Panel c: a depth-two regression tree fitted to the residuals, drawn solid, with the same tree scaled by the learning rate drawn dashed and visibly half as tall. Panel d: the updated fit f-two, which has moved from f-one toward the data by exactly the dashed amount.",
    caption,
    children: (
      <>
        <defs>
          <marker
            id="brs-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#d97706" />
          </marker>
        </defs>

        <text x={colL - 8} y={18} className="fill-foreground" fontSize={12}>
          Gradient boosting, round m = 2: squared loss, depth-2 trees, ν = 0.5
        </text>
        <text
          x={W - 30}
          y={18}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={11}
        >
          all panels share one y-scale
        </text>

        {/* ================= (a) data + current fit f₁ ================= */}
        {title(colL, rowT, "(a) data and the current fit f₁", "a")}
        {panelBox(colL, rowT, "pa")}
        {axes(colL, rowT, "a")}
        {/* the gaps f₁ leaves behind */}
        {ys.map((y, i) => (
          <line
            key={`ga-${i}`}
            x1={xToPx(xs[i], colL)}
            y1={yToPx(f1(xs[i]), rowT)}
            x2={xToPx(xs[i], colL)}
            y2={yToPx(y, rowT)}
            stroke="#dc2626"
            strokeWidth={1.3}
            opacity={0.75}
          />
        ))}
        <path
          d={stepPath(f1Segs, colL, rowT)}
          fill="none"
          stroke="#6b7280"
          strokeWidth={2.2}
        />
        {dataDots(colL, rowT, "a")}
        <text
          x={colL + 6}
          y={rowT + 14}
          fontSize={11.5}
          className="fill-foreground"
        >
          gray step = f₁ · dots = yᵢ
        </text>
        <text x={colL + 6} y={rowT + plotH - 8} fontSize={11.5} fill="#dc2626">
          red gaps = what f₁ still gets wrong
        </text>

        {/* ================= (b) pseudo-residuals ================= */}
        {title(colR, rowT, "(b) pseudo-residuals rᵢ₂ = yᵢ − f₁(xᵢ)", "b")}
        {panelBox(colR, rowT, "pb")}
        {axes(colR, rowT, "b")}
        {res.map((v, i) => (
          <line
            key={`rb-${i}`}
            x1={xToPx(xs[i], colR)}
            y1={yToPx(0, rowT)}
            x2={xToPx(xs[i], colR)}
            y2={yToPx(v, rowT)}
            stroke="#dc2626"
            strokeWidth={1.3}
            opacity={0.75}
          />
        ))}
        {res.map((v, i) => (
          <circle
            key={`rd-${i}`}
            cx={xToPx(xs[i], colR)}
            cy={yToPx(v, rowT)}
            r={2.6}
            fill="#dc2626"
          />
        ))}
        <text
          x={colR + 6}
          y={rowT + 14}
          fontSize={11.5}
          className="fill-foreground"
        >
          same red gaps, now measured from 0
        </text>
        <text x={colR + 6} y={rowT + plotH - 8} fontSize={11.5} fill="#dc2626">
          round 2 regresses on rᵢ₂, never on yᵢ
        </text>

        {/* ================= (c) the tree fitted to the residuals ======= */}
        {title(colL, rowB, "(c) depth-2 tree h₂ fitted to those rᵢ₂", "c")}
        {panelBox(colL, rowB, "pc")}
        {axes(colL, rowB, "c")}
        {res.map((v, i) => (
          <circle
            key={`rc-${i}`}
            cx={xToPx(xs[i], colL)}
            cy={yToPx(v, rowB)}
            r={2.4}
            fill="#dc2626"
            opacity={0.45}
          />
        ))}
        <path
          d={stepPath(h2, colL, rowB)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2.6}
        />
        <path
          d={stepPath(nuH2, colL, rowB)}
          fill="none"
          stroke="#d97706"
          strokeWidth={2.2}
          strokeDasharray="6 3"
        />
        {/* the shrinkage, drawn as the vertical gap between h₂ and ν h₂ */}
        <line
          x1={xToPx(hiX, colL)}
          y1={yToPx(hiSeg.v, rowB)}
          x2={xToPx(hiX, colL)}
          y2={yToPx(NU * hiSeg.v, rowB) - 2}
          stroke="#d97706"
          strokeWidth={1.6}
          markerEnd="url(#brs-arrow)"
        />
        <text
          x={colL + 6}
          y={rowB + 14}
          fontSize={11.5}
          className="fill-foreground"
        >
          <tspan fill="#f59e0b">solid = h₂</tspan>
          <tspan className="fill-muted-foreground"> · </tspan>
          <tspan fill="#d97706">dashed = ν h₂</tspan>
        </text>
        <text x={colL + 6} y={rowB + plotH - 8} fontSize={11.5} fill="#d97706">
          leaf asks for {hiSeg.v.toFixed(2)}, ν applies{" "}
          {(NU * hiSeg.v).toFixed(2)}
        </text>

        {/* ================= (d) the updated fit ================= */}
        {title(colR, rowB, "(d) updated fit f₂ = f₁ + ν h₂", "d")}
        {panelBox(colR, rowB, "pd")}
        {axes(colR, rowB, "d")}
        {dataDots(colR, rowB, "d")}
        <path
          d={stepPath(f1Segs, colR, rowB)}
          fill="none"
          stroke="#6b7280"
          strokeWidth={1.8}
          strokeDasharray="5 3"
          opacity={0.9}
        />
        <path
          d={stepPath(f2Segs, colR, rowB)}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2.6}
        />
        {/* the same shrunken step, now applied to the fit */}
        <line
          x1={xToPx(hiX, colR)}
          y1={yToPx(f1(hiX), rowB)}
          x2={xToPx(hiX, colR)}
          y2={yToPx(f2(hiX), rowB) - 2}
          stroke="#d97706"
          strokeWidth={1.6}
          markerEnd="url(#brs-arrow)"
        />
        <text
          x={colR + 6}
          y={rowB + 14}
          fontSize={11.5}
          className="fill-foreground"
        >
          <tspan className="fill-muted-foreground">dashed gray = f₁</tspan>
          <tspan className="fill-muted-foreground"> · </tspan>
          <tspan fill="#2563eb">blue = f₂</tspan>
        </text>
        <text x={colR + 6} y={rowB + plotH - 24} fontSize={11.5} fill="#d97706">
          moves by ν h₂, not by h₂
        </text>
        <text
          x={colR + 6}
          y={rowB + plotH - 8}
          fontSize={11.5}
          className="fill-foreground"
        >
          squared error {sseBefore.toFixed(2)} → {sseAfter.toFixed(2)}
        </text>
      </>
    ),
  });
}
