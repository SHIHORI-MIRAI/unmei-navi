"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProfile } from "@/lib/storage";

export default function Header() {
  const [name, setName] = useState("");

  useEffect(() => {
    const profile = loadProfile();
    if (profile?.name) setName(profile.name);

    // プロフィール切替時にも更新
    function onStorage() {
      const p = loadProfile();
      setName(p?.name || "");
    }
    window.addEventListener("storage", onStorage);
    // カスタムイベントでも更新
    window.addEventListener("profile-changed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("profile-changed", onStorage);
    };
  }, []);

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
        <div className="flex items-center gap-3">
          <Link
            href="/students"
            className="text-muted hover:text-accent-gold transition-colors text-xs"
          >
            受講生
          </Link>
          <Link
            href="/profile"
            className="text-muted hover:text-accent-gold transition-colors text-sm flex items-center gap-1.5"
          >
            {name && (
              <span className="text-accent-orange font-medium text-xs max-w-[80px] truncate">
                {name}
              </span>
            )}
            設定
          </Link>
        </div>
      </div>
    </header>
  );
}
