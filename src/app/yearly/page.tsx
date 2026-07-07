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
import { useI18n } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/dict";
import {
  directionName,
  mayanSealName,
  mayanSealKeyword,
  mayanToneName,
  mayanToneKeyword,
} from "@/lib/i18n/fortune-terms";

const L: Record<Lang, Record<string, string>> = {
  ja: {
    heading: "年の運勢",
    graphLink: "年グラフ",
    monthlyLink: "月運勢",
    thisYear: "今年",
    nextYear: "来年",
    totalEnergySuffix: "の総合エネルギー",
    energy80: "勢いのある年。大きなチャレンジに向いています",
    energy60: "安定と成長の年。自分らしいペースで進めて◎",
    energy40: "土台づくりの年。学び・準備・人間関係を整えて",
    energyLow: "内省と再構築の年。無理せず自分を労わりましょう",
    tenchuBody:
      "新しい契約・結婚・起業など「新規の大きな決断」は避け、内面の充実・学び・見直しに使うと運気が整います。",
    quarterFlow: "四半期ごとの流れ",
    peakLabel: "運気のピーク",
    peakNote: "・勝負所",
    bottomLabel: "充電の月",
    bottomNote: "・休息を",
    monthlyEnergy: "月ごとのエネルギー",
    monthlyDetail: "月ごとの詳細を見る →",
    personalYear: "パーソナルイヤー",
    luckyDir: "吉方位：",
    unluckyDir: "避けたい方位：",
    mayanSeal: "紋章：",
    fp70: "追い風の年。五行の気が味方してくれます",
    fp50: "バランスの年。丁寧な判断が吉を呼びます",
    fpLow: "剋気の年。無理せず体調と足元を最優先に",
  },
  ko: {
    heading: "연간 운세",
    graphLink: "연간 그래프",
    monthlyLink: "이달의 운세",
    thisYear: "올해",
    nextYear: "내년",
    totalEnergySuffix: "의 종합 에너지",
    energy80: "기세가 있는 해. 큰 도전에 어울립니다",
    energy60: "안정과 성장의 해. 나다운 페이스로 나아가면 ◎",
    energy40: "토대를 다지는 해. 배움·준비·인간관계를 정돈해요",
    energyLow: "내면을 돌아보고 재구축하는 해. 무리하지 말고 자신을 돌봐요",
    tenchuBody:
      "새로운 계약·결혼·창업 등 「새로운 큰 결단」은 피하고, 내면의 충실·배움·재점검에 쓰면 운기가 정돈됩니다.",
    quarterFlow: "분기별 흐름",
    peakLabel: "운기의 절정",
    peakNote: " · 승부처",
    bottomLabel: "충전의 달",
    bottomNote: " · 휴식을",
    monthlyEnergy: "월별 에너지",
    monthlyDetail: "월별 상세 보기 →",
    personalYear: "퍼스널 이어",
    luckyDir: "길방위: ",
    unluckyDir: "피하고 싶은 방위: ",
    mayanSeal: "문장: ",
    fp70: "순풍의 해. 오행의 기운이 편이 되어줍니다",
    fp50: "균형의 해. 신중한 판단이 길함을 부릅니다",
    fpLow: "극기의 해. 무리하지 말고 컨디션과 발밑을 최우선으로",
  },
};

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

function buildYearly(birthDate: string, year: number, lang: Lang): YearlyData {
  const py = calcPersonalYear(birthDate, year);
  const pyMean = getPersonalYearMeaning(py, lang);
  const nWave = getYearWave(py);

  const ns = calcNineStar(birthDate, year, lang);
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

  const tenchu = checkTenchusatsuYear(birthDate, year, lang);

  return {
    year,
    average,
    personalYear: py,
    personalYearTheme: pyMean.theme,
    personalYearAdvice: pyMean.advice,
    personalYearCaution: pyMean.caution,
    nineStarDirection: directionName(ns.yearPosition.direction, lang),
    nineStarTheme: ns.yearPosition.theme,
    nineStarAdvice: ns.yearPosition.advice,
    luckyDirections: ns.luckyDirections.map((d) => directionName(d, lang)),
    unluckyDirections: ns.unluckyDirections.map((d) => directionName(d, lang)),
    fourPillarsWave: fpWave,
    mayanSealName: mayanSealName(mayan.solarSeal.name, lang),
    mayanSealKeyword: mayanSealKeyword(mayan.solarSeal.keyword, lang),
    mayanToneName: mayanToneName(mayan.galacticTone.name, lang),
    mayanToneKeyword: mayanToneKeyword(mayan.galacticTone.keyword, lang),
    tenchusatsu: tenchu,
    quarters,
    monthlyWaves,
    peakMonth,
    bottomMonth,
  };
}

export default function YearlyPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
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
    () => (birthDate ? buildYearly(birthDate, targetYear, lang) : null),
    [birthDate, targetYear, lang]
  );

  if (!data) {
    return <p className="text-muted text-center py-10">{t("astro.loading")}</p>;
  }

  const isCurrent = targetYear === currentYear;
  const isNext = targetYear === currentYear + 1;
  const l = L[lang];
  const yearLabel = (y: number) => (lang === "ko" ? `${y}년` : `${y}年`);
  const monthLabel = (m: number) => (lang === "ko" ? `${m}월` : `${m}月`);
  const dirSep = lang === "ko" ? " · " : "・";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
          <span className="text-accent-gold">✦</span>
          {l.heading}
        </h2>
        <div className="flex gap-2 text-xs">
          <Link href="/graph" className="text-accent-gold hover:text-accent-orange">{l.graphLink}</Link>
          <span className="text-muted">/</span>
          <Link href="/monthly" className="text-accent-gold hover:text-accent-orange">{l.monthlyLink}</Link>
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
          <div className="text-xs opacity-80">{l.thisYear}</div>
          <div className="text-lg font-bold">{yearLabel(currentYear)}</div>
        </button>
        <button
          onClick={() => setTargetYear(currentYear + 1)}
          className={`py-3 rounded-2xl border transition-all ${
            isNext
              ? "bg-accent-orange text-white border-accent-orange shadow-md"
              : "bg-card-bg border-card-border text-muted hover:text-accent-orange"
          }`}
        >
          <div className="text-xs opacity-80">{l.nextYear}</div>
          <div className="text-lg font-bold">{yearLabel(currentYear + 1)}</div>
        </button>
      </div>

      {/* 総合エネルギー */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">{yearLabel(data.year)}{l.totalEnergySuffix}</span>
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
            ? l.energy80
            : data.average >= 60
            ? l.energy60
            : data.average >= 40
            ? l.energy40
            : l.energyLow}
        </p>
      </div>

      {/* 天中殺アラート */}
      {data.tenchusatsu.isTenchusatsu && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg leading-none">⚠</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700">
                {lang === "ko"
                  ? `${yearLabel(data.year)}은 ${data.tenchusatsu.group}(${data.tenchusatsu.yearBranch}년)`
                  : `${yearLabel(data.year)}は${data.tenchusatsu.group}（${data.tenchusatsu.yearBranch}年）`}
              </p>
              <p className="text-xs text-amber-600/80 mt-1">
                {l.tenchuBody}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 四半期プレビュー */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
          <span className="text-accent-gold">◈</span> {l.quarterFlow}
        </h3>
        <div className="space-y-2">
          {data.quarters.map((q) => (
            <div key={q.label} className="flex items-center gap-2">
              <span className="w-8 text-xs font-bold text-muted">{q.label}</span>
              <span className="w-16 text-[10px] text-muted">
                {q.months[0]}-{monthLabel(q.months[2])}
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
          <p className="text-[10px] text-muted">{l.peakLabel}</p>
          <p className="text-lg font-bold text-accent-orange">{monthLabel(data.peakMonth)}</p>
          <p className="text-[10px] text-muted mt-0.5">
            {data.monthlyWaves[data.peakMonth - 1]}/100{l.peakNote}
          </p>
        </div>
        <div className="bg-muted/10 border border-card-border rounded-2xl p-3 shadow-sm">
          <p className="text-[10px] text-muted">{l.bottomLabel}</p>
          <p className="text-lg font-bold text-muted">{monthLabel(data.bottomMonth)}</p>
          <p className="text-[10px] text-muted mt-0.5">
            {data.monthlyWaves[data.bottomMonth - 1]}/100{l.bottomNote}
          </p>
        </div>
      </div>

      {/* 12ヶ月ミニグラフ */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
          <span className="text-accent-gold">◈</span> {l.monthlyEnergy}
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
          {l.monthlyDetail}
        </Link>
      </div>

      {/* 数秘術 */}
      <YearCard
        title={t("graph.series.numerology")}
        subtitle={`${l.personalYear} ${data.personalYear}`}
        color="#8b5cf6"
        theme={data.personalYearTheme}
        advice={data.personalYearAdvice}
        caution={data.personalYearCaution}
      />

      {/* 九星気学 */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#10b981" }} />
          <span className="text-sm font-medium text-foreground">{t("graph.series.ninestar")}</span>
        </div>
        <p className="text-xs text-muted">
          {lang === "ko"
            ? `${yearLabel(data.year)}의 연반 위치: ${data.nineStarDirection}`
            : `${yearLabel(data.year)}の年盤位置：${data.nineStarDirection}`}
        </p>
        <p className="text-sm text-foreground/80">{data.nineStarTheme}</p>
        <p className="text-xs text-accent-gold">▸ {data.nineStarAdvice}</p>
        {data.luckyDirections.length > 0 && (
          <p className="text-xs text-muted">
            <span className="text-accent-orange font-medium">{l.luckyDir}</span>
            {data.luckyDirections.join(dirSep)}
          </p>
        )}
        {data.unluckyDirections.length > 0 && (
          <p className="text-xs text-muted">
            <span className="text-muted/80 font-medium">{l.unluckyDir}</span>
            {data.unluckyDirections.join(dirSep)}
          </p>
        )}
      </div>

      {/* マヤ暦 */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#e11d48" }} />
          <span className="text-sm font-medium text-foreground">{t("graph.series.mayan")}</span>
        </div>
        <p className="text-xs text-muted">
          {lang === "ko"
            ? `${yearLabel(data.year)}의 테마 문장·은하의 음`
            : `${yearLabel(data.year)}のテーマ紋章・銀河の音`}
        </p>
        <p className="text-sm text-foreground/80">
          {lang === "ko"
            ? `${l.mayanSeal}${data.mayanSealName}(${data.mayanSealKeyword})`
            : `${l.mayanSeal}${data.mayanSealName}（${data.mayanSealKeyword}）`}
        </p>
        <p className="text-xs text-accent-gold">
          {lang === "ko"
            ? `▸ 은하의 음 「${data.mayanToneName}」 - ${data.mayanToneKeyword}`
            : `▸ 銀河の音「${data.mayanToneName}」- ${data.mayanToneKeyword}`}
        </p>
      </div>

      {/* 四柱推命 */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#06b6d4" }} />
            <span className="text-sm font-medium text-foreground">{t("graph.series.fourpillars")}</span>
          </div>
          <span className="text-sm font-bold" style={{ color: "#06b6d4" }}>
            {data.fourPillarsWave}
            <span className="text-xs text-muted">/100</span>
          </span>
        </div>
        <p className="text-xs text-accent-gold">
          ▸ {data.fourPillarsWave >= 70
            ? l.fp70
            : data.fourPillarsWave >= 50
            ? l.fp50
            : l.fpLow}
        </p>
      </div>

      <p className="text-center text-xs text-muted/60 px-4">
        {t("common.disclaimer")}
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
