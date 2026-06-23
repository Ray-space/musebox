"use client";

import { useEffect, useRef } from "react";
import type { Strategy } from "@/types";

interface CalendarPlayButtonProps {
  audioUrl: string;
  strategy: Strategy;
  genre: string;
  songTitle: string;
  isActive: boolean;
  onToggle: (playing: boolean) => void;
  size?: "sm" | "md";
}

export function CalendarPlayButton({
  audioUrl,
  songTitle,
  isActive,
  onToggle,
  size = "md",
}: CalendarPlayButtonProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isActive) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isActive]);

  const handleClick = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isActive) {
      audio.pause();
      onToggle(false);
      return;
    }

    try {
      await audio.play();
      onToggle(true);
    } catch {
      onToggle(false);
    }
  };

  return (
    <>
      <audio ref={audioRef} src={audioUrl} preload="none" aria-hidden />
      <button
        type="button"
        className={[
          "calendar-play-btn",
          size === "sm" ? "calendar-play-btn--sm" : "calendar-play-btn--md",
          isActive ? "is-playing" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={isActive ? `暂停 ${songTitle}` : `播放 ${songTitle}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void handleClick();
        }}
      >
        {isActive ? (
          <span className="calendar-pause-icon" aria-hidden>
            <span />
            <span />
          </span>
        ) : (
          <span className="calendar-play-icon" aria-hidden />
        )}
      </button>
    </>
  );
}
