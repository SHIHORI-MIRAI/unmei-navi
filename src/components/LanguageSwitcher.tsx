"use client";

import { LANGS } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";

/**
 * 言語切替。
 * - variant="compact": ヘッダー用の小さなトグル（🌐 日 / 한）
 * - variant="full": プロフィール等での大きめセレクター（言語名を表示）
 */
export default function LanguageSwitcher({
  variant = "compact",
}: {
  variant?: "compact" | "full";
}) {
  const { lang, setLang } = useI18n();

  if (variant === "full") {
    return (
      <div className="flex gap-2">
        {LANGS.map((l) => {
          const active = l.code === lang;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              aria-pressed={active}
              className={`flex-1 rounded-xl border py-2.5 text-sm transition-colors ${
                active
                  ? "bg-accent-orange text-white border-accent-orange"
                  : "bg-card-bg text-foreground border-card-border hover:border-accent-orange/50"
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-card-border bg-white/60 px-0.5 py-0.5">
      <span className="text-accent-gold/80 text-[11px] px-1 leading-none" aria-hidden>
        🌐
      </span>
      {LANGS.map((l) => {
        const active = l.code === lang;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            aria-label={l.label}
            aria-pressed={active}
            className={`min-w-[22px] rounded-full px-1.5 py-0.5 text-[11px] leading-none transition-colors ${
              active
                ? "bg-accent-orange text-white"
                : "text-muted hover:text-accent-orange"
            }`}
          >
            {l.short}
          </button>
        );
      })}
    </div>
  );
}
