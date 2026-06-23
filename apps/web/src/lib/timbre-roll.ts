import type { MomentAnalysis, Strategy, TimbreProfile } from "@/types";

export type { TimbreProfile };

type MoodContext =
  | "rain"
  | "city"
  | "warm"
  | "quiet"
  | "night"
  | "release"
  | "default";

interface TimbreLayerOption {
  name: string;
  moods: MoodContext[];
  weight?: number;
}

const SYNC_POOL: TimbreLayerOption[] = [
  { name: "柔和钢琴", moods: ["rain", "quiet", "night", "default"], weight: 3 },
  { name: "雨声采样", moods: ["rain", "quiet", "default"], weight: 2 },
  { name: "环境 Pad", moods: ["rain", "quiet", "night", "default"], weight: 2 },
  { name: "低频氛围铺底", moods: ["quiet", "night", "city", "default"], weight: 2 },
  { name: "木质打击乐", moods: ["warm", "quiet", "default"] },
  { name: "远处环境声", moods: ["rain", "city", "night", "default"] },
  { name: "呼吸感合成器", moods: ["quiet", "night", "default"], weight: 2 },
];

const TRANSITION_POOL: TimbreLayerOption[] = [
  { name: "暖合成器", moods: ["warm", "rain", "city", "default"], weight: 3 },
  { name: "Lo-fi 鼓点", moods: ["warm", "city", "default"], weight: 2 },
  { name: "柔和贝斯", moods: ["warm", "quiet", "default"], weight: 2 },
  { name: "弦乐铺底", moods: ["warm", "rain", "quiet", "default"], weight: 2 },
  { name: "模糊电钢琴", moods: ["warm", "rain", "night", "default"] },
  { name: "城市灯光感音色", moods: ["city", "rain", "night", "default"], weight: 2 },
  { name: "轻微上行和声", moods: ["warm", "release", "default"] },
];

const SERENDIPITY_POOL: TimbreLayerOption[] = [
  { name: "电子颗粒", moods: ["city", "rain", "release", "default"], weight: 3 },
  { name: "Future Garage 节拍", moods: ["city", "night", "release", "default"], weight: 2 },
  { name: "Chill Electronic 合成器", moods: ["city", "release", "default"], weight: 2 },
  { name: "轻微霓虹音色", moods: ["city", "night", "default"], weight: 2 },
  { name: "城市夜行环境声", moods: ["city", "rain", "night", "default"], weight: 2 },
  { name: "明亮高频点缀", moods: ["release", "warm", "default"] },
  { name: "流动感鼓组", moods: ["city", "release", "default"] },
];

const STRATEGY_META: Record<
  Strategy,
  {
    pool: TimbreLayerOption[];
    label: string;
    listeningFeel: string;
    atmosphereSuffix: string;
    beatStyle: string;
    genreHint: string;
    layerCount: number;
  }
> = {
  sync: {
    pool: SYNC_POOL,
    label: "清冷钢琴音色",
    listeningFeel: "安静、停留、被安放",
    atmosphereSuffix: "同频陪伴",
    beatStyle: "弱节拍或无节拍",
    genreHint: "Ambient Piano · Rain Texture",
    layerCount: 3,
  },
  transition: {
    pool: TRANSITION_POOL,
    label: "暖调合成器音色",
    listeningFeel: "灵感慢慢转暖、微微上扬",
    atmosphereSuffix: "微微上扬",
    beatStyle: "轻鼓点、柔和律动",
    genreHint: "Lo-fi · Warm Synth",
    layerCount: 4,
  },
  serendipity: {
    pool: SERENDIPITY_POOL,
    label: "电子颗粒音色",
    listeningFeel: "流动、意外、从灵感中走出来",
    atmosphereSuffix: "意外相逢",
    beatStyle: "细碎电子节拍、流动鼓组",
    genreHint: "Chill Electronic · Future Garage",
    layerCount: 4,
  },
};

function detectMoodContexts(analysis: MomentAnalysis): MoodContext[] {
  const hay = `${analysis.text} ${analysis.caption || ""} ${analysis.summary} ${analysis.imagery.join(" ")} ${analysis.mood_tags.join(" ")}`;
  const contexts = new Set<MoodContext>(["default"]);

  if (/雨|湿|淋|雾/.test(hay)) contexts.add("rain");
  if (/城|街|路|灯|霓虹|地铁|车窗|红灯|绿灯/.test(hay)) contexts.add("city");
  if (/暖|温|热|光|亮/.test(hay)) contexts.add("warm");
  if (/静|慢|空|安|蜷|停/.test(hay)) contexts.add("quiet");
  if (/夜|晚|暮/.test(hay)) contexts.add("night");
  if (/走|行|出发|风|步/.test(hay)) contexts.add("release");

  return Array.from(contexts);
}

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickLayers(
  pool: TimbreLayerOption[],
  moods: MoodContext[],
  count: number,
  seed: number,
): string[] {
  const scored = pool
    .map((item, index) => {
      const moodMatch = item.moods.some((m) => moods.includes(m)) ? 2 : 0;
      const weight = item.weight ?? 1;
      const roll = (seed + index * 17) % 100;
      return { item, score: moodMatch * 10 + weight * 3 + (roll % 5) };
    })
    .sort((a, b) => b.score - a.score);

  const chosen: string[] = [];
  for (const entry of scored) {
    if (chosen.length >= count) break;
    if (!chosen.includes(entry.item.name)) {
      chosen.push(entry.item.name);
    }
  }

  while (chosen.length < count && chosen.length < pool.length) {
    const idx = (seed + chosen.length * 7) % pool.length;
    const name = pool[idx].name;
    if (!chosen.includes(name)) chosen.push(name);
  }

  return chosen;
}

function buildAtmosphereHint(
  analysis: MomentAnalysis,
  strategy: Strategy,
  label: string,
  seed: number,
): string {
  const hay = `${analysis.text || ""} ${analysis.imagery.join(" ")} ${analysis.summary}`;
  const place: string[] = [];
  if (/雨|湿|雾/.test(hay)) place.push("雨幕里");
  else if (/窗|车/.test(hay)) place.push("车窗边");
  else if (/城|街|灯/.test(hay)) place.push("城市里");
  else if (/夜|晚/.test(hay)) place.push("夜色中");

  const feels: Record<Strategy, string[]> = {
    sync: ["安静停靠", "被轻轻安放", "同频陪伴", "停在这一刻"],
    transition: ["慢慢转暖", "微微上扬", "光渐进来", "灵感松动"],
    serendipity: ["意外相逢", "流动起色", "走出雨幕", "重新出发"],
  };

  const feel = feels[strategy][seed % feels[strategy].length];
  const short = label.replace(/音色$/, "");
  return place.length ? `${short} · ${place[0]}${feel}` : `${short} · ${feel}`;
}

function buildLabelFromLayers(strategy: Strategy, layers: string[]): string {
  const primary = layers[0] || "";
  if (/钢琴|电钢琴/.test(primary)) return "清冷钢琴音色";
  if (/暖合成|弦乐|贝斯/.test(primary)) return "暖调合成器音色";
  if (/颗粒|电子|霓虹|Garage/.test(primary)) return "电子颗粒音色";
  if (/Pad|环境|呼吸/.test(primary)) return "空气感音色";
  return STRATEGY_META[strategy].label;
}

export function rollTimbreProfile(
  analysis: MomentAnalysis,
  strategy: Strategy,
  salt = "",
): TimbreProfile {
  const meta = STRATEGY_META[strategy];
  const moods = detectMoodContexts(analysis);
  const seed = hashSeed(`${analysis.momentId}:${strategy}:${salt}:${analysis.summary}`);

  const layers = pickLayers(meta.pool, moods, meta.layerCount, seed);
  const label = buildLabelFromLayers(strategy, layers);

  return {
    label,
    layers,
    listeningFeel: meta.listeningFeel,
    atmosphereHint: buildAtmosphereHint(analysis, strategy, label, seed),
    beatStyle: meta.beatStyle,
    genreHint: meta.genreHint,
  };
}

export function assignTimbresForBoxes(
  analysis: MomentAnalysis,
): Record<Strategy, TimbreProfile> {
  const strategies: Strategy[] = ["sync", "transition", "serendipity"];
  const usedLayerSets = new Set<string>();

  const result = {} as Record<Strategy, TimbreProfile>;

  for (const strategy of strategies) {
    let attempt = 0;
    let profile: TimbreProfile;

    do {
      profile = rollTimbreProfile(analysis, strategy, `${attempt}`);
      attempt += 1;
    } while (
      usedLayerSets.has(profile.layers.join("|")) &&
      attempt < 8
    );

    usedLayerSets.add(profile.layers.join("|"));
    result[strategy] = profile;
  }

  return result;
}

export function formatTimbreForMusicPrompt(profile: TimbreProfile): string {
  return [
    `音色编曲：${profile.layers.join("、")}`,
    `节拍特征：${profile.beatStyle}`,
    `听感方向：${profile.listeningFeel}`,
    `曲风参考：${profile.genreHint}`,
  ].join("。");
}
