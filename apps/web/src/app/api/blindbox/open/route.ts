import { NextRequest, NextResponse } from "next/server";
import { getCuratedScenario } from "@/lib/curated-scenarios";
import {
  buildCompactMusicPrompt,
  buildFastLyricsForMusic,
  buildOpenCopyFast,
  splitDisplayLyrics,
} from "@/lib/mood-engine";
import { generateMiniMaxMusicWithRetry } from "@/lib/minimax-music";
import {
  getMusicGenerationTimeoutMs,
  getMusicMode,
  shouldFallbackToLibrary,
  shouldTryGenerate,
} from "@/lib/music-mode";
import { getSongById } from "@/lib/songs";
import type { BlindBox, MomentAnalysis, Song } from "@/types";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 300;

function buildLibraryPayload(
  box: BlindBox,
  analysis: MomentAnalysis,
  song: Song,
  openCopy: [string, string],
  fallbackReason?: string,
) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const box = body.box as BlindBox;
    const analysis = body.analysis as MomentAnalysis;
    const forceLibrary = body.forceLibrary === true;
    const scenario = getCuratedScenario(body.scenarioId as string | undefined);

    if (!box?.songId) {
      return NextResponse.json({ error: "缺少 box" }, { status: 400 });
    }

    const librarySong = getSongById(box.songId);
    if (!librarySong) {
      return NextResponse.json({ error: "歌曲不存在" }, { status: 404 });
    }

    const openCopy =
      forceLibrary && scenario
        ? scenario.openCopy
        : buildOpenCopyFast(analysis, box.strategy, box.copy);
    const fastLyrics = buildFastLyricsForMusic(analysis, box.strategy, box.copy);
    const displayLyrics =
      forceLibrary && scenario
        ? scenario.displayLyrics
        : splitDisplayLyrics(
            openCopy,
            fastLyrics,
            analysis?.text || analysis?.summary,
          );

    if (forceLibrary || !shouldTryGenerate()) {
      const curated = forceLibrary && scenario;
      const analysisForPayload = curated
        ? { ...analysis, imageDataUrl: scenario.coverImageUrl }
        : analysis;
      const songForPayload = curated
        ? { ...librarySong, title: scenario.title, openCopy }
        : librarySong;

      return NextResponse.json({
        ...buildLibraryPayload(
          box,
          analysisForPayload,
          songForPayload,
          openCopy,
        ),
        displayLyrics,
        boxCopy: curated ? scenario.tagline : box.copy,
        isCurated: Boolean(curated),
      });
    }

    try {
      const musicPrompt = buildCompactMusicPrompt(
        analysis,
        box.strategy,
        box.copy,
        box.timbre,
      );

      const generated = await generateMiniMaxMusicWithRetry({
        prompt: musicPrompt,
        lyrics: fastLyrics,
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
        openCopy,
        story: `根据「${analysis.summary}」实时生成`,
        source: "generated",
      };

      return NextResponse.json({
        boxId: box.id,
        boxCopy: box.copy,
        openCopy,
        song,
        displayLyrics: splitDisplayLyrics(
          openCopy,
          fastLyrics,
          analysis?.text || analysis?.summary,
        ),
        momentText: analysis?.summary || analysis?.text || "今天的一个瞬间",
        imageDataUrl: analysis?.imageDataUrl,
        strategy: box.strategy,
        timbre: box.timbre,
        musicMode: getMusicMode(),
        generated: true,
      });
    } catch (generateError) {
      if (!shouldFallbackToLibrary()) {
        throw generateError;
      }

      console.error(
        "[blindbox/open] generate failed, fallback to library:",
        generateError,
      );

      return NextResponse.json(
        buildLibraryPayload(
          box,
          analysis,
          librarySong,
          openCopy,
          generateError instanceof Error
            ? generateError.message
            : "生曲失败",
        ),
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "开盒失败" },
      { status: 500 },
    );
  }
}
