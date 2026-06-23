"use client";

import type { Strategy } from "@/types";

interface SoundWaveVisualizerProps {
  strategy?: Strategy;
  active?: boolean;
  className?: string;
}

export function SoundWaveVisualizer({
  strategy = "sync",
  active = true,
  className = "",
}: SoundWaveVisualizerProps) {
  return (
    <div
      className={`sound-wave-visualizer sound-wave-visualizer--${strategy} ${active ? "is-active" : ""} ${className}`.trim()}
      aria-hidden
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} style={{ animationDelay: `${index * 0.12}s` }} />
      ))}
    </div>
  );
}
