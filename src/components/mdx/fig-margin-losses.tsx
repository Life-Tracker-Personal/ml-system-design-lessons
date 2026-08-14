// Inline SVG figure for c1.8 (SVM / kNN / Naive Bayes): the three losses
// plotted against the functional margin m = y·f(x), using the lesson's own
// definitions — 0-1 loss 1[m ≤ 0], hinge max(0, 1 − m), logistic log(1 + e⁻ᵐ)
// in nats. Server component, no client JS, no charting library.
//
// Every plotted coordinate comes from evaluating those three functions on a
// grid; the annotated numbers are formatted from the same evaluations rather
// than typed in by hand. Pixels-per-unit is identical on both axes, so the
// hinge's −1 slope renders at a true 45° and the flat branch is visibly flat.

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

// --- the three losses, as functions of the margin m = y f(x) ---------------
const hingeLoss = (m: number) => Math.max(0, 1 - m);
// Numerically stable softplus(−m) = log(1 + e^{−m}); natural log, as in the lesson.
const logisticLoss = (m: number) =>
  m > 0 ? Math.log1p(Math.exp(-m)) : -m + Math.log1p(Math.exp(m));
const zeroOneLoss = (m: number) => (m <= 0 ? 1 : 0);

export function MarginLosses({ caption }: { caption?: string }) {
  const W = 720;
  const H = 352;

  // Plot window: m ∈ [-2, 3], loss ∈ [0, 3]. Same px-per-unit on both axes.
  const SCALE = 78;
  const M0 = -2;
  const M1 = 3;
  const L0 = 0;
  const L1 = 3;
  const x0 = 70; // px of m = M0
  const yBase = 284; // px of loss = 0
  const xToPx = (m: number) => x0 + (m - M0) * SCALE;
  const yToPx = (l: number) => yBase - (l - L0) * SCALE;
  const xRight = xToPx(M1); // 460
  const yTop = yToPx(L1); // 50

  // Sampled curves (the only source of every drawn coordinate).
  const STEPS = 240;
  const grid = Array.from(
    { length: STEPS + 1 },
    (_, i) => M0 + ((M1 - M0) * i) / STEPS,
  );
  const path = (f: (m: number) => number) =>
    grid
      .map(
        (m, i) =>
          `${i === 0 ? "M" : "L"} ${xToPx(m).toFixed(2)} ${yToPx(f(m)).toFixed(2)}`,
      )
      .join(" ");

  const logisticPath = path(logisticLoss);
  const hingePath = path(hingeLoss);

  // Where the hinge switches off, found on the grid rather than assumed.
  const kink = grid.find((m) => hingeLoss(m) === 0) ?? 1;

  // Logistic values used in the annotations — computed, then formatted.
  const at2 = logisticLoss(2);
  const at3 = logisticLoss(3);
  const at2Label = at2.toFixed(3);
  const at3Label = at3.toFixed(3);

  const xTicks = [-2, -1, 0, 1, 2, 3];
  const yTicks = [0, 1, 2, 3];

  // Right-hand column.
  const cx = 476;
  const legend = [
    { c: "#dc2626", t: "hinge   max(0, 1 − m)" },
    { c: "#2563eb", t: "logistic   log(1 + e⁻ᵐ)" },
    { c: "#9ca3af", t: "0-1 loss   1[m ≤ 0]" },
  ];
  const blockA = [
    "hinge(m) = max(0, 1 − m) is exactly 0.",
    "No loss ⇒ no gradient ⇒ the point exerts",
    "no pull: its dual price αᵢ is 0, so it",
    "drops out of the solution. Only points",
    "with m ≤ 1 survive — the support vectors.",
  ];
  const blockB = [
    "log(1 + e⁻ᵐ) > 0 at every finite m:",
    `${at2Label} at m = 2, ${at3Label} at m = 3,`,
    "reaching 0 only as m → ∞. Every point",
    "keeps nudging w forever, so nothing is",
    "forgotten and nothing is sparse.",
  ];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Hinge, logistic and 0-1 loss plotted against the functional margin m = y f(x) over m from -2 to 3, on axes with equal pixel scaling. A vertical guide at m = 1 marks where the hinge reaches zero and stays there, while the logistic curve keeps falling toward but never touching zero.",
    caption,
    children: (
      <>
        <defs>
          <marker
            id="mloss-tip"
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

        <text
          x={x0 - 40}
          y={26}
          className="fill-foreground"
          fontSize={13}
          fontWeight={600}
        >
          Loss vs the functional margin m = y·f(x)
        </text>

        {/* the flat zone: m ≥ 1, where hinge is identically zero */}
        <rect
          x={xToPx(1)}
          y={yTop}
          width={xRight - xToPx(1)}
          height={yBase - yTop}
          fill="#f59e0b"
          opacity={0.08}
        />

        {/* horizontal gridlines */}
        {yTicks.map((l) => (
          <line
            key={`g${l}`}
            x1={x0}
            y1={yToPx(l)}
            x2={xRight}
            y2={yToPx(l)}
            className="text-border"
            stroke="currentColor"
            strokeWidth={1}
            opacity={l === 0 ? 0.9 : 0.4}
          />
        ))}
        {/* m = 0 reference */}
        <line
          x1={xToPx(0)}
          y1={yTop}
          x2={xToPx(0)}
          y2={yBase}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.55}
          strokeDasharray="2 3"
        />
        {/* y axis */}
        <line
          x1={x0}
          y1={yTop}
          x2={x0}
          y2={yBase}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
        />

        {/* the m = 1 guide */}
        <line
          x1={xToPx(1)}
          y1={yTop}
          x2={xToPx(1)}
          y2={yBase}
          stroke="#d97706"
          strokeWidth={1.6}
          strokeDasharray="6 4"
        />
        <text
          x={xToPx(1) + 5}
          y={yTop + 12}
          fontSize={11.5}
          fill="#d97706"
          fontWeight={600}
        >
          m = 1
        </text>

        {/* ticks */}
        {xTicks.map((m) => (
          <text
            key={`xt${m}`}
            x={xToPx(m)}
            y={yBase + 18}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={11}
          >
            {m}
          </text>
        ))}
        {yTicks.map((l) => (
          <text
            key={`yt${l}`}
            x={x0 - 8}
            y={yToPx(l) + 4}
            textAnchor="end"
            className="fill-muted-foreground"
            fontSize={11}
          >
            {l}
          </text>
        ))}
        <text
          x={(x0 + xRight) / 2}
          y={yBase + 40}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11.5}
        >
          margin m = y·f(x) — correct sign to the right of 0
        </text>
        <text
          x={x0 - 44}
          y={yToPx(1.5)}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11.5}
          transform={`rotate(-90 ${x0 - 44} ${yToPx(1.5)})`}
        >
          loss
        </text>

        {/* 0-1 loss, drawn first and slightly thicker so it still shows as a
            halo where the hinge lies on top of it past m = 1 */}
        <line
          x1={xToPx(M0)}
          y1={yToPx(zeroOneLoss(-1))}
          x2={xToPx(0)}
          y2={yToPx(zeroOneLoss(-1e-9))}
          stroke="#9ca3af"
          strokeWidth={3.2}
          strokeDasharray="6 4"
        />
        <line
          x1={xToPx(0)}
          y1={yToPx(zeroOneLoss(1e-9))}
          x2={xToPx(M1)}
          y2={yToPx(zeroOneLoss(1))}
          stroke="#9ca3af"
          strokeWidth={3.2}
          strokeDasharray="6 4"
        />
        <line
          x1={xToPx(0)}
          y1={yToPx(1)}
          x2={xToPx(0)}
          y2={yToPx(0)}
          stroke="#9ca3af"
          strokeWidth={1.2}
          strokeDasharray="2 3"
        />
        <circle cx={xToPx(0)} cy={yToPx(1)} r={3.4} fill="#9ca3af" />
        <circle
          cx={xToPx(0)}
          cy={yToPx(0)}
          r={3.4}
          fill="none"
          stroke="#9ca3af"
          strokeWidth={1.6}
        />

        {/* logistic */}
        <path
          d={logisticPath}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2.4}
        />
        {/* hinge, on top */}
        <path d={hingePath} fill="none" stroke="#dc2626" strokeWidth={2.6} />
        <circle cx={xToPx(kink)} cy={yToPx(0)} r={3.6} fill="#dc2626" />

        {/* the flat-branch callout */}
        <text
          x={(xToPx(1) + xRight) / 2}
          y={yToPx(0.62)}
          textAnchor="middle"
          fontSize={12}
          fill="#d97706"
          fontWeight={600}
        >
          hinge ≡ 0 here
        </text>
        <line
          x1={(xToPx(1) + xRight) / 2 + 18}
          y1={yToPx(0.53)}
          x2={xToPx(2.55)}
          y2={yToPx(0.11)}
          stroke="#d97706"
          strokeWidth={1.3}
          markerEnd="url(#mloss-tip)"
        />

        {/* logistic tail marker: strictly above the axis, computed value */}
        <circle cx={xToPx(2)} cy={yToPx(at2)} r={3} fill="#2563eb" />
        <text
          x={xToPx(2) - 6}
          y={yToPx(at2) - 9}
          textAnchor="end"
          fontSize={11}
          fill="#2563eb"
          fontWeight={600}
        >
          {at2Label} &gt; 0
        </text>

        {/* ---------------- right column ---------------- */}
        {legend.map((item, i) => (
          <g key={`lg${i}`}>
            <line
              x1={cx}
              y1={52 + i * 20}
              x2={cx + 26}
              y2={52 + i * 20}
              stroke={item.c}
              strokeWidth={i === 2 ? 3.2 : 2.6}
              strokeDasharray={i === 2 ? "6 4" : undefined}
            />
            <text
              x={cx + 34}
              y={52 + i * 20 + 4}
              className="fill-foreground"
              fontSize={11.5}
            >
              {item.t}
            </text>
          </g>
        ))}

        <text
          x={cx}
          y={140}
          fontSize={12.5}
          fill="#d97706"
          fontWeight={600}
        >
          Right of m = 1: nothing happens
        </text>
        {blockA.map((line, i) => (
          <text
            key={`ba${i}`}
            x={cx}
            y={158 + i * 15}
            className="fill-muted-foreground"
            fontSize={11}
          >
            {line}
          </text>
        ))}

        <text
          x={cx}
          y={252}
          fontSize={12.5}
          fill="#2563eb"
          fontWeight={600}
        >
          Logistic never switches off
        </text>
        {blockB.map((line, i) => (
          <text
            key={`bb${i}`}
            x={cx}
            y={270 + i * 15}
            className="fill-muted-foreground"
            fontSize={11}
          >
            {line}
          </text>
        ))}
      </>
    ),
  });
}
