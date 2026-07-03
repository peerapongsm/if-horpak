import type { EndingMeta } from "@/lib/endingsMeta";

interface EndingScreenProps {
  endingId: string;
  endingText: string;
  endings: EndingMeta[];
  foundEndings: string[];
  onRestart: () => void;
  onBackToStories: () => void;
}

export default function EndingScreen({
  endingId,
  endingText,
  endings,
  foundEndings,
  onRestart,
  onBackToStories,
}: EndingScreenProps) {
  const currentMeta = endings.find((e) => e.id === endingId);

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
          คุณพบ {foundEndings.length}/{endings.length} endings
        </p>
        <ul className="ending-collection-list">
          {endings.map((meta) => {
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
      <button type="button" className="choice-btn" onClick={onBackToStories}>
        เลือกเรื่องอื่น
      </button>
    </div>
  );
}
