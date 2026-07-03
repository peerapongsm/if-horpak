import { describe, it, expect } from "vitest";
import {
  getTextSpeed,
  setTextSpeed,
  nextTextSpeed,
  TEXT_SPEEDS,
  TEXT_SPEED_MULTIPLIERS,
  type StorageLike,
} from "./settings";

function fakeStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe("text speed preference", () => {
  it("defaults to normal", () => {
    expect(getTextSpeed(fakeStorage())).toBe("normal");
  });

  it("round-trips a chosen speed", () => {
    const storage = fakeStorage();
    setTextSpeed(storage, "slow");
    expect(getTextSpeed(storage)).toBe("slow");
  });

  it("falls back to normal for a garbage stored value", () => {
    const storage = fakeStorage();
    storage.setItem("if-horpak:text-speed:v1", "warp10");
    expect(getTextSpeed(storage)).toBe("normal");
  });
});

describe("nextTextSpeed", () => {
  it("cycles through every speed and wraps around", () => {
    let speed = TEXT_SPEEDS[0];
    const seen = [speed];
    for (let i = 0; i < TEXT_SPEEDS.length - 1; i++) {
      speed = nextTextSpeed(speed);
      seen.push(speed);
    }
    expect(seen).toEqual(TEXT_SPEEDS);
    expect(nextTextSpeed(speed)).toBe(TEXT_SPEEDS[0]);
  });
});

describe("speed multipliers", () => {
  it("slow > normal > fast, and instant is zero", () => {
    expect(TEXT_SPEED_MULTIPLIERS.slow).toBeGreaterThan(TEXT_SPEED_MULTIPLIERS.normal);
    expect(TEXT_SPEED_MULTIPLIERS.normal).toBeGreaterThan(TEXT_SPEED_MULTIPLIERS.fast);
    expect(TEXT_SPEED_MULTIPLIERS.instant).toBe(0);
  });

  it("normal is slower than the pre-feedback original (multiplier > 1)", () => {
    expect(TEXT_SPEED_MULTIPLIERS.normal).toBeGreaterThan(1);
  });
});
