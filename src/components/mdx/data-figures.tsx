// Inline SVG figures for the data-foundations lesson (c1.1).
// Every figure is a server component with no client JS: shapes are
// computed from closed forms or from a deterministic Mulberry32 rng in
// figure-helpers so builds are reproducible (Math.random is banned in
// server-rendered artifacts here).

import { PALETTE, figureFrame, rng } from "./figure-helpers";

// ---------------------------------------------------------------------------
// 1. RowVsColumnStorage — same table stored row- vs column-oriented, with a
//    `SELECT country` query highlighted so the cells-touched cost is visible.
// ---------------------------------------------------------------------------
export function RowVsColumnStorage({ caption }: { caption?: string }) {
  const W = 640;
  const H = 340;

  // Layout
  const outerPad = 14;
  const panelGap = 20;
  const panelW = (W - outerPad * 2 - panelGap) / 2;

  // Table: 6 rows total (1 header + 5 data), 4 typed columns.
  // The visual grid cycles four pastel hues, one per typed column.
  const nRows = 6;
  const nCols = 4;
  const cellW = 58;
  const cellH = 26;
  const gridW = cellW * nCols;
  const gridH = cellH * nRows;
  const gridX = (panelW - gridW) / 2;
  const gridY = 62; // below title

  const colNames = ["user_id", "name", "country", "signup"];
  // The query pulls the `country` column (index 2).
  const countryCol = 2;

  // Pastel fills — one per typed column. Chosen to read on both light and
  // dark card backgrounds; low-opacity so header text stays legible.
  const colFills = ["#dbeafe", "#fef3c7", "#dcfce7", "#fce7f3"];

  const renderPanel = ({
    offsetX,
    title,
    mode,
    countLine,
    subLine,
  }: {
    offsetX: number;
    title: string;
    mode: "row" | "col";
    countLine: string;
    subLine: string;
  }) => (
      <g key={`p-${title}`} transform={`translate(${offsetX} 0)`}>
        {/* panel title */}
        <text
          x={panelW / 2}
          y={28}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={13}
          fontWeight={600}
        >
          {title}
        </text>

        {/* body cells (per column pastel fill; header row stays neutral) */}
        {Array.from({ length: nRows }).flatMap((_, r) =>
          Array.from({ length: nCols }).map((_, c) => {
            const isHeader = r === 0;
            return (
              <rect
                key={`c${r}-${c}`}
                x={gridX + c * cellW}
                y={gridY + r * cellH}
                width={cellW}
                height={cellH}
                fill={isHeader ? "transparent" : colFills[c]}
                fillOpacity={isHeader ? 1 : 0.55}
                className="text-border"
                stroke="currentColor"
                strokeWidth={0.7}
                opacity={0.9}
              />
            );
          }),
        )}

        {/* header labels */}
        {colNames.map((name, c) => (
          <text
            key={`h${c}`}
            x={gridX + c * cellW + cellW / 2}
            y={gridY + cellH / 2 + 3.6}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={10.5}
            fontWeight={600}
          >
            {name}
          </text>
        ))}

        {/* placeholder dots in each data cell */}
        {Array.from({ length: nRows - 1 }).flatMap((_, ri) =>
          Array.from({ length: nCols }).map((_, c) => (
            <text
              key={`d${ri}-${c}`}
              x={gridX + c * cellW + cellW / 2}
              y={gridY + (ri + 1) * cellH + cellH / 2 + 3.6}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={11}
              opacity={0.6}
            >
              •
            </text>
          )),
        )}

        {/* highlight: row-oriented reads every row's storage block */}
        {mode === "row" &&
          Array.from({ length: nRows }).map((_, r) => (
            <rect
              key={`hr${r}`}
              x={gridX - 2}
              y={gridY + r * cellH - 2}
              width={gridW + 4}
              height={cellH + 4}
              fill="none"
              stroke={PALETTE.red}
              strokeWidth={1.9}
              opacity={0.9}
            />
          ))}

        {/* highlight: column-oriented reads only the `country` column */}
        {mode === "col" && (
          <rect
            x={gridX + countryCol * cellW - 2.5}
            y={gridY - 2.5}
            width={cellW + 5}
            height={gridH + 5}
            fill="none"
            stroke={PALETTE.red}
            strokeWidth={2.2}
            opacity={0.92}
          />
        )}

        {/* count line — matches the cell math visible in the highlight */}
        <text
          x={panelW / 2}
          y={gridY + gridH + 28}
          textAnchor="middle"
          fill={PALETTE.red}
          fontSize={11.5}
          fontWeight={600}
        >
          {countLine}
        </text>
        <text
          x={panelW / 2}
          y={gridY + gridH + 44}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={10.5}
        >
          {subLine}
        </text>
      </g>
    );

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Two side-by-side grids representing the same table stored row-oriented on the left and column-oriented on the right. A SELECT-country query highlights every row on the left (24 cells read) but only the country column on the right (6 cells read).",
    caption,
    children: (
      <>
        {renderPanel({
          offsetX: outerPad,
          title: "Row-oriented (OLTP)",
          mode: "row",
          countLine: "reads 6 rows × 4 cols = 24 cells",
          subLine: "SELECT country → full row per record",
        })}
        {renderPanel({
          offsetX: outerPad + panelW + panelGap,
          title: "Column-oriented (OLAP)",
          mode: "col",
          countLine: "reads 1 col × 6 rows = 6 cells",
          subLine: "SELECT country → column-only scan",
        })}
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 2. SplitStrategyPanels — four small panels showing how the same points get
//    partitioned by four different train/test splits.
// ---------------------------------------------------------------------------
export function SplitStrategyPanels({ caption }: { caption?: string }) {
  const W = 720;
  const H = 360;

  type Pt = { x: number; y: number; cls: 0 | 1; grp: number };

  // Shared points: 40 seeded 2D samples with a mild diagonal class boundary.
  const nPts = 40;
  const r = rng(20260726);
  const pts: Pt[] = Array.from({ length: nPts }, (_, i) => {
    const x = r();
    const y = r();
    // Class boundary y ≈ 0.5 + 0.18 sin(π x), plus small classification noise
    // via a paired r() draw so the pattern is deterministic and reproducible.
    const boundary = 0.5 + 0.18 * Math.sin(Math.PI * x);
    const noise = (r() - 0.5) * 0.14;
    const cls: 0 | 1 = y + noise > boundary ? 1 : 0;
    // Groups: 5 groups by index → last group becomes test in the grouped split
    const grp = Math.floor((i / nPts) * 5);
    return { x, y, cls, grp };
  });

  // Random split (25% test), Fisher–Yates on a seeded rng
  const randomTest = new Set<number>();
  {
    const rr = rng(101);
    const idx = pts.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rr() * (i + 1));
      const tmp = idx[i];
      idx[i] = idx[j];
      idx[j] = tmp;
    }
    const nTest = Math.floor(nPts * 0.25);
    for (let k = 0; k < nTest; k++) randomTest.add(idx[k]);
  }

  // Temporal split: treat x as time; last 25% is test
  const temporalTest = new Set<number>();
  {
    const ordered = pts
      .map((p, i) => ({ x: p.x, i }))
      .sort((a, b) => a.x - b.x);
    const nTest = Math.floor(nPts * 0.25);
    for (let k = ordered.length - nTest; k < ordered.length; k++) {
      temporalTest.add(ordered[k].i);
    }
  }

  // Grouped split: last group (grp === 4) held out
  const groupedTest = new Set<number>();
  pts.forEach((p, i) => {
    if (p.grp === 4) groupedTest.add(i);
  });

  // Stratified split: 25% of each class in test, sampled deterministically
  const stratifiedTest = new Set<number>();
  {
    const rr = rng(202);
    for (const cls of [0, 1] as const) {
      const clsIdx = pts
        .map((p, i) => ({ p, i }))
        .filter((e) => e.p.cls === cls)
        .map((e) => e.i);
      for (let i = clsIdx.length - 1; i > 0; i--) {
        const j = Math.floor(rr() * (i + 1));
        const tmp = clsIdx[i];
        clsIdx[i] = clsIdx[j];
        clsIdx[j] = tmp;
      }
      const nTest = Math.max(1, Math.floor(clsIdx.length * 0.25));
      for (let k = 0; k < nTest; k++) stratifiedTest.add(clsIdx[k]);
    }
  }

  // Panel layout (2×2)
  const outerPad = 12;
  const gap = 16;
  const panelW = (W - outerPad * 2 - gap) / 2;
  const panelH = (H - outerPad * 2 - gap) / 2;
  const titleH = 22;
  const plotH = panelH - titleH;

  const renderPanelPlot = ({
    ox,
    oy,
    title,
    testSet,
    tempSplitAt,
    groupBoundaries,
  }: {
    ox: number;
    oy: number;
    title: string;
    testSet: Set<number>;
    tempSplitAt?: number;
    groupBoundaries?: number[];
  }) => {
    const inset = 8;
    const xToPx = (x: number) => inset + x * (panelW - inset * 2);
    const yToPx = (y: number) =>
      titleH + inset + (1 - y) * (plotH - inset * 2);

    return (
      <g key={`pp-${title}`} transform={`translate(${ox} ${oy})`}>
        {/* frame */}
        <rect
          x={0.5}
          y={titleH + 0.5}
          width={panelW - 1}
          height={plotH - 1}
          fill="none"
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.5}
        />
        {/* title */}
        <text
          x={panelW / 2}
          y={15}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
          fontWeight={600}
        >
          {title}
        </text>

        {/* temporal-split indicator: vertical divider at the split time */}
        {tempSplitAt !== undefined && (
          <>
            <rect
              x={xToPx(tempSplitAt)}
              y={titleH + 0.5}
              width={panelW - xToPx(tempSplitAt) - 0.5}
              height={plotH - 1}
              fill={PALETTE.gray}
              opacity={0.08}
            />
            <line
              x1={xToPx(tempSplitAt)}
              x2={xToPx(tempSplitAt)}
              y1={titleH + 4}
              y2={titleH + plotH - 4}
              stroke={PALETTE.gray}
              strokeWidth={1.2}
              strokeDasharray="4 3"
              opacity={0.75}
            />
          </>
        )}

        {/* grouped-split indicator: vertical group boundaries */}
        {groupBoundaries?.map((b, i) => (
          <line
            key={`gb${i}`}
            x1={xToPx(b)}
            x2={xToPx(b)}
            y1={titleH + 4}
            y2={titleH + plotH - 4}
            className="text-muted-foreground"
            stroke="currentColor"
            strokeWidth={0.8}
            strokeDasharray="2 3"
            opacity={0.5}
          />
        ))}

        {/* points — filled = train, outlined = test; color = class */}
        {pts.map((p, i) => {
          const isTest = testSet.has(i);
          const color = p.cls === 1 ? PALETTE.red : PALETTE.blue;
          return (
            <circle
              key={`p${i}`}
              cx={xToPx(p.x)}
              cy={yToPx(p.y)}
              r={3.6}
              fill={isTest ? "var(--card, #fff)" : color}
              stroke={color}
              strokeWidth={isTest ? 1.7 : 0}
              fillOpacity={isTest ? 1 : 0.85}
            />
          );
        })}
      </g>
    );
  };

  // Precompute grouped-split boundaries in x (points are indexed 0..39; group
  // membership is by index, not by x, so boundaries here are illustrative —
  // draw them at fifths of the plot to hint at the group structure).
  const groupBoundaries = [0.2, 0.4, 0.6, 0.8];

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Four small scatter panels showing the same 40 two-class points partitioned by four different train/test splits: random, temporal, grouped, and stratified. Filled circles are train, hollow circles are test.",
    caption,
    children: (
      <>
        {renderPanelPlot({
          ox: outerPad,
          oy: outerPad,
          title: "Random split",
          testSet: randomTest,
        })}
        {renderPanelPlot({
          ox: outerPad + panelW + gap,
          oy: outerPad,
          title: "Temporal split",
          testSet: temporalTest,
          tempSplitAt: 0.75,
        })}
        {renderPanelPlot({
          ox: outerPad,
          oy: outerPad + panelH + gap,
          title: "Grouped split (last group held out)",
          testSet: groupedTest,
          groupBoundaries: groupBoundaries,
        })}
        {renderPanelPlot({
          ox: outerPad + panelW + gap,
          oy: outerPad + panelH + gap,
          title: "Stratified split",
          testSet: stratifiedTest,
        })}
      </>
    ),
  });
}

// ---------------------------------------------------------------------------
// 3. LeakageTimeline — horizontal timeline centered on t_pred, with four
//    "feature source" lanes each showing a canonical leakage category.
// ---------------------------------------------------------------------------
export function LeakageTimeline({ caption }: { caption?: string }) {
  const W = 640;
  const H = 300;
  const pad = { top: 34, right: 20, bottom: 44, left: 138 };
  const plotW = W - pad.left - pad.right;
  const laneH = 44;
  const nLanes = 4;
  const barH = 22;

  // Where prediction time sits on the axis (fraction of plot width)
  const tPredFrac = 0.6;
  const xToPx = (t: number) => pad.left + t * plotW;
  const tPredX = xToPx(tPredFrac);
  const timelineY = pad.top + nLanes * laneH + 6;

  // Each lane: a "safe" (green, pre-t_pred) segment and a "leak" (red)
  // segment illustrating one of the four leakage categories.
  type Lane = {
    name: string;
    category: string;
    safe?: [number, number];
    leak?: [number, number];
    labelInside?: boolean; // put the category label inside the leak bar
  };

  const lanes: Lane[] = [
    {
      name: "browsing history",
      category: "future info",
      safe: [0.04, 0.55],
      leak: [0.68, 0.94],
    },
    {
      name: "session",
      category: "session bleed",
      safe: [0.04, 0.5],
      leak: [0.5, 0.72],
    },
    {
      name: "label events",
      category: "target leakage",
      // labels sit essentially AT t_pred — if used as features that IS leakage
      leak: [0.56, 0.64],
    },
    {
      name: "preprocessing stats",
      category: "preprocessing leak",
      leak: [0.04, 0.94],
      labelInside: true,
    },
  ];

  const barY = (i: number) => pad.top + i * laneH + (laneH - barH) / 2;

  return figureFrame({
    W,
    H,
    ariaLabel:
      "Horizontal timeline showing four feature-source lanes above a time axis with a t_pred marker. Green bars mark information available before t_pred; red bars mark leakage from after t_pred, annotated with the four canonical leakage categories.",
    caption,
    children: (
      <>
        {/* faint lane row separators */}
        {Array.from({ length: nLanes + 1 }).map((_, i) => (
          <line
            key={`sep${i}`}
            x1={pad.left}
            x2={W - pad.right}
            y1={pad.top + i * laneH}
            y2={pad.top + i * laneH}
            className="text-border"
            stroke="currentColor"
            strokeWidth={0.6}
            opacity={0.35}
          />
        ))}

        {/* time axis */}
        <line
          x1={pad.left}
          x2={W - pad.right}
          y1={timelineY}
          y2={timelineY}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.2}
          opacity={0.6}
        />
        <text
          x={pad.left}
          y={timelineY + 18}
          className="fill-muted-foreground"
          fontSize={11}
        >
          past
        </text>
        <text
          x={W - pad.right}
          y={timelineY + 18}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={11}
        >
          future  →  time
        </text>

        {/* t_pred marker: dashed red vertical spanning lanes + axis */}
        <line
          x1={tPredX}
          x2={tPredX}
          y1={pad.top - 14}
          y2={timelineY + 6}
          stroke={PALETTE.red}
          strokeWidth={1.4}
          strokeDasharray="4 3"
          opacity={0.88}
        />
        <text
          x={tPredX}
          y={pad.top - 18}
          textAnchor="middle"
          fill={PALETTE.red}
          fontSize={11.5}
          fontWeight={600}
        >
          t_pred (prediction time)
        </text>

        {/* per-lane content */}
        {lanes.map((lane, i) => {
          const y = barY(i);
          const safeW =
            lane.safe !== undefined
              ? xToPx(lane.safe[1]) - xToPx(lane.safe[0])
              : 0;
          const leakX =
            lane.leak !== undefined ? xToPx(lane.leak[0]) : undefined;
          const leakW =
            lane.leak !== undefined
              ? xToPx(lane.leak[1]) - xToPx(lane.leak[0])
              : 0;

          // Category label position: inside the leak bar for wide bars, else
          // just to the right of the leak bar (clamped inside the plot).
          const labelInside = lane.labelInside === true;
          const labelX = labelInside
            ? (leakX ?? pad.left) + leakW / 2
            : Math.min(
                (leakX ?? pad.left) + leakW + 8,
                W - pad.right - 4,
              );
          const labelAnchor: "middle" | "start" = labelInside
            ? "middle"
            : "start";
          const labelFill = labelInside ? "#ffffff" : PALETTE.red;

          return (
            <g key={`lane${i}`}>
              {/* lane name on the left gutter */}
              <text
                x={pad.left - 10}
                y={y + barH / 2 + 3.6}
                textAnchor="end"
                className="fill-foreground"
                fontSize={11.5}
              >
                {lane.name}
              </text>

              {/* safe segment */}
              {lane.safe !== undefined && (
                <rect
                  x={xToPx(lane.safe[0])}
                  y={y}
                  width={safeW}
                  height={barH}
                  fill={PALETTE.green}
                  fillOpacity={0.85}
                  rx={3}
                />
              )}

              {/* leak segment */}
              {lane.leak !== undefined && leakX !== undefined && (
                <rect
                  x={leakX}
                  y={y}
                  width={leakW}
                  height={barH}
                  fill={PALETTE.red}
                  fillOpacity={0.85}
                  rx={3}
                />
              )}

              {/* category annotation */}
              <text
                x={labelX}
                y={y + barH / 2 + 3.6}
                textAnchor={labelAnchor}
                fill={labelFill}
                fontSize={10.5}
                fontWeight={600}
              >
                {lane.category}
              </text>
            </g>
          );
        })}

        {/* small legend swatches under the plot */}
        <g transform={`translate(${pad.left} ${H - 14})`}>
          <rect
            x={0}
            y={-9}
            width={14}
            height={10}
            fill={PALETTE.green}
            fillOpacity={0.85}
            rx={2}
          />
          <text
            x={20}
            y={0}
            className="fill-muted-foreground"
            fontSize={11}
          >
            safe (before t_pred)
          </text>
          <rect
            x={168}
            y={-9}
            width={14}
            height={10}
            fill={PALETTE.red}
            fillOpacity={0.85}
            rx={2}
          />
          <text
            x={188}
            y={0}
            className="fill-muted-foreground"
            fontSize={11}
          >
            leakage (bleeds from after t_pred)
          </text>
        </g>

      </>
    ),
  });
}
