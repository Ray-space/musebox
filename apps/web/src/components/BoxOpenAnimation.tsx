"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { OpeningGiftBox } from "@/components/OpeningGiftBox";
import type { BlindBox } from "@/types";

type OpenStage = "shake" | "lift" | "open" | "burst";

interface BoxOpenAnimationProps {
  box: BlindBox;
  onComplete: () => void;
}

const STAGE_LABELS: Record<OpenStage, string> = {
  shake: "盲盒轻轻颤动…",
  lift: "盒盖正在弹起…",
  open: "盲盒打开了…",
  burst: "惊喜即将呈现…",
};

export function BoxOpenAnimation({ box, onComplete }: BoxOpenAnimationProps) {
  const [stage, setStage] = useState<OpenStage>("shake");

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage("lift"), 650),
      setTimeout(() => setStage("open"), 1100),
      setTimeout(() => setStage("burst"), 1700),
      setTimeout(() => onComplete(), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="relative flex min-h-[480px] w-full flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <OpeningGiftBox box={box} stage={stage} />
      </motion.div>

      <motion.p
        key={stage}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className="relative mt-12 text-sm tracking-wide text-ink-muted"
      >
        {STAGE_LABELS[stage]}
      </motion.p>
    </div>
  );
}
