"use client";

import { useEffect, useRef, useState } from "react";

interface TypewriterProps {
  text: string;
  onDone: () => void;
}

const MS_PER_CHAR = 18;

export default function Typewriter({ text, onDone }: TypewriterProps) {
  const [shown, setShown] = useState("");
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setShown("");

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setShown(text);
      doneRef.current = true;
      onDone();
      return;
    }

    let i = 0;
    let timeoutId: number;

    function tick() {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        doneRef.current = true;
        onDone();
        return;
      }
      timeoutId = window.setTimeout(tick, MS_PER_CHAR);
    }
    timeoutId = window.setTimeout(tick, MS_PER_CHAR);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function skip() {
    if (doneRef.current) return;
    doneRef.current = true;
    setShown(text);
    onDone();
  }

  return (
    <p
      className="story-text"
      onClick={skip}
      role="button"
      tabIndex={0}
      aria-label="ข้อความ กดหรือกด space เพื่อข้ามการพิมพ์"
      onKeyDown={(e) => {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          skip();
        }
      }}
    >
      {shown}
    </p>
  );
}
