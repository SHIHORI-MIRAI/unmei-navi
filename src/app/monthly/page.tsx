"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadProfile } from "@/lib/storage";
import {
  calcPersonalMonth,
  getPersonalMonthWave,
  getPersonalMonthMeaning,
} from "@/lib/divination/numerology";
import {
  calcNineStarMonthly,
  getNineStarMonthlyWave,
} from "@/lib/divination/nine-star";
import {
  getFourPillarsMonthWave,
  getFourPillarsMonthInfo,
} from "@/lib/divination/four-pillars";
import { useI18n } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/dict";
import { directionName } from "@/lib/i18n/fortune-terms";
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/** グラフ凡例（色・キー・バッジ内アイコン）。名前と説明は L[lang] から引く */
const SERIES_LEGEND = [
  { key: "overall", color: "#f97316", icon: "★" },
  { key: "numerology", color: "#8b5cf6", icon: "✦" },
  { key: "ninestar", color: "#10b981", icon: "✿" },
  { key: "fourpillars", color: "#06b6d4", icon: "▲" },
] as const;

/** この画面固有の二言語文言 */
const L: Record<Lang, Record<string, string>> = {
  ja: {
    title: "月ごとの運勢",
    yearlyLink: "年運詳細",
    graphLink: "年グラフ",
    thisYear: "今年",
    tapHint: "タップで月を選択",
    thisMonthHint: "★は今月",
    thisMonth: "今月",
    totalEnergy: "総合エネルギー",
    energyHigh: "運気が高い月。積極的に動いて結果を掴みにいきましょう！",
    energyStable: "安定した月。無理せず自分らしく過ごすと◎",
    energyBuild: "力を蓄える月。準備・学びに意識を向けて",
    energyCharge: "静かに過ごす月。焦らず内面を整えましょう",
    "series.overall": "総合",
    "series.numerology": "数秘術",
    "series.ninestar": "九星気学",
    "series.fourpillars": "四柱推命",
    "desc.overall": "全体的な運勢の流れ",
    "desc.numerology": "内面の力・才能・使命",
    "desc.ninestar": "環境や人間関係の流れ",
    "desc.fourpillars": "運命の土台・人生の基盤",
    fpDesc: "日主と月柱の五行相性から、今月のエネルギーの出やすさを示しています",
    fpHigh: "追い風の月。自然体で動いて大丈夫",
    fpMid: "バランス型の月。丁寧な判断が吉",
    fpLow: "向かい風の月。無理せず体調優先で",
  },
  ko: {
    title: "월별 운세",
    yearlyLink: "연운 상세",
    graphLink: "연간 그래프",
    thisYear: "올해",
    tapHint: "탭하여 달을 선택",
    thisMonthHint: "★는 이번 달",
    thisMonth: "이번 달",
    totalEnergy: "종합 에너지",
    energyHigh: "운기가 높은 달. 적극적으로 움직여 결과를 잡으러 가요!",
    energyStable: "안정된 달. 무리하지 말고 나답게 지내면 좋아요",
    energyBuild: "힘을 비축하는 달. 준비와 배움에 마음을 기울여 보세요",
    energyCharge: "조용히 지내는 달. 조급해하지 말고 내면을 정돈해요",
    "series.overall": "종합",
    "series.numerology": "수비학",
    "series.ninestar": "구성기학",
    "series.fourpillars": "사주",
    "desc.overall": "전체적인 운세의 흐름",
    "desc.numerology": "내면의 힘·재능·사명",
    "desc.ninestar": "환경과 인간관계의 흐름",
    "desc.fourpillars": "운명의 토대·인생의 기반",
    fpDesc: "일간과 월주의 오행 상성을 바탕으로 이번 달 에너지가 나오기 쉬운 정도를 나타냅니다",
    fpHigh: "순풍의 달. 자연스럽게 움직여도 괜찮아요",
    fpMid: "균형 잡힌 달. 신중한 판단이 길합니다",
    fpLow: "역풍의 달. 무리하지 말고 컨디션을 우선으로",
  },
};

interface MonthDetail {
  month: number;
  numerology: { personalMonth: number; wave: number; theme: string; advice: string; caution: string };
  nineStar: { positionDirection: string; theme: string; wave: number; advice: string; caution: string; centerStar: number };
  fourPillars: { wave: number; kanshi: string; stem: string; branch: string; element: string };
  average: number;
}

export default function MonthlyPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const today = useMemo(() => new Date(), []);
  const [birthDate, setBirthDate] = useState<string>("");
  const [year, setYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [details, setDetails] = useState<MonthDetail[]>([]);

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) {
      router.push("/profile");
      return;
    }
    setBirthDate(profile.birthDate);
  }, [router]);

  useEffect(() => {
    if (!birthDate) return;
    const list: MonthDetail[] = [];
    for (let m = 1; m <= 12; m++) {
      const pm = calcPersonalMonth(birthDate, year, m);
      const pmMean = getPersonalMonthMeaning(pm, lang);
      const nWave = getPersonalMonthWave(pm);

      const ns = calcNineStarMonthly(birthDate, year, m, lang);
      const nsWave = getNineStarMonthlyWave(birthDate, year, m);

      const fpWave = getFourPillarsMonthWave(birthDate, year, m);
      const fpInfo = getFourPillarsMonthInfo(year, m, lang);

      const avg = Math.round((nWave + nsWave + fpWave) / 3);

      list.push({
        month: m,
        numerology: {
          personalMonth: pm,
          wave: nWave,
          theme: pmMean.theme,
          advice: pmMean.advice,
          caution: pmMean.caution,
        },
        nineStar: {
          positionDirection: ns.positionDirection,
          theme: ns.theme,
          wave: nsWave,
          advice: ns.advice,
          caution: ns.caution,
          centerStar: ns.monthCenterStar,
        },
        fourPillars: {
          wave: fpWave,
          kanshi: fpInfo.kanshi,
          stem: fpInfo.stem,
          branch: fpInfo.branch,
          element: fpInfo.element,
        },
        average: avg,
      });
    }
    setDetails(list);
  }, [birthDate, year, lang]);

  const selected = details.find((d) => d.month === selectedMonth);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const isCurrentYear = year === currentYear;

  // 年・月ラベル（ロケール対応）
  const yLabel = (y: number) => (lang === "ko" ? `${y}년` : `${y}年`);
  const mLabel = (m: number) => (lang === "ko" ? `${m}월` : `${m}月`);

  const handleChartClick = useCallback(
    (_e: unknown, elements: { index: number }[]) => {
      if (elements.length > 0 && details[elements[0].index]) {
        setSelectedMonth(details[elements[0].index].month);
      }
    },
    [details]
  );

  if (!birthDate || details.length === 0) {
    return <p className="text-muted text-center py-10">{t("astro.loading")}</p>;
  }

  // 補助線（占術別）の共通マーカー設定：白フチの色付き丸
  const subPoint = (color: string) => ({
    borderColor: color,
    borderWidth: 2,
    borderDash: [5, 4],
    pointRadius: details.map((d) => (d.month === selectedMonth ? 5 : 4)),
    pointHoverRadius: 6,
    pointBackgroundColor: color,
    pointBorderColor: "#ffffff",
    pointBorderWidth: 1.5,
    tension: 0.35,
  });

  const chartData = {
    labels: details.map((d) => mLabel(d.month)),
    datasets: [
      {
        label: L[lang]["series.overall"],
        data: details.map((d) => d.average),
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 165, 80, 0.14)",
        borderWidth: 3.5,
        pointRadius: details.map((d) =>
          d.month === selectedMonth ? 9 : isCurrentYear && d.month === currentMonth ? 8 : 5
        ),
        pointHoverRadius: 10,
        pointBackgroundColor: details.map((d) =>
          isCurrentYear && d.month === currentMonth ? "#f59e0b" : "#f97316"
        ),
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2.5,
        fill: true,
        tension: 0.35,
        order: 0,
      },
      { label: L[lang]["series.numerology"], data: details.map((d) => d.numerology.wave), ...subPoint("#8b5cf6"), order: 1 },
      { label: L[lang]["series.ninestar"], data: details.map((d) => d.nineStar.wave), ...subPoint("#10b981"), order: 2 },
      { label: L[lang]["series.fourpillars"], data: details.map((d) => d.fourPillars.wave), ...subPoint("#06b6d4"), order: 3 },
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
        ticks: { stepSize: 25, color: "#a0917b", font: { size: 10 } },
        grid: { color: "rgba(160, 145, 123, 0.15)" },
      },
      x: {
        ticks: {
          color: "#a0917b",
          font: { size: 10, weight: "bold" as const },
          callback: function (_v: unknown, index: number) {
            const m = details[index]?.month;
            if (m === undefined) return "";
            return isCurrentYear && m === currentMonth ? `★${mLabel(m)}` : mLabel(m);
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
            const d = details[items[0].dataIndex];
            return d ? `${yLabel(year)} ${mLabel(d.month)}` : "";
          },
        },
      },
    },
  };

  // 今月の総合ポイントの背後にやわらかい光を描くプラグイン
  const currentMonthIndex = isCurrentYear
    ? details.findIndex((d) => d.month === currentMonth)
    : -1;
  const glowPlugin = {
    id: "currentMonthGlow",
    beforeDatasetsDraw(chart: {
      ctx: CanvasRenderingContext2D;
      getDatasetMeta: (i: number) => { data: { x: number; y: number }[] };
    }) {
      if (currentMonthIndex < 0) return;
      const pt = chart.getDatasetMeta(0).data[currentMonthIndex];
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
          <span className="text-accent-gold">☾</span>
          {L[lang].title}
        </h2>
        <div className="flex items-center gap-2 text-xs rounded-full border border-accent-gold/40 bg-card-bg px-3.5 py-1.5 shadow-sm">
          <Link href="/yearly" className="text-accent-gold font-medium hover:text-accent-orange transition-colors">
            {L[lang].yearlyLink}
          </Link>
          <span className="text-accent-gold/40">/</span>
          <Link href="/graph" className="text-accent-gold font-medium hover:text-accent-orange transition-colors">
            {L[lang].graphLink}
          </Link>
        </div>
      </div>

      {/* 年切替 */}
      <div className="flex items-center justify-center gap-3 bg-card-bg border border-card-border rounded-2xl p-3 shadow-sm">
        <button
          onClick={() => setYear(year - 1)}
          className="px-3 py-1 text-sm rounded-lg bg-background text-accent-orange hover:bg-accent-orange/10 transition"
        >
          ◀ {year - 1}
        </button>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-foreground">{yLabel(year)}</span>
          {isCurrentYear && (
            <span className="text-[10px] text-accent-orange">{L[lang].thisYear}</span>
          )}
        </div>
        <button
          onClick={() => setYear(year + 1)}
          className="px-3 py-1 text-sm rounded-lg bg-background text-accent-orange hover:bg-accent-orange/10 transition"
        >
          {year + 1} ▶
        </button>
      </div>

      {/* グラフ */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
        <p className="text-xs text-muted flex items-center gap-1.5">
          <span className="text-accent-gold">✦</span>
          {L[lang].tapHint} {isCurrentYear && `/ ${L[lang].thisMonthHint}`}
        </p>
        <div style={{ height: "260px" }}>
          <Line data={chartData} options={chartOptions} plugins={[glowPlugin]} />
        </div>

        {/* 凡例（色付きバッジ＋説明） */}
        <div className="grid grid-cols-1 gap-2 pt-1">
          {SERIES_LEGEND.map((s) => (
            <div key={s.key} className="flex items-center gap-2.5">
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shadow-sm ring-2 ring-white"
                style={{ backgroundColor: s.color }}
              >
                {s.icon}
              </span>
              <span className="text-sm font-bold" style={{ color: s.color }}>
                {L[lang][`series.${s.key}`]}
              </span>
              <span className="flex-1 border-b border-dotted border-muted/30 mx-1" />
              <span className="text-xs text-muted whitespace-nowrap">{L[lang][`desc.${s.key}`]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 月セレクター（横スクロール） */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {details.map((d) => {
          const isSel = d.month === selectedMonth;
          const isCur = isCurrentYear && d.month === currentMonth;
          return (
            <button
              key={d.month}
              onClick={() => setSelectedMonth(d.month)}
              className={`shrink-0 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                isSel
                  ? "bg-accent-orange text-white shadow-md"
                  : isCur
                  ? "bg-accent-gold/20 text-accent-gold border border-accent-gold/40"
                  : "bg-card-bg border border-card-border text-muted hover:text-accent-orange"
              }`}
            >
              {isCur && !isSel ? "★" : ""}{mLabel(d.month)}
            </button>
          );
        })}
      </div>

      {/* 選択月の詳細 */}
      {selected && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
            <span>◈</span>{" "}
            {lang === "ko"
              ? `${yLabel(year)} ${mLabel(selected.month)}의 운세`
              : `${yLabel(year)} ${mLabel(selected.month)}の運勢`}
            {isCurrentYear && selected.month === currentMonth && (
              <span className="ml-1 text-xs bg-accent-orange/20 text-accent-orange px-2 py-0.5 rounded-full">{L[lang].thisMonth}</span>
            )}
          </h3>

          {/* 総合エネルギー */}
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{L[lang].totalEnergy}</span>
              <span className="text-2xl font-bold text-accent-orange">
                {selected.average}
                <span className="text-xs text-muted ml-0.5">/100</span>
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${selected.average}%`,
                  backgroundColor:
                    selected.average >= 75 ? "#f97316" : selected.average >= 50 ? "#eab308" : "#a0917b",
                }}
              />
            </div>
            <p className="text-xs text-muted mt-2">
              {selected.average >= 80
                ? L[lang].energyHigh
                : selected.average >= 60
                ? L[lang].energyStable
                : selected.average >= 40
                ? L[lang].energyBuild
                : L[lang].energyCharge}
            </p>
          </div>

          {/* 数秘術 */}
          <MonthCard
            title={L[lang]["series.numerology"]}
            subtitle={
              lang === "ko"
                ? `퍼스널 먼스 ${selected.numerology.personalMonth}`
                : `パーソナルマンス ${selected.numerology.personalMonth}`
            }
            wave={selected.numerology.wave}
            color="#8b5cf6"
            theme={selected.numerology.theme}
            advice={selected.numerology.advice}
            caution={selected.numerology.caution}
          />

          {/* 九星気学 */}
          <MonthCard
            title={L[lang]["series.ninestar"]}
            subtitle={
              lang === "ko"
                ? `월반: ${directionName(selected.nineStar.positionDirection, lang)}`
                : `月盤：${selected.nineStar.positionDirection}`
            }
            wave={selected.nineStar.wave}
            color="#10b981"
            theme={selected.nineStar.theme}
            advice={selected.nineStar.advice}
            caution={selected.nineStar.caution}
          />

          {/* 四柱推命 */}
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#06b6d4" }} />
                <span className="text-sm font-medium text-foreground">{L[lang]["series.fourpillars"]}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: "#06b6d4" }}>
                {selected.fourPillars.wave}
                <span className="text-xs text-muted">/100</span>
              </span>
            </div>
            <p className="text-xs text-muted">
              {lang === "ko"
                ? `월주: ${selected.fourPillars.kanshi} (${selected.fourPillars.element}의 기운)`
                : `月柱：${selected.fourPillars.kanshi}（${selected.fourPillars.element}の気）`}
            </p>
            <p className="text-sm text-foreground/80">
              {L[lang].fpDesc}
            </p>
            <p className="text-xs text-accent-gold">
              ▸ {selected.fourPillars.wave >= 70
                ? L[lang].fpHigh
                : selected.fourPillars.wave >= 50
                ? L[lang].fpMid
                : L[lang].fpLow}
            </p>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted/60 px-4">
        {t("common.disclaimer")}
      </p>
    </div>
  );
}

function MonthCard({
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
        <span className="text-sm font-bold" style={{ color }}>
          {wave}
          <span className="text-xs text-muted">/100</span>
        </span>
      </div>
      <p className="text-xs text-muted">{subtitle}</p>
      <p className="text-sm text-foreground/80">{theme}</p>
      <p className="text-xs text-accent-gold">▸ {advice}</p>
      <p className="text-xs text-muted">▸ {caution}</p>
    </div>
  );
}
