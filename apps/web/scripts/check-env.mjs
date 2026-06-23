import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function parseEnv(content) {
  const values = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    values[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }
  return values;
}

const links = {
  minimax: "https://platform.minimaxi.com/",
  openai: "https://platform.openai.com/api-keys",
};

if (!existsSync(envPath)) {
  console.error("缺少 .env.local，请先复制 .env.example：");
  console.error("  copy .env.example .env.local");
  process.exit(1);
}

const env = parseEnv(readFileSync(envPath, "utf8"));
const openai = env.OPENAI_API_KEY || "";
const minimax = env.MINIMAX_API_KEY || "";
const textModel = env.MINIMAX_TEXT_MODEL || "MiniMax-M3";
const mode = env.MUSIC_MODE || "auto";

let ok = true;

console.log("MuseBox灵感音匣 · MiniMax 全链路环境检查\n");

if (!minimax) {
  ok = false;
  console.log("✗ MINIMAX_API_KEY 未配置（必需）");
  console.log(`  → 申请: ${links.minimax}`);
  console.log("  → 用途: M3 图文理解 + 开盒文案 + music-2.6 生曲\n");
} else {
  console.log("✓ MINIMAX_API_KEY 已配置");
  console.log(`  文本模型: ${textModel}`);
  console.log("  音乐模型: music-2.6");
}

if (openai) {
  console.log("✓ OPENAI_API_KEY 已配置（可选 fallback）");
} else {
  console.log("○ OPENAI_API_KEY 未配置（将全程使用 MiniMax-M3）");
}

console.log(`  MUSIC_MODE=${mode}`);

if (mode === "generate" && !minimax) {
  console.log("\n⚠ MUSIC_MODE=generate 但未配置 MiniMax，开盒将直接失败");
}

if (ok) {
  console.log("\n环境就绪，可运行 npm run dev 并进行端到端测试。");
  process.exit(0);
}

console.log("\n请编辑 apps/web/.env.local 填入 MINIMAX_API_KEY 后重启 dev 服务器。");
process.exit(1);
