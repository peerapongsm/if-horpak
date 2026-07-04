import { describe, it, expect, beforeEach } from "vitest";
import { loadSave, saveGame, clearSave, loadFoundEndings, addFoundEnding } from "./storage";
import type { GameState } from "./engine";

beforeEach(() => localStorage.clear());

describe("save / load", () => {
  it("returns null when nothing saved", () => {
    expect(loadSave("horpak")).toBeNull();
  });
  it("round-trips a saved game state", () => {
    const state: GameState = { currentNode: "night_hub", flags: { talked: true }, meter: 2 };
    saveGame("horpak", state);
    expect(loadSave("horpak")).toEqual(state);
  });
  it("returns null for corrupted JSON", () => {
    localStorage.setItem("if:horpak:save", "{not json");
    expect(loadSave("horpak")).toBeNull();
  });
  it("returns null for shape-invalid value (missing meter)", () => {
    localStorage.setItem("if:horpak:save", JSON.stringify({ currentNode: "x", flags: {} }));
    expect(loadSave("horpak")).toBeNull();
  });
  it("clearSave removes the save", () => {
    saveGame("horpak", { currentNode: "start", flags: {}, meter: 3 });
    clearSave("horpak");
    expect(loadSave("horpak")).toBeNull();
  });
  it("namespaces stories so saves never collide", () => {
    saveGame("horpak", { currentNode: "night_hub", flags: {}, meter: 2 });
    saveGame("faen-plom", { currentNode: "day3", flags: {}, meter: 4 });
    expect(loadSave("horpak")!.currentNode).toBe("night_hub");
    expect(loadSave("faen-plom")!.currentNode).toBe("day3");
    clearSave("faen-plom");
    expect(loadSave("faen-plom")).toBeNull();
    expect(loadSave("horpak")).not.toBeNull();
  });
});

describe("found endings", () => {
  it("starts empty", () => expect(loadFoundEndings("horpak")).toEqual([]));
  it("adds and persists", () => {
    expect(addFoundEnding("horpak", "flee")).toEqual(["flee"]);
    expect(loadFoundEndings("horpak")).toEqual(["flee"]);
  });
  it("does not duplicate", () => {
    addFoundEnding("horpak", "flee");
    expect(addFoundEnding("horpak", "flee")).toEqual(["flee"]);
  });
  it("keeps collections separate per story", () => {
    addFoundEnding("horpak", "flee");
    addFoundEnding("faen-plom", "real");
    expect(loadFoundEndings("horpak")).toEqual(["flee"]);
    expect(loadFoundEndings("faen-plom")).toEqual(["real"]);
  });
});
