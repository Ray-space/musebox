"use client";

interface AnalyzeProgressRingProps {
  progress: number;
  label?: string;
}

export function AnalyzeProgressRing({
  progress,
  label = "正在从你的图文提炼三首歌曲…",
}: AnalyzeProgressRingProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="analyze-progress-ring">
      <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden>
        <circle
          cx="70"
          cy="70"
          r={radius}
          className="analyze-progress-track"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          className="analyze-progress-bar"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="analyze-progress-center">
        <span className="analyze-progress-value">{Math.round(progress)}%</span>
        <span className="analyze-progress-icon">✨</span>
      </div>
      <p className="analyze-progress-label shimmer-text">{label}</p>
    </div>
  );
}
