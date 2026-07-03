// Story registry: every playable story with its display meta and ending list.
// Add a story = add a JSON file under data/stories/ + one entry here.

import horpakJson from "../data/stories/horpak.json";
import busJson from "../data/stories/bus.json";
import type { StoryData } from "./engine";
import type { EndingMeta } from "./endingsMeta";

export interface StoryEntry {
  /** Also the localStorage namespace — never change once shipped. */
  slug: string;
  title: string;
  tagline: string;
  data: StoryData;
  endings: EndingMeta[];
}

export const STORIES: StoryEntry[] = [
  {
    slug: "horpak",
    title: "หนึ่งคืนที่หอพัก",
    tagline: "เสียงเคาะประตูตอนตีสาม ในหอที่ควรจะว่างทั้งชั้น",
    data: horpakJson as unknown as StoryData,
    endings: [
      { id: "death", title: "ตาย" },
      { id: "flee", title: "หนีออกจากหอ" },
      { id: "survive_unaware", title: "อยู่รอดถึงเช้า" },
      { id: "true_ending", title: "รู้ความจริงทั้งหมด" },
      { id: "ghost_twist", title: "เราคือผี", secret: true },
    ],
  },
  {
    slug: "bus",
    title: "รถเมล์สายสุดท้าย",
    tagline: "รถเมล์ครีมแดงไม่มีเลขสาย ที่จอดรับเฉพาะคนยังไม่ยอมกลับบ้าน",
    data: busJson as unknown as StoryData,
    endings: [
      { id: "death", title: "จมไปกับรถ" },
      { id: "escape_jump", title: "โดดหนีกลางทาง" },
      { id: "got_off", title: "ลงทันป้ายสุดท้าย" },
      { id: "ride_out", title: "หลับตาจนถึงเช้า" },
      { id: "true_ending", title: "ส่งทุกคนกลับบ้าน" },
      { id: "conductor", title: "กระเป๋าคนใหม่", secret: true },
    ],
  },
];

export function getStoryEntry(slug: string): StoryEntry | undefined {
  return STORIES.find((s) => s.slug === slug);
}
