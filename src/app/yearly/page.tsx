"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadProfile } from "@/lib/storage";
import {
  calcPersonalYear,
  getYearWave,
  getPersonalYearMeaning,
  calcPersonalMonth,
  getPersonalMonthWave,
} from "@/lib/divination/numerology";
import {
  calcNineStar,
  getNineStarWave,
  getNineStarMonthlyWave,
} from "@/lib/divination/nine-star";
import {
  getFourPillarsWave,
  getFourPillarsMonthWave,
} from "@/lib/divination/four-pillars";
import {
  calcYearlyMayan,
  getMayanYearWave,
} from "@/lib/divination/mayan";
import { checkTenchusatsuYear } from "@/lib/divination/sanmeigaku";

interface QuarterData {
  label: string;
  months: number[];
  avg: number;
}

interface YearlyData {
  year: number;
  average: number;
  personalYear: number;
  personalYearTheme: string;
  personalYearAdvice: string;
  personalYearCaution: string;
  nineStarDirection: string;
  nineStarTheme: string;
  nineStarAdvice: string;
  luckyDirections: string[];
  unluckyDirections: string[];
  fourPillarsWave: number;
  mayanSealName: string;
  mayanSealKeyword: string;
  mayanToneName: string;
  mayanToneKeyword: string;
  tenchusatsu: { isTenchusatsu: boolean; group: string; yearBranch: string };
  quarters: QuarterData[];
  monthlyWaves: number[];
  peakMonth: number;
  bottomMonth: number;
}

function buildYearly(birthDate: string, year: number): YearlyData {
  const py = calcPersonalYear(birthDate, year);
  const pyMean = getPersonalYearMeaning(py);
  const nWave = getYearWave(py);

  const ns = calcNineStar(birthDate, year);
  const nsWave = getNineStarWave(birthDate, year);

  const fpWave = getFourPillarsWave(birthDate, year);
  const mWave = getMayanYearWave(birthDate, year);
  const mayan = calcYearlyMayan(birthDate, year);

  const average = Math.round((nWave + nsWave + fpWave + mWave) / 4);

  // 12ヶ月分のwaveを算出（3占術の平均）
  const monthlyWaves: number[] = [];
  for (let m = 1; m <= 12; m++) {
    const pm = calcPersonalMonth(birthDate, year, m);
    const w =
      (getPersonalMonthWave(pm) +
        getNineStarMonthlyWave(birthDate, year, m) +
        getFourPillarsMonthWave(birthDate, year, m)) /
      3;
    monthlyWaves.push(Math.round(w));
  }

  // 四半期平均
  const quarters: QuarterData[] = [
    { label: "Q1", months: [1, 2, 3], avg: 0 },
    { label: "Q2", months: [4, 5, 6], avg: 0 },
    { label: "Q3", months: [7, 8, 9], avg: 0 },
    { label: "Q4", months: [10, 11, 12], avg: 0 },
  ];
  quarters.forEach((q) => {
    q.avg = Math.round(
      q.months.reduce((s, m) => s + monthlyWaves[m - 1], 0) / q.months.length
    );
  });

  // ピーク・底の月
  let peakMonth = 1;
  let bottomMonth = 1;
  monthlyWaves.forEach((w, idx) => {
    if (w > monthlyWaves[peakMonth - 1]) peakMonth = idx + 1;
    if (w < monthlyWaves[bottomMonth - 1]) bottomMonth = idx + 1;
  });

  const tenchu = checkTenchusatsuYear(birthDate, year);

  return {
    year,
    average,
    personalYear: py,
    personalYearTheme: pyMean.theme,
    personalYearAdvice: pyMean.advice,
    personalYearCaution: pyMean.caution,
    nineStarDirection: ns.yearPosition.direction,
    nineStarTheme: ns.yearPosition.theme,
    nineStarAdvice: ns.yearPosition.advice,
    luckyDirections: ns.luckyDirections,
    unluckyDirections: ns.unluckyDirections,
    fourPillarsWave: fpWave,
    mayanSealName: mayan.solarSeal.name,
    mayanSealKeyword: mayan.solarSeal.keyword,
    mayanToneName: mayan.galacticTone.name,
    mayanToneKeyword: mayan.galacticTone.keyword,
    tenchusatsu: tenchu,
    quarters,
    monthlyWaves,
    peakMonth,
    bottomMonth,
  };
}

export default function YearlyPage() {
  const router = useRouter();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [birthDate, setBirthDate] = useState<string>("");
  const [targetYear, setTargetYear] = useState<number>(currentYear);

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) {
      router.push("/profile");
      return;
    }
    setBirthDate(profile.birthDate);
  }, [router]);

  const data = useMemo(
    () => (birthDate ? buildYearly(birthDate, targetYear) : null),
    [birthDate, targetYear]
  );

  if (!data) {
    return <p className="text-muted text-center py-10">読み込み中...</p>;
  }

  const isCurrent = targetYear === currentYear;
  const isNext = targetYear === currentYear + 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
          <span className="text-accent-gold">✦</span>
          年の運勢
        </h2>
        <div className="flex gap-2 text-xs">
          <Link href="/graph" className="text-accent-gold hover:text-accent-orange">年グラフ</Link>
          <span className="text-muted">/</span>
          <Link href="/monthly" className="text-accent-gold hover:text-accent-orange">月運勢</Link>
        </div>
      </div>

      {/* 今年・来年切替 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setTargetYear(currentYear)}
          className={`py-3 rounded-2xl border transition-all ${
            isCurrent
              ? "bg-accent-orange text-white border-accent-orange shadow-md"
              : "bg-card-bg border-card-border text-muted hover:text-accent-orange"
          }`}
        >
          <div className="text-xs opacity-80">今年</div>
          <div className="text-lg font-bold">{currentYear}年</div>
        </button>
        <button
          onClick={() => setTargetYear(currentYear + 1)}
          className={`py-3 rounded-2xl border transition-all ${
            isNext
              ? "bg-accent-orange text-white border-accent-orange shadow-md"
              : "bg-card-bg border-card-border text-muted hover:text-accent-orange"
          }`}
        >
          <div className="text-xs opacity-80">来年</div>
          <div className="text-lg font-bold">{currentYear + 1}年</div>
        </button>
      </div>

      {/* 総合エネルギー */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">{data.year}年の総合エネルギー</span>
          <span className="text-3xl font-bold text-accent-orange">
            {data.average}
            <span className="text-xs text-muted ml-0.5">/100</span>
          </span>
        </div>
        <div className="w-full bg-background rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{
              width: `${data.average}%`,
              backgroundColor:
                data.average >= 75 ? "#f97316" : data.average >= 50 ? "#eab308" : "#a0917b",
            }}
          />
        </div>
        <p className="text-xs text-muted mt-2">
          {data.average >= 80
            ? "勢いのある年。大きなチャレンジに向いています"
            : data.average >= 60
            ? "安定と成長の年。自分らしいペースで進めて◎"
            : data.average >= 40
            ? "土台づくりの年。学び・準備・人間関係を整えて"
            : "内省と再構築の年。無理せず自分を労わりましょう"}
        </p>
      </div>

      {/* 天中殺アラート */}
      {data.tenchusatsu.isTenchusatsu && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg leading-none">⚠</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700">
                {data.year}年は{data.tenchusatsu.group}（{data.tenchusatsu.yearBranch}年）
              </p>
              <p className="text-xs text-amber-600/80 mt-1">
                新しい契約・結婚・起業など「新規の大きな決断」は避け、
                内面の充実・学び・見直しに使うと運気が整います。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 四半期プレビュー */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
          <span className="text-accent-gold">◈</span> 四半期ごとの流れ
        </h3>
        <div className="space-y-2">
          {data.quarters.map((q) => (
            <div key={q.label} className="flex items-center gap-2">
              <span className="w-8 text-xs font-bold text-muted">{q.label}</span>
              <span className="w-16 text-[10px] text-muted">
                {q.months[0]}-{q.months[2]}月
              </span>
              <div className="flex-1 bg-background rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${q.avg}%`,
                    backgroundColor:
                      q.avg >= 75 ? "#f97316" : q.avg >= 50 ? "#eab308" : "#a0917b",
                  }}
                />
              </div>
              <span className="w-8 text-xs font-bold text-foreground text-right">{q.avg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 転機の月 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-2xl p-3 shadow-sm">
          <p className="text-[10px] text-muted">運気のピーク</p>
          <p className="text-lg font-bold text-accent-orange">{data.peakMonth}月</p>
          <p className="text-[10px] text-muted mt-0.5">
            {data.monthlyWaves[data.peakMonth - 1]}/100・勝負所
          </p>
        </div>
        <div className="bg-muted/10 border border-card-border rounded-2xl p-3 shadow-sm">
          <p className="text-[10px] text-muted">充電の月</p>
          <p className="text-lg font-bold text-muted">{data.bottomMonth}月</p>
          <p className="text-[10px] text-muted mt-0.5">
            {data.monthlyWaves[data.bottomMonth - 1]}/100・休息を
          </p>
        </div>
      </div>

      {/* 12ヶ月ミニグラフ */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
          <span className="text-accent-gold">◈</span> 月ごとのエネルギー
        </h3>
        <div className="flex items-end gap-1 h-20">
          {data.monthlyWaves.map((w, idx) => {
            const m = idx + 1;
            const isPeak = m === data.peakMonth;
            const isBottom = m === data.bottomMonth;
            return (
              <div key={m} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${Math.max(w, 8)}%`,
                    backgroundColor: isPeak
                      ? "#f97316"
                      : isBottom
                      ? "#a0917b"
                      : w >= 60
                      ? "#eab308"
                      : "#a0917b80",
                  }}
                />
                <span className={`text-[9px] ${isPeak ? "text-accent-orange font-bold" : "text-muted"}`}>
                  {m}
                </span>
              </div>
            );
          })}
        </div>
        <Link
          href="/monthly"
          className="block text-center text-xs text-accent-gold hover:text-accent-orange mt-3 transition-colors"
        >
          月ごとの詳細を見る →
        </Link>
      </div>

      {/* 数秘術 */}
      <YearCard
        title="数秘術"
        subtitle={`パーソナルイヤー ${data.personalYear}`}
        color="#8b5cf6"
        theme={data.personalYearTheme}
        advice={data.personalYearAdvice}
        caution={data.personalYearCaution}
      />

      {/* 九星気学 */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#10b981" }} />
          <span className="text-sm font-medium text-foreground">九星気学</span>
        </div>
        <p className="text-xs text-muted">
          {data.year}年の年盤位置：{data.nineStarDirection}
        </p>
        <p className="text-sm text-foreground/80">{data.nineStarTheme}</p>
        <p className="text-xs text-accent-gold">▸ {data.nineStarAdvice}</p>
        {data.luckyDirections.length > 0 && (
          <p className="text-xs text-muted">
            <span className="text-accent-orange font-medium">吉方位：</span>
            {data.luckyDirections.join("・")}
          </p>
        )}
        {data.unluckyDirections.length > 0 && (
          <p className="text-xs text-muted">
            <span className="text-muted/80 font-medium">避けたい方位：</span>
            {data.unluckyDirections.join("・")}
          </p>
        )}
      </div>

      {/* マヤ暦 */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#e11d48" }} />
          <span className="text-sm font-medium text-foreground">マヤ暦</span>
        </div>
        <p className="text-xs text-muted">{data.year}年のテーマ紋章・銀河の音</p>
        <p className="text-sm text-foreground/80">
          紋章：{data.mayanSealName}（{data.mayanSealKeyword}）
        </p>
        <p className="text-xs text-accent-gold">
          ▸ 銀河の音「{data.mayanToneName}」- {data.mayanToneKeyword}
        </p>
      </div>

      {/* 四柱推命 */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#06b6d4" }} />
            <span className="text-sm font-medium text-foreground">四柱推命</span>
          </div>
          <span className="text-sm font-bold" style={{ color: "#06b6d4" }}>
            {data.fourPillarsWave}
            <span className="text-xs text-muted">/100</span>
          </span>
        </div>
        <p className="text-xs text-accent-gold">
          ▸ {data.fourPillarsWave >= 70
            ? "追い風の年。五行の気が味方してくれます"
            : data.fourPillarsWave >= 50
            ? "バランスの年。丁寧な判断が吉を呼びます"
            : "剋気の年。無理せず体調と足元を最優先に"}
        </p>
      </div>

      <p className="text-center text-xs text-muted/60 px-4">
        ※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。
      </p>
    </div>
  );
}

function YearCard({
  title,
  subtitle,
  color,
  theme,
  advice,
  caution,
}: {
  title: string;
  subtitle: string;
  color: string;
  theme: string;
  advice: string;
  caution: string;
}) {
  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      <p className="text-xs text-muted">{subtitle}</p>
      <p className="text-sm text-foreground/80">{theme}</p>
      <p className="text-xs text-accent-gold">▸ {advice}</p>
      <p className="text-xs text-muted">▸ {caution}</p>
    </div>
  );
}
