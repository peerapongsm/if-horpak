"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyChoice,
  availableChoices,
  getNode,
  initState,
  isEndingNode,
  type Choice,
  type GameState,
} from "@/lib/engine";
import { STORIES, getStoryEntry, type StoryEntry } from "@/lib/stories";
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
import SanityCandles from "@/components/SanityCandles";
import EndingScreen from "@/components/EndingScreen";
import StorySelect from "@/components/StorySelect";

declare global {
  interface Window {
    umami?: { track: (eventName: string, data?: Record<string, unknown>) => void };
  }
}

export default function Home() {
  const [activeStory, setActiveStory] = useState<StoryEntry | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [foundEndings, setFoundEndings] = useState<string[]>([]);
  const [veilKey, setVeilKey] = useState(0);
  const [speed, setSpeed] = useState<TextSpeed>("normal");
  const [ambientOn, setAmbientOn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const ambientRef = useRef<AmbientEngine | null>(null);

  const ambient = () => {
    if (!ambientRef.current) ambientRef.current = new AmbientEngine();
    return ambientRef.current;
  };

  // Hydrate settings after mount (client-only).
  useEffect(() => {
    setSpeed(getTextSpeed(window.localStorage));
    setHydrated(true);
    if (getAmbientPref(window.localStorage)) {
      setAmbientOn(true);
      const resume = () => ambient().enable();
      window.addEventListener("pointerdown", resume, { once: true });
      return () => window.removeEventListener("pointerdown", resume);
    }
  }, []);

  // Autosave on every node change.
  useEffect(() => {
    if (activeStory && gameState) saveGame(activeStory.slug, gameState);
  }, [activeStory, gameState]);

  const currentNode =
    activeStory && gameState ? getNode(activeStory.data, gameState.currentNode) : null;

  // Record newly-reached endings.
  useEffect(() => {
    if (activeStory && currentNode && isEndingNode(currentNode) && currentNode.endingId) {
      setFoundEndings(addFoundEnding(activeStory.slug, currentNode.endingId));
      if (typeof window !== "undefined" && window.umami) {
        window.umami.track("ending-reached", {
          story: activeStory.slug,
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

  function handlePickStory(slug: string) {
    const entry = getStoryEntry(slug);
    if (!entry) return;
    setActiveStory(entry);
    setGameState(loadSave(slug) ?? initState(entry.data));
    setFoundEndings(loadFoundEndings(slug));
    setRevealed(false);
  }

  function handleChoose(choice: Choice) {
    if (!activeStory || !gameState) return;
    const { state: next } = applyChoice(activeStory.data, gameState, choice);
    setGameState(next);
    setRevealed(false);
  }

  function handleRestart() {
    if (!activeStory) return;
    const confirmed = window.confirm("ยืนยันเริ่มเรื่องใหม่? ความคืบหน้าตอนนี้จะหายไป");
    if (!confirmed) return;
    clearSave(activeStory.slug);
    setGameState(initState(activeStory.data));
    setRevealed(false);
  }

  function handleBackToStories() {
    setActiveStory(null);
    setGameState(null);
    setRevealed(false);
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

  const ambientButton = (
    <button type="button" className="text-btn" onClick={handleToggleAmbient} aria-pressed={ambientOn}>
      {ambientOn ? "🔊 เสียงบรรยากาศ: เปิด" : "🔇 เสียงบรรยากาศ: ปิด"}
    </button>
  );

  // Story-select screen.
  if (!activeStory || !gameState || !currentNode) {
    const statuses = Object.fromEntries(
      STORIES.map((s) => [
        s.slug,
        hydrated
          ? { hasSave: loadSave(s.slug) !== null, foundCount: loadFoundEndings(s.slug).length }
          : { hasSave: false, foundCount: 0 },
      ]),
    );
    return (
      <main className="screen">
        <div className="topbar">
          <p className="game-title">เรื่องเล่าก่อนฟ้าสาง</p>
        </div>
        <StorySelect stories={STORIES} statuses={statuses} onPick={handlePickStory} />
        <div className="footer-row">{ambientButton}</div>
      </main>
    );
  }

  const ending = isEndingNode(currentNode);
  const choices = availableChoices(currentNode, gameState.flags);

  return (
    <main className="screen">
      <div key={veilKey} className="scene-veil" aria-hidden="true" />
      <div className="topbar">
        <p className="game-title">{activeStory.title}</p>
        {!ending && <SanityCandles sanity={gameState.sanity} />}
      </div>

      {ending ? (
        <EndingScreen
          endingId={currentNode.endingId ?? ""}
          endingText={currentNode.text}
          endings={activeStory.endings}
          foundEndings={foundEndings}
          onRestart={handleRestart}
          onBackToStories={handleBackToStories}
        />
      ) : (
        <>
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
