import type { Strategy } from "@/types";

export const BOX_IMAGE_SRC: Record<Strategy, string> = {
  sync: "/assets/boxes/sync.png",
  transition: "/assets/boxes/transition.png",
  serendipity: "/assets/boxes/serendipity.png",
};

export const BOX_STYLE_HINT: Record<Strategy, string> = {
  sync: "清冷钢琴 · 同频陪伴",
  transition: "暖调弦乐 · 微微上扬",
  serendipity: "电子梦境 · 意外相逢",
};
