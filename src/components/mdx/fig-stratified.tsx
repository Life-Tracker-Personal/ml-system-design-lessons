// Inline SVG figure for the stratified-sampling variance derivation in c1.1.
// Server component, no client JS: the two sampling distributions are produced by
// an actual Monte-Carlo simulation run at render time with a seeded Mulberry32
// PRNG, so the picture is reproducible and cannot drift from the algebra it
// illustrates. Math.random is banned here (server and client must agree).

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

// ---------------------------------------------------------------------------
// StratifiedVsSrs — why the between-stratum term disappears.
//
// Population: N = 3000 split into L = 3 strata with sizes N_h = 1500/900/600,
// stratum means mu_h = 2/5/9 and a common within-stratum sd sigma_h = 1.5.
// (Each stratum's draws are recentred/rescaled so sigma_h is exact; every other
// quantity below is measured off the resulting population, not assumed.)
// Total sample n = 60, proportional allocation n_h = 30/18/12.
// Both schemes are simulated without replacement over R repeated samples.
// ---------------------------------------------------------------------------
export function StratifiedVsSrs({ caption }: { caption?: string }) {
  const W = 760;
  const H = 620;

  // ---------------- population ----------------
  const r = rng(20260814);
  const Nh = [1500, 900, 600];
  const N = 3000;
  const start = [0, 1500, 2400];
  const muH = [2, 5, 9];
  const sdH = [1.5, 1.5, 1.5];
  const nh = [30, 18, 12];
  const n = 60;
  const Wh = Nh.map((x) => x / N);
  // one hue per stratum; dark amber keeps white count labels legible on the bars
  const colors = ["#2563eb", "#d97706", "#dc2626"];
  // scheme hues used in panel 3 (and for the panel-2 verdict lines)
  const cSrs = "#6b7280";
  const cStr = "#2563eb";

  const values = new Float64Array(N);
  for (let h = 0; h < 3; h++) {
    const raw: number[] = [];
    for (let i = 0; i < Nh[h]; i++) raw.push(gauss(r));
    const m = raw.reduce((a, b) => a + b, 0) / Nh[h];
    const s = Math.sqrt(
      raw.reduce((a, b) => a + (b - m) * (b - m), 0) / Nh[h],
    );
    for (let i = 0; i < Nh[h]; i++)
      values[start[h] + i] = muH[h] + (sdH[h] * (raw[i] - m)) / s;
  }

  let mu = 0;
  for (let i = 0; i < N; i++) mu += values[i];
  mu /= N;
  // Law of total variance on the population: sigma^2 = within + between.
  const within = Wh.reduce((a, w, h) => a + w * sdH[h] * sdH[h], 0);
  const between = Wh.reduce((a, w, h) => a + w * (muH[h] - mu) ** 2, 0);

  // ---------------- simulation ----------------
  const R = 12000;
  const permAll = Int32Array.from({ length: N }, (_, i) => i);
  const permH = [0, 1, 2].map((h) =>
    Int32Array.from({ length: Nh[h] }, (_, i) => start[h] + i),
  );
  const srsDraws = new Float64Array(R);
  const strDraws = new Float64Array(R);
  const shownCounts: number[][] = [];
  const shownMeans: number[] = [];

  for (let rep = 0; rep < R; rep++) {
    // simple random sample of n from the whole population, without replacement
    let s = 0;
    const c = [0, 0, 0];
    for (let k = 0; k < n; k++) {
      const j = k + Math.floor(r() * (N - k));
      const t = permAll[k];
      permAll[k] = permAll[j];
      permAll[j] = t;
      const idx = permAll[k];
      s += values[idx];
      c[idx < start[1] ? 0 : idx < start[2] ? 1 : 2] += 1;
    }
    srsDraws[rep] = s / n;
    if (rep < 3) {
      shownCounts.push(c);
      shownMeans.push(s / n);
    }
    // stratified: n_h fixed, SRS inside each stratum, then reweight by N_h/N
    let acc = 0;
    for (let h = 0; h < 3; h++) {
      const p = permH[h];
      let sh = 0;
      for (let k = 0; k < nh[h]; k++) {
        const j = k + Math.floor(r() * (Nh[h] - k));
        const t = p[k];
        p[k] = p[j];
        p[j] = t;
        sh += values[p[k]];
      }
      acc += Wh[h] * (sh / nh[h]);
    }
    strDraws[rep] = acc;
  }

  const stat = (a: Float64Array) => {
    let m = 0;
    for (let i = 0; i < a.length; i++) m += a[i];
    m /= a.length;
    let v = 0;
    for (let i = 0; i < a.length; i++) v += (a[i] - m) * (a[i] - m);
    v /= a.length - 1;
    return { m, v, sd: Math.sqrt(v) };
  };
  const sSrs = stat(srsDraws);
  const sStr = stat(strDraws);

  // ---------------- densities on a shared grid ----------------
  const lo = mu - 1.75;
  const hi = mu + 1.75;
  const BINS = 70;
  const binW = (hi - lo) / BINS;
  const hist = (a: Float64Array) => {
    const cnt = new Float64Array(BINS);
    for (let i = 0; i < a.length; i++) {
      const b = Math.floor((a[i] - lo) / binW);
      if (b >= 0 && b < BINS) cnt[b] += 1;
    }
    // 3-point smoothing, then convert to a density (area = 1)
    const d = new Float64Array(BINS);
    for (let b = 0; b < BINS; b++) {
      const l = cnt[Math.max(0, b - 1)];
      const c0 = cnt[b];
      const rr = cnt[Math.min(BINS - 1, b + 1)];
      d[b] = (0.25 * l + 0.5 * c0 + 0.25 * rr) / (a.length * binW);
    }
    return d;
  };
  const dSrs = hist(srsDraws);
  const dStr = hist(strDraws);
  let dMax = 0;
  for (let b = 0; b < BINS; b++) dMax = Math.max(dMax, dSrs[b], dStr[b]);

  // ---------------- panel A geometry: the population ----------------
  const aX0 = 208;
  const aX1 = 734;
  const vLo = -2.4;
  const vHi = 13.8;
  const vx = (v: number) => aX0 + ((v - vLo) / (vHi - vLo)) * (aX1 - aX0);
  const rowY = [66, 104, 142];
  const jit = rng(7717);

  // ---------------- panel C geometry: sampling distributions ----------------
  const cX0 = 96;
  const cX1 = 704;
  const cBase = 546;
  const cTop = 418;
  const dx = (v: number) => cX0 + ((v - lo) / (hi - lo)) * (cX1 - cX0);
  const dy = (d: number) => cBase - (d / (dMax * 1.08)) * (cBase - cTop);
  const curve = (d: Float64Array) =>
    Array.from({ length: BINS }, (_, b) => {
      const xc = lo + (b + 0.5) * binW;
      return `${dx(xc).toFixed(1)},${dy(d[b]).toFixed(1)}`;
    }).join(" ");
  const area = (d: Float64Array) =>
    `M ${dx(lo + 0.5 * binW).toFixed(1)} ${cBase} L ${curve(d).split(" ").join(" L ")} L ${dx(hi - 0.5 * binW).toFixed(1)} ${cBase} Z`;

  const f2 = (x: number) => x.toFixed(2);
  const f3 = (x: number) => x.toFixed(3);

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Three panels. Top: a population strip split into three strata whose value clouds sit at clearly different means. Middle: three simple random samples whose per-stratum counts drift, next to three stratified samples whose per-stratum counts are identical every time. Bottom: the two sampling distributions of the estimate on one shared axis, the stratified one far narrower and taller than the simple-random one.",
    caption,
    children: (
      <>
        {/* ================= panel A: the population ================= */}
        <text
          x={24}
          y={28}
          className="fill-foreground"
          fontSize={13}
          fontWeight={600}
        >
          1. A population of N = 3000 in L = 3 strata whose means are far apart
        </text>

        {/* value axis */}
        <line
          x1={aX0}
          y1={168}
          x2={aX1}
          y2={168}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1.2}
        />
        {[0, 2, 4, 6, 8, 10, 12].map((t) => (
          <g key={`at${t}`}>
            <line
              x1={vx(t)}
              y1={168}
              x2={vx(t)}
              y2={173}
              className="text-border"
              stroke="currentColor"
              strokeWidth={1.2}
            />
            <text
              x={vx(t)}
              y={186}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={11}
            >
              {t}
            </text>
          </g>
        ))}
        <text
          x={aX1}
          y={186}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={11}
        >
          value x
        </text>

        {/* the decomposition the two schemes will pay differently */}
        <text x={24} y={176} className="fill-foreground" fontSize={11.5}>
          σ² = within + between
        </text>
        <text x={24} y={192} className="fill-muted-foreground" fontSize={11}>
          = {f2(within)} + {f2(between)} = {f2(within + between)}
        </text>

        {/* population mean */}
        <line
          x1={vx(mu)}
          y1={46}
          x2={vx(mu)}
          y2={168}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.3}
          strokeDasharray="4 3"
        />
        <text
          x={vx(mu) + 6}
          y={54}
          className="fill-foreground"
          fontSize={11.5}
        >
          μ = {f2(mu)}
        </text>

        {/* one row of dots per stratum */}
        {[0, 1, 2].map((h) => (
          <g key={`row${h}`}>
            <text
              x={24}
              y={rowY[h] - 3}
              className="fill-foreground"
              fontSize={11.5}
              fontWeight={600}
            >
              stratum h = {h + 1}, N{["₁", "₂", "₃"][h]}/N ={" "}
              {Wh[h].toFixed(2)}
            </text>
            <text
              x={24}
              y={rowY[h] + 12}
              className="fill-muted-foreground"
              fontSize={11}
            >
              μ{["₁", "₂", "₃"][h]} = {muH[h].toFixed(1)}, σ
              {["₁", "₂", "₃"][h]} = {sdH[h].toFixed(1)}
            </text>
            {Array.from({ length: 55 }, (_, i) => (
              <circle
                key={`d${h}-${i}`}
                cx={vx(values[start[h] + i * 7])}
                cy={rowY[h] + (jit() - 0.5) * 20}
                r={2.2}
                fill={colors[h]}
                opacity={0.5}
              />
            ))}
            <line
              x1={vx(muH[h])}
              y1={rowY[h] - 15}
              x2={vx(muH[h])}
              y2={rowY[h] + 15}
              stroke={colors[h]}
              strokeWidth={2}
            />
          </g>
        ))}

        {/* ================= panel B: what each scheme draws ================= */}
        <text
          x={24}
          y={224}
          className="fill-foreground"
          fontSize={13}
          fontWeight={600}
        >
          2. Same budget n = 60, three repeat draws of each scheme — watch the
          stratum mix
        </text>

        {[
          {
            x0: 40,
            title: "Simple random sampling",
            sub: "n₁, n₂, n₃ are whatever the draw happens to give",
            counts: shownCounts,
          },
          {
            x0: 412,
            title: "Stratified sampling",
            sub: "n₁, n₂, n₃ = 30, 18, 12 fixed before you look",
            counts: [nh, nh, nh],
          },
        ].map((col, ci) => (
          <g key={`col${ci}`}>
            <text
              x={col.x0}
              y={252}
              className="fill-foreground"
              fontSize={12.5}
              fontWeight={600}
            >
              {col.title}
            </text>
            <text
              x={col.x0}
              y={268}
              className="fill-muted-foreground"
              fontSize={11}
            >
              {col.sub}
            </text>
            {col.counts.map((c, ri) => {
              let acc = 0;
              return (
                <g key={`bar${ci}-${ri}`}>
                  {c.map((cnt, h) => {
                    const x = col.x0 + acc * 4;
                    acc += cnt;
                    return (
                      <g key={`seg${ci}-${ri}-${h}`}>
                        <rect
                          x={x}
                          y={282 + ri * 26}
                          width={cnt * 4 - 1.5}
                          height={16}
                          fill={colors[h]}
                        />
                        <text
                          x={x + (cnt * 4 - 1.5) / 2}
                          y={294 + ri * 26}
                          textAnchor="middle"
                          fontSize={11}
                          fill="#ffffff"
                          fontWeight={600}
                        >
                          {cnt}
                        </text>
                      </g>
                    );
                  })}
                  <text
                    x={col.x0 + 250}
                    y={294 + ri * 26}
                    className="fill-foreground"
                    fontSize={11.5}
                  >
                    x̄ = {ci === 0 ? f2(shownMeans[ri]) : f2(strDraws[ri])}
                  </text>
                </g>
              );
            })}
            <text
              x={col.x0}
              y={370}
              fontSize={11.5}
              fill={ci === 0 ? cSrs : cStr}
              fontWeight={600}
            >
              {ci === 0
                ? "mix wobbles ⇒ the estimate wobbles with it"
                : "mix identical every draw ⇒ that wobble cannot happen"}
            </text>
          </g>
        ))}

        {/* ================= panel C: sampling distributions ================= */}
        <text
          x={24}
          y={400}
          className="fill-foreground"
          fontSize={13}
          fontWeight={600}
        >
          3. Sampling distribution of the estimate over R = 12,000 repeats of
          each scheme, shared axis
        </text>

        <path d={area(dSrs)} fill={cSrs} opacity={0.16} />
        <path d={area(dStr)} fill={cStr} opacity={0.16} />
        <polyline
          points={curve(dSrs)}
          fill="none"
          stroke={cSrs}
          strokeWidth={2}
        />
        <polyline
          points={curve(dStr)}
          fill="none"
          stroke={cStr}
          strokeWidth={2.4}
        />

        {/* axis */}
        <line
          x1={cX0}
          y1={cBase}
          x2={cX1}
          y2={cBase}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1.2}
        />
        {[3.0, 3.5, 4.0, 4.5, 5.0, 5.5].map((t) => (
          <g key={`ct${t}`}>
            <line
              x1={dx(t)}
              y1={cBase}
              x2={dx(t)}
              y2={cBase + 5}
              className="text-border"
              stroke="currentColor"
              strokeWidth={1.2}
            />
            <text
              x={dx(t)}
              y={cBase + 18}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={11}
            >
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        <text
          x={cX1 + 6}
          y={cBase + 4}
          className="fill-muted-foreground"
          fontSize={11}
        >
          estimate
        </text>
        <line
          x1={dx(mu)}
          y1={cTop - 4}
          x2={dx(mu)}
          y2={cBase}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.3}
          strokeDasharray="4 3"
        />
        <text
          x={cX0 + 2}
          y={cTop + 4}
          className="fill-muted-foreground"
          fontSize={11.5}
        >
          both curves are centred on μ = {f2(mu)} — stratifying costs no bias
        </text>

        {/* leader + label for the simple-random curve */}
        <line
          x1={dx(mu - 1.25)}
          y1={dy(0.72)}
          x2={dx(mu - 0.72)}
          y2={dy(0.2)}
          stroke={cSrs}
          strokeWidth={1}
        />
        <text
          x={dx(mu - 1.25)}
          y={dy(0.72) - 7}
          textAnchor="middle"
          fontSize={12}
          fill={cSrs}
          fontWeight={600}
        >
          x̄_SRS, sd = {f3(sSrs.sd)}
        </text>
        {/* leader + label for the stratified curve */}
        <line
          x1={dx(mu + 0.34)}
          y1={dy(1.32)}
          x2={dx(mu + 0.2)}
          y2={dy(1.18)}
          stroke={cStr}
          strokeWidth={1}
        />
        <text
          x={dx(mu + 0.37)}
          y={dy(1.32)}
          fontSize={12}
          fill={cStr}
          fontWeight={600}
        >
          x̄_strat, sd = {f3(sStr.sd)}
        </text>
        <text
          x={dx(mu + 0.37)}
          y={dy(1.32) + 16}
          fontSize={11.5}
          fill={cStr}
        >
          {(sSrs.v / sStr.v).toFixed(1)}× less variance, same n
        </text>

        {/* the claim, in numbers measured off the run above */}
        <text
          x={W / 2}
          y={cBase + 42}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12.5}
        >
          Var(x̄_SRS) ≈ (within + between)/n = ({f2(within)} + {f2(between)})/60
          = {f3((within + between) / n)}
        </text>
        <text
          x={W / 2}
          y={cBase + 60}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12.5}
        >
          Var(x̄_strat) ≈ within/n = {f2(within)}/60 = {f3(within / n)} — the
          between term is absent, not smaller
        </text>
      </>
    ),
  });
}
