"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  applyChoice,
  availableChoices,
  getNode,
  initState,
  isEndingNode,
  type Choice,
  type GameState,
} from "@/lib/engine";
import { getStoryEntry } from "@/lib/stories";
import { addFoundEnding, clearSave, loadFoundEndings, loadSave, saveGame } from "@/lib/storage";
import {
  getTextSpeed,
  nextTextSpeed,
  setTextSpeed,
  TEXT_SPEED_LABELS,
  type TextSpeed,
} from "@/lib/settings";
import { AmbientEngine, getAmbientPref, setAmbientPref } from "@/lib/ambient";
import Typewriter from "@/components/Typewriter";
import ChoiceList from "@/components/ChoiceList";
import MeterDisplay from "@/components/MeterDisplay";
import ChapterBar from "@/components/ChapterBar";
import EndingScreen from "@/components/EndingScreen";

declare global {
  interface Window {
    umami?: { track: (eventName: string, data?: Record<string, unknown>) => void };
  }
}

export default function StoryPlayer({ slug }: { slug: string }) {
  const router = useRouter();
  const entry = getStoryEntry(slug);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [foundEndings, setFoundEndings] = useState<string[]>([]);
  const [veilKey, setVeilKey] = useState(0);
  const [speed, setSpeed] = useState<TextSpeed>("normal");
  const [ambientOn, setAmbientOn] = useState(false);

  const ambientRef = useRef<AmbientEngine | null>(null);

  const ambient = () => {
    if (!ambientRef.current) ambientRef.current = new AmbientEngine(entry!.ambientMood);
    return ambientRef.current;
  };

  // Match the page theme to this story's genre.
  useEffect(() => {
    if (entry) document.documentElement.dataset.theme = entry.ambientMood;
  }, [entry]);

  // Hydrate save + settings after mount (client-only).
  useEffect(() => {
    if (!entry) return;
    setGameState(loadSave(entry.slug) ?? initState(entry.data));
    setFoundEndings(loadFoundEndings(entry.slug));
    setSpeed(getTextSpeed(window.localStorage));
    if (getAmbientPref(window.localStorage)) {
      setAmbientOn(true);
      const resume = () => ambient().enable();
      window.addEventListener("pointerdown", resume, { once: true });
      return () => window.removeEventListener("pointerdown", resume);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave on every node change.
  useEffect(() => {
    if (entry && gameState) saveGame(entry.slug, gameState);
  }, [entry, gameState]);

  const currentNode = entry && gameState ? getNode(entry.data, gameState.currentNode) : null;

  // Record newly-reached endings.
  useEffect(() => {
    if (entry && currentNode && isEndingNode(currentNode) && currentNode.endingId) {
      setFoundEndings(addFoundEnding(entry.slug, currentNode.endingId));
      if (typeof window !== "undefined" && window.umami) {
        window.umami.track("ending-reached", {
          story: entry.slug,
          ending: currentNode.endingId,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNode?.id]);

  // Brief darkness-swallow veil on every scene change.
  useEffect(() => {
    setVeilKey((k) => k + 1);
  }, [currentNode?.id]);

  function handleChoose(choice: Choice) {
    if (!entry || !gameState) return;
    const { state: next } = applyChoice(entry.data, gameState, choice);
    setGameState(next);
    setRevealed(false);
  }

  function handleRestart() {
    if (!entry) return;
    const confirmed = window.confirm("ยืนยันเริ่มเรื่องใหม่? ความคืบหน้าตอนนี้จะหายไป");
    if (!confirmed) return;
    clearSave(entry.slug);
    setGameState(initState(entry.data));
    setRevealed(false);
  }

  function handleBackToStories() {
    router.push("/");
  }

  function handleCycleSpeed() {
    const next = nextTextSpeed(speed);
    setSpeed(next);
    setTextSpeed(window.localStorage, next);
  }

  function handleToggleAmbient() {
    const next = !ambientOn;
    setAmbientOn(next);
    setAmbientPref(window.localStorage, next);
    if (next) ambient().enable();
    else ambientRef.current?.disable();
  }

  if (!entry) {
    return (
      <main className="screen">
        <p className="story-text">ไม่พบเรื่องนี้</p>
        <button type="button" className="choice-btn" onClick={() => router.push("/")}>
          กลับหน้าเลือกเรื่อง
        </button>
      </main>
    );
  }

  if (!gameState || !currentNode) {
    return <main className="screen" />;
  }

  const ending = isEndingNode(currentNode);
  const choices = availableChoices(currentNode, gameState.flags);

  const ambientButton = (
    <button type="button" className="text-btn" onClick={handleToggleAmbient} aria-pressed={ambientOn}>
      {ambientOn ? "🔊 เสียงบรรยากาศ: เปิด" : "🔇 เสียงบรรยากาศ: ปิด"}
    </button>
  );

  return (
    <main className="screen">
      <div key={veilKey} className="scene-veil" aria-hidden="true" />
      <div className="topbar">
        <p className="game-title">{entry.title}</p>
        {!ending && <MeterDisplay meter={entry.data.meter} value={gameState.meter} />}
      </div>

      {ending ? (
        <EndingScreen
          endingId={currentNode.endingId ?? ""}
          endingText={currentNode.text}
          endings={entry.endings}
          foundEndings={foundEndings}
          onRestart={handleRestart}
          onBackToStories={handleBackToStories}
        />
      ) : (
        <>
          {currentNode.chapter && <ChapterBar chapter={currentNode.chapter} />}
          <div className="story-panel">
            <Typewriter
              key={currentNode.id}
              text={currentNode.text}
              speed={speed}
              onDone={() => setRevealed(true)}
            />
            {revealed && <ChoiceList choices={choices} onChoose={handleChoose} />}
          </div>
          <div className="footer-row">
            <button type="button" className="text-btn" onClick={handleCycleSpeed}>
              ⚙ ความเร็วตัวอักษร: {TEXT_SPEED_LABELS[speed]}
            </button>
            {ambientButton}
            <button type="button" className="text-btn" onClick={handleBackToStories}>
              เลือกเรื่อง
            </button>
            <button type="button" className="text-btn" onClick={handleRestart}>
              เริ่มใหม่
            </button>
          </div>
        </>
      )}
    </main>
  );
}
