/**
 * 比赛 Demo 一键部署脚本
 * 用法: npm run deploy:competition
 * 前置: 先执行 npx vercel login（仅需一次）
 */
import { execSync, spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

const COMPETITION_ENV = {
  MINIMAX_API_BASE: "https://api.minimaxi.com",
  MINIMAX_TEXT_MODEL: "MiniMax-M3",
  MUSIC_MODE: "auto",
  MUSIC_GENERATION_TIMEOUT_MS: "90000",
};

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const result = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    result[key] = value;
  }
  return result;
}

function run(cmd, options = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root, ...options });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: root, encoding: "utf8" }).trim();
}

function upsertVercelEnv(key, value, targets = ["production", "preview", "development"]) {
  for (const target of targets) {
    try {
      runCapture(`npx vercel env rm ${key} ${target} --yes`);
    } catch {
      // env may not exist yet
    }
    const input = spawnSync("npx", ["vercel", "env", "add", key, target, "--yes"], {
      cwd: root,
      input: value,
      encoding: "utf8",
      shell: true,
    });
    if (input.status !== 0) {
      throw new Error(`Failed to set ${key} for ${target}: ${input.stderr || input.stdout}`);
    }
    console.log(`  ✓ ${key} → ${target}`);
  }
}

function main() {
  console.log("═══════════════════════════════════════");
  console.log("  MuseBox灵感音匣 · 比赛 Demo 部署");
  console.log("═══════════════════════════════════════\n");

  const localEnv = parseEnvFile(envPath);
  if (!localEnv.MINIMAX_API_KEY) {
    console.error("❌ .env.local 中未找到 MINIMAX_API_KEY");
    console.error("   请先配置 apps/web/.env.local");
    process.exit(1);
  }

  try {
    runCapture("npx vercel whoami");
  } catch {
    console.error("❌ 未登录 Vercel。请先运行: npx vercel login");
    process.exit(1);
  }

  console.log("\n📦 构建检查…");
  run("npm run build");

  console.log("\n🔐 配置 Vercel 环境变量…");
  const envToPush = {
    MINIMAX_API_KEY: localEnv.MINIMAX_API_KEY,
    ...COMPETITION_ENV,
  };
  if (localEnv.OPENAI_API_KEY) {
    envToPush.OPENAI_API_KEY = localEnv.OPENAI_API_KEY;
  }

  for (const [key, value] of Object.entries(envToPush)) {
    if (!value) continue;
    upsertVercelEnv(key, value);
  }

  console.log("\n🚀 部署到 Production…");
  if (!existsSync(resolve(root, ".vercel", "project.json"))) {
    run("npx vercel link --yes");
  }
  run("npx vercel --prod --yes");

  let url = "";
  try {
    url = runCapture("npx vercel inspect --prod 2>nul || npx vercel ls --prod 2>nul");
  } catch {
    // fallback: user reads from deploy output
  }

  console.log("\n═══════════════════════════════════════");
  console.log("  ✅ 部署完成");
  console.log("═══════════════════════════════════════");
  console.log("\n比赛 Demo 链接（固定）:");
  console.log("  https://<你的项目名>.vercel.app/demo");
  console.log("\n请从上方 deploy 输出复制 Production URL，加上 /demo");
  console.log("建议用手机 4G 测试完整流程后再提交。\n");
}

main();
