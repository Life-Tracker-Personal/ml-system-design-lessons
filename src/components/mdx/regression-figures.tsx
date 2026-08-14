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

// ---------------------------------------------------------------------------
// 6. PCAPointSpace — the two equivalent objectives, drawn on the same cloud
//    Left:  maximize the spread of the projections (vᵀxᵢ)
//    Right: minimize the perpendicular reconstruction errors (dᵢ)
//    Equal pixel scale on both axes, otherwise "perpendicular" would be a lie.
// ---------------------------------------------------------------------------
export function PCAPointSpace({ caption }: { caption?: string }) {
  const W = 720;
  const H = 322;
  const SCALE = 30; // px per data unit — identical on x and y
  const panelTop = 46;
  const plotW = 300;
  const plotH = 180;
  const ax0 = 30;
  const bx0 = 390;

  const xToPx = (x: number, x0: number) => x0 + (x + 5) * SCALE;
  const yToPx = (y: number) => panelTop + (3 - y) * SCALE;

  // Same cloud recipe as PCARotation so the two figures read as one story.
  const r = rng(9987);
  const n = 70;
  const theta = 0.5;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const raw: Pt[] = Array.from({ length: n }, () => {
    const u = gauss(r) * 2.0;
    const v = gauss(r) * 0.55;
    return { x: cosT * u - sinT * v, y: sinT * u + cosT * v };
  });
  const mx = raw.reduce((s, p) => s + p.x, 0) / n;
  const my = raw.reduce((s, p) => s + p.y, 0) / n;
  const pts = raw.map((p) => ({ x: p.x - mx, y: p.y - my }));

  // 2x2 covariance and its closed-form top eigenvector.
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of pts) {
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
  const v1n = Math.hypot(sxy, l1 - sxx) || 1;
  const e1 = { x: sxy / v1n, y: (l1 - sxx) / v1n };
  const e2 = { x: -e1.y, y: e1.x };
  const s1 = Math.sqrt(Math.max(0, l1));

  // Scores and signed perpendicular offsets.
  const proj = pts.map((p) => ({
    p,
    t: p.x * e1.x + p.y * e1.y,
    d: p.x * e2.x + p.y * e2.y,
  }));

  // Pick one clearly-offset point on the right-hand side to annotate.
  let hi = proj[0];
  for (const q of proj) {
    if (q.t > 0.8 && Math.abs(q.d) > Math.abs(hi.d)) hi = q;
  }
  const hiFoot = { x: hi.t * e1.x, y: hi.t * e1.y };

  // Unit directions in pixel space (y is flipped; scales are equal).
  const pe1 = { x: e1.x, y: -e1.y };
  const pe2 = { x: e2.x, y: -e2.y };

  const lineHalf = 4.6;
  const axisEnds = (x0: number) => ({
    x1: xToPx(-lineHalf * e1.x, x0),
    y1: yToPx(-lineHalf * e1.y),
    x2: xToPx(lineHalf * e1.x, x0),
    y2: yToPx(lineHalf * e1.y),
  });

  const panelBox = (x0: number) => (
    <rect
      x={x0}
      y={panelTop}
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

  const centroid = (x0: number) => (
    <circle cx={xToPx(0, x0)} cy={yToPx(0)} r={3.2} fill="#dc2626" />
  );

  // Right-angle marker at the foot of the highlighted perpendicular.
  const sgn = hi.d >= 0 ? 1 : -1;
  const fx = xToPx(hiFoot.x, bx0);
  const fy = yToPx(hiFoot.y);
  const m = 8;
  const corner = [
    [fx + pe1.x * m, fy + pe1.y * m],
    [
      fx + pe1.x * m + pe2.x * m * sgn,
      fy + pe1.y * m + pe2.y * m * sgn,
    ],
    [fx + pe2.x * m * sgn, fy + pe2.y * m * sgn],
  ]
    .map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`)
    .join(" ");

  const A = axisEnds(ax0);
  const B = axisEnds(bx0);

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two copies of the same tilted point cloud. On the left, each point is dropped onto the PC1 line and the spread of those projections is marked as the quantity PCA maximizes. On the right, the same drops are drawn as perpendicular segments, marked as the quantity PCA minimizes.",
    caption,
    children: (
      <>
        <defs>
          <marker
            id="pcaps-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#2563eb" />
          </marker>
          <marker
            id="pcaps-arrow-start"
            viewBox="0 0 10 10"
            refX="1"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M10,0 L0,5 L10,10 z" fill="#2563eb" />
          </marker>
        </defs>

        {/* ---------- Panel A: maximize projected spread ---------- */}
        <text
          x={ax0}
          y={28}
          className="fill-foreground"
          fontSize={12.5}
          fontWeight={600}
        >
          Point space · MAXIMIZE spread of projections
        </text>
        {panelBox(ax0)}
        <line
          x1={A.x1}
          y1={A.y1}
          x2={A.x2}
          y2={A.y2}
          stroke="#dc2626"
          strokeWidth={2}
        />
        {/* faint connectors so the point-to-foot mapping is visible */}
        {proj.map((q, i) => (
          <line
            key={`ca${i}`}
            x1={xToPx(q.p.x, ax0)}
            y1={yToPx(q.p.y)}
            x2={xToPx(q.t * e1.x, ax0)}
            y2={yToPx(q.t * e1.y)}
            className="text-border"
            stroke="currentColor"
            strokeWidth={0.8}
            opacity={0.5}
          />
        ))}
        {proj.map((q, i) => (
          <circle
            key={`pa${i}`}
            cx={xToPx(q.p.x, ax0)}
            cy={yToPx(q.p.y)}
            r={1.9}
            className="fill-muted-foreground"
            opacity={0.5}
          />
        ))}
        {/* the projections themselves */}
        {proj.map((q, i) => (
          <circle
            key={`fa${i}`}
            cx={xToPx(q.t * e1.x, ax0)}
            cy={yToPx(q.t * e1.y)}
            r={2.4}
            fill="#2563eb"
          />
        ))}
        {/* spread marker: ±2σ₁, offset perpendicular to the line so it reads
            as a measurement of the blue dots rather than a second axis */}
        <line
          x1={xToPx(-2 * s1 * e1.x, ax0) - 22 * pe2.x}
          y1={yToPx(-2 * s1 * e1.y) - 22 * pe2.y}
          x2={xToPx(2 * s1 * e1.x, ax0) - 22 * pe2.x}
          y2={yToPx(2 * s1 * e1.y) - 22 * pe2.y}
          stroke="#2563eb"
          strokeWidth={1.4}
          markerEnd="url(#pcaps-arrow)"
          markerStart="url(#pcaps-arrow-start)"
        />
        <text
          x={xToPx(0, ax0) - 40 * pe2.x + 6}
          y={yToPx(0) - 40 * pe2.y + 4}
          fontSize={11}
          fill="#2563eb"
          fontWeight={600}
        >
          spread = λ₁
        </text>
        {/* the score of the highlighted point */}
        <line
          x1={xToPx(0, ax0)}
          y1={yToPx(0)}
          x2={xToPx(hi.t * e1.x, ax0)}
          y2={yToPx(hi.t * e1.y)}
          stroke="#f59e0b"
          strokeWidth={3.4}
        />
        <circle
          cx={xToPx(hi.p.x, ax0)}
          cy={yToPx(hi.p.y)}
          r={3.6}
          fill="#f59e0b"
        />
        {centroid(ax0)}
        <text
          x={ax0 + 8}
          y={panelTop + plotH - 10}
          className="fill-foreground"
          fontSize={11.5}
        >
          <tspan fill="#2563eb">●</tspan> projection of each point onto PC1
        </text>
        <text x={ax0 + 8} y={panelTop + 16} fontSize={11.5} fill="#f59e0b">
          orange = vᵀxᵢ, one score
        </text>

        {/* ---------- Panel B: minimize perpendicular error ---------- */}
        <text
          x={bx0}
          y={28}
          className="fill-foreground"
          fontSize={12.5}
          fontWeight={600}
        >
          Same cloud · MINIMIZE perpendicular distances
        </text>
        {panelBox(bx0)}
        <line
          x1={B.x1}
          y1={B.y1}
          x2={B.x2}
          y2={B.y2}
          stroke="#dc2626"
          strokeWidth={2}
        />
        {proj.map((q, i) => (
          <line
            key={`cb${i}`}
            x1={xToPx(q.p.x, bx0)}
            y1={yToPx(q.p.y)}
            x2={xToPx(q.t * e1.x, bx0)}
            y2={yToPx(q.t * e1.y)}
            stroke="#dc2626"
            strokeWidth={1.1}
            opacity={0.55}
          />
        ))}
        {proj.map((q, i) => (
          <circle
            key={`pb${i}`}
            cx={xToPx(q.p.x, bx0)}
            cy={yToPx(q.p.y)}
            r={1.9}
            className="fill-muted-foreground"
            opacity={0.55}
          />
        ))}
        {/* vertical gap — the kind of distance OLS uses instead */}
        <line
          x1={xToPx(hi.p.x, bx0)}
          y1={yToPx(hi.p.y)}
          x2={xToPx(hi.p.x, bx0)}
          y2={yToPx((hi.p.x * e1.y) / (e1.x || 1e-9))}
          stroke="#6b7280"
          strokeWidth={1.4}
          strokeDasharray="3 3"
        />
        {/* the highlighted perpendicular */}
        <line
          x1={xToPx(hi.p.x, bx0)}
          y1={yToPx(hi.p.y)}
          x2={fx}
          y2={fy}
          stroke="#f59e0b"
          strokeWidth={3.4}
        />
        <polyline
          points={corner}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={1.4}
        />
        <circle
          cx={xToPx(hi.p.x, bx0)}
          cy={yToPx(hi.p.y)}
          r={3.6}
          fill="#f59e0b"
        />
        {centroid(bx0)}
        <text
          x={bx0 + 8}
          y={panelTop + plotH - 10}
          fontSize={11.5}
          fill="#dc2626"
        >
          ─ dᵢ, distance to the line (perpendicular)
        </text>
        <text x={bx0 + 8} y={panelTop + 16} fontSize={11.5} fill="#6b7280">
          ┈ vertical gap — what OLS measures instead
        </text>

        {/* ---------- the identity that ties the two panels together ---------- */}
        <text
          x={W / 2}
          y={panelTop + plotH + 42}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={13.5}
        >
          ‖xᵢ‖² = (vᵀxᵢ)² + dᵢ² for every point
        </text>
        <text
          x={W / 2}
          y={panelTop + plotH + 62}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={12}
        >
          Σ‖xᵢ‖² is fixed by the data, so maximizing Σ(vᵀxᵢ)² is exactly
          minimizing Σdᵢ². Left and right are the same problem.
        </text>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 7. PCAFeatureSpace — the dual picture: d feature vectors living in R^n
//    Lengths are standard deviations, angles are correlations.
//    Numbers are exact for a standardized pair with r = 0.8.
// ---------------------------------------------------------------------------
export function PCAFeatureSpace({ caption }: { caption?: string }) {
  const W = 720;
  const H = 352;
  const O = { x: 118, y: 276 }; // origin of the vector diagram
  const L = 120; // ‖xⱼ‖ in px, equal for standardized features
  const r12 = 0.8; // correlation between the two features

  // Standardized 2x2 correlation matrix [[1, r], [r, 1]].
  const lam1 = 1 + r12; // 1.8
  const lam2 = 1 - r12; // 0.2
  const halfAngle = Math.acos(r12) / 2; // vectors sit symmetrically about PC1
  const bis = (57 * Math.PI) / 180; // bisector direction, up and to the right

  const polar = (ang: number, len: number) => ({
    x: O.x + Math.cos(ang) * len,
    y: O.y - Math.sin(ang) * len,
  });

  const x1 = polar(bis - halfAngle, L);
  const x2 = polar(bis + halfAngle, L);
  // ‖z_k‖ = sqrt(λ_k) · ‖xⱼ‖ — so z₁ is exactly 3x longer than z₂ here.
  const z1 = polar(bis, Math.sqrt(lam1) * L);
  const z2 = polar(bis - Math.PI / 2, Math.sqrt(lam2) * L);

  const arc = (() => {
    const a = polar(bis - halfAngle, 46);
    const b = polar(bis + halfAngle, 46);
    return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A 46 46 0 0 0 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  })();

  // Right-angle marker between z₁ and z₂.
  const u1 = { x: Math.cos(bis), y: -Math.sin(bis) };
  const u2 = { x: Math.cos(bis - Math.PI / 2), y: -Math.sin(bis - Math.PI / 2) };
  const q = 11;
  const ra = [
    [O.x + u1.x * q, O.y + u1.y * q],
    [O.x + u1.x * q + u2.x * q, O.y + u1.y * q + u2.y * q],
    [O.x + u2.x * q, O.y + u2.y * q],
  ]
    .map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`)
    .join(" ");

  const vec = (
    to: { x: number; y: number },
    color: string,
    width: number,
    marker: string,
  ) => (
    <line
      x1={O.x}
      y1={O.y}
      x2={to.x}
      y2={to.y}
      stroke={color}
      strokeWidth={width}
      markerEnd={`url(#${marker})`}
    />
  );

  const rows: [string, string][] = [
    ["‖xⱼ‖ = √(n−1) · sⱼ", "vector length is the feature's spread"],
    ["cos θ = r₁₂ = 0.8", "the angle between them is their correlation"],
    ["z₁ = Xv₁, z₂ = Xv₂", "PCs are combinations of the feature vectors"],
    ["‖z₁‖² = (n−1) λ₁", "λ₁ = 1.8, λ₂ = 0.2, so z₁ is 3× longer than z₂"],
    ["z₁ ⊥ z₂", "the scores are uncorrelated by construction"],
    ["Σ‖xⱼ‖² = Σ‖zₖ‖²", "rotating the basis moves variance, never creates it"],
  ];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two feature vectors drawn from a common origin at a narrow angle, with the first principal component bisecting them as a long arrow and the second principal component drawn perpendicular and much shorter.",
    caption,
    children: (
      <>
        <defs>
          {[
            ["fs-blue", "#2563eb"],
            ["fs-red", "#dc2626"],
            ["fs-amber", "#f59e0b"],
          ].map(([id, fill]) => (
            <marker
              key={id}
              id={id}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={fill} />
            </marker>
          ))}
        </defs>

        <text
          x={30}
          y={28}
          className="fill-foreground"
          fontSize={13}
          fontWeight={600}
        >
          Feature space — each axis is an observation, each arrow is a column of
          X
        </text>

        {/* angle arc between the two feature vectors */}
        <path
          d={arc}
          fill="none"
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.2}
          opacity={0.8}
        />
        <text
          x={polar(bis + halfAngle * 0.55, 63).x}
          y={polar(bis + halfAngle * 0.55, 63).y + 4}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={12}
        >
          θ
        </text>

        {/* the two feature vectors */}
        {vec(x1, "#2563eb", 2.2, "fs-blue")}
        {vec(x2, "#2563eb", 2.2, "fs-blue")}
        {/* the two principal directions */}
        {vec(z1, "#dc2626", 3, "fs-red")}
        {vec(z2, "#f59e0b", 3, "fs-amber")}
        <polyline
          points={ra}
          fill="none"
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.2}
        />
        <circle cx={O.x} cy={O.y} r={3.4} className="fill-foreground" />

        <text
          x={x1.x + 10}
          y={x1.y + 4}
          fontSize={12.5}
          fill="#2563eb"
          fontWeight={600}
        >
          x₁
        </text>
        <text
          x={x2.x - 4}
          y={x2.y - 9}
          fontSize={12.5}
          fill="#2563eb"
          fontWeight={600}
        >
          x₂
        </text>
        <text
          x={z1.x + 8}
          y={z1.y + 2}
          fontSize={12.5}
          fill="#dc2626"
          fontWeight={600}
        >
          z₁ = PC1 scores
        </text>
        <text
          x={z2.x + 8}
          y={z2.y + 12}
          fontSize={12.5}
          fill="#f59e0b"
          fontWeight={600}
        >
          z₂ = PC2 scores
        </text>

        {/* the reading key */}
        {rows.map(([lhs, rhs], i) => (
          <g key={`row${i}`} transform={`translate(392, ${74 + i * 32})`}>
            <text
              x={0}
              y={0}
              className="fill-foreground"
              fontSize={12.5}
              fontWeight={600}
            >
              {lhs}
            </text>
            <text
              x={0}
              y={15}
              className="fill-muted-foreground"
              fontSize={11.5}
            >
              {rhs}
            </text>
          </g>
        ))}
      </>
    ),
  });
}
