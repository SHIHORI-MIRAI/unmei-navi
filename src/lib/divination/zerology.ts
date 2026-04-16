/**
 * 0学（ゼロがく）計算エンジン
 *
 * 正式な0学の計算方法:
 * 1. 生年月日から「星数」を算出（年×月の交差数 - 1 + 日、60超は60を引く）
 * 2. 星数の範囲（1-10, 11-20, ...）× 生まれ年の奇偶で12の支配星を決定
 * 3. 12年周期の運命期を算出
 */

// --- うるう年判定 ---
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// --- 1月1日の基本数を算出 ---
// 基準: 1980年1月 = 10（運命数早見表より）
// 各年の増分: 平年 +5（365 mod 60）、うるう年 +6（366 mod 60）
function getJan1Base(year: number): number {
  const REF_YEAR = 1980;
  const REF_BASE = 10;
  let base = REF_BASE;

  if (year >= REF_YEAR) {
    for (let y = REF_YEAR; y < year; y++) {
      base += isLeapYear(y) ? 6 : 5;
    }
  } else {
    for (let y = year; y < REF_YEAR; y++) {
      base -= isLeapYear(y) ? 6 : 5;
    }
  }

  return ((base % 60) + 60) % 60 || 60;
}

// --- 年内の通算日を算出 ---
function getDayOfYear(year: number, month: number, day: number): number {
  const daysInMonth = [
    31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31,
  ];
  let total = 0;
  for (let m = 0; m < month - 1; m++) {
    total += daysInMonth[m];
  }
  return total + day;
}

/**
 * 星数を算出する（1〜60）
 * 計算: 1月基本数 - 1 + 通算日、60超は60を引く
 */
function calcStarNumber(birthDate: string): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  const jan1Base = getJan1Base(y);
  const dayOfYear = getDayOfYear(y, m, d);
  let starNumber = (jan1Base - 1 + dayOfYear) % 60;
  if (starNumber === 0) starNumber = 60;
  return starNumber;
}

// --- 12の支配星（星数の範囲 × 奇偶年で決定）---
// 偶数年 = 陰、奇数年 = 陽
const STAR_RANGES: {
  range: [number, number];
  even: { name: string; type: string; personality: string; strength: string };
  odd: { name: string; type: string; personality: string; strength: string };
}[] = [
  {
    range: [1, 10],
    even: {
      name: "土星",
      type: "陰の星",
      personality: "堅実で責任感が強い。コツコツと積み上げる努力家。慎重な判断力を持つ",
      strength: "堅実さ・責任感・忍耐力",
    },
    odd: {
      name: "天王星",
      type: "陽の星",
      personality: "自由を愛し独創的。常識にとらわれない革新的な発想の持ち主",
      strength: "独創性・革新力・自由",
    },
  },
  {
    range: [11, 20],
    even: {
      name: "金星",
      type: "陰の星",
      personality: "華やかで社交的。美的センスと人を惹きつける魅力がある",
      strength: "魅力・社交性・美的センス",
    },
    odd: {
      name: "小王星",
      type: "陽の星",
      personality: "バランス感覚に優れ、調整役として活躍できる。穏やかで安定感がある",
      strength: "調和力・安定感・バランス",
    },
  },
  {
    range: [21, 30],
    even: {
      name: "火星",
      type: "陰の星",
      personality: "情熱的で行動力がある。チャレンジ精神旺盛で負けず嫌い",
      strength: "行動力・情熱・競争心",
    },
    odd: {
      name: "冥王星",
      type: "陽の星",
      personality: "カリスマ性があり、底知れないパワーを持つ。変革を起こす力がある",
      strength: "カリスマ性・変革力・再生力",
    },
  },
  {
    range: [31, 40],
    even: {
      name: "月王星",
      type: "陰の星",
      personality: "繊細で優しく、周囲を癒す力を持つ。感情豊かで母性的",
      strength: "癒し・優しさ・母性",
    },
    odd: {
      name: "魚王星",
      type: "陽の星",
      personality: "直感力が鋭く、人の気持ちを察する能力に優れている。献身的な性格",
      strength: "直感力・共感力・献身性",
    },
  },
  {
    range: [41, 50],
    even: {
      name: "木星",
      type: "陰の星",
      personality: "楽天的で器が大きい。人望があり、リーダーシップを発揮する",
      strength: "包容力・楽観性・統率力",
    },
    odd: {
      name: "海王星",
      type: "陽の星",
      personality: "感受性が豊かでロマンチスト。想像力と芸術的センスに恵まれている",
      strength: "感性・創造力・芸術性",
    },
  },
  {
    range: [51, 60],
    even: {
      name: "水星",
      type: "陰の星",
      personality: "知的好奇心旺盛で頭の回転が速い。情報収集力と分析力に優れている",
      strength: "知性・分析力・コミュニケーション",
    },
    odd: {
      name: "氷王星",
      type: "陽の星",
      personality: "冷静沈着で判断力に優れる。独自の美学と高い精神性を持つ",
      strength: "冷静さ・審美眼・精神力",
    },
  },
];

/**
 * 支配星を算出する
 */
function getRulingStar(birthDate: string) {
  const year = parseInt(birthDate.split("-")[0], 10);
  const starNumber = calcStarNumber(birthDate);
  const isOddYear = year % 2 === 1;

  for (const entry of STAR_RANGES) {
    const [min, max] = entry.range;
    if (starNumber >= min && starNumber <= max) {
      return isOddYear ? entry.odd : entry.even;
    }
  }
  // fallback（到達しない）
  return isOddYear ? STAR_RANGES[0].odd : STAR_RANGES[0].even;
}

// --- 12年サイクルの運命期 ---
const destinyPhases = [
  { name: "精算期", energy: 25, theme: "整理と準備の時期", advice: "これまでの棚卸しをして、次のサイクルに備えましょう", caution: "無理に新しいことを始めるより、整理に集中を" },
  { name: "開拓期", energy: 55, theme: "新しい始まりの時期", advice: "新しいことに挑戦するのに良い時期。小さく始めて", caution: "大きすぎる計画は控えめに。まず一歩を" },
  { name: "生長期", energy: 70, theme: "成長と拡大の時期", advice: "勢いに乗って積極的に。学びと経験を重ねましょう", caution: "調子に乗りすぎないよう、基本を大切に" },
  { name: "決定期", energy: 85, theme: "決断と確立の時期", advice: "重要な決断のとき。自分の進む道を定めましょう", caution: "迷いがあるなら信頼できる人に相談を" },
  { name: "健康期", energy: 75, theme: "心身を整える時期", advice: "健康と生活基盤を見直す好機。ケアを怠りなく", caution: "体調の変化に敏感に。無理は禁物" },
  { name: "人気期", energy: 90, theme: "人脈と評価の時期", advice: "周囲からの評価が高まる時期。人間関係を広げて", caution: "人気に溺れず、謙虚さを忘れずに" },
  { name: "浮気期", energy: 60, theme: "気持ちが揺れる時期", advice: "新しい関心が生まれる時期。好奇心を大切にしつつ慎重に", caution: "目移りしやすい時期。本当に大切なものを見極めて" },
  { name: "財成期", energy: 80, theme: "経済的充実の時期", advice: "経済面で好調な時期。投資や事業拡大に良い", caution: "浪費に注意。収入が増えても堅実に" },
  { name: "安定期", energy: 70, theme: "安定と充実の時期", advice: "穏やかに過ごせる時期。今あるものに感謝して深めましょう", caution: "マンネリに注意。小さな変化を楽しんで" },
  { name: "頂上期", energy: 95, theme: "最高潮の時期", advice: "運気が最高の時期！大きな挑戦や目標達成に最適", caution: "ピークの後は下り坂。次に備える意識も" },
  { name: "減退期", energy: 45, theme: "エネルギーを蓄える時期", advice: "無理をせず、充電とメンテナンスの時期です", caution: "焦らない。この時期の休息が次の飛躍の力になる" },
  { name: "停止期", energy: 20, theme: "立ち止まる時期", advice: "じっくりと自分を見つめ直す大切な期間。内面の成長に集中", caution: "大きな新規行動は控えて。準備と計画に徹しましょう" },
];

/** 現在の運命期のインデックスを計算 */
export function calcDestinyPhaseIndex(birthDate: string, year: number): number {
  const birthYear = parseInt(birthDate.split("-")[0], 10);
  const diff = year - birthYear;
  const starNumber = calcStarNumber(birthDate);
  // 星数の範囲インデックス（0-5）をオフセットに使用
  const rangeIndex = Math.floor((starNumber - 1) / 10);
  return (((diff + rangeIndex) % 12) + 12) % 12;
}

export interface ZerologyResult {
  rulingStar: {
    name: string;
    type: string;
    personality: string;
    strength: string;
  };
  currentPhase: {
    name: string;
    energy: number;
    theme: string;
    advice: string;
    caution: string;
  };
  currentPhaseIndex: number;
}

export function calcZerology(birthDate: string, year: number = new Date().getFullYear()): ZerologyResult {
  const star = getRulingStar(birthDate);
  const phaseIdx = calcDestinyPhaseIndex(birthDate, year);

  return {
    rulingStar: star,
    currentPhase: destinyPhases[phaseIdx],
    currentPhaseIndex: phaseIdx,
  };
}

/** グラフ用: 指定年の運勢エネルギー値を返す */
export function getZerologyWave(birthDate: string, year: number): number {
  const phaseIdx = calcDestinyPhaseIndex(birthDate, year);
  return destinyPhases[phaseIdx].energy;
}

/** グラフ用: 指定年の運命期名を返す */
export function getZerologyPhaseName(birthDate: string, year: number): string {
  const phaseIdx = calcDestinyPhaseIndex(birthDate, year);
  return destinyPhases[phaseIdx].name;
}
