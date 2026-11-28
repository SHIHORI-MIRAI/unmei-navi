"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadProfile, loadHouseSystem } from "@/lib/storage";
import { calcTransitReading, type TransitReading } from "@/lib/divination";

/** トランジット天体ごとの帯色 */
const PLANET_COLORS: Record<string, string> = {
  jupiter: "#f59e0b",
  saturn: "#6b7280",
  uranus: "#06b6d4",
  neptune: "#6366f1",
  pluto: "#9333ea",
};

export default function NowPage() {
  const router = useRouter();
  const [reading, setReading] = useState<TransitReading | null>(null);
  const [profileName, setProfileName] = useState<string>("");

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) {
      router.push("/profile");
      return;
    }
    setProfileName(profile.name);
    setReading(
      calcTransitReading(
        profile.birthDate,
        profile.birthTime || undefined,
        profile.birthPlace || undefined,
        new Date(),
        { houseSystem: loadHouseSystem(), lat: profile.birthLat, lng: profile.birthLng }
      )
    );
  }, [router]);

  if (!reading) {
    return <p className="text-muted text-center py-10">星を読み込み中...</p>;
  }

  const today = new Date();
  const dateLabel = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
          <span className="text-accent-gold">✦</span>
          星よみ・今のあなた
        </h2>
        <p className="text-xs text-muted mt-1">
          {dateLabel}の星模様から{profileName && `、${profileName}さんの`}今を読み解きます
        </p>
      </div>

      {/* イントロ（今の空模様） */}
      <section className="bg-gradient-to-br from-accent-orange/10 to-accent-gold/10 border border-accent-orange/30 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-accent-gold text-sm">
            <span>☽</span>
            <span>今の空模様</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>{reading.seasonSign.name}の季節</span>
            <span>
              {reading.moonPhase.emoji} {reading.moonPhase.name}
            </span>
          </div>
        </div>
        <p className="text-sm text-foreground/85 leading-relaxed">{reading.intro}</p>
      </section>

      {/* いま活性化している人生領域（トランジットのハウス集中） */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-accent-gold text-sm">
          <span>◈</span>
          <span>いま活性化している人生の領域</span>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{reading.houseFocus.summary}</p>
        <div className="space-y-1 pt-1">
          {reading.houseFocus.byHouse.map((h) => {
            const isTop = reading.houseFocus.topHouses.includes(h.house);
            return (
              <div
                key={h.house}
                className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
                  isTop ? "bg-accent-orange/10 border border-accent-orange/30" : ""
                }`}
              >
                <span
                  className={`text-xs font-bold w-7 text-center ${
                    isTop ? "text-accent-orange" : "text-muted"
                  }`}
                >
                  {h.house}H
                </span>
                <span className="text-[11px] text-muted w-28 shrink-0">{h.label}</span>
                <span className="text-xs text-foreground/80 flex-1">{h.planets.join("・")}</span>
                {isTop && reading.houseFocus.topCount >= 2 && (
                  <span className="text-[9px] bg-accent-orange text-white px-1.5 py-0.5 rounded-full shrink-0">
                    集中
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 逆行・留サマリー */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-accent-orange text-sm">
          <span>℞</span>
          <span>いま振り返りをうながす星</span>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{reading.retrogradeSummary}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {reading.transits
            .filter((t) => t.retrograde || t.stationary)
            .map((t) => (
              <span
                key={t.key}
                className="text-[11px] px-2 py-0.5 rounded-full border"
                style={{
                  color: PLANET_COLORS[t.key],
                  borderColor: `${PLANET_COLORS[t.key]}55`,
                  backgroundColor: `${PLANET_COLORS[t.key]}10`,
                }}
              >
                {t.symbol} {t.name}
                {t.stationary ? "（留）" : "（逆行）"}
              </span>
            ))}
        </div>
      </section>

      {/* 各トランジット天体の解説 */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> 運行中の星が照らす、人生の領域
        </h3>
        {reading.transits.map((t) => {
          const color = PLANET_COLORS[t.key] ?? "#f59e0b";
          return (
            <article
              key={t.key}
              className="bg-card-bg border border-card-border rounded-2xl shadow-sm overflow-hidden"
            >
              <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{ backgroundColor: `${color}12`, borderBottom: `1px solid ${color}30` }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg" style={{ color }}>
                    {t.symbol}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">
                      {t.name}
                      <span className="text-muted font-normal text-xs ml-1">
                        in {t.sign.name} {t.degree.toFixed(0)}°
                      </span>
                    </p>
                    <p className="text-[11px] text-muted leading-tight">
                      第{t.house}ハウス｜{t.houseLabel}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  {t.stationary ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-orange/15 text-accent-orange">
                      留
                    </span>
                  ) : t.retrograde ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-orange/15 text-accent-orange">
                      ℞ 逆行
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background text-muted">
                      順行
                    </span>
                  )}
                  {t.natalAspect && (
                    <span className="text-[10px] text-accent-gold">
                      出生の{t.natalAspect.point}に接触
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-foreground/85 leading-relaxed">{t.body}</p>
              </div>
            </article>
          );
        })}
      </section>

      {/* 結び */}
      <section className="bg-card-bg border border-accent-gold/30 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-accent-gold text-sm">
          <span>✦</span>
          <span>この季節のあなたへ</span>
        </div>
        <p className="text-sm text-foreground/85 leading-relaxed">{reading.closing}</p>
      </section>

      {/* ハウス基準の注記 */}
      <p className="text-[11px] text-muted/70 leading-relaxed px-1">※ {reading.referenceNote}</p>

      {/* 導線 */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/detail"
          className="block text-center py-3 bg-card-bg border border-card-border rounded-2xl shadow-sm text-accent-orange text-sm font-medium hover:bg-accent-orange/5 transition-colors"
        >
          出生図の詳細を見る →
        </Link>
        <Link
          href="/graph"
          className="block text-center py-3 bg-card-bg border border-card-border rounded-2xl shadow-sm text-accent-orange text-sm font-medium hover:bg-accent-orange/5 transition-colors"
        >
          運勢の流れを見る →
        </Link>
      </div>

      <p className="text-center text-xs text-muted/60 px-4">
        ※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。
      </p>
    </div>
  );
}
