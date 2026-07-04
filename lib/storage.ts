import type { GameState } from "./engine";

const saveKey = (slug: string) => `if:${slug}:save`;
const endingsKey = (slug: string) => `if:${slug}:endings-found`;

export function loadSave(slug: string): GameState | null {
  try {
    const raw = localStorage.getItem(saveKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const hasSingle = typeof parsed.meter === "number";
    const hasMulti = typeof parsed.meters === "object" && parsed.meters !== null;
    if (
      typeof parsed !== "object" || parsed === null ||
      typeof parsed.currentNode !== "string" ||
      (!hasSingle && !hasMulti) ||
      typeof parsed.flags !== "object" || parsed.flags === null
    ) return null;
    return parsed as GameState;
  } catch {
    return null;
  }
}

export function saveGame(slug: string, state: GameState): void {
  localStorage.setItem(saveKey(slug), JSON.stringify(state));
}

export function clearSave(slug: string): void {
  localStorage.removeItem(saveKey(slug));
}

export function loadFoundEndings(slug: string): string[] {
  try {
    const raw = localStorage.getItem(endingsKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function addFoundEnding(slug: string, endingId: string): string[] {
  const existing = loadFoundEndings(slug);
  if (existing.includes(endingId)) return existing;
  const next = [...existing, endingId];
  localStorage.setItem(endingsKey(slug), JSON.stringify(next));
  return next;
}
