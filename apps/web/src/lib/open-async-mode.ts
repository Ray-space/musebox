/** OPEN_ASYNC=1 → 异步开盒（默认，云托管推荐）；OPEN_ASYNC=0 → 同步（当前长连接行为） */
export function isOpenAsyncEnabled(): boolean {
  const raw = process.env.OPEN_ASYNC?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") return false;
  return true;
}
