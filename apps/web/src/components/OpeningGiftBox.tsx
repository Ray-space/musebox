"use client";

/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { BOX_IMAGE_SRC } from "@/lib/box-assets";
import type { BlindBox, Strategy } from "@/types";

interface OpeningGiftBoxProps {
  box: BlindBox;
  stage: "shake" | "lift" | "open" | "burst";
}

export function OpeningGiftBox({ box, stage }: OpeningGiftBoxProps) {
  const strategy = box.strategy as Strategy;
  const fullOpen = stage === "open" || stage === "burst";
  const burst = stage === "burst";

  return (
    <div className={`opening-box-scene ${strategy}`}>
      <motion.div
        className={`opening-box-wrap ${strategy}`}
        animate={
          stage === "shake"
            ? {
                rotate: [0, -2.5, 2.5, -2, 2, 0],
                scale: [1, 1.02, 1, 1.03, 1],
                y: [0, -3, 0, -4, 0],
              }
            : stage === "lift"
              ? { scale: [1, 1.05, 1.03], y: [0, -10, -6] }
              : fullOpen
                ? { scale: burst ? 1.08 : 1.04, y: -8, opacity: burst ? 0.15 : 1 }
                : { scale: 1, y: 0, opacity: 1 }
        }
        transition={{
          duration: stage === "shake" ? 0.55 : 0.45,
          ease: "easeInOut",
        }}
      >
        <div className="opening-box-aura" aria-hidden />
        <div className="opening-box-aura opening-box-aura--outer" aria-hidden />

        <motion.div
          className="opening-box-float"
          animate={
            stage === "shake"
              ? { rotate: [0, -1.5, 1.5, 0], y: [0, -4, 0] }
              : { y: [0, -5, 0] }
          }
          transition={
            stage === "shake"
              ? { duration: 0.55, ease: "easeInOut" }
              : { duration: 3.8, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <div className="opening-box-figure">
            <div className="opening-box-mist" aria-hidden />
            <img
              src={BOX_IMAGE_SRC[strategy]}
              alt={`${strategy} 音匣`}
              className="opening-box-img"
              draggable={false}
            />
          </div>
        </motion.div>

        <div className="opening-box-pedestal" aria-hidden>
          <div className="opening-box-pedestal-glow" />
          <div className="opening-box-pedestal-ellipse" />
        </div>

        <motion.div
          className="opening-box-inner-glow"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{
            opacity: fullOpen ? [0, 0.95, 0.7] : 0,
            scale: fullOpen ? [0.4, 1.3, 1.1] : 0.4,
          }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          aria-hidden
        />
      </motion.div>

      {burst && (
        <>
          <motion.div
            className="opening-box-halo"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.9, 0.5], scale: [0.6, 1.4, 1.2] }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            aria-hidden
          />
          <motion.div
            className="opening-box-flash"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.85, 0], scale: [0.5, 1.5, 1.9] }}
            transition={{ duration: 0.8 }}
            aria-hidden
          />
          {[...Array(16)].map((_, i) => (
            <motion.span
              key={i}
              className="opening-box-particle"
              initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                x: Math.cos((i / 16) * Math.PI * 2) * (60 + (i % 3) * 20),
                y: Math.sin((i / 16) * Math.PI * 2) * (40 + (i % 2) * 25) - 50,
                scale: [0, 1, 0.5],
              }}
              transition={{ duration: 0.9, delay: i * 0.02, ease: "easeOut" }}
              aria-hidden
            />
          ))}
        </>
      )}

      <p className="opening-box-title">《{box.songTitle || box.copy}》</p>
    </div>
  );
}
