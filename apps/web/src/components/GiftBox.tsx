"use client";

/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { BOX_IMAGE_SRC } from "@/lib/box-assets";
import type { BlindBox, Strategy } from "@/types";

interface GiftBoxProps {
  box: BlindBox;
  index?: number;
  onClick?: () => void;
  selected?: boolean;
  hovered?: boolean;
  onHoverChange?: (hovered: boolean) => void;
  opening?: boolean;
  shaking?: boolean;
}

export function GiftBox({
  box,
  index = 0,
  onClick,
  selected = false,
  hovered: hoveredProp,
  onHoverChange,
  opening = false,
  shaking = false,
}: GiftBoxProps) {
  const strategy = box.strategy as Strategy;
  const isActive = selected || hoveredProp;
  const displayTitle = box.songTitle || box.copy;

  const card = (
    <div
      className={[
        "box-3d-card",
        strategy,
        isActive ? "is-active" : "",
        selected ? "is-selected" : "",
        opening ? "is-opening" : "",
        shaking ? "is-shaking" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <div className="box-3d-stage">
        <div className="box-3d-aura" aria-hidden />
        <div className="box-3d-aura box-3d-aura--outer" aria-hidden />
        {selected && <div className="box-3d-select-ring" aria-hidden />}

        <motion.div
          className="box-3d-float"
          animate={
            shaking
              ? { rotate: [0, -2, 2, 0], y: [0, -4, 0] }
              : { y: [0, -5, 0] }
          }
          transition={
            shaking
              ? { duration: 0.55, ease: "easeInOut" }
              : {
                  duration: 4.2 + index * 0.35,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        >
          <div className="box-3d-figure">
            <div className="box-3d-mist" aria-hidden />
            <img
              src={BOX_IMAGE_SRC[strategy]}
              alt={`${strategy} 音匣`}
              className="box-3d-img"
              draggable={false}
            />
          </div>
        </motion.div>

        <div className="box-3d-pedestal" aria-hidden>
          <div className="box-3d-pedestal-glow" />
          <div className="box-3d-pedestal-ellipse" />
        </div>
      </div>

      <div className="box-3d-meta">
        <p className="box-3d-title">《{displayTitle}》</p>
        <p className="box-3d-style-hint">{box.atmosphereHint}</p>
      </div>
    </div>
  );

  if (!onClick) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 32 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: index * 0.15, type: "spring", stiffness: 110 }}
        className="box-3d-wrap"
      >
        {card}
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.88, y: 32 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.15, type: "spring", stiffness: 110 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="box-3d-wrap box-3d-button"
      aria-label={`选择音匣《${displayTitle}》`}
      aria-pressed={selected}
    >
      {card}
    </motion.button>
  );
}
