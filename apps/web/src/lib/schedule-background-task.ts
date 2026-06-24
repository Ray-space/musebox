/** Vercel 上用 waitUntil 保证 response 返回后任务继续；其他环境 fire-and-forget */
export function scheduleBackgroundTask(task: () => Promise<void>): void {
  if (process.env.VERCEL === "1") {
    import("@vercel/functions")
      .then(({ waitUntil }) => {
        waitUntil(task());
      })
      .catch(() => {
        void task();
      });
    return;
  }
  void task();
}
