// Engine: pure state machine for interactive fiction stories.
// No I/O, no DOM — just node transitions, flag requires/sets, and a named meter mechanic.

export type Flags = Record<string, boolean>;

export interface Choice {
  label: string;
  goto: string;
  requires?: Record<string, boolean>;
  sets?: Record<string, boolean>;
  /** Change to the meter (-N..+N) when this choice is taken. */
  meterDelta?: number;
}

export interface Chapter {
  /** Free-text label shown above the bar (e.g. "วันที่ 3", "14:32"). */
  label: string;
  /** 1-based position; the bar fills to index/total. */
  index: number;
  total: number;
}

export interface StoryNode {
  id: string;
  text: string;
  isEnding?: boolean;
  endingId?: string;
  /** Progress marker; rendered as a bar when present. */
  chapter?: Chapter;
  choices?: Choice[];
}

export type MeterViz = "candles" | "hearts" | "battery";

export interface Meter {
  label: string;
  max: number;
  /** Starting value; defaults to max when omitted. */
  start?: number;
  floor: number;
  /** Ending node forced when the meter reaches floor. Must be an ending node. */
  floorNodeId: string;
  viz: MeterViz;
  hideBar?: boolean;
}

export interface StoryData {
  schemaVersion: 1;
  start: string;
  meter: Meter;
  nodes: StoryNode[];
}

export interface GameState {
  currentNode: string;
  flags: Flags;
  meter: number;
}

export function clampMeter(value: number, story: StoryData): number {
  return Math.max(story.meter.floor, Math.min(story.meter.max, value));
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
  return {
    currentNode: story.start,
    flags: {},
    meter: story.meter.start ?? story.meter.max,
  };
}

export function isChoiceAvailable(choice: Choice, flags: Flags): boolean {
  if (!choice.requires) return true;
  return Object.entries(choice.requires).every(
    ([flag, expected]) => Boolean(flags[flag]) === expected,
  );
}

export function availableChoices(node: StoryNode, flags: Flags): Choice[] {
  return (node.choices ?? []).filter((c) => isChoiceAvailable(c, flags));
}

export interface ApplyChoiceResult {
  state: GameState;
  /** True if the meter hit floor and the destination was overridden to floorNodeId. */
  forcedFloor: boolean;
}

export function applyChoice(story: StoryData, state: GameState, choice: Choice): ApplyChoiceResult {
  if (!isChoiceAvailable(choice, state.flags)) {
    throw new Error(`Choice "${choice.label}" is not available in current state`);
  }
  const nextFlags: Flags = { ...state.flags, ...(choice.sets ?? {}) };
  const nextMeter = clampMeter(state.meter + (choice.meterDelta ?? 0), story);

  let nextNode = choice.goto;
  let forcedFloor = false;
  if (nextMeter <= story.meter.floor && nextNode !== story.meter.floorNodeId) {
    nextNode = story.meter.floorNodeId;
    forcedFloor = true;
  }
  return { state: { currentNode: nextNode, flags: nextFlags, meter: nextMeter }, forcedFloor };
}

export function isEndingNode(node: StoryNode): boolean {
  return Boolean(node.isEnding);
}
