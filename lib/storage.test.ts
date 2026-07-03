import { describe, it, expect, beforeEach } from "vitest";
import { loadSave, saveGame, clearSave, loadFoundEndings, addFoundEnding } from "./storage";
import type { GameState } from "./engine";

beforeEach(() => {
  localStorage.clear();
});

describe("save / load", () => {
  it("returns null when nothing saved", () => {
    expect(loadSave()).toBeNull();
  });

  it("round-trips a saved game state", () => {
    const state: GameState = { currentNode: "night_hub", flags: { talked_aunty: true }, sanity: 2 };
    saveGame(state);
    expect(loadSave()).toEqual(state);
  });

  it("returns null for corrupted JSON instead of throwing", () => {
    localStorage.setItem("if-horpak:save", "{not json");
    expect(loadSave()).toBeNull();
  });

  it("returns null for a validly-parsed but shape-invalid value", () => {
    localStorage.setItem("if-horpak:save", JSON.stringify({ foo: "bar" }));
    expect(loadSave()).toBeNull();
  });

  it("clearSave removes the save", () => {
    saveGame({ currentNode: "start", flags: {}, sanity: 3 });
    clearSave();
    expect(loadSave()).toBeNull();
  });
});

describe("found endings", () => {
  it("starts empty", () => {
    expect(loadFoundEndings()).toEqual([]);
  });

  it("adds an ending and persists it", () => {
    const result = addFoundEnding("flee");
    expect(result).toEqual(["flee"]);
    expect(loadFoundEndings()).toEqual(["flee"]);
  });

  it("does not duplicate an already-found ending", () => {
    addFoundEnding("flee");
    const result = addFoundEnding("flee");
    expect(result).toEqual(["flee"]);
  });

  it("accumulates multiple distinct endings", () => {
    addFoundEnding("flee");
    addFoundEnding("death");
    expect(loadFoundEndings().sort()).toEqual(["death", "flee"]);
  });
});
