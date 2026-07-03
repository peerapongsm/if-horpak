// Engine: pure state machine for the "หนึ่งคืนที่หอพัก" interactive fiction.
// No I/O, no DOM — just node transitions, flag requires/sets, and the sanity mechanic.

export type Flags = Record<string, boolean>;

export interface Choice {
  label: string;
  goto: string;
  /** Flags that must equal the given boolean for this choice to be offered. */
  requires?: Record<string, boolean>;
  /** Flags to set (true/false) when this choice is taken. */
  sets?: Record<string, boolean>;
  /** Change to sanity (-3..+3 typical) when this choice is taken. */
  sanityDelta?: number;
}

export interface StoryNode {
  id: string;
  text: string;
  /** True only for terminal nodes. */
  isEnding?: boolean;
  /** One of the 5 canonical ending ids; only set on ending nodes. */
  endingId?: string;
  choices?: Choice[];
}

export interface StoryData {
  start: string;
  /** Node the player is forced into when sanity reaches 0. Must be an ending node. */
  deathBySanityNodeId: string;
  nodes: StoryNode[];
}

export interface GameState {
  currentNode: string;
  flags: Flags;
  sanity: number;
}

export const MAX_SANITY = 3;
export const MIN_SANITY = 0;

function clampSanity(value: number): number {
  return Math.max(MIN_SANITY, Math.min(MAX_SANITY, value));
}

export function buildNodeIndex(story: StoryData): Map<string, StoryNode> {
  return new Map(story.nodes.map((n) => [n.id, n]));
}

export function getNode(story: StoryData, nodeId: string): StoryNode {
  const node = story.nodes.find((n) => n.id === nodeId);
  if (!node) throw new Error(`Unknown node: ${nodeId}`);
  return node;
}

export function initState(story: StoryData): GameState {
  return { currentNode: story.start, flags: {}, sanity: MAX_SANITY };
}

/** A choice is offered only if every required flag matches the current state. */
export function isChoiceAvailable(choice: Choice, flags: Flags): boolean {
  if (!choice.requires) return true;
  return Object.entries(choice.requires).every(([flag, expected]) => Boolean(flags[flag]) === expected);
}

export function availableChoices(node: StoryNode, flags: Flags): Choice[] {
  return (node.choices ?? []).filter((c) => isChoiceAvailable(c, flags));
}

export interface ApplyChoiceResult {
  state: GameState;
  /** True if sanity hit 0 and the destination was overridden to the death ending. */
  forcedDeath: boolean;
}

/**
 * Apply a choice taken from the node the state currently points at.
 * Throws if the choice isn't actually available (requires not met).
 */
export function applyChoice(story: StoryData, state: GameState, choice: Choice): ApplyChoiceResult {
  if (!isChoiceAvailable(choice, state.flags)) {
    throw new Error(`Choice "${choice.label}" is not available in current state`);
  }

  const nextFlags: Flags = { ...state.flags, ...(choice.sets ?? {}) };
  const nextSanity = clampSanity(state.sanity + (choice.sanityDelta ?? 0));

  let nextNode = choice.goto;
  let forcedDeath = false;
  if (nextSanity <= MIN_SANITY && nextNode !== story.deathBySanityNodeId) {
    nextNode = story.deathBySanityNodeId;
    forcedDeath = true;
  }

  return {
    state: { currentNode: nextNode, flags: nextFlags, sanity: nextSanity },
    forcedDeath,
  };
}

export function isEndingNode(node: StoryNode): boolean {
  return Boolean(node.isEnding);
}
