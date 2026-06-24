import type { CalendarEntry, DrawResult, MomentAnalysis, MomentSource } from "@/types";

const CALENDAR_KEY = "music-blindbox-calendar";
const SESSION_KEY = "music-blindbox-session";
const IMAGE_KEY = "music-blindbox-image";
const SELECTED_KEY = "music-blindbox-selected";
const PENDING_MOMENT_KEY = "music-blindbox-pending-moment";

export interface PendingMoment {
  source?: MomentSource;
  scenarioId?: string;
  text?: string;
  caption?: string;
  imageDataUrl?: string;
}

export interface SelectedPayload {
  box: DrawResult["boxes"][0];
  analysis: MomentAnalysis;
  forceLibrary?: boolean;
  scenarioId?: string;
}

function stripImage(analysis: MomentAnalysis): MomentAnalysis {
  const { imageDataUrl: _removed, ...rest } = analysis;
  return rest;
}

export function savePendingMoment(payload: PendingMoment) {
  if (typeof window === "undefined") return;

  if (payload.imageDataUrl) {
    try {
      sessionStorage.setItem(IMAGE_KEY, payload.imageDataUrl);
    } catch {
      sessionStorage.removeItem(IMAGE_KEY);
    }
  }

  sessionStorage.setItem(PENDING_MOMENT_KEY, JSON.stringify(payload));
}

export function loadPendingMoment(): PendingMoment | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_MOMENT_KEY);
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as PendingMoment;
    const imageDataUrl =
      sessionStorage.getItem(IMAGE_KEY) || payload.imageDataUrl;
    return { ...payload, imageDataUrl: imageDataUrl || undefined };
  } catch {
    return null;
  }
}

export function clearPendingMoment() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_MOMENT_KEY);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SELECTED_KEY);
}

export function saveSession(result: DrawResult) {
  if (typeof window === "undefined") return;

  if (result.analysis.imageDataUrl) {
    try {
      sessionStorage.setItem(IMAGE_KEY, result.analysis.imageDataUrl);
    } catch {
      sessionStorage.removeItem(IMAGE_KEY);
    }
  } else {
    sessionStorage.removeItem(IMAGE_KEY);
  }

  const payload: DrawResult = {
    ...result,
    analysis: stripImage(result.analysis),
  };

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    sessionStorage.removeItem(IMAGE_KEY);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  }
}

export function loadSession(): DrawResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const result = JSON.parse(raw) as DrawResult;
    const imageDataUrl = sessionStorage.getItem(IMAGE_KEY) || undefined;
    return {
      ...result,
      analysis: {
        ...result.analysis,
        imageDataUrl: imageDataUrl || result.analysis.imageDataUrl,
      },
    };
  } catch {
    return null;
  }
}

export function saveSelected(
  boxId: string,
  box: DrawResult["boxes"][0],
  analysis: MomentAnalysis,
  options?: { forceLibrary?: boolean; scenarioId?: string },
) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    SELECTED_KEY,
    JSON.stringify({
      box,
      analysis: stripImage(analysis),
      forceLibrary: options?.forceLibrary,
      scenarioId: options?.scenarioId,
    } satisfies SelectedPayload),
  );
}

export function loadSelected(): SelectedPayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SELECTED_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SelectedPayload;
    const imageDataUrl = sessionStorage.getItem(IMAGE_KEY) || undefined;
    return {
      ...parsed,
      analysis: {
        ...parsed.analysis,
        imageDataUrl: imageDataUrl || parsed.analysis.imageDataUrl,
      },
    };
  } catch {
    return null;
  }
}

export function getCalendarEntries(): CalendarEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CALENDAR_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CalendarEntry[];
  } catch {
    return [];
  }
}

export function getCalendarEntriesSorted(): CalendarEntry[] {
  return getCalendarEntries().sort((a, b) => b.date.localeCompare(a.date));
}

export function getCalendarByMonth(month: string): CalendarEntry[] {
  return getCalendarEntriesSorted().filter((entry) => entry.date.startsWith(month));
}

export function saveCalendarEntry(entry: CalendarEntry): boolean {
  if (typeof window === "undefined") return false;
  const entries = getCalendarEntries().filter((item) => item.id !== entry.id);

  const safeEntry: CalendarEntry = {
    ...entry,
    visualCardDataUrl: entry.visualCardDataUrl.slice(0, 500000),
    imageDataUrl: entry.imageDataUrl?.slice(0, 300000),
  };

  entries.unshift(safeEntry);

  try {
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(entries.slice(0, 50)));
  } catch {
    const trimmed = entries.slice(0, 30).map((item, index) =>
      index > 5
        ? { ...item, visualCardDataUrl: "", imageDataUrl: undefined }
        : item,
    );
    try {
      localStorage.setItem(CALENDAR_KEY, JSON.stringify(trimmed));
    } catch {
      try {
        localStorage.setItem(
          CALENDAR_KEY,
          JSON.stringify(
            trimmed.slice(0, 15).map((item) => ({
              ...item,
              visualCardDataUrl: "",
              imageDataUrl: undefined,
            })),
          ),
        );
      } catch {
        return false;
      }
    }
  }

  const saved = getCalendarEntries().find((item) => item.id === safeEntry.id);
  return Boolean(saved?.visualCardDataUrl?.trim());
}

export function deleteCalendarEntry(id: string) {
  if (typeof window === "undefined") return;
  const entries = getCalendarEntries().filter((item) => item.id !== id);
  try {
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota errors on delete
  }
}

export function updateCalendarEntryJournal(id: string, journal: string) {
  if (typeof window === "undefined") return;
  const entries = getCalendarEntries();
  const index = entries.findIndex((item) => item.id === id);
  if (index === -1) return;

  const trimmed = journal.trim();
  const next = [...entries];
  next[index] = {
    ...next[index],
    journal: trimmed || undefined,
    journalUpdatedAt: trimmed ? new Date().toISOString() : undefined,
  };

  try {
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(next.slice(0, 50)));
  } catch {
    // keep existing entries if quota exceeded
  }
}

export function formatToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
