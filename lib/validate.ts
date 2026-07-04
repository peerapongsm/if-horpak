// Validator: static graph checks for a StoryData, independent of runtime flag state.
// Run as a test suite against the real data/story.json to catch story bugs.

import type { StoryData, StoryNode } from "./engine";

export interface ValidationIssue {
  rule:
    | "unreachable-node"
    | "non-ending-dead-end"
    | "ending-unreachable"
    | "unknown-goto-target"
    | "unsettable-required-flag"
    | "duplicate-node-id"
    | "missing-start-node"
    | "chapter-out-of-range"
    | "floor-not-ending";
  message: string;
}

function findDuplicateIds(story: StoryData): ValidationIssue[] {
  const seen = new Set<string>();
  const issues: ValidationIssue[] = [];
  for (const node of story.nodes) {
    if (seen.has(node.id)) {
      issues.push({ rule: "duplicate-node-id", message: `Duplicate node id: "${node.id}"` });
    }
    seen.add(node.id);
  }
  return issues;
}

function findUnknownGotoTargets(story: StoryData): ValidationIssue[] {
  const ids = new Set(story.nodes.map((n) => n.id));
  const issues: ValidationIssue[] = [];
  for (const node of story.nodes) {
    for (const choice of node.choices ?? []) {
      if (!ids.has(choice.goto)) {
        issues.push({
          rule: "unknown-goto-target",
          message: `Node "${node.id}" choice "${choice.label}" goes to unknown node "${choice.goto}"`,
        });
      }
    }
  }
  if (!ids.has(story.meter.floorNodeId)) {
    issues.push({
      rule: "unknown-goto-target",
      message: `meter.floorNodeId "${story.meter.floorNodeId}" is not a known node`,
    });
  }
  return issues;
}

/**
 * Graph reachability from start, following choice.goto edges only (ignores requires —
 * requires-feasibility is a separate concern from "requires reference real flags").
 * The meter floor node is always reachable in principle via the meter mechanic,
 * so it's seeded into the reachable set directly.
 */
function reachableNodeIds(story: StoryData): Set<string> {
  const ids = new Set(story.nodes.map((n) => n.id));
  const reachable = new Set<string>();
  if (!ids.has(story.start)) return reachable;

  const queue = [story.start];
  reachable.add(story.start);
  if (ids.has(story.meter.floorNodeId) && !reachable.has(story.meter.floorNodeId)) {
    reachable.add(story.meter.floorNodeId);
    queue.push(story.meter.floorNodeId);
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = story.nodes.find((n) => n.id === nodeId);
    if (!node) continue;
    for (const choice of node.choices ?? []) {
      if (!reachable.has(choice.goto) && ids.has(choice.goto)) {
        reachable.add(choice.goto);
        queue.push(choice.goto);
      }
    }
  }
  return reachable;
}

function findUnreachableNodes(story: StoryData, reachable: Set<string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const node of story.nodes) {
    if (!reachable.has(node.id)) {
      issues.push({ rule: "unreachable-node", message: `Node "${node.id}" is not reachable from start` });
    }
  }
  return issues;
}

function findNonEndingDeadEnds(story: StoryData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const node of story.nodes) {
    const hasChoices = (node.choices ?? []).length > 0;
    if (!hasChoices && !node.isEnding) {
      issues.push({
        rule: "non-ending-dead-end",
        message: `Node "${node.id}" has no choices but isn't marked as an ending`,
      });
    }
  }
  return issues;
}

function findUnreachableEndings(
  story: StoryData,
  reachable: Set<string>,
  expectedEndingIds: readonly string[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const reachableEndingIds = new Set(
    story.nodes.filter((n) => n.isEnding && reachable.has(n.id)).map((n) => n.endingId),
  );
  for (const endingId of expectedEndingIds) {
    if (!reachableEndingIds.has(endingId)) {
      issues.push({ rule: "ending-unreachable", message: `Ending "${endingId}" is not reachable from start` });
    }
  }
  return issues;
}

/** Every flag referenced in a `requires` must be set somewhere by some choice's `sets`. */
function findUnsettableRequiredFlags(story: StoryData): ValidationIssue[] {
  const settableFlags = new Set<string>();
  for (const node of story.nodes) {
    for (const choice of node.choices ?? []) {
      for (const flag of Object.keys(choice.sets ?? {})) settableFlags.add(flag);
    }
  }

  const issues: ValidationIssue[] = [];
  const reported = new Set<string>();
  for (const node of story.nodes) {
    for (const choice of node.choices ?? []) {
      for (const flag of Object.keys(choice.requires ?? {})) {
        if (!settableFlags.has(flag) && !reported.has(flag)) {
          reported.add(flag);
          issues.push({
            rule: "unsettable-required-flag",
            message: `Flag "${flag}" is required somewhere but never set by any choice`,
          });
        }
      }
    }
  }
  return issues;
}

function findFloorNotEnding(story: StoryData): ValidationIssue[] {
  const node = story.nodes.find((n) => n.id === story.meter.floorNodeId);
  if (node && !node.isEnding) {
    return [{ rule: "floor-not-ending",
      message: `meter.floorNodeId "${story.meter.floorNodeId}" is not an ending node` }];
  }
  return [];
}

function findChapterOutOfRange(story: StoryData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const node of story.nodes) {
    const c = node.chapter;
    if (!c) continue;
    if (c.index < 1 || c.index > c.total || c.total < 1) {
      issues.push({ rule: "chapter-out-of-range",
        message: `Node "${node.id}" chapter index ${c.index}/${c.total} is out of range` });
    }
  }
  return issues;
}

export function validateStory(story: StoryData, expectedEndingIds: readonly string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!story.nodes.some((n) => n.id === story.start)) {
    issues.push({ rule: "missing-start-node", message: `start node "${story.start}" does not exist` });
    return issues; // further checks assume start exists
  }

  issues.push(...findDuplicateIds(story));
  issues.push(...findUnknownGotoTargets(story));

  const reachable = reachableNodeIds(story);
  issues.push(...findUnreachableNodes(story, reachable));
  issues.push(...findNonEndingDeadEnds(story));
  issues.push(...findUnreachableEndings(story, reachable, expectedEndingIds));
  issues.push(...findUnsettableRequiredFlags(story));
  issues.push(...findFloorNotEnding(story));
  issues.push(...findChapterOutOfRange(story));

  return issues;
}

export function isStoryValid(story: StoryData, expectedEndingIds: readonly string[]): boolean {
  return validateStory(story, expectedEndingIds).length === 0;
}

export type { StoryData, StoryNode };
