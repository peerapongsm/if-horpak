import type { Meter } from "@/lib/engine";

function Candle({ lit, index }: { lit: boolean; index: number }) {
  return (
    <svg
      className={lit ? "candle candle-lit" : "candle candle-out"}
      width="18"
      height="30"
      viewBox="0 0 18 30"
      aria-hidden="true"
      style={{ animationDelay: `${index * 0.37}s` }}
    >
      {lit ? (
        <g className="flame-wrap">
          <path
            className="flame"
            d="M9 3.5c1.8 2.4 3 4.2 3 6.4a3 3 0 1 1-6 0c0-2.2 1.2-4 3-6.4Z"
          />
          <path className="flame-core" d="M9 8c.9 1.3 1.4 2.1 1.4 3.1a1.4 1.4 0 1 1-2.8 0c0-1 .5-1.8 1.4-3.1Z" />
        </g>
      ) : (
        <path className="wisp" d="M9 8c1.4 1.4 2 2.4 1.1 3.6-.9 1.2-.4 2 .6 3" />
      )}
      <line className="wick" x1="9" y1="12" x2="9" y2="15.5" />
      <rect className="wax" x="4" y="15" width="10" height="12" rx="1.5" />
      <ellipse className="wax-drip" cx="9" cy="15" rx="5.5" ry="1.6" />
      <ellipse className="base" cx="9" cy="27.5" rx="7.5" ry="1.8" />
    </svg>
  );
}

function Heart({ full, index }: { full: boolean; index: number }) {
  return (
    <svg className={full ? "heart heart-full" : "heart heart-empty"} width="22" height="20"
      viewBox="0 0 22 20" aria-hidden="true" style={{ animationDelay: `${index * 0.12}s` }}>
      <path d="M11 18C4 13 1 9.5 1 6.2 1 3.6 3.1 2 5.4 2 7 2 8.6 3 11 5.3 13.4 3 15 2 16.6 2 18.9 2 21 3.6 21 6.2 21 9.5 18 13 11 18Z" />
    </svg>
  );
}

function Bar({ charged, index }: { charged: boolean; index: number }) {
  return <span className={charged ? "battpip battpip-on" : "battpip battpip-off"}
    style={{ animationDelay: `${index * 0.1}s` }} aria-hidden="true" />;
}

export default function MeterDisplay({ meter, value }: { meter: Meter; value: number }) {
  if (meter.hideBar) return null;
  const slots = Array.from({ length: meter.max }, (_, i) => i < value);
  const label = `${meter.label} ${value} จาก ${meter.max}`;
  if (meter.viz === "hearts") {
    return <div className="meter meter-hearts" aria-label={label}>
      {slots.map((f, i) => <Heart key={i} full={f} index={i} />)}</div>;
  }
  if (meter.viz === "battery") {
    return <div className="meter meter-battery" aria-label={label}>
      {slots.map((c, i) => <Bar key={i} charged={c} index={i} />)}</div>;
  }
  return <div className="sanity-candles" aria-label={label}>
    {slots.map((lit, i) => <Candle key={i} lit={lit} index={i} />)}</div>;
}
