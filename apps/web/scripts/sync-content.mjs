import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "../../content/songs.json");
const targetDir = resolve(root, "content");
const target = resolve(targetDir, "songs.json");

if (!existsSync(source)) {
  console.error("未找到 content/songs.json，请确认 monorepo 根目录存在曲库文件。");
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });
copyFileSync(source, target);
console.log("已同步 content/songs.json -> apps/web/content/songs.json");
