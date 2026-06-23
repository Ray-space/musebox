"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "记录" },
  { href: "/calendar", label: "日历" },
];

interface AppShellProps {
  children: React.ReactNode;
  variant?: "default" | "home";
}

export function AppShell({ children, variant = "default" }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const showBack = pathname !== "/";

  return (
    <>
      <div className={`dream-bg-stars ${variant === "home" ? "is-home" : ""}`} aria-hidden />
      {variant === "home" && <div className="home-wave-bg" aria-hidden />}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-10 pt-7 lg:px-10">
        <header className="mb-10 flex items-center justify-between border-b border-violet-100 pb-5">
          <div>
            <p className="text-xs tracking-[0.28em] text-ink-soft">
              <span className="brand-mark">MuseBox灵感音匣</span>
            </p>
          </div>
          <nav className="flex gap-2">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-pill ${active ? "nav-pill-active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        {showBack && (
          <footer className="app-page-footer">
            <button
              type="button"
              className="app-back-btn"
              onClick={() => router.back()}
            >
              ← 返回上一页
            </button>
          </footer>
        )}
      </div>
    </>
  );
}
