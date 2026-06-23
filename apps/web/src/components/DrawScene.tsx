"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { AnalyzeProgressRing } from "@/components/AnalyzeProgressRing";
import { GiftBox } from "@/components/GiftBox";
import type { BlindBox, DrawResult } from "@/types";

interface DrawSceneProps {
  session?: DrawResult;
  analyzing: boolean;
  analyzeProgress?: number;
  curated?: boolean;
  onSelect: (box: BlindBox) => void;
}

export function DrawScene({
  session,
  analyzing,
  analyzeProgress = 0,
  curated = false,
  onSelect,
}: DrawSceneProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (analyzing) {
    return (
      <div className="draw-waiting">
        <AnalyzeProgressRing
          progress={analyzeProgress}
          label={
            curated
              ? "正在为你准备精选音匣…"
              : "正在从你的图文提炼三首歌曲…"
          }
        />
        {!curated && (
          <p className="mt-2 max-w-sm text-sm text-ink-muted">请稍等</p>
        )}
        <p className="mt-6 text-xs text-ink-soft">请保持页面打开</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSelect = (box: BlindBox) => {
    setSelectedId(box.id);
    window.setTimeout(() => onSelect(box), 300);
  };

  return (
    <div className="draw-stage">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="draw-stage-header draw-stage-header--compact"
      >
        <p className="draw-stage-eyebrow">
          {curated ? "精选音匣已就绪" : "三首歌曲已为你备好"}
        </p>
        <h2 className="draw-stage-title">
          {curated
            ? "打开这个音匣，听见此刻"
            : "选一首，听见此刻心境，解锁神秘音色"}
        </h2>
      </motion.div>

      <div className="draw-box-showcase">
        <div
          className={`draw-box-grid${curated ? " draw-box-grid--single" : ""}`}
        >
          {session.boxes.map((box, index) => (
            <GiftBox
              key={box.id}
              box={box}
              index={index}
              selected={selectedId === box.id}
              hovered={hoveredId === box.id}
              onHoverChange={(hovered) =>
                setHoveredId(hovered ? box.id : null)
              }
              onClick={() => handleSelect(box)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
