"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MusicGeneratingScene } from "@/components/MusicGeneratingScene";
import { OpenReveal } from "@/components/OpenReveal";
import { readJsonResponse } from "@/lib/fetch-json";
import { loadSelected } from "@/lib/storage";
import type {
  BlindBox,
  MomentAnalysis,
  OpenApiResponse,
  OpenAsyncStartResponse,
  OpenJobPollResponse,
  OpenResult,
} from "@/types";

type OpenPhase = "generating" | "ready" | "error" | "missing";

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_MS = 5 * 60 * 1000;

function toOpenResult(
  data: OpenApiResponse,
  box: BlindBox,
  analysis: MomentAnalysis,
): OpenResult {
  return {
    boxId: data.boxId,
    boxCopy: data.boxCopy || box.copy,
    openCopy: data.openCopy,
    song: data.song,
    visualCardDataUrl: "",
    momentText:
      data.momentText ||
      analysis?.summary ||
      analysis?.text ||
      "今天的一个瞬间",
    imageDataUrl: data.imageDataUrl,
    displayLyrics: data.displayLyrics,
    lyricTimings: data.lyricTimings,
    timbre: data.timbre || box.timbre,
    strategy: data.strategy || box.strategy,
    isCurated: data.isCurated === true,
  };
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new Error("已取消"));
      },
      { once: true },
    );
  });
}

async function pollOpenJob(
  jobId: string,
  signal: AbortSignal,
  onStage?: (stage: string) => void,
): Promise<OpenApiResponse> {
  const started = Date.now();

  while (Date.now() - started < POLL_MAX_MS) {
    if (signal.aborted) {
      throw new Error("已取消");
    }

    const res = await fetch(`/api/blindbox/open/${jobId}`, { signal });
    const data = await readJsonResponse<OpenJobPollResponse & { error?: string }>(
      res,
    );

    if (!res.ok) {
      throw new Error(data.error || "查询开盒进度失败");
    }

    if (data.stage) {
      onStage?.(data.stage);
    }

    if (data.status === "completed" && data.result) {
      return data.result;
    }

    if (data.status === "failed") {
      throw new Error(data.error || "开盒失败");
    }

    await sleep(POLL_INTERVAL_MS, signal);
  }

  throw new Error("开盒超时，请稍后重试");
}

export default function OpenPage() {
  const params = useParams<{ id: string }>();
  const [result, setResult] = useState<OpenResult | null>(null);
  const [selectedBox, setSelectedBox] = useState<BlindBox | null>(null);
  const [phase, setPhase] = useState<OpenPhase>("generating");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [statusHint, setStatusHint] = useState(
    "请保持页面打开，AI 生曲通常需要 1～3 分钟",
  );
  const [stage, setStage] = useState<string>();
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

    const abortController = new AbortController();
    const { signal } = abortController;

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

    const handleStage = (nextStage: string) => {
      setStage(nextStage);
      setStatusHint(nextStage);
    };

    fetch("/api/blindbox/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ box, analysis, forceLibrary, scenarioId }),
      signal,
    })
      .then(async (res) => {
        const data = await readJsonResponse<
          (OpenApiResponse | OpenAsyncStartResponse) & { error?: string }
        >(res);
        if (!res.ok) throw new Error(data.error || "开盒失败");

        if ("jobId" in data && data.jobId) {
          return pollOpenJob(data.jobId, signal, handleStage);
        }

        return data as OpenApiResponse;
      })
      .then((data) => {
        if (signal.aborted) return;
        setResult(toOpenResult(data, box, analysis));
        setPhase("ready");
      })
      .catch((err) => {
        if (signal.aborted) return;
        setError(err instanceof Error ? err.message : "出错了");
        setPhase("error");
      })
      .finally(() => {
        clearInterval(timer);
        clearTimeout(hintTimer);
        clearTimeout(longWaitTimer);
      });

    return () => {
      abortController.abort();
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
          stage={stage}
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
