import { storeGeneratedAudio } from "@/lib/generated-audio-cache";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { Strategy } from "@/types";
import {
  getMusicGenerationTimeoutMs,
  isRetryableMusicError,
  shouldRetryMusicGeneration,
} from "@/lib/music-mode";

export interface MiniMaxMusicOptions {
  prompt: string;
  lyrics?: string;
  strategy: Strategy;
  lyricsOptimizer?: boolean;
  timeoutMs?: number;
}

export interface MiniMaxMusicResult {
  audioUrl: string;
  fileName: string;
  prompt: string;
}

function getApiBase(): string {
  const base = process.env.MINIMAX_API_BASE || "https://api.minimaxi.com";
  return base.replace(/\/$/, "");
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "TimeoutError") return true;
  if (error.name === "AbortError") {
    const cause = (error as Error & { cause?: Error }).cause;
    if (cause?.name === "TimeoutError") return true;
  }
  return /timeout|aborted/i.test(error.message);
}

export async function generateMiniMaxMusic(
  options: MiniMaxMusicOptions,
): Promise<MiniMaxMusicResult> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY 未配置");
  }

  const hasLyrics = Boolean(options.lyrics?.trim());

  const body: Record<string, unknown> = {
    model: "music-2.6",
    prompt: options.prompt,
    is_instrumental: false,
    lyrics_optimizer: hasLyrics
      ? false
      : (options.lyricsOptimizer ?? true),
    output_format: "hex",
    stream: false,
    audio_setting: {
      format: "mp3",
      sample_rate: 44100,
      bitrate: 256000,
    },
  };

  if (hasLyrics) {
    body.lyrics = options.lyrics!.trim();
  }

  const timeoutMs = options.timeoutMs ?? getMusicGenerationTimeoutMs();
  const fetchInit: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
  if (timeoutMs > 0) {
    fetchInit.signal = AbortSignal.timeout(timeoutMs);
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBase()}/v1/music_generation`, fetchInit);
  } catch (error) {
    if (isTimeoutError(error)) {
      const waited = timeoutMs > 0 ? Math.round(timeoutMs / 1000) : 0;
      throw new Error(
        waited > 0
          ? `生曲超时（已等待 ${waited} 秒）`
          : "生曲请求被中断",
      );
    }
    throw error;
  }

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      `MiniMax HTTP ${response.status}: ${responseText.slice(0, 300)}`,
    );
  }

  const data = JSON.parse(responseText) as {
    data?: { audio?: string; status?: number };
    base_resp?: { status_code: number; status_msg: string };
  };

  if (data.base_resp && data.base_resp.status_code !== 0) {
    throw new Error(
      `MiniMax API ${data.base_resp.status_code}: ${data.base_resp.status_msg}`,
    );
  }

  const hexAudio = data.data?.audio;
  if (!hexAudio) {
    throw new Error("MiniMax 响应缺少 audio 数据");
  }

  const audioBuffer = Buffer.from(hexAudio, "hex");
  const cacheId = storeGeneratedAudio(audioBuffer);
  const fileName = `${cacheId}.mp3`;

  try {
    const generatedDir = path.join(process.cwd(), "public", "generated");
    await mkdir(generatedDir, { recursive: true });
    await writeFile(path.join(generatedDir, fileName), audioBuffer);
  } catch (error) {
    console.warn("[minimax-music] local file write skipped:", error);
  }

  return {
    audioUrl: `/api/audio/${cacheId}`,
    fileName,
    prompt: options.prompt,
  };
}

export async function generateMiniMaxMusicWithRetry(
  options: MiniMaxMusicOptions,
): Promise<MiniMaxMusicResult> {
  const timeoutMs = options.timeoutMs ?? getMusicGenerationTimeoutMs();

  try {
    return await generateMiniMaxMusic({ ...options, timeoutMs });
  } catch (firstError) {
    if (!shouldRetryMusicGeneration() || !isRetryableMusicError(firstError)) {
      throw firstError;
    }

    console.warn("[minimax-music] transient error, retrying once:", firstError);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return generateMiniMaxMusic({ ...options, timeoutMs });
  }
}
