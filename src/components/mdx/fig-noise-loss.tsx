// Inline SVG figure for c1.2 ("Loss functions"): the spine claim that every
// regression loss is a noise model, drawn literally.
//
// Server component, no client JS, no charting library. Every number printed in
// the figure is computed here from the closed-form densities — the additive
// constants, the tangent slopes at r = 4, and the tail probability ratio are
// all derived, never typed in by hand.
//
// Colour convention matches src/components/mdx/loss-chart.tsx so the two
// figures in this lesson read as one story:
//   Gaussian → MSE  = red #dc2626
//   Laplace  → MAE  = blue #2563eb
//   Student-t → robust regression = amber #d97706

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

// --- the three noise log-densities, exactly normalized -----------------------
// Gaussian, sigma = 1
const logpGauss = (r: number) => -0.5 * r * r - 0.5 * Math.log(2 * Math.PI);
// Laplace, b = 1
const logpLaplace = (r: number) => -Math.abs(r) - Math.log(2);
// Student-t, nu = 3.  Normalizer = Gamma(2) / (sqrt(3*pi) * Gamma(3/2))
//                                = 1 / (sqrt(3*pi) * sqrt(pi)/2) = 2/(pi*sqrt(3))
const T_NU = 3;
const T_NORM = 2 / (Math.PI * Math.sqrt(3));
const logpStudent = (r: number) =>
  Math.log(T_NORM) - ((T_NU + 1) / 2) * Math.log(1 + (r * r) / T_NU);

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
// 0.00916 -> "9.2·10⁻³"
function sci(v: number): string {
  const [mant, exp] = v.toExponential(1).split("e");
  const n = Number(exp);
  const digits = String(Math.abs(n))
    .split("")
    .map((d) => SUP[Number(d)])
    .join("");
  return `${mant}·10${n < 0 ? "⁻" : ""}${digits}`;
}

export function NoiseModelToLoss({ caption }: { caption?: string }) {
  // ---- geometry -----------------------------------------------------------
  const W = 720;
  const H = 568;
  const S = 16; // px per unit — IDENTICAL on the residual axis and the nats axis
  const R0 = -6;
  const R1 = 6;
  const V = 10; // vertical span in nats: log p from -10..0, loss from 0..10
  const PW = (R1 - R0) * S; // 192
  const PH = V * S; // 160

  const TITLE_Y = 26;
  const DENS_Y = 41;
  const TOP1 = 50;
  const BOT1 = TOP1 + PH; // 210
  const ARR_Y0 = 220;
  const ARR_Y1 = 244;
  const LOSS_Y = 262;
  const TAG_Y = 277;
  const TOP2 = 286;
  const BOT2 = TOP2 + PH; // 446
  const TICK_Y = 461;
  const XLAB_Y = 477;
  const T1 = 498;
  const T2 = 518;
  const T3 = 536;
  const T4 = 554;

  const X0 = [52, 274, 496];

  const xPx = (r: number, x0: number) => x0 + (r - R0) * S;
  const yTop = (v: number) => TOP1 - v * S; // v is log p, negative → downward
  const yBot = (v: number) => BOT2 - v * S; // v is loss, positive → upward

  // ---- the residual we interrogate ---------------------------------------
  const RM = 4;

  // Numeric central difference, so the printed slopes are measured off the
  // actual loss functions rather than asserted.
  const slopeAt = (loss: (r: number) => number, r: number) => {
    const h = 1e-5;
    return (loss(r + h) - loss(r - h)) / (2 * h);
  };

  const COLS = [
    {
      key: "gauss",
      color: "#dc2626",
      title: "Gaussian  (σ = 1)",
      dens: "log p(r) = −r²/2 − ½ log 2π",
      lossPrefix: "−log p = ½r² + ",
      tag: "≡ MSE",
      logp: logpGauss,
    },
    {
      key: "laplace",
      color: "#2563eb",
      title: "Laplace  (b = 1)",
      dens: "log p(r) = −|r| − log 2",
      lossPrefix: "−log p = |r| + ",
      tag: "≡ MAE",
      logp: logpLaplace,
    },
    {
      key: "student",
      color: "#d97706",
      title: "Student-t  (ν = 3)",
      dens: "log p(r) = −2 log(1 + r²/3) − c",
      lossPrefix: "−log p = 2 log(1+r²/3) + ",
      tag: "≡ robust regression",
      logp: logpStudent,
    },
  ].map((c) => {
    const loss = (r: number) => -c.logp(r);
    return {
      ...c,
      loss,
      const0: loss(0), // the additive constant the lesson drops
      slope: slopeAt(loss, RM),
      lossAtRM: loss(RM),
      pAtRM: Math.exp(c.logp(RM)),
    };
  });

  // How much more probable a residual of 4 is under the heavy tails.
  const ratioLap = Math.exp(logpLaplace(RM) - logpGauss(RM));

  // ---- curve sampling -----------------------------------------------------
  // Clamp well outside the clip rect so the visible portion stays exact while
  // the off-panel excursions do not blow the coordinate numbers up.
  const curve = (
    f: (r: number) => number,
    x0: number,
    toY: (v: number) => number,
    lo: number,
    hi: number,
  ) => {
    const N = 480; // r = 0 lands exactly on a sample, so Laplace's kink is sharp
    const pts: string[] = [];
    for (let i = 0; i <= N; i++) {
      const r = R0 + ((R1 - R0) * i) / N;
      const y = Math.min(hi, Math.max(lo, toY(f(r))));
      pts.push(`${xPx(r, x0).toFixed(2)},${y.toFixed(2)}`);
    }
    return "M" + pts.join("L");
  };

  const gridTop = [-2, -4, -6, -8];
  const gridBot = [2, 4, 6, 8];
  const xTicks = [-6, -3, 0, 3, 6];

  const panelRect = (x0: number, top: number) => (
    <rect
      x={x0}
      y={top}
      width={PW}
      height={PH}
      className="text-border"
      stroke="currentColor"
      strokeWidth={1}
      fill="none"
      opacity={0.6}
      rx={3}
    />
  );

  return figureFrame({
    W,
    H,
    ariaLabel:
      "A two-row, three-column figure. The top row plots the log-density of Gaussian, Laplace and Student-t noise against the residual. The bottom row plots the corresponding loss, the negative log-density, directly beneath each one, so each bottom curve is the top curve reflected about the horizontal axis. Tangent lines drawn at a residual of 4 show slopes of 4.00 for the Gaussian, 1.00 for the Laplace and 0.84 for the Student-t.",
    caption,
    children: (
      <>
        <defs>
          <marker
            id="nml-arrow"
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="5.5"
            markerHeight="5.5"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#6b7280" />
          </marker>
          {COLS.map((_c, j) => (
            <clipPath key={`ct${j}`} id={`nml-clip-top-${j}`}>
              <rect x={X0[j]} y={TOP1} width={PW} height={PH} />
            </clipPath>
          ))}
          {COLS.map((_c, j) => (
            <clipPath key={`cb${j}`} id={`nml-clip-bot-${j}`}>
              <rect x={X0[j]} y={TOP2} width={PW} height={PH} />
            </clipPath>
          ))}
        </defs>

        {/* ---------------- row labels ---------------- */}
        <text
          x={18}
          y={TOP1 + PH / 2}
          textAnchor="middle"
          transform={`rotate(-90 18 ${TOP1 + PH / 2})`}
          className="fill-foreground"
          fontSize={11.5}
          fontWeight={600}
        >
          noise log-density  log p(r)
        </text>
        <text
          x={18}
          y={TOP2 + PH / 2}
          textAnchor="middle"
          transform={`rotate(-90 18 ${TOP2 + PH / 2})`}
          className="fill-foreground"
          fontSize={11.5}
          fontWeight={600}
        >
          loss  −log p(r)
        </text>

        {/* ---------------- y tick labels (leftmost column only) ------------- */}
        {gridTop.map((v) => (
          <text
            key={`yt${v}`}
            x={X0[0] - 6}
            y={yTop(v) + 3.6}
            textAnchor="end"
            className="fill-muted-foreground"
            fontSize={11}
          >
            {`−${Math.abs(v)}`}
          </text>
        ))}
        <text
          x={X0[0] - 6}
          y={yTop(0) + 3.6}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={11}
        >
          0
        </text>
        {gridBot.map((v) => (
          <text
            key={`yb${v}`}
            x={X0[0] - 6}
            y={yBot(v) + 3.6}
            textAnchor="end"
            className="fill-muted-foreground"
            fontSize={11}
          >
            {v}
          </text>
        ))}
        <text
          x={X0[0] - 6}
          y={yBot(0) + 3.6}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={11}
        >
          0
        </text>

        {/* ---------------- per-column content ---------------- */}
        {COLS.map((c, j) => {
          const x0 = X0[j];
          const cx = x0 + PW / 2;
          const mx = xPx(RM, x0);
          const myTop = yTop(c.logp(RM));
          const myBot = yBot(c.lossAtRM);
          // Tangent to the loss at r = RM, half-width 1.5 residual units.
          const hw = 1.5;
          const tx1 = xPx(RM - hw, x0);
          const ty1 = yBot(c.lossAtRM - hw * c.slope);
          const tx2 = xPx(RM + hw, x0);
          const ty2 = yBot(c.lossAtRM + hw * c.slope);

          return (
            <g key={c.key}>
              {/* headers */}
              <text
                x={cx}
                y={TITLE_Y}
                textAnchor="middle"
                fontSize={12.5}
                fontWeight={600}
                fill={c.color}
              >
                {c.title}
              </text>
              <text
                x={cx}
                y={DENS_Y}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={11}
              >
                {c.dens}
              </text>

              {/* ---------- top panel: the log-density ---------- */}
              {panelRect(x0, TOP1)}
              {gridTop.map((v) => (
                <line
                  key={`gt${v}`}
                  x1={x0}
                  y1={yTop(v)}
                  x2={x0 + PW}
                  y2={yTop(v)}
                  className="text-border"
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                  opacity={0.45}
                />
              ))}
              <line
                x1={xPx(0, x0)}
                y1={TOP1}
                x2={xPx(0, x0)}
                y2={BOT1}
                className="text-border"
                stroke="currentColor"
                strokeWidth={1}
                opacity={0.55}
              />
              <line
                x1={mx}
                y1={TOP1}
                x2={mx}
                y2={BOT1}
                stroke={c.color}
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.55}
              />
              <text
                x={mx + 4}
                y={TOP1 + 12}
                fontSize={10}
                fill={c.color}
                opacity={0.9}
              >
                r = {RM}
              </text>
              <g clipPath={`url(#nml-clip-top-${j})`}>
                <path
                  d={curve(c.logp, x0, yTop, TOP1 - 24, BOT1 + 24)}
                  fill="none"
                  stroke={c.color}
                  strokeWidth={2.1}
                  strokeLinejoin="round"
                />
              </g>
              <circle cx={mx} cy={myTop} r={3} fill={c.color} />

              {/* ---------- the flip ---------- */}
              <line
                x1={cx}
                y1={ARR_Y0}
                x2={cx}
                y2={ARR_Y1}
                stroke="#6b7280"
                strokeWidth={1.4}
                markerEnd="url(#nml-arrow)"
              />
              <text
                x={cx + 9}
                y={ARR_Y0 + 16}
                fontSize={10.5}
                fill="#6b7280"
              >
                ×(−1)
              </text>

              {/* ---------- the loss it becomes ---------- */}
              <text
                x={cx}
                y={LOSS_Y}
                textAnchor="middle"
                fontSize={11.5}
                fontWeight={600}
                fill={c.color}
              >
                {c.lossPrefix}
                {c.const0.toFixed(2)}
              </text>
              <text
                x={cx}
                y={TAG_Y}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={11}
              >
                {c.tag}
              </text>

              {/* ---------- bottom panel: the loss ---------- */}
              {panelRect(x0, TOP2)}
              {gridBot.map((v) => (
                <line
                  key={`gb${v}`}
                  x1={x0}
                  y1={yBot(v)}
                  x2={x0 + PW}
                  y2={yBot(v)}
                  className="text-border"
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                  opacity={0.45}
                />
              ))}
              <line
                x1={xPx(0, x0)}
                y1={TOP2}
                x2={xPx(0, x0)}
                y2={BOT2}
                className="text-border"
                stroke="currentColor"
                strokeWidth={1}
                opacity={0.55}
              />
              <line
                x1={mx}
                y1={TOP2}
                x2={mx}
                y2={BOT2}
                stroke={c.color}
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.55}
              />
              <g clipPath={`url(#nml-clip-bot-${j})`}>
                <path
                  d={curve(c.loss, x0, yBot, TOP2 - 24, BOT2 + 24)}
                  fill="none"
                  stroke={c.color}
                  strokeWidth={2.1}
                  strokeLinejoin="round"
                />
                {/* tangent at r = 4 — with equal px/unit on both axes this
                    segment renders at its true angle */}
                <line
                  x1={tx1}
                  y1={ty1}
                  x2={tx2}
                  y2={ty2}
                  stroke="#6b7280"
                  strokeWidth={1.6}
                  strokeDasharray="5 3"
                />
              </g>
              <circle cx={mx} cy={myBot} r={3} fill={c.color} />
              <text
                x={mx - 10}
                y={TOP2 + 18}
                textAnchor="end"
                fontSize={11}
                fontWeight={600}
                fill="#6b7280"
              >
                slope {c.slope.toFixed(2)}
              </text>

              {/* ---------- x axis ---------- */}
              {xTicks.map((t) => (
                <text
                  key={`xt${t}`}
                  x={xPx(t, x0)}
                  y={TICK_Y}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize={11}
                >
                  {t < 0 ? `−${Math.abs(t)}` : t}
                </text>
              ))}
              <text
                x={cx}
                y={XLAB_Y}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={11}
              >
                residual r
              </text>
            </g>
          );
        })}

        {/* ---------------- the takeaway ---------------- */}
        <text
          x={W / 2}
          y={T1}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={13}
          fontWeight={600}
        >
          Bottom row = top row flipped about the r-axis. The loss IS −log p(r).
        </text>
        <text
          x={W / 2}
          y={T2}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={12}
        >
          A residual of r = {RM} has probability {sci(COLS[0].pAtRM)} under the
          Gaussian but {sci(COLS[1].pAtRM)} under Laplace —{" "}
          {Math.round(ratioLap)}× more likely.
        </text>
        <text
          x={W / 2}
          y={T3}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={12}
        >
          Loss slope there: {COLS[0].slope.toFixed(2)} ·{" "}
          {COLS[1].slope.toFixed(2)} · {COLS[2].slope.toFixed(2)} — and the
          Student-t slope keeps falling toward 0.
        </text>
        <text
          x={W / 2}
          y={T4}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={12}
        >
          That slope is the pull one residual exerts on the fit. Light tails
          chase outliers; heavy tails let them go.
        </text>
      </>
    ),
  });
}
