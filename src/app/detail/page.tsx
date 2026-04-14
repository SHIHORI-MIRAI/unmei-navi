"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProfile } from "@/lib/storage";
import {
  calcNumerology,
  calcMayan,
  calcTodayMayan,
  calcZerology,
  type NumerologyResult,
  type MayanResult,
  type ZerologyResult,
} from "@/lib/divination";

export default function DetailPage() {
  const router = useRouter();
  const [numerology, setNumerology] = useState<NumerologyResult | null>(null);
  const [mayan, setMayan] = useState<MayanResult | null>(null);
  const [todayMayan, setTodayMayan] = useState<MayanResult | null>(null);
  const [zerology, setZerology] = useState<ZerologyResult | null>(null);

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) {
      router.push("/profile");
      return;
    }
    const today = new Date();
    setNumerology(calcNumerology(profile.birthDate, today));
    setMayan(calcMayan(profile.birthDate));
    setTodayMayan(calcTodayMayan(today));
    setZerology(calcZerology(profile.birthDate, today.getFullYear()));
  }, [router]);

  if (!numerology || !mayan || !todayMayan || !zerology) {
    return <p className="text-muted text-center py-10">読み込み中...</p>;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">☽</span>
        今日の詳細
      </h2>

      {/* 魂・本質の層 */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> 魂・本質の層
        </h3>

        {/* 数秘術 */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">数秘術</span>
            <span className="text-xs text-muted">自動計算 ★★</span>
          </div>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted">ライフパスナンバー：</span>
              <span className="text-accent-orange font-bold text-lg">{numerology.lifePathNumber}</span>
              <span className="text-muted ml-1">（{numerology.lifePathMeaning.title}）</span>
            </p>
            <p className="text-foreground/80">{numerology.lifePathMeaning.strength}</p>
            <p className="text-xs text-muted mt-1">テーマ：{numerology.lifePathMeaning.theme}</p>
            <div className="border-t border-card-border mt-2 pt-2">
              <p>
                <span className="text-muted">パーソナルイヤー：</span>
                <span className="font-medium">{numerology.personalYear}</span>
                <span className="text-muted ml-1">（{numerology.personalYearMeaning.theme}）</span>
              </p>
              <p>
                <span className="text-muted">パーソナルマンス：</span>
                <span className="font-medium">{numerology.personalMonth}</span>
              </p>
              <p>
                <span className="text-muted">パーソナルデイ：</span>
                <span className="font-medium">{numerology.personalDay}</span>
              </p>
            </div>
          </div>
        </div>

        {/* マヤ暦（自分） */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">マヤ暦（あなたの本質）</span>
            <span className="text-xs text-muted">自動計算 ★★</span>
          </div>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted">KIN：</span>
              <span className="text-accent-orange font-bold text-lg">{mayan.kinNumber}</span>
            </p>
            <p>
              <span className="text-muted">太陽の紋章：</span>
              <span className="font-medium">{mayan.solarSeal.name}</span>
              <span className="text-muted ml-1">（{mayan.solarSeal.keyword}）</span>
            </p>
            <p>
              <span className="text-muted">ウェイブスペル：</span>
              <span className="font-medium">{mayan.waveSpell.name}</span>
              <span className="text-muted ml-1">（{mayan.waveSpell.keyword}）</span>
            </p>
            <p>
              <span className="text-muted">銀河の音：</span>
              <span className="font-medium">{mayan.galacticTone.tone}（{mayan.galacticTone.name}）</span>
              <span className="text-muted ml-1">- {mayan.galacticTone.keyword}</span>
            </p>
          </div>
        </div>

        {/* マヤ暦（今日のエネルギー） */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">マヤ暦（今日のエネルギー）</span>
            <span className="text-xs text-muted">自動計算 ★★</span>
          </div>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted">今日のKIN：</span>
              <span className="font-bold">{todayMayan.kinNumber}</span>
            </p>
            <p>
              <span className="text-muted">今日の紋章：</span>
              <span className="font-medium">{todayMayan.solarSeal.name}</span>
              <span className="text-muted ml-1">（{todayMayan.solarSeal.keyword}）</span>
            </p>
            <p>
              <span className="text-muted">今日の音：</span>
              <span className="font-medium">{todayMayan.galacticTone.tone}（{todayMayan.galacticTone.name}）</span>
            </p>
          </div>
        </div>
      </section>

      {/* 運気・時期の層 */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> 運気・時期の層
        </h3>

        {/* 0学 */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">0学</span>
            <span className="text-xs text-muted">自動計算 ★★</span>
          </div>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted">支配星：</span>
              <span className="text-accent-orange font-bold">{zerology.rulingStar.name}</span>
              <span className="text-muted ml-1">（{zerology.rulingStar.type}）</span>
            </p>
            <p className="text-foreground/80">{zerology.rulingStar.personality}</p>
            <div className="border-t border-card-border mt-2 pt-2">
              <p>
                <span className="text-muted">今年の運命期：</span>
                <span className="font-medium">{zerology.currentPhase.name}</span>
              </p>
              <p className="text-foreground/80">{zerology.currentPhase.theme}</p>
              <p className="text-xs text-accent-gold mt-1">
                ▸ {zerology.currentPhase.advice}
              </p>
              <p className="text-xs text-muted mt-0.5">
                ▸ {zerology.currentPhase.caution}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 今後追加予定 */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted flex items-center gap-1.5">
          <span>◇</span> 今後追加予定
        </h3>
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
          <div className="text-sm text-muted space-y-1">
            <p>・九星気学（Step 4で追加）</p>
            <p>・四柱推命（Step 10で追加）</p>
            <p>・算命学（Step 10で追加）</p>
            <p>・西洋占星術（手動登録）</p>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-muted/60 px-4">
        ※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。
      </p>
    </div>
  );
}
