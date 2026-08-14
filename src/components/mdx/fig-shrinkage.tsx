// Inline SVG figure for c1.5: ridge's smooth shrinkage ramp against PCR's
// hard 0/1 step, both plotted against the singular value d_j.
//
// Every number is computed from the closed forms in the lesson — the ridge
// factor d_j^2 / (d_j^2 + lambda) with lambda = 4, and the PCR indicator with
// its cutoff at d_m = sqrt(lambda) = 2, which is exactly where the ridge ramp
// passes through 1/2. Nothing is a hand-placed approximation, and there is no
// client JS or external asset.

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

export function RidgeVsPcrShrinkage({ caption }: { caption?: string }) {
  const W = 720;
  const H = 448;

  // ---- plot frame -------------------------------------------------------
  const xL = 80;
  const xR = 640;
  const yBot = 340; // shrinkage factor 0
  const yTop = 110; // shrinkage factor 1
  const dMax = 6;

  const px = (d: number) => xL + (d / dMax) * (xR - xL);
  const py = (v: number) => yBot - v * (yBot - yTop);

  // ---- the two rules ----------------------------------------------------
  const lambda = 4;
  const dCut = Math.sqrt(lambda); // 2
  const ridge = (d: number) => (d * d) / (d * d + lambda);
  const pcr = (d: number) => (d >= dCut ? 1 : 0);

  // A concrete singular-value spectrum, ordered d_1 >= ... >= d_6.
  // PCR keeps m = 3 of them; ridge scales all six.
  const spectrum = [5.2, 3.6, 2.5, 1.6, 0.9, 0.35];
  const cols = [...spectrum].reverse(); // left to right along the axis

  // Ridge curve, sampled straight from the closed form.
  const ridgePts: string[] = [];
  for (let i = 0; i <= 300; i += 1) {
    const d = (i / 300) * dMax;
    ridgePts.push(`${px(d).toFixed(2)},${py(ridge(d)).toFixed(2)}`);
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const fmt2 = (v: number) => v.toFixed(2);

  const rowRidge = 402;
  const rowPcr = 424;

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Shrinkage factor plotted against the singular value. Ridge is a smooth ramp rising from zero toward one; principal-component regression is a step that is zero below the cutoff and one above it. Six singular values are marked on both rules, with the vertical gap between them drawn in gray.",
    caption,
    children: (
      <>
        <text
          x={xL - 2}
          y={26}
          className="fill-foreground"
          fontSize={13}
          fontWeight={600}
        >
          Shrinkage factor applied to principal direction j
        </text>
        <text
          x={xL - 2}
          y={45}
          className="fill-muted-foreground"
          fontSize={11.5}
        >
          OLS uses 1 on every direction. These two rules decide how much of that
          to keep.
        </text>

        {/* ---------------- legend ---------------- */}
        {(
          [
            [80, "#dc2626", 2.6, "none", "ridge: dⱼ²/(dⱼ²+λ), λ = 4"],
            [320, "#2563eb", 3, "none", "PCR: 1 for the top m = 3, else 0"],
          ] as [number, string, number, string, string][]
        ).map(([x, color, wid, dash, label]) => (
          <g key={label}>
            <line
              x1={x}
              y1={70}
              x2={x + 24}
              y2={70}
              stroke={color}
              strokeWidth={wid}
              strokeDasharray={dash}
            />
            <text
              x={x + 31}
              y={74}
              className="fill-foreground"
              fontSize={12}
            >
              {label}
            </text>
          </g>
        ))}

        {/* ---------------- axes ---------------- */}
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line
              x1={xL}
              y1={py(t)}
              x2={xR}
              y2={py(t)}
              className="text-border"
              stroke="currentColor"
              strokeWidth={1}
              opacity={0.55}
            />
            <text
              x={xL - 8}
              y={py(t) + 4}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize={11}
            >
              {t}
            </text>
          </g>
        ))}
        <line
          x1={xL}
          y1={yTop - 16}
          x2={xL}
          y2={yBot}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1.4}
        />
        <line
          x1={xL}
          y1={yBot}
          x2={xR}
          y2={yBot}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1.4}
        />
        <text
          x={26}
          y={(yTop + yBot) / 2}
          textAnchor="middle"
          transform={`rotate(-90 26 ${(yTop + yBot) / 2})`}
          className="fill-muted-foreground"
          fontSize={12}
        >
          shrinkage factor
        </text>

        {/* ticks at the six singular values — these are the x axis labels */}
        {cols.map((d) => (
          <g key={`tick${d}`}>
            <line
              x1={px(d)}
              y1={yBot}
              x2={px(d)}
              y2={yBot + 5}
              className="text-border"
              stroke="currentColor"
              strokeWidth={1.2}
            />
            <text
              x={px(d)}
              y={yBot + 18}
              textAnchor="middle"
              className="fill-foreground"
              fontSize={11}
            >
              {fmt2(d)}
            </text>
          </g>
        ))}
        <text
          x={(xL + xR) / 2}
          y={yBot + 38}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={12}
        >
          singular value dⱼ — small means a weak, collinear direction
        </text>

        {/* ---------------- cutoff and λ marks ---------------- */}
        <line
          x1={px(dCut)}
          y1={yBot}
          x2={px(dCut)}
          y2={yTop - 14}
          stroke="#f59e0b"
          strokeWidth={1.4}
          strokeDasharray="5 4"
        />
        <line
          x1={xL}
          y1={py(0.5)}
          x2={px(dCut)}
          y2={py(0.5)}
          stroke="#f59e0b"
          strokeWidth={1.4}
          strokeDasharray="5 4"
        />
        <text x={px(dCut) + 7} y={yTop - 18} fontSize={12} fill="#d97706">
          PCR cutoff — the m-th singular value
        </text>
        <text x={xL + 6} y={py(0.5) - 9} fontSize={12} fill="#d97706">
          ridge = ½ exactly at dⱼ = √λ = 2
        </text>

        {/* ---------------- gaps between the two rules ---------------- */}
        {spectrum.map((d) => (
          <line
            key={`gap${d}`}
            x1={px(d)}
            y1={py(pcr(d))}
            x2={px(d)}
            y2={py(ridge(d))}
            stroke="#9ca3af"
            strokeWidth={1.3}
            strokeDasharray="3 3"
          />
        ))}

        {/* ---------------- PCR: the step ---------------- */}
        <line
          x1={xL}
          y1={py(0)}
          x2={px(dCut)}
          y2={py(0)}
          stroke="#2563eb"
          strokeWidth={3}
        />
        <line
          x1={px(dCut)}
          y1={py(0)}
          x2={px(dCut)}
          y2={py(1)}
          stroke="#2563eb"
          strokeWidth={3}
        />
        <line
          x1={px(dCut)}
          y1={py(1)}
          x2={xR}
          y2={py(1)}
          stroke="#2563eb"
          strokeWidth={3}
        />

        {/* ---------------- ridge: the ramp ---------------- */}
        <polyline
          points={ridgePts.join(" ")}
          fill="none"
          stroke="#dc2626"
          strokeWidth={2.6}
        />
        <circle cx={px(dCut)} cy={py(0.5)} r={4.2} fill="#f59e0b" />

        {/* ---------------- the six singular values on both rules ------- */}
        {spectrum.map((d) => (
          <g key={`pt${d}`}>
            <circle cx={px(d)} cy={py(pcr(d))} r={4} fill="#2563eb" />
            <circle cx={px(d)} cy={py(ridge(d))} r={4} fill="#dc2626" />
          </g>
        ))}

        {/* ---------------- the point of the figure ---------------- */}
        <text
          x={392}
          y={238}
          className="fill-foreground"
          fontSize={12.5}
          fontWeight={600}
        >
          Ridge replaces the cliff with a ramp.
        </text>
        <text x={392} y={257} className="fill-muted-foreground" fontSize={12}>
          The weakest directions shrink hardest,
        </text>
        <text x={392} y={274} className="fill-muted-foreground" fontSize={12}>
          to 0.17 and 0.03, but never to zero.
        </text>
        <text x={392} y={300} fontSize={11.5} fill="#6b7280">
          Gray gaps: what ridge keeps, PCR deletes.
        </text>

        {/* ---------------- the two rules as numbers ---------------- */}
        <line
          x1={40}
          y1={rowRidge - 16}
          x2={xR}
          y2={rowRidge - 16}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.5}
        />
        <line
          x1={px(dCut)}
          y1={rowRidge - 16}
          x2={px(dCut)}
          y2={rowPcr + 8}
          stroke="#f59e0b"
          strokeWidth={1.2}
          strokeDasharray="4 4"
        />
        <text
          x={xL - 8}
          y={rowRidge}
          textAnchor="end"
          fontSize={11.5}
          fill="#dc2626"
          fontWeight={600}
        >
          ridge
        </text>
        <text
          x={xL - 8}
          y={rowPcr}
          textAnchor="end"
          fontSize={11.5}
          fill="#2563eb"
          fontWeight={600}
        >
          PCR
        </text>
        {cols.map((d) => (
          <g key={`col${d}`}>
            <text
              x={px(d)}
              y={rowRidge}
              textAnchor="middle"
              fontSize={11}
              fill="#dc2626"
            >
              {fmt2(ridge(d))}
            </text>
            <text
              x={px(d)}
              y={rowPcr}
              textAnchor="middle"
              fontSize={11}
              fill="#2563eb"
            >
              {pcr(d)}
            </text>
          </g>
        ))}
      </>
    ),
  });
}
