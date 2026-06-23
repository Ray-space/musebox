"use client";

import { motion } from "framer-motion";
import type { TimbreProfile } from "@/types";

interface MusicSpecSheetProps {
  timbre: TimbreProfile;
  visible: boolean;
}

export function MusicSpecSheet({ timbre, visible }: MusicSpecSheetProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="music-spec-sheet"
    >
      <p className="music-spec-eyebrow">音乐说明书</p>
      <p className="music-spec-label">{timbre.label}</p>
      <ul className="music-spec-layers">
        {timbre.layers.map((layer) => (
          <li key={layer}>{layer}</li>
        ))}
      </ul>
      <p className="music-spec-feel">听感：{timbre.listeningFeel}</p>
      <p className="music-spec-beat">节拍：{timbre.beatStyle}</p>
    </motion.div>
  );
}
