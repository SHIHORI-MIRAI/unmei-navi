/**
 * ラッキー情報・月齢の計算
 *
 * 多言語対応: calcLuckyInfo に lang を渡すと色名・方位・月相名を各言語で返す。
 * 未指定なら日本語（既存挙動を維持）。値の判定は日本語表記を正とする。
 */

import type { Lang } from "@/lib/i18n/dict";

const COLORS = [
  { name: "赤", hex: "#e74c3c" },
  { name: "青", hex: "#3498db" },
  { name: "緑", hex: "#2ecc71" },
  { name: "黄", hex: "#f1c40f" },
  { name: "紫", hex: "#9b59b6" },
  { name: "オレンジ", hex: "#e67e22" },
  { name: "ピンク", hex: "#e91e8e" },
  { name: "白", hex: "#ecf0f1" },
  { name: "金", hex: "#d4a843" },
];

const DIRECTIONS = [
  "北", "北東", "東", "南東", "南", "南西", "西", "北西",
];

/** 日付ベースのシード（簡易ハッシュ） */
function dateSeed(date: Date, salt: number = 0): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return ((y * 367 + m * 31 + d * 13 + salt) * 2654435761) >>> 0;
}

export function getLuckyColor(date: Date, lifePathNumber: number) {
  const seed = dateSeed(date, lifePathNumber);
  const idx = seed % COLORS.length;
  return COLORS[idx];
}

export function getLuckyNumber(date: Date, lifePathNumber: number): number {
  const seed = dateSeed(date, lifePathNumber + 7);
  return (seed % 9) + 1;
}

export function getLuckyDirection(date: Date, lifePathNumber: number): string {
  const seed = dateSeed(date, lifePathNumber + 13);
  return DIRECTIONS[seed % DIRECTIONS.length];
}

/**
 * 月齢（ムーンエイジ）を計算する。
 * 簡易計算: 2000年1月6日の新月を基準に、29.53059日周期で計算。
 */
export function calcMoonAge(date: Date): number {
  const ref = new Date(2000, 0, 6); // 2000/1/6 = 新月
  const diffMs = date.getTime() - ref.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const moonCycle = 29.53059;
  const age = ((diffDays % moonCycle) + moonCycle) % moonCycle;
  return Math.round(age * 10) / 10;
}

export function getMoonPhaseName(moonAge: number): string {
  if (moonAge < 1.8) return "新月";
  if (moonAge < 7.4) return "三日月（上弦へ向かう）";
  if (moonAge < 9.2) return "上弦の月";
  if (moonAge < 14.8) return "十三夜（満月へ向かう）";
  if (moonAge < 16.6) return "満月";
  if (moonAge < 22.1) return "寝待月（下弦へ向かう）";
  if (moonAge < 23.9) return "下弦の月";
  return "晦日月（新月へ向かう）";
}

export function getMoonPhaseEmoji(moonAge: number): string {
  if (moonAge < 1.8) return "🌑";
  if (moonAge < 7.4) return "🌒";
  if (moonAge < 9.2) return "🌓";
  if (moonAge < 14.8) return "🌔";
  if (moonAge < 16.6) return "🌕";
  if (moonAge < 22.1) return "🌖";
  if (moonAge < 23.9) return "🌗";
  return "🌘";
}

// --- 韓国語表記（日本語をキーに変換） ---
const colorNameKo: Record<string, string> = {
  赤: "빨강", 青: "파랑", 緑: "초록", 黄: "노랑", 紫: "보라",
  オレンジ: "주황", ピンク: "분홍", 白: "하양", 金: "금색",
};

const directionKo: Record<string, string> = {
  北: "북", 北東: "북동", 東: "동", 南東: "남동",
  南: "남", 南西: "남서", 西: "서", 北西: "북서",
};

const moonPhaseKo: Record<string, string> = {
  "新月": "신월(삭)",
  "三日月（上弦へ向かう）": "초승달(상현으로)",
  "上弦の月": "상현달",
  "十三夜（満月へ向かう）": "십삼야(보름으로)",
  "満月": "보름달",
  "寝待月（下弦へ向かう）": "하현으로 가는 달",
  "下弦の月": "하현달",
  "晦日月（新月へ向かう）": "그믐달(삭으로)",
};

export interface LuckyInfo {
  color: { name: string; hex: string };
  number: number;
  direction: string;
  moonAge: number;
  moonPhase: string;
  moonEmoji: string;
}

export function calcLuckyInfo(
  date: Date,
  lifePathNumber: number,
  lang: Lang = "ja"
): LuckyInfo {
  const moonAge = calcMoonAge(date);
  const color = getLuckyColor(date, lifePathNumber);
  const direction = getLuckyDirection(date, lifePathNumber);
  const moonPhase = getMoonPhaseName(moonAge);
  const isKo = lang === "ko";
  return {
    color: isKo
      ? { name: colorNameKo[color.name] ?? color.name, hex: color.hex }
      : color,
    number: getLuckyNumber(date, lifePathNumber),
    direction: isKo ? directionKo[direction] ?? direction : direction,
    moonAge,
    moonPhase: isKo ? moonPhaseKo[moonPhase] ?? moonPhase : moonPhase,
    moonEmoji: getMoonPhaseEmoji(moonAge),
  };
}
