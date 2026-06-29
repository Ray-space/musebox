# 音频资源

将曲库 MP3 放在此目录，文件名与 `songs.json` 中的 `id` 一致。

示例：`sync-rain-noodle-01.mp3`

同步到 Web 应用：

```bash
cd apps/web
npm run sync:audio
```

未设置 MP3 时，Web 会使用 Demo 合成音播放；生产环境推荐 `MUSIC_MODE=generate` 使用 MiniMax 实时生曲。
