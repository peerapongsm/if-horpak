import { describe, it, expect } from "vitest";
import {
  initState, applyChoice, isChoiceAvailable, availableChoices,
  getNode, isEndingNode, isMultiMeter, type StoryData,
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
    const romance: StoryData = { ...story, meter: { ...story.meter!, max: 5, start: 2 } };
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

const multiStory: StoryData = {
  schemaVersion: 1,
  start: "a",
  meters: {
    glomkleun: { label: "การกลมกลืน", max: 5, start: 3, floor: 0, floorNodeId: "end_exposed", viz: "lotus" },
    huajai: { label: "ใจคุณหลวง", max: 5, start: 1, floor: 0, floorNodeId: "end_heartbreak", viz: "hearts" },
  },
  nodes: [
    { id: "a", text: "a", choices: [
      { label: "cook well", goto: "b", meterDeltas: { glomkleun: 1, huajai: 1 } },
      { label: "slip modern", goto: "b", meterDeltas: { glomkleun: -3 } },
      { label: "cold to him", goto: "b", meterDeltas: { huajai: -1 } },
    ]},
    { id: "b", text: "b", choices: [{ label: "end", goto: "end_good" }] },
    { id: "end_good", text: "good", isEnding: true, endingId: "stay" },
    { id: "end_exposed", text: "exposed", isEnding: true, endingId: "exposed" },
    { id: "end_heartbreak", text: "heartbreak", isEnding: true, endingId: "heartbreak" },
  ],
};

describe("initState: multi-meter", () => {
  it("seeds every meter at its start (or max)", () => {
    const s = initState(multiStory);
    expect(s.meters).toEqual({ glomkleun: 3, huajai: 1 });
    expect(s.meter).toBeUndefined();
  });
});

describe("applyChoice: multi-meter", () => {
  it("applies partial meterDeltas and clamps each meter", () => {
    const { state } = applyChoice(multiStory, initState(multiStory), getNode(multiStory, "a").choices![0]);
    expect(state.meters).toEqual({ glomkleun: 4, huajai: 2 });
  });
  it("forces the meter's own floor ending when it hits floor", () => {
    const r = applyChoice(multiStory, initState(multiStory), getNode(multiStory, "a").choices![1]); // glomkleun 3-3=0
    expect(r.forcedFloor).toBe(true);
    expect(r.state.currentNode).toBe("end_exposed");
  });
  it("forces heartbreak when huajai hits floor", () => {
    const r = applyChoice(multiStory, initState(multiStory), getNode(multiStory, "a").choices![2]); // huajai 1-1=0
    expect(r.forcedFloor).toBe(true);
    expect(r.state.currentNode).toBe("end_heartbreak");
  });
  it("checks glomkleun before huajai when both would floor", () => {
    const story2: StoryData = {
      ...multiStory,
      nodes: [
        { id: "a", text: "a", choices: [{ label: "both", goto: "b", meterDeltas: { glomkleun: -5, huajai: -5 } }] },
        ...multiStory.nodes.slice(1),
      ],
    };
    const r = applyChoice(story2, initState(story2), getNode(story2, "a").choices![0]);
    expect(r.state.currentNode).toBe("end_exposed"); // glomkleun wins (insertion order)
  });
  it("isMultiMeter distinguishes the two shapes", () => {
    expect(isMultiMeter(multiStory)).toBe(true);
    expect(isMultiMeter(story)).toBe(false); // `story` = existing single-meter fixture
  });
});
