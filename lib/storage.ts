// localStorage persistence: autosave of the current run + the set of endings
// ever found, kept per story. The original single-story keys are preserved as
// the "horpak" story's keys so pre-multi-story players lose nothing.

import type { GameState } from "./engine";

function saveKey(storySlug: string): string {
  return storySlug === "horpak" ? "if-horpak:save" : `if-horpak:${storySlug}:save`;
}

function endingsKey(storySlug: string): string {
  return storySlug === "horpak" ? "if-horpak:endings-found" : `if-horpak:${storySlug}:endings-found`;
}

export function loadSave(storySlug: string): GameState | null {
  try {
    const raw = localStorage.getItem(saveKey(storySlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.currentNode !== "string" ||
      typeof parsed.sanity !== "number" ||
      typeof parsed.flags !== "object" ||
      parsed.flags === null
    ) {
      return null;
    }
    return parsed as GameState;
  } catch {
    return null;
  }
}

export function saveGame(storySlug: string, state: GameState): void {
  localStorage.setItem(saveKey(storySlug), JSON.stringify(state));
}

export function clearSave(storySlug: string): void {
  localStorage.removeItem(saveKey(storySlug));
}

export function loadFoundEndings(storySlug: string): string[] {
  try {
    const raw = localStorage.getItem(endingsKey(storySlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function addFoundEnding(storySlug: string, endingId: string): string[] {
  const existing = loadFoundEndings(storySlug);
  if (existing.includes(endingId)) return existing;
  const next = [...existing, endingId];
  localStorage.setItem(endingsKey(storySlug), JSON.stringify(next));
  return next;
}
