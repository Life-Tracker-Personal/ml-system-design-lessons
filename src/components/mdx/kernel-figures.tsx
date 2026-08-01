// Inline SVG figures for the kernel-methods & instance-based lesson (c1.6).
// Every figure is a server component: no client JS, no charting dependency,
// no external image requests. All pseudo-random shapes flow through the
// seeded Mulberry32 in figure-helpers.tsx so builds are reproducible.

import { axisTitles, figureFrame, gauss, linScale, PALETTE, rng } from "./figure-helpers";

type LPt = { x: number; y: number; c: 0 | 1 };

// ---------------------------------------------------------------------------
// 1. SVMMarginDiagram — the "hard-margin" picture: a solid decision hyperplane,
//    two dashed margin planes at ±1, support vectors sitting on the margins,
//    and the 2/‖w‖ margin-width label.
// ---------------------------------------------------------------------------
export function SVMMarginDiagram({ caption }: { caption?: string }) {
  const W = 560;
  const H = 340;
  const pad = { top: 18, right: 18, bottom: 42, left: 46 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const xMin = -3.5;
  const xMax = 3.5;
  const yMin = -2.2;
  const yMax = 2.2;
  const xToPx = linScale(xMin, xMax, pad.left, pad.left + plotW);
  const yToPx = linScale(yMin, yMax, pad.top + plotH, pad.top);

  // Boundary x + y = 0; margins x + y = ±1.
  const r = rng(9137);
  const nEach = 13;
  const pts: Array<LPt & { sv?: boolean }> = [];
  for (let i = 0; i < nEach; i++) {
    let x = -1.8 + gauss(r) * 0.55;
    let y = -1.8 + gauss(r) * 0.55;
    if (x + y > -1.4) {
      const s = x + y + 1.4;
      x -= s * 0.5;
      y -= s * 0.5;
    }
    pts.push({ x, y, c: 0 });
  }
  for (let i = 0; i < nEach; i++) {
    let x = 1.8 + gauss(r) * 0.55;
    let y = 1.8 + gauss(r) * 0.55;
    if (x + y < 1.4) {
      const s = 1.4 - (x + y);
      x += s * 0.5;
      y += s * 0.5;
    }
    pts.push({ x, y, c: 1 });
  }
  // Hand-placed support vectors sitting exactly on the margins.
  pts.push({ x: -0.4, y: -0.6, c: 0, sv: true });
  pts.push({ x: -1.2, y: 0.2, c: 0, sv: true });
  pts.push({ x: 0.5, y: 0.5, c: 1, sv: true });
  pts.push({ x: 1.3, y: -0.3, c: 1, sv: true });

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Scatter of two linearly separable classes. A solid decision hyperplane runs through the origin, flanked by two dashed margin planes at plus and minus one. Four points sit on the margins and are circled in amber as the support vectors; a double-arrow labelled two over norm w spans the margin planes.",
    caption,
    children: (
      <>
        <defs>
          <marker
            id="svm-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" className="fill-foreground" />
          </marker>
        </defs>

        <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="none"
          className="text-border" stroke="currentColor" strokeWidth={1} opacity={0.6} />

        {/* margin planes (dashed) */}
        <line x1={xToPx(-1.2)} y1={yToPx(2.2)} x2={xToPx(3.2)} y2={yToPx(-2.2)}
          className="text-muted-foreground" stroke="currentColor" strokeWidth={1.4} strokeDasharray="6 4" />
        <line x1={xToPx(-3.2)} y1={yToPx(2.2)} x2={xToPx(1.2)} y2={yToPx(-2.2)}
          className="text-muted-foreground" stroke="currentColor" strokeWidth={1.4} strokeDasharray="6 4" />

        {/* decision hyperplane (solid) */}
        <line x1={xToPx(-2.2)} y1={yToPx(2.2)} x2={xToPx(2.2)} y2={yToPx(-2.2)}
          className="text-foreground" stroke="currentColor" strokeWidth={1.9} />

        {/* SV rings — behind the points */}
        {pts.filter((p) => p.sv).map((p, i) => (
          <circle key={`sv${i}`} cx={xToPx(p.x)} cy={yToPx(p.y)} r={8.5}
            fill="none" stroke={PALETTE.amber} strokeWidth={2.2} />
        ))}

        {/* points */}
        {pts.map((p, i) => (
          <circle key={`p${i}`} cx={xToPx(p.x)} cy={yToPx(p.y)} r={4}
            fill={p.c === 0 ? PALETTE.red : PALETTE.blue} />
        ))}

        {/* margin-width arrow perpendicular to boundary, from x+y=-1 to x+y=1 */}
        <line x1={xToPx(1)} y1={yToPx(-2)} x2={xToPx(2)} y2={yToPx(-1)}
          className="text-foreground" stroke="currentColor" strokeWidth={1.6}
          markerStart="url(#svm-arrow)" markerEnd="url(#svm-arrow)" />
        <text x={xToPx(2.15)} y={yToPx(-1.35)} className="fill-foreground" fontSize={12}>
          2 / ‖w‖
        </text>
        <text x={xToPx(2.15)} y={yToPx(-1.75)} className="fill-muted-foreground" fontSize={11}>
          (margin)
        </text>

        {/* labels for the three lines */}
        <text x={xToPx(-2.6)} y={yToPx(2.05)} className="fill-muted-foreground" fontSize={11}>
          wᵀx + b = −1
        </text>
        <text x={xToPx(-1.15)} y={yToPx(1.7)} className="fill-foreground" fontSize={11}>
          wᵀx + b = 0
        </text>
        <text x={xToPx(-0.4)} y={yToPx(1.35)} className="fill-muted-foreground" fontSize={11}>
          wᵀx + b = +1
        </text>
        <text x={xToPx(-0.4) + 12} y={yToPx(-0.6) + 4} fill={PALETTE.amber} fontSize={11}>
          support vectors
        </text>

        {axisTitles({ xLabel: "x₁", yLabel: "x₂", plotW, plotH, pad, H })}
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 2. KernelLift1Dto2D — same seven points, first on a number line (two classes
//    interleave, not linearly separable) then lifted to (x, x²) where a
//    horizontal line at y = 1 separates them.
// ---------------------------------------------------------------------------
export function KernelLift1Dto2D({ caption }: { caption?: string }) {
  const W = 640;
  const H = 340;
  const panelW = 300;
  const gap = 40;

  const redXs = [-0.5, 0.2, 0.6]; // |x| ≤ 1
  const blueXs = [-1.5, -1.2, 1.2, 1.6]; // |x| > 1

  // Left panel: 1D number line.
  const lp = { top: 60, right: 20, bottom: 60, left: 20 };
  const leftPlotW = panelW - lp.left - lp.right;
  const leftAxisY = lp.top + (H - lp.top - lp.bottom) / 2;
  const xDataMin = -2.1;
  const xDataMax = 2.1;
  const leftXToPx = linScale(xDataMin, xDataMax, lp.left, lp.left + leftPlotW);
  const xTicks1D = [-2, -1, 0, 1, 2];

  // Right panel: (x, x²).
  const rOff = panelW + gap;
  const rp = { top: 60, right: 20, bottom: 42, left: 42 };
  const rightPlotW = panelW - rp.left - rp.right;
  const rightPlotH = H - rp.top - rp.bottom;
  const yDataMin = -0.2;
  const yDataMax = 3.2;
  const rXToPx = (x: number) =>
    rOff + rp.left + ((x - xDataMin) / (xDataMax - xDataMin)) * rightPlotW;
  const rYToPx = (y: number) =>
    rp.top + (1 - (y - yDataMin) / (yDataMax - yDataMin)) * rightPlotH;

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Left: seven points on a one-dimensional number line, red inside the interval negative one to positive one and blue outside, not linearly separable. Right: the same points lifted to phi of x equals x comma x squared, with a horizontal separator at y equals one cleanly dividing the two classes.",
    caption,
    children: (
      <>
        {/* LEFT title */}
        <text x={panelW / 2} y={26} textAnchor="middle" className="fill-foreground" fontSize={12}>
          Original: not separable in 1D
        </text>

        {/* red interval band */}
        <rect x={leftXToPx(-1)} y={leftAxisY - 22} width={leftXToPx(1) - leftXToPx(-1)}
          height={44} fill={PALETTE.red} fillOpacity={0.08} />

        {/* number line */}
        <line x1={leftXToPx(xDataMin) + 4} x2={leftXToPx(xDataMax) - 4}
          y1={leftAxisY} y2={leftAxisY}
          className="text-foreground" stroke="currentColor" strokeWidth={1.2} opacity={0.7} />

        {/* ticks */}
        {xTicks1D.map((t, i) => (
          <g key={`lt${i}`}>
            <line x1={leftXToPx(t)} x2={leftXToPx(t)} y1={leftAxisY - 5} y2={leftAxisY + 5}
              className="text-muted-foreground" stroke="currentColor" strokeWidth={1} />
            <text x={leftXToPx(t)} y={leftAxisY + 20} textAnchor="middle"
              className="fill-muted-foreground" fontSize={11}>{t}</text>
          </g>
        ))}

        {/* 1D points */}
        {redXs.map((x, i) => (
          <circle key={`lr${i}`} cx={leftXToPx(x)} cy={leftAxisY} r={5.5} fill={PALETTE.red} />
        ))}
        {blueXs.map((x, i) => (
          <circle key={`lb${i}`} cx={leftXToPx(x)} cy={leftAxisY} r={5.5} fill={PALETTE.blue} />
        ))}

        <text x={panelW / 2} y={H - 22} textAnchor="middle"
          className="fill-muted-foreground" fontSize={11}>
          no single threshold on x separates the classes
        </text>
        <text x={panelW / 2} y={H - 6} textAnchor="middle" className="fill-foreground" fontSize={12}>
          x
        </text>

        {/* RIGHT title */}
        <text x={rOff + panelW / 2} y={26} textAnchor="middle" className="fill-foreground" fontSize={12}>
          Lifted: separable in ϕ(x) = (x, x²)
        </text>

        {/* right frame */}
        <rect x={rOff + rp.left} y={rp.top} width={rightPlotW} height={rightPlotH}
          fill="none" className="text-border" stroke="currentColor" strokeWidth={1} opacity={0.6} />

        {/* axes */}
        <line x1={rXToPx(xDataMin)} x2={rXToPx(xDataMax)} y1={rYToPx(0)} y2={rYToPx(0)}
          className="text-foreground" stroke="currentColor" strokeWidth={1.1} opacity={0.5} />
        <line x1={rXToPx(0)} x2={rXToPx(0)} y1={rYToPx(yDataMin)} y2={rYToPx(yDataMax)}
          className="text-foreground" stroke="currentColor" strokeWidth={1.1} opacity={0.5} />

        {/* y ticks */}
        {[1, 2, 3].map((v, i) => (
          <g key={`ry${i}`}>
            <line x1={rXToPx(xDataMin)} x2={rXToPx(xDataMax)} y1={rYToPx(v)} y2={rYToPx(v)}
              className="text-border" stroke="currentColor" strokeWidth={1} opacity={0.4} />
            <text x={rXToPx(xDataMin) - 6} y={rYToPx(v) + 3.5} textAnchor="end"
              className="fill-muted-foreground" fontSize={11}>{v}</text>
          </g>
        ))}
        {/* x ticks */}
        {xTicks1D.map((t, i) => (
          <text key={`rx${i}`} x={rXToPx(t)} y={rYToPx(0) + 16} textAnchor="middle"
            className="fill-muted-foreground" fontSize={11}>{t}</text>
        ))}

        {/* separating hyperplane at y = 1 */}
        <line x1={rXToPx(xDataMin)} x2={rXToPx(xDataMax)} y1={rYToPx(1)} y2={rYToPx(1)}
          stroke={PALETTE.gray} strokeWidth={1.5} strokeDasharray="5 4" />
        <text x={rXToPx(xDataMax) - 6} y={rYToPx(1) - 4} textAnchor="end"
          fill={PALETTE.gray} fontSize={11}>
          x² = 1  (separator)
        </text>

        {/* lifted points */}
        {redXs.map((x, i) => (
          <circle key={`rr${i}`} cx={rXToPx(x)} cy={rYToPx(x * x)} r={5} fill={PALETTE.red} />
        ))}
        {blueXs.map((x, i) => (
          <circle key={`rb${i}`} cx={rXToPx(x)} cy={rYToPx(x * x)} r={5} fill={PALETTE.blue} />
        ))}

        <text x={rOff + panelW / 2} y={H - 6} textAnchor="middle"
          className="fill-foreground" fontSize={12}>x</text>
        <text
          transform={`translate(${rOff + rp.left - 26} ${rp.top + rightPlotH / 2}) rotate(-90)`}
          textAnchor="middle" className="fill-foreground" fontSize={12}>
          x²
        </text>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 3. kNNBoundaries — same scatter classified with k = 1 (jagged, memorises
//    noise) versus k = 15 (smoother, more bias). Boundaries rendered by
//    testing a coarse grid of query points.
// ---------------------------------------------------------------------------
export function kNNBoundaries({ caption }: { caption?: string }) {
  const W = 720;
  const H = 340;
  const panelW = 340;
  const gap = 40;
  const pad = { top: 32, bottom: 20, left: 18, right: 18 };
  const plotW = panelW - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const xMin = 0;
  const xMax = 1;
  const yMin = 0;
  const yMax = 1;

  // 60 points: two Gaussian classes plus 10-11% label-flip noise, so k=1
  // can carve tiny pockets around the flipped labels.
  const r = rng(2027);
  const N = 60;
  const points: LPt[] = [];
  for (let i = 0; i < N; i++) {
    const base: 0 | 1 = i < N / 2 ? 0 : 1;
    const cx = base === 0 ? 0.35 : 0.65;
    const cy = 0.5;
    const x = Math.max(0.05, Math.min(0.95, cx + gauss(r) * 0.13));
    const y = Math.max(0.05, Math.min(0.95, cy + gauss(r) * 0.2));
    const flip = r() < 0.11;
    const c: 0 | 1 = flip ? ((1 - base) as 0 | 1) : base;
    points.push({ x, y, c });
  }

  const knnClass = (qx: number, qy: number, k: number): 0 | 1 => {
    const ds = points.map((p) => ({
      d: (p.x - qx) ** 2 + (p.y - qy) ** 2,
      c: p.c,
    }));
    ds.sort((a, b) => a.d - b.d);
    let s = 0;
    for (let i = 0; i < k; i++) s += ds[i].c === 0 ? -1 : 1;
    return s < 0 ? 0 : 1;
  };

  const gW = 40;
  const gH = 30;
  const cellW = plotW / gW;
  const cellH = plotH / gH;
  type Cell = { gx: number; gy: number; c: 0 | 1 };
  const cellsAt = (offX: number, k: number): Cell[] => {
    const out: Cell[] = [];
    for (let gj = 0; gj < gH; gj++) {
      for (let gi = 0; gi < gW; gi++) {
        const qx = xMin + ((gi + 0.5) / gW) * (xMax - xMin);
        // grid row 0 is TOP of plot → maps to high data-y
        const qy = yMax - ((gj + 0.5) / gH) * (yMax - yMin);
        out.push({
          gx: offX + pad.left + gi * cellW,
          gy: pad.top + gj * cellH,
          c: knnClass(qx, qy, k),
        });
      }
    }
    return out;
  };

  const leftCells = cellsAt(0, 1);
  const rightCells = cellsAt(panelW + gap, 15);
  const rightOffX = panelW + gap;

  const ptCx = (offX: number, p: LPt) =>
    offX + pad.left + ((p.x - xMin) / (xMax - xMin)) * plotW;
  const ptCy = (p: LPt) =>
    pad.top + (1 - (p.y - yMin) / (yMax - yMin)) * plotH;

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two panels of the same two-class scatter with different k values in k-nearest-neighbours. Left k equals one shows a jagged boundary that carves pockets around noisy points; right k equals fifteen shows a much smoother boundary that ignores small pockets.",
    caption,
    children: (
      <>
        {/* panel titles */}
        <text x={panelW / 2} y={20} textAnchor="middle" className="fill-foreground" fontSize={12}>
          k = 1  (high variance)
        </text>
        <text x={rightOffX + panelW / 2} y={20} textAnchor="middle"
          className="fill-foreground" fontSize={12}>
          k = 15  (high bias)
        </text>

        {/* LEFT cells */}
        {leftCells.map((cell, i) => (
          <rect key={`lc${i}`} x={cell.gx} y={cell.gy}
            width={cellW + 0.5} height={cellH + 0.5}
            fill={cell.c === 0 ? PALETTE.red : PALETTE.blue} fillOpacity={0.18} />
        ))}

        {/* RIGHT cells */}
        {rightCells.map((cell, i) => (
          <rect key={`rc${i}`} x={cell.gx} y={cell.gy}
            width={cellW + 0.5} height={cellH + 0.5}
            fill={cell.c === 0 ? PALETTE.red : PALETTE.blue} fillOpacity={0.18} />
        ))}

        {/* panel frames */}
        <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="none"
          className="text-border" stroke="currentColor" strokeWidth={1} opacity={0.6} />
        <rect x={rightOffX + pad.left} y={pad.top} width={plotW} height={plotH} fill="none"
          className="text-border" stroke="currentColor" strokeWidth={1} opacity={0.6} />

        {/* points (both panels) */}
        {points.map((p, i) => (
          <circle key={`lp${i}`} cx={ptCx(0, p)} cy={ptCy(p)} r={3.4}
            fill={p.c === 0 ? PALETTE.red : PALETTE.blue} stroke="white" strokeWidth={0.9} />
        ))}
        {points.map((p, i) => (
          <circle key={`rp${i}`} cx={ptCx(rightOffX, p)} cy={ptCy(p)} r={3.4}
            fill={p.c === 0 ? PALETTE.red : PALETTE.blue} stroke="white" strokeWidth={0.9} />
        ))}
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 4. DistanceConcentration — for d ∈ {2, 10, 100, 1000}, draw min-to-max
//    pairwise Euclidean distance range normalised by mean distance. The range
//    collapses to a point at high d, killing nearest-neighbour signal in raw
//    high-dimensional Euclidean space.
// ---------------------------------------------------------------------------
export function DistanceConcentration({ caption }: { caption?: string }) {
  const W = 560;
  const H = 280;
  const pad = { top: 32, right: 26, bottom: 44, left: 68 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const ds = [2, 10, 100, 1000];
  const n = 100;

  const stats = ds.map((d) => {
    const r = rng(1000 + d);
    const pts: number[][] = [];
    for (let i = 0; i < n; i++) {
      const p = new Array<number>(d);
      for (let j = 0; j < d; j++) p[j] = r();
      pts.push(p);
    }
    let minD = Infinity;
    let maxD = -Infinity;
    let sumD = 0;
    let count = 0;
    for (let i = 0; i < n; i++) {
      const pi = pts[i];
      for (let j = i + 1; j < n; j++) {
        const pj = pts[j];
        let s = 0;
        for (let k = 0; k < d; k++) {
          const diff = pi[k] - pj[k];
          s += diff * diff;
        }
        const dist = Math.sqrt(s);
        if (dist < minD) minD = dist;
        if (dist > maxD) maxD = dist;
        sumD += dist;
        count++;
      }
    }
    const mean = sumD / count;
    return { d, min: minD / mean, max: maxD / mean };
  });

  const xAxisMax = 2.9;
  const xToPx = linScale(0, xAxisMax, pad.left, pad.left + plotW);
  const xTicks = [0, 0.5, 1, 1.5, 2, 2.5];
  const rowY = ds.map(
    (_, i) => pad.top + 14 + (i * (plotH - 20)) / (ds.length - 1),
  );

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Horizontal bars of minimum-to-maximum pairwise Euclidean distance range, normalised by mean distance, for 100 uniform-in-unit-cube points in dimension 2, 10, 100, and 1000. The range collapses toward a single point at dimension 1000, illustrating distance concentration.",
    caption,
    children: (
      <>
        {/* mean-distance vertical line at x=1 */}
        <line x1={xToPx(1)} x2={xToPx(1)} y1={pad.top - 6} y2={pad.top + plotH + 6}
          className="text-foreground" stroke="currentColor"
          strokeWidth={1} strokeDasharray="4 3" opacity={0.55} />
        <text x={xToPx(1)} y={pad.top - 10} textAnchor="middle"
          className="fill-muted-foreground" fontSize={11}>
          mean pairwise distance
        </text>

        {/* baseline */}
        <line x1={pad.left} x2={pad.left + plotW}
          y1={pad.top + plotH + 6} y2={pad.top + plotH + 6}
          className="text-muted-foreground" stroke="currentColor" strokeWidth={1} opacity={0.5} />

        {/* x ticks */}
        {xTicks.map((t, i) => (
          <text key={`xt${i}`} x={xToPx(t)} y={pad.top + plotH + 22} textAnchor="middle"
            className="fill-muted-foreground" fontSize={11}>{t.toFixed(1)}</text>
        ))}

        {/* rows */}
        {stats.map((s, i) => {
          const y = rowY[i];
          const cMax = Math.min(s.max, xAxisMax);
          const cMin = Math.max(s.min, 0);
          return (
            <g key={`row${i}`}>
              <text x={pad.left - 12} y={y + 4} textAnchor="end"
                className="fill-foreground" fontSize={12}>d = {s.d}</text>

              {/* min-max range bar */}
              <line x1={xToPx(cMin)} x2={xToPx(cMax)} y1={y} y2={y}
                stroke={PALETTE.blue} strokeWidth={5} strokeLinecap="round" opacity={0.75} />

              {/* min tick + label */}
              <line x1={xToPx(cMin)} x2={xToPx(cMin)} y1={y - 8} y2={y + 8}
                stroke={PALETTE.blue} strokeWidth={1.6} />
              <text x={xToPx(cMin)} y={y - 12} textAnchor="middle"
                className="fill-muted-foreground" fontSize={10}>{s.min.toFixed(2)}</text>

              {/* max tick + label */}
              <line x1={xToPx(cMax)} x2={xToPx(cMax)} y1={y - 8} y2={y + 8}
                stroke={PALETTE.blue} strokeWidth={1.6} />
              <text x={xToPx(cMax)} y={y - 12} textAnchor="middle"
                className="fill-muted-foreground" fontSize={10}>{s.max.toFixed(2)}</text>

              {/* mean marker */}
              <circle cx={xToPx(1)} cy={y} r={3.2} fill={PALETTE.red} />
            </g>
          );
        })}

        {/* d = 1000 annotation */}
        <text x={xToPx(1.4)} y={rowY[3] + 4} fill={PALETTE.red} fontSize={11}>
          distances become uninformative →
        </text>

        {/* x-axis title */}
        <text x={pad.left + plotW / 2} y={H - 8} textAnchor="middle"
          className="fill-foreground" fontSize={12}>
          pairwise distance / mean pairwise distance
        </text>
      </>
    ),
  });
}
