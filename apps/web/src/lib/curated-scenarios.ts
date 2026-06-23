import type { DrawResult, MomentAnalysis, Strategy, TimbreProfile } from "@/types";
import { v4 as uuidv4 } from "uuid";

export type CuratedScenarioId = "rain-streetlight" | "sunset-cloud";

export interface CuratedScenarioMeta {
  id: CuratedScenarioId;
  title: string;
  tagline: string;
  description: string;
  coverImageUrl: string;
  songId: string;
}

export interface CuratedScenario extends CuratedScenarioMeta {
  momentText: string;
  caption: string;
  imageDataUrl: string;
  displayLyrics: string[];
  openCopy: [string, string];
  genre: string;
  tempo: string;
  moodTags: string[];
  boxCopies: Record<Strategy, string>;
  boxTitles: Record<Strategy, string>;
  timbres: Record<Strategy, TimbreProfile>;
}

const RAIN_TIMBRES: Record<Strategy, TimbreProfile> = {
  sync: {
    label: "电子颗粒音色",
    layers: ["City Pop 合成器", "Future Garage 底鼓", "雨声采样"],
    listeningFeel: "安静停靠 · 车窗边同频陪伴",
    atmosphereHint: "电子颗粒 · 雨幕里安静停靠",
    beatStyle: "慢板 · 呼吸留白",
    genreHint: "Electronic · City Pop · Future Garage",
  },
  transition: {
    label: "暖调合成器音色",
    layers: ["暖合成器", "Lo-fi 鼓点", "街灯氛围 Pad"],
    listeningFeel: "慢慢转暖 · 光渐进来",
    atmosphereHint: "暖调合成 · 城市里慢慢转暖",
    beatStyle: "慢板 · 呼吸留白",
    genreHint: "Electronic · City Pop · Future Garage",
  },
  serendipity: {
    label: "霓虹流动音色",
    layers: ["Future Garage 颗粒", "City Pop 和声", "城市夜行采样"],
    listeningFeel: "意外相逢 · 走出雨幕",
    atmosphereHint: "霓虹流动 · 夜色中意外相逢",
    beatStyle: "慢板 · 呼吸留白",
    genreHint: "Electronic · City Pop · Future Garage",
  },
};

const SUNSET_TIMBRES: Record<Strategy, TimbreProfile> = {
  sync: {
    label: "空气感音色",
    layers: ["柔和钢琴", "环境 Pad", "晚风采样"],
    listeningFeel: "安静停靠 · 屋顶上同频陪伴",
    atmosphereHint: "空气感 · 火烧云下安静停靠",
    beatStyle: "慢板 · 留白",
    genreHint: "Ambient · Indie · Warm Pop",
  },
  transition: {
    label: "暖调合成器音色",
    layers: ["暖合成器", "弦乐铺底", "轻鼓点"],
    listeningFeel: "慢慢转暖 · 云后面有光",
    atmosphereHint: "暖调合成 · 橘粉云里慢慢转暖",
    beatStyle: "中速 · 轻柔",
    genreHint: "Indie Pop · Warm Synth",
  },
  serendipity: {
    label: "电子颗粒音色",
    layers: ["电子 Pad", "颗粒节拍", "城市晚风"],
    listeningFeel: "意外相逢 · 云替你庆祝",
    atmosphereHint: "电子颗粒 · 屋顶上意外相逢",
    beatStyle: "中速 · 流动",
    genreHint: "Electronic · Dream Pop",
  },
};

export const CURATED_SCENARIOS: Record<CuratedScenarioId, CuratedScenario> = {
  "rain-streetlight": {
    id: "rain-streetlight",
    title: "雨后街灯",
    tagline: "踩过水花，街灯重新亮起",
    description: "阴雨天的午后坐在车里，雨滴密密麻麻贴在车窗上",
    coverImageUrl: "/preview/rain-streetlight.png",
    imageDataUrl: "/preview/rain-streetlight.png",
    songId: "curated-rain-streetlight-01",
    momentText: "阴雨天的午后坐在车里，雨滴密密麻麻贴在车窗上",
    caption: "隔着雨窗看城市，所有人和光都慢下来",
    displayLyrics: [
      "踩过水花，街灯重新亮起",
      "雨还在下，城市慢慢安静",
      "车窗上的光，像散落的星",
      "把今天的心事，交给夜风",
    ],
    openCopy: [
      "隔着雨窗看城市，所有人和光都慢下来。",
      "踩过水花，街灯重新亮起。",
    ],
    genre: "electronic",
    tempo: "slow",
    moodTags: ["rain", "urban", "night", "quiet", "melancholy", "city"],
    boxCopies: {
      sync: "踩过水花，街灯重新亮起",
      transition: "雨还在下，城市慢慢安静",
      serendipity: "车窗上的光，像散落的星",
    },
    boxTitles: {
      sync: "雨后街灯",
      transition: "雨夜慢行",
      serendipity: "车窗星点",
    },
    timbres: RAIN_TIMBRES,
  },
  "sunset-cloud": {
    id: "sunset-cloud",
    title: "天边的火烧云",
    tagline: "云替你庆祝，今天值得被记住",
    description: "城市屋顶上撞见漫天橘粉火烧云的傍晚",
    coverImageUrl: "/preview/sunset-cloud.png",
    imageDataUrl: "/preview/sunset-cloud.png",
    songId: "curated-sunset-cloud-01",
    momentText: "城市屋顶上撞见漫天橘粉火烧云的傍晚，今天看到了天边的火烧云心情大好",
    caption: "平凡屋顶之上撞见一场热烈奔放的火烧云",
    displayLyrics: [
      "平凡屋顶之上撞见一场热烈奔放的火烧云",
      "城市屋顶上撞见漫天橘粉火烧云的傍晚",
      "今天看到了天边的火烧云心情大好",
      "云替你庆祝，今天值得被记住",
    ],
    openCopy: [
      "平凡屋顶之上撞见一场热烈奔放的火烧云。",
      "云替你庆祝，今天值得被记住。",
    ],
    genre: "indie",
    tempo: "medium",
    moodTags: ["sky", "cloud", "warm", "sunset", "hope", "bright"],
    boxCopies: {
      sync: "云替你庆祝，今天值得被记住",
      transition: "橘粉火烧云铺满傍晚",
      serendipity: "屋顶之上撞见热烈的云",
    },
    boxTitles: {
      sync: "天边的火烧云",
      transition: "橘粉傍晚",
      serendipity: "屋顶 celebration",
    },
    timbres: SUNSET_TIMBRES,
  },
};

function buildAnalysis(scenario: CuratedScenario): MomentAnalysis {
  const image = scenario.coverImageUrl;
  return {
    momentId: uuidv4(),
    text: scenario.momentText,
    caption: scenario.caption,
    imageDataUrl: image,
    mood_tags: scenario.moodTags,
    scene: scenario.title,
    scene_tags: scenario.id === "rain-streetlight" ? ["rain", "urban"] : ["sky", "sunset"],
    tempo_hint: scenario.tempo,
    imagery: scenario.displayLyrics.slice(0, 3),
    summary: scenario.momentText,
    song_title: scenario.title,
  };
}

export function buildCuratedDrawResult(scenarioId: CuratedScenarioId): DrawResult {
  const scenario = CURATED_SCENARIOS[scenarioId];
  const analysis = buildAnalysis(scenario);
  const strategy: Strategy = "sync";

  const boxes: DrawResult["boxes"] = [
    {
      id: uuidv4(),
      copy: scenario.tagline,
      songTitle: scenario.title,
      atmosphereHint: scenario.timbres[strategy].atmosphereHint,
      timbre: scenario.timbres[strategy],
      strategy,
      songId: scenario.songId,
      matchScore: 99,
    },
  ];

  return {
    momentId: analysis.momentId,
    boxes,
    analysis,
    source: "curated",
    scenarioId,
    singleBox: true,
  };
}

export function isCuratedDrawResult(result: DrawResult): boolean {
  return result.source === "curated" && Boolean(result.scenarioId);
}

export function getCuratedScenario(
  scenarioId?: string | null,
): CuratedScenario | undefined {
  if (!scenarioId) return undefined;
  return CURATED_SCENARIOS[scenarioId as CuratedScenarioId];
}
