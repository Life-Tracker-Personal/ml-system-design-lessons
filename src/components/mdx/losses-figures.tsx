// Inline SVG figures for the regression-losses lesson (c1.2).
// Server components: no client JS, no charting dependency, no external image
// requests. Every curve is closed-form, so builds are fully reproducible
// (Math.random / Date are banned in server-rendered artifacts of this project).

import { figureFrame, linScale, polyPath, PALETTE } from "./figure-helpers";

const SAMPLES = Array.from({ length: 241 }, (_, i) => -4 + (8 * i) / 240);

// ---------------------------------------------------------------------------
// loss = −log p(noise): a noise density (left) and its negative log-density,
// i.e. the loss it induces under MLE (right). Gaussian → parabola (MSE);
// Laplace → V (MAE). This is the organizing thesis of the whole lesson.
// ---------------------------------------------------------------------------
export function NoiseModelToLoss({ caption }: { caption?: string }) {
  const W = 560;
  const H = 300;
  const top = 40;
  const bot = H - 44;

  // left panel — densities p(r)
  const lx0 = 46;
  const lx1 = 258;
  const lX = linScale(-4, 4, lx0, lx1);
  const dY = linScale(0, 0.55, bot, top); // density up

  // right panel — loss = −log p(r) (constants dropped)
  const rx0 = 320;
  const rx1 = W - 18;
  const rX = linScale(-4, 4, rx0, rx1);
  const lossY = linScale(0, 8, bot, top);

  const gaussDens = (r: number) => Math.exp(-(r * r) / 2) / Math.sqrt(2 * Math.PI);
  const lapDens = (r: number) => 0.5 * Math.exp(-Math.abs(r));
  const gaussLoss = (r: number) => 0.5 * r * r; // −log Gaussian ⇒ MSE
  const lapLoss = (r: number) => Math.abs(r); // −log Laplace ⇒ MAE

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two panels. Left: a Gaussian bell and a sharper-peaked, heavier-tailed Laplace density over the residual. Right: their negative log-densities — a parabola for the Gaussian (squared-error loss) and a V for the Laplace (absolute-error loss).",
    caption,
    children: (
      <>
        {/* panel titles */}
        <text x={(lx0 + lx1) / 2} y={22} textAnchor="middle" className="fill-foreground" fontSize={12}>
          noise density  p(r)
        </text>
        <text x={(rx0 + rx1) / 2} y={22} textAnchor="middle" className="fill-foreground" fontSize={12}>
          loss  = −log p(r)
        </text>

        {/* baselines */}
        {[
          [lx0, lx1, dY(0)],
          [rx0, rx1, lossY(0)],
        ].map(([a, b, y], i) => (
          <line
            key={`base${i}`}
            x1={a}
            x2={b}
            y1={y}
            y2={y}
            className="text-border"
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.6}
          />
        ))}

        {/* r = 0 verticals */}
        {[lX(0), rX(0)].map((x, i) => (
          <line
            key={`v${i}`}
            x1={x}
            x2={x}
            y1={top}
            y2={bot}
            className="text-border"
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.4}
          />
        ))}

        {/* densities */}
        <path d={polyPath(SAMPLES, gaussDens, lX, dY)} fill="none" stroke={PALETTE.blue} strokeWidth={2.3} />
        <path d={polyPath(SAMPLES, lapDens, lX, dY)} fill="none" stroke={PALETTE.red} strokeWidth={2.3} />

        {/* losses */}
        <path d={polyPath(SAMPLES, gaussLoss, rX, lossY)} fill="none" stroke={PALETTE.blue} strokeWidth={2.3} />
        <path d={polyPath(SAMPLES, lapLoss, rX, lossY)} fill="none" stroke={PALETTE.red} strokeWidth={2.3} />

        {/* the −log(·) mapping arrow between panels */}
        <line
          x1={lx1 + 12}
          x2={rx0 - 12}
          y1={(top + bot) / 2}
          y2={(top + bot) / 2}
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.3}
          markerEnd="url(#nml-arrow)"
        />
        <defs>
          <marker id="nml-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" className="fill-muted-foreground" />
          </marker>
        </defs>
        <text
          x={(lx1 + rx0) / 2}
          y={(top + bot) / 2 - 8}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
        >
          −log
        </text>

        {/* x-axis labels */}
        <text x={(lx0 + lx1) / 2} y={H - 8} textAnchor="middle" className="fill-foreground" fontSize={12}>
          residual  r
        </text>
        <text x={(rx0 + rx1) / 2} y={H - 8} textAnchor="middle" className="fill-foreground" fontSize={12}>
          residual  r
        </text>

        {/* legend */}
        <g transform={`translate(${lx0 + 2} ${top - 2})`}>
          {[
            { label: "Gaussian  →  MSE", color: PALETTE.blue },
            { label: "Laplace  →  MAE", color: PALETTE.red },
          ].map((row, i) => (
            <g key={i} transform={`translate(0 ${i * 15})`}>
              <line x1={0} x2={20} y1={4} y2={4} stroke={row.color} strokeWidth={2.4} />
              <text x={26} y={7.5} className="fill-muted-foreground" fontSize={11}>
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
// Pinball / quantile loss ρ_q(r) for a few quantile levels. Asymmetric V:
// slope q on the right, 1−q on the left. Minimizing it predicts the q-th
// conditional quantile; q = 0.5 is symmetric (½·MAE ⇒ the median).
// ---------------------------------------------------------------------------
export function QuantilePinball({ caption }: { caption?: string }) {
  const W = 560;
  const H = 300;
  const pad = { top: 20, right: 18, bottom: 46, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const rMin = -3;
  const rMax = 3;
  const lossMax = 2.7;
  const xToPx = (r: number) => pad.left + ((r - rMin) / (rMax - rMin)) * plotW;
  const yToPx = (v: number) => pad.top + (1 - v / lossMax) * plotH;

  const rs = Array.from({ length: 241 }, (_, i) => rMin + ((rMax - rMin) * i) / 240);
  const pinball = (q: number, r: number) => Math.max(q * r, (q - 1) * r);

  const series = [
    { q: 0.1, color: PALETTE.amber, label: "q = 0.1  (under-predict cheap)" },
    { q: 0.5, color: PALETTE.blue, label: "q = 0.5  (½·MAE → median)" },
    { q: 0.9, color: PALETTE.red, label: "q = 0.9  (over-predict cheap)" },
  ];

  const yTicks = [0, 1, 2];
  const xTicks = [-3, -2, -1, 0, 1, 2, 3];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Three asymmetric V-shaped pinball-loss curves over the residual for quantile levels 0.1, 0.5, and 0.9. The 0.5 curve is symmetric; the 0.1 and 0.9 curves tilt so under- and over-prediction cost differently.",
    caption,
    children: (
      <>
        {yTicks.map((v, i) => (
          <g key={`y${i}`}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={yToPx(v)}
              y2={yToPx(v)}
              className="text-border"
              stroke="currentColor"
              strokeWidth={1}
              opacity={0.5}
            />
            <text x={pad.left - 8} y={yToPx(v) + 3.5} textAnchor="end" className="fill-muted-foreground" fontSize={11}>
              {v}
            </text>
          </g>
        ))}

        {/* r = 0 vertical */}
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

        {series.map((s, i) => (
          <path
            key={i}
            d={polyPath(rs, (r) => pinball(s.q, r), xToPx, yToPx)}
            fill="none"
            stroke={s.color}
            strokeWidth={2.3}
          />
        ))}

        <text x={pad.left + plotW / 2} y={H - 6} textAnchor="middle" className="fill-foreground" fontSize={12}>
          residual  r = y − ŷ
        </text>
        <text
          transform={`translate(13 ${pad.top + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          loss  ρ_q(r)
        </text>

        {/* legend */}
        <g transform={`translate(${pad.left + 12} ${pad.top + 6})`}>
          {series.map((s, i) => (
            <g key={i} transform={`translate(0 ${i * 16})`}>
              <line x1={0} x2={22} y1={6} y2={6} stroke={s.color} strokeWidth={2.4} />
              <text x={28} y={9} className="fill-muted-foreground" fontSize={11}>
                {s.label}
              </text>
            </g>
          ))}
        </g>
      </>
    ),
  });
}
