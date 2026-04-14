"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-card-border shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between h-14 px-4 text-foreground">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-accent-gold text-xl">☽</span>
          <h1 className="text-lg font-bold text-accent-orange tracking-wide">
            運命ナビ
          </h1>
          <span className="text-accent-gold text-sm">✦</span>
        </Link>
        <Link
          href="/profile"
          className="text-muted hover:text-accent-gold transition-colors text-sm"
        >
          設定
        </Link>
      </div>
    </header>
  );
}
