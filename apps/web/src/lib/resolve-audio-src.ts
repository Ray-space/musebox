/** 优先使用开盒响应内联的 data URL，避免 Vercel 跨实例 /api/audio 404 */
export function resolvePlaybackSrc(song: {
  audioUrl?: string;
  audioDataUrl?: string;
}): string {
  return song.audioDataUrl?.trim() || song.audioUrl?.trim() || "";
}
