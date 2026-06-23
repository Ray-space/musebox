# MuseBox灵感音匣

基于 **VEMUS 未音** 平台的灵感音乐盲盒原型：写+拍 → 抽 → 看+听。

## 快速开始

```bash
cd E:\项目\情绪音匣\apps\web
npm install
npm run dev
```

浏览器打开 http://localhost:3000

## 比赛 Demo 部署（固定 2 周链接）

```bash
cd apps/web
npx vercel login              # 只需一次
npm run deploy:competition    # 一键构建 + 配置环境变量 + 部署
```

部署完成后提交：`https://<项目名>.vercel.app/demo`

详细说明见 [docs/competition-deploy.md](docs/competition-deploy.md)。

## 项目结构

```
MuseBox灵感音匣/
├── apps/web/          # Next.js PWA 原型
├── content/           # 曲库元数据 + 音频
├── docs/              # 产品方案、未音 prompt、答辩材料
└── README.md
```

## 替换为真实未音歌曲

1. 按 [docs/vemus-prompts.md](docs/vemus-prompts.md) 在未音 App 生成歌曲
2. 导出 MP3 到 `content/audio/`，文件名与 `content/songs.json` 的 `id` 一致
3. 复制 MP3 到 `apps/web/public/audio/`

## 可选：LLM 增强

设置环境变量 `OPENAI_API_KEY` 可启用 GPT-4o-mini 多模态情绪分析。

## Plan A：开盒实时生曲（MiniMax）

1. 复制 `apps/web/.env.example` 为 `apps/web/.env.local`
2. 填入 `OPENAI_API_KEY`、`MINIMAX_API_KEY`
3. 设置 `MUSIC_MODE=generate`（强制生曲）或 `auto`（失败回退曲库）
4. 开盒时会调用 MiniMax music-2.6，音频保存在 `public/generated/`

详见 [apps/web/.env.example](apps/web/.env.example)

## 比赛材料

- 产品方案：[docs/product-spec.md](docs/product-spec.md)
- 演示脚本：[docs/demo-video-script.md](docs/demo-video-script.md)
- 答辩 PPT：[docs/pitch-deck.md](docs/pitch-deck.md)
