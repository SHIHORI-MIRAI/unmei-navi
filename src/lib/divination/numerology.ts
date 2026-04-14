/**
 * 数秘術（Numerology）計算エンジン
 *
 * 生年月日からライフパスナンバー、バースデーナンバー、
 * 個人年（パーソナルイヤー）などを算出する。
 */

/** 数字をマスターナンバー（11,22,33）を考慮しつつ一桁に還元 */
function reduceToSingle(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n)
      .split("")
      .reduce((sum, d) => sum + Number(d), 0);
  }
  return n;
}

/** ライフパスナンバー: 生年月日の全桁を合計して一桁に還元 */
export function calcLifePathNumber(birthDate: string): number {
  const digits = birthDate.replace(/-/g, "");
  const sum = digits.split("").reduce((s, d) => s + Number(d), 0);
  return reduceToSingle(sum);
}

/** バースデーナンバー: 生まれた日を一桁に還元 */
export function calcBirthdayNumber(birthDate: string): number {
  const day = parseInt(birthDate.split("-")[2], 10);
  return reduceToSingle(day);
}

/** パーソナルイヤーナンバー: 生まれの月日 + 対象年 */
export function calcPersonalYear(birthDate: string, year: number): number {
  const [, m, d] = birthDate.split("-");
  const sum =
    String(year)
      .split("")
      .reduce((s, c) => s + Number(c), 0) +
    m.split("").reduce((s, c) => s + Number(c), 0) +
    d.split("").reduce((s, c) => s + Number(c), 0);
  return reduceToSingle(sum);
}

/** パーソナルマンスナンバー */
export function calcPersonalMonth(
  birthDate: string,
  year: number,
  month: number
): number {
  const py = calcPersonalYear(birthDate, year);
  const sum = py + reduceToSingle(month);
  return reduceToSingle(sum);
}

/** パーソナルデイナンバー */
export function calcPersonalDay(
  birthDate: string,
  year: number,
  month: number,
  day: number
): number {
  const pm = calcPersonalMonth(birthDate, year, month);
  const sum = pm + reduceToSingle(day);
  return reduceToSingle(sum);
}

// --- 解釈テキスト ---

const lifePathMeanings: Record<number, { title: string; strength: string; theme: string }> = {
  1: { title: "リーダー", strength: "開拓力・独立心・決断力", theme: "自分の道を切り開く" },
  2: { title: "調和者", strength: "共感力・協調性・繊細さ", theme: "人との調和を通じて輝く" },
  3: { title: "表現者", strength: "創造力・コミュニケーション・楽観性", theme: "自己表現を通じて喜びを広げる" },
  4: { title: "建設者", strength: "堅実さ・忍耐力・組織力", theme: "着実に土台を築く" },
  5: { title: "冒険家", strength: "自由・適応力・好奇心", theme: "変化を通じて成長する" },
  6: { title: "奉仕者", strength: "愛情・責任感・美的センス", theme: "愛と調和で人を支える" },
  7: { title: "探求者", strength: "分析力・直感力・精神性", theme: "真理を探究する" },
  8: { title: "達成者", strength: "実行力・経営力・豊かさ", theme: "物質と精神の豊かさを実現する" },
  9: { title: "完成者", strength: "包容力・理想主義・博愛", theme: "広い視野で世界に貢献する" },
  11: { title: "インスピレーター", strength: "霊感・直感・啓示力", theme: "高い理想で人を導く" },
  22: { title: "マスタービルダー", strength: "大きなビジョン・実現力・影響力", theme: "壮大な夢を形にする" },
  33: { title: "マスターヒーラー", strength: "無条件の愛・癒し・慈悲", theme: "深い愛で人類に奉仕する" },
};

const personalYearMeanings: Record<number, { theme: string; advice: string; caution: string }> = {
  1: { theme: "始まりの年", advice: "新しいことを始めるベストタイミング。種をまく年です", caution: "焦りすぎず、一歩ずつ進みましょう" },
  2: { theme: "忍耐と協力の年", advice: "人間関係を大切にし、じっくり育てる年です", caution: "結果を急がず、信頼関係を築きましょう" },
  3: { theme: "表現と創造の年", advice: "自分を表現し、楽しむことで運が開けます", caution: "エネルギーの分散に注意。焦点を絞って" },
  4: { theme: "土台づくりの年", advice: "基盤を固め、計画的に行動すると◎", caution: "無理をしすぎないよう、健康管理も大切に" },
  5: { theme: "変化と自由の年", advice: "新しい体験・出会いに積極的に飛び込んで", caution: "衝動的な決断は控え、変化を楽しむ余裕を" },
  6: { theme: "愛と責任の年", advice: "家庭や大切な人との関係が深まる年です", caution: "自分を犠牲にしすぎないよう、自分も大切に" },
  7: { theme: "内省と学びの年", advice: "自分と向き合い、知識を深めると大きな成長に", caution: "孤立しすぎず、信頼できる人と繋がりを" },
  8: { theme: "実りと達成の年", advice: "これまでの努力が形になるとき。大きく動いて◎", caution: "お金の管理をしっかりと。投資は慎重に" },
  9: { theme: "完成と手放しの年", advice: "不要なものを手放し、次のサイクルに備えて", caution: "過去にしがみつかず、感謝して卒業しましょう" },
  11: { theme: "霊的成長の年", advice: "直感に従い、スピリチュアルな学びを深めて", caution: "地に足をつけて、夢と現実のバランスを" },
  22: { theme: "大きな実現の年", advice: "大きなビジョンを形にできるとき。仲間を集めて", caution: "一人で抱えすぎず、周りの力を借りましょう" },
  33: { theme: "奉仕と癒しの年", advice: "周囲への深い愛と奉仕が自分にも返ってくる年", caution: "自分自身のケアも忘れずに" },
};

export function getLifePathMeaning(num: number) {
  return lifePathMeanings[num] || lifePathMeanings[reduceToSingle(num)] || lifePathMeanings[9];
}

export function getPersonalYearMeaning(num: number) {
  return personalYearMeanings[num] || personalYearMeanings[reduceToSingle(num)] || personalYearMeanings[1];
}

/** 年運の波（グラフ用）: 1-9のサイクルで高低を返す */
export function getYearWave(personalYear: number): number {
  const waveMap: Record<number, number> = {
    1: 60, 2: 40, 3: 70, 4: 50, 5: 80, 6: 65, 7: 45, 8: 90, 9: 55,
    11: 85, 22: 95, 33: 75,
  };
  return waveMap[personalYear] ?? 50;
}

export interface NumerologyResult {
  lifePathNumber: number;
  lifePathMeaning: { title: string; strength: string; theme: string };
  birthdayNumber: number;
  personalYear: number;
  personalYearMeaning: { theme: string; advice: string; caution: string };
  personalMonth: number;
  personalDay: number;
}

export function calcNumerology(birthDate: string, today: Date = new Date()): NumerologyResult {
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const lifePathNumber = calcLifePathNumber(birthDate);
  const personalYear = calcPersonalYear(birthDate, year);

  return {
    lifePathNumber,
    lifePathMeaning: getLifePathMeaning(lifePathNumber),
    birthdayNumber: calcBirthdayNumber(birthDate),
    personalYear,
    personalYearMeaning: getPersonalYearMeaning(personalYear),
    personalMonth: calcPersonalMonth(birthDate, year, month),
    personalDay: calcPersonalDay(birthDate, year, month, day),
  };
}
