import { describe, it, expect } from "vitest";
import {
  initState, applyChoice, isChoiceAvailable, availableChoices,
  getNode, isEndingNode, type StoryData,
} from "./engine";

const story: StoryData = {
  schemaVersion: 1,
  start: "a",
  meter: { label: "สติ", max: 3, floor: 0, floorNodeId: "end_death", viz: "candles" },
  nodes: [
    { id: "a", text: "node a", choices: [
      { label: "go to b", goto: "b", sets: { has_key: true } },
      { label: "go to c, scary", goto: "c", meterDelta: -2 },
      { label: "locked choice", goto: "d", requires: { has_key: true } },
    ]},
    { id: "b", text: "node b", choices: [{ label: "go to d needs key", goto: "d", requires: { has_key: true } }] },
    { id: "c", text: "node c", choices: [{ label: "go to end, scary", goto: "end_survive", meterDelta: -2 }] },
    { id: "d", text: "node d, ending", isEnding: true, endingId: "true_ending" },
    { id: "end_survive", text: "survived", isEnding: true, endingId: "survive" },
    { id: "end_death", text: "you died", isEnding: true, endingId: "death" },
  ],
};

describe("initState", () => {
  it("starts at start node with meter at max (default) and no flags", () => {
    const s = initState(story);
    expect(s.currentNode).toBe("a");
    expect(s.meter).toBe(3);
    expect(s.flags).toEqual({});
  });
  it("honors meter.start when set below max", () => {
    const romance: StoryData = { ...story, meter: { ...story.meter, max: 5, start: 2 } };
    expect(initState(romance).meter).toBe(2);
  });
});

describe("availableChoices", () => {
  it("hides choices whose requires aren't met", () => {
    const s = initState(story);
    expect(availableChoices(getNode(story, "a"), s.flags).map((c) => c.label))
      .toEqual(["go to b", "go to c, scary"]);
  });
  it("supports requiring a flag explicitly false", () => {
    const choice = { label: "x", goto: "y", requires: { seen: false } };
    expect(isChoiceAvailable(choice, { seen: false })).toBe(true);
    expect(isChoiceAvailable(choice, { seen: true })).toBe(false);
  });
});

describe("applyChoice: goto/sets", () => {
  it("moves to goto and merges sets", () => {
    const { state } = applyChoice(story, initState(story), getNode(story, "a").choices![0]);
    expect(state.currentNode).toBe("b");
    expect(state.flags).toEqual({ has_key: true });
  });
  it("throws if requires unmet", () => {
    expect(() => applyChoice(story, initState(story), getNode(story, "a").choices![2])).toThrow();
  });
});

describe("applyChoice: meter", () => {
  it("clamps meter to floor..max", () => {
    const { state: c } = applyChoice(story, initState(story), getNode(story, "a").choices![1]);
    expect(c.meter).toBe(1);
  });
  it("forces floorNodeId when meter hits floor, overriding goto", () => {
    const { state: c } = applyChoice(story, initState(story), getNode(story, "a").choices![1]); // meter 1
    const r = applyChoice(story, c, getNode(story, "c").choices![0]); // would be -1
    expect(r.forcedFloor).toBe(true);
    expect(r.state.currentNode).toBe("end_death");
    expect(r.state.meter).toBe(0);
  });
  it("does not flag forcedFloor when goto already is the floor node", () => {
    const r = applyChoice(story, initState(story), { label: "give up", goto: "end_death", meterDelta: -3 });
    expect(r.forcedFloor).toBe(false);
    expect(r.state.currentNode).toBe("end_death");
  });
  it("does not exceed max", () => {
    const r = applyChoice(story, initState(story), { label: "heal", goto: "a", meterDelta: 5 });
    expect(r.state.meter).toBe(3);
  });
});

describe("isEndingNode", () => {
  it("identifies ending nodes", () => {
    expect(isEndingNode(getNode(story, "d"))).toBe(true);
    expect(isEndingNode(getNode(story, "a"))).toBe(false);
  });
});
