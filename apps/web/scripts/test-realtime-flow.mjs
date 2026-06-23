/**
 * 端到端冒烟测试：analyze → open（需 dev 服务器运行且 .env.local 已配置 Key）
 * 用法: node scripts/test-realtime-flow.mjs [baseUrl]
 */
const baseUrl = process.argv[2] || "http://localhost:3000";

async function request(path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log(`测试基址: ${baseUrl}\n`);

  const analyze = await request("/api/moment/analyze", {
    text: "下雨的夜里吃了一碗面，心里安静了一点",
    caption: "便利店窗边",
  });

  if (!analyze.ok) {
    console.error("✗ analyze 失败:", analyze.data);
    process.exit(1);
  }

  const { analysis, boxes } = analyze.data;
  if (!analysis || !boxes?.length) {
    console.error("✗ analyze 响应缺少 analysis/boxes");
    process.exit(1);
  }

  console.log("✓ analyze 成功");
  console.log(`  场景: ${analysis.scene}`);
  console.log(`  盲盒数: ${boxes.length}`);

  const box = boxes[0];
  console.log(`\n开盒测试 (strategy=${box.strategy})，可能需要 30～90 秒…`);

  const open = await request("/api/blindbox/open", { box, analysis });

  if (!open.ok) {
    console.error("✗ open 失败:", open.data);
    process.exit(1);
  }

  if (open.data.generated) {
    console.log("✓ 实时生曲成功");
    console.log(`  歌名: ${open.data.song?.title}`);
    console.log(`  音频: ${open.data.song?.audioUrl}`);
  } else {
    console.log("⚠ 未实时生曲，回退曲库");
    console.log(`  原因: ${open.data.fallbackReason || "MUSIC_MODE=library 或未配置 MiniMax"}`);
    console.log(`  歌曲: ${open.data.song?.title} (${open.data.song?.source})`);
  }

  console.log("\n端到端流程完成。");
}

main().catch((err) => {
  console.error("测试异常:", err.message);
  console.error("请确认 dev 服务器已启动: npm run dev");
  process.exit(1);
});
