/** 各页面的显式「上一页」，避免 router.back() 因 replace 跳错 */
export function getParentPath(pathname: string): string | null {
  if (pathname === "/") return null;
  // 开盒结果 → 抽盒（draw 需 loadSession 恢复，见 draw/page.tsx）
  if (pathname.startsWith("/open/")) return "/draw";
  if (pathname === "/draw" || pathname === "/boxes") return "/";
  if (pathname === "/demo" || pathname === "/calendar") return "/";
  return "/";
}
