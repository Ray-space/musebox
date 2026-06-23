"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  symbol: string;
}

interface NoteParticlesProps {
  active: boolean;
  burstKey: number;
}

const SYMBOLS = ["♪", "♫", "·", "✦", "°"];

export function NoteParticles({ active, burstKey }: NoteParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active || burstKey === 0) return;

    const created: Particle[] = Array.from({ length: 3 }, (_, index) => ({
      id: burstKey * 10 + index,
      x: 8 + Math.random() * 84,
      y: 6 + Math.random() * 88,
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    }));

    setParticles((prev) => [...prev, ...created].slice(-24));

    const timers = created.map((particle) =>
      window.setTimeout(() => {
        setParticles((prev) => prev.filter((item) => item.id !== particle.id));
      }, 1500),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [active, burstKey]);

  if (!particles.length) return null;

  return (
    <div className="note-particles" aria-hidden>
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="note-particle"
          style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
        >
          {particle.symbol}
        </span>
      ))}
    </div>
  );
}
