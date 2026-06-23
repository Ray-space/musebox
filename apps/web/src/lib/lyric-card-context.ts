import type { Strategy } from "@/types";

export interface LyricCardVisualContext {
  userImageScene: string;
  imageMoodKeywords: string[];
  userText: string;
  songTitle: string;
  lyricsExcerpt: string[];
  musicStyle: string;
  soundKeywords: string[];
  rhythm: string;
  emotionArc: string;
  strategy: Strategy;
}

const STRATEGY_STYLE: Record<
  Strategy,
  { style: string; sounds: string[]; arc: string }
> = {
  sync: {
    style: "Ambient · Piano · Rain Texture",
    sounds: ["雨声采样", "柔和钢琴", "空气感铺底"],
    arc: "安放 · 停留 · 被接住",
  },
  transition: {
    style: "Lo-fi · Warm Synth · Soft Beat",
    sounds: ["暖色弦乐", "轻节奏流动", "微光颗粒"],
    arc: "松动 · 渐暖 · 微微上扬",
  },
  serendipity: {
    style: "Electronic · City Pop · Future Garage",
    sounds: ["霓虹光点", "城市夜行", "低频铺底"],
    arc: "意外 · 微光 · 重新出发",
  },
};

const GENRE_STYLE: Record<string, string> = {
  piano: "Ambient · Piano",
  ambient: "Ambient · Atmospheric",
  pop: "Indie Pop · Soft Vocal",
  lofi: "Lo-fi · Warm Tape",
  electronic: "Electronic · Dream Pop",
  folk: "Acoustic · Intimate",
  jazz: "Jazz · Late Night",
  chinese: "Neo-Chinese · Ambient",
};

const TEMPO_LABEL: Record<string, string> = {
  slow: "慢板 · 呼吸留白",
  medium: "中速 · 灵感流动",
  fast: "快板 · 轻盈推进",
};

function detectImageMoodKeywords(
  text: string,
  imagery: string[],
): string[] {
  const hay = `${text} ${imagery.join(" ")}`;
  const keywords: string[] = [];
  if (/雨|湿|淋/.test(hay)) keywords.push("雨雾", "湿润反光");
  if (/窗|车/.test(hay)) keywords.push("车窗", "玻璃质感");
  if (/城|街|灯|霓虹/.test(hay)) keywords.push("城市灯光", "夜行");
  if (/夜|晚/.test(hay)) keywords.push("夜色", "微光");
  if (/海|浪/.test(hay)) keywords.push("海边", "潮汐");
  if (/静|空|慢/.test(hay)) keywords.push("留白", "安静");
  if (keywords.length === 0) keywords.push("雾感", "灵感留白");
  return keywords.slice(0, 4);
}

export function buildLyricCardContext(options: {
  strategy: Strategy;
  momentText: string;
  userText?: string;
  songTitle: string;
  lyrics: string[];
  boxCopy?: string;
  genre?: string;
  tempo?: string;
  moodTags?: string[];
  imagery?: string[];
  timbre?: import("@/types").TimbreProfile;
}): LyricCardVisualContext {
  const strategyMeta = STRATEGY_STYLE[options.strategy];
  const genre = options.genre || "pop";
  const musicStyle =
    options.timbre?.genreHint || GENRE_STYLE[genre] || strategyMeta.style;
  const soundKeywords = options.timbre?.layers?.length
    ? options.timbre.layers
    : [
        ...strategyMeta.sounds,
        ...(options.moodTags?.slice(0, 2) || []),
      ].slice(0, 4);
  const imageMoodKeywords = detectImageMoodKeywords(
    options.userText || options.momentText,
    options.imagery || [],
  );

  return {
    userImageScene: options.momentText.slice(0, 28),
    imageMoodKeywords,
    userText: options.userText || options.momentText,
    songTitle: options.songTitle,
    lyricsExcerpt: options.lyrics.slice(0, 6),
    musicStyle,
    soundKeywords,
    rhythm: TEMPO_LABEL[options.tempo || "medium"] || TEMPO_LABEL.medium,
    emotionArc: options.timbre?.listeningFeel || strategyMeta.arc,
    strategy: options.strategy,
  };
}

const ANNOTATION_OPENING: Record<Strategy, string> = {
  sync: "这首歌像雨夜里一段被接住的呼吸",
  transition: "这首歌像雨势将歇时亮起的一盏灯",
  serendipity: "这首歌像一场雨中的低空漫游",
};

export function buildMomentAnnotation(options: {
  strategy: Strategy;
  momentText: string;
  boxCopy?: string;
  timbre?: import("@/types").TimbreProfile;
  genre?: string;
}): string {
  const opening = ANNOTATION_OPENING[options.strategy];
  const feel = options.timbre?.listeningFeel?.replace(/[。；]$/, "") || "";
  const beat = options.timbre?.beatStyle?.replace(/[。；]$/, "") || "";
  const hint = options.timbre?.atmosphereHint?.replace(/[。；]$/, "") || "";

  const isRainy = /雨|湿|闷|阴/.test(
    `${options.momentText} ${options.boxCopy || ""}`,
  );

  if (options.strategy === "serendipity" && isRainy) {
    return `${opening}。湿润的空气、克制的电子颗粒和缓慢推进的节拍，让沉闷不再只是下坠，也开始有了向前的方向。`;
  }

  if (feel && beat) {
    return `${opening}。${feel}，${beat}，回应你此刻${hint ? `「${hint}」` : "的心境"}。`;
  }

  return `${opening}。它用克制的旋律与留白，把当下灵感轻轻托住，不必解释，只需聆听。`;
}

export function buildMoodIntro(momentText: string, maxLen = 24): string {
  const trimmed = momentText.trim();
  if (!trimmed) return "此刻，雨还在下";
  if (trimmed.length <= maxLen) return trimmed;

  const cut = trimmed.slice(0, maxLen);
  const lastPause = Math.max(cut.lastIndexOf("，"), cut.lastIndexOf("。"));
  if (lastPause > 8) return cut.slice(0, lastPause);
  return `${cut}…`;
}
