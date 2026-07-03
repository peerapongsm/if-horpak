"use client";

import { useEffect, useState } from "react";
import storyJson from "@/data/story.json";
import {
  applyChoice,
  availableChoices,
  getNode,
  initState,
  isEndingNode,
  type Choice,
  type GameState,
  type StoryData,
} from "@/lib/engine";
import { addFoundEnding, clearSave, loadFoundEndings, loadSave, saveGame } from "@/lib/storage";
import Typewriter from "@/components/Typewriter";
import ChoiceList from "@/components/ChoiceList";
import SanityCandles from "@/components/SanityCandles";
import EndingScreen from "@/components/EndingScreen";

const story = storyJson as unknown as StoryData;

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [foundEndings, setFoundEndings] = useState<string[]>([]);
  const [veilKey, setVeilKey] = useState(0);

  // Hydrate from localStorage after mount (client-only).
  useEffect(() => {
    setGameState(loadSave() ?? initState(story));
    setFoundEndings(loadFoundEndings());
  }, []);

  // Autosave on every node change.
  useEffect(() => {
    if (gameState) saveGame(gameState);
  }, [gameState]);

  const currentNode = gameState ? getNode(story, gameState.currentNode) : null;

  // Record newly-reached endings.
  useEffect(() => {
    if (currentNode && isEndingNode(currentNode) && currentNode.endingId) {
      setFoundEndings(addFoundEnding(currentNode.endingId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNode?.id]);

  // Brief darkness-swallow veil on every scene change.
  useEffect(() => {
    setVeilKey((k) => k + 1);
  }, [currentNode?.id]);

  if (!gameState || !currentNode) {
    return (
      <main className="screen">
        <div className="story-panel">
          <p className="story-text">กำลังเปิดประตู...</p>
        </div>
      </main>
    );
  }

  function handleChoose(choice: Choice) {
    if (!gameState) return;
    const { state: next } = applyChoice(story, gameState, choice);
    setGameState(next);
    setRevealed(false);
  }

  function handleRestart() {
    const confirmed = window.confirm("ยืนยันเริ่มเรื่องใหม่? ความคืบหน้าตอนนี้จะหายไป");
    if (!confirmed) return;
    clearSave();
    setGameState(initState(story));
    setRevealed(false);
  }

  const ending = isEndingNode(currentNode);
  const choices = gameState ? availableChoices(currentNode, gameState.flags) : [];

  return (
    <main className="screen">
      <div key={veilKey} className="scene-veil" aria-hidden="true" />
      <div className="topbar">
        <p className="game-title">หนึ่งคืนที่หอพัก</p>
        {!ending && <SanityCandles sanity={gameState.sanity} />}
      </div>

      {ending ? (
        <EndingScreen
          endingId={currentNode.endingId ?? ""}
          endingText={currentNode.text}
          foundEndings={foundEndings}
          onRestart={handleRestart}
        />
      ) : (
        <>
          <div className="story-panel">
            <Typewriter key={currentNode.id} text={currentNode.text} onDone={() => setRevealed(true)} />
            {revealed && <ChoiceList choices={choices} onChoose={handleChoose} />}
          </div>
          <div className="footer-row">
            <button type="button" className="text-btn" onClick={handleRestart}>
              เริ่มใหม่
            </button>
          </div>
        </>
      )}
    </main>
  );
}
