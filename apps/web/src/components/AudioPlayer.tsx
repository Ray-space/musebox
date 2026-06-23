"use client";

import { useEffect, useRef, useState } from "react";
import type { Strategy } from "@/types";

const GENRE_FREQ: Record<string, number> = {
  folk: 220,
  pop: 261,
  lofi: 196,
  rnb: 185,
  jazz: 247,
  electronic: 277,
  piano: 293,
  indie: 329,
  ambient: 174,
  postrock: 155,
  funk: 349,
  chinese: 392,
  hiphop: 311,
  synthwave: 233,
  acoustic: 246,
};

interface AudioPlayerProps {
  src: string;
  genre: string;
  strategy: Strategy;
  songTitle?: string;
  autoPlay?: boolean;
  compact?: boolean;
  variant?: "default" | "compact" | "floating" | "corner";
  visible?: boolean;
  className?: string;
  onPlaying?: () => void;
  onPlayingChange?: (playing: boolean) => void;
  onAudioProgress?: (progress: number) => void;
}

export function AudioPlayer({
  src,
  genre,
  strategy,
  songTitle,
  autoPlay = false,
  compact = false,
  variant,
  visible = true,
  className = "",
  onPlaying,
  onPlayingChange,
  onAudioProgress,
}: AudioPlayerProps) {
  const resolvedVariant = variant ?? (compact ? "compact" : "default");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [useSynth, setUseSynth] = useState(false);
  const synthRef = useRef<{
    ctx: AudioContext;
    osc: OscillatorNode;
    gain: GainNode;
  } | null>(null);
  const notifiedRef = useRef(false);

  const notifyPlaying = (next: boolean) => {
    setPlaying(next);
    onPlayingChange?.(next);
    if (next && !notifiedRef.current) {
      notifiedRef.current = true;
      onPlaying?.();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || useSynth) return;

    const onPlay = () => notifyPlaying(true);
    const onPause = () => notifyPlaying(false);
    const onError = () => setUseSynth(true);
    const onTimeUpdate = () => {
      if (audio.duration > 0) {
        onAudioProgress?.(audio.currentTime / audio.duration);
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    audio.addEventListener("timeupdate", onTimeUpdate);

    if (autoPlay) {
      audio.play().catch(() => setUseSynth(true));
    }

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [autoPlay, useSynth, src, onPlaying, onPlayingChange, onAudioProgress]);

  const startSynth = () => {
    if (synthRef.current) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const base = GENRE_FREQ[genre] || 220;
    const strategyOffset =
      strategy === "transition" ? 1.12 : strategy === "serendipity" ? 1.25 : 1;
    osc.type = strategy === "serendipity" ? "triangle" : "sine";
    osc.frequency.value = base * strategyOffset;
    gain.gain.value = 0.045;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    synthRef.current = { ctx, osc, gain };
    notifyPlaying(true);
  };

  const stopSynth = () => {
    synthRef.current?.osc.stop();
    synthRef.current?.ctx.close();
    synthRef.current = null;
    notifyPlaying(false);
  };

  const toggle = async () => {
    if (useSynth) {
      if (playing) {
        stopSynth();
      } else {
        startSynth();
      }
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setUseSynth(true);
        startSynth();
      }
    } else {
      audio.pause();
    }
  };

  if (!visible) return null;

  if (resolvedVariant === "corner") {
    return (
      <div className={`reveal-player-corner ${playing ? "is-playing" : ""} ${className}`}>
        <audio ref={audioRef} src={src} preload="metadata" loop />
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "暂停音乐" : "播放音乐"}
          className={`reveal-corner-btn ${playing ? "is-playing" : ""}`}
        >
          {playing ? (
            <span className="reveal-pause-icon" aria-hidden>
              <span />
              <span />
            </span>
          ) : (
            <span className="reveal-play-icon" aria-hidden />
          )}
        </button>
      </div>
    );
  }

  if (resolvedVariant === "floating") {
    return (
      <div className={`reveal-player ${playing ? "is-playing" : ""} ${className}`}>
        <audio ref={audioRef} src={src} preload="metadata" loop />

        {playing && (
          <div className="reveal-cd-arm" aria-hidden>
            <span className="reveal-cd-arm-head" />
          </div>
        )}

        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "暂停音乐" : "播放音乐"}
          className={`reveal-music-btn ${playing ? "is-playing" : ""}`}
        >
          {playing ? (
            <span className="reveal-vinyl-disc is-spinning" aria-hidden>
              <span className="reveal-vinyl-grooves" />
              <span className="reveal-vinyl-shine" />
              <span className="reveal-vinyl-label">
                <span>{songTitle?.slice(0, 4) || "未音"}</span>
              </span>
              <span className="reveal-vinyl-hole" />
            </span>
          ) : (
            <span className="reveal-music-emoji" aria-hidden>
              🎶
            </span>
          )}
        </button>
      </div>
    );
  }

  if (resolvedVariant === "compact") {
    return (
      <div className="flex flex-col items-center gap-3">
        <audio ref={audioRef} src={src} preload="metadata" loop />
        <button
          type="button"
          onClick={toggle}
          className="dream-btn flex h-16 w-16 items-center justify-center rounded-full text-xl text-white shadow-dream-lg"
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <p className="text-xs text-dream-mist/50">
          {playing ? "正在播放 AI 音乐" : "点击播放"}
        </p>
        {useSynth && playing && (
          <p className="text-[11px] text-dream-mist/35">
            Demo 合成音 · 替换未音 MP3 后可播放完整歌曲
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-5">
      <audio ref={audioRef} src={src} preload="metadata" loop />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          className="dream-btn flex h-14 w-14 items-center justify-center rounded-full text-white"
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-dream-purple/20">
            <div
              className={`h-full bg-gradient-to-r from-dream-violet to-dream-pink transition-all ${playing ? "w-2/3 animate-pulse" : "w-1/4"}`}
            />
          </div>
          <p className="mt-2 text-xs text-dream-mist/45">
            {useSynth
              ? "Demo 合成音（替换为未音导出 MP3 后可播放完整歌曲）"
              : playing
                ? "正在播放"
                : "点击播放"}
          </p>
        </div>
      </div>
    </div>
  );
}
