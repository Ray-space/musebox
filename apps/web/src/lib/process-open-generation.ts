import { getCuratedScenario } from "@/lib/curated-scenarios";
import {
  buildCompactMusicPrompt,
  buildLyricsPackage,
  buildOpenCopyFast,
  generateSongLyrics,
} from "@/lib/mood-engine";
import { buildLyricStartFractions, assignDefaultSections } from "@/lib/lyric-sync";
import { generateMiniMaxMusicWithRetry } from "@/lib/minimax-music";
import {
  getMusicGenerationTimeoutMs,
  getMusicMode,
  shouldFallbackToLibrary,
  shouldTryGenerate,
} from "@/lib/music-mode";
import { getSongById } from "@/lib/songs";
import type { BlindBox, MomentAnalysis, OpenApiResponse, Song } from "@/types";
import { v4 as uuidv4 } from "uuid";

const LYRICS_TIMEOUT_MS = 22_000;

export interface OpenGenerationInput {
  box: BlindBox;
  analysis: MomentAnalysis;
  forceLibrary?: boolean;
  scenarioId?: string;
}

export type OpenStageCallback = (stage: string) => void;

async function resolveLyricsWithTimeout(
  analysis: MomentAnalysis,
  strategy: BlindBox["strategy"],
  boxCopy: string,
) {
  try {
    return await Promise.race([
      generateSongLyrics(analysis, strategy, boxCopy),
      new Promise<undefined>((resolve) => {
        setTimeout(() => resolve(undefined), LYRICS_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    console.warn("[process-open] generateSongLyrics failed:", error);
    return undefined;
  }
}

function buildLibraryPayload(
  box: BlindBox,
  analysis: MomentAnalysis,
  song: Song,
  openCopy: [string, string],
  fallbackReason?: string,
): OpenApiResponse {
  return {
    boxId: box.id,
    boxCopy: box.copy,
    openCopy,
    song: { ...song, openCopy, source: "library" as const },
    momentText: analysis?.summary || analysis?.text || "今天的一个瞬间",
    imageDataUrl: analysis?.imageDataUrl,
    strategy: box.strategy,
    timbre: box.timbre,
    musicMode: getMusicMode(),
    generated: false,
    ...(fallbackReason ? { fallbackReason } : {}),
  };
}

function buildCuratedResponse(
  box: BlindBox,
  analysis: MomentAnalysis,
  librarySong: Song,
  openCopy: [string, string],
  scenario: NonNullable<ReturnType<typeof getCuratedScenario>>,
): OpenApiResponse {
  const curatedDisplayLyrics = scenario.displayLyrics;
  const curatedLyricTimings =
    curatedDisplayLyrics && curatedDisplayLyrics.length > 0
      ? buildLyricStartFractions(assignDefaultSections(curatedDisplayLyrics.length))
      : undefined;

  return {
    ...buildLibraryPayload(
      box,
      { ...analysis, imageDataUrl: scenario.coverImageUrl },
      { ...librarySong, title: scenario.title, openCopy },
      openCopy,
    ),
    displayLyrics: curatedDisplayLyrics,
    lyricTimings: curatedLyricTimings,
    boxCopy: scenario.tagline,
    isCurated: true,
  };
}

/** sync / async 共用：生成完整开盒响应 */
export async function processOpenGeneration(
  input: OpenGenerationInput,
  onStage?: OpenStageCallback,
): Promise<OpenApiResponse> {
  const { box, analysis, forceLibrary = false, scenarioId } = input;

  if (!box?.songId) {
    throw new Error("缺少 box");
  }

  const librarySong = getSongById(box.songId);
  if (!librarySong) {
    throw new Error("歌曲不存在");
  }

  const scenario = getCuratedScenario(scenarioId);
  const openCopy =
    forceLibrary && scenario
      ? scenario.openCopy
      : buildOpenCopyFast(analysis, box.strategy, box.copy);

  const curatedDisplayLyrics =
    forceLibrary && scenario ? scenario.displayLyrics : undefined;
  const curatedLyricTimings =
    curatedDisplayLyrics && curatedDisplayLyrics.length > 0
      ? buildLyricStartFractions(assignDefaultSections(curatedDisplayLyrics.length))
      : undefined;

  if (forceLibrary || !shouldTryGenerate()) {
    const curated = forceLibrary && scenario;
    if (curated) {
      return buildCuratedResponse(box, analysis, librarySong, openCopy, scenario);
    }

    const analysisForPayload = analysis;
    const songForPayload = librarySong;

    return {
      ...buildLibraryPayload(box, analysisForPayload, songForPayload, openCopy),
      displayLyrics: curatedDisplayLyrics,
      lyricTimings: curatedLyricTimings,
      isCurated: false,
    };
  }

  try {
    onStage?.("正在作词…");

    const musicPrompt = buildCompactMusicPrompt(
      analysis,
      box.strategy,
      box.copy,
      box.timbre,
    );

    const llmLyrics = await resolveLyricsWithTimeout(
      analysis,
      box.strategy,
      box.copy,
    );
    const lyricsPackage = buildLyricsPackage(
      analysis,
      box.strategy,
      box.copy,
      llmLyrics,
    );

    onStage?.("正在生成音乐…");

    const generated = await generateMiniMaxMusicWithRetry({
      prompt: musicPrompt,
      lyrics: lyricsPackage.structuredForMusic,
      strategy: box.strategy,
      lyricsOptimizer: false,
      timeoutMs: getMusicGenerationTimeoutMs(),
    });

    const song: Song = {
      id: `generated-${uuidv4()}`,
      strategy: box.strategy,
      title: box.songTitle || analysis.song_title || "为你生成的歌",
      artist: "MuseBox灵感音匣",
      genre:
        box.timbre?.genreHint?.split(" · ")[0]?.toLowerCase() ||
        (box.strategy === "serendipity" ? "electronic" : "pop"),
      tempo: analysis.tempo_hint || "medium",
      mood_tags: analysis.mood_tags,
      imagery_keywords: analysis.imagery,
      scene_tags: analysis.scene_tags,
      audioUrl: generated.audioUrl,
      audioDataUrl: generated.audioDataUrl,
      openCopy,
      story: `根据「${analysis.summary}」实时生成`,
      source: "generated",
    };

    return {
      boxId: box.id,
      boxCopy: box.copy,
      openCopy,
      song,
      displayLyrics: lyricsPackage.displayLines,
      lyricTimings: lyricsPackage.lyricTimings,
      momentText: analysis?.summary || analysis?.text || "今天的一个瞬间",
      imageDataUrl: analysis?.imageDataUrl,
      strategy: box.strategy,
      timbre: box.timbre,
      musicMode: getMusicMode(),
      generated: true,
    };
  } catch (generateError) {
    if (!shouldFallbackToLibrary()) {
      throw generateError;
    }

    console.error(
      "[process-open] generate failed, fallback to library:",
      generateError,
    );

    return buildLibraryPayload(
      box,
      analysis,
      librarySong,
      openCopy,
      generateError instanceof Error ? generateError.message : "生曲失败",
    );
  }
}
