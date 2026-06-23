import { cpSync, existsSync, mkdirSync, readdirSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const sourceDir = resolve(root, "content", "audio");
const targetDir = resolve(root, "apps", "web", "public", "audio");

if (!existsSync(sourceDir)) {
  console.error("源目录不存在:", sourceDir);
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });

const mp3Files = readdirSync(sourceDir).filter((name) =>
  name.toLowerCase().endsWith(".mp3"),
);

if (mp3Files.length === 0) {
  console.log("content/audio/ 中暂无 MP3。");
  console.log("请按 docs/vemus-prompts.md 在未音生成后导出到 content/audio/，再运行本命令。");
  process.exit(0);
}

for (const file of mp3Files) {
  cpSync(join(sourceDir, file), join(targetDir, file));
}

console.log(`已同步 ${mp3Files.length} 首 MP3 到 public/audio/`);
console.log("可将 .env.local 中 MUSIC_MODE 设为 auto 以启用生曲失败回退。");
