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

function waitForAudioReady(audio: HTMLAudioElement, timeoutMs = 12_000): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("音频加载超时，请重新开盒"));
    }, timeoutMs);

    const onReady = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error("音频加载失败，请重新开盒"));
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      audio.removeEventListener("canplaythrough", onReady);
      audio.removeEventListener("error", onError);
    };

    audio.addEventListener("canplaythrough", onReady, { once: true });
    audio.addEventListener("error", onError, { once: true });
    audio.load();
  });
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
  const [loading, setLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
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

  const shouldAllowSynthFallback = !src || src.startsWith("demo://");

  useEffect(() => {
    setPlaybackError("");
    setUseSynth(false);
    notifiedRef.current = false;
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || useSynth) return;

    const onPlay = () => {
      setPlaybackError("");
      notifyPlaying(true);
    };
    const onPause = () => notifyPlaying(false);
    const onError = () => {
      if (shouldAllowSynthFallback) {
        setUseSynth(true);
      } else {
        notifyPlaying(false);
        setPlaybackError("音频无法播放，请重新开盒");
      }
    };
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
      audio.play().catch(() => {
        if (shouldAllowSynthFallback) {
          setUseSynth(true);
        } else {
          setPlaybackError("自动播放失败，请点击播放按钮");
        }
      });
    }

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [autoPlay, useSynth, src, onPlaying, onPlayingChange, onAudioProgress, shouldAllowSynthFallback]);

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
    setPlaybackError("");
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
      if (!src) {
        setPlaybackError("暂无音频，请重新开盒");
        return;
      }

      setLoading(true);
      setPlaybackError("");

      try {
        await waitForAudioReady(audio);
        await audio.play();
      } catch (error) {
        notifyPlaying(false);
        if (shouldAllowSynthFallback) {
          setUseSynth(true);
          startSynth();
        } else {
          setPlaybackError(
            error instanceof Error ? error.message : "播放失败，请重新开盒",
          );
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    audio.pause();
  };

  const errorHint =
    playbackError && !useSynth ? (
      <p className="reveal-player-error" role="alert">
        {playbackError}
      </p>
    ) : null;

  if (!visible) return null;

  if (resolvedVariant === "corner") {
    return (
      <div className={`reveal-player-corner ${playing ? "is-playing" : ""} ${className}`}>
        <audio ref={audioRef} src={src} preload="auto" loop />
        <button
          type="button"
          onClick={toggle}
          disabled={loading}
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
        {errorHint}
      </div>
    );
  }

  if (resolvedVariant === "floating") {
    return (
      <div className={`reveal-player ${playing ? "is-playing" : ""} ${className}`}>
        <audio ref={audioRef} src={src} preload="auto" loop />

        {playing && (
          <div className="reveal-cd-arm" aria-hidden>
            <span className="reveal-cd-arm-head" />
          </div>
        )}

        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          aria-label={playing ? "暂停音乐" : "播放音乐"}
          aria-busy={loading}
          className={`reveal-music-btn ${playing ? "is-playing" : ""}`}
        >
          {loading ? (
            <span className="reveal-music-loading" aria-hidden />
          ) : playing ? (
            <span className="reveal-vinyl-disc is-spinning" aria-hidden>
              <span className="reveal-vinyl-grooves" />
              <span className="reveal-vinyl-shine" />
              <span className="reveal-vinyl-label">
                <span>{songTitle?.slice(0, 4) || "音匣"}</span>
              </span>
              <span className="reveal-vinyl-hole" />
            </span>
          ) : (
            <span className="reveal-music-emoji" aria-hidden>
              🎶
            </span>
          )}
        </button>
        {errorHint}
      </div>
    );
  }

  if (resolvedVariant === "compact") {
    return (
      <div className="flex flex-col items-center gap-3">
        <audio ref={audioRef} src={src} preload="auto" loop />
        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          className="dream-btn flex h-16 w-16 items-center justify-center rounded-full text-xl text-white shadow-dream-lg"
        >
          {loading ? "…" : playing ? "❚❚" : "▶"}
        </button>
        <p className="text-xs text-dream-mist/50">
          {loading
            ? "正在加载音频…"
            : playing
              ? "正在播放 AI 音乐"
              : "点击播放"}
        </p>
        {errorHint}
        {useSynth && playing && (
          <p className="text-[11px] text-dream-mist/35">
            Demo 合成音 · 曲库 MP3 可播放完整歌曲
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-5">
      <audio ref={audioRef} src={src} preload="auto" loop />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          className="dream-btn flex h-14 w-14 items-center justify-center rounded-full text-white"
        >
          {loading ? "…" : playing ? "❚❚" : "▶"}
        </button>
        <div className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-dream-purple/20">
            <div
              className={`h-full bg-gradient-to-r from-dream-violet to-dream-pink transition-all ${playing ? "w-2/3 animate-pulse" : "w-1/4"}`}
            />
          </div>
          <p className="mt-2 text-xs text-dream-mist/45">
            {playbackError
              ? playbackError
              : useSynth
                ? "Demo 合成音（曲库 MP3 可播放完整歌曲）"
                : loading
                  ? "正在加载音频…"
                  : playing
                    ? "正在播放"
                    : "点击播放"}
          </p>
        </div>
      </div>
    </div>
  );
}
