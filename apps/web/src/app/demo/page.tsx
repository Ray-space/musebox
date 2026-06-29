"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { savePendingMoment } from "@/lib/storage";

const DEMO_SCENARIOS = [
  {
    id: "rain-noodle",
    emoji: "🌧️",
    title: "雨夜的一碗面",
    subtitle: "同频 · 转场 · 偶遇",
    text: "今天下雨，但吃到了一碗很好吃的面。",
    caption: "雨夜便利店，热气升起来",
  },
  {
    id: "report-sad",
    emoji: "📊",
    title: "汇报后的低落",
    subtitle: "被懂 · 转暖 · 意外",
    text: "汇报完回到工位，明明没有大事，就是突然很低落。",
    caption: "办公室灯还亮着",
  },
  {
    id: "subway-friend",
    emoji: "🚇",
    title: "末班地铁像旧友",
    subtitle: "陪伴 · 松动 · 偶遇",
    text: "末班地铁里，有个陌生人看起来像很久没见的老朋友。",
    caption: "车厢里只剩轨道声",
  },
] as const;

export default function DemoPage() {
  const router = useRouter();

  const startScenario = (scenario: (typeof DEMO_SCENARIOS)[number]) => {
    savePendingMoment({
      text: scenario.text,
      caption: scenario.caption,
    });
    router.push("/draw");
  };

  return (
    <AppShell>
      <div className="demo-page">
        <header className="demo-header">
          <p className="demo-eyebrow">MuseBox · 灵感音匣</p>
          <h1 className="demo-title">MuseBox灵感音匣 · 体验 Demo</h1>
          <p className="demo-desc">
            写+拍 → 抽 → 看+听。选一个场景，进入完整交互流程。
          </p>
        </header>

        <section className="demo-scenarios">
          {DEMO_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              className="demo-scenario-card"
              onClick={() => startScenario(scenario)}
            >
              <span className="demo-scenario-emoji" aria-hidden>
                {scenario.emoji}
              </span>
              <span className="demo-scenario-body">
                <strong>{scenario.title}</strong>
                <span>{scenario.subtitle}</span>
                <span className="demo-scenario-text">{scenario.text}</span>
              </span>
              <span className="demo-scenario-cta">开始体验 →</span>
            </button>
          ))}
        </section>

        <section className="demo-links">
          <p className="demo-links-label">更多入口</p>
          <div className="demo-links-row">
            <a href="/" className="demo-link-chip">
              自由输入
            </a>
            <a href="/calendar" className="demo-link-chip">
              灵感日历
            </a>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
