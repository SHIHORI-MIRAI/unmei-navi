"use client";

import { useEffect, useState } from "react";

interface UsageHelpProps {
  /** パネルの見出し（省略時は「このページの使い方」） */
  title?: string;
  /** 手順・説明の各項目（番号付きで表示） */
  steps: React.ReactNode[];
  /**
   * 開閉状態を localStorage に記憶するためのキー。
   * 指定すると、ユーザーが一度閉じればその状態を覚える。
   */
  storageKey?: string;
}

/**
 * 各機能ページの先頭に置く、開閉式の「使い方」パネル。
 * 初回は開いた状態で表示し、混乱しやすい機能の使い方をその場で案内する。
 */
export default function UsageHelp({
  title = "このページの使い方",
  steps,
  storageKey,
}: UsageHelpProps) {
  const [open, setOpen] = useState(true);

  // 記憶した開閉状態を復元（閉じていたら閉じたまま）
  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      if (localStorage.getItem(storageKey) === "0") setOpen(false);
    }
  }, [storageKey]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      if (storageKey && typeof window !== "undefined") {
        localStorage.setItem(storageKey, next ? "1" : "0");
      }
      return next;
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-accent-gold/30 bg-gradient-to-br from-accent-gold/10 via-card-bg to-accent-orange/5 shadow-sm">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-bold text-accent-gold">
          <span>💡</span>
          {title}
        </span>
        <span
          className={`text-lg text-accent-gold/70 transition-transform ${open ? "rotate-180" : ""}`}
        >
          ⌄
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-xs leading-relaxed text-foreground/85"
              >
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent-orange/15 text-[11px] font-bold text-accent-orange">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
