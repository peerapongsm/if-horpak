// Story registry: every playable story with its display meta and ending list.
// Add a story = add a JSON file under data/stories/ + one entry here.

import horpakJson from "../data/stories/horpak.json";
import busJson from "../data/stories/bus.json";
import faenPlomJson from "../data/stories/faen-plom.json";
import borisatJson from "../data/stories/borisat.json";
import tamrapRakJson from "../data/stories/tamrap-rak.json";
import type { StoryData } from "./engine";
import type { EndingMeta } from "./endingsMeta";
import type { AmbientMood } from "./ambient";

export interface StoryEntry {
  slug: string;            // also localStorage namespace + route — never change once shipped
  title: string;
  tagline: string;
  genre: string;           // card tag, e.g. "สยองขวัญ"
  ambientMood: AmbientMood;
  data: StoryData;
  endings: EndingMeta[];
}

export const STORIES: StoryEntry[] = [
  {
    slug: "horpak", title: "หนึ่งคืนที่หอพัก",
    tagline: "เสียงเคาะประตูตอนตีสาม ในหอที่ควรจะว่างทั้งชั้น",
    genre: "สยองขวัญ", ambientMood: "horror",
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
    slug: "bus", title: "รถเมล์สายสุดท้าย",
    tagline: "รถเมล์ครีมแดงไม่มีเลขสาย ที่จอดรับเฉพาะคนยังไม่ยอมกลับบ้าน",
    genre: "สยองขวัญ", ambientMood: "horror",
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
  {
    slug: "faen-plom", title: "แฟนปลอม 7 วัน",
    tagline: "ดีลเป็นแฟนปลอมไปงานแต่งพี่สาวเขา แลกกับโหวตผ่านโปรเจกต์ — เจ็ดวันในบ้านเขา",
    genre: "โรแมนซ์", ambientMood: "romance",
    data: faenPlomJson as unknown as StoryData,
    endings: [
      { id: "real", title: "ของปลอมกลายเป็นจริง" },
      { id: "deal", title: "จบดีลแบบมืออาชีพ" },
      { id: "grandma", title: "ยายเก็บความลับให้" },
      { id: "setup", title: "เขาวางแผนไว้แต่แรก", secret: true },
      { id: "broke", title: "แผนแตกกลางงาน" },
    ],
  },
  {
    slug: "borisat", title: "วันแรกที่บริษัทจำกัด",
    tagline: "วันแรกในสตาร์ทอัพที่ทุกคนพูดภาษา synergy และเจ้านายเรียกทุกคนว่าแฟมิลี่",
    genre: "เสียดสี", ambientMood: "office",
    data: borisatJson as unknown as StoryData,
    endings: [
      { id: "become", title: "กลายเป็นสิ่งที่เคยเกลียด" },
      { id: "quit", title: "ลาออกไปมีชีวิต" },
      { id: "change", title: "เปลี่ยนจากข้างใน" },
      { id: "survive", title: "เอาตัวรอดเงียบๆ" },
      { id: "scheme", title: "บริษัทคือพีระมิด", secret: true },
      { id: "burnout", title: "หมดไฟกลางวัน" },
    ],
  },
  {
    slug: "tamrap-rak", title: "ตำรับรักกรุงเก่า",
    tagline: "เชฟยุคใหม่ตื่นมาในร่างแม่หญิงกรุงเก่า ก่อนวันคลุมถุงชน — มีแค่ฝีมือครัวแห่งอนาคตเป็นอาวุธ",
    genre: "ย้อนเวลา", ambientMood: "period",
    data: tamrapRakJson as unknown as StoryData,
    endings: [
      { id: "stay", title: "เลือกอยู่กรุงเก่า" },
      { id: "return", title: "กลับสู่ปัจจุบัน" },
      { id: "reincarnation", title: "เกิดใหม่เจอกันอีก" },
      { id: "exposed", title: "โดนจับว่าผีเข้า" },
      { id: "heartbreak", title: "ใจที่ไปไม่ถึง" },
      { id: "trapped", title: "ตำรับใหม่ในกรุงเก่า", secret: true },
    ],
  },
];

export function getStoryEntry(slug: string): StoryEntry | undefined {
  return STORIES.find((s) => s.slug === slug);
}
