// Inline SVG figure for c2.1 Part 4: the computational graph that .backward()
// walks. Every number drawn here is computed below from the lesson's own Part 2
// example (x = [1,2], W1 = [[0.5,-0.6],[-0.3,0.2]], b1 = [0.2,0], W2 = [1,-2],
// b2 = 0.05, y = 1) by running the forward pass and then the reverse sweep --
// nothing is transcribed by hand. The values were checked against central
// finite differences: every parameter gradient matches to 6 decimals.
//
// Server component, no client JS. Structural marks use theme tokens; the two
// sweeps use the project's fixed accents (blue = forward, red = backward).

// ---------------------------------------------------------------------------
// The computation, done for real.
// ---------------------------------------------------------------------------
const x = [1, 2];
const W1 = [
  [0.5, -0.6],
  [-0.3, 0.2],
];
const b1 = [0.2, 0];
const W2 = [1.0, -2.0];
const b2 = 0.05;
const yTarget = 1;

// Forward: z1 = xW1 + b1, a1 = ReLU(z1), z2 = a1W2 + b2, L = 1/2 (z2 - y)^2.
const z1 = [0, 1].map((j) => x[0] * W1[0][j] + x[1] * W1[1][j] + b1[j]);
const mask = z1.map((v) => (v > 0 ? 1 : 0));
const a1 = z1.map((v) => Math.max(v, 0));
const z2 = a1[0] * W2[0] + a1[1] * W2[1] + b2;
const loss = 0.5 * (z2 - yTarget) ** 2;

// Backward: seed dL/dL = 1, then one vector-Jacobian product per node.
const d2 = z2 - yTarget; // dL/dz2
const dW2 = a1.map((v) => v * d2); // a1^T d2
const db2 = d2;
const dA1 = W2.map((w) => d2 * w); // d2 W2^T
const d1 = dA1.map((v, j) => v * mask[j]); // ReLU mask
const dW1 = [0, 1].map((i) => [0, 1].map((j) => x[i] * d1[j])); // x^T d1
const db1 = d1;
const nParams = 4 + b1.length + W2.length + 1; // W1, b1, W2, b2 = 9 scalars

const MINUS = "−";
// Trim trailing zeros, keep a unicode minus, never print "-0".
function f(v: number, d = 2): string {
  let s = Math.abs(v).toFixed(d);
  if (s.includes(".")) s = s.replace(/\.?0+$/, "");
  if (s === "") s = "0";
  return (v < 0 ? MINUS : "") + s;
}
// Fixed decimals, for the places the lesson writes 1.0 rather than 1.
function fx(v: number, d: number): string {
  return (v < 0 ? MINUS : "") + Math.abs(v).toFixed(d);
}
function vec(v: number[], d = 2): string {
  return `[${v.map((u) => f(u, d)).join(", ")}]`;
}
function vecx(v: number[], d: number): string {
  return `[${v.map((u) => fx(u, d)).join(", ")}]`;
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

const BLUE = "#2563eb";
const RED = "#dc2626";
const GRAY = "#6b7280";
const LGRAY = "#9ca3af";

export function BackpropGraph({ caption }: { caption?: string }) {
  const W = 880;
  const H = 492;

  // Column centres of the chain: value nodes and the ops between them.
  const CX = 60,
    COP1 = 158,
    CZ1 = 256,
    COP2 = 348,
    CA1 = 440,
    COP3 = 538,
    CZ2 = 636,
    COP4 = 730,
    CL = 820;

  const NY = 116; // node row top
  const NH = 46;
  const NC = NY + NH / 2; // node row centre
  const VW = 74; // value-box width
  const OW = 78; // op-box width
  const LANE = 248; // backward lane y

  const valueBox = (
    cx: number,
    sym: string,
    val: string,
    key: string,
    valSize = 11,
  ) => (
    <g key={key}>
      <rect
        x={cx - VW / 2}
        y={NY}
        width={VW}
        height={NH}
        rx={6}
        fill="none"
        className="text-border"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <text
        x={cx}
        y={NY + 18}
        textAnchor="middle"
        className="fill-foreground"
        fontSize={12.5}
        fontWeight={600}
      >
        {sym}
      </text>
      <text x={cx} y={NY + 35} textAnchor="middle" fill={BLUE} fontSize={valSize}>
        {val}
      </text>
    </g>
  );

  const opBox = (cx: number, label: string, sub: string, key: string) => (
    <g key={key}>
      <rect
        x={cx - OW / 2}
        y={NY + 6}
        width={OW}
        height={NH - 12}
        rx={17}
        fill="none"
        stroke={GRAY}
        strokeWidth={1.3}
        strokeDasharray="none"
      />
      <text
        x={cx}
        y={NY + 21}
        textAnchor="middle"
        className="fill-foreground"
        fontSize={11.5}
      >
        {label}
      </text>
      <text x={cx} y={NY + 34} textAnchor="middle" fill={GRAY} fontSize={10}>
        {sub}
      </text>
    </g>
  );

  // Forward arrow between two box edges, on the node row.
  const fwd = (x1: number, x2: number, key: string) => (
    <line
      key={key}
      x1={x1}
      y1={NC}
      x2={x2}
      y2={NC}
      stroke={BLUE}
      strokeWidth={2}
      markerEnd="url(#bp-fwd)"
    />
  );

  // One right-to-left segment of the backward lane, with its local derivative.
  const back = (
    xFrom: number,
    xTo: number,
    label: string,
    key: string,
    faded = false,
  ) => (
    <g key={key}>
      <line
        x1={xFrom}
        y1={LANE}
        x2={xTo}
        y2={LANE}
        stroke={faded ? LGRAY : RED}
        strokeWidth={faded ? 1.4 : 2.2}
        strokeDasharray="7 4"
        markerEnd={faded ? "url(#bp-back-faded)" : "url(#bp-back)"}
      />
      <text
        x={(xFrom + xTo) / 2}
        y={LANE - 9}
        textAnchor="middle"
        fill={faded ? LGRAY : RED}
        fontSize={11}
      >
        {label}
      </text>
    </g>
  );

  // Gradient of L w.r.t. a node, written underneath it.
  const gradUnder = (
    cx: number,
    sym: string,
    val: string,
    key: string,
    size = 11,
  ) => (
    <g key={key}>
      <text x={cx} y={186} textAnchor="middle" fill={RED} fontSize={11}>
        {sym}
      </text>
      <text
        x={cx}
        y={202}
        textAnchor="middle"
        fill={RED}
        fontSize={size}
        fontWeight={600}
      >
        {val}
      </text>
    </g>
  );

  // A dashed grey curve: "this forward value is what the backward step reuses".
  const reuse = (d: string, key: string) => (
    <path
      key={key}
      d={d}
      fill="none"
      stroke={LGRAY}
      strokeWidth={1.2}
      strokeDasharray="3 3"
      markerEnd="url(#bp-reuse)"
    />
  );

  const miniChain = (x0: number, x1: number, y: number, key: string) => {
    const n = 5;
    const dots = Array.from(
      { length: n },
      (_, i) => x0 + ((x1 - x0) * i) / (n - 1),
    );
    return (
      <g key={key}>
        <line
          x1={x0}
          y1={y}
          x2={x1}
          y2={y}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1.2}
        />
        {dots.map((dx, i) => (
          <circle key={i} cx={dx} cy={y} r={3.2} fill={GRAY} />
        ))}
      </g>
    );
  };

  return figureFrame({
    W,
    H,
    ariaLabel:
      "A left-to-right chain of nodes x, z1, a1, z2 and L with the forward values written inside each node in blue, and underneath, a right-to-left dashed red lane carrying the gradient of the loss with respect to each node, dropping out into the parameter gradients for W1 and W2. A second panel contrasts one reverse sweep against nine forward sweeps.",
    caption,
    children: (
      <>
        <defs>
          <marker
            id="bp-fwd"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={BLUE} />
          </marker>
          <marker
            id="bp-back"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={RED} />
          </marker>
          <marker
            id="bp-back-faded"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={LGRAY} />
          </marker>
          <marker
            id="bp-reuse"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={LGRAY} />
          </marker>
        </defs>

        {/* ---------------- panel 1 title and key ---------------- */}
        <text
          x={20}
          y={20}
          className="fill-foreground"
          fontSize={13}
          fontWeight={600}
        >
          The graph .backward() walks — the Part 2 network, same numbers
        </text>

        <g>
          <line x1={556} y1={12} x2={584} y2={12} stroke={BLUE} strokeWidth={2} />
          <text x={590} y={16} fill={BLUE} fontSize={11}>
            forward values
          </text>
          <line
            x1={686}
            y1={12}
            x2={714}
            y2={12}
            stroke={RED}
            strokeWidth={2.2}
            strokeDasharray="7 4"
          />
          <text x={720} y={16} fill={RED} fontSize={11}>
            gradient of L
          </text>
          <line
            x1={556}
            y1={30}
            x2={584}
            y2={30}
            stroke={LGRAY}
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />
          <text x={590} y={34} fill={LGRAY} fontSize={11}>
            saved on the way out, read on the way back
          </text>
        </g>

        {/* ---------------- parameters feeding the ops ---------------- */}
        <g>
          <rect
            x={COP1 - 96}
            y={52}
            width={192}
            height={40}
            rx={6}
            fill="none"
            stroke={LGRAY}
            strokeWidth={1.2}
          />
          <text x={COP1} y={67} textAnchor="middle" fill={BLUE} fontSize={11}>
            W₁ = [[{f(W1[0][0])}, {f(W1[0][1])}], [{f(W1[1][0])}, {f(W1[1][1])}]]
          </text>
          <text x={COP1} y={83} textAnchor="middle" fill={BLUE} fontSize={11}>
            b₁ = {vec(b1)}
          </text>
          <line
            x1={COP1}
            y1={92}
            x2={COP1}
            y2={NY + 4}
            stroke={BLUE}
            strokeWidth={1.6}
            markerEnd="url(#bp-fwd)"
          />

          <rect
            x={COP3 - 68}
            y={52}
            width={136}
            height={40}
            rx={6}
            fill="none"
            stroke={LGRAY}
            strokeWidth={1.2}
          />
          <text x={COP3} y={67} textAnchor="middle" fill={BLUE} fontSize={11}>
            W₂ = {vecx(W2, 1)}ᵀ
          </text>
          <text x={COP3} y={83} textAnchor="middle" fill={BLUE} fontSize={11}>
            b₂ = {f(b2)}
          </text>
          <line
            x1={COP3}
            y1={92}
            x2={COP3}
            y2={NY + 4}
            stroke={BLUE}
            strokeWidth={1.6}
            markerEnd="url(#bp-fwd)"
          />

          <text x={COP4} y={83} textAnchor="middle" fill={BLUE} fontSize={11}>
            y = {f(yTarget)}
          </text>
          <line
            x1={COP4}
            y1={90}
            x2={COP4}
            y2={NY + 4}
            stroke={BLUE}
            strokeWidth={1.6}
            markerEnd="url(#bp-fwd)"
          />
        </g>

        {/* ---------------- the chain itself ---------------- */}
        {valueBox(CX, "x", vec(x, 0), "n-x")}
        {opBox(COP1, "x W₁ + b₁", "matmul", "o1")}
        {valueBox(CZ1, "z₁", vec(z1, 2), "n-z1", 10.5)}
        {opBox(COP2, "ReLU", "mask " + vec(mask, 0), "o2")}
        {valueBox(CA1, "a₁", vec(a1, 2), "n-a1", 10.5)}
        {opBox(COP3, "a₁ W₂ + b₂", "matmul", "o3")}
        {valueBox(CZ2, "z₂ = ŷ", f(z2), "n-z2")}
        {opBox(COP4, "½(ŷ − y)²", "loss", "o4")}
        {valueBox(CL, "L", f(loss, 5), "n-L")}

        {fwd(CX + VW / 2, COP1 - OW / 2, "f1")}
        {fwd(COP1 + OW / 2, CZ1 - VW / 2, "f2")}
        {fwd(CZ1 + VW / 2, COP2 - OW / 2, "f3")}
        {fwd(COP2 + OW / 2, CA1 - VW / 2, "f4")}
        {fwd(CA1 + VW / 2, COP3 - OW / 2, "f5")}
        {fwd(COP3 + OW / 2, CZ2 - VW / 2, "f6")}
        {fwd(CZ2 + VW / 2, COP4 - OW / 2, "f7")}
        {fwd(COP4 + OW / 2, CL - VW / 2, "f8")}

        {/* ---------------- gradients under each node ---------------- */}
        {gradUnder(CL, "∂L/∂L", "1  (seed)", "g-L")}
        {gradUnder(CZ2, "∂L/∂z₂ = δ₂", f(d2), "g-z2")}
        {gradUnder(CA1, "∂L/∂a₁", vec(dA1, 2), "g-a1", 10.5)}
        {gradUnder(CZ1, "∂L/∂z₁ = δ₁", vec(d1, 2), "g-z1", 10.5)}
        <text x={CX} y={194} textAnchor="middle" fill={LGRAY} fontSize={10.5}>
          (data, not a
        </text>
        <text x={CX} y={207} textAnchor="middle" fill={LGRAY} fontSize={10.5}>
          parameter)
        </text>

        {/* ---------------- the backward lane ---------------- */}
        {back(CL - 22, CZ2 + 22, `× (ŷ − y) = ${f(d2)}`, "b1")}
        {back(CZ2 - 22, CA1 + 22, `× W₂ᵀ = ${vecx(W2, 1)}`, "b2")}
        {back(CA1 - 22, CZ1 + 22, `× ReLU′(z₁) mask = ${vec(mask, 0)}`, "b3")}
        {back(CZ1 - 22, CX + 26, "stops here — x is data", "b4", true)}

        {/* the lane drops its parameter gradients out at each matmul */}
        <line
          x1={COP1}
          y1={LANE}
          x2={COP1}
          y2={266}
          stroke={RED}
          strokeWidth={1.6}
          markerEnd="url(#bp-back)"
        />
        <line
          x1={COP3}
          y1={LANE}
          x2={COP3}
          y2={266}
          stroke={RED}
          strokeWidth={1.6}
          markerEnd="url(#bp-back)"
        />

        <g>
          <rect
            x={COP1 - 122}
            y={270}
            width={244}
            height={42}
            rx={6}
            fill="none"
            stroke={RED}
            strokeWidth={1.1}
            opacity={0.6}
          />
          <text x={COP1} y={286} textAnchor="middle" fontSize={11} fill={RED}>
            ∂L/∂W₁ = <tspan fill={BLUE}>xᵀ</tspan> δ₁ = [[{f(dW1[0][0])},{" "}
            {f(dW1[0][1])}], [{f(dW1[1][0])}, {f(dW1[1][1])}]]
          </text>
          <text x={COP1} y={303} textAnchor="middle" fontSize={11} fill={RED}>
            ∂L/∂b₁ = δ₁ = {vec(db1, 2)}
          </text>

          <rect
            x={COP3 - 100}
            y={270}
            width={200}
            height={42}
            rx={6}
            fill="none"
            stroke={RED}
            strokeWidth={1.1}
            opacity={0.6}
          />
          <text x={COP3} y={286} textAnchor="middle" fontSize={11} fill={RED}>
            ∂L/∂W₂ = <tspan fill={BLUE}>a₁ᵀ</tspan> δ₂ = {vec(dW2, 3)}ᵀ
          </text>
          <text x={COP3} y={303} textAnchor="middle" fontSize={11} fill={RED}>
            ∂L/∂b₂ = δ₂ = {f(db2)}
          </text>
        </g>

        {/* ---------------- what the backward step reads off the forward ---- */}
        {reuse("M 92 160 C 116 190, 104 240, 118 266", "r1")}
        {reuse("M 472 160 C 500 190, 486 240, 500 266", "r2")}
        {reuse("M 288 160 C 316 178, 320 198, 330 222", "r3")}

        {/* ---------------- panel divider ---------------- */}
        <line
          x1={20}
          y1={332}
          x2={W - 20}
          y2={332}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
        />

        {/* ---------------- panel 2: which direction to sweep ---------------- */}
        <text
          x={20}
          y={354}
          className="fill-foreground"
          fontSize={13}
          fontWeight={600}
        >
          Which way to sweep the same chain rule
        </text>

        <line
          x1={445}
          y1={366}
          x2={445}
          y2={474}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
        />

        {/* reverse mode */}
        <text x={24} y={382} fill={RED} fontSize={12.5} fontWeight={600}>
          Reverse mode — what .backward() does
        </text>
        {miniChain(70, 350, 406, "mc-rev")}
        <text x={62} y={396} textAnchor="middle" fill={GRAY} fontSize={10}>
          params
        </text>
        <text x={358} y={396} textAnchor="middle" fill={GRAY} fontSize={10}>
          L
        </text>
        <line
          x1={352}
          y1={424}
          x2={66}
          y2={424}
          stroke={RED}
          strokeWidth={2.2}
          strokeDasharray="7 4"
          markerEnd="url(#bp-back)"
        />
        <text x={24} y={448} fill={RED} fontSize={11.5} fontWeight={600}>
          1 sweep, seeded at the single scalar L
        </text>
        <text x={24} y={464} className="fill-muted-foreground" fontSize={11.5}>
          → all {nParams} gradients, at about the cost of one forward pass
        </text>

        {/* forward mode */}
        <text x={462} y={382} fill={BLUE} fontSize={12.5} fontWeight={600}>
          Forward mode — one seed per input
        </text>
        {[0, 1, 2].map((i) => (
          <g key={`fm${i}`}>
            {miniChain(500, 700, 398 + i * 20, `mc-f${i}`)}
            <line
              x1={500}
              y1={398 + i * 20}
              x2={706}
              y2={398 + i * 20}
              stroke={BLUE}
              strokeWidth={2}
              markerEnd="url(#bp-fwd)"
            />
            <text x={716} y={402 + i * 20} fill={BLUE} fontSize={11}>
              {i === 2 ? `⋮ and ${nParams - 2} more` : `seed ∂/∂W₁[0,${i}]`}
            </text>
          </g>
        ))}
        <text x={462} y={448} fill={BLUE} fontSize={11.5} fontWeight={600}>
          {nParams} sweeps for the {nParams} parameters of this net
        </text>
        <text x={462} y={464} className="fill-muted-foreground" fontSize={11.5}>
          → one per parameter, so roughly 10⁹ of them for a real model
        </text>
      </>
    ),
  });
}
