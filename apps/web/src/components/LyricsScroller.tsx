"use client";

interface LyricsScrollerProps {
  lines: string[];
  playing: boolean;
}

export function LyricsScroller({ lines, playing }: LyricsScrollerProps) {
  if (!lines.length) return null;

  const repeated = [...lines, ...lines];

  return (
    <div className="lyrics-scroller" aria-live="polite">
      <div
        className={`lyrics-scroller-track ${playing ? "is-playing" : ""}`}
        style={{ ["--lyrics-lines" as string]: lines.length }}
      >
        {repeated.map((line, index) => (
          <p
            key={`${line}-${index}`}
            className={`lyrics-scroller-line ${index === 0 ? "is-active" : ""}`}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
