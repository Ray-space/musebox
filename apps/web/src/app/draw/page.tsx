"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DrawScene } from "@/components/DrawScene";
import {
  buildCuratedDrawResult,
  type CuratedScenarioId,
} from "@/lib/curated-scenarios";
import { drawBlindBoxes } from "@/lib/blindbox-match";
import { readJsonResponse } from "@/lib/fetch-json";
import {
  clearPendingMoment,
  loadPendingMoment,
  loadSession,
  saveSelected,
  saveSession,
} from "@/lib/storage";
import type { BlindBox, DrawResult } from "@/types";

type DrawStatus = "booting" | "analyzing" | "ready" | "error";

export default function DrawPage() {
  const router = useRouter();
  const [session, setSession] = useState<DrawResult | null>(null);
  const [status, setStatus] = useState<DrawStatus>("booting");
  const [error, setError] = useState("");
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const analyzingRef = useRef(false);

  useEffect(() => {
    const pending = loadPendingMoment();

    if (pending?.source === "curated" && pending.scenarioId) {
      const timer = window.setTimeout(() => {
        const result = buildCuratedDrawResult(
          pending.scenarioId as CuratedScenarioId,
        );
        saveSession(result);
        clearPendingMoment();
        setSession(result);
        setStatus("ready");
      }, 600);
      return () => window.clearTimeout(timer);
    }

    const existing = loadSession();
    if (existing && existing.source !== "curated") {
      const needsRefresh =
        existing.boxes.some((box) => !box.songTitle) ||
        existing.boxes.some((box) => !box.timbre) ||
        existing.boxes.some((box) =>
          /慢歌$|渐暖$|^偶遇/.test(box.songTitle || ""),
        );
      const session = needsRefresh ? drawBlindBoxes(existing.analysis) : existing;
      if (needsRefresh) {
        saveSession(session);
      }
      setSession(session);
      setStatus("ready");
      return;
    }

    if (!pending) {
      router.replace("/");
      return;
    }

    if (analyzingRef.current) return;
    analyzingRef.current = true;
    setStatus("analyzing");
    setAnalyzeProgress(4);

    const progressTimer = window.setInterval(() => {
      setAnalyzeProgress((value) => {
        if (value >= 92) return value;
        return value + (92 - value) * 0.12;
      });
    }, 450);

    fetch("/api/moment/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: pending.text,
        caption: pending.caption,
        imageDataUrl: pending.imageDataUrl,
      }),
    })
      .then(async (response) => {
        const payload = await readJsonResponse<{ error?: string } & DrawResult>(
          response,
        );
        if (!response.ok) {
          throw new Error(payload.error || "生成盲盒失败");
        }
        return payload as DrawResult;
      })
      .then((result) => {
        setAnalyzeProgress(100);
        saveSession({ ...result, source: "free" });
        clearPendingMoment();
        setSession(result);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "出错了，请稍后再试");
        setStatus("error");
      })
      .finally(() => {
        window.clearInterval(progressTimer);
      });
  }, [router]);

  const handleSelect = (box: BlindBox) => {
    if (!session) return;
    saveSelected(box.id, box, session.analysis, {
      forceLibrary: session.source === "curated",
      scenarioId: session.scenarioId,
    });
    router.push(`/open/${box.id}`);
  };

  if (status === "booting") {
    return (
      <AppShell>
        <p className="text-ink-soft">加载中…</p>
      </AppShell>
    );
  }

  if (status === "error") {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <p className="text-pink-300">{error}</p>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="dream-btn mt-6 rounded-full px-8 py-3 text-sm text-white"
          >
            返回修改瞬间
          </button>
        </div>
      </AppShell>
    );
  }

  if (!session && status !== "analyzing") {
    return (
      <AppShell>
        <p className="text-ink-soft">加载中…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DrawScene
        session={session ?? undefined}
        analyzing={status === "analyzing"}
        analyzeProgress={analyzeProgress}
        curated={session?.source === "curated"}
        onSelect={handleSelect}
      />
    </AppShell>
  );
}
