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

const YEAR_RANGE = 6; // 前後6年（計13年分）

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
  const [yearDetails, setYearDetails] = useState<YearDetail[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [birthDate, setBirthDate] = useState<string>("");

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
      const pyMeaning = getPersonalYearMeaning(py);
      const nWave = getYearWave(py);

      const mWave = getMayanYearWave(profile.birthDate, y);
      const mResult = calcYearlyMayan(profile.birthDate, y);
      const mLabel = getMayanYearLabel(profile.birthDate, y);

      const nsWave = getNineStarWave(profile.birthDate, y);
      const nsResult = calcNineStar(profile.birthDate, y);

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
          sealName: mResult.solarSeal.name,
          keyword: mResult.solarSeal.keyword,
          toneName: mResult.galacticTone.name,
          toneKeyword: mResult.galacticTone.keyword,
        },
        nineStar: {
          positionName: getNineStarPositionName(profile.birthDate, y),
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
  }, [router]);

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
    return <p className="text-muted text-center py-10">読み込み中...</p>;
  }

  const chartData = {
    labels: yearDetails.map((d) => `${d.year}`),
    datasets: [
      {
        label: "総合",
        data: yearDetails.map((d) => d.average),
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        borderWidth: 3,
        pointRadius: yearDetails.map((d) => (d.year === selectedYear ? 8 : d.year === currentYear ? 6 : 3)),
        pointBackgroundColor: yearDetails.map((d) =>
          d.year === selectedYear ? "#f97316" : d.year === currentYear ? "#eab308" : "#f9731680"
        ),
        fill: true,
        tension: 0.3,
      },
      {
        label: "数秘術",
        data: yearDetails.map((d) => d.numerology.wave),
        borderColor: "#8b5cf6",
        borderWidth: 1.5,
        pointRadius: 2,
        borderDash: [4, 4],
        tension: 0.3,
      },
      {
        label: "マヤ暦",
        data: yearDetails.map((d) => d.mayan.wave),
        borderColor: "#e11d48",
        borderWidth: 1.5,
        pointRadius: 2,
        borderDash: [4, 4],
        tension: 0.3,
      },
      {
        label: "九星気学",
        data: yearDetails.map((d) => d.nineStar.wave),
        borderColor: "#10b981",
        borderWidth: 1.5,
        pointRadius: 2,
        borderDash: [4, 4],
        tension: 0.3,
      },
      {
        label: "四柱推命",
        data: yearDetails.map((d) => d.fourPillars.wave),
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
        display: true,
        position: "bottom" as const,
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { size: 10 },
          color: "#a0917b",
        },
      },
      tooltip: {
        backgroundColor: "rgba(45, 35, 25, 0.9)",
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        callbacks: {
          title: (items: { dataIndex: number }[]) => {
            const d = yearDetails[items[0].dataIndex];
            return d ? `${d.year}年` : "";
          },
        },
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
          <span className="text-accent-gold">☽</span>
          運勢グラフ
        </h2>
        <div className="flex gap-2 text-xs">
          <Link href="/yearly" className="text-accent-gold hover:text-accent-orange transition-colors">
            年運詳細
          </Link>
          <span className="text-muted">/</span>
          <Link href="/monthly" className="text-accent-gold hover:text-accent-orange transition-colors">
            月運勢
          </Link>
        </div>
      </div>

      {/* グラフ */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
        <p className="text-xs text-muted mb-2">タップで年を選択 / ★は今年</p>
        <div style={{ height: "260px" }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* 選択年の時期ガイド */}
      {selected && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
            <span>◈</span> {selected.year}年の時期ガイド
            {selected.year === currentYear && (
              <span className="ml-1 text-xs bg-accent-orange/20 text-accent-orange px-2 py-0.5 rounded-full">今年</span>
            )}
          </h3>

          {/* 総合エネルギー */}
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">総合エネルギー</span>
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
                ? "運気が高い年です。積極的にチャレンジしましょう！"
                : selected.average >= 60
                ? "安定した運気の年。バランスよく過ごすと◎"
                : selected.average >= 40
                ? "力を蓄える年。準備と学びに集中しましょう"
                : "充電の年。焦らず内面を充実させる時期です"}
            </p>
          </div>

          {/* 数秘術 */}
          <GuideCard
            title="数秘術"
            subtitle={`パーソナルイヤー ${selected.numerology.personalYear}`}
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
                <span className="text-sm font-medium text-foreground">マヤ暦</span>
              </div>
              <span className="text-sm font-bold" style={{ color: "#e11d48" }}>{selected.mayan.wave}<span className="text-xs text-muted">/100</span></span>
            </div>
            <p className="text-xs text-muted">{selected.mayan.label}</p>
            <p className="text-sm text-foreground/80">
              {selected.year}年のテーマ紋章：{selected.mayan.sealName}（{selected.mayan.keyword}）
            </p>
            <p className="text-xs text-accent-gold">
              ▸ 銀河の音「{selected.mayan.toneName}」- {selected.mayan.toneKeyword}
            </p>
          </div>

          {/* 九星気学 */}
          <GuideCard
            title="九星気学"
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
                  {selected.year}年の月ごとの運勢を見る
                </p>
                <p className="text-xs text-muted mt-0.5">
                  12ヶ月の流れ・今月のテーマをチェック
                </p>
              </div>
              <span className="text-accent-orange text-xl">→</span>
            </div>
          </Link>
        </div>
      )}

      <p className="text-center text-xs text-muted/60 px-4">
        ※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。
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
