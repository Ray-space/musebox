"use client";

import { useEffect, useRef, useState } from "react";
import { downloadDataUrl } from "@/lib/visual-card";
import type { CalendarEntry } from "@/types";

interface CalendarEntryMenuProps {
  entry: CalendarEntry;
  onDelete: (entryId: string) => void;
}

function entryShareImage(entry: CalendarEntry) {
  return entry.visualCardDataUrl?.trim() || "";
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <circle cx="3" cy="8" r="1.2" />
      <circle cx="8" cy="8" r="1.2" />
      <circle cx="13" cy="8" r="1.2" />
    </svg>
  );
}

async function shareEntryImage(entry: CalendarEntry) {
  const imageUrl = entryShareImage(entry);
  if (!imageUrl) {
    window.alert("暂无歌词卡图片，请返回开盒页重新收藏。");
    return;
  }

  const filename = `MuseBox灵感音匣-${entry.songTitle}-${entry.date}.png`;

  if (navigator.share && imageUrl.startsWith("data:")) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type || "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: entry.songTitle,
          text: entry.boxCopy,
          files: [file],
        });
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
    }
  }

  downloadDataUrl(imageUrl, filename);
}

function saveEntryLyricCard(entry: CalendarEntry) {
  const imageUrl = entryShareImage(entry);
  if (!imageUrl) {
    window.alert("暂无歌词卡图片，请返回开盒页重新收藏。");
    return;
  }
  downloadDataUrl(imageUrl, `MuseBox灵感音匣-${entry.songTitle}-${entry.date}.png`);
}

async function saveEntrySong(entry: CalendarEntry) {
  if (!entry.audioUrl?.trim()) {
    window.alert("暂无音频文件。");
    return;
  }

  try {
    const response = await fetch(entry.audioUrl);
    if (!response.ok) throw new Error("fetch failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `MuseBox灵感音匣-${entry.songTitle}.mp3`;
    link.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.alert("暂无音频文件。");
  }
}

export function CalendarEntryMenu({ entry, onDelete }: CalendarEntryMenuProps) {
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setOpen(false);
    setSaveOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleDelete = () => {
    closeMenu();
    const confirmed = window.confirm(
      `确定删除「${entry.songTitle}」的收藏吗？此操作不可恢复。`,
    );
    if (confirmed) onDelete(entry.id);
  };

  const handleShare = async () => {
    closeMenu();
    await shareEntryImage(entry);
  };

  const handleSaveLyricCard = () => {
    closeMenu();
    saveEntryLyricCard(entry);
  };

  const handleSaveSong = async () => {
    closeMenu();
    await saveEntrySong(entry);
  };

  return (
    <div ref={rootRef} className="calendar-entry-menu">
      <button
        type="button"
        className="calendar-entry-menu-trigger"
        onClick={() => {
          setOpen((value) => {
            if (value) setSaveOpen(false);
            return !value;
          });
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${entry.songTitle} 更多操作`}
      >
        <MoreIcon />
      </button>

      {open && (
        <div className="calendar-entry-menu-panel" role="menu">
          <button
            type="button"
            className="calendar-entry-menu-item"
            role="menuitem"
            onClick={handleDelete}
          >
            删除
          </button>
          <button
            type="button"
            className="calendar-entry-menu-item"
            role="menuitem"
            onClick={handleShare}
          >
            分享
          </button>
          <button
            type="button"
            className={`calendar-entry-menu-item calendar-entry-menu-item--expand${saveOpen ? " is-open" : ""}`}
            role="menuitem"
            aria-expanded={saveOpen}
            onClick={() => setSaveOpen((value) => !value)}
          >
            保存
            <span className="calendar-entry-menu-chevron" aria-hidden>
              ›
            </span>
          </button>
          {saveOpen && (
            <div className="calendar-entry-menu-sub" role="group">
              <button
                type="button"
                className="calendar-entry-menu-subitem"
                role="menuitem"
                onClick={handleSaveLyricCard}
              >
                保存歌词卡
              </button>
              <button
                type="button"
                className="calendar-entry-menu-subitem"
                role="menuitem"
                onClick={handleSaveSong}
              >
                保存歌曲
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
