"use client";

import { motion } from "framer-motion";
import type { BlindBox } from "@/types";
import { STRATEGY_CARD_STYLE } from "@/types";

interface BlindBoxCardProps {
  box: BlindBox;
  index: number;
  onSelect: (box: BlindBox) => void;
}

export function BlindBoxCard({ box, index, onSelect }: BlindBoxCardProps) {
  const style = STRATEGY_CARD_STYLE[box.strategy];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(box)}
      className={`glass w-full rounded-3xl p-6 text-left ${style.border} ${style.glow}`}
    >
      <p className="mb-4 text-xs tracking-[0.25em] text-white/35">
        盲盒 {index + 1}
      </p>
      <p className="text-lg leading-8 text-white/90">{box.copy}</p>
      <p className="mt-6 text-sm text-white/40">点选最像此刻感受的一个</p>
    </motion.button>
  );
}
