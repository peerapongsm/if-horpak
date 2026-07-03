import { describe, it, expect, beforeEach } from "vitest";
import { loadSave, saveGame, clearSave, loadFoundEndings, addFoundEnding } from "./storage";
import type { GameState } from "./engine";

beforeEach(() => {
  localStorage.clear();
});

describe("save / load", () => {
  it("returns null when nothing saved", () => {
    expect(loadSave("horpak")).toBeNull();
  });

  it("round-trips a saved game state", () => {
    const state: GameState = { currentNode: "night_hub", flags: { talked_aunty: true }, sanity: 2 };
    saveGame("horpak", state);
    expect(loadSave("horpak")).toEqual(state);
  });

  it("returns null for corrupted JSON instead of throwing", () => {
    localStorage.setItem("if-horpak:save", "{not json");
    expect(loadSave("horpak")).toBeNull();
  });

  it("returns null for a validly-parsed but shape-invalid value", () => {
    localStorage.setItem("if-horpak:save", JSON.stringify({ foo: "bar" }));
    expect(loadSave("horpak")).toBeNull();
  });

  it("clearSave removes the save", () => {
    saveGame("horpak", { currentNode: "start", flags: {}, sanity: 3 });
    clearSave("horpak");
    expect(loadSave("horpak")).toBeNull();
  });

  it("keeps the pre-multi-story key for horpak so old saves still load", () => {
    localStorage.setItem(
      "if-horpak:save",
      JSON.stringify({ currentNode: "start", flags: {}, sanity: 3 }),
    );
    expect(loadSave("horpak")).not.toBeNull();
  });

  it("namespaces other stories so saves never collide", () => {
    saveGame("horpak", { currentNode: "night_hub", flags: {}, sanity: 2 });
    saveGame("bus", { currentNode: "on_board", flags: {}, sanity: 3 });
    expect(loadSave("horpak")!.currentNode).toBe("night_hub");
    expect(loadSave("bus")!.currentNode).toBe("on_board");
    clearSave("bus");
    expect(loadSave("bus")).toBeNull();
    expect(loadSave("horpak")).not.toBeNull();
  });
});

describe("found endings", () => {
  it("starts empty", () => {
    expect(loadFoundEndings("horpak")).toEqual([]);
  });

  it("adds an ending and persists it", () => {
    const result = addFoundEnding("horpak", "flee");
    expect(result).toEqual(["flee"]);
    expect(loadFoundEndings("horpak")).toEqual(["flee"]);
  });

  it("does not duplicate an already-found ending", () => {
    addFoundEnding("horpak", "flee");
    const result = addFoundEnding("horpak", "flee");
    expect(result).toEqual(["flee"]);
  });

  it("accumulates multiple distinct endings", () => {
    addFoundEnding("horpak", "flee");
    addFoundEnding("horpak", "death");
    expect(loadFoundEndings("horpak").sort()).toEqual(["death", "flee"]);
  });

  it("keeps ending collections separate per story", () => {
    addFoundEnding("horpak", "flee");
    addFoundEnding("bus", "conductor");
    expect(loadFoundEndings("horpak")).toEqual(["flee"]);
    expect(loadFoundEndings("bus")).toEqual(["conductor"]);
  });

  it("reads pre-multi-story endings under the legacy horpak key", () => {
    localStorage.setItem("if-horpak:endings-found", JSON.stringify(["death"]));
    expect(loadFoundEndings("horpak")).toEqual(["death"]);
  });
});
