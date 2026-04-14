/**
 * ラッキー情報・月齢の計算
 */

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

export interface LuckyInfo {
  color: { name: string; hex: string };
  number: number;
  direction: string;
  moonAge: number;
  moonPhase: string;
  moonEmoji: string;
}

export function calcLuckyInfo(date: Date, lifePathNumber: number): LuckyInfo {
  const moonAge = calcMoonAge(date);
  return {
    color: getLuckyColor(date, lifePathNumber),
    number: getLuckyNumber(date, lifePathNumber),
    direction: getLuckyDirection(date, lifePathNumber),
    moonAge,
    moonPhase: getMoonPhaseName(moonAge),
    moonEmoji: getMoonPhaseEmoji(moonAge),
  };
}
