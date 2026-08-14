// Inline SVG figure for c2.3 Part 1 — the six loss-curve shapes as a lookup table.
//
// Server component, no client JS. Every curve is COMPUTED at render time, not
// hand-placed: the flat / gap / underfit panels come from closed-form learning
// curves plus a seeded Mulberry32 noise stream, and the NaN panel is an actual
// gradient-descent run on a two-mode quadratic whose stiff curvature sharpens
// until eta*lambda crosses 2 and the iterate blows past the fp32 max.
//
// Design tokens follow src/components/mdx/regression-figures.tsx: theme-aware
// currentColor/fill classes for structure, fixed hues only for the data series.

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

const RED = "#dc2626"; // train
const BLUE = "#2563eb"; // validation
const AMBER = "#d97706"; // annotations
const GRAY = "#6b7280";
const LGRAY = "#9ca3af";

export function LossCurveShapes({ caption }: { caption?: string }) {
  // ---------------- layout ----------------
  const CELL_W = 262;
  const CELL_H = 222;
  const ROW_GAP = 4;
  const GRID_X = 6;
  const GRID_Y = 32;
  const W = 798;
  const H = GRID_Y + 2 * CELL_H + ROW_GAP + 2; // 482

  const PW = 200; // plot width, in px
  const PH = 116; // plot height, in px
  const cellX = (c: number) => GRID_X + c * CELL_W;
  const cellY = (r: number) => GRID_Y + r * (CELL_H + ROW_GAP);

  // ---------------- shared scales ----------------
  const TSTEPS = 3000; // every panel spans the same 3000 optimizer steps
  const YMAX = 2.6; // every panel shares the same loss axis, 0 .. 2.6
  const YCLAMP = 2.95; // values above this are parked off-panel and clipped
  const LNC = Math.log(10); // 2.302585 — the step-0 loss for C = 10 classes
  const NT = 241; // train is logged every 12.5 steps
  const NV = 31; // validation is evaluated every 100 steps

  const grid = (n: number) => Array.from({ length: n }, (_, i) => i / (n - 1));
  const sT = grid(NT);
  const sV = grid(NV);

  // ---------------- panel 1: flat from step zero ----------------
  // Loss pinned at ln C plus logging noise; the dashed variant drops once and
  // then pins at a higher-than-final plateau.
  const r1 = rng(101);
  const p1Train = sT.map(() => LNC + 0.022 * gauss(r1));
  const p1Val = sV.map(() => LNC + 0.012 * gauss(r1));
  const p1Var = sT.map(
    (s) => 1.62 + (LNC - 1.62) * Math.exp(-s / 0.045) + 0.015 * gauss(r1),
  );

  // ---------------- panel 2: a spike mid-run ----------------
  // Ordinary exponential decay plus one additive excursion that jumps to 7.0
  // at step 1650 and relaxes with a 105-step time constant.
  const r2 = rng(202);
  const base2 = (s: number) => 0.38 + (LNC - 0.38) * Math.exp(-s / 0.16);
  const S0 = 0.55; // spike onset, exactly on the sample grid (index 132/240)
  const WSP = 0.035; // relaxation width, in units of the full run
  const SPIKE_PEAK = 7.0; // "an order of magnitude" above the local loss
  const A2 = SPIKE_PEAK - base2(S0);
  const spike = (s: number) => (s < S0 ? 0 : A2 * Math.exp(-(s - S0) / WSP));
  const p2Train = sT.map((s) => base2(s) + spike(s) + 0.028 * gauss(r2));
  const p2Val = sV.map(
    (s) => base2(s) + 0.07 + 0.9 * spike(s) + 0.018 * gauss(r2),
  );

  // ---------------- panel 3: diverging to NaN ----------------
  // Real gradient descent, w <- w(1 - eta*lambda), on f(w) = 1/2 sum lambda_k w_k^2.
  // Mode 1 is well conditioned and produces the visible early decay. Mode 2
  // sharpens as training proceeds, eta*lambda_2 crosses 2, and the iterate
  // grows geometrically until the loss passes the fp32 maximum.
  const FP32MAX = 3.4028235e38;
  const eta = 1e-3;
  const lam1 = 1.27;
  const lam2_0 = 1400;
  const sharpen = 1 / 1200; // lambda_2(t) = lam2_0 * (1 + t*sharpen)
  const trace: number[] = [];
  {
    let w1 = Math.sqrt((2 * LNC) / lam1); // so the run starts at exactly ln C
    let w2 = 1e-3;
    for (let t = 0; t <= TSTEPS; t++) {
      const lam2 = lam2_0 * (1 + t * sharpen);
      trace.push(0.5 * lam1 * w1 * w1 + 0.5 * lam2 * w2 * w2);
      w1 *= 1 - eta * lam1;
      w2 *= 1 - eta * lam2;
    }
  }
  const exitStep = trace.findIndex((L, t) => t > 5 && L > YMAX); // leaves the panel
  const nanStep = trace.findIndex((L) => !(L < FP32MAX)); // first non-finite
  const r3 = rng(303);
  const p3Train = sT
    .map((s) => {
      const t = Math.round(s * TSTEPS);
      return { t, L: Math.max(0.02, trace[t] + 0.02 * gauss(r3)) };
    })
    .filter((d) => d.t <= nanStep)
    .map((d) => d.L);
  const p3Val = sV
    .map((s) => {
      const t = Math.round(s * TSTEPS);
      return { t, L: Math.max(0.02, trace[t] + 0.08 + 0.012 * gauss(r3)) };
    })
    .filter((d) => d.t <= nanStep)
    .map((d) => d.L);
  // both series are truncated at the NaN, so they span less than the full axis
  const p3TrainSpan = (p3Train.length - 1) / (NT - 1);
  const p3ValSpan = (p3Val.length - 1) / (NV - 1);

  // ---------------- panel 4: train down, validation up ----------------
  const r4 = rng(404);
  // Train decays slightly faster than validation, so validation stays above it
  // the whole run — panel 6 is the only panel where the two cross over.
  const tr4 = (s: number) => 0.1 + (LNC - 0.1) * Math.exp(-s / 0.13);
  const va4 = (s: number) =>
    0.6 + (LNC - 0.6) * Math.exp(-s / 0.115) + 0.62 * Math.max(0, s - 0.25);
  const p4Train = sT.map((s) => tr4(s) + 0.02 * gauss(r4));
  const p4Val = sV.map((s) => va4(s) + 0.014 * gauss(r4));
  // early-stopping point = argmin of the noiseless validation curve
  let sStop = 0;
  {
    let best = Infinity;
    for (const s of sT) {
      const v = va4(s);
      if (v < best) {
        best = v;
        sStop = s;
      }
    }
  }
  const vStop = va4(sStop);

  // ---------------- panel 5: both stuck high ----------------
  const r5 = rng(505);
  const p5Train = sT.map(
    (s) => 1.72 + (LNC - 1.72) * Math.exp(-s / 0.1) + 0.018 * gauss(r5),
  );
  const p5Val = sV.map(
    (s) => 1.8 + (LNC - 1.8) * Math.exp(-s / 0.1) + 0.011 * gauss(r5),
  );

  // ---------------- panel 6: validation below train ----------------
  const r6 = rng(606);
  const p6Train = sT.map(
    (s) => 0.62 + (LNC - 0.62) * Math.exp(-s / 0.2) + 0.024 * gauss(r6),
  );
  const p6Val = sV.map(
    (s) => 0.4 + (LNC - 0.4) * Math.exp(-s / 0.17) + 0.012 * gauss(r6),
  );

  // ---------------- drawing helpers ----------------
  type Geo = { px0: number; py0: number; py1: number };

  const yOf = (g: Geo, L: number) =>
    g.py1 - (Math.min(L, YCLAMP) / YMAX) * PH;

  // vals are evenly spaced over [0, span] of the step axis
  const pathOf = (g: Geo, vals: number[], span = 1) =>
    vals
      .map((L, i) => {
        const f = vals.length === 1 ? 0 : (i / (vals.length - 1)) * span;
        return `${i === 0 ? "M" : "L"} ${(g.px0 + f * PW).toFixed(1)} ${yOf(g, L).toFixed(1)}`;
      })
      .join(" ");

  const panel = (
    idx: number,
    title: string,
    diag: string[],
    train: number[],
    val: number[],
    extra?: (g: Geo) => React.ReactNode,
    trainSpan = 1,
    valSpan = 1,
  ) => {
    const c = idx % 3;
    const r = Math.floor(idx / 3);
    const x0 = cellX(c);
    const y0 = cellY(r);
    const g: Geo = { px0: x0 + 50, py0: y0 + 26, py1: y0 + 142 };
    const clipId = `lcs-clip-${idx}`;
    const ticks: [number, string][] = [
      [0, "0"],
      [1, "1"],
      [LNC, "2.30"],
    ];
    const xticks: [number, string][] = [
      [0, "0"],
      [1 / 3, "1k"],
      [2 / 3, "2k"],
      [1, "3k"],
    ];

    return (
      <g key={`panel-${idx}`}>
        <clipPath id={clipId}>
          <rect
            x={g.px0 - 2}
            y={g.py0}
            width={PW + 4}
            height={PH + 2}
          />
        </clipPath>

        <text
          x={x0 + 13}
          y={y0 + 14}
          className="fill-foreground"
          fontSize={12.5}
          fontWeight={600}
        >
          {idx + 1}. {title}
        </text>

        {/* plot frame */}
        <rect
          x={g.px0}
          y={g.py0}
          width={PW}
          height={PH}
          fill="none"
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.75}
        />

        {/* ln C reference line — the loss a correctly initialized C=10 net prints */}
        <line
          x1={g.px0}
          y1={yOf(g, LNC)}
          x2={g.px0 + PW}
          y2={yOf(g, LNC)}
          stroke={LGRAY}
          strokeWidth={1}
          strokeDasharray="2 3"
        />

        {/* y ticks */}
        {ticks.map(([L, lab]) => (
          <g key={`yt-${idx}-${lab}`}>
            <line
              x1={g.px0 - 4}
              y1={yOf(g, L)}
              x2={g.px0}
              y2={yOf(g, L)}
              className="text-border"
              stroke="currentColor"
              strokeWidth={1}
            />
            <text
              x={g.px0 - 7}
              y={yOf(g, L) + 3.8}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize={11}
            >
              {lab}
            </text>
          </g>
        ))}
        <text
          x={x0 + 13}
          y={g.py0 + PH / 2}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
          transform={`rotate(-90 ${x0 + 13} ${g.py0 + PH / 2})`}
        >
          loss
        </text>

        {/* x ticks */}
        {xticks.map(([f, lab]) => (
          <g key={`xt-${idx}-${lab}`}>
            <line
              x1={g.px0 + f * PW}
              y1={g.py1}
              x2={g.px0 + f * PW}
              y2={g.py1 + 4}
              className="text-border"
              stroke="currentColor"
              strokeWidth={1}
            />
            <text
              x={g.px0 + f * PW}
              y={g.py1 + 16}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={11}
            >
              {lab}
            </text>
          </g>
        ))}
        <text
          x={g.px0 + PW / 2}
          y={g.py1 + 30}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
        >
          steps
        </text>

        {/* the two series, clipped to the panel */}
        <g clipPath={`url(#${clipId})`}>
          <path
            d={pathOf(g, val, valSpan)}
            fill="none"
            stroke={BLUE}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <path
            d={pathOf(g, train, trainSpan)}
            fill="none"
            stroke={RED}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          {extra ? extra(g) : null}
        </g>

        {/* diagnosis */}
        {diag.map((line, i) => (
          <text
            key={`d-${idx}-${i}`}
            x={x0 + 13}
            y={y0 + 188 + i * 13}
            className="fill-muted-foreground"
            fontSize={11.5}
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  // ---------------- legend ----------------
  const legend = (x: number, swatch: React.ReactNode, label: string) => (
    <g transform={`translate(${x}, 0)`}>
      {swatch}
      <text
        x={25}
        y={22}
        className="fill-muted-foreground"
        fontSize={11.5}
      >
        {label}
      </text>
    </g>
  );

  return figureFrame({
    W,
    H,
    ariaLabel:
      "A two-by-three grid of small loss-curve panels, each with a red training curve and a blue validation curve on identical axes of 0 to 3000 steps and loss 0 to 2.6: flat at ln C, a mid-run spike, a run diverging to NaN, training falling while validation rises, both curves stuck high and flat, and validation sitting below training. A one-line diagnosis sits under each panel.",
    caption,
    children: (
      <>
        {legend(
          14,
          <line x1={0} y1={18} x2={20} y2={18} stroke={RED} strokeWidth={1.8} />,
          "train",
        )}
        {legend(
          93,
          <line
            x1={0}
            y1={18}
            x2={20}
            y2={18}
            stroke={BLUE}
            strokeWidth={1.8}
          />,
          "validation",
        )}
        {legend(
          200,
          <line
            x1={0}
            y1={18}
            x2={20}
            y2={18}
            stroke={LGRAY}
            strokeWidth={1}
            strokeDasharray="2 3"
          />,
          "ln C = 2.303, the step-0 loss for C = 10",
        )}
        {legend(
          462,
          <text x={4} y={22} fontSize={12.5} fill={AMBER} fontWeight={600}>
            ↑
          </text>,
          "the curve leaves the top of the panel",
        )}

        {/* ---- 1. Flat from step zero ---- */}
        {panel(
          0,
          "Flat from step zero",
          [
            "Sitting at ln C. LR≈0, optimizer built on",
            "the wrong params, or labels shuffled.",
            "Dashed: flat after a drop — read ‖g‖.",
          ],
          p1Train,
          p1Val,
          (g) => (
            <>
              <path
                d={pathOf(g, p1Var)}
                fill="none"
                stroke={LGRAY}
                strokeWidth={1.4}
                strokeDasharray="4 3"
              />
              <text
                x={g.px0 + PW - 4}
                y={yOf(g, 1.62) - 7}
                textAnchor="end"
                fill={GRAY}
                fontSize={11}
              >
                flat after a drop
              </text>
            </>
          ),
        )}

        {/* ---- 2. A spike mid-run ---- */}
        {panel(
          1,
          "A spike mid-run",
          [
            "Jumps an order of magnitude, then",
            "recovers. Data × optimizer state, not a",
            "bad batch. Clip by norm; skip the step.",
          ],
          p2Train,
          p2Val,
          (g) => (
            <text
              x={g.px0 + PW - 4}
              y={g.py0 + 25}
              textAnchor="end"
              fill={AMBER}
              fontSize={11.5}
              fontWeight={600}
            >
              ↑ peak ≈ {SPIKE_PEAK.toFixed(1)}
            </text>
          ),
        )}

        {/* ---- 3. Diverging to NaN ---- */}
        {panel(
          2,
          "Diverging to NaN",
          [
            "LR above the stability threshold, or fp16",
            "overflow. The first non-finite activation",
            "is the source — parameter NaNs spread.",
          ],
          p3Train,
          p3Val,
          (g) => (
            <text
              x={g.px0 + (exitStep / TSTEPS) * PW + 6}
              y={g.py0 + 25}
              fill={AMBER}
              fontSize={11.5}
              fontWeight={600}
            >
              ↑ NaN by step {Math.round(nanStep / 10) * 10}
            </text>
          ),
          p3TrainSpan,
          p3ValSpan,
        )}

        {/* ---- 4. Train down, validation up ---- */}
        {panel(
          3,
          "Train down, validation up",
          [
            "Overfitting: train falls, val turns up.",
            "More data → augment → weight decay →",
            "dropout → early stop → smaller model.",
          ],
          p4Train,
          p4Val,
          (g) => {
            const xs = g.px0 + sStop * PW;
            const xg = g.px0 + 0.93 * PW;
            return (
              <>
                <line
                  x1={xs}
                  y1={g.py0}
                  x2={xs}
                  y2={g.py1}
                  stroke={AMBER}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle cx={xs} cy={yOf(g, vStop)} r={3} fill={AMBER} />
                <text
                  x={xs + 5}
                  y={g.py0 + 25}
                  fill={AMBER}
                  fontSize={11}
                  fontWeight={600}
                >
                  early stop
                </text>
                <line
                  x1={xg}
                  y1={yOf(g, va4(0.93))}
                  x2={xg}
                  y2={yOf(g, tr4(0.93))}
                  stroke={AMBER}
                  strokeWidth={1.4}
                  markerStart="url(#lcs-arrow)"
                  markerEnd="url(#lcs-arrow)"
                />
                <text
                  x={xg - 5}
                  y={(yOf(g, va4(0.93)) + yOf(g, tr4(0.93))) / 2 + 4}
                  textAnchor="end"
                  fill={AMBER}
                  fontSize={11}
                  fontWeight={600}
                >
                  gap
                </text>
              </>
            );
          },
        )}

        {/* ---- 5. Both stuck high ---- */}
        {panel(
          4,
          "Both stuck high",
          [
            "Underfitting: both high, both flat.",
            "Prove the optimization works first —",
            "overfit a single batch of 8.",
          ],
          p5Train,
          p5Val,
        )}

        {/* ---- 6. Validation below train ---- */}
        {panel(
          5,
          "Validation below train",
          [
            "Not underfitting. Dropout and BN on at",
            "train, train loss averaged over the epoch,",
            "augmentation on train only.",
          ],
          p6Train,
          p6Val,
        )}

        <defs>
          <marker
            id="lcs-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={AMBER} />
          </marker>
        </defs>
      </>
    ),
  });
}
