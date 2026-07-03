import { describe, it, expect } from "vitest";
import {
  initState,
  applyChoice,
  isChoiceAvailable,
  availableChoices,
  getNode,
  isEndingNode,
  type StoryData,
} from "./engine";

const story: StoryData = {
  start: "a",
  deathBySanityNodeId: "end_death",
  nodes: [
    {
      id: "a",
      text: "node a",
      choices: [
        { label: "go to b", goto: "b", sets: { has_key: true } },
        { label: "go to c, scary", goto: "c", sanityDelta: -2 },
        { label: "locked choice", goto: "d", requires: { has_key: true } },
      ],
    },
    {
      id: "b",
      text: "node b",
      choices: [{ label: "go to d needs key", goto: "d", requires: { has_key: true } }],
    },
    {
      id: "c",
      text: "node c",
      choices: [{ label: "go to end, scary", goto: "end_survive", sanityDelta: -2 }],
    },
    { id: "d", text: "node d, ending", isEnding: true, endingId: "true_ending" },
    { id: "end_survive", text: "survived", isEnding: true, endingId: "survive" },
    { id: "end_death", text: "you died", isEnding: true, endingId: "death" },
  ],
};

describe("initState", () => {
  it("starts at the story's start node with full sanity and no flags", () => {
    const state = initState(story);
    expect(state.currentNode).toBe("a");
    expect(state.sanity).toBe(3);
    expect(state.flags).toEqual({});
  });
});

describe("isChoiceAvailable / availableChoices", () => {
  it("hides choices whose requires aren't met yet", () => {
    const state = initState(story);
    const node = getNode(story, "a");
    const choices = availableChoices(node, state.flags);
    expect(choices.map((c) => c.label)).toEqual(["go to b", "go to c, scary"]);
    expect(isChoiceAvailable(node.choices![2], state.flags)).toBe(false);
  });

  it("reveals choices once the required flag is set", () => {
    const state = initState(story);
    const { state: afterB } = applyChoice(story, state, getNode(story, "a").choices![0]);
    expect(afterB.flags.has_key).toBe(true);
    const nodeB = getNode(story, "b");
    expect(availableChoices(nodeB, afterB.flags).map((c) => c.label)).toEqual(["go to d needs key"]);
  });

  it("supports requiring a flag to be explicitly false", () => {
    const flags = { seen_ghost: false };
    const choice = { label: "x", goto: "y", requires: { seen_ghost: false } };
    expect(isChoiceAvailable(choice, flags)).toBe(true);
    expect(isChoiceAvailable(choice, { seen_ghost: true })).toBe(false);
  });
});

describe("applyChoice: goto/sets", () => {
  it("moves to the goto node and merges sets into flags", () => {
    const state = initState(story);
    const { state: next } = applyChoice(story, state, getNode(story, "a").choices![0]);
    expect(next.currentNode).toBe("b");
    expect(next.flags).toEqual({ has_key: true });
  });

  it("throws if the choice's requires are not met", () => {
    const state = initState(story);
    const lockedChoice = getNode(story, "a").choices![2];
    expect(() => applyChoice(story, state, lockedChoice)).toThrow();
  });
});

describe("applyChoice: sanity", () => {
  it("clamps sanity to the 0..3 range", () => {
    const state = initState(story);
    const { state: afterC } = applyChoice(story, state, getNode(story, "a").choices![1]);
    expect(afterC.sanity).toBe(1);
    const { state: afterEnd } = applyChoice(story, afterC, getNode(story, "c").choices![0]);
    // sanity would go to -1, clamps to 0, and forces death
    expect(afterEnd.sanity).toBe(0);
  });

  it("forces the death-by-sanity ending when sanity hits 0, overriding goto", () => {
    const state = initState(story);
    const { state: afterC } = applyChoice(story, state, getNode(story, "a").choices![1]); // sanity 1
    const result = applyChoice(story, afterC, getNode(story, "c").choices![0]); // sanity would be -1
    expect(result.forcedDeath).toBe(true);
    expect(result.state.currentNode).toBe("end_death");
    expect(result.state.sanity).toBe(0);
  });

  it("does not flag forcedDeath when goto already is the death node", () => {
    const deathChoice = { label: "give up", goto: "end_death", sanityDelta: -3 };
    const result = applyChoice(story, initState(story), deathChoice);
    expect(result.forcedDeath).toBe(false);
    expect(result.state.currentNode).toBe("end_death");
  });

  it("does not exceed max sanity of 3", () => {
    const healChoice = { label: "rest", goto: "a", sanityDelta: 5 };
    const result = applyChoice(story, initState(story), healChoice);
    expect(result.state.sanity).toBe(3);
  });
});

describe("isEndingNode", () => {
  it("identifies ending nodes", () => {
    expect(isEndingNode(getNode(story, "d"))).toBe(true);
    expect(isEndingNode(getNode(story, "a"))).toBe(false);
  });
});
