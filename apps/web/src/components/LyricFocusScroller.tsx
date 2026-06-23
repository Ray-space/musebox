"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface LyricFocusScrollerProps {
  lines: string[];
  playing: boolean;
  progress?: number;
  variant?: "default" | "photo";
}

function staggerOffset(index: number): number {
  const pattern = [0, 14, -10, 11, -8, 7, -5, 9, -7, 4];
  return pattern[index % pattern.length];
}

function formatLyricLine(
  line: string,
  index: number,
  activeIndex: number,
  playing: boolean,
): string {
  const stripped = line.replace(/^「\s*|\s*」$/g, "");
  const useBrackets =
    (!playing && index === 0) || (playing && activeIndex >= 0 && index === activeIndex);
  return useBrackets ? `「${stripped}」` : stripped;
}

function lineState(index: number, activeIndex: number, playing: boolean) {
  const x = staggerOffset(index);

  if (!playing || activeIndex < 0) {
    const opacity =
      index === 0 ? 0.74 : index === 1 ? 0.56 : index === 2 ? 0.44 : 0.3;
    return {
      opacity,
      scale: index === 0 ? 1.02 : 1,
      y: 0,
      x,
    };
  }

  const distance = Math.abs(index - activeIndex);

  if (distance === 0) {
    return { opacity: 1, scale: 1.03, y: 0, x };
  }
  if (distance === 1) {
    return { opacity: 0.5, scale: 0.99, y: 0, x };
  }
  if (distance === 2) {
    return { opacity: 0.36, scale: 0.97, y: 0, x };
  }
  return { opacity: 0.22, scale: 0.95, y: 0, x };
}

export function LyricFocusScroller({
  lines,
  playing,
  progress = 0,
  variant = "default",
}: LyricFocusScrollerProps) {
  const reduceMotion = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const [trackOffset, setTrackOffset] = useState(0);

  const activeIndex = playing
    ? Math.min(lines.length - 1, Math.floor(progress * lines.length))
    : -1;

  useEffect(() => {
    lineRefs.current = lineRefs.current.slice(0, lines.length);
  }, [lines.length]);

  useLayoutEffect(() => {
    if (!playing || activeIndex < 0) {
      setTrackOffset(0);
      return;
    }

    const lineEl = lineRefs.current[activeIndex];
    const viewportEl = viewportRef.current;
    if (!lineEl || !viewportEl) return;

    const lineCenter = lineEl.offsetTop + lineEl.offsetHeight / 2;
    const viewportCenter = viewportEl.clientHeight / 2;
    setTrackOffset(viewportCenter - lineCenter);
  }, [activeIndex, playing, lines]);

  return (
    <div
      className={`lyric-focus lyric-focus--${variant} ${playing ? "is-playing" : ""}`}
      aria-live="polite"
    >
      <div className="lyric-focus-mask lyric-focus-mask--top" aria-hidden />
      <div className="lyric-focus-mask lyric-focus-mask--bottom" aria-hidden />

      <div className="lyric-focus-viewport" ref={viewportRef}>
        <motion.div
          className="lyric-focus-track"
          animate={{ y: trackOffset }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.95, ease: [0.22, 1, 0.36, 1] }
          }
        >
          {lines.map((line, index) => {
            const state = lineState(index, activeIndex, playing);
            const isFeatured =
              (!playing && index === 0) ||
              (playing && activeIndex >= 0 && index === activeIndex);

            return (
              <motion.p
                key={`${line}-${index}`}
                ref={(el) => {
                  lineRefs.current[index] = el;
                }}
                className={`lyric-focus-line${
                  playing && index === activeIndex ? " is-active" : ""
                }${!playing ? " is-idle" : ""}${isFeatured ? " is-featured" : ""}${
                  staggerOffset(index) !== 0 ? " is-staggered" : ""
                }`}
                animate={state}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.85, ease: [0.22, 1, 0.36, 1] }
                }
              >
                {formatLyricLine(line, index, activeIndex, playing)}
              </motion.p>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
