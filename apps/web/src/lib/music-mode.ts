import type { MusicMode } from "@/types";

export function getMusicMode(): MusicMode {
  const mode = process.env.MUSIC_MODE?.toLowerCase();
  if (mode === "generate" || mode === "library" || mode === "auto") {
    return mode;
  }
  return "auto";
}

export function shouldTryGenerate(): boolean {
  const mode = getMusicMode();
  return mode === "generate" || mode === "auto";
}

export function shouldFallbackToLibrary(): boolean {
  // 生曲失败/超时一律回退曲库，确保开盒成功率
  return getMusicMode() !== "library";
}

/** 生曲超时（毫秒），默认 240 秒；设为 0 表示不限制 */
export function getMusicGenerationTimeoutMs(): number {
  const raw = process.env.MUSIC_GENERATION_TIMEOUT_MS;
  if (raw === "0") return 0;
  const parsed = raw ? Number.parseInt(raw, 10) : 240_000;
  if (!Number.isFinite(parsed) || parsed < 0) return 240_000;
  if (parsed === 0) return 0;
  return Math.min(parsed, 300_000);
}
