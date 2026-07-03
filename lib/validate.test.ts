import { describe, it, expect } from "vitest";
import { validateStory, isStoryValid } from "./validate";
import type { StoryData } from "./engine";
import storyJson from "../data/story.json";

function baseValidStory(): StoryData {
  return {
    start: "a",
    deathBySanityNodeId: "end_death",
    nodes: [
      { id: "a", text: "a", choices: [{ label: "go b", goto: "b", sets: { flag_x: true } }] },
      { id: "b", text: "b", choices: [{ label: "go end", goto: "end_flee", requires: { flag_x: true } }] },
      { id: "end_death", text: "died", isEnding: true, endingId: "death" },
      { id: "end_flee", text: "fled", isEnding: true, endingId: "flee" },
      { id: "end_survive_unaware", text: "survived", isEnding: true, endingId: "survive_unaware" },
      { id: "end_true", text: "truth", isEnding: true, endingId: "true_ending" },
      { id: "end_twist", text: "twist", isEnding: true, endingId: "ghost_twist" },
    ],
  };
}

describe("validateStory: happy path", () => {
  it("returns no issues for a well-formed story missing only some endings' reachability wiring", () => {
    // baseValidStory doesn't wire every ending as reachable via goto edges except end_death
    // (seeded automatically) and end_flee; the rest are unreachable on purpose for the next test.
    const story = baseValidStory();
    const issues = validateStory(story);
    const unreachableEndingIssues = issues.filter((i) => i.rule === "ending-unreachable");
    expect(unreachableEndingIssues.length).toBeGreaterThan(0);
  });

  it("is fully valid once every ending is wired reachable and every node has an outgoing path", () => {
    const story = baseValidStory();
    story.nodes.find((n) => n.id === "b")!.choices!.push(
      { label: "go survive", goto: "end_survive_unaware" },
      { label: "go true", goto: "end_true" },
      { label: "go twist", goto: "end_twist" },
    );
    expect(isStoryValid(story)).toBe(true);
    expect(validateStory(story)).toEqual([]);
  });
});

describe("validateStory: unreachable-node", () => {
  it("flags a node with no incoming edges", () => {
    const story = baseValidStory();
    story.nodes.push({ id: "orphan", text: "orphan", isEnding: true, endingId: "flee" });
    const issues = validateStory(story);
    expect(issues.some((i) => i.rule === "unreachable-node" && i.message.includes("orphan"))).toBe(true);
  });
});

describe("validateStory: non-ending-dead-end", () => {
  it("flags a non-ending node with zero choices", () => {
    const story = baseValidStory();
    story.nodes.find((n) => n.id === "b")!.choices = [];
    const issues = validateStory(story);
    expect(issues.some((i) => i.rule === "non-ending-dead-end" && i.message.includes('"b"'))).toBe(true);
  });
});

describe("validateStory: ending-unreachable", () => {
  it("flags a canonical ending id that no reachable node uses", () => {
    const story = baseValidStory();
    const issues = validateStory(story);
    expect(issues.some((i) => i.rule === "ending-unreachable" && i.message.includes("ghost_twist"))).toBe(true);
  });
});

describe("validateStory: unknown-goto-target", () => {
  it("flags a choice pointing at a nonexistent node", () => {
    const story = baseValidStory();
    story.nodes.find((n) => n.id === "a")!.choices!.push({ label: "bad", goto: "nope" });
    const issues = validateStory(story);
    expect(issues.some((i) => i.rule === "unknown-goto-target" && i.message.includes("nope"))).toBe(true);
  });
});

describe("validateStory: unsettable-required-flag", () => {
  it("flags a requires flag that no choice ever sets", () => {
    const story = baseValidStory();
    story.nodes.find((n) => n.id === "a")!.choices!.push({
      label: "locked",
      goto: "end_flee",
      requires: { never_set_flag: true },
    });
    const issues = validateStory(story);
    expect(
      issues.some((i) => i.rule === "unsettable-required-flag" && i.message.includes("never_set_flag")),
    ).toBe(true);
  });
});

describe("validateStory: duplicate-node-id", () => {
  it("flags two nodes sharing an id", () => {
    const story = baseValidStory();
    story.nodes.push({ id: "a", text: "dup", isEnding: true, endingId: "death" });
    const issues = validateStory(story);
    expect(issues.some((i) => i.rule === "duplicate-node-id")).toBe(true);
  });
});

describe("validateStory: missing-start-node", () => {
  it("flags a start id that doesn't exist", () => {
    const story = baseValidStory();
    story.start = "nowhere";
    const issues = validateStory(story);
    expect(issues.some((i) => i.rule === "missing-start-node")).toBe(true);
  });
});

describe("real story.json", () => {
  it("passes the full validator with zero issues", () => {
    const story = storyJson as unknown as StoryData;
    const issues = validateStory(story);
    if (issues.length > 0) {
      // Surface every issue in the failure message for fast debugging.
      throw new Error(issues.map((i) => `[${i.rule}] ${i.message}`).join("\n"));
    }
    expect(issues).toEqual([]);
  });

  it("has 35-50 nodes per spec", () => {
    const story = storyJson as unknown as StoryData;
    expect(story.nodes.length).toBeGreaterThanOrEqual(35);
    expect(story.nodes.length).toBeLessThanOrEqual(50);
  });

  it("has exactly the 5 canonical endings, each on exactly one node", () => {
    const story = storyJson as unknown as StoryData;
    const endingIds = story.nodes.filter((n) => n.isEnding).map((n) => n.endingId);
    const canonical = ["death", "flee", "survive_unaware", "true_ending", "ghost_twist"];
    for (const id of canonical) {
      expect(endingIds.filter((e) => e === id).length).toBe(1);
    }
    expect(endingIds.length).toBe(canonical.length);
  });
});
