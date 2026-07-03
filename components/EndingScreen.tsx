import { ENDINGS_META } from "@/lib/endingsMeta";

interface EndingScreenProps {
  endingId: string;
  endingText: string;
  foundEndings: string[];
  onRestart: () => void;
}

export default function EndingScreen({ endingId, endingText, foundEndings, onRestart }: EndingScreenProps) {
  const currentMeta = ENDINGS_META.find((e) => e.id === endingId);

  return (
    <div className="ending-screen">
      <svg className="incense-wisp" width="40" height="90" viewBox="0 0 40 90" aria-hidden="true">
        <path d="M20 88c0-10 8-14 8-24s-8-14-8-24 8-14 8-24" />
      </svg>
      <p className="ending-label">จบเรื่อง</p>
      <h1 className="ending-title">{currentMeta?.title ?? "จบ"}</h1>
      <p className="story-text">{endingText}</p>

      <div className="ending-collection">
        <p className="ending-collection-label">
          คุณพบ {foundEndings.length}/{ENDINGS_META.length} endings
        </p>
        <ul className="ending-collection-list">
          {ENDINGS_META.map((meta) => {
            const found = foundEndings.includes(meta.id);
            const label = found ? meta.title : meta.secret ? "???" : meta.title;
            return (
              <li key={meta.id} className={found ? "ending-item ending-item-found" : "ending-item"}>
                {found ? "🕯️" : "🕯"} {label}
              </li>
            );
          })}
        </ul>
      </div>

      <button type="button" className="choice-btn primary-btn" onClick={onRestart}>
        เล่นอีกครั้ง
      </button>
    </div>
  );
}
