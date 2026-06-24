import {
  buildMultimodalUserContent,
  chatCompletion,
  hasMiniMaxTextKey,
  hasOpenAITextKey,
  parseJsonContent,
} from "@/lib/minimax-text";
import {
  assignDefaultSections,
  buildLyricStartFractions,
  parseLyricText,
  toMiniMaxLyrics,
  type LyricSection,
} from "@/lib/lyric-sync";
import type { MomentAnalysis, Strategy, TimbreProfile } from "@/types";

export interface LyricsPackage {
  displayLines: string[];
  structuredForMusic: string;
  sections: LyricSection[];
  lyricTimings: number[];
}

interface SceneRule {
  keywords: string[];
  scene: string;
  scene_tags: string[];
  mood_tags: string[];
  imagery: string[];
  tempo_hint: string;
}

const SCENE_RULES: SceneRule[] = [
  {
    keywords: ["下雨", "雨", "面", "面条", "汤面"],
    scene: "雨夜的小确幸",
    scene_tags: ["rain_food", "daily_life"],
    mood_tags: ["rain", "comfort", "warm", "urban", "quiet"],
    imagery: ["雨", "热气", "面", "窗"],
    tempo_hint: "slow",
  },
  {
    keywords: ["汇报", "答辩", "开会", "工作", "加班", "不开心", "没开心"],
    scene: "完成后的空落",
    scene_tags: ["work_stress", "anticlimax"],
    mood_tags: ["tired", "empty", "office", "melancholy", "flat"],
    imagery: ["办公室", "灯", "空白", "夜"],
    tempo_hint: "slow",
  },
  {
    keywords: ["地铁", "旧友", "朋友", "像", "车厢"],
    scene: "错身而过的相似",
    scene_tags: ["subway_memory", "nostalgia"],
    mood_tags: ["nostalgia", "subway", "memory", "quiet", "passing"],
    imagery: ["地铁", "侧脸", "人群", "窗口"],
    tempo_hint: "medium",
  },
  {
    keywords: ["什么都没", "没发生", "普通", "平淡", "空白"],
    scene: "什么都没发生的一天",
    scene_tags: ["nothing_day", "flat_mood"],
    mood_tags: ["empty", "calm", "flat", "quiet", "still"],
    imagery: ["空白", "房间", "下午", "静"],
    tempo_hint: "slow",
  },
  {
    keywords: ["做完", "拖", "终于", "完成", "搞定"],
    scene: "拖延后的释放",
    scene_tags: ["task_done", "relief"],
    mood_tags: ["release", "relief", "done", "tired", "satisfied"],
    imagery: ["完成", "呼气", "桌", "亮"],
    tempo_hint: "medium",
  },
  {
    keywords: ["末班", "深夜", "夜", "回家", "下班"],
    scene: "深夜归途",
    scene_tags: ["late_night", "commute"],
    mood_tags: ["night", "subway", "lonely", "city", "tired"],
    imagery: ["末班", "地铁", "路灯", "夜"],
    tempo_hint: "slow",
  },
  {
    keywords: ["咖啡", "早晨", "早", "醒"],
    scene: "还没完全醒来的早晨",
    scene_tags: ["morning", "daily_life"],
    mood_tags: ["morning", "coffee", "calm", "sleepy", "soft"],
    imagery: ["咖啡", "窗", "光", "慢"],
    tempo_hint: "slow",
  },
  {
    keywords: ["猫", "狗", "宠物"],
    scene: "房间里的陪伴",
    scene_tags: ["pet", "home"],
    mood_tags: ["pet", "warm", "home", "calm", "cozy"],
    imagery: ["猫", "房间", "暖", "静"],
    tempo_hint: "slow",
  },
  {
    keywords: ["天空", "云", "夕阳", "海"],
    scene: "抬头看见的开阔",
    scene_tags: ["sky", "nature"],
    mood_tags: ["sky", "cloud", "calm", "open", "free"],
    imagery: ["天空", "云", "风", "蓝"],
    tempo_hint: "slow",
  },
  {
    keywords: ["小吃", "街", "摊", "烤", "火锅", "饭"],
    scene: "街角的热气",
    scene_tags: ["street_food", "daily_life"],
    mood_tags: ["food", "street", "warm", "night", "simple"],
    imagery: ["小吃", "烟火", "街角", "热"],
    tempo_hint: "medium",
  },
];

const DEFAULT_SCENE: SceneRule = {
  keywords: [],
  scene: "今天的一个瞬间",
  scene_tags: ["daily_life"],
  mood_tags: ["calm", "quiet", "reflective", "gentle"],
  imagery: ["此刻", "风", "光"],
  tempo_hint: "medium",
};

const BOX_COPY: Record<
  Strategy,
  (scene: string, imagery: string[]) => string[]
> = {
  sync: (scene, imagery) => [
    `${imagery[0] || "这一刻"}还在，心也还在这里。`,
    `${scene}，不需要被立刻治愈。`,
    `有些感受，先陪它坐一会儿。`,
    `雨没有停，但心里亮了一小块。`,
    `今天就这样，也很好。`,
  ],
  transition: (scene, imagery) => [
    `有些好心情，不需要晴天证明。`,
    `${imagery[0] || "风"}会替你把心事翻页。`,
    `${scene}之后，还有一点点亮。`,
    `先别急着要求自己立刻开心。`,
    `把步子交给下一阵温柔的风。`,
  ],
  serendipity: (scene, imagery) => [
    `城市湿漉漉的，你刚好冒着热气。`,
    `意外来的回应，却刚好贴在这一刻。`,
    `${imagery[0] || "日常"}也可以变成一段小梦境。`,
    `你以为只会是一种方式，音乐却换了一个角度。`,
    `${scene}，也可以有 unexpected 的节拍。`,
  ],
};

const ANALYZE_SYSTEM_PROMPT =
  '你是中文灵感理解引擎。根据用户瞬间（文字与可选图片），输出 JSON：{"mood_tags":[],"scene":"","scene_tags":[],"tempo_hint":"slow|medium|fast","imagery":[],"summary":"","music_prompt":"给 AI 音乐模型的中文风格描述，强调旋律性与歌唱性，含曲风、灵感、场景、乐器","lyrics_hint":"歌词主题方向，一两句","song_title":"4-8字歌名","box_copies":{"sync":"","transition":"","serendipity":""},"box_song_titles":{"sync":"","transition":"","serendipity":""}}。box_copies：三句各不超过15字，结构对仗，紧扣图文。box_song_titles：必须从用户原始文字中提炼场景/灵感/意象造歌名（6-12字），禁止空泛拼接如「X慢歌」「偶遇Y」。sync=安放型（安静停留被接住），transition=转暖型（可沿用用户原句如「雨声渐远，灯也将暖」），serendipity=释放型（城市微光重新出发）。';

const OPEN_COPY_SYSTEM_PROMPT =
  '你是「MuseBox灵感音匣」开盒文案写手。根据用户瞬间（文字与可选图片）写2句诗意短句作为歌词卡片文案，不煽情、不鸡汤。输出 JSON：{"line1":"","line2":""}';

const SONG_LYRICS_SYSTEM_PROMPT =
  '你是中文流行歌曲作词人。歌词必须紧扣：用户原始文字、图片氛围、以及用户选中的音匣提示语。总时长适合60-90秒演唱。输出 JSON：{"lyrics":"完整歌词"}。格式示例：[Verse]\\n完整句1\\n完整句2\\n[Chorus]\\n完整句3\\n完整句4\\n[Verse]\\n完整句5\\n[Chorus]\\n完整句6。要求：可见歌词5-8行（不含段落标签）；每行8-12个汉字且必须是语义完整的句子，禁止截断半句话或硬拼片段；至少两组句末押韵；口语自然、可演唱，禁止朗诵腔和病句。';

function trimCopy(text: string, max = 15): string {
  const chars = Array.from(text.trim());
  return chars.slice(0, max).join("");
}

function trimLyricLine(text: string, max = 12): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const chars = Array.from(trimmed);
  if (chars.length <= max) return trimmed;

  const sliced = chars.slice(0, max).join("");
  const punctIndex = Math.max(
    sliced.lastIndexOf("，"),
    sliced.lastIndexOf("。"),
    sliced.lastIndexOf("、"),
    sliced.lastIndexOf("；"),
  );

  if (punctIndex >= 4) {
    return sliced.slice(0, punctIndex).replace(/[，。、；]$/, "");
  }

  return sliced;
}

function pickUniqueLines(candidates: string[], minLines: number, maxLines: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of candidates) {
    const line = trimLyricLine(raw);
    if (!line || line.length < 4) continue;
    const key = line.replace(/\s+/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(line);
    if (result.length >= maxLines) break;
  }

  while (result.length < minLines && candidates.length > 0) {
    const fallback = trimLyricLine(candidates[result.length % candidates.length]);
    const key = fallback.replace(/\s+/g, "");
    if (fallback && !seen.has(key)) {
      seen.add(key);
      result.push(fallback);
    } else {
      break;
    }
  }

  return result;
}

function trimTitle(text: string, max = 12): string {
  const chars = Array.from(text.trim().replace(/[《》]/g, ""));
  return chars.slice(0, max).join("");
}

function extractTextFragments(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];

  const parts = cleaned
    .split(/[，。；、！？\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);

  return parts.length ? parts : [cleaned.slice(0, 12)];
}

function buildGroundedSongTitles(
  analysis: MomentAnalysis,
): Record<Strategy, string> {
  const text = analysis.text?.trim() || analysis.summary || "";
  const imagery =
    analysis.imagery.length > 0
      ? analysis.imagery
      : extractTextFragments(text);
  const fragments = extractTextFragments(text);
  const haystack = `${text} ${imagery.join(" ")}`;

  const syncAnchor = /雨|雨幕/.test(haystack)
    ? "雨幕"
    : /夜|晚/.test(haystack)
      ? "夜色"
      : /窗|车/.test(haystack)
        ? "车窗"
        : imagery[0] || fragments[0] || analysis.scene || "此刻";

  const sync = trimTitle(`${syncAnchor}里暂时停靠`);

  let transition = "";
  const leadLine = text.split(/[。！？]/)[0]?.trim() || "";
  if (leadLine.includes("，") && leadLine.length <= 12) {
    transition = trimTitle(leadLine);
  } else if (fragments.length >= 2) {
    const joined = `${fragments[0]}，${fragments[1]}`;
    transition = trimTitle(joined.length <= 12 ? joined : fragments[1]);
  } else {
    const warmWord =
      fragments.find((f) => /暖|灯|光|远/.test(f)) ||
      imagery.find((i) => /暖|灯|光/.test(i)) ||
      "灯光";
    transition = trimTitle(`${warmWord}渐远，也将暖`);
  }

  const hasWindow = /车窗|窗/.test(haystack);
  const hasCity = /城市|街|路|红灯|绿灯/.test(haystack);
  const lightWord = /微光/.test(haystack)
    ? "城市微光"
    : /灯/.test(haystack)
      ? "城市灯光"
      : `${imagery.find((i) => /光|灯|城/.test(i)) || "微光"}`;

  const serendipity = hasWindow
    ? trimTitle(`隔着车窗的${hasCity ? "城市微光" : lightWord}`)
    : hasCity
      ? trimTitle(`路过的${lightWord}`)
      : trimTitle(`遇见${imagery[0] || fragments[0] || "微光"}`);

  return { sync, transition, serendipity };
}

function normalizeBoxSongTitles(
  raw: Partial<Record<Strategy, string>> | undefined,
): Record<Strategy, string> | undefined {
  if (!raw?.sync || !raw.transition || !raw.serendipity) {
    return undefined;
  }

  return {
    sync: trimTitle(raw.sync),
    transition: trimTitle(raw.transition),
    serendipity: trimTitle(raw.serendipity),
  };
}
function normalizeBoxCopies(
  raw: Partial<Record<Strategy, string>> | undefined,
): Record<Strategy, string> | undefined {
  if (!raw?.sync || !raw.transition || !raw.serendipity) {
    return undefined;
  }

  return {
    sync: trimCopy(raw.sync),
    transition: trimCopy(raw.transition),
    serendipity: trimCopy(raw.serendipity),
  };
}

function matchScene(text: string, caption?: string): SceneRule {
  const combined = `${text} ${caption || ""}`.toLowerCase();

  let best = DEFAULT_SCENE;
  let bestScore = 0;

  for (const rule of SCENE_RULES) {
    const score = rule.keywords.reduce(
      (acc, keyword) => (combined.includes(keyword) ? acc + 1 : acc),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }

  return best;
}

function pickCopy(
  strategy: Strategy,
  scene: string,
  imagery: string[],
  seed: string,
): string {
  const options = BOX_COPY[strategy](scene, imagery);
  const index =
    Math.abs(seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) %
    options.length;
  return options[index];
}

export function analyzeMoment(
  momentId: string,
  text = "",
  caption?: string,
  imageDataUrl?: string,
): MomentAnalysis {
  const sceneRule = matchScene(text, caption);
  const summary = text.trim() || caption?.trim() || "今天的一个瞬间";

  const imageMood =
    imageDataUrl && !text.trim()
      ? ["visual", "ambient", "soft"]
      : imageDataUrl
        ? ["visual", "layered"]
        : [];

  return {
    momentId,
    text: text.trim(),
    caption: caption?.trim(),
    imageDataUrl,
    mood_tags: Array.from(new Set([...sceneRule.mood_tags, ...imageMood])),
    scene: sceneRule.scene,
    scene_tags: sceneRule.scene_tags,
    tempo_hint: sceneRule.tempo_hint,
    imagery: sceneRule.imagery,
    summary,
  };
}

export function generateBoxCopies(analysis: MomentAnalysis): Record<
  Strategy,
  string
> {
  if (analysis.box_copies) {
    const normalized = normalizeBoxCopies(analysis.box_copies);
    if (normalized) return normalized;
  }

  const seed = analysis.momentId + analysis.summary;
  return {
    sync: trimCopy(pickCopy("sync", analysis.scene, analysis.imagery, seed + "sync")),
    transition: trimCopy(
      pickCopy("transition", analysis.scene, analysis.imagery, seed + "transition"),
    ),
    serendipity: trimCopy(
      pickCopy("serendipity", analysis.scene, analysis.imagery, seed + "serendipity"),
    ),
  };
}

export function generateBoxSongTitles(
  analysis: MomentAnalysis,
): Record<Strategy, string> {
  if (analysis.box_song_titles) {
    const normalized = normalizeBoxSongTitles(analysis.box_song_titles);
    if (normalized) return normalized;
  }

  return buildGroundedSongTitles(analysis);
}

interface AnalyzeJson {
  mood_tags?: string[];
  scene?: string;
  scene_tags?: string[];
  tempo_hint?: string;
  imagery?: string[];
  summary?: string;
  music_prompt?: string;
  lyrics_hint?: string;
  song_title?: string;
  box_copies?: Partial<Record<Strategy, string>>;
  box_song_titles?: Partial<Record<Strategy, string>>;
}

interface OpenCopyJson {
  line1?: string;
  line2?: string;
}

interface SongLyricsJson {
  lyrics?: string;
}

const BOX_COPIES_SYSTEM_PROMPT =
  '你是「MuseBox灵感音匣」盲盒文案写手。根据用户瞬间（文字与可选图片），为三种策略各写一句盲盒提示语。输出 JSON：{"sync":"","transition":"","serendipity":""}。要求：每句不超过15字（含标点）；三句结构对仗一致；紧扣用户图文；sync=同频陪伴当下，transition=微微上扬，serendipity=意外但相关。';

const BOX_SONG_TITLES_SYSTEM_PROMPT =
  '你是「MuseBox灵感音匣」歌名策划。根据用户原始文字（及可选图片），为三种音乐命运各起一个6-12字歌名，必须像真正的歌名，而非关键词拼接。输出 JSON：{"sync":"","transition":"","serendipity":""}。规则：1)优先使用用户原句、场景、灵感、意象（如雨声、灯、车窗、城市微光）；2)禁止「X慢歌」「X渐暖」「偶遇X」等空泛模板；3)sync=安放型（安静停留被接住），transition=转暖型（灯光微暖灵感松动，可沿用用户句如「雨声渐远，灯也将暖」），serendipity=释放型（城市微光重新出发）。好例子：《雨幕里暂时停靠》《雨声渐远，灯也将暖》《隔着车窗的城市微光》。坏例子：《滑落的雨珠慢歌》《模糊的红绿灯渐暖》。';

export async function generateBlindBoxSongTitles(
  analysis: MomentAnalysis,
): Promise<Record<Strategy, string> | undefined> {
  if (!hasMiniMaxTextKey() && !hasOpenAITextKey()) {
    return undefined;
  }

  const result = await chatCompletion({
    jsonMode: true,
    messages: [
      { role: "system", content: BOX_SONG_TITLES_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildMultimodalUserContent(
          {
            text: analysis.text,
            caption: analysis.caption,
            summary: analysis.summary,
            scene: analysis.scene,
            imagery: analysis.imagery,
          },
          analysis.imageDataUrl,
          "从用户原始文字提炼三个歌名：安放型、转暖型、释放型，必须像真歌名",
        ),
      },
    ],
  });

  if (!result) return undefined;
  const parsed = parseJsonContent<Partial<Record<Strategy, string>>>(result.content);
  return normalizeBoxSongTitles(parsed ?? undefined);
}

export async function generateBlindBoxCopies(
  analysis: MomentAnalysis,
): Promise<Record<Strategy, string> | undefined> {
  if (!hasMiniMaxTextKey() && !hasOpenAITextKey()) {
    return undefined;
  }

  const result = await chatCompletion({
    jsonMode: true,
    messages: [
      { role: "system", content: BOX_COPIES_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildMultimodalUserContent(
          {
            text: analysis.text,
            caption: analysis.caption,
            summary: analysis.summary,
            scene: analysis.scene,
            imagery: analysis.imagery,
          },
          analysis.imageDataUrl,
          "生成三句对仗盲盒提示语",
        ),
      },
    ],
  });

  if (!result) return undefined;
  const parsed = parseJsonContent<Partial<Record<Strategy, string>>>(result.content);
  return normalizeBoxCopies(parsed ?? undefined);
}

export async function analyzeMomentWithLLM(
  momentId: string,
  text = "",
  caption?: string,
  imageDataUrl?: string,
): Promise<MomentAnalysis> {
  if (!hasMiniMaxTextKey() && !hasOpenAITextKey()) {
    return analyzeMoment(momentId, text, caption, imageDataUrl);
  }

  const result = await chatCompletion({
    jsonMode: true,
    messages: [
      { role: "system", content: ANALYZE_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildMultimodalUserContent(
          { text, caption },
          imageDataUrl,
          "结合文字与图片理解用户此刻的灵感瞬间，输出 JSON",
        ),
      },
    ],
  });

  if (!result) {
    return analyzeMoment(momentId, text, caption, imageDataUrl);
  }

  const parsed = parseJsonContent<AnalyzeJson>(result.content);
  if (!parsed) {
    return analyzeMoment(momentId, text, caption, imageDataUrl);
  }

  const base = analyzeMoment(momentId, text, caption, imageDataUrl);

  return {
    ...base,
    mood_tags: parsed.mood_tags?.length ? parsed.mood_tags : base.mood_tags,
    scene: parsed.scene || base.scene,
    scene_tags: parsed.scene_tags?.length ? parsed.scene_tags : base.scene_tags,
    tempo_hint: parsed.tempo_hint || base.tempo_hint,
    imagery: parsed.imagery?.length ? parsed.imagery : base.imagery,
    summary: parsed.summary || base.summary,
    music_prompt: parsed.music_prompt,
    lyrics_hint: parsed.lyrics_hint,
    song_title: parsed.song_title,
    box_copies: normalizeBoxCopies(parsed.box_copies),
    box_song_titles: normalizeBoxSongTitles(parsed.box_song_titles),
  };
}

const STRATEGY_MUSIC_HINT: Record<Strategy, string> = {
  sync: "同频策略：如实陪伴当下灵感，旋律舒缓有呼吸感，不强行治愈",
  transition: "转场策略：同一主题下灵感微微上扬，副歌旋律更明亮",
  serendipity: "偶遇策略：曲风可意外但画面一致，旋律仍需可歌唱、有起伏",
};

const TEMPO_LABEL: Record<string, string> = {
  slow: "慢板",
  medium: "中速",
  fast: "快板",
};

export function buildCompactMusicPrompt(
  analysis: MomentAnalysis,
  strategy: Strategy,
  boxCopy?: string,
  timbre?: TimbreProfile,
): string {
  const mood =
    analysis.mood_tags?.slice(0, 2).join("、") ||
    analysis.summary?.slice(0, 24) ||
    "灵感瞬间";
  const genre = timbre?.genreHint?.split(" · ")[0] || "流行";
  const instrument = timbre?.layers?.[0] || "";
  const box = boxCopy?.trim().slice(0, 24) || "";
  const strategyHint =
    strategy === "sync"
      ? "安静陪伴"
      : strategy === "transition"
        ? "灵感转暖"
        : "轻快偶遇";

  return [genre, mood, instrument, box, strategyHint, "中文流行，旋律上口"]
    .filter(Boolean)
    .join("，");
}

export function buildMusicPrompt(
  analysis: MomentAnalysis,
  strategy: Strategy,
  boxCopy?: string,
  timbre?: TimbreProfile,
): string {
  const tempo = TEMPO_LABEL[analysis.tempo_hint] || "中速";
  const imagery = analysis.imagery.slice(0, 3).join("、") || "日常";
  const userText = analysis.text?.trim() || analysis.summary;
  const imageNote = analysis.caption?.trim() || "见附图氛围";
  const boxLine = boxCopy?.trim() || "";
  const base =
    analysis.music_prompt ||
    `${analysis.scene}，${analysis.summary}，意象：${imagery}`;

  return [
    `用户原始输入：${userText}`,
    analysis.imageDataUrl ? `图片说明：${imageNote}` : null,
    boxLine ? `用户选中的音匣提示语：${boxLine}` : null,
    timbre
      ? `音色编曲：${timbre.layers.join("、")}。节拍：${timbre.beatStyle}。听感：${timbre.listeningFeel}。曲风：${timbre.genreHint}`
      : null,
    base,
    STRATEGY_MUSIC_HINT[strategy],
    `${tempo}，中文流行旋律，音高起伏明显，可歌唱性强，禁止念白朗诵和口语独白，副歌旋律抓耳`,
    "歌曲总时长约45-60秒，结构紧凑，一段主歌加副歌，不要冗长",
  ]
    .filter(Boolean)
    .join("。");
}

export function dedupeLyricLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const key = line.replace(/\s+/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(line);
  }

  return result;
}

export function splitDisplayLyrics(
  openCopy: [string, string],
  fullLyrics?: string,
): string[] {
  const minLines = 5;
  const maxLines = 8;

  let lines: string[] = [];
  if (fullLyrics?.trim()) {
    lines = parseLyricText(fullLyrics).lines;
  }

  if (lines.length === 0) {
    lines = openCopy.filter(Boolean).map((line) => trimLyricLine(line));
  }

  lines = dedupeLyricLines(lines);

  if (lines.length < minLines) {
    for (const candidate of openCopy) {
      if (lines.length >= minLines) break;
      const line = trimLyricLine(candidate);
      const key = line.replace(/\s+/g, "");
      if (!line || lines.some((item) => item.replace(/\s+/g, "") === key)) continue;
      lines.push(line);
    }
  }

  return dedupeLyricLines(lines).slice(0, maxLines);
}

export function buildLyricsPackage(
  analysis: MomentAnalysis,
  strategy: Strategy,
  boxCopy: string | undefined,
  llmLyrics?: string,
): LyricsPackage {
  const openCopy = buildOpenCopyFast(analysis, strategy, boxCopy || "");
  const rawLyrics = llmLyrics?.trim() || buildFastLyricsForMusic(analysis, strategy, boxCopy);
  const parsed = parseLyricText(rawLyrics);
  let displayLines = parsed.lines.length > 0 ? parsed.lines : splitDisplayLyrics(openCopy, rawLyrics);
  displayLines = dedupeLyricLines(displayLines).slice(0, 8);

  if (displayLines.length < 5) {
    displayLines = pickUniqueLines(
      [...displayLines, ...openCopy, ...(analysis.lyrics_hint ? [analysis.lyrics_hint] : [])],
      5,
      8,
    );
  }

  const sections =
    parsed.lines.length === displayLines.length
      ? parsed.sections.slice(0, displayLines.length)
      : assignDefaultSections(displayLines.length);

  return {
    displayLines,
    structuredForMusic: toMiniMaxLyrics(displayLines, sections),
    sections,
    lyricTimings: buildLyricStartFractions(sections),
  };
}

export async function generateSongLyrics(
  analysis: MomentAnalysis,
  strategy: Strategy,
  boxCopy?: string,
): Promise<string | undefined> {
  if (!hasMiniMaxTextKey() && !hasOpenAITextKey()) {
    return undefined;
  }

  const strategyLabel = getStrategyLabel(strategy);
  const result = await chatCompletion({
    jsonMode: true,
    messages: [
      { role: "system", content: SONG_LYRICS_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildMultimodalUserContent(
          {
            strategy: strategyLabel,
            summary: analysis.summary,
            scene: analysis.scene,
            imagery: analysis.imagery,
            lyrics_hint: analysis.lyrics_hint,
            text: analysis.text,
            caption: analysis.caption,
            box_copy: boxCopy?.trim() || undefined,
          },
          analysis.imageDataUrl,
          "写可演唱的中文歌词，旋律与内容须紧扣用户文字、图片和音匣提示语",
        ),
      },
    ],
  });

  if (!result) return undefined;

  const parsed = parseJsonContent<SongLyricsJson>(result.content);
  return parsed?.lyrics?.trim() || undefined;
}

function fallbackOpenCopy(
  analysis: MomentAnalysis,
  strategy: Strategy,
): [string, string] {
  const seed = analysis.momentId + strategy;
  const line1 = pickCopy(strategy, analysis.scene, analysis.imagery, seed + "a");
  const line2 = pickCopy(strategy, analysis.scene, analysis.imagery, seed + "b");
  return [line1, line2];
}

/** 开盒快速路径：不调用 LLM，用盲盒文案 + 本地模板 */
export function buildOpenCopyFast(
  analysis: MomentAnalysis,
  strategy: Strategy,
  boxCopy: string,
): [string, string] {
  const [, line2] = fallbackOpenCopy(analysis, strategy);
  return [boxCopy.trim() || line2, line2];
}

/** 开盒 fallback：按标点取完整句，避免 mid-char 截断 */
export function buildFastLyricsForMusic(
  analysis: MomentAnalysis,
  _strategy: Strategy,
  boxCopy?: string,
): string {
  const fragments = extractTextFragments(analysis.text || analysis.summary);
  const hint = analysis.lyrics_hint?.trim();
  const summary = analysis.summary?.trim();
  const copy = boxCopy?.trim();

  const candidates = dedupeLyricLines(
    [copy, ...fragments, hint, summary].filter(Boolean) as string[],
  );

  const lines = pickUniqueLines(candidates, 5, 6);
  const sections = assignDefaultSections(lines.length);

  return toMiniMaxLyrics(lines, sections);
}

function getStrategyLabel(strategy: Strategy): string {
  if (strategy === "sync") return "同频";
  if (strategy === "transition") return "转场";
  return "偶遇";
}

export async function generateOpenCopy(
  analysis: MomentAnalysis,
  strategy: Strategy,
): Promise<[string, string]> {
  if (!hasMiniMaxTextKey() && !hasOpenAITextKey()) {
    return fallbackOpenCopy(analysis, strategy);
  }

  const strategyLabel = getStrategyLabel(strategy);
  const userPayload = {
    strategy: strategyLabel,
    summary: analysis.summary,
    scene: analysis.scene,
    imagery: analysis.imagery,
    text: analysis.text,
    caption: analysis.caption,
  };

  const result = await chatCompletion({
    jsonMode: true,
    messages: [
      { role: "system", content: OPEN_COPY_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildMultimodalUserContent(
          userPayload,
          analysis.imageDataUrl,
          "结合文字与图片写开盒文案",
        ),
      },
    ],
  });

  if (!result) {
    return fallbackOpenCopy(analysis, strategy);
  }

  const parsed = parseJsonContent<OpenCopyJson>(result.content);
  if (parsed?.line1 && parsed.line2) {
    return [parsed.line1, parsed.line2];
  }

  return fallbackOpenCopy(analysis, strategy);
}
