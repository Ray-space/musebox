import type { OpenApiResponse, OpenJobStatus } from "@/types";

const TTL_MS = 60 * 60 * 1000;

export interface OpenJob {
  id: string;
  status: OpenJobStatus;
  stage?: string;
  progress?: number;
  error?: string;
  result?: OpenApiResponse;
  expiresAt: number;
}

function getStore(): Map<string, OpenJob> {
  const globalStore = globalThis as typeof globalThis & {
    __museboxOpenJobs?: Map<string, OpenJob>;
  };
  if (!globalStore.__museboxOpenJobs) {
    globalStore.__museboxOpenJobs = new Map();
  }
  return globalStore.__museboxOpenJobs;
}

function pruneExpired(store: Map<string, OpenJob>) {
  const now = Date.now();
  for (const [id, job] of store.entries()) {
    if (job.expiresAt <= now) {
      store.delete(id);
    }
  }
}

export function createOpenJob(id: string): OpenJob {
  const store = getStore();
  pruneExpired(store);
  const job: OpenJob = {
    id,
    status: "pending",
    expiresAt: Date.now() + TTL_MS,
  };
  store.set(id, job);
  return job;
}

export function getOpenJob(id: string): OpenJob | null {
  const store = getStore();
  const job = store.get(id);
  if (!job) return null;
  if (job.expiresAt <= Date.now()) {
    store.delete(id);
    return null;
  }
  return job;
}

export function updateOpenJob(
  id: string,
  patch: Partial<Pick<OpenJob, "status" | "stage" | "progress" | "error" | "result">>,
): OpenJob | null {
  const store = getStore();
  const job = store.get(id);
  if (!job) return null;
  Object.assign(job, patch);
  store.set(id, job);
  return job;
}
