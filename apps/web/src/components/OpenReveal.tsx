"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArtLyricCard } from "@/components/ArtLyricCard";
import { AudioPlayer } from "@/components/AudioPlayer";
import { BoxOpenAnimation } from "@/components/BoxOpenAnimation";
import { splitDisplayLyrics } from "@/lib/mood-engine";
import { assignDefaultSections, buildLyricStartFractions } from "@/lib/lyric-sync";
import { buildMoodIntro } from "@/lib/lyric-card-context";
import { captureLyricCard, downloadDataUrl } from "@/lib/visual-card";
import { resolvePlaybackSrc } from "@/lib/resolve-audio-src";
import { formatToday, saveCalendarEntry } from "@/lib/storage";
import type { BlindBox, OpenResult, Strategy } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface OpenRevealProps {
  data: OpenResult;
}

const STRATEGY_GLOW: Record<Strategy, string> = {
  sync: "from-slate-300/20 via-blue-200/12 to-transparent",
  transition: "from-violet-300/18 via-purple-200/10 to-transparent",
  serendipity: "from-indigo-300/16 via-violet-200/10 to-transparent",
};

export function OpenReveal({ data }: OpenRevealProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"opening" | "revealed">("opening");
  const [cardUrl, setCardUrl] = useState(data.visualCardDataUrl);
  const [cardLoading, setCardLoading] = useState(!data.visualCardDataUrl);
  const [cardEntered, setCardEntered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [saved, setSaved] = useState(false);
  const [savingCard, setSavingCard] = useState(false);

  const isCurated = Boolean(data.isCurated);
  const boxCopy = data.boxCopy || data.openCopy[0];
  const hasPhoto = Boolean(data.imageDataUrl);
  const playbackSrc = useMemo(
    () => resolvePlaybackSrc(data.song),
    [data.song],
  );

  const lyrics = useMemo(() => {
    if (data.displayLyrics?.length) {
      return data.displayLyrics;
    }
    return splitDisplayLyrics(data.openCopy);
  }, [data.displayLyrics, data.openCopy]);

  const lyricTimings = useMemo(() => {
    if (data.lyricTimings?.length) {
      return data.lyricTimings;
    }
    if (lyrics.length > 0) {
      return buildLyricStartFractions(assignDefaultSections(lyrics.length));
    }
    return undefined;
  }, [data.lyricTimings, lyrics.length]);

  const albumCaptureData = useMemo(() => {
    if (!hasPhoto) return undefined;
    return {
      imageDataUrl: data.imageDataUrl,
      songTitle: data.song.title,
      boxCopy,
      moodIntro: buildMoodIntro(data.momentText),
      lyrics,
    };
  }, [hasPhoto, data.imageDataUrl, data.song.title, boxCopy, data.momentText, lyrics]);

  const displayBox: BlindBox = {
    id: data.boxId,
    copy: boxCopy,
    songTitle: data.song.title,
    atmosphereHint: data.timbre?.atmosphereHint || "",
    timbre: data.timbre || {
      label: "灵感音色",
      layers: [],
      listeningFeel: "",
      atmosphereHint: "",
      beatStyle: "",
      genreHint: "",
    },
    strategy: data.song.strategy,
    songId: data.song.id,
    matchScore: 0,
  };

  const handleOpenComplete = useCallback(() => {
    setPhase("revealed");
    requestAnimationFrame(() => setCardEntered(true));
  }, []);

  const captureKey = useMemo(
    () =>
      [
        data.imageDataUrl ?? "",
        data.song.title,
        boxCopy,
        data.momentText,
        lyrics.join("\n"),
      ].join("|"),
    [data.imageDataUrl, data.song.title, boxCopy, data.momentText, lyrics],
  );

  useEffect(() => {
    if (phase !== "revealed" || !cardEntered || !cardRef.current) return;

    let cancelled = false;
    setCardLoading(true);

    const timer = window.setTimeout(() => {
      const element = cardRef.current;
      if (!element || cancelled) return;

      captureLyricCard(element, { album: albumCaptureData })
        .then((url) => {
          if (!cancelled) {
            setCardUrl(url);
            setCardLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setCardLoading(false);
        });
    }, isCurated ? 200 : 480);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phase, cardEntered, captureKey, isCurated, albumCaptureData]);

  const ensureCardUrl = useCallback(async (): Promise<string> => {
    if (cardUrl && !cardLoading) return cardUrl;

    const element = cardRef.current;
    if (!element) {
      throw new Error("歌词卡未就绪");
    }

    const captured = await captureLyricCard(element, {
      forShare: true,
      album: albumCaptureData,
    });
    setCardUrl(captured);
    setCardLoading(false);
    return captured;
  }, [albumCaptureData, cardLoading, cardUrl]);

  const handleSaveCalendar = async () => {
    try {
      const url = await ensureCardUrl();
      saveCalendarEntry({
        id: uuidv4(),
        date: formatToday(),
        momentText: data.momentText,
        boxCopy,
        songTitle: data.song.title,
        songArtist: data.song.artist,
        strategy: data.song.strategy,
        visualCardDataUrl: url,
        imageDataUrl: data.imageDataUrl,
        audioUrl: playbackSrc,
        genre: data.song.genre,
      });
      setSaved(true);
    } catch {
      window.alert("歌词卡生成失败，请稍后再试");
    }
  };

  const handleSaveLyricCard = async () => {
    setSavingCard(true);
    try {
      const captured = await ensureCardUrl();
      downloadDataUrl(
        captured,
        `MuseBox灵感音匣-${data.song.title}-${Date.now()}.png`,
      );
    } catch {
      window.alert("歌词卡生成失败，请稍后再试");
    } finally {
      setSavingCard(false);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {phase === "opening" ? (
          <motion.div
            key="opening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5 }}
            className="relative flex justify-center"
          >
            <BoxOpenAnimation box={displayBox} onComplete={handleOpenComplete} />
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className={`reveal-stage${hasPhoto ? " reveal-stage--album" : ""}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
              className={`reveal-card-shell${hasPhoto ? " reveal-card-shell--album" : ""}`}
            >
              {!hasPhoto && (
                <div
                  className={`reveal-card-glow bg-gradient-to-br ${STRATEGY_GLOW[data.song.strategy]} ${isPlaying ? "is-breathing" : ""}`}
                  aria-hidden
                />
              )}

              <div className="reveal-card-frame">
                <div className="reveal-card-media">
                  <ArtLyricCard
                    ref={cardRef}
                    strategy={data.song.strategy}
                    songTitle={data.song.title}
                    boxCopy={boxCopy}
                    momentText={data.momentText}
                    lyrics={lyrics}
                    imageDataUrl={data.imageDataUrl}
                    playing={isPlaying}
                    progress={audioProgress}
                    lyricTimings={lyricTimings}
                    entered={cardEntered}
                    curated={isCurated}
                  />

                  {!hasPhoto && (
                    <AudioPlayer
                      src={playbackSrc}
                      genre={data.song.genre}
                      strategy={data.song.strategy}
                      songTitle={data.song.title}
                      variant="floating"
                      className="art-lyric-card-player"
                      onPlayingChange={setIsPlaying}
                      onAudioProgress={setAudioProgress}
                    />
                  )}

                  {!hasPhoto && cardLoading && (
                    <p className="reveal-card-loading shimmer-text">正在生成歌词卡…</p>
                  )}
                </div>
              </div>

              {hasPhoto && (
                <AudioPlayer
                  src={playbackSrc}
                  genre={data.song.genre}
                  strategy={data.song.strategy}
                  songTitle={data.song.title}
                  variant="floating"
                  className="art-lyric-card-player art-lyric-card-player--album"
                  onPlayingChange={setIsPlaying}
                  onAudioProgress={setAudioProgress}
                />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.8 }}
              className="reveal-actions"
            >
              <button
                type="button"
                onClick={() => void handleSaveCalendar()}
                disabled={saved || cardLoading}
                className="reveal-action-btn"
              >
                {saved ? "已收藏" : "收藏到日历"}
              </button>
              <span className="text-dream-mist/20">·</span>
              <button
                type="button"
                onClick={handleSaveLyricCard}
                disabled={savingCard || cardLoading}
                className="reveal-action-btn"
              >
                {savingCard ? "正在生成歌词卡…" : "保存歌词卡"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
