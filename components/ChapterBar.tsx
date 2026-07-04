import type { Chapter } from "@/lib/engine";

export default function ChapterBar({ chapter }: { chapter: Chapter }) {
  const pct = Math.max(0, Math.min(100, (chapter.index / chapter.total) * 100));
  return (
    <div className="chapter-bar" aria-label={`${chapter.label} (${chapter.index}/${chapter.total})`}>
      <span className="chapter-label">{chapter.label}</span>
      <span className="chapter-track"><span className="chapter-fill" style={{ width: `${pct}%` }} /></span>
    </div>
  );
}
