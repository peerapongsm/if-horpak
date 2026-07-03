"use client";

import type { StoryEntry } from "@/lib/stories";

interface StoryStatus {
  hasSave: boolean;
  foundCount: number;
}

interface StorySelectProps {
  stories: StoryEntry[];
  statuses: Record<string, StoryStatus>;
  onPick: (slug: string) => void;
}

export default function StorySelect({ stories, statuses, onPick }: StorySelectProps) {
  return (
    <div className="story-select">
      <p className="select-label">เลือกเรื่องที่จะอ่าน</p>
      {stories.map((story) => {
        const status = statuses[story.slug] ?? { hasSave: false, foundCount: 0 };
        return (
          <button
            key={story.slug}
            type="button"
            className="story-card"
            onClick={() => onPick(story.slug)}
          >
            <span className="story-card-title">{story.title}</span>
            <span className="story-card-tagline">{story.tagline}</span>
            <span className="story-card-meta">
              {status.hasSave ? "🕯️ เล่นค้างอยู่ — อ่านต่อ · " : ""}
              พบ {status.foundCount}/{story.endings.length} endings
            </span>
          </button>
        );
      })}
    </div>
  );
}
