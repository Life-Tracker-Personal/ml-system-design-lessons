// Inline SVG figure for c1.7 Part 2: the EM ascent picture (ELBO vs log-likelihood).
//
// Everything drawn here is computed, not sketched. The model is a real 1-D
// two-component Gaussian mixture with only one free parameter, so the whole
// picture is an honest slice of a genuine EM run:
//
//   p(x | θ) = 0.5 · N(x | 0, 1) + 0.5 · N(x | θ, 1)
//
// θ is the mean of the second component; everything else is held fixed. That
// makes log p(x | θ) a curve we can plot exactly, and it makes the M-step a
// closed form (the responsibility-weighted mean), so the ELBO's maximizer is
// solved rather than eyeballed.
//
// Tangency is not drawn in by hand either: with q set to the exact posterior
// at θ_old, ELBO(θ_old) − log p(x | θ_old) = 0 to floating-point precision,
// because the KL gap is identically zero there.
//
// No randomness: the ten data points are a literal array, so server and client
// render identical geometry.

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
// The model. Fixed component at μ₁ = 0; the free parameter θ is μ₂.
// ---------------------------------------------------------------------------
const XS = [-1.2, -0.4, 0.1, 0.5, 1.1, 3.2, 3.8, 4.1, 4.6, 5.2];
const SIG = 1;
const MU1 = 0;
const MIX = 0.5; // π₁ = π₂ = 0.5, held fixed

function normal(x: number, m: number): number {
  return (
    Math.exp(-((x - m) * (x - m)) / (2 * SIG * SIG)) /
    (Math.sqrt(2 * Math.PI) * SIG)
  );
}

// log p(x | θ) — the marginal log-likelihood, the thing EM actually maximizes.
function logLik(th: number): number {
  let t = 0;
  for (const x of XS) t += Math.log(MIX * normal(x, MU1) + MIX * normal(x, th));
  return t;
}

// E-step: γᵢ₂ = posterior probability that point i came from component 2.
function resps(th: number): number[] {
  return XS.map((x) => {
    const a = MIX * normal(x, MU1);
    const b = MIX * normal(x, th);
    return b / (a + b);
  });
}

// ELBO(θ; q) = Σᵢ Σ_z qᵢ(z) [ log p(xᵢ, z | θ) − log qᵢ(z) ].
// Evaluated with q frozen, which is exactly what the M-step maximizes.
function elbo(th: number, g: number[]): number {
  let t = 0;
  for (let i = 0; i < XS.length; i++) {
    const g2 = g[i];
    const g1 = 1 - g2;
    const l1 = Math.log(MIX * normal(XS[i], MU1));
    const l2 = Math.log(MIX * normal(XS[i], th));
    if (g1 > 1e-12) t += g1 * (l1 - Math.log(g1));
    if (g2 > 1e-12) t += g2 * (l2 - Math.log(g2));
  }
  return t;
}

// M-step in closed form: argmax over θ of the frozen ELBO is the
// responsibility-weighted mean of the data.
function mStep(g: number[]): number {
  let num = 0;
  let den = 0;
  for (let i = 0; i < XS.length; i++) {
    num += g[i] * XS[i];
    den += g[i];
  }
  return num / den;
}

export function ElboAscent({ caption }: { caption?: string }) {
  const W = 720;
  const H = 432;

  // ---- plot frame --------------------------------------------------------
  const x0 = 62;
  const x1 = 700;
  const yTop = 52;
  const yBot = 352;
  const TH_LO = 0.0;
  const TH_HI = 6.0;
  const V_LO = -56;
  const V_HI = -14;

  const px = (th: number) => x0 + ((th - TH_LO) / (TH_HI - TH_LO)) * (x1 - x0);
  const py = (v: number) => yBot - ((v - V_LO) / (V_HI - V_LO)) * (yBot - yTop);

  // ---- run EM ------------------------------------------------------------
  const thOld = 0.8;
  const gOld = resps(thOld); // E-step 1
  const thNew = mStep(gOld); // M-step 1  → 2.972
  const gNew = resps(thNew); // E-step 2
  const thNext = mStep(gNew); // M-step 2 → 3.990

  const lOld = logLik(thOld);
  const lNew = logLik(thNew);
  const lNext = logLik(thNext);
  const e1New = elbo(thNew, gOld); // bound after the first M-step

  // ---- curves ------------------------------------------------------------
  const N = 240;
  const grid = Array.from(
    { length: N + 1 },
    (_, i) => TH_LO + ((TH_HI - TH_LO) * i) / N,
  );
  const path = (f: (t: number) => number) =>
    grid
      .map(
        (t, i) =>
          `${i === 0 ? "M" : "L"} ${px(t).toFixed(1)} ${py(f(t)).toFixed(1)}`,
      )
      .join(" ");

  const pLik = path(logLik);
  const pE1 = path((t) => elbo(t, gOld));
  const pE2 = path((t) => elbo(t, gNew));

  const BLUE = "#2563eb";
  const AMBER = "#f59e0b";
  const RED = "#dc2626";
  const GRAY = "#6b7280";

  const yTicks = [-50, -40, -30, -20];
  const xTicks = [1, 2, 3, 4, 5, 6]; // unlabelled marks: θ's scale is arbitrary

  // Vertical drop-lines from a marked point down to the axis. The θ_next line
  // stops short so it does not run through the KL-gap annotation.
  const guides: [number, number][] = [
    [thOld, py(lOld)],
    [thNew, py(lNew)],
    [thNext, 240],
  ];

  const yMidM = (py(lOld) + py(e1New)) / 2;
  const yMidKL = (py(e1New) + py(lNew)) / 2;

  const sub = (s: string) => (
    <tspan fontSize={9.5} dy={3}>
      {s}
    </tspan>
  );

  return figureFrame({
    W,
    H,
    ariaLabel:
      "A parameter axis theta with three curves: the log-likelihood, and two ELBO curves. The first ELBO touches the log-likelihood at theta-old and lies below it elsewhere; its maximum is at theta-new, where the log-likelihood is higher than at theta-old. A second ELBO touches the log-likelihood at theta-new and peaks at the next iterate, forming a staircase.",
    caption,
    children: (
      <>
        <defs>
          <clipPath id="elbo-clip">
            <rect
              x={x0}
              y={yTop - 6}
              width={x1 - x0}
              height={yBot - yTop + 6}
            />
          </clipPath>
          <marker
            id="elbo-arrow-amber"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={AMBER} />
          </marker>
          <marker
            id="elbo-arrow-blue"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={BLUE} />
          </marker>
        </defs>

        {/* ---------------- titles ---------------- */}
        <text
          x={30}
          y={24}
          className="fill-foreground"
          fontSize={13}
          fontWeight={600}
        >
          EM ascent — the E-step makes the bound tight, the M-step climbs it
        </text>
        <text x={30} y={40} className="fill-muted-foreground" fontSize={11}>
          Real 1-D two-component Gaussian mixture; θ is the mean of the second
          component, everything else fixed
        </text>

        {/* ---------------- axes ---------------- */}
        <line
          x1={x0}
          y1={yTop - 4}
          x2={x0}
          y2={yBot}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1.2}
        />
        <line
          x1={x0}
          y1={yBot}
          x2={x1}
          y2={yBot}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1.2}
        />
        {yTicks.map((v) => (
          <g key={`yt${v}`}>
            <line
              x1={x0 - 5}
              y1={py(v)}
              x2={x0}
              y2={py(v)}
              className="text-border"
              stroke="currentColor"
              strokeWidth={1.2}
            />
            <text
              x={x0 - 9}
              y={py(v) + 3.5}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize={11}
            >
              {v}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <line
            key={`xt${t}`}
            x1={px(t)}
            y1={yBot}
            x2={px(t)}
            y2={yBot + 5}
            className="text-border"
            stroke="currentColor"
            strokeWidth={1.2}
          />
        ))}
        <text
          x={20}
          y={210}
          transform="rotate(-90 20 210)"
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11.5}
        >
          value (nats)
        </text>
        <text
          x={x1}
          y={yBot + 34}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={12}
        >
          θ →
        </text>

        {/* ---------------- the staircase legs (dotted) ---------------- */}
        <polyline
          points={`${px(thOld)},${py(lOld)} ${px(thNew)},${py(lOld)}`}
          fill="none"
          stroke={GRAY}
          strokeWidth={1.2}
          strokeDasharray="3 3"
        />
        <polyline
          points={`${px(thNew)},${py(lNew)} ${px(thNext)},${py(lNew)}`}
          fill="none"
          stroke={GRAY}
          strokeWidth={1.2}
          strokeDasharray="3 3"
        />
        <line
          x1={px(thNext)}
          y1={py(lNew)}
          x2={px(thNext)}
          y2={py(lNext)}
          stroke={BLUE}
          strokeWidth={1.6}
          markerEnd="url(#elbo-arrow-blue)"
        />

        {/* ---------------- vertical guides down to the axis ---------------- */}
        {guides.map(([t, yt]: [number, number], i: number) => (
          <line
            key={`g${i}`}
            x1={px(t)}
            y1={yt}
            x2={px(t)}
            y2={yBot}
            stroke={GRAY}
            strokeWidth={1}
            strokeDasharray="2 4"
            opacity={0.85}
          />
        ))}

        {/* ---------------- curves ---------------- */}
        <g clipPath="url(#elbo-clip)">
          <path d={pE1} fill="none" stroke={AMBER} strokeWidth={2.1} />
          <path d={pE2} fill="none" stroke={RED} strokeWidth={2.1} />
          <path d={pLik} fill="none" stroke={BLUE} strokeWidth={2.6} />
        </g>

        {/* ---------------- the two-part rise at θ_new ---------------- */}
        <line
          x1={px(thNew)}
          y1={py(lOld)}
          x2={px(thNew)}
          y2={py(e1New)}
          stroke={AMBER}
          strokeWidth={2.2}
          markerEnd="url(#elbo-arrow-amber)"
        />
        <line
          x1={px(thNew)}
          y1={py(e1New)}
          x2={px(thNew)}
          y2={py(lNew)}
          stroke={BLUE}
          strokeWidth={2.2}
          markerEnd="url(#elbo-arrow-blue)"
        />

        {/* ---------------- tangency and extremum markers ---------------- */}
        {/* tangency 1: ELBO₁ meets log p exactly at θ_old (KL = 0) */}
        <circle
          cx={px(thOld)}
          cy={py(lOld)}
          r={6.5}
          fill="none"
          stroke={AMBER}
          strokeWidth={2}
        />
        <circle cx={px(thOld)} cy={py(lOld)} r={3.6} fill={BLUE} />
        {/* maximum of ELBO₁ — solved, not eyeballed */}
        <circle cx={px(thNew)} cy={py(e1New)} r={4} fill={AMBER} />
        {/* tangency 2: ELBO₂ meets log p exactly at θ_new */}
        <circle
          cx={px(thNew)}
          cy={py(lNew)}
          r={6.5}
          fill="none"
          stroke={RED}
          strokeWidth={2}
        />
        <circle cx={px(thNew)} cy={py(lNew)} r={3.6} fill={BLUE} />
        {/* maximum of ELBO₂ */}
        <circle cx={px(thNext)} cy={py(lNext)} r={3.6} fill={BLUE} />

        {/* ---------------- annotations ---------------- */}
        <text x={78} y={178} className="fill-foreground" fontSize={11.5}>
          E-step: the bound touches
        </text>
        <text x={78} y={193} className="fill-foreground" fontSize={11.5}>
          log p here, KL gap = 0
        </text>
        <line
          x1={140}
          y1={201}
          x2={px(thOld)}
          y2={py(lOld) - 11}
          stroke={GRAY}
          strokeWidth={1}
        />

        <text x={px(thNew) + 14} y={yMidM + 4} fontSize={11.5} fill={AMBER}>
          M-step raises the bound
        </text>
        <text x={px(thNew) + 14} y={yMidKL - 4} fontSize={11.5} fill={BLUE}>
          KL gap: log p sits above
        </text>
        <text x={px(thNew) + 14} y={yMidKL + 11} fontSize={11.5} fill={BLUE}>
          the bound, so it rose too
        </text>

        <text
          x={px(thNext) + 14}
          y={62}
          className="fill-muted-foreground"
          fontSize={11.5}
        >
          second E-step: the red bound
        </text>
        <text
          x={px(thNext) + 14}
          y={77}
          className="fill-muted-foreground"
          fontSize={11.5}
        >
          {"is tight at θ"}
          <tspan fontSize={9.5} dy={3}>
            new
          </tspan>
          <tspan dy={-3}>{", and its max is θ"}</tspan>
          <tspan fontSize={9.5} dy={3}>
            next
          </tspan>
        </text>

        {/* ---------------- θ labels under the axis ---------------- */}
        <text
          x={px(thOld)}
          y={yBot + 34}
          textAnchor="middle"
          fontSize={12}
          className="fill-foreground"
          fontWeight={600}
        >
          θ{sub("old")}
        </text>
        <text
          x={px(thNew)}
          y={yBot + 34}
          textAnchor="middle"
          fontSize={12}
          className="fill-foreground"
          fontWeight={600}
        >
          θ{sub("new")}
        </text>
        <text
          x={px(thNext)}
          y={yBot + 34}
          textAnchor="middle"
          fontSize={12}
          className="fill-foreground"
          fontWeight={600}
        >
          θ{sub("next")}
        </text>

        {/* ---------------- legend ---------------- */}
        {(
          [
            [BLUE, "log p(x | θ)", "", 92],
            [AMBER, "ELBO with q at θ", "old", 250],
            [RED, "ELBO with q at θ", "new", 448],
          ] as [string, string, string, number][]
        ).map(([c, label, tail, lx]) => (
          <g key={label + tail}>
            <line
              x1={lx}
              y1={410}
              x2={lx + 22}
              y2={410}
              stroke={c}
              strokeWidth={2.6}
            />
            <text
              x={lx + 29}
              y={414}
              className="fill-muted-foreground"
              fontSize={11.5}
            >
              {label}
              {tail ? sub(tail) : null}
            </text>
          </g>
        ))}
      </>
    ),
  });
}
