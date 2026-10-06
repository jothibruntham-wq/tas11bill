/**
 * BillingMachine.jsx
 * ------------------------------------------------------------------
 * A billing machine that prints 3 receipts one after another:
 *   1. Ticket (barcode)  2. Apple Store (QR)  3. Cafe (barcode)
 *
 * Each bill slides out of the machine slot, confetti bursts, the bill
 * stays for a moment, slides back in, and the next bill prints. Loops forever.
 *
 * Install:
 *   npm i framer-motion canvas-confetti
 *
 * Use:
 *   import BillingMachine from "./BillingMachine";
 *   export default function App() { return <BillingMachine />; }
 *
 * Optional: <BillingMachine bgImage="/cafe.jpg" />  (your own photo, covers edge to edge)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";

/* ------------------------------------------------------------------ */
/* Data: the 3 bills                                                   */
/* ------------------------------------------------------------------ */
const BILLS = [
  {
    id: "ticket",
    icon: "ticket",
    badge: "orange",
    title: "Thank you!",
    subtitle: "Your ticket has been issued successfully",
    ref: null,
    idLabel: "Ticket ID",
    idValue: "0128034399434",
    amount: 99.99,
    status: "Confirmed",
    payer: "Usman Shams",
    method: "mastercard",
    methodLabel: "•••• 8237",
    code: "barcode",
    seed: "0128034399434",
    codeText: "2 8937261 273818",
    bar: ["#ffb42e", "#ee7a0c"],
  },
  {
    id: "apple",
    icon: "apple",
    badge: "dark",
    title: "Apple Store",
    subtitle: "Fifth Avenue · New York",
    ref: "Receipt #AP-9642104",
    idLabel: "Order no",
    idValue: "W984210491823",
    amount: 1199,
    status: "Paid in full",
    payer: "Usman Shams",
    method: "applepay",
    methodLabel: "Apple Pay (•••• 9012)",
    code: "qr",
    seed: "W984210491823",
    codeText: "Scan to verify authenticity",
    bar: ["#8fa3c0", "#44587a"],
  },
  {
    id: "cafe",
    icon: "coffee",
    badge: "orange",
    title: "Artisan Roasters",
    subtitle: "Fresh Brew Bakery",
    ref: "Table #08 · Order ready",
    idLabel: "Receipt #",
    idValue: "CF-84920418",
    amount: 14.5,
    status: "Served",
    payer: "Usman Shams",
    method: "visa",
    methodLabel: "•••• 4192",
    code: "barcode",
    seed: "CF-84920418",
    codeText: "4 9267723 091824",
    bar: ["#d98a52", "#9a5424"],
  },
];

const CONFETTI_COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#c77dff", "#ff9f1c"];
const PRINT_SECONDS = 1.7; // slide out
const RETRACT_SECONDS = 1.0; // slide back
const HOLD_MS = 3600; // time the bill stays visible

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */
// Seeded random so the barcode / QR for a bill is always the same
function seeded(seed) {
  let h = 2166136261;
  for (const ch of seed) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* SVG pieces                                                          */
/* ------------------------------------------------------------------ */
function Barcode({ seed }) {
  const { rects, width } = useMemo(() => {
    const rnd = seeded(seed);
    const out = [];
    let x = 0;
    while (x < 190) {
      const bar = 1 + Math.floor(rnd() * 3);
      out.push({ x, w: bar });
      x += bar + 1 + Math.floor(rnd() * 2);
    }
    return { rects: out, width: x };
  }, [seed]);

  return (
    <svg className="bm-barcode" viewBox={`0 0 ${width} 40`} preserveAspectRatio="none" aria-hidden="true">
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y="0" width={r.w} height="40" fill="#111827" />
      ))}
    </svg>
  );
}

function QRCode({ seed }) {
  const n = 25;
  const d = useMemo(() => {
    const rnd = seeded(seed);
    const finder = (cx, cy) => {
      const dx = Math.abs(cx - 3);
      const dy = Math.abs(cy - 3);
      const m = Math.max(dx, dy);
      return m === 3 || m <= 1;
    };
    let path = "";
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        let on;
        if (x < 7 && y < 7) on = finder(x, y);
        else if (x >= n - 7 && y < 7) on = finder(x - (n - 7), y);
        else if (x < 7 && y >= n - 7) on = finder(x, y - (n - 7));
        else if ((x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8)) on = false;
        else on = rnd() > 0.52;
        if (on) path += `M${x} ${y}h1v1h-1z`;
      }
    }
    return path;
  }, [seed]);

  return (
    <svg className="bm-qr" viewBox={`-1 -1 ${n + 2} ${n + 2}`} shapeRendering="crispEdges" aria-hidden="true">
      <path d={d} fill="#111827" />
    </svg>
  );
}

function Glyph({ name }) {
  const p = {
    width: "1.3em",
    height: "1.3em",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  if (name === "ticket")
    return (
      <svg {...p}>
        <path d="M4 6h16a1 1 0 0 1 1 1v2.5a2.5 2.5 0 0 0 0 5V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.5a2.5 2.5 0 0 0 0-5V7a1 1 0 0 1 1-1z" />
        <path d="M14 7v10" strokeDasharray="1.5 2" />
      </svg>
    );
  if (name === "coffee")
    return (
      <svg {...p}>
        <path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
        <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
        <path d="M8.5 3v3M12 3v3" />
      </svg>
    );
  // apple
  return (
    <svg {...p} fill="currentColor" stroke="none">
      <path d="M12 8c-1.5-1.6-5-1.2-5.8 2.2-.8 3.4 1.3 8.3 3.5 8.3 1 0 1.4-.6 2.3-.6s1.3.6 2.3.6c2.2 0 4.3-4.9 3.5-8.3C17 6.8 13.5 6.4 12 8z" />
      <path d="M12 6.2c0-1.6.9-3 2.6-3.4.1 1.600-.8 3.100-2.600 3.400z" />
    </svg>
  );
}

function PayLogo({ type }) {
  if (type === "mastercard")
    return (
      <svg width="2.2em" height="1.4em" viewBox="0 0 32 20" aria-hidden="true">
        <circle cx="11" cy="10" r="8" fill="#eb001b" />
        <circle cx="21" cy="10" r="8" fill="#f79e1b" fillOpacity="0.95" />
        <path d="M16 3.9a8 8 0 0 1 0 12.2 8 8 0 0 1 0-12.2z" fill="#ff5f00" />
      </svg>
    );
  if (type === "visa")
    return (
      <span className="bm-visa" aria-hidden="true">
        VISA
      </span>
    );
  return (
    <svg width="1.4em" height="1.4em" viewBox="0 0 24 24" fill="#111827" aria-hidden="true">
      <path d="M12 8c-1.5-1.6-5-1.2-5.8 2.2-.8 3.4 1.3 8.3 3.5 8.3 1 0 1.4-.6 2.3-.6s1.3.6 2.3.6c2.2 0 4.3-4.9 3.5-8.3C17 6.8 13.5 6.4 12 8z" />
      <path d="M12 6.2c0-1.6.9-3 2.6-3.4.1 1.600-.8 3.100-2.600 3.400z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Count-up amount                                                     */
/* ------------------------------------------------------------------ */
function Amount({ value, instant }) {
  const [v, setV] = useState(instant ? value : 0);
  useEffect(() => {
    if (instant) return undefined;
    const controls = animate(0, value, { duration: 1.3, delay: 0.5, ease: "easeOut", onUpdate: setV });
    return () => controls.stop();
  }, [value, instant]);
  return <>{money.format(v)}</>;
}

/* ------------------------------------------------------------------ */
/* One receipt                                                         */
/* ------------------------------------------------------------------ */
function Receipt({ bill, reduce }) {
  return (
    <div className="bm-paper">
      <div className="bm-head">
        <motion.div
          className={`bm-badge bm-badge-${bill.badge}`}
          initial={reduce ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.9 }}
        >
          <Glyph name={bill.icon} />
        </motion.div>
        <h2 className="bm-title">{bill.title}</h2>
        <p className="bm-sub">{bill.subtitle}</p>
        {bill.ref && <p className="bm-sub">{bill.ref}</p>}
      </div>

      <div className="bm-perf" />

      <div className="bm-grid">
        <span className="bm-label">{bill.idLabel}</span>
        <span className="bm-label bm-right">Amount</span>
        <span className="bm-value">{bill.idValue}</span>
        <span className="bm-value bm-amount bm-right">
          <Amount value={bill.amount} instant={reduce} />
        </span>

        <span className="bm-label">Date &amp; time</span>
        <span className="bm-label bm-right">Status</span>
        <span className="bm-value">19 Aug 2026 · 20:17</span>
        <motion.span
          className="bm-status bm-right"
          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 1.5 }}
        >
          {bill.status}
        </motion.span>
      </div>

      <div className="bm-payer">
        <PayLogo type={bill.method} />
        <div>
          <div className="bm-payer-name">{bill.payer}</div>
          <div className="bm-payer-sub">{bill.methodLabel}</div>
        </div>
      </div>

      <div className="bm-codebox">
        {bill.code === "qr" ? <QRCode seed={bill.seed} /> : <Barcode seed={bill.seed} />}
        <div className={bill.code === "qr" ? "bm-caption bm-caption-caps" : "bm-caption"}>{bill.codeText}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Background: edge-to-edge, covers the whole screen                   */
/* ------------------------------------------------------------------ */
function Background({ image, reduce }) {
  const lights = useMemo(() => {
    const rnd = seeded("bokeh");
    const palette = ["#ffd27a", "#ffb35c", "#7fb2ff", "#5fd3c8", "#ffe9b0", "#ff8a5c"];
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: rnd() * 100,
      y: 3 + rnd() * 44,
      size: 14 + rnd() * 46,
      color: palette[Math.floor(rnd() * palette.length)],
      o: 0.25 + rnd() * 0.45,
      dur: 3 + rnd() * 4,
    }));
  }, []);

  return (
    <div className="bm-bg" aria-hidden="true">
      <div className="bm-bg-base" />
      {image && <div className="bm-bg-img" style={{ backgroundImage: `url(${image})` }} />}
      {!image && (
        <>
          <div className="bm-bg-table" />
          <div className="bm-bg-shape" style={{ left: "6%", bottom: "30%", width: "22%", height: "20%" }} />
          <div className="bm-bg-shape" style={{ right: "4%", bottom: "28%", width: "26%", height: "24%" }} />
          <div className="bm-bg-vase" />
        </>
      )}
      {lights.map((l) => (
        <motion.span
          key={l.id}
          className="bm-light"
          style={{
            left: `${l.x}%`,
            top: `${l.y}%`,
            width: l.size,
            height: l.size,
            background: `radial-gradient(circle, ${l.color} 0%, ${l.color}00 70%)`,
          }}
          animate={reduce ? { opacity: l.o } : { opacity: [l.o, l.o * 0.35, l.o] }}
          transition={{ duration: l.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div className="bm-bg-vignette" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export default function BillingMachine({ bgImage }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [printing, setPrinting] = useState(true);

  const machineRef = useRef(null);
  const canvasRef = useRef(null);
  const fireRef = useRef(null);
  const timerRef = useRef(null);

  const bill = BILLS[index];

  // confetti instance bound to our own full-screen canvas
  useEffect(() => {
    fireRef.current = confetti.create(canvasRef.current, { resize: true, useWorker: false });
    return () => {
      fireRef.current?.reset();
      clearTimeout(timerRef.current);
    };
  }, []);

  const burst = useCallback(() => {
    const fire = fireRef.current;
    const el = machineRef.current;
    if (!fire || !el) return;
    const r = el.getBoundingClientRect();
    const origin = {
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + r.height * 0.75) / window.innerHeight,
    };
    const base = { origin, colors: CONFETTI_COLORS, ticks: 240, gravity: 0.85, scalar: 0.8, zIndex: 5 };
    fire({ ...base, particleCount: 60, spread: 100, startVelocity: 30, angle: 90 });
    setTimeout(() => fire({ ...base, particleCount: 45, spread: 140, startVelocity: 22, angle: 90 }), 200);
    setTimeout(() => fire({ ...base, particleCount: 30, spread: 180, startVelocity: 14, scalar: 0.6, angle: 90 }), 420);
  }, []);

  // called when the bill has fully slid out
  const handlePrinted = useCallback(() => {
    setPrinting(false);
    if (!reduce) burst();
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % BILLS.length);
      setPrinting(true);
    }, HOLD_MS);
  }, [burst, reduce]);

  return (
    <div className="bm-root">
      <style>{CSS}</style>

      <Background image={bgImage} reduce={reduce} />

      <main className="bm-stage">
        {/* the machine */}
        <motion.div
          ref={machineRef}
          className="bm-machine"
          animate={printing && !reduce ? { y: [0, 0.8, -0.8, 0.6, 0] } : { y: 0 }}
          transition={printing && !reduce ? { duration: 0.2, repeat: Infinity } : { duration: 0.2 }}
        >
          {BILLS.map((b, k) => (
            <motion.div
              key={b.id}
              className="bm-bar-layer"
              style={{ background: `linear-gradient(180deg, ${b.bar[0]}, ${b.bar[1]})` }}
              animate={{ opacity: k === index ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            />
          ))}
          <span className="bm-gloss" />
          <span className="bm-groove" />
          <motion.span
            className="bm-led"
            animate={printing ? { opacity: [1, 0.2, 1] } : { opacity: 0.35 }}
            transition={printing ? { duration: 0.5, repeat: Infinity } : { duration: 0.3 }}
          />
        </motion.div>

        {/* paper feed: clipped at the slot so the bill emerges from inside the machine */}
        <div className="bm-feed">
          <AnimatePresence mode="wait">
            <motion.div
              key={bill.id}
              className="bm-sheet"
              initial={{ y: "-102%" }}
              animate={{ y: "0%" }}
              exit={{ y: "-102%" }}
              transition={{
                y: {
                  duration: reduce ? 0.01 : PRINT_SECONDS,
                  ease: [0.22, 0.7, 0.3, 1],
                },
              }}
              onAnimationComplete={(def) => {
                if (def && def.y === "0%") handlePrinted();
              }}
            >
              <Receipt bill={bill} reduce={reduce} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <canvas ref={canvasRef} className="bm-confetti" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CSS (responsive: everything inside the bill scales from --rw)       */
/* ------------------------------------------------------------------ */
const CSS = `
html, body { margin: 0; padding: 0; background: #0b0e14; }

.bm-root {
  --rw: min(84vw, 380px, 50dvh);           /* receipt width: fits any phone, tablet, desktop */
  position: fixed; inset: 0;                /* edge to edge */
  width: 100vw; height: 100dvh;
  overflow: hidden;
  font-size: calc(var(--rw) / 24);          /* 1em scales with the receipt */
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
  color: #1b2433;
  -webkit-font-smoothing: antialiased;
}

/* ---------- background ---------- */
.bm-bg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; }
.bm-bg-base {
  position: absolute; inset: 0;
  background:
    radial-gradient(60% 40% at 20% 20%, rgba(255,190,110,.20), transparent 70%),
    radial-gradient(55% 40% at 85% 25%, rgba(90,140,255,.22), transparent 70%),
    linear-gradient(180deg, #121a2c 0%, #1b2030 32%, #2b241f 58%, #15110f 100%);
}
.bm-bg-img {
  position: absolute; inset: -4%;
  background-size: cover; background-position: center;
  filter: blur(10px) brightness(.6) saturate(1.1);
}
.bm-bg-table {
  position: absolute; left: -5%; right: -5%; bottom: 0; height: 40%;
  background: linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.02) 40%, rgba(0,0,0,.35));
  filter: blur(14px);
}
.bm-bg-shape { position: absolute; background: rgba(10,10,14,.55); border-radius: 18%; filter: blur(22px); }
.bm-bg-vase {
  position: absolute; left: 50%; bottom: 34%; width: 14%; height: 18%;
  transform: translateX(-50%);
  background: radial-gradient(ellipse at 50% 30%, rgba(255,235,200,.55), rgba(255,235,200,.08) 70%);
  border-radius: 50% 50% 40% 40%;
  filter: blur(14px);
}
.bm-light { position: absolute; border-radius: 50%; filter: blur(5px); mix-blend-mode: screen; }
.bm-bg-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 30%, transparent 35%, rgba(0,0,0,.6) 100%);
}

/* ---------- stage ---------- */
.bm-stage {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center;
  padding-top: calc(max(env(safe-area-inset-top), 0px) + clamp(16px, 7dvh, 72px));
}

/* ---------- machine bar ---------- */
.bm-machine {
  position: relative; z-index: 3;
  width: calc(var(--rw) + 2.4em);
  height: 1.7em;
  border-radius: 1em;
  box-shadow: 0 .5em 1.2em rgba(0,0,0,.45), inset 0 -.15em .2em rgba(0,0,0,.25);
}
.bm-bar-layer { position: absolute; inset: 0; border-radius: inherit; }
.bm-gloss {
  position: absolute; left: 3%; right: 3%; top: .12em; height: 42%;
  border-radius: 1em; background: linear-gradient(180deg, rgba(255,255,255,.65), rgba(255,255,255,0));
}
.bm-groove {
  position: absolute; left: 4%; right: 4%; bottom: .28em; height: .2em;
  border-radius: 1em; background: rgba(0,0,0,.38);
}
.bm-led {
  position: absolute; right: 1.1em; top: 50%; width: .35em; height: .35em; margin-top: -.18em;
  border-radius: 50%; background: #fff; box-shadow: 0 0 .5em #fff;
}

/* ---------- paper feed ---------- */
.bm-feed {
  position: relative; z-index: 1;
  width: var(--rw);
  margin-top: -.85em;                       /* tuck under the machine lip */
  clip-path: inset(0 -3em -3em -3em);       /* hide the top part (inside the machine), keep shadow */
}
.bm-sheet { filter: drop-shadow(0 .8em 1.1em rgba(0,0,0,.35)); will-change: transform; }

/* ---------- paper ---------- */
.bm-paper {
  --z: .9em;
  background: #fff;
  padding: .85em 0 calc(var(--z) * 1.4);
  -webkit-mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / var(--z) 100%;
          mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / var(--z) 100%;
}
.bm-head { text-align: center; padding: .7em 1.2em .9em; }
.bm-badge {
  width: 2.5em; height: 2.5em; margin: 0 auto .5em; border-radius: 50%;
  display: grid; place-items: center;
}
.bm-badge-orange {
  color: #f08a14;
  background: radial-gradient(circle, #ffe6b8 0%, #fff3da 55%, #fff 100%);
  box-shadow: 0 0 1em rgba(255,170,60,.55);
}
.bm-badge-dark { color: #fff; background: #151a23; box-shadow: 0 .2em .6em rgba(0,0,0,.3); }
.bm-title { margin: 0; font-size: 1.3em; line-height: 1.2; font-weight: 800; letter-spacing: -.01em; color: #0f1624; }
.bm-sub { margin: .25em 0 0; font-size: .72em; line-height: 1.35; color: #7b8798; }

.bm-perf { margin: 0 .8em; border-top: .1em dashed #cfd6e0; }

.bm-grid {
  display: grid; grid-template-columns: 1fr auto;
  align-items: center; row-gap: .25em; column-gap: .8em;
  padding: .9em 1.2em;
}
.bm-grid > :nth-child(5) { margin-top: .6em; }
.bm-grid > :nth-child(6) { margin-top: .6em; }
.bm-label { font-size: .55em; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: #8a94a6; }
.bm-value { font-size: .82em; font-weight: 700; color: #111a2b; font-variant-numeric: tabular-nums; }
.bm-amount { font-size: 1em; font-weight: 800; }
.bm-right { justify-self: end; text-align: right; }
.bm-status {
  padding: .4em .9em; border-radius: 99em;
  font-size: .56em; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
  background: #d6f1ee; color: #1e7a73; white-space: nowrap;
}

.bm-payer {
  display: flex; align-items: center; gap: .8em;
  padding: .85em 1.2em; background: #f1f5fb;
}
.bm-payer-name { font-size: .75em; font-weight: 800; color: #111a2b; }
.bm-payer-sub { font-size: .6em; color: #8a94a6; margin-top: .15em; }
.bm-visa { font-size: .95em; font-weight: 900; font-style: italic; color: #1a3a8f; letter-spacing: -.02em; }

.bm-codebox { padding: 1em 1.2em .3em; text-align: center; }
.bm-barcode { display: block; width: 72%; height: 3.8em; margin: 0 auto; }
.bm-qr { display: block; width: 7em; height: 7em; margin: 0 auto; }
.bm-caption { margin-top: .7em; font-size: .55em; letter-spacing: .12em; color: #6c7686; }
.bm-caption-caps { text-transform: uppercase; font-weight: 700; color: #8a94a6; }

/* ---------- confetti canvas ---------- */
.bm-confetti { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; }

/* ---------- very small / landscape phones ---------- */
@media (max-height: 520px) { .bm-root { --rw: min(60vw, 300px, 46dvh); } }

@media (prefers-reduced-motion: reduce) {
  .bm-light { animation: none; }
}
`;

