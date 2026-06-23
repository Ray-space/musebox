import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          primary: "#2d2042",
          muted: "#6b5f80",
          soft: "#9b8fb0",
          950: "#07050f",
          900: "#120a1f",
          800: "#1a1030",
          700: "#251845",
        },
        dream: {
          purple: "#7c3aed",
          violet: "#a855f7",
          pink: "#d946ef",
          indigo: "#4c1d95",
          mist: "#ddd6fe",
        },
        glow: {
          warm: "#e879f9",
          cool: "#a78bfa",
          accent: "#c084fc",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        float: "float 4s ease-in-out infinite",
        "draw-spin": "draw-spin 3s linear infinite",
        "draw-pulse": "draw-pulse 1.6s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "draw-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "draw-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.85" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
      },
      boxShadow: {
        dream: "0 0 40px rgba(168, 85, 247, 0.35)",
        "dream-lg": "0 0 60px rgba(217, 70, 239, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
