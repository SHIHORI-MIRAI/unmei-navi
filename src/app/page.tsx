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

export default function Home() {
  const [hasProfile, setHasProfile] = useState(false);
  const [daily, setDaily] = useState<DailyMessage | null>(null);
  const [lucky, setLucky] = useState<LuckyInfo | null>(null);
  const [numerology, setNumerology] = useState<NumerologyResult | null>(null);

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) return;
    setHasProfile(true);

    const today = new Date();
    const num = calcNumerology(profile.birthDate, today);
    setNumerology(num);
    setDaily(generateDailyMessage(profile.birthDate, today));
    setLucky(calcLuckyInfo(today, num.lifePathNumber));
  }, []);

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
      {/* 今日のメッセージ */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-accent-gold text-sm">
          <span>✦</span>
          <span>今日のメッセージ</span>
        </div>
        <p className="text-lg font-medium text-foreground leading-relaxed">
          {daily?.message ?? "計算中..."}
        </p>
        {daily && (
          <p className="text-xs text-muted mt-1">
            {daily.source}
          </p>
        )}
      </section>

      {/* 今日の注意点 */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-accent-orange text-sm">
          <span>☾</span>
          <span>今日の注意点</span>
        </div>
        <p className="text-foreground/80">
          {daily?.caution ?? "計算中..."}
        </p>
      </section>

      {/* ラッキー情報 */}
      {lucky && (
        <section className="bg-card-bg border border-card-border rounded-2xl p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4 text-sm">
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
        <section className="bg-card-bg border border-card-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-accent-gold text-sm">
            <span>✦</span>
            <span>今年のテーマ（数秘術）</span>
          </div>
          <p className="text-accent-orange font-bold text-lg">
            パーソナルイヤー {numerology.personalYear}：{numerology.personalYearMeaning.theme}
          </p>
          <p className="text-foreground/80 text-sm">
            {numerology.personalYearMeaning.advice}
          </p>
        </section>
      )}

      {/* 詳細へのリンク */}
      <Link
        href="/detail"
        className="block text-center py-3 bg-card-bg border border-card-border rounded-2xl shadow-sm text-accent-orange text-sm font-medium hover:bg-accent-orange/5 transition-colors"
      >
        各占術の詳細を見る →
      </Link>

      {/* 機能ショートカット */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/yearly"
          className="block py-3 bg-card-bg border border-card-border rounded-2xl shadow-sm text-center hover:bg-accent-orange/5 transition-colors"
        >
          <div className="text-accent-gold text-lg">✦</div>
          <div className="text-xs text-foreground font-medium mt-0.5">年運詳細</div>
          <div className="text-[10px] text-muted">今年・来年の流れ</div>
        </Link>
        <Link
          href="/monthly"
          className="block py-3 bg-card-bg border border-card-border rounded-2xl shadow-sm text-center hover:bg-accent-orange/5 transition-colors"
        >
          <div className="text-accent-gold text-lg">☾</div>
          <div className="text-xs text-foreground font-medium mt-0.5">月の運勢</div>
          <div className="text-[10px] text-muted">毎月のテーマ</div>
        </Link>
        <Link
          href="/compatibility"
          className="block py-3 bg-card-bg border border-card-border rounded-2xl shadow-sm text-center hover:bg-accent-orange/5 transition-colors col-span-2"
        >
          <div className="text-accent-gold text-lg">♡</div>
          <div className="text-xs text-foreground font-medium mt-0.5">相性診断</div>
          <div className="text-[10px] text-muted">登録済みの人 / 手入力で誰とでも</div>
        </Link>
      </div>

      {/* 免責事項 */}
      <p className="text-center text-xs text-muted/60 px-4">
        ※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。
      </p>
    </div>
  );
}
