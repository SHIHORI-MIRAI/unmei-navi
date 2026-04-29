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

interface MonthDetail {
  month: number;
  numerology: { personalMonth: number; wave: number; theme: string; advice: string; caution: string };
  nineStar: { positionDirection: string; theme: string; wave: number; advice: string; caution: string; centerStar: number };
  fourPillars: { wave: number; kanshi: string; stem: string; branch: string; element: string };
  average: number;
}

export default function MonthlyPage() {
  const router = useRouter();
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
      const pmMean = getPersonalMonthMeaning(pm);
      const nWave = getPersonalMonthWave(pm);

      const ns = calcNineStarMonthly(birthDate, year, m);
      const nsWave = getNineStarMonthlyWave(birthDate, year, m);

      const fpWave = getFourPillarsMonthWave(birthDate, year, m);
      const fpInfo = getFourPillarsMonthInfo(year, m);

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
  }, [birthDate, year]);

  const selected = details.find((d) => d.month === selectedMonth);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const isCurrentYear = year === currentYear;

  const handleChartClick = useCallback(
    (_e: unknown, elements: { index: number }[]) => {
      if (elements.length > 0 && details[elements[0].index]) {
        setSelectedMonth(details[elements[0].index].month);
      }
    },
    [details]
  );

  if (!birthDate || details.length === 0) {
    return <p className="text-muted text-center py-10">読み込み中...</p>;
  }

  const chartData = {
    labels: details.map((d) => `${d.month}月`),
    datasets: [
      {
        label: "総合",
        data: details.map((d) => d.average),
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        borderWidth: 3,
        pointRadius: details.map((d) =>
          d.month === selectedMonth ? 8 : isCurrentYear && d.month === currentMonth ? 6 : 3
        ),
        pointBackgroundColor: details.map((d) =>
          d.month === selectedMonth
            ? "#f97316"
            : isCurrentYear && d.month === currentMonth
            ? "#eab308"
            : "#f9731680"
        ),
        fill: true,
        tension: 0.3,
      },
      {
        label: "数秘術",
        data: details.map((d) => d.numerology.wave),
        borderColor: "#8b5cf6",
        borderWidth: 1.5,
        pointRadius: 2,
        borderDash: [4, 4],
        tension: 0.3,
      },
      {
        label: "九星気学",
        data: details.map((d) => d.nineStar.wave),
        borderColor: "#10b981",
        borderWidth: 1.5,
        pointRadius: 2,
        borderDash: [4, 4],
        tension: 0.3,
      },
      {
        label: "四柱推命",
        data: details.map((d) => d.fourPillars.wave),
        borderColor: "#06b6d4",
        borderWidth: 1.5,
        pointRadius: 2,
        borderDash: [4, 4],
        tension: 0.3,
      },
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
            return isCurrentYear && m === currentMonth ? `★${m}月` : `${m}月`;
          },
        },
        grid: { display: false },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: { boxWidth: 12, padding: 8, font: { size: 10 }, color: "#a0917b" },
      },
      tooltip: {
        backgroundColor: "rgba(45, 35, 25, 0.9)",
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        callbacks: {
          title: (items: { dataIndex: number }[]) => {
            const d = details[items[0].dataIndex];
            return d ? `${year}年 ${d.month}月` : "";
          },
        },
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
          <span className="text-accent-gold">☾</span>
          月ごとの運勢
        </h2>
        <div className="flex gap-2 text-xs">
          <Link href="/yearly" className="text-accent-gold hover:text-accent-orange transition-colors">
            年運詳細
          </Link>
          <span className="text-muted">/</span>
          <Link href="/graph" className="text-accent-gold hover:text-accent-orange transition-colors">
            年グラフ
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
          <span className="text-lg font-bold text-foreground">{year}年</span>
          {isCurrentYear && (
            <span className="text-[10px] text-accent-orange">今年</span>
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
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
        <p className="text-xs text-muted mb-2">タップで月を選択 {isCurrentYear && "/ ★は今月"}</p>
        <div style={{ height: "260px" }}>
          <Line data={chartData} options={chartOptions} />
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
              {isCur && !isSel ? "★" : ""}{d.month}月
            </button>
          );
        })}
      </div>

      {/* 選択月の詳細 */}
      {selected && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
            <span>◈</span> {year}年 {selected.month}月の運勢
            {isCurrentYear && selected.month === currentMonth && (
              <span className="ml-1 text-xs bg-accent-orange/20 text-accent-orange px-2 py-0.5 rounded-full">今月</span>
            )}
          </h3>

          {/* 総合エネルギー */}
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">総合エネルギー</span>
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
                ? "運気が高い月。積極的に動いて結果を掴みにいきましょう！"
                : selected.average >= 60
                ? "安定した月。無理せず自分らしく過ごすと◎"
                : selected.average >= 40
                ? "力を蓄える月。準備・学びに意識を向けて"
                : "静かに過ごす月。焦らず内面を整えましょう"}
            </p>
          </div>

          {/* 数秘術 */}
          <MonthCard
            title="数秘術"
            subtitle={`パーソナルマンス ${selected.numerology.personalMonth}`}
            wave={selected.numerology.wave}
            color="#8b5cf6"
            theme={selected.numerology.theme}
            advice={selected.numerology.advice}
            caution={selected.numerology.caution}
          />

          {/* 九星気学 */}
          <MonthCard
            title="九星気学"
            subtitle={`月盤：${selected.nineStar.positionDirection}`}
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
                <span className="text-sm font-medium text-foreground">四柱推命</span>
              </div>
              <span className="text-sm font-bold" style={{ color: "#06b6d4" }}>
                {selected.fourPillars.wave}
                <span className="text-xs text-muted">/100</span>
              </span>
            </div>
            <p className="text-xs text-muted">
              月柱：{selected.fourPillars.kanshi}（{selected.fourPillars.element}の気）
            </p>
            <p className="text-sm text-foreground/80">
              日主と月柱の五行相性から、今月のエネルギーの出やすさを示しています
            </p>
            <p className="text-xs text-accent-gold">
              ▸ {selected.fourPillars.wave >= 70
                ? "追い風の月。自然体で動いて大丈夫"
                : selected.fourPillars.wave >= 50
                ? "バランス型の月。丁寧な判断が吉"
                : "向かい風の月。無理せず体調優先で"}
            </p>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted/60 px-4">
        ※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。
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
