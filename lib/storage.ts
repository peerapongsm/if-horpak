// localStorage persistence: autosave of the current run + the set of endings ever found.

import type { GameState } from "./engine";

const SAVE_KEY = "if-horpak:save";
const ENDINGS_KEY = "if-horpak:endings-found";

export function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
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

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function loadFoundEndings(): string[] {
  try {
    const raw = localStorage.getItem(ENDINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function addFoundEnding(endingId: string): string[] {
  const existing = loadFoundEndings();
  if (existing.includes(endingId)) return existing;
  const next = [...existing, endingId];
  localStorage.setItem(ENDINGS_KEY, JSON.stringify(next));
  return next;
}
