"use client";

import { motion } from "framer-motion";
import { forwardRef, useMemo } from "react";
import { LyricFocusScroller } from "@/components/LyricFocusScroller";
import { buildMoodIntro } from "@/lib/lyric-card-context";
import { resolveActiveLyricIndex } from "@/lib/lyric-sync";
import { dedupeLyricLines } from "@/lib/mood-engine";

export interface ArtLyricCardProps {
  strategy: "sync" | "transition" | "serendipity";
  songTitle: string;
  boxCopy: string;
  momentText: string;
  lyrics: string[];
  imageDataUrl?: string;
  playing: boolean;
  progress?: number;
  lyricTimings?: number[];
  entered?: boolean;
  curated?: boolean;
}

function detectMoodClass(text: string): string {
  if (/雨|湿|雾|闷|阴/.test(text)) return "mood-rain";
  if (/城|灯|夜|霓虹/.test(text)) return "mood-city";
  return "mood-default";
}

export const ArtLyricCard = forwardRef<HTMLDivElement, ArtLyricCardProps>(
  function ArtLyricCard(
    {
      strategy,
      songTitle,
      boxCopy,
      momentText,
      lyrics,
      imageDataUrl,
      playing,
      progress = 0,
      lyricTimings,
      entered = true,
      curated = false,
    },
    ref,
  ) {
    const moodClass = detectMoodClass(momentText);
    const moodIntro = buildMoodIntro(momentText);
    const hasPhoto = Boolean(imageDataUrl);

    const displayLyrics = useMemo(() => {
      if (curated) {
        return lyrics.slice(0, 6);
      }
      const lines = dedupeLyricLines(lyrics).slice(0, 6);
      const normalizedCopy = boxCopy.replace(/^「\s*|\s*」$/g, "");
      if (lines[0]?.replace(/^「\s*|\s*」$/g, "") === normalizedCopy) {
        return lines.slice(1);
      }
      return lines;
    }, [lyrics, boxCopy, curated]);

    const featuredIndex = useMemo(() => {
      if (!playing || displayLyrics.length === 0) return 0;
      if (lyricTimings?.length) {
        return resolveActiveLyricIndex(progress, lyricTimings);
      }
      return Math.min(
        displayLyrics.length - 1,
        Math.floor(progress * displayLyrics.length),
      );
    }, [playing, progress, displayLyrics.length, lyricTimings]);

    if (hasPhoto) {
      return (
        <div
          ref={ref}
          data-lyric-card-root
          className={[
            "art-lyric-card",
            "art-lyric-card--album",
            strategy,
            moodClass,
            curated ? "art-lyric-card--curated" : "",
            playing ? "is-playing" : "",
            entered ? "is-entered" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="art-album-photo">
            <div className="art-album-photo-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageDataUrl}
                alt=""
                className="art-album-photo-img"
                draggable={false}
                {...(imageDataUrl?.startsWith("http")
                  ? { crossOrigin: "anonymous" as const }
                  : {})}
              />
              <div className="art-album-photo-fade" aria-hidden />
            </div>
          </div>

          <div className="art-album-body">
            <p className="art-album-intro">{moodIntro.slice(0, 48)}</p>

            <h3 className="art-album-title">{songTitle}</h3>

            {boxCopy && (
              <p className="art-album-subtitle">
                「{boxCopy.replace(/^「\s*|\s*」$/g, "")}」
              </p>
            )}

            <div className="art-album-lyrics">
              {displayLyrics.map((line, index) => {
                const isFeatured = index === featuredIndex;
                const text = line.replace(/^「\s*|\s*」$/g, "");

                return (
                  <p
                    key={`${line}-${index}`}
                    className={`art-album-lyric-line${isFeatured ? " is-featured" : ""}`}
                  >
                    {text}
                  </p>
                );
              })}
            </div>

            <p className="art-album-brand">MuseBox灵感音匣</p>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        data-lyric-card-root
        className={[
          "art-lyric-card",
          "art-lyric-card--no-photo",
          strategy,
          moodClass,
          playing ? "is-playing" : "",
          entered ? "is-entered" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="art-lyric-card-bg" aria-hidden>
          <div className="art-lyric-card-bg-art">
            <div className="art-lyric-card-bg-art-base" />
            <div className="art-rain-curtain" />
            <div className="art-mist-orb art-mist-orb--1" />
            <div className="art-mist-orb art-mist-orb--2" />
            <div className="art-mist-orb art-mist-orb--3" />
          </div>
          <div className="art-lyric-card-bg-veil" />
          <div className="art-lyric-card-grain" />
        </div>

        <div className="art-lyric-card-content">
          <header className="art-lyric-card-header">
            <motion.p
              className="art-lyric-card-eyebrow"
              initial={{ opacity: 0, y: 12 }}
              animate={entered ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              {moodIntro.slice(0, 48)}
            </motion.p>

            <motion.h3
              className="art-lyric-card-title"
              initial={{ opacity: 0, y: 16 }}
              animate={entered ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              {songTitle}
            </motion.h3>

            <motion.p
              className="art-lyric-card-quote"
              initial={{ opacity: 0, y: 12 }}
              animate={entered ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              「{boxCopy}」
            </motion.p>
          </header>

          <motion.div
            className="art-lyric-card-lyrics"
            initial={{ opacity: 0, y: 10 }}
            animate={entered ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.1, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}
          >
            <LyricFocusScroller
              lines={displayLyrics}
              playing={playing}
              progress={progress}
              lyricTimings={lyricTimings}
              variant="default"
            />
          </motion.div>

          <p className="art-lyric-card-brand">MuseBox灵感音匣</p>
        </div>
      </div>
    );
  },
);

/** 与 ArtLyricCard 相同，便于统一引用 */
export const LyricCard = ArtLyricCard;
