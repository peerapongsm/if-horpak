import { MAX_SANITY } from "@/lib/engine";

export default function SanityCandles({ sanity }: { sanity: number }) {
  const slots = Array.from({ length: MAX_SANITY }, (_, i) => i < sanity);
  return (
    <div className="sanity-candles" aria-label={`สติ ${sanity} จาก ${MAX_SANITY}`}>
      {slots.map((lit, i) => (
        <span key={i} className={lit ? "candle candle-lit" : "candle candle-out"} aria-hidden="true">
          🕯️
        </span>
      ))}
    </div>
  );
}
