// Inline SVG figure for c2.2 Part 2: why momentum helps in a ravine.
//
// Nothing here is hand-placed. The two trajectories are produced by iterating
// the exact update rules from the lesson on the quadratic
//
//     L(w) = 1/2 * (LAM_ALONG * w1^2 + LAM_ACROSS * w2^2)
//
// with the same step size and the same start for both optimizers:
//
//     SGD       w <- w - eta * g
//     momentum  v <- beta * v + g,  w <- w - eta * v      (beta = 0.9, as in the lesson)
//
// Step counts, velocity/gradient ratios and every pixel coordinate are computed
// at render time from those loops. Server component, no client JS.
//
// Theming follows src/components/mdx/regression-figures.tsx: currentColor plus
// Tailwind tokens for structure, fixed hues only for the two series.

type Pt = { x: number; y: number };

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
// MomentumRavine — SGD zig-zag vs momentum on an ill-conditioned quadratic.
// ---------------------------------------------------------------------------
export function MomentumRavine({ caption }: { caption?: string }) {
  // ----- the problem -------------------------------------------------------
  const LAM_ALONG = 1; // curvature along the valley floor  (w1)
  const LAM_ACROSS = 100; // curvature across the ravine       (w2)
  const ETA = 0.0185; // largest step SGD survives: eta * LAM_ACROSS = 1.85 < 2
  const BETA = 0.9; // the lesson's momentum coefficient
  const START: Pt = { x: -3.0, y: 0.3 };
  const TARGET_R = 0.25; // "arrived" radius, the same for both optimizers

  // ----- iterate the update rules -----------------------------------------
  function trajectory(useMomentum: boolean, nSteps: number): Pt[] {
    const path: Pt[] = [{ ...START }];
    let x = START.x;
    let y = START.y;
    let vx = 0;
    let vy = 0;
    for (let t = 0; t < nSteps; t++) {
      const gx = LAM_ALONG * x;
      const gy = LAM_ACROSS * y;
      if (useMomentum) {
        vx = BETA * vx + gx;
        vy = BETA * vy + gy;
      } else {
        vx = gx;
        vy = gy;
      }
      x -= ETA * vx;
      y -= ETA * vy;
      path.push({ x, y });
    }
    return path;
  }

  const sgdFull = trajectory(false, 400);
  const momFull = trajectory(true, 400);

  const stepsToTarget = (p: Pt[]) => {
    for (let i = 0; i < p.length; i++) {
      if (Math.hypot(p[i].x, p[i].y) <= TARGET_R) return i;
    }
    return p.length - 1;
  };
  const nSgd = stepsToTarget(sgdFull); // 134
  const nMom = stepsToTarget(momFull); // 14
  const sgd = sgdFull.slice(0, nSgd + 1);
  const mom = momFull.slice(0, nMom + 1);
  const momAfter = momFull.slice(nMom, nMom + 13); // the overshoot, drawn faded
  const speedup = (nSgd / nMom).toFixed(1); // 9.6
  const momMaxX = Math.max(...momFull.slice(0, 40).map((p) => p.x)); // +0.84

  // Velocity vs raw gradient, the mechanism the lesson claims.
  const ratios = (() => {
    let x = START.x;
    let y = START.y;
    let vx = 0;
    let vy = 0;
    const along: number[] = [];
    const across: number[] = [];
    for (let t = 0; t < nMom; t++) {
      const gx = LAM_ALONG * x;
      const gy = LAM_ACROSS * y;
      vx = BETA * vx + gx;
      vy = BETA * vy + gy;
      along.push(Math.abs(vx / gx));
      across.push(Math.abs(vy / gy));
      x -= ETA * vx;
      y -= ETA * vy;
    }
    return { along, across };
  })();
  const alongAt10 = ratios.along[9].toFixed(1); // 10.6 at step 10
  const acrossMax = Math.max(...ratios.across).toFixed(2); // 1.00

  // ----- geometry: ONE scale for both axes ---------------------------------
  const W = 720;
  const PL = 54; // plot left
  const PT = 52; // plot top
  const plotW = 638;
  const X_LO = -3.35;
  const X_HI = 0.95;
  const S = plotW / (X_HI - X_LO); // px per unit, x AND y
  const Y_HI = 0.6;
  const Y_LO = -0.6;
  const plotH = (Y_HI - Y_LO) * S; // height follows from the same S
  const PB = PT + plotH;
  const H = 414;

  const px = (x: number) => PL + (x - X_LO) * S;
  const py = (y: number) => PT + (Y_HI - y) * S;
  const poly = (p: Pt[]) =>
    p.map((q) => `${px(q.x).toFixed(1)},${py(q.y).toFixed(1)}`).join(" ");

  // Contours of L: level c is an ellipse with semi-axes
  // a = sqrt(2c/LAM_ALONG) and b = sqrt(2c/LAM_ACROSS) = a / 10.
  const axisRatio = Math.sqrt(LAM_ACROSS / LAM_ALONG); // 10
  const contours = [0.6, 1.2, 1.8, 2.4, 3.0, 3.6, 4.2, 4.8, 5.4];

  const legend: { color: string; y: number; head: string; body: string[] }[] = [
    {
      color: "#dc2626",
      y: 278,
      head: `gradient descent, η = ${ETA} — ${nSgd} steps to the circle`,
      body: [
        `η is capped by the steep direction: ηλ_across = ${(ETA * LAM_ACROSS).toFixed(2)}, just under the divergence limit of 2.`,
        `So w₂ flips sign every step, while ηλ_along = ${(ETA * LAM_ALONG).toFixed(4)} leaves the floor hundreds of steps long.`,
      ],
    },
    {
      color: "#2563eb",
      y: 332,
      head: `momentum, β = ${BETA}, same η and same start — ${nMom} steps`,
      body: [
        `Across the ravine the gradient flips sign and cancels in v: |v₂| never exceeds one gradient (max ${acrossMax}×).`,
        `Along the floor the sign never changes and v accumulates: |v₁| = ${alongAt10}× the raw gradient by step 10.`,
        `Dashed blue: the following 12 steps, overshooting the minimum to w₁ = +${momMaxX.toFixed(2)} before ringing back.`,
      ],
    },
  ];

  return figureFrame({
    W,
    H,
    caption,
    ariaLabel:
      "Elongated elliptical contours of an ill-conditioned quadratic. Gradient descent zig-zags across the narrow direction and creeps along the valley floor, needing 134 steps to reach a fixed radius around the optimum, while momentum with beta 0.9 and the same step size reaches it in 14.",
    children: (
      <>
        <defs>
          <clipPath id="mr-clip">
            <rect x={PL} y={PT} width={plotW} height={plotH} />
          </clipPath>
        </defs>

        <text
          x={PL}
          y={22}
          className="fill-foreground"
          fontSize={13}
          fontWeight={600}
        >
          One ravine, two optimizers, identical η and identical start
        </text>
        <text x={PL} y={40} className="fill-muted-foreground" fontSize={11.5}>
          L(w) = ½(w₁² + {LAM_ACROSS}w₂²) — curvature {LAM_ACROSS} across,{" "}
          {LAM_ALONG} along, so every contour is {axisRatio.toFixed(0)}× longer
          than it is wide
        </text>

        {/* contours */}
        <g clipPath="url(#mr-clip)">
          {contours.map((a) => (
            <ellipse
              key={`c${a}`}
              cx={px(0)}
              cy={py(0)}
              rx={a * S}
              ry={(a / axisRatio) * S}
              fill="none"
              stroke="#9ca3af"
              strokeWidth={1.1}
              opacity={0.55}
            />
          ))}
          {/* the valley floor itself */}
          <line
            x1={PL}
            y1={py(0)}
            x2={PL + plotW}
            y2={py(0)}
            stroke="#6b7280"
            strokeWidth={1}
            strokeDasharray="5 4"
            opacity={0.8}
          />

          {/* fixed radius both optimizers are timed to */}
          <circle
            cx={px(0)}
            cy={py(0)}
            r={TARGET_R * S}
            fill="none"
            stroke="#6b7280"
            strokeWidth={1.3}
            strokeDasharray="4 3"
          />

          {/* momentum after it has already arrived: the overshoot */}
          <polyline
            points={poly(momAfter)}
            fill="none"
            stroke="#2563eb"
            strokeWidth={1.4}
            strokeDasharray="4 3"
            opacity={0.4}
          />

          {/* gradient descent */}
          <polyline
            points={poly(sgd)}
            fill="none"
            stroke="#dc2626"
            strokeWidth={1.3}
          />
          {sgd.map((p, i) => (
            <circle
              key={`s${i}`}
              cx={px(p.x)}
              cy={py(p.y)}
              r={1.3}
              fill="#dc2626"
              opacity={0.75}
            />
          ))}

          {/* momentum */}
          <polyline
            points={poly(mom)}
            fill="none"
            stroke="#2563eb"
            strokeWidth={1.9}
          />
          {mom.map((p, i) => (
            <circle
              key={`m${i}`}
              cx={px(p.x)}
              cy={py(p.y)}
              r={2.5}
              fill="#2563eb"
            />
          ))}
        </g>

        {/* optimum */}
        <line
          x1={px(0) - 5}
          y1={py(0) - 5}
          x2={px(0) + 5}
          y2={py(0) + 5}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.6}
        />
        <line
          x1={px(0) - 5}
          y1={py(0) + 5}
          x2={px(0) + 5}
          y2={py(0) - 5}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.6}
        />
        <text
          x={px(0) + 2}
          y={py(0) + TARGET_R * S + 15}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
        >
          w* , and the circle ‖w‖ = {TARGET_R}
        </text>

        {/* start */}
        <circle
          cx={px(START.x)}
          cy={py(START.y)}
          r={4.2}
          fill="#f59e0b"
          stroke="#d97706"
          strokeWidth={1}
        />
        <text
          x={px(START.x) + 9}
          y={py(START.y) - 7}
          fontSize={11.5}
          fill="#d97706"
        >
          w₀ = (−3.0, 0.30)
        </text>

        {/* in-plot series labels, placed in the empty bands above and below */}
        <text x={px(-2.0)} y={PT + 22} fontSize={12} fill="#dc2626">
          gradient descent · {nSgd} steps
        </text>
        <text
          x={px(-1.35)}
          y={PT + 40}
          className="fill-muted-foreground"
          fontSize={11}
        >
          one dot = one step
        </text>
        <text x={px(-2.0)} y={PB - 14} fontSize={12} fill="#2563eb">
          momentum, β = {BETA} · {nMom} steps
        </text>

        {/* plot frame */}
        <rect
          x={PL}
          y={PT}
          width={plotW}
          height={plotH}
          fill="none"
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
        />

        {/* axis labels */}
        <text
          x={20}
          y={py(0)}
          textAnchor="middle"
          transform={`rotate(-90 20 ${py(0).toFixed(1)})`}
          className="fill-muted-foreground"
          fontSize={11}
        >
          w₂ — across the ravine
        </text>
        <text
          x={PL + plotW / 2}
          y={PB + 18}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
        >
          w₁ — along the valley floor (axes at equal pixel scale, {S.toFixed(0)}{" "}
          px per unit)
        </text>

        {/* legend and the computed mechanism */}
        {legend.map((row, i) => (
          <g key={`l${i}`} transform={`translate(${PL}, ${row.y})`}>
            <rect x={0} y={-9} width={22} height={3.5} fill={row.color} />
            <text
              x={32}
              y={-5}
              className="fill-foreground"
              fontSize={12}
              fontWeight={600}
            >
              {row.head}
            </text>
            {row.body.map((line, j) => (
              <text
                key={`b${j}`}
                x={32}
                y={12 + j * 15}
                className="fill-muted-foreground"
                fontSize={11.5}
              >
                {line}
              </text>
            ))}
          </g>
        ))}
        <text
          x={PL + 32}
          y={H - 12}
          className="fill-foreground"
          fontSize={12.5}
          fontWeight={600}
        >
          {nSgd} ÷ {nMom} = {speedup}× fewer steps, and 1/(1−β) ={" "}
          {(1 / (1 - BETA)).toFixed(0)}. The speedup is the averaging window.
        </text>
      </>
    ),
  });
}
