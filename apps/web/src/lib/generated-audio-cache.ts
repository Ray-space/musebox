import { randomUUID } from "crypto";

interface CachedAudio {
  buffer: Buffer;
  expiresAt: number;
}

const TTL_MS = 60 * 60 * 1000;

function getStore(): Map<string, CachedAudio> {
  const globalStore = globalThis as typeof globalThis & {
    __museboxGeneratedAudio?: Map<string, CachedAudio>;
  };
  if (!globalStore.__museboxGeneratedAudio) {
    globalStore.__museboxGeneratedAudio = new Map();
  }
  return globalStore.__museboxGeneratedAudio;
}

function pruneExpired(store: Map<string, CachedAudio>) {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (entry.expiresAt <= now) {
      store.delete(id);
    }
  }
}

export function storeGeneratedAudio(buffer: Buffer): string {
  const store = getStore();
  pruneExpired(store);
  const id = randomUUID();
  store.set(id, { buffer, expiresAt: Date.now() + TTL_MS });
  return id;
}

export function readGeneratedAudio(id: string): Buffer | null {
  const store = getStore();
  const entry = store.get(id);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(id);
    return null;
  }
  return entry.buffer;
}
