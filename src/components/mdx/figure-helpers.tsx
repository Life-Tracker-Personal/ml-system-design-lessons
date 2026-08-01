// Shared primitives for inline SVG figures across the course.
//
// Every figure is a server component: no client JS, no charting dependency,
// no external image requests. Determinism is required by the toolchain
// (Math.random is banned in server-rendered artifacts here), so all
// pseudo-random shapes flow through the seeded `rng` below.
//
// Design tokens follow src/components/mdx/loss-chart.tsx. Structural marks
// (gridlines, axes, tick labels) use design-system classes so light and dark
// modes both work; distinct-series data marks use hard-coded palette hues
// that read on both card backgrounds.

import type React from "react";

// Deterministic pseudo-random generator (Mulberry32).
// Same seed → same figure across every build.
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Standard-Normal draw via Box–Muller, seeded through the rng argument.
export function gauss(r: () => number): number {
  const u = Math.max(1e-9, r());
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Shared framing: card border, caption, aria-labelled svg viewBox.
export function figureFrame({
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

// Shared palette. Use these for series/data marks; use design-system
// classes for structural marks.
export const PALETTE = {
  red: "#dc2626", // the star / attention series
  blue: "#2563eb", // the neutral / reference series
  amber: "#d97706", // the third / warning series
  gray: "#6b7280", // dashed baseline / OLS reference
  green: "#059669", // occasional fourth
  purple: "#7c3aed", // occasional fifth
};

// Build a linear scale from data coords to pixel coords.
export function linScale(
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number,
): (v: number) => number {
  const scale = (rangeMax - rangeMin) / (domainMax - domainMin);
  return (v: number) => rangeMin + (v - domainMin) * scale;
}

// SVG path helper: build a polyline path "M x0,y0 L x1,y1 …" from samples.
export function polyPath(
  xs: number[],
  f: (x: number, i: number) => number,
  xToPx: (x: number) => number,
  yToPx: (y: number) => number,
): string {
  return xs
    .map(
      (x, i) =>
        `${i === 0 ? "M" : "L"}${xToPx(x).toFixed(1)},${yToPx(f(x, i)).toFixed(1)}`,
    )
    .join(" ");
}

// Emit a horizontal gridline + right-aligned y tick label. `y` is in pixels.
export function yTick({
  y,
  label,
  left,
  right,
  labelX,
  key,
}: {
  y: number;
  label: string;
  left: number;
  right: number;
  labelX: number;
  key: string | number;
}) {
  return (
    <g key={`yt${key}`}>
      <line
        x1={left}
        x2={right}
        y1={y}
        y2={y}
        className="text-border"
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.5}
      />
      <text
        x={labelX}
        y={y + 3.5}
        textAnchor="end"
        className="fill-muted-foreground"
        fontSize={11}
      >
        {label}
      </text>
    </g>
  );
}

// Emit a centred x tick label at pixel column `x`.
export function xTickLabel({
  x,
  y,
  label,
  key,
}: {
  x: number;
  y: number;
  label: string;
  key: string | number;
}) {
  return (
    <text
      key={`xt${key}`}
      x={x}
      y={y}
      textAnchor="middle"
      className="fill-muted-foreground"
      fontSize={11}
    >
      {label}
    </text>
  );
}

// Emit paired x and y axis titles.
export function axisTitles({
  xLabel,
  yLabel,
  plotW,
  plotH,
  pad,
  H,
}: {
  xLabel: string;
  yLabel: string;
  plotW: number;
  plotH: number;
  pad: { top: number; left: number };
  H: number;
}) {
  return (
    <>
      <text
        x={pad.left + plotW / 2}
        y={H - 6}
        textAnchor="middle"
        className="fill-foreground"
        fontSize={12}
      >
        {xLabel}
      </text>
      <text
        transform={`translate(13 ${pad.top + plotH / 2}) rotate(-90)`}
        textAnchor="middle"
        className="fill-foreground"
        fontSize={12}
      >
        {yLabel}
      </text>
    </>
  );
}

// Legend row (colored line + label). Use for series legends.
export function legendRow({
  color,
  label,
  dashed,
  key,
}: {
  color: string;
  label: string;
  dashed?: boolean;
  key: string | number;
}) {
  return (
    <g key={`leg${key}`}>
      <line
        x1={0}
        x2={22}
        y1={6}
        y2={6}
        stroke={color}
        strokeWidth={2.2}
        strokeDasharray={dashed ? "5 4" : undefined}
      />
      <text
        x={28}
        y={9}
        className="fill-muted-foreground"
        fontSize={11}
      >
        {label}
      </text>
    </g>
  );
}
