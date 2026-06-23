"use client";

import { BOX_IMAGE_SRC } from "@/lib/box-assets";
import { SoundWaveVisualizer } from "@/components/SoundWaveVisualizer";
import type { Strategy } from "@/types";

interface MusicGeneratingSceneProps {
  strategy: Strategy;
  boxCopy: string;
  songTitle?: string;
  elapsed: number;
  statusHint: string;
}

export function MusicGeneratingScene({
  strategy,
  boxCopy,
  songTitle,
  elapsed,
  statusHint,
}: MusicGeneratingSceneProps) {
  const title = songTitle || boxCopy;

  return (
    <div className={`music-gen-scene music-gen-scene--${strategy}`}>
      <div className="music-gen-bg" aria-hidden>
        <img
          src={BOX_IMAGE_SRC[strategy]}
          alt=""
          className="music-gen-bg-vessel-img"
          draggable={false}
        />
      </div>

      <div className="music-gen-center">
        <SoundWaveVisualizer strategy={strategy} />
      </div>

      <div className="music-gen-text">
        <p className="shimmer-text text-lg">正在生成你的专属音乐</p>
        <p className="music-gen-box-copy">《{title}》</p>
        <p className="mt-3 max-w-sm text-sm text-ink-muted">{statusHint}</p>
        <p className="mt-5 text-xs text-ink-soft">
          已等待 {elapsed}s · 请保持页面打开
        </p>
      </div>
    </div>
  );
}
