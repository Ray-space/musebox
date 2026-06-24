import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import path from "path";

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

export async function readGeneratedAudioFromDisk(
  id: string,
): Promise<Buffer | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const filePath = path.join(process.cwd(), "public", "generated", `${id}.mp3`);
    return await readFile(filePath);
  } catch {
    return null;
  }
}

export async function resolveGeneratedAudio(
  id: string,
): Promise<Buffer | null> {
  const cached = readGeneratedAudio(id);
  if (cached) return cached;
  return readGeneratedAudioFromDisk(id);
}
