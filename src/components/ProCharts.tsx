"use client";

/**
 * ProCharts — 有料版トリセツ（/manual/pro）の本文に差し込む図版。
 *
 * 方針:
 * - ライブラリを使わず素のSVG。印刷・PDF化で崩れないため。
 * - 1つの図につき色は1色だけ。項目名はラベル、量は数値でも書くので、
 *   色が読めなくても（白黒印刷・色覚特性）内容が伝わる。
 *   ※ 五行を伝統色で塗り分ける案は、赤(火)・茶(土)・金(金)が
 *     色覚特性のある方には区別できず検証で不合格だったため採用していない。
 * - 図はAIではなく計算結果そのもの。文章と数字が食い違わない。
 */

import { useMemo } from "react";
import { calcFourPillars, calcSanmeigaku, getLifePeriod } from "@/lib/divination";
import type { Lang } from "@/lib/i18n/dict";

/** 図版のマーク色。白背景に対しコントラスト比3:1以上を検証済み */
const MARK = "#d0740a";
/** 補助的なマーク（比較対象・過去など）。輪郭とラベルで識別する */
const MARK_MUTED = "#ecdcc6";
const GRID = "#f0d9b5";
const INK = "#3a2a1a";
const INK_MUTED = "#9a8a7a";

const L: Record<Lang, Record<string, string>> = {
  ja: {
    elemTitle: "五行のバランス",
    elemUnit: "命式に含まれる数",
    elemFavor: "補うと整う気",
    subTitle: "生命エネルギーの配分",
    subUnit: "十二大従星（最大12）",
    subHead: "頭",
    subChest: "胸",
    subBelly: "腹",
    taiunTitle: "大運 — 10年ごとの運気の流れ",
    taiunNow: "いま",
    taiunAge: "歳",
    waveTitle: "運気の波",
    waveUnit: "数秘の年運（100が最大）",
    waveYear: "年",
    waveNow: "今年",
  },
  ko: {
    elemTitle: "오행의 균형",
    elemUnit: "명식에 포함된 수",
    elemFavor: "보완하면 좋은 기운",
    subTitle: "생명 에너지의 배분",
    subUnit: "십이대종성 (최대 12)",
    subHead: "머리",
    subChest: "가슴",
    subBelly: "배",
    taiunTitle: "대운 — 10년마다의 운기 흐름",
    taiunNow: "지금",
    taiunAge: "세",
    waveTitle: "운기의 파도",
    waveUnit: "수비학의 연운 (100이 최대)",
    waveYear: "년",
    waveNow: "올해",
  },
};

/** 右端だけ角丸のバー。棒の始点は必ず基線に接する */
function barPath(x: number, y: number, w: number, h: number, r = 4): string {
  if (w <= 0.5) return `M${x},${y} h0.5 v${h} h-0.5 Z`;
  const rr = Math.min(r, w, h / 2);
  return `M${x},${y} H${x + w - rr} A${rr},${rr} 0 0 1 ${x + w},${y + rr} V${
    y + h - rr
  } A${rr},${rr} 0 0 1 ${x + w - rr},${y + h} H${x} Z`;
}

function Figure({
  title,
  unit,
  children,
  height,
}: {
  title: string;
  unit: string;
  children: React.ReactNode;
  height: number;
}) {
  return (
    <figure className="pro-figure my-3 bg-white/70 border border-card-border rounded-xl px-3 py-3">
      <figcaption className="mb-1.5">
        <span className="text-[11px] font-bold text-foreground">{title}</span>
        <span className="text-[10px] text-muted ml-1.5">{unit}</span>
      </figcaption>
      <svg
        viewBox={`0 0 320 ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={`${title}（${unit}）`}
      >
        {children}
      </svg>
    </figure>
  );
}

// --- 1. 五行バランス（第2章） ---

const ELEMENTS = ["木", "火", "土", "金", "水"] as const;

function ElementBalance({ birthDate, birthTime, lang }: ChartProps) {
  const s = L[lang];
  const four = useMemo(
    () => calcFourPillars(birthDate, birthTime || undefined),
    [birthDate, birthTime]
  );

  const values = ELEMENTS.map((e) => four.fiveElements[e]);
  const max = Math.max(...values, 1);
  const favor = four.favorableElement.element;

  const rowH = 18;
  const gap = 8;
  const x0 = 26;
  const xMax = 268;
  const height = ELEMENTS.length * (rowH + gap) + 14;

  return (
    <Figure title={s.elemTitle} unit={s.elemUnit} height={height}>
      {ELEMENTS.map((el, i) => {
        const y = i * (rowH + gap) + 2;
        const v = values[i];
        const w = (v / max) * (xMax - x0);
        const isFavor = el === favor;
        return (
          <g key={el}>
            <title>{`${el}：${v}`}</title>
            <text x={0} y={y + 13} fontSize="12" fill={INK} fontWeight={isFavor ? 700 : 400}>
              {el}
            </text>
            <line x1={x0} y1={y + rowH} x2={xMax} y2={y + rowH} stroke={GRID} strokeWidth="1" />
            <path d={barPath(x0, y + 2, w, rowH - 2)} fill={MARK} />
            <text x={x0 + w + 6} y={y + 13} fontSize="11" fill={INK} fontWeight="700">
              {v}
            </text>
            {isFavor && (
              <text x={xMax + 4} y={y + 13} fontSize="8" fill={INK_MUTED} textAnchor="end">
                ★
              </text>
            )}
          </g>
        );
      })}
      <text x={0} y={height - 1} fontSize="9" fill={INK_MUTED}>
        ★ {s.elemFavor}：{favor}
      </text>
    </Figure>
  );
}

// --- 2. 十二大従星のエネルギー配分（第4章） ---

function SubStarEnergy({ birthDate, lang }: ChartProps) {
  const s = L[lang];
  const san = useMemo(() => calcSanmeigaku(birthDate), [birthDate]);

  const rows = [
    { label: s.subHead, star: san.subStars.head },
    { label: s.subChest, star: san.subStars.chest },
    { label: s.subBelly, star: san.subStars.belly },
  ];

  const rowH = 18;
  const gap = 14;
  const x0 = 30;
  const xMax = 210; // 星の名前を右に置くぶん短くする
  const height = rows.length * (rowH + gap) + 4;

  return (
    <Figure title={s.subTitle} unit={s.subUnit} height={height}>
      {rows.map((r, i) => {
        const y = i * (rowH + gap) + 2;
        const w = (r.star.energy / 12) * (xMax - x0);
        return (
          <g key={r.label}>
            <title>{`${r.label}：${r.star.name}（${r.star.energy}）`}</title>
            <text x={0} y={y + 13} fontSize="12" fill={INK}>
              {r.label}
            </text>
            <line x1={x0} y1={y + rowH} x2={xMax} y2={y + rowH} stroke={GRID} strokeWidth="1" />
            <path d={barPath(x0, y + 2, w, rowH - 2)} fill={MARK} />
            <text x={x0 + w + 6} y={y + 13} fontSize="11" fill={INK} fontWeight="700">
              {r.star.energy}
            </text>
            <text x={xMax + 26} y={y + 13} fontSize="10" fill={INK_MUTED}>
              {r.star.name}
            </text>
          </g>
        );
      })}
    </Figure>
  );
}

// --- 3. 大運タイムライン（第18章） ---

function TaiUnTimeline({ birthDate, birthTime, lang }: ChartProps) {
  const s = L[lang];
  const four = useMemo(
    () => calcFourPillars(birthDate, birthTime || undefined),
    [birthDate, birthTime]
  );

  const age = useMemo(() => {
    const [y, m, d] = birthDate.split("-").map(Number);
    const now = new Date();
    let a = now.getFullYear() - y;
    if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) a--;
    return a;
  }, [birthDate]);

  const periods = four.taiUn.slice(0, 8);
  if (periods.length === 0) return null;

  const currentIdx = periods.reduce(
    (found, p, i) => (age >= p.startAge ? i : found),
    -1
  );

  const bandY = 16;
  const bandH = 26;
  const segW = 320 / periods.length;
  const height = 78;

  return (
    <Figure title={s.taiunTitle} unit="" height={height}>
      {periods.map((p, i) => {
        const x = i * segW;
        const isNow = i === currentIdx;
        return (
          <g key={p.startAge}>
            <title>{`${p.startAge}${s.taiunAge}〜：${p.stem}${p.branch}（${p.element}）${p.theme}`}</title>
            {/* 隣り合う帯のあいだに2pxの隙間をつくり、境目を目で追えるようにする */}
            <rect
              x={x + 1}
              y={bandY}
              width={segW - 2}
              height={bandH}
              rx={3}
              fill={isNow ? MARK : MARK_MUTED}
            />
            <text
              x={x + segW / 2}
              y={bandY + 18}
              fontSize="13"
              textAnchor="middle"
              fill={isNow ? "#ffffff" : INK}
            >
              {p.element}
            </text>
            <text x={x + 1} y={bandY - 4} fontSize="9" fill={INK_MUTED}>
              {p.startAge}
            </text>
            {isNow && (
              <text
                x={x + segW / 2}
                y={bandY + bandH + 12}
                fontSize="9"
                textAnchor="middle"
                fill={MARK}
                fontWeight="700"
              >
                ▲ {s.taiunNow}
              </text>
            )}
          </g>
        );
      })}
      {currentIdx >= 0 && (
        <text x={0} y={height - 2} fontSize="9" fill={INK_MUTED}>
          {periods[currentIdx].startAge}
          {s.taiunAge}〜：{periods[currentIdx].theme}
        </text>
      )}
    </Figure>
  );
}

// --- 4. 運気の波（第19章） ---

function FortuneWave({ birthDate, lang }: ChartProps) {
  const s = L[lang];
  const thisYear = new Date().getFullYear();

  const points = useMemo(
    () =>
      [-1, 0, 1, 2, 3].map((offset) => {
        const year = thisYear + offset;
        const p = getLifePeriod(birthDate, year);
        return { year, energy: p.energy, isNow: offset === 0 };
      }),
    [birthDate, thisYear]
  );

  const x0 = 22;
  const xMax = 300;
  const yTop = 16;
  const yBottom = 68;
  const height = 92;

  const px = (i: number) => x0 + (i / (points.length - 1)) * (xMax - x0);
  const py = (e: number) => yBottom - (e / 100) * (yBottom - yTop);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(p.energy)}`).join(" ");

  return (
    <Figure title={s.waveTitle} unit={s.waveUnit} height={height}>
      {/* 目盛りは背景に退かせる */}
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={x0} y1={py(v)} x2={xMax} y2={py(v)} stroke={GRID} strokeWidth="1" />
          <text x={0} y={py(v) + 3} fontSize="8" fill={INK_MUTED}>
            {v}
          </text>
        </g>
      ))}
      <path d={line} fill="none" stroke={MARK} strokeWidth="2" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={p.year}>
          <title>{`${p.year}${s.waveYear}：${p.energy}`}</title>
          {/* 重なりを避けるため、点は背景色の輪郭で縁取る */}
          <circle
            cx={px(i)}
            cy={py(p.energy)}
            r={p.isNow ? 5.5 : 4}
            fill={p.isNow ? MARK : "#ffffff"}
            stroke={MARK}
            strokeWidth="2"
          />
          <text
            x={px(i)}
            y={py(p.energy) - 10}
            fontSize="10"
            textAnchor="middle"
            fill={INK}
            fontWeight={p.isNow ? 700 : 400}
          >
            {p.energy}
          </text>
          <text
            x={px(i)}
            y={height - 10}
            fontSize="9"
            textAnchor="middle"
            fill={p.isNow ? INK : INK_MUTED}
            fontWeight={p.isNow ? 700 : 400}
          >
            {p.year}
          </text>
          {p.isNow && (
            <text x={px(i)} y={height - 1} fontSize="8" textAnchor="middle" fill={MARK}>
              {s.waveNow}
            </text>
          )}
        </g>
      ))}
    </Figure>
  );
}

// --- 章番号 → 図版の振り分け ---

interface ChartProps {
  birthDate: string;
  birthTime: string;
  lang: Lang;
}

/** その章に対応する図版があれば描く。無ければ何も描かない。 */
export default function ChapterChart({
  no,
  birthDate,
  birthTime,
  lang,
}: ChartProps & { no: number }) {
  if (!birthDate) return null;
  const props = { birthDate, birthTime, lang };

  switch (no) {
    case 2:
      return <ElementBalance {...props} />;
    case 4:
      return <SubStarEnergy {...props} />;
    case 18:
      return <TaiUnTimeline {...props} />;
    case 19:
      return <FortuneWave {...props} />;
    default:
      return null;
  }
}
