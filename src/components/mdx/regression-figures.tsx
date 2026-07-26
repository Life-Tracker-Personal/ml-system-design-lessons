// Inline SVG figures for the linear- and logistic-regression lesson (c1.4).
// Every figure is a server component with no client JS: shapes are computed
// from closed forms or from a deterministic LCG so builds are reproducible
// (Math.random is banned in server-rendered artifacts of this project).
//
// Design tokens follow src/components/mdx/loss-chart.tsx: theme-aware
// currentColor/fill classes for structural marks, hard-coded hues only for
// distinct series legibility on both light and dark card backgrounds.

type Pt = { x: number; y: number };

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
// 1. OLSFit — scatter with fitted OLS line and residual verticals
// ---------------------------------------------------------------------------
export function OLSFit({ caption }: { caption?: string }) {
  const W = 560;
  const H = 340;
  const pad = { top: 18, right: 18, bottom: 42, left: 46 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  // True line y = 1 + 0.6 x + noise on x ∈ [0, 10].
  const r = rng(1729);
  const n = 40;
  const beta0True = 1;
  const beta1True = 0.6;
  const points: Pt[] = Array.from({ length: n }, () => {
    const x = r() * 10;
    const y = beta0True + beta1True * x + gauss(r) * 0.9;
    return { x, y };
  });

  // OLS closed form for the sampled points.
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0;
  let sxy = 0;
  for (const p of points) {
    sxx += (p.x - meanX) ** 2;
    sxy += (p.x - meanX) * (p.y - meanY);
  }
  const b1 = sxy / sxx;
  const b0 = meanY - b1 * meanX;

  const xMin = 0;
  const xMax = 10;
  const yMin = -1.5;
  const yMax = 9;
  const xToPx = (x: number) =>
    pad.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const yToPx = (y: number) =>
    pad.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  const fitY = (x: number) => b0 + b1 * x;

  const xTicks = [0, 2, 4, 6, 8, 10];
  const yTicks = [0, 2, 4, 6, 8];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Scatter of forty points with the OLS line and residual verticals showing vertical gaps between each point and the line.",
    caption,
    children: (
      <>
        {/* gridlines + y labels */}
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
                x={pad.left - 6}
                y={y + 3.5}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={11}
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* x labels */}
        {xTicks.map((t, i) => (
          <text
            key={`x${i}`}
            x={xToPx(t)}
            y={pad.top + plotH + 16}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={11}
          >
            {t}
          </text>
        ))}

        {/* axes */}
        <line
          x1={pad.left}
          x2={W - pad.right}
          y1={yToPx(0)}
          y2={yToPx(0)}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.1}
          opacity={0.5}
        />

        {/* residual verticals — thin gray, drawn first so points sit on top */}
        {points.map((p, i) => (
          <line
            key={`r${i}`}
            x1={xToPx(p.x)}
            x2={xToPx(p.x)}
            y1={yToPx(p.y)}
            y2={yToPx(fitY(p.x))}
            stroke="#9ca3af"
            strokeWidth={1}
            opacity={0.7}
          />
        ))}

        {/* OLS line */}
        <line
          x1={xToPx(xMin)}
          x2={xToPx(xMax)}
          y1={yToPx(fitY(xMin))}
          y2={yToPx(fitY(xMax))}
          stroke="#dc2626"
          strokeWidth={2.25}
        />

        {/* points */}
        {points.map((p, i) => (
          <circle
            key={`p${i}`}
            cx={xToPx(p.x)}
            cy={yToPx(p.y)}
            r={3.2}
            fill="#2563eb"
          />
        ))}

        {/* axis titles */}
        <text
          x={pad.left + plotW / 2}
          y={H - 6}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          predictor x
        </text>
        <text
          transform={`translate(13 ${pad.top + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          outcome y
        </text>

        {/* fitted-line annotation */}
        <text
          x={xToPx(9.4)}
          y={yToPx(fitY(9.4)) - 8}
          textAnchor="end"
          fill="#dc2626"
          fontSize={11}
        >
          ŷ = β̂₀ + β̂₁ x
        </text>
        <text
          x={xToPx(1.8)}
          y={yToPx(fitY(1.8)) + 22}
          textAnchor="start"
          className="fill-muted-foreground"
          fontSize={11}
        >
          residual eᵢ
        </text>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 2. Sigmoid — logistic function with the linear score labelled
// ---------------------------------------------------------------------------
export function Sigmoid({ caption }: { caption?: string }) {
  const W = 560;
  const H = 300;
  const pad = { top: 18, right: 18, bottom: 44, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const etaMin = -6;
  const etaMax = 6;
  const xToPx = (e: number) =>
    pad.left + ((e - etaMin) / (etaMax - etaMin)) * plotW;
  const yToPx = (p: number) => pad.top + (1 - p) * plotH;

  const N = 201;
  const sample = Array.from({ length: N }, (_, i) => {
    const eta = etaMin + ((etaMax - etaMin) * i) / (N - 1);
    return { eta, p: 1 / (1 + Math.exp(-eta)) };
  });
  const d = sample
    .map((s, i) => `${i === 0 ? "M" : "L"}${xToPx(s.eta).toFixed(1)},${yToPx(s.p).toFixed(1)}`)
    .join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = [-6, -3, 0, 3, 6];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "The sigmoid function mapping the linear score x-transpose-beta to a probability between zero and one, with the 0.5 decision line at score zero.",
    caption,
    children: (
      <>
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
                {v}
              </text>
            </g>
          );
        })}

        {/* decision threshold at p = 0.5 */}
        <line
          x1={pad.left}
          x2={W - pad.right}
          y1={yToPx(0.5)}
          y2={yToPx(0.5)}
          stroke="#dc2626"
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.75}
        />
        {/* decision boundary at eta = 0 */}
        <line
          x1={xToPx(0)}
          x2={xToPx(0)}
          y1={pad.top}
          y2={pad.top + plotH}
          stroke="#dc2626"
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.75}
        />

        {xTicks.map((t, i) => (
          <text
            key={`x${i}`}
            x={xToPx(t)}
            y={pad.top + plotH + 16}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={11}
          >
            {t}
          </text>
        ))}

        {/* sigmoid curve */}
        <path d={d} fill="none" stroke="#2563eb" strokeWidth={2.4} />

        {/* annotations */}
        <text
          x={xToPx(0) + 6}
          y={pad.top + 16}
          fill="#dc2626"
          fontSize={11}
        >
          decision boundary xᵀβ = 0
        </text>
        <text
          x={W - pad.right - 6}
          y={yToPx(0.5) - 6}
          textAnchor="end"
          fill="#dc2626"
          fontSize={11}
        >
          p = 0.5
        </text>

        <text
          x={pad.left + plotW / 2}
          y={H - 6}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          linear score η = xᵀβ
        </text>
        <text
          transform={`translate(13 ${pad.top + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          probability σ(η)
        </text>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 3. RegularizationBalls — L1 diamond and L2 disc with elliptical RSS
//    contours touching each. This is the picture that answers "why does lasso
//    zero coefficients but ridge doesn't."
// ---------------------------------------------------------------------------
export function RegularizationBalls({ caption }: { caption?: string }) {
  // Two side-by-side panels: left = L1 (lasso), right = L2 (ridge).
  const panelW = 300;
  const panelH = 300;
  const gap = 12;
  const W = panelW * 2 + gap;
  const H = panelH + 8;

  // Centre of β-space at the panel middle. β̂_OLS placed off-axis so the RSS
  // ellipse can meaningfully touch the L1 corner in the left panel and the
  // interior of the L2 disc in the right panel.
  const cx = panelW / 2;
  const cy = panelH / 2 - 6;
  const scale = 62; // pixels per β unit

  const olsX = 1.7; // β̂₁
  const olsY = 1.1; // β̂₂
  const olsPx = cx + olsX * scale;
  const olsPy = cy - olsY * scale;

  // Contour axes for the RSS quadratic: pick a rotation so the ellipses look
  // like a "typical" correlated-design fit, not aligned with the axes.
  const theta = -0.55; // radians
  const ax = 1.55; // semi-axis along principal direction (units of β)
  const by = 0.62; // semi-axis along perpendicular direction

  // Distances from OLS at which each ellipse tangentially touches the
  // corresponding penalty ball. Tuned so the left panel touches the L1 corner
  // (β₂ = 0, β₁ = 1) and the right panel touches the L2 disc at a
  // typical off-axis interior point.
  const ellipsesLeft = [0.45, 0.9, 1.35, 1.82];
  const ellipsesRight = [0.4, 0.85, 1.3, 1.72];

  const l1Radius = 1.0; // ||β||_1 ≤ 1 diamond
  const l2Radius = 1.0; // ||β||_2 ≤ 1 disc

  // Constraint "touch" points chosen by design so the artwork looks right.
  const l1Touch = { x: cx + 1.0 * scale, y: cy - 0.0 * scale }; // (1, 0)
  const l2Touch = {
    x: cx + Math.cos(0.72) * l2Radius * scale,
    y: cy - Math.sin(0.72) * l2Radius * scale,
  };

  const ellipsePath = (rx: number, ry: number, rot: number) =>
    // Approximate an ellipse by four cubic Béziers; SVG's own ellipse element
    // can't be rotated cleanly around an off-origin centre without a nested
    // transform, and this keeps everything explicit.
    `M ${(-rx).toFixed(2)},0 A ${rx.toFixed(2)},${ry.toFixed(2)} 0 1 0 ${rx.toFixed(2)},0 A ${rx.toFixed(2)},${ry.toFixed(2)} 0 1 0 ${(-rx).toFixed(2)},0 Z`;

  function Panel({
    offsetX,
    kind,
    title,
    ellipses,
    touch,
  }: {
    offsetX: number;
    kind: "l1" | "l2";
    title: string;
    ellipses: number[];
    touch: { x: number; y: number };
  }) {
    return (
      <g transform={`translate(${offsetX} 0)`}>
        {/* frame */}
        <rect
          x={0.5}
          y={0.5}
          width={panelW - 1}
          height={panelH - 1}
          fill="none"
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.6}
        />
        <text
          x={panelW / 2}
          y={panelH - 8}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          {title}
        </text>

        {/* axes */}
        <line
          x1={12}
          x2={panelW - 12}
          y1={cy}
          y2={cy}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.55}
        />
        <line
          x1={cx}
          x2={cx}
          y1={12}
          y2={panelH - 24}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.55}
        />
        <text
          x={panelW - 14}
          y={cy - 5}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={11}
        >
          β₁
        </text>
        <text
          x={cx + 5}
          y={16}
          className="fill-muted-foreground"
          fontSize={11}
        >
          β₂
        </text>

        {/* penalty ball */}
        {kind === "l1" ? (
          <polygon
            points={[
              `${cx + l1Radius * scale},${cy}`,
              `${cx},${cy - l1Radius * scale}`,
              `${cx - l1Radius * scale},${cy}`,
              `${cx},${cy + l1Radius * scale}`,
            ].join(" ")}
            fill="#f59e0b"
            fillOpacity={0.16}
            stroke="#d97706"
            strokeWidth={1.75}
          />
        ) : (
          <circle
            cx={cx}
            cy={cy}
            r={l2Radius * scale}
            fill="#f59e0b"
            fillOpacity={0.16}
            stroke="#d97706"
            strokeWidth={1.75}
          />
        )}

        {/* RSS ellipses centred on β̂_OLS, rotated by theta */}
        <g transform={`translate(${olsPx} ${olsPy}) rotate(${(theta * 180) / Math.PI})`}>
          {ellipses.map((s, i) => (
            <path
              key={`e${i}`}
              d={ellipsePath(ax * scale * s, by * scale * s, 0)}
              fill="none"
              stroke="#2563eb"
              strokeWidth={i === ellipses.length - 1 ? 1.9 : 1.1}
              opacity={i === ellipses.length - 1 ? 0.9 : 0.45}
            />
          ))}
        </g>

        {/* OLS marker */}
        <circle cx={olsPx} cy={olsPy} r={3.5} fill="#2563eb" />
        <text
          x={olsPx + 6}
          y={olsPy - 6}
          fill="#2563eb"
          fontSize={11}
        >
          β̂ᴼᴸˢ
        </text>

        {/* solution touch-point */}
        <circle cx={touch.x} cy={touch.y} r={4.2} fill="#dc2626" />
        <text
          x={touch.x + 8}
          y={touch.y + 4}
          fill="#dc2626"
          fontSize={11}
        >
          {kind === "l1" ? "β̂ˡᵃˢˢᵒ  (β₂ = 0)" : "β̂ʳⁱᵈᵍᵉ"}
        </text>
      </g>
    );
  }

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two panels of coefficient space. Left: the L1 diamond constraint region; an elliptical RSS contour first touches it at a corner where beta-two equals zero. Right: the L2 disc; the same-shaped ellipse touches it on the smooth boundary, off both axes, so no coefficient is zero.",
    caption,
    children: (
      <>
        <Panel
          offsetX={0}
          kind="l1"
          title="Lasso: L1 ball ‖β‖₁ ≤ t"
          ellipses={ellipsesLeft}
          touch={l1Touch}
        />
        <Panel
          offsetX={panelW + gap}
          kind="l2"
          title="Ridge: L2 ball ‖β‖₂ ≤ t"
          ellipses={ellipsesRight}
          touch={l2Touch}
        />
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 4. ShrinkageCurves — ridge (proportional) vs lasso (soft-threshold) as a
//    function of the OLS coordinate under the orthonormal design.
// ---------------------------------------------------------------------------
export function ShrinkageCurves({
  lambda = 0.6,
  caption,
}: {
  lambda?: number;
  caption?: string;
}) {
  const W = 560;
  const H = 340;
  const pad = { top: 18, right: 18, bottom: 46, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const zMin = -2.5;
  const zMax = 2.5;
  const yMin = -2.5;
  const yMax = 2.5;
  const xToPx = (z: number) =>
    pad.left + ((z - zMin) / (zMax - zMin)) * plotW;
  const yToPx = (y: number) =>
    pad.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  const N = 401;
  const zs = Array.from(
    { length: N },
    (_, i) => zMin + ((zMax - zMin) * i) / (N - 1),
  );

  const ols = (z: number) => z;
  const ridge = (z: number) => z / (1 + lambda);
  const lasso = (z: number) =>
    Math.sign(z) * Math.max(Math.abs(z) - lambda, 0);

  const pathFor = (f: (z: number) => number) =>
    zs
      .map(
        (z, i) =>
          `${i === 0 ? "M" : "L"}${xToPx(z).toFixed(1)},${yToPx(f(z)).toFixed(1)}`,
      )
      .join(" ");

  const ticks = [-2, -1, 0, 1, 2];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Estimated coefficient as a function of its OLS value under an orthonormal design. Identity line for OLS, a shallower straight line for ridge, and a soft-thresholding piecewise-linear curve for lasso with a flat interval on the horizontal axis.",
    caption,
    children: (
      <>
        {ticks.map((v, i) => {
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
                {v}
              </text>
            </g>
          );
        })}

        {/* zero axes */}
        <line
          x1={pad.left}
          x2={W - pad.right}
          y1={yToPx(0)}
          y2={yToPx(0)}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.1}
          opacity={0.55}
        />
        <line
          x1={xToPx(0)}
          x2={xToPx(0)}
          y1={pad.top}
          y2={pad.top + plotH}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.1}
          opacity={0.55}
        />

        {/* lasso "dead zone" band */}
        <rect
          x={xToPx(-lambda)}
          y={pad.top}
          width={xToPx(lambda) - xToPx(-lambda)}
          height={plotH}
          fill="#dc2626"
          opacity={0.06}
        />
        <text
          x={xToPx(0)}
          y={pad.top + plotH + 30}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
        >
          [−λ, λ]  → lasso sets β̂ = 0
        </text>

        {ticks.map((t, i) => (
          <text
            key={`x${i}`}
            x={xToPx(t)}
            y={pad.top + plotH + 16}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={11}
          >
            {t}
          </text>
        ))}

        {/* curves */}
        <path
          d={pathFor(ols)}
          fill="none"
          stroke="#6b7280"
          strokeWidth={1.6}
          strokeDasharray="5 4"
        />
        <path
          d={pathFor(ridge)}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2.3}
        />
        <path
          d={pathFor(lasso)}
          fill="none"
          stroke="#dc2626"
          strokeWidth={2.3}
        />

        <text
          x={pad.left + plotW / 2}
          y={H - 6}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          OLS coordinate  β̂ᴼᴸˢⱼ
        </text>
        <text
          transform={`translate(13 ${pad.top + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          estimated  β̂ⱼ
        </text>

        {/* legend */}
        <g transform={`translate(${W - pad.right - 150} ${pad.top + 8})`}>
          {[
            { label: "OLS (identity)", color: "#6b7280", dashed: true },
            { label: `ridge  z / (1 + λ)`, color: "#2563eb", dashed: false },
            {
              label: `lasso  soft-threshold`,
              color: "#dc2626",
              dashed: false,
            },
          ].map((row, i) => (
            <g key={i} transform={`translate(0 ${i * 16})`}>
              <line
                x1={0}
                x2={22}
                y1={6}
                y2={6}
                stroke={row.color}
                strokeWidth={2.2}
                strokeDasharray={row.dashed ? "5 4" : undefined}
              />
              <text
                x={28}
                y={9}
                className="fill-muted-foreground"
                fontSize={11}
              >
                {row.label}
              </text>
            </g>
          ))}
        </g>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 5. PCARotation — 2D scatter with PC1 / PC2 arrows on the sample covariance.
// ---------------------------------------------------------------------------
export function PCARotation({ caption }: { caption?: string }) {
  const W = 560;
  const H = 340;
  const pad = { top: 18, right: 18, bottom: 42, left: 46 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  // Correlated cloud: generate along a rotated ellipse (σ₁ = 2, σ₂ = 0.55).
  const r = rng(9987);
  const n = 140;
  const theta = 0.55; // radians — cloud tilt
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const raw: Pt[] = Array.from({ length: n }, () => {
    const u = gauss(r) * 2.0;
    const v = gauss(r) * 0.55;
    return { x: cosT * u - sinT * v, y: sinT * u + cosT * v };
  });
  const meanX = raw.reduce((s, p) => s + p.x, 0) / n;
  const meanY = raw.reduce((s, p) => s + p.y, 0) / n;
  const centred = raw.map((p) => ({ x: p.x - meanX, y: p.y - meanY }));

  // Sample covariance and its eigendecomposition (closed form for 2x2).
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of centred) {
    sxx += p.x * p.x;
    syy += p.y * p.y;
    sxy += p.x * p.y;
  }
  sxx /= n - 1;
  syy /= n - 1;
  sxy /= n - 1;
  const tr = sxx + syy;
  const det = sxx * syy - sxy * sxy;
  const disc = Math.sqrt(Math.max(0, (tr / 2) ** 2 - det));
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;
  // Eigenvector for l1: (sxy, l1 - sxx), normalised.
  const v1x = sxy;
  const v1y = l1 - sxx;
  const v1n = Math.hypot(v1x, v1y) || 1;
  const e1 = { x: v1x / v1n, y: v1y / v1n };
  const e2 = { x: -e1.y, y: e1.x };

  const xMin = -5.5;
  const xMax = 5.5;
  const yMin = -3.2;
  const yMax = 3.2;
  const xToPx = (x: number) =>
    pad.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const yToPx = (y: number) =>
    pad.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  // Arrow lengths proportional to standard deviations along each axis.
  const s1 = Math.sqrt(Math.max(0, l1));
  const s2 = Math.sqrt(Math.max(0, l2));
  const pc1Head = {
    x: meanX + 2 * s1 * e1.x,
    y: meanY + 2 * s1 * e1.y,
  };
  const pc2Head = {
    x: meanX + 2 * s2 * e2.x,
    y: meanY + 2 * s2 * e2.y,
  };

  const xTicks = [-4, -2, 0, 2, 4];
  const yTicks = [-2, 0, 2];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "A tilted elliptical cloud of points with two orthogonal arrows through its centroid: a long arrow along the long axis labelled PC1 and a short perpendicular arrow labelled PC2.",
    caption,
    children: (
      <>
        <defs>
          <marker
            id="pca-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#dc2626" />
          </marker>
        </defs>

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
                x={pad.left - 6}
                y={y + 3.5}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={11}
              >
                {v}
              </text>
            </g>
          );
        })}

        {xTicks.map((t, i) => (
          <text
            key={`x${i}`}
            x={xToPx(t)}
            y={pad.top + plotH + 16}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={11}
          >
            {t}
          </text>
        ))}

        <line
          x1={pad.left}
          x2={W - pad.right}
          y1={yToPx(0)}
          y2={yToPx(0)}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.1}
          opacity={0.5}
        />
        <line
          x1={xToPx(0)}
          x2={xToPx(0)}
          y1={pad.top}
          y2={pad.top + plotH}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.1}
          opacity={0.5}
        />

        {raw.map((p, i) => (
          <circle
            key={`p${i}`}
            cx={xToPx(p.x)}
            cy={yToPx(p.y)}
            r={2.4}
            fill="#2563eb"
            fillOpacity={0.7}
          />
        ))}

        {/* PC axes as arrows from centroid */}
        <line
          x1={xToPx(meanX)}
          y1={yToPx(meanY)}
          x2={xToPx(pc1Head.x)}
          y2={yToPx(pc1Head.y)}
          stroke="#dc2626"
          strokeWidth={2.4}
          markerEnd="url(#pca-arrow)"
        />
        <line
          x1={xToPx(meanX)}
          y1={yToPx(meanY)}
          x2={xToPx(pc2Head.x)}
          y2={yToPx(pc2Head.y)}
          stroke="#dc2626"
          strokeWidth={2.4}
          markerEnd="url(#pca-arrow)"
        />
        <text
          x={xToPx(pc1Head.x) + 6}
          y={yToPx(pc1Head.y) - 6}
          fill="#dc2626"
          fontSize={12}
        >
          PC1 (high variance)
        </text>
        <text
          x={xToPx(pc2Head.x) + 6}
          y={yToPx(pc2Head.y) - 6}
          fill="#dc2626"
          fontSize={12}
        >
          PC2
        </text>

        <text
          x={pad.left + plotW / 2}
          y={H - 6}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          x₁
        </text>
        <text
          transform={`translate(13 ${pad.top + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          x₂
        </text>
      </>
    ),
  });
}
