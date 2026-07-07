"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { loadProfile } from "@/lib/storage";
import { useI18n } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dict";
import {
  calcNumerology,
  calcLuckyInfo,
  generateDailyMessage,
  type NumerologyResult,
  type LuckyInfo,
  type DailyMessage,
} from "@/lib/divination";

const GUIDE_BANNER_KEY = "unmei-guide-banner-dismissed";

/** ホームの機能メニュー（水彩アイコン＋カードごとの淡い色味） */
const MENU_ITEMS: {
  href: string;
  titleKey: DictKey;
  subtitleKey: DictKey;
  icon: string;
  bg: string;
}[] = [
  {
    href: "/yearly",
    titleKey: "home.menu.yearly.title",
    subtitleKey: "home.menu.yearly.subtitle",
    icon: "/menu/year.png",
    bg: "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(255,255,255,0.55))",
  },
  {
    href: "/monthly",
    titleKey: "home.menu.monthly.title",
    subtitleKey: "home.menu.monthly.subtitle",
    icon: "/menu/month.png",
    bg: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(255,255,255,0.55))",
  },
  {
    href: "/compatibility",
    titleKey: "home.menu.compat.title",
    subtitleKey: "home.menu.compat.subtitle",
    icon: "/menu/compat.png",
    bg: "linear-gradient(135deg, rgba(244,114,182,0.12), rgba(255,255,255,0.55))",
  },
  {
    href: "/matrix",
    titleKey: "home.menu.matrix.title",
    subtitleKey: "home.menu.matrix.subtitle",
    icon: "/menu/matrix.png",
    bg: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(255,255,255,0.55))",
  },
  {
    href: "/oracle",
    titleKey: "home.menu.oracle.title",
    subtitleKey: "home.menu.oracle.subtitle",
    icon: "/menu/oracle.png",
    bg: "linear-gradient(135deg, rgba(217,180,74,0.12), rgba(255,255,255,0.55))",
  },
];

/** 初回ウェルカム画面の4つのベネフィット（水彩アイコン） */
const WELCOME_BENEFITS: { icon: string; labelKey: DictKey }[] = [
  { icon: "/welcome/benefit-star.png", labelKey: "home.benefit.star" },
  { icon: "/welcome/benefit-moon.png", labelKey: "home.benefit.moon" },
  { icon: "/welcome/benefit-book.png", labelKey: "home.benefit.book" },
  { icon: "/welcome/benefit-crystal.png", labelKey: "home.benefit.crystal" },
];

/** イラストの左端をカード背景になじませる共通マスク */
const LEFT_FADE: CSSProperties = {
  WebkitMaskImage: "linear-gradient(to right, transparent, #000 42%)",
  maskImage: "linear-gradient(to right, transparent, #000 42%)",
};

export default function Home() {
  const { t, lang } = useI18n();
  const [hasProfile, setHasProfile] = useState(false);
  const [daily, setDaily] = useState<DailyMessage | null>(null);
  const [lucky, setLucky] = useState<LuckyInfo | null>(null);
  const [numerology, setNumerology] = useState<NumerologyResult | null>(null);
  const [showGuideBanner, setShowGuideBanner] = useState(false);

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) return;
    setHasProfile(true);

    const today = new Date();
    const num = calcNumerology(profile.birthDate, today, lang);
    setNumerology(num);
    setDaily(generateDailyMessage(profile.birthDate, today, lang));
    setLucky(calcLuckyInfo(today, num.lifePathNumber, lang));

    // ガイドバナーは閉じたフラグがなければ表示
    if (typeof window !== "undefined") {
      setShowGuideBanner(localStorage.getItem(GUIDE_BANNER_KEY) !== "1");
    }
  }, [lang]);

  function dismissGuideBanner() {
    setShowGuideBanner(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(GUIDE_BANNER_KEY, "1");
    }
  }

  if (!hasProfile) {
    return (
      <div className="space-y-6">
        {/* ようこそカード */}
        <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-card-border shadow-sm bg-gradient-to-br from-card-bg via-card-bg to-[#ece4f7] p-5 min-h-[210px]">
          {/* コンパス＋クリスタルの水彩イラスト */}
          <img
            src="/welcome/hero.png"
            alt=""
            aria-hidden
            className="pointer-events-none select-none absolute top-1/2 -translate-y-1/2 -right-2 w-36 float-slow"
            style={{
              WebkitMaskImage: "radial-gradient(circle at 60% 50%, #000 58%, transparent 80%)",
              maskImage: "radial-gradient(circle at 60% 50%, #000 58%, transparent 80%)",
            }}
          />
          <div className="relative z-10 space-y-3.5 pr-28">
            <div className="flex items-center gap-1.5 text-accent-gold text-sm">
              <span className="sparkle">✦</span>
              <span>{t("home.welcome.greeting")}</span>
            </div>
            <p className="font-mincho text-xl font-bold text-foreground leading-relaxed">
              {t("home.welcome.title")}
            </p>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 mt-1 px-6 py-3 rounded-full text-white text-sm font-bold shadow-md bg-gradient-to-r from-accent-orange to-accent-gold hover:opacity-90 transition-opacity"
            >
              {t("home.welcome.cta")} <span className="sparkle">✦</span>
            </Link>
          </div>
        </section>

        {/* 4つのベネフィット */}
        <div className="animate-fade-up grid grid-cols-4 gap-2" style={{ animationDelay: "0.08s" }}>
          {WELCOME_BENEFITS.map((b) => (
            <div key={b.labelKey} className="flex flex-col items-center gap-1.5 text-center">
              <span className="w-16 h-16 rounded-full overflow-hidden border border-accent-gold/25 bg-card-bg shadow-sm">
                <img src={b.icon} alt="" className="w-full h-full object-cover" />
              </span>
              <span className="text-[10px] leading-tight text-muted whitespace-pre-line">
                {t(b.labelKey)}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted/60 px-4">
          {t("common.disclaimer")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 使い方ガイドバナー（初回のみ） */}
      {showGuideBanner && (
        <section className="animate-fade-up relative overflow-hidden bg-gradient-to-br from-accent-gold/10 via-card-bg to-accent-orange/10 border border-accent-gold/30 rounded-3xl p-5 shadow-sm">
          {/* 水彩の月＋星の装飾（/decorations/moon-stars.png を置くと表示） */}
          <div
            className="deco float-slow top-3 -right-3 w-32 h-32 opacity-90"
            style={{ backgroundImage: "url('/decorations/moon-stars.png')" }}
          />
          <div className="relative z-10 flex items-start gap-4">
            <span className="flex-shrink-0 w-14 h-14 rounded-2xl bg-accent-gold/15 flex items-center justify-center text-2xl shadow-inner">
              📖
            </span>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="font-mincho text-lg font-bold text-accent-gold tracking-wide">
                {t("home.guide.title")}
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed max-w-[15rem]">
                {t("home.guide.body")}
              </p>
              <div className="flex items-center gap-3 pt-1.5">
                <Link
                  href="/guide"
                  className="text-xs bg-accent-orange text-white px-4 py-2 rounded-full shadow-sm hover:bg-accent-light transition-colors"
                >
                  {t("home.guide.cta")}
                </Link>
                <button
                  onClick={dismissGuideBanner}
                  className="text-[11px] text-muted hover:text-foreground"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 今日のメッセージ */}
      <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-card-border shadow-sm bg-gradient-to-r from-card-bg via-card-bg to-[#ece4f7] p-5 min-h-[190px]" style={{ animationDelay: "0.05s" }}>
        {/* 水彩イラスト（コンパス・羽・月） */}
        <img
          src="/home/msg.png"
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute top-0 right-0 h-full w-[44%] object-cover object-center"
          style={LEFT_FADE}
        />
        <div className="relative z-10 space-y-3 pr-[40%]">
          <div className="flex items-center gap-2 text-accent-gold text-sm">
            <span className="sparkle">✦</span>
            <span>{t("home.todayMessage")}</span>
          </div>
          <p className="font-mincho text-xl font-medium text-foreground leading-relaxed">
            {daily?.message ?? t("common.calculating")}
          </p>
          {daily && <p className="text-xs text-muted mt-1">{daily.source}</p>}
        </div>
      </section>

      {/* 今日の注意点 */}
      <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-card-border shadow-sm bg-gradient-to-r from-card-bg via-card-bg to-[#ece4f7] p-5 min-h-[112px]" style={{ animationDelay: "0.12s" }}>
        {/* 水彩イラスト（キャンドル・花） */}
        <img
          src="/home/candle.png"
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute top-0 right-0 h-full w-[34%] object-cover object-center"
          style={LEFT_FADE}
        />
        <div className="relative z-10 space-y-3 pr-[32%]">
          <div className="flex items-center gap-2 text-accent-orange text-sm">
            <span className="float-slow">☾</span>
            <span>{t("home.todayCaution")}</span>
          </div>
          <p className="font-mincho text-foreground/80 leading-relaxed">
            {daily?.caution ?? t("common.calculating")}
          </p>
        </div>
      </section>

      {/* ラッキー情報 */}
      {lucky && (
        <section className="animate-fade-up bg-card-bg border border-card-border rounded-3xl p-5 shadow-sm" style={{ animationDelay: "0.19s" }}>
          <div className="grid grid-cols-2 text-sm">
            {/* ラッキーカラー */}
            <div className="space-y-1.5 pb-3.5 pr-3.5">
              <span className="flex items-center gap-1 text-xs text-muted">
                <span className="text-accent-gold">✦</span> {t("home.lucky.color")}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-5 h-5 rounded-full border border-card-border shadow-inner"
                  style={{ backgroundColor: lucky.color.hex }}
                />
                <span className="text-foreground font-bold text-lg">{lucky.color.name}</span>
              </div>
            </div>
            {/* ラッキーナンバー */}
            <div className="space-y-1.5 pb-3.5 pl-3.5 border-l border-card-border">
              <span className="flex items-center gap-1 text-xs text-muted">
                <span className="text-accent-gold">✦</span> {t("home.lucky.number")}
              </span>
              <p className="text-foreground font-bold text-xl">{lucky.number}</p>
            </div>
            {/* 吉方位 */}
            <div className="space-y-1.5 pt-3.5 pr-3.5 border-t border-card-border">
              <span className="flex items-center gap-1 text-xs text-muted">
                <span className="text-accent-gold">✦</span> {t("home.lucky.direction")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-accent-gold text-lg leading-none">✸</span>
                <span className="text-foreground font-bold text-lg">{lucky.direction}</span>
              </div>
            </div>
            {/* 月齢 */}
            <div className="space-y-1.5 pt-3.5 pl-3.5 border-t border-l border-card-border">
              <span className="flex items-center gap-1 text-xs text-muted">
                <span className="text-accent-gold">✦</span> {t("home.lucky.moon")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{lucky.moonEmoji}</span>
                <span className="text-foreground font-bold text-lg">{lucky.moonPhase}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 今年のテーマ（数秘術） */}
      {numerology && (
        <section className="animate-fade-up bg-card-bg border border-card-border rounded-3xl p-5 shadow-sm space-y-2" style={{ animationDelay: "0.26s" }}>
          <div className="flex items-center gap-2 text-accent-gold text-sm">
            <span className="sparkle">✦</span>
            <span>{t("home.year.title")}</span>
          </div>
          <p className="font-mincho text-accent-orange font-bold text-lg">
            {t("home.year.personalYear")} {numerology.personalYear}：{numerology.personalYearMeaning.theme}
          </p>
          <p className="text-foreground/80 text-sm">
            {numerology.personalYearMeaning.advice}
          </p>
        </section>
      )}

      {/* 詳細へのリンク（ゴールド枠のピル） */}
      <Link
        href="/detail"
        className="block text-center font-mincho text-base font-bold tracking-wide text-accent-gold py-3.5 rounded-full border border-accent-gold/40 bg-gradient-to-r from-accent-gold/5 via-card-bg to-accent-gold/5 shadow-sm hover:from-accent-gold/10 hover:to-accent-gold/10 transition-colors"
      >
        {t("home.seeDetails")}
      </Link>

      {/* アストロカートグラフィー（注目の新機能） */}
      <Link
        href="/astro"
        className="animate-fade-up group relative overflow-hidden flex items-center gap-3.5 rounded-2xl border border-accent-gold/30 p-3.5 shadow-sm transition-transform active:scale-[0.99]"
        style={{
          background:
            "linear-gradient(135deg, rgba(91,143,214,0.14), rgba(232,130,12,0.10), rgba(255,255,255,0.6))",
          animationDelay: "0.28s",
        }}
      >
        <span className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center text-3xl shadow-inner">
          🌍
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-mincho text-base font-bold text-foreground">{t("astro.brand")}</p>
            <span className="text-[9px] bg-accent-orange text-white px-1.5 py-0.5 rounded-full">{t("common.new")}</span>
          </div>
          <p className="text-[11px] text-muted mt-0.5">{t("home.astro.subtitle")}</p>
        </div>
        <span className="text-accent-gold/60 text-2xl mr-1 transition-transform group-hover:translate-x-0.5">
          ›
        </span>
      </Link>

      {/* 人生の棚卸し（注目の新機能） */}
      <Link
        href="/life"
        className="animate-fade-up group relative overflow-hidden flex items-center gap-3.5 rounded-2xl border border-accent-gold/30 p-3.5 shadow-sm transition-transform active:scale-[0.99]"
        style={{
          background:
            "linear-gradient(135deg, rgba(196,148,42,0.14), rgba(232,130,12,0.10), rgba(255,255,255,0.6))",
          animationDelay: "0.29s",
        }}
      >
        <span className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center text-3xl shadow-inner">
          📜
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-mincho text-base font-bold text-foreground">{t("home.life.title")}</p>
            <span className="text-[9px] bg-accent-orange text-white px-1.5 py-0.5 rounded-full">{t("common.new")}</span>
          </div>
          <p className="text-[11px] text-muted mt-0.5">{t("home.life.subtitle")}</p>
        </div>
        <span className="text-accent-gold/60 text-2xl mr-1 transition-transform group-hover:translate-x-0.5">
          ›
        </span>
      </Link>

      {/* わたしの取扱説明書（注目の新機能） */}
      <Link
        href="/manual"
        className="animate-fade-up group relative overflow-hidden flex items-center gap-3.5 rounded-2xl border border-accent-gold/30 p-3.5 shadow-sm transition-transform active:scale-[0.99]"
        style={{
          background:
            "linear-gradient(135deg, rgba(232,130,12,0.12), rgba(196,148,42,0.12), rgba(255,255,255,0.6))",
          animationDelay: "0.3s",
        }}
      >
        <span className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center text-3xl shadow-inner">
          📖
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-mincho text-base font-bold text-foreground">{t("home.manual.title")}</p>
            <span className="text-[9px] bg-accent-orange text-white px-1.5 py-0.5 rounded-full">{t("common.new")}</span>
          </div>
          <p className="text-[11px] text-muted mt-0.5">{t("home.manual.subtitle")}</p>
        </div>
        <span className="text-accent-gold/60 text-2xl mr-1 transition-transform group-hover:translate-x-0.5">
          ›
        </span>
      </Link>

      {/* 機能メニュー（水彩アイコン） */}
      <div className="space-y-2.5">
        {MENU_ITEMS.map((m, i) => (
          <Link
            key={m.href}
            href={m.href}
            className="animate-fade-up group flex items-center gap-3.5 rounded-2xl border border-card-border p-2.5 shadow-sm transition-transform active:scale-[0.99]"
            style={{ background: m.bg, animationDelay: `${0.3 + i * 0.05}s` }}
          >
            <img
              src={m.icon}
              alt=""
              width={64}
              height={64}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="font-mincho text-base font-bold text-foreground">{t(m.titleKey)}</p>
              <p className="text-[11px] text-muted mt-0.5">{t(m.subtitleKey)}</p>
            </div>
            <span className="text-accent-gold/60 text-2xl mr-1 transition-transform group-hover:translate-x-0.5">
              ›
            </span>
          </Link>
        ))}
      </div>

      {/* 免責事項 */}
      <div className="text-center text-xs text-muted/60 px-4 space-y-1">
        <p>{t("common.disclaimer")}</p>
        <p>
          <Link href="/guide" className="underline hover:text-accent-orange">
            {t("home.footer.guide")}
          </Link>
          <span className="mx-2">/</span>
          <Link href="/terms" className="underline hover:text-accent-orange">
            {t("home.footer.terms")}
          </Link>
          <span className="mx-2">/</span>
          <Link href="/privacy" className="underline hover:text-accent-orange">
            {t("home.footer.privacy")}
          </Link>
        </p>
      </div>
    </div>
  );
}
