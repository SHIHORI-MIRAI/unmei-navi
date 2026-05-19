"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FitnessHeader() {
  const pathname = usePathname();
  const isPlaying = pathname?.startsWith("/fitness/play");
  // ゲーム中は集中したいのでヘッダー非表示
  if (isPlaying) return null;

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-between h-14 px-4">
        <Link href="/fitness" className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <h1 className="text-lg font-bold tracking-wide">リズムビート</h1>
        </Link>
        <Link
          href="/"
          className="text-xs bg-white/20 hover:bg-white/30 rounded-full px-3 py-1.5 transition-colors"
        >
          ☽ 占いへ
        </Link>
      </div>
    </header>
  );
}
