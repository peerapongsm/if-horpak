import { describe, it, expect } from "vitest";
import { validateStory, isStoryValid } from "./validate";
import type { StoryData } from "./engine";
import { STORIES } from "./stories";

const FIXTURE_ENDING_IDS = ["death", "flee", "survive_unaware", "true_ending", "ghost_twist"];

function baseValidStory(): StoryData {
  return {
    schemaVersion: 1,
    start: "a",
    meter: { label: "สติ", max: 3, floor: 0, floorNodeId: "end_death", viz: "candles" },
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
    const issues = validateStory(story, FIXTURE_ENDING_IDS);
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
    expect(isStoryValid(story, FIXTURE_ENDING_IDS)).toBe(true);
    expect(validateStory(story, FIXTURE_ENDING_IDS)).toEqual([]);
  });
});

describe("validateStory: unreachable-node", () => {
  it("flags a node with no incoming edges", () => {
    const story = baseValidStory();
    story.nodes.push({ id: "orphan", text: "orphan", isEnding: true, endingId: "flee" });
    const issues = validateStory(story, FIXTURE_ENDING_IDS);
    expect(issues.some((i) => i.rule === "unreachable-node" && i.message.includes("orphan"))).toBe(true);
  });
});

describe("validateStory: non-ending-dead-end", () => {
  it("flags a non-ending node with zero choices", () => {
    const story = baseValidStory();
    story.nodes.find((n) => n.id === "b")!.choices = [];
    const issues = validateStory(story, FIXTURE_ENDING_IDS);
    expect(issues.some((i) => i.rule === "non-ending-dead-end" && i.message.includes('"b"'))).toBe(true);
  });
});

describe("validateStory: ending-unreachable", () => {
  it("flags an expected ending id that no reachable node uses", () => {
    const story = baseValidStory();
    const issues = validateStory(story, FIXTURE_ENDING_IDS);
    expect(issues.some((i) => i.rule === "ending-unreachable" && i.message.includes("ghost_twist"))).toBe(true);
  });
});

describe("validateStory: unknown-goto-target", () => {
  it("flags a choice pointing at a nonexistent node", () => {
    const story = baseValidStory();
    story.nodes.find((n) => n.id === "a")!.choices!.push({ label: "bad", goto: "nope" });
    const issues = validateStory(story, FIXTURE_ENDING_IDS);
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
    const issues = validateStory(story, FIXTURE_ENDING_IDS);
    expect(
      issues.some((i) => i.rule === "unsettable-required-flag" && i.message.includes("never_set_flag")),
    ).toBe(true);
  });
});

describe("validateStory: duplicate-node-id", () => {
  it("flags two nodes sharing an id", () => {
    const story = baseValidStory();
    story.nodes.push({ id: "a", text: "dup", isEnding: true, endingId: "death" });
    const issues = validateStory(story, FIXTURE_ENDING_IDS);
    expect(issues.some((i) => i.rule === "duplicate-node-id")).toBe(true);
  });
});

describe("validateStory: missing-start-node", () => {
  it("flags a start id that doesn't exist", () => {
    const story = baseValidStory();
    story.start = "nowhere";
    const issues = validateStory(story, FIXTURE_ENDING_IDS);
    expect(issues.some((i) => i.rule === "missing-start-node")).toBe(true);
  });
});

describe("validateStory: floor-not-ending", () => {
  it("flags a floorNodeId pointing at a non-ending node", () => {
    const story = baseValidStory();
    story.meter.floorNodeId = "a"; // "a" is not an ending
    const issues = validateStory(story, FIXTURE_ENDING_IDS);
    expect(issues.some((i) => i.rule === "floor-not-ending")).toBe(true);
  });
});

function baseMultiStory(): StoryData {
  return {
    schemaVersion: 1,
    start: "a",
    meters: {
      glomkleun: { label: "การกลมกลืน", max: 5, start: 3, floor: 0, floorNodeId: "end_exposed", viz: "lotus" },
      huajai: { label: "ใจคุณหลวง", max: 5, start: 1, floor: 0, floorNodeId: "end_heartbreak", viz: "hearts" },
    },
    nodes: [
      { id: "a", text: "a", choices: [{ label: "go", goto: "end_stay", sets: { vow: true } }] },
      { id: "end_stay", text: "stay", isEnding: true, endingId: "stay" },
      { id: "end_exposed", text: "exposed", isEnding: true, endingId: "exposed" },
      { id: "end_heartbreak", text: "heartbreak", isEnding: true, endingId: "heartbreak" },
    ],
  };
}

describe("validateStory: multi-meter", () => {
  it("passes a well-formed multi-meter story (both floor endings reachable+ending)", () => {
    const story = baseMultiStory();
    expect(validateStory(story, ["stay", "exposed", "heartbreak"])).toEqual([]);
  });
  it("flags a multi-meter floorNodeId that is not an ending", () => {
    const story = baseMultiStory();
    story.meters!.glomkleun.floorNodeId = "a";
    const issues = validateStory(story, ["stay", "exposed", "heartbreak"]);
    expect(issues.some((i) => i.rule === "floor-not-ending")).toBe(true);
  });
});

describe("validateStory: chapter-out-of-range", () => {
  it("flags a chapter index greater than total", () => {
    const story = baseValidStory();
    story.nodes.find((n) => n.id === "a")!.chapter = { label: "วันที่ 9", index: 9, total: 7 };
    const issues = validateStory(story, FIXTURE_ENDING_IDS);
    expect(issues.some((i) => i.rule === "chapter-out-of-range")).toBe(true);
  });
});

// Every story shipped in the registry passes the full validator against its
// own declared ending list — this is the story-bug gate for real content.
describe.each(STORIES.map((s) => [s.slug, s] as const))("registry story: %s", (_slug, entry) => {
  const expectedIds = entry.endings.map((e) => e.id);

  it("passes the full validator with zero issues", () => {
    const issues = validateStory(entry.data, expectedIds);
    if (issues.length > 0) {
      // Surface every issue in the failure message for fast debugging.
      throw new Error(issues.map((i) => `[${i.rule}] ${i.message}`).join("\n"));
    }
    expect(issues).toEqual([]);
  });

  it("has 30-50 nodes", () => {
    expect(entry.data.nodes.length).toBeGreaterThanOrEqual(30);
    expect(entry.data.nodes.length).toBeLessThanOrEqual(50);
  });

  it("has each declared ending on exactly one node, and no extras", () => {
    const endingIds = entry.data.nodes.filter((n) => n.isEnding).map((n) => n.endingId);
    for (const id of expectedIds) {
      expect(endingIds.filter((e) => e === id).length).toBe(1);
    }
    expect(endingIds.length).toBe(expectedIds.length);
  });
});
