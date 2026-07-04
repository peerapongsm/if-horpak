"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STORIES } from "@/lib/stories";
import { loadSave, loadFoundEndings } from "@/lib/storage";
import { AmbientEngine, getAmbientPref, setAmbientPref } from "@/lib/ambient";
import StorySelect from "@/components/StorySelect";

export default function StorySelectScreen() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [ambientOn, setAmbientOn] = useState(false);
  const ambientRef = useRef<AmbientEngine | null>(null);
  const ambient = () => (ambientRef.current ??= new AmbientEngine("horror"));

  useEffect(() => {
    setHydrated(true);
    if (getAmbientPref(window.localStorage)) {
      setAmbientOn(true);
      const resume = () => ambient().enable();
      window.addEventListener("pointerdown", resume, { once: true });
      return () => window.removeEventListener("pointerdown", resume);
    }
  }, []);

  const statuses = Object.fromEntries(
    STORIES.map((s) => [s.slug, hydrated
      ? { hasSave: loadSave(s.slug) !== null, foundCount: loadFoundEndings(s.slug).length }
      : { hasSave: false, foundCount: 0 }]),
  );

  function handleToggleAmbient() {
    const next = !ambientOn;
    setAmbientOn(next);
    setAmbientPref(window.localStorage, next);
    if (next) ambient().enable(); else ambientRef.current?.disable();
  }

  return (
    <main className="screen">
      <div className="topbar">
        <p className="game-title">if — ถ้า</p>
        <p className="game-subtitle">นิยายเลือกทางเดิน</p>
      </div>
      <StorySelect stories={STORIES} statuses={statuses} onPick={(slug) => router.push(`/${slug}`)} />
      <div className="footer-row">
        <button type="button" className="text-btn" onClick={handleToggleAmbient} aria-pressed={ambientOn}>
          {ambientOn ? "🔊 เสียงบรรยากาศ: เปิด" : "🔇 เสียงบรรยากาศ: ปิด"}
        </button>
      </div>
    </main>
  );
}
