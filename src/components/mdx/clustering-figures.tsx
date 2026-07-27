// Inline SVG figures for the unsupervised-learning lesson (c1.7). Server-only:
// no client JS, no charting dependency, no external asset requests. All
// randomness flows through the deterministic rng() so builds are reproducible.

import {
  PALETTE,
  figureFrame,
  gauss,
  legendRow,
  linScale,
  rng,
} from "./figure-helpers";

type Pt = { x: number; y: number };

// ---------------------------------------------------------------------------
// 1. KMeansVoronoi — convex-cell success on blobs vs failure on nested rings
// ---------------------------------------------------------------------------
export function KMeansVoronoi({ caption }: { caption?: string }) {
  const panelW = 350;
  const panelH = 340;
  const gap = 20;
  const W = panelW * 2 + gap;
  const H = panelH + 8;

  // Shared data-space scale for both panels: x, y in [-5, 5].
  const dMin = -5;
  const dMax = 5;

  // ---- Left panel: three well-separated Gaussian blobs -------------------
  const centres = [
    { x: -2, y: 0 },
    { x: 2, y: 1 },
    { x: 0, y: -2 },
  ];
  const blobColors = [PALETTE.blue, PALETTE.red, PALETTE.green];
  const rL = rng(42);
  const blobPts: { p: Pt; k: number }[] = [];
  for (let k = 0; k < centres.length; k++) {
    for (let i = 0; i < 40; i++) {
      blobPts.push({
        p: {
          x: centres[k].x + gauss(rL) * 0.6,
          y: centres[k].y + gauss(rL) * 0.6,
        },
        k,
      });
    }
  }

  // ---- Right panel: two concentric rings ---------------------------------
  const rR = rng(2027);
  const ringPts: { p: Pt; ring: number }[] = [];
  for (let i = 0; i < 60; i++) {
    const t = (i / 60) * 2 * Math.PI + rR() * 0.05;
    ringPts.push({
      p: {
        x: 1 * Math.cos(t) + gauss(rR) * 0.12,
        y: 1 * Math.sin(t) + gauss(rR) * 0.12,
      },
      ring: 0,
    });
  }
  for (let i = 0; i < 60; i++) {
    const t = (i / 60) * 2 * Math.PI + rR() * 0.05;
    ringPts.push({
      p: {
        x: 3 * Math.cos(t) + gauss(rR) * 0.15,
        y: 3 * Math.sin(t) + gauss(rR) * 0.15,
      },
      ring: 1,
    });
  }
  // By symmetry, 2-means on a rotationally-symmetric double ring drifts to a
  // random diameter; the vertical split at x = 0 is a canonical illustration.
  const kmCentres = [
    { x: -2, y: 0 },
    { x: 2, y: 0 },
  ];

  // Perpendicular bisector between two points, trimmed to the panel bounds.
  function bisector(a: Pt, b: Pt): { p1: Pt; p2: Pt } {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    // Bisector direction is perpendicular to (dx, dy).
    const nx = -dy;
    const ny = dx;
    // Parametrise M + t*(nx, ny); clip to the square [dMin, dMax]^2.
    const ts: number[] = [];
    if (Math.abs(nx) > 1e-9) {
      ts.push((dMin - mx) / nx, (dMax - mx) / nx);
    }
    if (Math.abs(ny) > 1e-9) {
      ts.push((dMin - my) / ny, (dMax - my) / ny);
    }
    const inRange: number[] = [];
    for (const t of ts) {
      const x = mx + t * nx;
      const y = my + t * ny;
      if (x >= dMin - 1e-6 && x <= dMax + 1e-6 && y >= dMin - 1e-6 && y <= dMax + 1e-6) {
        inRange.push(t);
      }
    }
    inRange.sort((a, b) => a - b);
    const tMin = inRange[0] ?? -10;
    const tMax = inRange[inRange.length - 1] ?? 10;
    return {
      p1: { x: mx + tMin * nx, y: my + tMin * ny },
      p2: { x: mx + tMax * nx, y: my + tMax * ny },
    };
  }

  function Panel({
    offsetX,
    title,
    children,
  }: {
    offsetX: number;
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <g transform={`translate(${offsetX} 0)`}>
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
          y={panelH - 10}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          {title}
        </text>
        {children}
      </g>
    );
  }

  const pad = { top: 18, right: 14, bottom: 32, left: 14 };
  const plotW = panelW - pad.left - pad.right;
  const plotH = panelH - pad.top - pad.bottom;
  const xToPx = linScale(dMin, dMax, pad.left, pad.left + plotW);
  const yToPxRaw = linScale(dMin, dMax, pad.top, pad.top + plotH);
  // Flip y so positive is up.
  const yToPx = (y: number) => pad.top + (pad.top + plotH) - yToPxRaw(y);

  // For the left panel, assign each point to its nearest centroid to colour it.
  function nearest(p: Pt): number {
    let best = 0;
    let bd = Infinity;
    for (let k = 0; k < centres.length; k++) {
      const dx = p.x - centres[k].x;
      const dy = p.y - centres[k].y;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = k;
      }
    }
    return best;
  }

  // Three pairwise bisectors between centres.
  const bis01 = bisector(centres[0], centres[1]);
  const bis02 = bisector(centres[0], centres[2]);
  const bis12 = bisector(centres[1], centres[2]);

  // Right-panel bisector: vertical at x = 0.
  const rightBis = {
    p1: { x: 0, y: dMin },
    p2: { x: 0, y: dMax },
  };

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two panels. Left: three colored Gaussian blobs with amber diamond centroids and three straight Voronoi bisector segments partitioning the plane into convex cells. Right: two concentric rings of points cut in half by a vertical line at x equals zero, with two amber diamond centroids at plus and minus two on the x axis, showing that each cluster splits both rings.",
    caption,
    children: (
      <>
        {/* -------------------- LEFT PANEL: blobs -------------------- */}
        <Panel offsetX={0} title="k-means finds convex cells">
          {/* Voronoi bisectors */}
          {[bis01, bis02, bis12].map((b, i) => (
            <line
              key={`vb${i}`}
              x1={xToPx(b.p1.x)}
              y1={yToPx(b.p1.y)}
              x2={xToPx(b.p2.x)}
              y2={yToPx(b.p2.y)}
              className="text-muted-foreground"
              stroke="currentColor"
              strokeWidth={1.2}
              strokeDasharray="4 3"
              opacity={0.75}
            />
          ))}

          {/* points coloured by hard assignment */}
          {blobPts.map((bp, i) => (
            <circle
              key={`bp${i}`}
              cx={xToPx(bp.p.x)}
              cy={yToPx(bp.p.y)}
              r={2.8}
              fill={blobColors[nearest(bp.p)]}
              fillOpacity={0.85}
            />
          ))}

          {/* centroids as amber diamonds */}
          {centres.map((c, i) => {
            const cx = xToPx(c.x);
            const cy = yToPx(c.y);
            const s = 8;
            return (
              <polygon
                key={`c${i}`}
                points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`}
                fill={PALETTE.amber}
                stroke="#ffffff"
                strokeWidth={1.4}
              />
            );
          })}
        </Panel>

        {/* -------------------- RIGHT PANEL: rings -------------------- */}
        <Panel offsetX={panelW + gap} title="k-means fails on nested rings">
          {/* Left/right shading */}
          <rect
            x={xToPx(dMin)}
            y={pad.top}
            width={xToPx(0) - xToPx(dMin)}
            height={plotH}
            fill={PALETTE.blue}
            opacity={0.06}
          />
          <rect
            x={xToPx(0)}
            y={pad.top}
            width={xToPx(dMax) - xToPx(0)}
            height={plotH}
            fill={PALETTE.red}
            opacity={0.06}
          />

          {/* Vertical bisector at x = 0 */}
          <line
            x1={xToPx(rightBis.p1.x)}
            y1={yToPx(rightBis.p1.y)}
            x2={xToPx(rightBis.p2.x)}
            y2={yToPx(rightBis.p2.y)}
            className="text-muted-foreground"
            stroke="currentColor"
            strokeWidth={1.2}
            strokeDasharray="4 3"
            opacity={0.85}
          />

          {/* ring points coloured by side of x = 0 */}
          {ringPts.map((rp, i) => (
            <circle
              key={`rp${i}`}
              cx={xToPx(rp.p.x)}
              cy={yToPx(rp.p.y)}
              r={2.6}
              fill={rp.p.x < 0 ? PALETTE.blue : PALETTE.red}
              fillOpacity={0.85}
            />
          ))}

          {/* k-means centroids */}
          {kmCentres.map((c, i) => {
            const cx = xToPx(c.x);
            const cy = yToPx(c.y);
            const s = 8;
            return (
              <polygon
                key={`kc${i}`}
                points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`}
                fill={PALETTE.amber}
                stroke="#ffffff"
                strokeWidth={1.4}
              />
            );
          })}
        </Panel>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 2. GmmVsKmeansContours — hard spherical assignment vs soft elliptical
// ---------------------------------------------------------------------------
export function GmmVsKmeansContours({ caption }: { caption?: string }) {
  const panelW = 350;
  const panelH = 340;
  const gap = 20;
  const W = panelW * 2 + gap;
  const H = panelH + 8;

  // Two elongated Gaussians with different orientations. These are the
  // ground-truth generating parameters and also serve as the GMM component
  // parameters (we do not fit; we illustrate the shape difference).
  const comp = [
    { mu: { x: -1.4, y: -0.5 }, sig: [1.7, 0.45] as const, theta: 0.35 },
    { mu: { x: 1.4, y: 0.6 }, sig: [1.6, 0.5] as const, theta: -0.6 },
  ];
  const colors = [PALETTE.blue, PALETTE.red];

  const rD = rng(7788);
  type Sample = { p: Pt; k: number };
  const pts: Sample[] = [];
  for (let k = 0; k < 2; k++) {
    const c = Math.cos(comp[k].theta);
    const s = Math.sin(comp[k].theta);
    for (let i = 0; i < 40; i++) {
      const u = gauss(rD) * comp[k].sig[0];
      const v = gauss(rD) * comp[k].sig[1];
      pts.push({
        p: {
          x: comp[k].mu.x + c * u - s * v,
          y: comp[k].mu.y + s * u + c * v,
        },
        k,
      });
    }
  }

  // k-means centroids: initialised at component means so the illustration is
  // deterministic and Voronoi-symmetric between them.
  const kmC = [
    { x: -1.2, y: -0.3 },
    { x: 1.2, y: 0.4 },
  ];

  const dMin = -5;
  const dMax = 5;
  const pad = { top: 18, right: 14, bottom: 32, left: 14 };
  const plotW = panelW - pad.left - pad.right;
  const plotH = panelH - pad.top - pad.bottom;
  const xToPx = linScale(dMin, dMax, pad.left, pad.left + plotW);
  const yToPxRaw = linScale(dMin, dMax, pad.top, pad.top + plotH);
  const yToPx = (y: number) => pad.top + (pad.top + plotH) - yToPxRaw(y);

  // Perpendicular bisector of the two k-means centroids.
  const mx = (kmC[0].x + kmC[1].x) / 2;
  const my = (kmC[0].y + kmC[1].y) / 2;
  const dx = kmC[1].x - kmC[0].x;
  const dy = kmC[1].y - kmC[0].y;
  const nx = -dy;
  const ny = dx;
  // Endpoints far along the bisector then clip visually via viewBox.
  const bis = {
    p1: { x: mx - 20 * nx, y: my - 20 * ny },
    p2: { x: mx + 20 * nx, y: my + 20 * ny },
  };

  // Hard k-means assignment: nearest centroid in Euclidean distance.
  function kmAssign(p: Pt): number {
    const d0 = (p.x - kmC[0].x) ** 2 + (p.y - kmC[0].y) ** 2;
    const d1 = (p.x - kmC[1].x) ** 2 + (p.y - kmC[1].y) ** 2;
    return d0 < d1 ? 0 : 1;
  }

  // Log-density under a Gaussian with axis-aligned std devs after rotating
  // (p - mu) by -theta. Used to compute soft responsibilities in the right
  // panel; equal priors are assumed.
  function logPdf(
    p: Pt,
    mu: Pt,
    sig: readonly [number, number],
    theta: number,
  ): number {
    const dxr = p.x - mu.x;
    const dyr = p.y - mu.y;
    const c = Math.cos(-theta);
    const s = Math.sin(-theta);
    const u = c * dxr - s * dyr;
    const v = s * dxr + c * dyr;
    return (
      -0.5 * ((u / sig[0]) ** 2 + (v / sig[1]) ** 2) -
      Math.log(2 * Math.PI * sig[0] * sig[1])
    );
  }
  function gmmResp(p: Pt): number {
    const l0 = logPdf(p, comp[0].mu, comp[0].sig, comp[0].theta);
    const l1 = logPdf(p, comp[1].mu, comp[1].sig, comp[1].theta);
    // Responsibility for cluster 1.
    const m = Math.max(l0, l1);
    const e0 = Math.exp(l0 - m);
    const e1 = Math.exp(l1 - m);
    return e1 / (e0 + e1);
  }

  // Iso-probability ellipse at k standard deviations for component `c`.
  function ellipsePath(c: (typeof comp)[number], nSig: number): string {
    const steps = 60;
    const pts2: string[] = [];
    const cs = Math.cos(c.theta);
    const sn = Math.sin(c.theta);
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * 2 * Math.PI;
      const u = nSig * c.sig[0] * Math.cos(t);
      const v = nSig * c.sig[1] * Math.sin(t);
      const x = c.mu.x + cs * u - sn * v;
      const y = c.mu.y + sn * u + cs * v;
      pts2.push(`${i === 0 ? "M" : "L"}${xToPx(x).toFixed(1)},${yToPx(y).toFixed(1)}`);
    }
    return pts2.join(" ");
  }

  function Panel({
    offsetX,
    title,
    children,
  }: {
    offsetX: number;
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <g transform={`translate(${offsetX} 0)`}>
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
          y={panelH - 10}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          {title}
        </text>
        {children}
      </g>
    );
  }

  // Interpolate two rgb hex colours by weight t ∈ [0, 1].
  function mix(a: string, b: string, t: number): string {
    const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
    const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
    const c = pa.map((v, i) => Math.round(v * (1 - t) + pb[i] * t));
    return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two panels of the same tilted-Gaussian data. Left, k-means splits the plane with a straight perpendicular bisector; some points near the boundary get the wrong color. Right, a Gaussian mixture draws two concentric elliptical iso-probability contours per component that match the tilt and elongation, and boundary points are shaded by soft responsibility.",
    caption,
    children: (
      <>
        {/* -------------------- LEFT: k-means -------------------- */}
        <Panel offsetX={0} title="k-means (spherical, hard)">
          {/* bisector */}
          <line
            x1={xToPx(bis.p1.x)}
            y1={yToPx(bis.p1.y)}
            x2={xToPx(bis.p2.x)}
            y2={yToPx(bis.p2.y)}
            className="text-muted-foreground"
            stroke="currentColor"
            strokeWidth={1.2}
            strokeDasharray="4 3"
            opacity={0.85}
          />

          {/* points */}
          {pts.map((s, i) => (
            <circle
              key={`kp${i}`}
              cx={xToPx(s.p.x)}
              cy={yToPx(s.p.y)}
              r={2.8}
              fill={colors[kmAssign(s.p)]}
              fillOpacity={0.85}
            />
          ))}

          {/* centroids */}
          {kmC.map((c, i) => {
            const cx = xToPx(c.x);
            const cy = yToPx(c.y);
            const sz = 8;
            return (
              <polygon
                key={`kmc${i}`}
                points={`${cx},${cy - sz} ${cx + sz},${cy} ${cx},${cy + sz} ${cx - sz},${cy}`}
                fill={PALETTE.amber}
                stroke="#ffffff"
                strokeWidth={1.4}
              />
            );
          })}
        </Panel>

        {/* -------------------- RIGHT: GMM -------------------- */}
        <Panel offsetX={panelW + gap} title="GMM (elliptical, soft)">
          {/* 2σ then 1σ ellipses per component */}
          {comp.map((c, i) => (
            <g key={`ge${i}`}>
              <path
                d={ellipsePath(c, 2)}
                fill={colors[i]}
                fillOpacity={0.05}
                stroke={colors[i]}
                strokeWidth={1.2}
                opacity={0.7}
              />
              <path
                d={ellipsePath(c, 1)}
                fill={colors[i]}
                fillOpacity={0.09}
                stroke={colors[i]}
                strokeWidth={1.6}
                opacity={0.9}
              />
            </g>
          ))}

          {/* points shaded by responsibility r₁ ∈ [0, 1] */}
          {pts.map((s, i) => {
            const r1 = gmmResp(s.p);
            return (
              <circle
                key={`gp${i}`}
                cx={xToPx(s.p.x)}
                cy={yToPx(s.p.y)}
                r={2.8}
                fill={mix(colors[0], colors[1], r1)}
                fillOpacity={0.9}
              />
            );
          })}

          {/* component means as amber diamonds */}
          {comp.map((c, i) => {
            const cx = xToPx(c.mu.x);
            const cy = yToPx(c.mu.y);
            const sz = 8;
            return (
              <polygon
                key={`gmc${i}`}
                points={`${cx},${cy - sz} ${cx + sz},${cy} ${cx},${cy + sz} ${cx - sz},${cy}`}
                fill={PALETTE.amber}
                stroke="#ffffff"
                strokeWidth={1.4}
              />
            );
          })}
        </Panel>
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 3. LinkageDendrogram — U-shaped merges with two cut heights, plus an inset
// ---------------------------------------------------------------------------
export function LinkageDendrogram({ caption }: { caption?: string }) {
  const W = 640;
  const H = 320;
  const pad = { top: 24, right: 20, bottom: 44, left: 46 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  // 10 leaves at x = 0..9. Merges given as (a, b, height) where a and b are
  // cluster indices in a shared table: leaves 0..9, then internal nodes 10+.
  // The merge order chosen produces a plausible clustering with two big
  // groups at the top and a chained sub-tree in the middle.
  type Node = { xMid: number; y: number };
  const nodes: Node[] = [];
  for (let i = 0; i < 10; i++) nodes.push({ xMid: i, y: 0 });

  type Merge = { a: number; b: number; h: number };
  const merges: Merge[] = [
    { a: 0, b: 1, h: 0.5 },
    { a: 3, b: 4, h: 0.7 },
    { a: 6, b: 7, h: 1.0 },
    { a: 10, b: 2, h: 1.2 }, // (0,1) + 2
    { a: 8, b: 9, h: 1.5 },
    { a: 11, b: 12, h: 2.0 }, // ((0,1,2)) + (3,4)
    { a: 5, b: 13, h: 2.5 }, // 5 + (6,7)
    { a: 14, b: 16, h: 3.0 }, // ((..5)) + (6,7,5)?  fixed below
    { a: 17, b: 15, h: 4.0 }, // final root
  ];

  // Recompute node table by walking merges. Each new node lives at the mean x
  // of its children and at height h.
  for (const m of merges) {
    const a = nodes[m.a];
    const b = nodes[m.b];
    nodes.push({ xMid: (a.xMid + b.xMid) / 2, y: m.h });
  }

  const xMin = -0.5;
  const xMax = 9.5;
  const yMin = 0;
  const yMax = 4.4;
  const xToPx = linScale(xMin, xMax, pad.left, pad.left + plotW);
  const yToPx = (v: number) =>
    pad.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  // Build U-shaped SVG paths for each merge.
  function uPath(m: Merge): string {
    const a = nodes[m.a];
    const b = nodes[m.b];
    const y = yToPx(m.h);
    const ax = xToPx(a.xMid);
    const ay = yToPx(a.y);
    const bx = xToPx(b.xMid);
    const by = yToPx(b.y);
    return `M${ax},${ay} L${ax},${y} L${bx},${y} L${bx},${by}`;
  }

  // At height 2.2 the tree has 4 open clusters; at height 3.5, 2.
  const cut1 = 2.2;
  const cut2 = 3.5;

  // Inset: two mini scatters comparing single-linkage chaining vs Ward compact.
  const insetX = W - pad.right - 148;
  const insetY = pad.top + 4;
  const insetW = 148;
  const insetH = 84;
  const rIns = rng(31);
  const chainPts: Pt[] = Array.from({ length: 24 }, (_, i) => ({
    x: i * 0.18 + gauss(rIns) * 0.06,
    y: 0.5 + Math.sin(i * 0.4) * 0.15 + gauss(rIns) * 0.05,
  }));
  const compactBlob = (cx: number, cy: number, n: number, s: number): Pt[] =>
    Array.from({ length: n }, () => ({
      x: cx + gauss(rIns) * s,
      y: cy + gauss(rIns) * s,
    }));
  const compactA = compactBlob(1.0, 0.5, 14, 0.14);
  const compactB = compactBlob(3.0, 0.5, 14, 0.14);

  function insetPanel(
    title: string,
    x0: number,
    pts: Pt[],
    color2: string | ((p: Pt, i: number) => string),
  ) {
    const w = (insetW - 8) / 2;
    const h = insetH - 20;
    const bx = insetX + x0;
    const by = insetY + 16;
    const dx0 = 0;
    const dx1 = 4.5;
    const dy0 = 0;
    const dy1 = 1;
    const px = (v: number) => bx + ((v - dx0) / (dx1 - dx0)) * w;
    const py = (v: number) => by + (1 - (v - dy0) / (dy1 - dy0)) * h;
    return (
      <g>
        <text
          x={bx + w / 2}
          y={insetY + 10}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={9}
        >
          {title}
        </text>
        <rect
          x={bx}
          y={by}
          width={w}
          height={h}
          fill="none"
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.5}
        />
        {pts.map((p, i) => (
          <circle
            key={`ins${title}${i}`}
            cx={px(p.x)}
            cy={py(p.y)}
            r={1.6}
            fill={typeof color2 === "function" ? color2(p, i) : color2}
            fillOpacity={0.9}
          />
        ))}
      </g>
    );
  }

  const yTicks = [0, 1, 2, 3, 4];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Hierarchical-clustering dendrogram over ten leaves with U-shaped merges at increasing heights, and two horizontal dashed cut lines that partition the leaves into four and two clusters. A small inset in the top right compares single-linkage chaining to Ward compactness.",
    caption,
    children: (
      <>
        {/* y grid + labels */}
        {yTicks.map((v, i) => {
          const y = yToPx(v);
          return (
            <g key={`yt${i}`}>
              <line
                x1={pad.left}
                x2={W - pad.right}
                y1={y}
                y2={y}
                className="text-border"
                stroke="currentColor"
                strokeWidth={1}
                opacity={0.4}
              />
              <text
                x={pad.left - 6}
                y={y + 3.5}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={11}
              >
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* leaf labels */}
        {Array.from({ length: 10 }, (_, i) => (
          <text
            key={`lf${i}`}
            x={xToPx(i)}
            y={pad.top + plotH + 14}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={10}
          >
            {i}
          </text>
        ))}

        {/* merges */}
        {merges.map((m, i) => (
          <path
            key={`m${i}`}
            d={uPath(m)}
            fill="none"
            stroke={PALETTE.blue}
            strokeWidth={1.6}
          />
        ))}

        {/* cut lines */}
        <line
          x1={pad.left}
          x2={W - pad.right}
          y1={yToPx(cut1)}
          y2={yToPx(cut1)}
          stroke={PALETTE.red}
          strokeWidth={1.4}
          strokeDasharray="6 4"
          opacity={0.9}
        />
        <text
          x={pad.left + 4}
          y={yToPx(cut1) - 4}
          fill={PALETTE.red}
          fontSize={10}
        >
          cut at 2.2 → 4 clusters
        </text>
        <line
          x1={pad.left}
          x2={W - pad.right}
          y1={yToPx(cut2)}
          y2={yToPx(cut2)}
          stroke={PALETTE.amber}
          strokeWidth={1.4}
          strokeDasharray="6 4"
          opacity={0.9}
        />
        <text
          x={pad.left + 4}
          y={yToPx(cut2) - 4}
          fill={PALETTE.amber}
          fontSize={10}
        >
          cut at 3.5 → 2 clusters
        </text>

        {/* axis titles */}
        <text
          x={pad.left + plotW / 2}
          y={H - 8}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          leaf index
        </text>
        <text
          transform={`translate(13 ${pad.top + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
        >
          merge height
        </text>

        {/* inset background (opaque so it sits over any dendrogram cross-bar) */}
        <rect
          x={insetX - 4}
          y={insetY - 4}
          width={insetW + 8}
          height={insetH + 8}
          rx={4}
          className="fill-card"
        />
        {/* inset border */}
        <rect
          x={insetX - 4}
          y={insetY - 4}
          width={insetW + 8}
          height={insetH + 8}
          rx={4}
          fill="none"
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.6}
        />
        {insetPanel(
          "single-linkage: chains",
          0,
          chainPts,
          (_, i) => (i < chainPts.length / 2 ? PALETTE.blue : PALETTE.red),
        )}
        {insetPanel("Ward: compact", (insetW - 8) / 2 + 8, [...compactA, ...compactB], (_, i) =>
          i < compactA.length ? PALETTE.blue : PALETTE.red,
        )}
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 4. TsnePerplexitySweep — perplexity-driven "meaning" changes of t-SNE plots
// ---------------------------------------------------------------------------
export function TsnePerplexitySweep({ caption }: { caption?: string }) {
  const W = 720;
  const H = 360;
  const cols = 2;
  const rows = 2;
  const cellW = W / cols;
  const cellH = H / rows;

  type LabelledPt = { x: number; y: number; c: 0 | 1 };

  // Perplexity 2: many tight little sub-clumps, classes mixed within each.
  function makeP2(): LabelledPt[] {
    const r = rng(101);
    const pts: LabelledPt[] = [];
    const clumps = 10;
    for (let c = 0; c < clumps; c++) {
      const cx = -0.85 + r() * 1.7;
      const cy = -0.85 + r() * 1.7;
      for (let i = 0; i < 10; i++) {
        pts.push({
          x: cx + gauss(r) * 0.05,
          y: cy + gauss(r) * 0.05,
          c: r() < 0.5 ? 0 : 1,
        });
      }
    }
    return pts;
  }

  // Perplexity 5: 5 clumps, classes starting to separate.
  function makeP5(): LabelledPt[] {
    const r = rng(202);
    const pts: LabelledPt[] = [];
    const clumps = [
      { x: -0.7, y: -0.5, bias: 0.2 },
      { x: -0.55, y: 0.55, bias: 0.15 },
      { x: 0.05, y: -0.05, bias: 0.5 },
      { x: 0.55, y: 0.55, bias: 0.8 },
      { x: 0.7, y: -0.55, bias: 0.85 },
    ];
    for (const cl of clumps) {
      for (let i = 0; i < 20; i++) {
        pts.push({
          x: cl.x + gauss(r) * 0.11,
          y: cl.y + gauss(r) * 0.11,
          c: r() < cl.bias ? 1 : 0,
        });
      }
    }
    return pts;
  }

  // Perplexity 30: two clean clusters, roughly balanced.
  function makeP30(): LabelledPt[] {
    const r = rng(303);
    const pts: LabelledPt[] = [];
    for (let i = 0; i < 50; i++) {
      pts.push({
        x: -0.55 + gauss(r) * 0.18,
        y: 0.05 + gauss(r) * 0.18,
        c: 0,
      });
    }
    for (let i = 0; i < 50; i++) {
      pts.push({
        x: 0.55 + gauss(r) * 0.18,
        y: -0.05 + gauss(r) * 0.18,
        c: 1,
      });
    }
    return pts;
  }

  // Perplexity 100: one big blob, two overlapping tints.
  function makeP100(): LabelledPt[] {
    const r = rng(404);
    const pts: LabelledPt[] = [];
    for (let i = 0; i < 50; i++) {
      pts.push({
        x: -0.12 + gauss(r) * 0.42,
        y: gauss(r) * 0.42,
        c: 0,
      });
    }
    for (let i = 0; i < 50; i++) {
      pts.push({
        x: 0.12 + gauss(r) * 0.42,
        y: gauss(r) * 0.42,
        c: 1,
      });
    }
    return pts;
  }

  const panels: {
    perp: number;
    pts: LabelledPt[];
  }[] = [
    { perp: 2, pts: makeP2() },
    { perp: 5, pts: makeP5() },
    { perp: 30, pts: makeP30() },
    { perp: 100, pts: makeP100() },
  ];

  const colors: [string, string] = [PALETTE.blue, PALETTE.red];

  function Panel({
    row,
    col,
    perp,
    pts,
  }: {
    row: number;
    col: number;
    perp: number;
    pts: LabelledPt[];
  }) {
    const x0 = col * cellW;
    const y0 = row * cellH;
    const pad = { top: 22, right: 12, bottom: 14, left: 12 };
    const inW = cellW - pad.left - pad.right;
    const inH = cellH - pad.top - pad.bottom;
    const px = (v: number) => x0 + pad.left + ((v + 1.1) / 2.2) * inW;
    const py = (v: number) => y0 + pad.top + (1 - (v + 1.1) / 2.2) * inH;
    return (
      <g>
        <rect
          x={x0 + 0.5}
          y={y0 + 0.5}
          width={cellW - 1}
          height={cellH - 1}
          fill="none"
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.6}
        />
        <text
          x={x0 + cellW / 2}
          y={y0 + 14}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={11}
        >
          perplexity = {perp}
        </text>
        {pts.map((p, i) => (
          <circle
            key={`t${row}${col}${i}`}
            cx={px(p.x)}
            cy={py(p.y)}
            r={2.2}
            fill={colors[p.c]}
            fillOpacity={0.85}
          />
        ))}
      </g>
    );
  }

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Four t-SNE embeddings of the same two-class input at perplexities 2, 5, 30 and 100. Perplexity 2 shows many tight sub-clumps with the two classes mixed inside each. Perplexity 5 shows a handful of clumps beginning to separate the classes. Perplexity 30 shows two clean clusters. Perplexity 100 collapses to one blob with the two colors overlapping.",
    caption,
    children: (
      <>
        {panels.map((p, i) => (
          <Panel
            key={`pan${i}`}
            row={Math.floor(i / 2)}
            col={i % 2}
            perp={p.perp}
            pts={p.pts}
          />
        ))}
        {/* legend across the bottom */}
        <g transform={`translate(${W - 190} ${H - 14})`}>
          {legendRow({ color: colors[0], label: "class A", key: 0 })}
          <g transform="translate(90 0)">
            {legendRow({ color: colors[1], label: "class B", key: 1 })}
          </g>
        </g>
      </>
    ),
  });
}
