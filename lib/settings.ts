// Reader settings: typewriter text speed, persisted in localStorage.
// Storage is injected for testability (same idiom as storage.ts callers).

export type TextSpeed = "slow" | "normal" | "fast" | "instant";

export const TEXT_SPEEDS: TextSpeed[] = ["slow", "normal", "fast", "instant"];

export const TEXT_SPEED_LABELS: Record<TextSpeed, string> = {
  slow: "ช้า",
  normal: "ปกติ",
  fast: "เร็ว",
  instant: "ทันที",
};

// Multiplier on every typewriter delay. Player feedback said the original
// cadence (16ms/char) was too fast to read along, so "normal" is now slower
// than the original and "fast" is roughly the original speed.
export const TEXT_SPEED_MULTIPLIERS: Record<TextSpeed, number> = {
  slow: 2.8,
  normal: 1.6,
  fast: 0.75,
  instant: 0,
};

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const SPEED_KEY = "if-horpak:text-speed:v1";

export function getTextSpeed(storage: StorageLike): TextSpeed {
  const raw = storage.getItem(SPEED_KEY);
  return TEXT_SPEEDS.includes(raw as TextSpeed) ? (raw as TextSpeed) : "normal";
}

export function setTextSpeed(storage: StorageLike, speed: TextSpeed): void {
  storage.setItem(SPEED_KEY, speed);
}

/** The next speed in the cycle, for a single tap-to-cycle button. */
export function nextTextSpeed(speed: TextSpeed): TextSpeed {
  const index = TEXT_SPEEDS.indexOf(speed);
  return TEXT_SPEEDS[(index + 1) % TEXT_SPEEDS.length];
}
