import type { Metadata, Viewport } from "next";
import { Sarabun, Trirong, Charmonman } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
});

const trirong = Trirong({
  variable: "--font-trirong",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  style: ["italic", "normal"],
});

const charmonman = Charmonman({
  variable: "--font-charmonman",
  subsets: ["thai", "latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "หนึ่งคืนที่หอพัก",
  description:
    "นิยายเลือกทางเดินสยองขวัญไทย: คืนแรกในหอพักเก่า เสียงแปลกๆ จากห้องข้างๆ ที่ไม่มีคนเช่า 5 ตอนจบ เล่นจบใน 10-20 นาที",
};

export const viewport: Viewport = {
  themeColor: "#0b0906",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${sarabun.variable} ${trirong.variable} ${charmonman.variable}`}>
      <head>
        <script
          defer
          src="https://umami-host-peerapongsms-projects.vercel.app/script.js"
          data-website-id="3f09453d-0b39-443e-8845-5e65611cc58a"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
