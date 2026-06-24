"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MusicGeneratingScene } from "@/components/MusicGeneratingScene";
import { OpenReveal } from "@/components/OpenReveal";
import { readJsonResponse } from "@/lib/fetch-json";
import { loadSelected } from "@/lib/storage";
import type { BlindBox, OpenResult, Strategy, TimbreProfile } from "@/types";

type OpenPhase = "generating" | "ready" | "error" | "missing";

export default function OpenPage() {
  const params = useParams<{ id: string }>();
  const [result, setResult] = useState<OpenResult | null>(null);
  const [selectedBox, setSelectedBox] = useState<BlindBox | null>(null);
  const [phase, setPhase] = useState<OpenPhase>("generating");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [statusHint, setStatusHint] = useState("请保持页面打开，AI 生曲通常需要 1～3 分钟");
  const [isCuratedOpen, setIsCuratedOpen] = useState(false);

  useEffect(() => {
    const selected = loadSelected();
    if (!selected) {
      setPhase("missing");
      return;
    }

    const { box, analysis, forceLibrary, scenarioId } = selected;
    if (box.id !== params.id) {
      setPhase("missing");
      return;
    }

    setSelectedBox(box);
    setIsCuratedOpen(forceLibrary === true);

    if (forceLibrary) {
      setStatusHint("正在为你准备预置音乐…");
    }

    const timer = setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);

    const hintTimer = window.setTimeout(() => {
      if (!forceLibrary) {
        setStatusHint("旋律与歌词正在为你定制中…");
      }
    }, 4000);

    const longWaitTimer = window.setTimeout(() => {
      if (!forceLibrary) {
        setStatusHint("仍在生成中，请耐心等待，不要关闭页面（最长约 4 分钟）");
      }
    }, 120_000);

    fetch("/api/blindbox/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ box, analysis, forceLibrary, scenarioId }),
    })
      .then(async (res) => {
        const data = await readJsonResponse<{
          error?: string;
          boxId: string;
          boxCopy?: string;
          openCopy: [string, string];
          song: OpenResult["song"];
          momentText?: string;
          imageDataUrl?: string;
          displayLyrics?: string[];
          timbre?: TimbreProfile;
          strategy?: Strategy;
          isCurated?: boolean;
        }>(res);
        if (!res.ok) throw new Error(data.error || "开盒失败");
        return data;
      })
      .then((data) => {
        setResult({
          boxId: data.boxId,
          boxCopy: data.boxCopy || box.copy,
          openCopy: data.openCopy,
          song: data.song,
          visualCardDataUrl: "",
          momentText: data.momentText || analysis?.summary || analysis?.text || "今天的一个瞬间",
          imageDataUrl: data.imageDataUrl,
          displayLyrics: data.displayLyrics,
          timbre: data.timbre || box.timbre,
          strategy: data.strategy || box.strategy,
          isCurated: data.isCurated === true,
        });
        setPhase("ready");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "出错了");
        setPhase("error");
      })
      .finally(() => {
        clearInterval(timer);
        clearTimeout(hintTimer);
        clearTimeout(longWaitTimer);
      });

    return () => {
      clearInterval(timer);
      clearTimeout(hintTimer);
      clearTimeout(longWaitTimer);
    };
  }, [params.id]);

  return (
    <AppShell>
      {phase === "missing" && (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <p className="text-dream-mist/50">会话已失效，请从盲盒页重新开盒</p>
        </div>
      )}

      {phase === "error" && <p className="text-pink-300">{error}</p>}

      {phase === "generating" && selectedBox && !isCuratedOpen && (
        <MusicGeneratingScene
          strategy={selectedBox.strategy}
          boxCopy={selectedBox.copy}
          songTitle={selectedBox.songTitle}
          elapsed={elapsed}
          statusHint={statusHint}
        />
      )}

      {phase === "generating" && selectedBox && isCuratedOpen && (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <p className="text-sm text-dream-mist/60">{statusHint}</p>
        </div>
      )}

      {phase === "ready" && result && <OpenReveal data={result} />}
    </AppShell>
  );
}
