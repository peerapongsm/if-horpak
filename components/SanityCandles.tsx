import { MAX_SANITY } from "@/lib/engine";

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

export default function SanityCandles({ sanity }: { sanity: number }) {
  const slots = Array.from({ length: MAX_SANITY }, (_, i) => i < sanity);
  return (
    <div className="sanity-candles" aria-label={`สติ ${sanity} จาก ${MAX_SANITY}`}>
      {slots.map((lit, i) => (
        <Candle key={i} lit={lit} index={i} />
      ))}
    </div>
  );
}
