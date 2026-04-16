"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadProfile } from "@/lib/storage";
import {
  calcNumerology,
  calcMayan,
  calcTodayMayan,
  calcNineStar,
  calcFourPillars,
  calcSanmeigaku,
  type NumerologyResult,
  type MayanResult,
  type NineStarResult,
  type FourPillarsResult,
  type SanmeigakuResult,
} from "@/lib/divination";

export default function DetailPage() {
  const router = useRouter();
  const [numerology, setNumerology] = useState<NumerologyResult | null>(null);
  const [mayan, setMayan] = useState<MayanResult | null>(null);
  const [todayMayan, setTodayMayan] = useState<MayanResult | null>(null);
  const [nineStar, setNineStar] = useState<NineStarResult | null>(null);
  const [fourPillars, setFourPillars] = useState<FourPillarsResult | null>(null);
  const [sanmeigaku, setSanmeigaku] = useState<SanmeigakuResult | null>(null);

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
    setNineStar(calcNineStar(profile.birthDate, today.getFullYear()));
    setFourPillars(calcFourPillars(profile.birthDate, profile.birthTime || undefined));
    setSanmeigaku(calcSanmeigaku(profile.birthDate));
  }, [router]);

  if (!numerology || !mayan || !todayMayan || !nineStar || !fourPillars || !sanmeigaku) {
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

        {/* 四柱推命 */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">四柱推命</span>
            <span className="text-xs text-muted">自動計算 ★★</span>
          </div>
          <div className="text-sm space-y-1">
            {/* 命式表 */}
            <div className="grid grid-cols-4 gap-1 text-center text-xs mb-2">
              <div className="text-muted">時柱</div>
              <div className="text-muted">日柱</div>
              <div className="text-muted">月柱</div>
              <div className="text-muted">年柱</div>
              <div className="bg-accent-orange/10 rounded py-1 font-medium">
                {fourPillars.hourPillar?.stem.name || "—"}
              </div>
              <div className="bg-accent-orange/10 rounded py-1 font-bold text-accent-orange">
                {fourPillars.dayPillar.stem.name}
              </div>
              <div className="bg-accent-orange/10 rounded py-1 font-medium">
                {fourPillars.monthPillar.stem.name}
              </div>
              <div className="bg-accent-orange/10 rounded py-1 font-medium">
                {fourPillars.yearPillar.stem.name}
              </div>
              <div className="bg-card-border/30 rounded py-1">
                {fourPillars.hourPillar?.branch.name || "—"}
              </div>
              <div className="bg-card-border/30 rounded py-1 font-medium">
                {fourPillars.dayPillar.branch.name}
              </div>
              <div className="bg-card-border/30 rounded py-1">
                {fourPillars.monthPillar.branch.name}
              </div>
              <div className="bg-card-border/30 rounded py-1">
                {fourPillars.yearPillar.branch.name}
              </div>
            </div>

            {/* 日主 */}
            <p>
              <span className="text-muted">日主（あなたの本質）：</span>
              <span className="text-accent-orange font-bold">{fourPillars.dayMaster.stem}</span>
              <span className="text-muted ml-1">（{fourPillars.dayMaster.title}・{fourPillars.dayMaster.element}）</span>
            </p>
            <p className="text-foreground/80">{fourPillars.dayMaster.personality}</p>

            {/* 通変星 */}
            <div className="border-t border-card-border mt-2 pt-2">
              <p>
                <span className="text-muted">月柱の通変星：</span>
                <span className="font-medium">{fourPillars.tsuuhenStars.monthStar}</span>
                <span className="text-muted ml-1">（{fourPillars.tsuuhenMeaning.keyword}）</span>
              </p>
              <p className="text-foreground/80 text-xs">{fourPillars.tsuuhenMeaning.personality}</p>
            </div>

            {/* 五行バランス */}
            <div className="border-t border-card-border mt-2 pt-2">
              <p className="text-muted text-xs mb-1">五行バランス</p>
              <div className="flex gap-1">
                {(["木", "火", "土", "金", "水"] as const).map((el) => {
                  const count = fourPillars.fiveElements[el];
                  const colors: Record<string, string> = {
                    木: "#22c55e", 火: "#ef4444", 土: "#eab308", 金: "#a3a3a3", 水: "#3b82f6",
                  };
                  return (
                    <div key={el} className="flex-1 text-center">
                      <div
                        className="rounded-full h-6 flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: colors[el], opacity: count > 0 ? 1 : 0.3 }}
                      >
                        {el}{count}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-accent-gold mt-1">
                ▸ {fourPillars.favorableElement.reason}
              </p>
            </div>
          </div>
        </div>

        {/* 九星気学 */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">九星気学</span>
            <span className="text-xs text-muted">自動計算 ★★</span>
          </div>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted">本命星：</span>
              <span className="text-accent-orange font-bold">{nineStar.honmeisei.name}</span>
            </p>
            <p className="text-foreground/80">{nineStar.honmeisei.personality}</p>
            <p>
              <span className="text-muted">月命星：</span>
              <span className="font-medium">{nineStar.getsumeisei.name}</span>
            </p>
            <p className="text-foreground/80 text-xs">{nineStar.getsumeisei.personality}</p>
            <div className="border-t border-card-border mt-2 pt-2">
              <p>
                <span className="text-muted">今年の位置：</span>
                <span className="font-medium">{nineStar.yearPosition.direction}</span>
              </p>
              <p className="text-foreground/80">{nineStar.yearPosition.theme}</p>
              <p className="text-xs text-accent-gold mt-1">
                ▸ {nineStar.yearPosition.advice}
              </p>
              <p className="text-xs text-muted mt-0.5">
                ▸ {nineStar.yearPosition.caution}
              </p>
            </div>
            {nineStar.luckyDirections.length > 0 && (
              <div className="border-t border-card-border mt-2 pt-2">
                <p>
                  <span className="text-muted">吉方位：</span>
                  <span className="text-accent-gold font-medium">{nineStar.luckyDirections.join("・")}</span>
                </p>
                {nineStar.unluckyDirections.length > 0 && (
                  <p>
                    <span className="text-muted">凶方位：</span>
                    <span className="text-foreground/60">{nineStar.unluckyDirections.join("・")}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 性格・才能の層 */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> 性格・才能の層
        </h3>

        {/* 算命学 */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">算命学</span>
            <span className="text-xs text-muted">自動計算 ★★</span>
          </div>
          <div className="text-sm space-y-1">
            {/* 主星 */}
            <p>
              <span className="text-muted">主星：</span>
              <span className="text-accent-orange font-bold">{sanmeigaku.mainStar.name}</span>
              <span className="text-muted ml-1">（{sanmeigaku.mainStar.keyword}）</span>
            </p>
            <p className="text-foreground/80">{sanmeigaku.mainStar.personality}</p>

            {/* 人体星図（簡易版） */}
            <div className="border-t border-card-border mt-2 pt-2">
              <p className="text-muted text-xs mb-1">人体星図（主星）</p>
              <div className="grid grid-cols-3 gap-1 text-center text-xs max-w-[200px] mx-auto">
                <div />
                <div className="bg-accent-gold/10 border border-accent-gold/30 rounded py-1.5">
                  <p className="text-[10px] text-muted">北</p>
                  <p className="font-medium text-foreground">{sanmeigaku.bodyChart.north.name}</p>
                </div>
                <div />
                <div />
                <div className="bg-accent-orange/10 border border-accent-orange/30 rounded py-1.5">
                  <p className="text-[10px] text-muted">中央</p>
                  <p className="font-bold text-accent-orange">{sanmeigaku.bodyChart.center.name}</p>
                </div>
                <div />
                <div />
                <div className="bg-accent-gold/10 border border-accent-gold/30 rounded py-1.5">
                  <p className="text-[10px] text-muted">南</p>
                  <p className="font-medium text-foreground">{sanmeigaku.bodyChart.south.name}</p>
                </div>
                <div />
              </div>
            </div>

            {/* 従星 */}
            <div className="border-t border-card-border mt-2 pt-2">
              <p className="text-muted text-xs mb-1">十二大従星（エネルギー）</p>
              <div className="space-y-1">
                {[
                  { label: "頭", star: sanmeigaku.subStars.head },
                  { label: "胸", star: sanmeigaku.subStars.chest },
                  { label: "腹", star: sanmeigaku.subStars.belly },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-xs text-muted w-6">{s.label}</span>
                    <span className="text-xs font-medium w-16">{s.star.name}</span>
                    <div className="flex-1 bg-background rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-accent-orange/70"
                        style={{ width: `${(s.star.energy / 12) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted w-4">{s.star.energy}</span>
                  </div>
                ))}
                <p className="text-xs text-accent-gold mt-1">
                  ▸ 総合エネルギー：{sanmeigaku.totalEnergy}/36（{sanmeigaku.totalEnergy >= 24 ? "高エネルギー型" : sanmeigaku.totalEnergy >= 15 ? "バランス型" : "省エネ型"}）
                </p>
              </div>
            </div>

            {/* 天中殺 */}
            <div className="border-t border-card-border mt-2 pt-2">
              <p>
                <span className="text-muted">天中殺：</span>
                <span className="font-medium">{sanmeigaku.tenchu.name}</span>
              </p>
              <p className="text-foreground/80 text-xs">{sanmeigaku.tenchu.meaning}</p>
              <p className="text-xs text-accent-gold mt-1">
                ▸ {sanmeigaku.tenchu.theme}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 鑑定結果登録へ */}
      <Link
        href="/readings"
        className="block text-center py-3 bg-card-bg border border-card-border rounded-2xl shadow-sm text-accent-orange text-sm font-medium hover:bg-accent-orange/5 transition-colors"
      >
        鑑定結果を登録・管理する →
      </Link>

      <p className="text-center text-xs text-muted/60 px-4">
        ※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。
      </p>
    </div>
  );
}
