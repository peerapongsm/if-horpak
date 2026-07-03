export interface EndingMeta {
  id: string;
  title: string;
  secret?: boolean;
}

// Per-story ending lists live in lib/stories.ts. `secret: true` hides the
// title (shows "???") on the collection screen until that ending is found.
