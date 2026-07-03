export interface EndingMeta {
  id: string;
  title: string;
  secret?: boolean;
}

// Display order for the ending-collection screen. `secret: true` hides the title
// (shows "???") until that ending has actually been found.
export const ENDINGS_META: EndingMeta[] = [
  { id: "death", title: "ตาย" },
  { id: "flee", title: "หนีออกจากหอ" },
  { id: "survive_unaware", title: "อยู่รอดถึงเช้า" },
  { id: "true_ending", title: "รู้ความจริงทั้งหมด" },
  { id: "ghost_twist", title: "เราคือผี", secret: true },
];
