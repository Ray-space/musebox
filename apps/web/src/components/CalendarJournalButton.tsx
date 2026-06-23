"use client";

import { useEffect, useRef, useState } from "react";
import { updateCalendarEntryJournal } from "@/lib/storage";

const MAX_JOURNAL_LENGTH = 500;

interface CalendarJournalButtonProps {
  entryId: string;
  songTitle: string;
  journal?: string;
  onJournalChange: (journal: string) => void;
}

function PenIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M11.2 1.8l2 2c.4.4.4 1 0 1.4L5.6 12.8l-3.4.8.8-3.4L11.2 1.8z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M9.8 3.2l2 2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <path
        d="M2 2l10 10M12 2L2 12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CalendarJournalButton({
  entryId,
  songTitle,
  journal = "",
  onJournalChange,
}: CalendarJournalButtonProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(journal);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) {
      setDraft(journal);
    }
  }, [journal, open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleSave = () => {
    const trimmed = draft.trim();
    updateCalendarEntryJournal(entryId, trimmed);
    onJournalChange(trimmed);
    setOpen(false);
  };

  const handleClear = () => {
    setDraft("");
    updateCalendarEntryJournal(entryId, "");
    onJournalChange("");
    setOpen(false);
  };

  const hasJournal = Boolean(journal.trim());

  return (
    <>
      <button
        type="button"
        className={`calendar-journal-btn${hasJournal ? " has-journal" : ""}`}
        onClick={() => setOpen(true)}
        title="写音匣手记"
        aria-label={`为「${songTitle}」写音匣手记`}
      >
        <PenIcon />
        {hasJournal && <span className="calendar-journal-dot" aria-hidden />}
      </button>

      {open && (
        <div
          className="calendar-journal-backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div
          className="calendar-journal-modal glass"
          role="dialog"
          aria-modal="true"
          aria-labelledby="journal-modal-title"
        >
          <div className="calendar-journal-modal-header">
            <div>
              <h4 id="journal-modal-title" className="calendar-journal-modal-title">
                音匣手记
              </h4>
              <p className="calendar-journal-modal-sub">{songTitle}</p>
            </div>
            <button
              type="button"
              className="calendar-journal-close"
              onClick={() => setOpen(false)}
              aria-label="关闭"
            >
              <CloseIcon />
            </button>
          </div>
          <textarea
            ref={textareaRef}
            className="calendar-journal-textarea"
            value={draft}
            onChange={(event) =>
              setDraft(event.target.value.slice(0, MAX_JOURNAL_LENGTH))
            }
            placeholder="这首歌让你想起什么？写下当时的心情、场景，或它为何出现在生命里…"
            rows={5}
          />
          <p className="calendar-journal-count">
            {draft.length}/{MAX_JOURNAL_LENGTH}
          </p>
          <div className="calendar-journal-actions">
            {hasJournal && (
              <button
                type="button"
                className="calendar-journal-action calendar-journal-action--ghost"
                onClick={handleClear}
              >
                清除手记
              </button>
            )}
            <button
              type="button"
              className="calendar-journal-action calendar-journal-action--ghost"
              onClick={() => setOpen(false)}
            >
              取消
            </button>
            <button
              type="button"
              className="calendar-journal-action calendar-journal-action--primary"
              onClick={handleSave}
            >
              保存
            </button>
          </div>
        </div>
      )}
    </>
  );
}
