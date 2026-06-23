import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC, ZCOOL_XiaoWei } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const artLyricFont = ZCOOL_XiaoWei({
  weight: "400",
  variable: "--font-art-lyric",
  subsets: ["latin"],
});

const artSerifFont = Noto_Serif_SC({
  weight: ["400", "600"],
  variable: "--font-art-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MuseBox灵感音匣",
  description: "写+拍 → 抽 → 看+听。把日常瞬间交给音乐回应。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MuseBox灵感音匣",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f4ff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${artLyricFont.variable} ${artSerifFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
