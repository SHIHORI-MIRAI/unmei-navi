"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProfile } from "@/lib/storage";
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
const MENU_ITEMS = [
  {
    href: "/yearly",
    title: "年運詳細",
    subtitle: "今年・来年の流れ",
    icon: "/menu/year.png",
    bg: "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(255,255,255,0.55))",
  },
  {
    href: "/monthly",
    title: "月の運勢",
    subtitle: "毎月のテーマ",
    icon: "/menu/month.png",
    bg: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(255,255,255,0.55))",
  },
  {
    href: "/compatibility",
    title: "相性診断",
    subtitle: "2人を選んで詳しく",
    icon: "/menu/compat.png",
    bg: "linear-gradient(135deg, rgba(244,114,182,0.12), rgba(255,255,255,0.55))",
  },
  {
    href: "/matrix",
    title: "相性マトリックス",
    subtitle: "全員クロス・ランキング",
    icon: "/menu/matrix.png",
    bg: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(255,255,255,0.55))",
  },
  {
    href: "/oracle",
    title: "オラクルカード",
    subtitle: "今日のメッセージを1枚",
    icon: "/menu/oracle.png",
    bg: "linear-gradient(135deg, rgba(217,180,74,0.12), rgba(255,255,255,0.55))",
  },
] as const;

export default function Home() {
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
    const num = calcNumerology(profile.birthDate, today);
    setNumerology(num);
    setDaily(generateDailyMessage(profile.birthDate, today));
    setLucky(calcLuckyInfo(today, num.lifePathNumber));

    // ガイドバナーは閉じたフラグがなければ表示
    if (typeof window !== "undefined") {
      setShowGuideBanner(localStorage.getItem(GUIDE_BANNER_KEY) !== "1");
    }
  }, []);

  function dismissGuideBanner() {
    setShowGuideBanner(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(GUIDE_BANNER_KEY, "1");
    }
  }

  if (!hasProfile) {
    return (
      <div className="space-y-6">
        <section className="bg-card-bg border border-card-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-accent-gold text-sm">
            <span>✦</span>
            <span>ようこそ、運命ナビへ</span>
          </div>
          <p className="text-lg font-medium text-foreground leading-relaxed">
            まずはプロフィールを設定して、あなただけの占い結果を受け取りましょう
          </p>
          <Link
            href="/profile"
            className="inline-block mt-2 px-5 py-2.5 bg-accent-orange text-white rounded-full text-sm font-medium hover:bg-accent-light transition-colors"
          >
            プロフィールを設定する
          </Link>
        </section>
        <p className="text-center text-xs text-muted/60 px-4">
          ※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。
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
                はじめての方へ
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed max-w-[15rem]">
                個人で楽しむ使い方と、結婚相談所などの業務で使う方法を、ガイドにまとめました。
              </p>
              <div className="flex items-center gap-3 pt-1.5">
                <Link
                  href="/guide"
                  className="text-xs bg-accent-orange text-white px-4 py-2 rounded-full shadow-sm hover:bg-accent-light transition-colors"
                >
                  使い方ガイドを見る →
                </Link>
                <button
                  onClick={dismissGuideBanner}
                  className="text-[11px] text-muted hover:text-foreground"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 今日のメッセージ */}
      <section className="animate-fade-up relative overflow-hidden bg-card-bg border border-card-border rounded-3xl p-5 shadow-sm space-y-3" style={{ animationDelay: "0.05s" }}>
        {/* 水彩の月（/decorations/moon.png を置くと表示） */}
        <div
          className="deco float-slow -top-2 -right-2 w-28 h-28 opacity-90"
          style={{ backgroundImage: "url('/decorations/moon.png')" }}
        />
        {/* 水彩の植物（/decorations/leaf.png を置くと表示） */}
        <div
          className="deco drift-slow bottom-0 right-2 w-24 h-24 opacity-80"
          style={{ backgroundImage: "url('/decorations/leaf.png')" }}
        />
        <div className="relative z-10 flex items-center gap-2 text-accent-gold text-sm">
          <span className="sparkle">✦</span>
          <span>今日のメッセージ</span>
        </div>
        <p className="relative z-10 font-mincho text-xl font-medium text-foreground leading-relaxed pr-8">
          {daily?.message ?? "計算中..."}
        </p>
        {daily && (
          <p className="relative z-10 text-xs text-muted mt-1">
            {daily.source}
          </p>
        )}
      </section>

      {/* 今日の注意点 */}
      <section className="animate-fade-up relative overflow-hidden bg-card-bg border border-card-border rounded-3xl p-5 shadow-sm space-y-3" style={{ animationDelay: "0.12s" }}>
        {/* 水彩の植物（/decorations/leaf2.png を置くと表示） */}
        <div
          className="deco drift-slow -bottom-2 right-0 w-28 h-28 opacity-70"
          style={{ backgroundImage: "url('/decorations/leaf2.png')" }}
        />
        <div className="relative z-10 flex items-center gap-2 text-accent-orange text-sm">
          <span className="float-slow">☾</span>
          <span>今日の注意点</span>
        </div>
        <p className="relative z-10 font-mincho text-foreground/80 leading-relaxed pr-8">
          {daily?.caution ?? "計算中..."}
        </p>
      </section>

      {/* ラッキー情報 */}
      {lucky && (
        <section className="animate-fade-up relative overflow-hidden bg-card-bg border border-card-border rounded-3xl p-5 shadow-sm" style={{ animationDelay: "0.19s" }}>
          <div
            className="deco sparkle top-3 right-4 w-6 h-6"
            style={{ backgroundImage: "url('/decorations/sparkle.png')" }}
          />
          <div className="relative z-10 grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted">ラッキーカラー</span>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-4 h-4 rounded-full border border-card-border"
                  style={{ backgroundColor: lucky.color.hex }}
                />
                <span className="text-foreground font-medium">{lucky.color.name}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted">ラッキーナンバー</span>
              <p className="text-foreground font-medium text-lg">{lucky.number}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted">吉方位</span>
              <p className="text-foreground font-medium">{lucky.direction}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted">月齢</span>
              <p className="text-foreground font-medium">
                {lucky.moonEmoji} {lucky.moonPhase}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 今年のテーマ（数秘術） */}
      {numerology && (
        <section className="animate-fade-up bg-card-bg border border-card-border rounded-3xl p-5 shadow-sm space-y-2" style={{ animationDelay: "0.26s" }}>
          <div className="flex items-center gap-2 text-accent-gold text-sm">
            <span className="sparkle">✦</span>
            <span>今年のテーマ（数秘術）</span>
          </div>
          <p className="font-mincho text-accent-orange font-bold text-lg">
            パーソナルイヤー {numerology.personalYear}：{numerology.personalYearMeaning.theme}
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
        各占術の詳細を見る →
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
              <p className="font-mincho text-base font-bold text-foreground">{m.title}</p>
              <p className="text-[11px] text-muted mt-0.5">{m.subtitle}</p>
            </div>
            <span className="text-accent-gold/60 text-2xl mr-1 transition-transform group-hover:translate-x-0.5">
              ›
            </span>
          </Link>
        ))}
      </div>

      {/* 免責事項 */}
      <div className="text-center text-xs text-muted/60 px-4 space-y-1">
        <p>※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。</p>
        <p>
          <Link href="/guide" className="underline hover:text-accent-orange">
            使い方ガイド
          </Link>
          <span className="mx-2">/</span>
          <Link href="/terms" className="underline hover:text-accent-orange">
            利用規約
          </Link>
          <span className="mx-2">/</span>
          <Link href="/privacy" className="underline hover:text-accent-orange">
            プライバシーポリシー
          </Link>
        </p>
      </div>
    </div>
  );
}
