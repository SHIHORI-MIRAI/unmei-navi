"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadProfile } from "@/lib/storage";
import {
  calcPersonalYear,
  getYearWave,
  getPersonalYearMeaning,
} from "@/lib/divination/numerology";
import {
  getNineStarWave,
  getNineStarPositionName,
  calcNineStar,
} from "@/lib/divination/nine-star";
import {
  getMayanYearWave,
  getMayanYearLabel,
  calcYearlyMayan,
} from "@/lib/divination/mayan";
import { getFourPillarsWave } from "@/lib/divination/four-pillars";
import { useI18n } from "@/lib/i18n/provider";
import type { DictKey, Lang } from "@/lib/i18n/dict";
import {
  mayanSealName,
  mayanSealKeyword,
  mayanToneName,
  mayanToneKeyword,
} from "@/lib/i18n/fortune-terms";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import UsageHelp from "@/components/UsageHelp";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const YEAR_RANGE = 6; // 前後6年（計13年分）

/** グラフ凡例（色・名前キー・説明キー・バッジ内アイコン） */
const SERIES_LEGEND: {
  nameKey: DictKey;
  descKey: DictKey;
  color: string;
  icon: string;
}[] = [
  { nameKey: "graph.series.overall", descKey: "graph.seriesDesc.overall", color: "#f97316", icon: "★" },
  { nameKey: "graph.series.numerology", descKey: "graph.seriesDesc.numerology", color: "#8b5cf6", icon: "✦" },
  { nameKey: "graph.series.mayan", descKey: "graph.seriesDesc.mayan", color: "#e11d48", icon: "◆" },
  { nameKey: "graph.series.ninestar", descKey: "graph.seriesDesc.ninestar", color: "#10b981", icon: "✿" },
  { nameKey: "graph.series.fourpillars", descKey: "graph.seriesDesc.fourpillars", color: "#06b6d4", icon: "▲" },
];

interface YearDetail {
  year: number;
  numerology: { personalYear: number; wave: number; theme: string; advice: string; caution: string };
  mayan: { label: string; wave: number; sealName: string; keyword: string; toneName: string; toneKeyword: string };
  nineStar: { positionName: string; wave: number; theme: string; advice: string; caution: string };
  fourPillars: { wave: number };
  average: number;
}

export default function GraphPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [yearDetails, setYearDetails] = useState<YearDetail[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [, setBirthDate] = useState<string>("");

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) {
      router.push("/profile");
      return;
    }
    setBirthDate(profile.birthDate);
    const currentYear = new Date().getFullYear();
    const details: YearDetail[] = [];

    for (let y = currentYear - YEAR_RANGE; y <= currentYear + YEAR_RANGE; y++) {
      const py = calcPersonalYear(profile.birthDate, y);
      const pyMeaning = getPersonalYearMeaning(py, lang);
      const nWave = getYearWave(py);

      const mWave = getMayanYearWave(profile.birthDate, y);
      const mResult = calcYearlyMayan(profile.birthDate, y);
      const mLabel = getMayanYearLabel(profile.birthDate, y, lang);

      const nsWave = getNineStarWave(profile.birthDate, y);
      const nsResult = calcNineStar(profile.birthDate, y, lang);

      const fpWave = getFourPillarsWave(profile.birthDate, y);

      const avg = Math.round((nWave + mWave + nsWave + fpWave) / 4);

      details.push({
        year: y,
        numerology: {
          personalYear: py,
          wave: nWave,
          theme: pyMeaning.theme,
          advice: pyMeaning.advice,
          caution: pyMeaning.caution,
        },
        mayan: {
          label: mLabel,
          wave: mWave,
          sealName: mayanSealName(mResult.solarSeal.name, lang),
          keyword: mayanSealKeyword(mResult.solarSeal.keyword, lang),
          toneName: mayanToneName(mResult.galacticTone.name, lang),
          toneKeyword: mayanToneKeyword(mResult.galacticTone.keyword, lang),
        },
        nineStar: {
          positionName: getNineStarPositionName(profile.birthDate, y, lang),
          wave: nsWave,
          theme: nsResult.yearPosition.theme,
          advice: nsResult.yearPosition.advice,
          caution: nsResult.yearPosition.caution,
        },
        fourPillars: { wave: fpWave },
        average: avg,
      });
    }
    setYearDetails(details);
  }, [router, lang]);

  const selected = yearDetails.find((d) => d.year === selectedYear);
  const currentYear = new Date().getFullYear();

  const handleChartClick = useCallback(
    (_event: unknown, elements: { index: number }[]) => {
      if (elements.length > 0 && yearDetails[elements[0].index]) {
        setSelectedYear(yearDetails[elements[0].index].year);
      }
    },
    [yearDetails]
  );

  if (yearDetails.length === 0) {
    return <p className="text-muted text-center py-10">{t("astro.loading")}</p>;
  }

  // 補助線（占術別）の共通マーカー設定：白フチの色付き丸
  const subPoint = (color: string) => ({
    borderColor: color,
    borderWidth: 2,
    borderDash: [5, 4],
    pointRadius: yearDetails.map((d) => (d.year === selectedYear ? 5 : 4)),
    pointHoverRadius: 6,
    pointBackgroundColor: color,
    pointBorderColor: "#ffffff",
    pointBorderWidth: 1.5,
    tension: 0.35,
  });

  const chartData = {
    labels: yearDetails.map((d) => `${d.year}`),
    datasets: [
      {
        label: t("graph.series.overall"),
        data: yearDetails.map((d) => d.average),
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 165, 80, 0.14)",
        borderWidth: 3.5,
        pointRadius: yearDetails.map((d) => (d.year === selectedYear ? 9 : d.year === currentYear ? 8 : 5)),
        pointHoverRadius: 10,
        pointBackgroundColor: yearDetails.map((d) =>
          d.year === currentYear ? "#f59e0b" : "#f97316"
        ),
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2.5,
        fill: true,
        tension: 0.35,
        order: 0,
      },
      { label: t("graph.series.numerology"), data: yearDetails.map((d) => d.numerology.wave), ...subPoint("#8b5cf6"), order: 1 },
      { label: t("graph.series.mayan"), data: yearDetails.map((d) => d.mayan.wave), ...subPoint("#e11d48"), order: 2 },
      { label: t("graph.series.ninestar"), data: yearDetails.map((d) => d.nineStar.wave), ...subPoint("#10b981"), order: 3 },
      { label: t("graph.series.fourpillars"), data: yearDetails.map((d) => d.fourPillars.wave), ...subPoint("#06b6d4"), order: 4 },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          color: "#a0917b",
          font: { size: 10 },
        },
        grid: { color: "rgba(160, 145, 123, 0.15)" },
      },
      x: {
        ticks: {
          color: "#a0917b",
          font: {
            size: 10,
            weight: "bold" as const,
          },
          callback: function (_value: unknown, index: number) {
            const y = yearDetails[index]?.year;
            return y === currentYear ? `★${y}` : `${y}`;
          },
        },
        grid: { display: false },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(45, 35, 25, 0.9)",
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        callbacks: {
          title: (items: { dataIndex: number }[]) => {
            const d = yearDetails[items[0].dataIndex];
            if (!d) return "";
            return lang === "ko" ? `${d.year}년` : `${d.year}年`;
          },
        },
      },
    },
  };

  // 今年の総合ポイントの背後にやわらかい光を描くプラグイン
  const currentYearIndex = yearDetails.findIndex((d) => d.year === currentYear);
  const glowPlugin = {
    id: "currentYearGlow",
    beforeDatasetsDraw(chart: {
      ctx: CanvasRenderingContext2D;
      getDatasetMeta: (i: number) => { data: { x: number; y: number }[] };
    }) {
      if (currentYearIndex < 0) return;
      const pt = chart.getDatasetMeta(0).data[currentYearIndex];
      if (!pt) return;
      const { ctx } = chart;
      ctx.save();
      const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 24);
      grad.addColorStop(0, "rgba(245, 158, 11, 0.55)");
      grad.addColorStop(0.6, "rgba(245, 158, 11, 0.22)");
      grad.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
          <span className="text-accent-gold">☽</span>
          {t("graph.title")}
        </h2>
        <div className="flex items-center gap-2 text-xs rounded-full border border-accent-gold/40 bg-card-bg px-3.5 py-1.5 shadow-sm">
          <Link href="/yearly" className="text-accent-gold font-medium hover:text-accent-orange transition-colors">
            {t("graph.yearlyLink")}
          </Link>
          <span className="text-accent-gold/40">/</span>
          <Link href="/monthly" className="text-accent-gold font-medium hover:text-accent-orange transition-colors">
            {t("graph.monthlyLink")}
          </Link>
        </div>
      </div>

      <UsageHelp
        storageKey="usage-help-graph"
        title={t("graph.help.title")}
        steps={[
          t("graph.help.step1"),
          t("graph.help.step2"),
          t("graph.help.step3"),
          t("graph.help.step4"),
        ]}
      />

      {/* グラフ */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
        <p className="text-xs text-muted flex items-center gap-1.5">
          <span className="text-accent-gold">✦</span>
          {t("graph.tapHint")}
        </p>
        <div style={{ height: "260px" }}>
          <Line data={chartData} options={chartOptions} plugins={[glowPlugin]} />
        </div>

        {/* 凡例（色付きバッジ＋説明） */}
        <div className="grid grid-cols-1 gap-2 pt-1">
          {SERIES_LEGEND.map((s) => (
            <div key={s.nameKey} className="flex items-center gap-2.5">
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shadow-sm ring-2 ring-white"
                style={{ backgroundColor: s.color }}
              >
                {s.icon}
              </span>
              <span className="text-sm font-bold" style={{ color: s.color }}>
                {t(s.nameKey)}
              </span>
              <span className="flex-1 border-b border-dotted border-muted/30 mx-1" />
              <span className="text-xs text-muted whitespace-nowrap">{t(s.descKey)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 選択年の時期ガイド */}
      {selected && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
            <span>◈</span> {t("graph.periodGuide", { year: selected.year })}
            {selected.year === currentYear && (
              <span className="ml-1 text-xs bg-accent-orange/20 text-accent-orange px-2 py-0.5 rounded-full">{t("graph.thisYear")}</span>
            )}
          </h3>

          {/* 総合エネルギー */}
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{t("graph.totalEnergy")}</span>
              <span className="text-2xl font-bold text-accent-orange">{selected.average}<span className="text-xs text-muted ml-0.5">/100</span></span>
            </div>
            <div className="w-full bg-background rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${selected.average}%`,
                  backgroundColor: selected.average >= 75 ? "#f97316" : selected.average >= 50 ? "#eab308" : "#a0917b",
                }}
              />
            </div>
            <p className="text-xs text-muted mt-2">
              {selected.average >= 80
                ? t("graph.energy.high")
                : selected.average >= 60
                ? t("graph.energy.stable")
                : selected.average >= 40
                ? t("graph.energy.build")
                : t("graph.energy.charge")}
            </p>
          </div>

          {/* 数秘術 */}
          <GuideCard
            title={t("graph.series.numerology")}
            subtitle={`${t("home.year.personalYear")} ${selected.numerology.personalYear}`}
            wave={selected.numerology.wave}
            color="#8b5cf6"
            theme={selected.numerology.theme}
            advice={selected.numerology.advice}
            caution={selected.numerology.caution}
          />

          {/* マヤ暦 */}
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#e11d48" }} />
                <span className="text-sm font-medium text-foreground">{t("graph.series.mayan")}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: "#e11d48" }}>{selected.mayan.wave}<span className="text-xs text-muted">/100</span></span>
            </div>
            <p className="text-xs text-muted">{selected.mayan.label}</p>
            <p className="text-sm text-foreground/80">
              {t("graph.mayanThemeSeal", { year: selected.year, seal: selected.mayan.sealName, keyword: selected.mayan.keyword })}
            </p>
            <p className="text-xs text-accent-gold">
              {t("graph.mayanTone", { tone: selected.mayan.toneName, keyword: selected.mayan.toneKeyword })}
            </p>
          </div>

          {/* 九星気学 */}
          <GuideCard
            title={t("graph.series.ninestar")}
            subtitle={selected.nineStar.positionName}
            wave={selected.nineStar.wave}
            color="#10b981"
            theme={selected.nineStar.theme}
            advice={selected.nineStar.advice}
            caution={selected.nineStar.caution}
          />

          {/* 月ごとの運勢への導線 */}
          <Link
            href="/monthly"
            className="block bg-accent-orange/10 hover:bg-accent-orange/15 border border-accent-orange/30 rounded-2xl p-4 shadow-sm transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-accent-orange">
                  {t("graph.monthlyCta", { year: selected.year })}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {t("graph.monthlySub")}
                </p>
              </div>
              <span className="text-accent-orange text-xl">→</span>
            </div>
          </Link>
        </div>
      )}

      <p className="text-center text-xs text-muted/60 px-4">
        {t("common.disclaimer")}
      </p>
    </div>
  );
}

function GuideCard({
  title,
  subtitle,
  wave,
  color,
  theme,
  advice,
  caution,
}: {
  title: string;
  subtitle: string;
  wave: number;
  color: string;
  theme: string;
  advice: string;
  caution: string;
}) {
  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>{wave}<span className="text-xs text-muted">/100</span></span>
      </div>
      <p className="text-xs text-muted">{subtitle}</p>
      <p className="text-sm text-foreground/80">{theme}</p>
      <p className="text-xs text-accent-gold">▸ {advice}</p>
      <p className="text-xs text-muted">▸ {caution}</p>
    </div>
  );
}
