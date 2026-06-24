"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CalendarEntryMenu } from "@/components/CalendarEntryMenu";
import { CalendarJournalButton } from "@/components/CalendarJournalButton";
import { CalendarPlayButton } from "@/components/CalendarPlayButton";
import {
  deleteCalendarEntry,
  formatMonth,
  getCalendarByMonth,
  getCalendarEntriesSorted,
} from "@/lib/storage";
import type { CalendarEntry } from "@/types";
import { STRATEGY_LABELS } from "@/types";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function buildMonthOptions() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const years: number[] = [];
  for (let year = currentYear - 2; year <= currentYear + 1; year += 1) {
    years.push(year);
  }
  return years;
}

function entryThumb(entry: CalendarEntry) {
  return entry.visualCardDataUrl?.trim() || "";
}

function CalendarEntryCard({
  entry,
  playingId,
  onPlayToggle,
  onJournalChange,
  onDelete,
}: {
  entry: CalendarEntry;
  playingId: string | null;
  onPlayToggle: (entryId: string, playing: boolean) => void;
  onJournalChange: (entryId: string, journal: string) => void;
  onDelete: (entryId: string) => void;
}) {
  const thumb = entryThumb(entry);

  return (
    <div className="glass calendar-entry-card rounded-3xl p-4">
      <div className="flex gap-4">
        <div className="calendar-entry-thumb">
          {thumb ? (
            <img
              src={thumb}
              alt={entry.songTitle}
              className="h-24 w-20 rounded-2xl object-cover ring-1 ring-violet-200"
            />
          ) : (
            <div className="calendar-entry-thumb-placeholder h-24 w-20 rounded-2xl" />
          )}
          {entry.audioUrl && (
            <CalendarPlayButton
              audioUrl={entry.audioUrl}
              strategy={entry.strategy}
              genre={entry.genre ?? "pop"}
              songTitle={entry.songTitle}
              isActive={playingId === entry.id}
              onToggle={(playing) => onPlayToggle(entry.id, playing)}
              size="md"
            />
          )}
        </div>
        <div className="relative min-w-0 flex-1">
          <CalendarJournalButton
            entryId={entry.id}
            songTitle={entry.songTitle}
            journal={entry.journal}
            onJournalChange={(journal) => onJournalChange(entry.id, journal)}
          />
          <p className="text-xs text-ink-soft">{entry.date}</p>
          <p className="mt-1 text-base text-ink-primary">{entry.songTitle}</p>
          <p className="text-sm text-ink-muted">{entry.songArtist}</p>
          <p className="mt-2 text-xs text-violet-600">
            {STRATEGY_LABELS[entry.strategy]}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-ink-muted">
            {entry.boxCopy}
          </p>
          {entry.journal && (
            <p className="calendar-journal-preview mt-2 line-clamp-2 text-sm">
              {entry.journal}
            </p>
          )}
        </div>
      </div>
      <CalendarEntryMenu entry={entry} onDelete={onDelete} />
    </div>
  );
}

export default function CalendarPage() {
  const [selectedMonth, setSelectedMonth] = useState(formatMonth());
  const [monthEntries, setMonthEntries] = useState<CalendarEntry[]>([]);
  const [allEntries, setAllEntries] = useState<CalendarEntry[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const years = useMemo(() => buildMonthOptions(), []);

  const [year, month] = selectedMonth.split("-").map(Number);

  const refreshEntries = useCallback(() => {
    setMonthEntries(getCalendarByMonth(selectedMonth));
    setAllEntries(getCalendarEntriesSorted());
  }, [selectedMonth]);

  useEffect(() => {
    refreshEntries();
  }, [refreshEntries]);

  useEffect(() => {
    const onFocus = () => refreshEntries();
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onFocus);
    };
  }, [refreshEntries]);

  const calendarCells = useMemo(() => {
    const totalDays = new Date(year, month, 0).getDate();
    const startWeekday = new Date(year, month - 1, 1).getDay();
    const blanks = Array.from({ length: startWeekday }, () => null);
    const days = Array.from({ length: totalDays }, (_, index) => index + 1);
    return [...blanks, ...days];
  }, [year, month]);

  const entryMap = useMemo(() => {
    const map = new Map<string, CalendarEntry>();
    for (const entry of monthEntries) {
      const day = entry.date.split("-")[2];
      const existing = map.get(day);
      if (!existing || entry.date.localeCompare(existing.date) > 0) {
        map.set(day, entry);
      }
    }
    return map;
  }, [monthEntries]);

  const handlePlayToggle = (entryId: string, playing: boolean) => {
    setPlayingId(playing ? entryId : null);
  };

  const handleJournalChange = (entryId: string, journal: string) => {
    const patch = (entry: CalendarEntry) =>
      entry.id === entryId
        ? {
            ...entry,
            journal: journal || undefined,
            journalUpdatedAt: journal ? new Date().toISOString() : undefined,
          }
        : entry;

    setMonthEntries((prev) => prev.map(patch));
    setAllEntries((prev) => prev.map(patch));
  };

  const handleDelete = (entryId: string) => {
    deleteCalendarEntry(entryId);
    if (playingId === entryId) setPlayingId(null);
    setMonthEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    setAllEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  return (
    <AppShell>
      <div className="calendar-page space-y-6">
        <div className="calendar-header">
          <div>
            <h2 className="calendar-title">灵感音乐日历</h2>
          </div>

          <div className="calendar-picker">
            <select
              className="calendar-select"
              value={year}
              onChange={(event) => {
                const nextYear = Number(event.target.value);
                setSelectedMonth(`${nextYear}-${String(month).padStart(2, "0")}`);
              }}
              aria-label="选择年份"
            >
              {years.map((item) => (
                <option key={item} value={item}>
                  {item} 年
                </option>
              ))}
            </select>
            <select
              className="calendar-select"
              value={month}
              onChange={(event) => {
                const nextMonth = Number(event.target.value);
                setSelectedMonth(`${year}-${String(nextMonth).padStart(2, "0")}`);
              }}
              aria-label="选择月份"
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
                <option key={item} value={item}>
                  {item} 月
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="calendar-grid-head">
          {WEEKDAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarCells.map((day, index) => {
            if (!day) {
              return <div key={`blank-${index}`} className="calendar-cell is-empty" />;
            }

            const key = String(day).padStart(2, "0");
            const entry = entryMap.get(key);
            const thumb = entry ? entryThumb(entry) : "";

            return (
              <div
                key={day}
                className={`calendar-cell ${entry ? "has-entry" : ""}`}
              >
                <p className="calendar-day">{day}</p>
                {entry && (
                  <div className="calendar-thumb">
                    {thumb ? (
                      <img src={thumb} alt={entry.songTitle} />
                    ) : (
                      <div className="calendar-entry-thumb-placeholder calendar-thumb-placeholder" />
                    )}
                    {entry.audioUrl && (
                      <CalendarPlayButton
                        audioUrl={entry.audioUrl}
                        strategy={entry.strategy}
                        genre={entry.genre ?? "pop"}
                        songTitle={entry.songTitle}
                        isActive={playingId === entry.id}
                        onToggle={(playing) => handlePlayToggle(entry.id, playing)}
                        size="sm"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <p className="calendar-journal-tagline">
            为每一首音乐，留下它诞生的故事。
          </p>

          <div className="space-y-3">
            <h3 className="text-sm text-ink-muted">
              全部收藏
              {allEntries.length > 0 && (
                <span className="ml-1 text-ink-soft">（{allEntries.length}）</span>
              )}
            </h3>
            {allEntries.length === 0 && (
              <p className="text-sm text-ink-soft">
                还没有收藏。开盒后点击「收藏到日历」即可保存。
              </p>
            )}
            {allEntries.map((entry) => (
              <CalendarEntryCard
                key={entry.id}
                entry={entry}
                playingId={playingId}
                onPlayToggle={handlePlayToggle}
                onJournalChange={handleJournalChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>

        <Link href="/" className="dream-btn block rounded-full py-3 text-center text-sm">
          记录新的瞬间
        </Link>
      </div>
    </AppShell>
  );
}
