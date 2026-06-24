# 比赛 Demo 部署指南

> 目标：获得固定 2 周可用的交互链接 `https://<项目名>.vercel.app/demo`

## 一键部署（推荐）

在 **apps/web** 目录执行：

```bash
# 1. 登录 Vercel（只需一次，浏览器授权）
npx vercel login

# 2. 一键构建 + 配置环境变量 + 部署
npm run deploy:competition
```

脚本会自动：
- 读取本地 `.env.local` 中的 `MINIMAX_API_KEY`
- 写入比赛推荐环境变量（见下方）
- 构建并部署到 Production
- 输出固定 Demo 链接

## 比赛环境变量（已内置在脚本中）

| 变量 | 值 | 说明 |
|------|-----|------|
| `MINIMAX_API_KEY` | 从 `.env.local` 读取 | 图文理解 + 文案 + 生曲 |
| `MINIMAX_API_BASE` | `https://api.minimaxi.com` | API 地址 |
| `MINIMAX_TEXT_MODEL` | `MiniMax-M3` | 文本模型 |
| `MUSIC_MODE` | `generate` | 强制 AI 生曲，不回退空曲库 |
| `MUSIC_GENERATION_TIMEOUT_MS` | `240000` | 4 分钟超时，给 MiniMax 足够生成时间 |

也可手动在 [Vercel Dashboard](https://vercel.com/dashboard) → Project → Settings → Environment Variables 配置，参考 `.env.competition.example`。

## 部署后提交链接

```
https://<你的项目名>.vercel.app/demo
```

## 部署后还能改吗？

| 操作 | 结果 |
|------|------|
| 改代码后 `npm run deploy:competition` | **链接不变**，内容更新 |
| 只改 Vercel 环境变量 | 需 Redeploy 一次生效 |
| 删项目重建 | 链接会变，避免 |

**7 月 3 日前建议冻结版本**，非必要不 redeploy。

## 部署后验收清单

- [ ] 手机 4G 打开 `/demo`
- [ ] 选「雨夜的一碗面」→ 分析 → 选盲盒 → 开盒
- [ ] 音乐可播放
- [ ] 歌词卡 + 保存分享图正常
- [ ] MiniMax 余额充足

## 若 Vercel 登录失败

1. 换网络（手机热点）
2. 浏览器打开 https://vercel.com 手动登录
3. 在 Dashboard → Add New Project → Import Git（需先 push 到 GitHub）
4. Root Directory 设为 `apps/web`
5. 手动粘贴环境变量后 Deploy

## 腾讯云云托管部署

构建设置（与 Dockerfile 同级）：

| 配置项 | 值 |
|--------|-----|
| **目标目录** | `apps/web` |
| **Dockerfile 文件** | 有 |
| **Dockerfile 名称** | `Dockerfile` |
| **服务端口** | `3000` |

环境变量同 Vercel（见上表）。仓库根目录也有 Dockerfile（目标目录填 `.` 时使用）。

修改根目录 `content/songs.json` 后，部署前在 `apps/web` 执行：

```bash
npm run sync:content
```

## 音频保底（强烈建议）

当前 `content/audio/` 若无 MP3，生曲失败时评委听不到音乐。

```bash
# 导出 MP3 到 content/audio/ 后
cd apps/web
npm run sync:audio
npm run deploy:competition
```
