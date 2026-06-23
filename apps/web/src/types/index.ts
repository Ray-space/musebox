export type Strategy = "sync" | "transition" | "serendipity";

export interface Song {
  id: string;
  strategy: Strategy;
  title: string;
  artist: string;
  genre: string;
  tempo: string;
  mood_tags: string[];
  imagery_keywords: string[];
  scene_tags: string[];
  audioUrl: string;
  openCopy: [string, string];
  story: string;
  source?: "generated" | "library";
}

export interface MomentAnalysis {
  momentId: string;
  text: string;
  caption?: string;
  imageDataUrl?: string;
  mood_tags: string[];
  scene: string;
  scene_tags: string[];
  tempo_hint: string;
  imagery: string[];
  summary: string;
  music_prompt?: string;
  lyrics_hint?: string;
  song_title?: string;
  box_copies?: Partial<Record<Strategy, string>>;
  box_song_titles?: Partial<Record<Strategy, string>>;
}

export type MusicMode = "generate" | "library" | "auto";

export type MomentSource = "free" | "curated";

export interface TimbreProfile {
  label: string;
  layers: string[];
  listeningFeel: string;
  atmosphereHint: string;
  beatStyle: string;
  genreHint: string;
}

export interface BlindBox {
  id: string;
  copy: string;
  strategy: Strategy;
  songId: string;
  matchScore: number;
  songTitle?: string;
  atmosphereHint?: string;
  timbre?: TimbreProfile;
}

export interface DrawResult {
  momentId: string;
  boxes: BlindBox[];
  analysis: MomentAnalysis;
  source?: MomentSource;
  scenarioId?: string;
  singleBox?: boolean;
}

export interface OpenResult {
  boxId: string;
  boxCopy?: string;
  openCopy: [string, string];
  song: Song;
  visualCardDataUrl: string;
  momentText: string;
  imageDataUrl?: string;
  displayLyrics?: string[];
  timbre?: TimbreProfile;
  strategy?: Strategy;
  isCurated?: boolean;
}

export interface CalendarEntry {
  id: string;
  date: string;
  momentText: string;
  boxCopy: string;
  songTitle: string;
  songArtist: string;
  strategy: Strategy;
  visualCardDataUrl: string;
  imageDataUrl?: string;
  audioUrl: string;
  genre?: string;
  journal?: string;
  journalUpdatedAt?: string;
}

export interface MomentInputPayload {
  text?: string;
  caption?: string;
  imageDataUrl?: string;
}

export const PLACEHOLDERS = [
  "写天气、一个人、一顿饭，或者一句没说出口的话。",
  "今天，哪一个瞬间想交给音乐？",
  "汇报结束了，没有想象中开心。",
  "地铁上看到一个很像以前朋友的人。",
  "今天什么都没发生。",
  "终于把拖了很久的事情做完了。",
];

export const STRATEGY_LABELS: Record<Strategy, string> = {
  sync: "同频",
  transition: "转场",
  serendipity: "偶遇",
};

export const STRATEGY_CARD_STYLE: Record<
  Strategy,
  { border: string; glow: string }
> = {
  sync: {
    border: "border-glow-cool/40",
    glow: "shadow-[0_0_40px_rgba(126,184,218,0.15)]",
  },
  transition: {
    border: "border-glow-warm/40",
    glow: "shadow-[0_0_40px_rgba(244,162,97,0.15)]",
  },
  serendipity: {
    border: "border-glow-accent/40",
    glow: "shadow-[0_0_40px_rgba(199,125,255,0.15)]",
  },
};
