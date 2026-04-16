/**
 * 九星気学 計算エンジン
 *
 * 生年月日から本命星・月命星を算出し、
 * 年盤での位置から運勢・吉方位を計算する。
 */

// --- 九星の定義 ---
const NINE_STARS = [
  { number: 1, name: "一白水星", element: "水", direction: "北", color: "白", personality: "柔軟で適応力が高い。知性と包容力を持ち、周囲を潤す存在", strength: "適応力・知性・包容力" },
  { number: 2, name: "二黒土星", element: "土", direction: "南西", color: "黒", personality: "母のような温かさと忍耐力を持つ。コツコツと地道な努力ができる", strength: "忍耐力・堅実さ・奉仕" },
  { number: 3, name: "三碧木星", element: "木", direction: "東", color: "碧", personality: "若々しいエネルギーに溢れる。行動力があり、新しいことに積極的", strength: "行動力・発展力・若さ" },
  { number: 4, name: "四緑木星", element: "木", direction: "南東", color: "緑", personality: "穏やかで調和を大切にする。人脈を築く力に優れ、信頼を集める", strength: "調和力・人脈・信頼" },
  { number: 5, name: "五黄土星", element: "土", direction: "中央", color: "黄", personality: "強い意志とカリスマ性の持ち主。帝王の星と呼ばれ、周囲を動かす力がある", strength: "カリスマ性・統率力・意志力" },
  { number: 6, name: "六白金星", element: "金", direction: "北西", color: "白", personality: "品格があり、リーダーシップに優れる。天からの恵みを受けやすい", strength: "品格・リーダーシップ・直感" },
  { number: 7, name: "七赤金星", element: "金", direction: "西", color: "赤", personality: "社交的で楽しいことが好き。会話上手で人を惹きつける魅力がある", strength: "社交性・話術・魅力" },
  { number: 8, name: "八白土星", element: "土", direction: "北東", color: "白", personality: "山のような安定感と変革の力を持つ。粘り強く目標を達成する", strength: "安定感・変革力・粘り強さ" },
  { number: 9, name: "九紫火星", element: "火", direction: "南", color: "紫", personality: "華やかで知的。美的センスと情熱を持ち、頂点を目指す", strength: "知性・美的センス・情熱" },
] as const;

// --- 節入り日（各月の開始日、概算） ---
// 九星気学の月は旧暦の節入りで切り替わる
const SETSUIRI_DAYS = [
  { month: 1, startMonth: 1, startDay: 6 },   // 小寒 1/6頃 〜 2/3頃
  { month: 2, startMonth: 2, startDay: 4 },   // 立春 2/4頃 〜 3/5頃
  { month: 3, startMonth: 3, startDay: 6 },   // 啓蟄 3/6頃 〜 4/4頃
  { month: 4, startMonth: 4, startDay: 5 },   // 清明 4/5頃 〜 5/5頃
  { month: 5, startMonth: 5, startDay: 6 },   // 立夏 5/6頃 〜 6/5頃
  { month: 6, startMonth: 6, startDay: 6 },   // 芒種 6/6頃 〜 7/6頃
  { month: 7, startMonth: 7, startDay: 7 },   // 小暑 7/7頃 〜 8/7頃
  { month: 8, startMonth: 8, startDay: 8 },   // 立秋 8/8頃 〜 9/7頃
  { month: 9, startMonth: 9, startDay: 8 },   // 白露 9/8頃 〜 10/7頃
  { month: 10, startMonth: 10, startDay: 8 }, // 寒露 10/8頃 〜 11/6頃
  { month: 11, startMonth: 11, startDay: 7 }, // 立冬 11/7頃 〜 12/6頃
  { month: 12, startMonth: 12, startDay: 7 }, // 大雪 12/7頃 〜 翌1/5頃
];

/**
 * 西暦の日付から九星気学の「月」を返す（節入り考慮）
 */
function getKigakuMonth(calendarMonth: number, calendarDay: number): number {
  // 節入り日を逆順でチェックし、該当する月を返す
  for (let i = SETSUIRI_DAYS.length - 1; i >= 0; i--) {
    const s = SETSUIRI_DAYS[i];
    if (calendarMonth > s.startMonth || (calendarMonth === s.startMonth && calendarDay >= s.startDay)) {
      return s.month;
    }
  }
  // 1月1日〜1月5日は前年の12月扱い
  return 12;
}

/**
 * 西暦の日付から九星気学の「年」を返す（立春前は前年）
 */
function getKigakuYear(year: number, month: number, day: number): number {
  // 立春（2/4頃）より前は前年
  if (month < 2 || (month === 2 && day < 4)) {
    return year - 1;
  }
  return year;
}

/**
 * 本命星を算出（1〜9）
 * 計算: (11 - 年 % 9) % 9、0の場合は9
 */
export function calcHonmeisei(birthDate: string): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  const kigakuYear = getKigakuYear(y, m, d);
  const result = (11 - (kigakuYear % 9)) % 9;
  return result === 0 ? 9 : result;
}

/**
 * 月命星を算出（1〜9）
 * グループA（本命星1,4,7）: キー19
 * グループB（本命星2,5,8）: キー13
 * グループC（本命星3,6,9）: キー16
 */
export function calcGetsumeisei(birthDate: string): number {
  const [, m, d] = birthDate.split("-").map(Number);
  const honmei = calcHonmeisei(birthDate);
  const kigakuMonth = getKigakuMonth(m, d);

  // キーナンバーを決定
  let key: number;
  if ([1, 4, 7].includes(honmei)) {
    key = 19;
  } else if ([2, 5, 8].includes(honmei)) {
    key = 13;
  } else {
    key = 16;
  }

  // 1月生まれは13月として計算
  const calcMonth = kigakuMonth === 1 ? 13 : kigakuMonth;

  // |月 - キー| → 2桁なら各桁を足す
  let result = Math.abs(calcMonth - key);
  while (result >= 10) {
    result = String(result)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }

  return result === 0 ? 9 : result;
}

/**
 * 任意の年の年家九星（中宮の星）を算出
 */
export function calcYearStar(year: number): number {
  const result = (11 - (year % 9)) % 9;
  return result === 0 ? 9 : result;
}

/**
 * 任意の年月の月家九星（中宮の星）を算出
 */
export function calcMonthStar(year: number, month: number, day: number): number {
  const kigakuYear = getKigakuYear(year, month, day);
  const kigakuMonth = getKigakuMonth(month, day);
  const yearStar = calcYearStar(kigakuYear);

  let key: number;
  if ([1, 4, 7].includes(yearStar)) {
    key = 19;
  } else if ([2, 5, 8].includes(yearStar)) {
    key = 13;
  } else {
    key = 16;
  }

  const calcMonth = kigakuMonth === 1 ? 13 : kigakuMonth;
  let result = Math.abs(calcMonth - key);
  while (result >= 10) {
    result = String(result)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }

  return result === 0 ? 9 : result;
}

// --- 九星盤の飛泊パターン ---
// 中宮の星から各方位の星を算出
// 飛泊順: 中宮→北西→西→北東→南→北→南西→東→南東
const DIRECTIONS = ["中央", "北西", "西", "北東", "南", "北", "南西", "東", "南東"] as const;
type Direction = typeof DIRECTIONS[number];

/**
 * 中宮の星番号から九星盤を生成
 * 返値: 方位 → 星番号 のマップ
 */
function buildBoard(centerStar: number): Record<Direction, number> {
  const board: Partial<Record<Direction, number>> = {};
  for (let i = 0; i < 9; i++) {
    const star = ((centerStar - 1 + i) % 9) + 1;
    board[DIRECTIONS[i]] = star;
  }
  return board as Record<Direction, number>;
}

/**
 * 本命星が今年の年盤でどの位置にあるかを返す
 */
function getPositionInBoard(honmeisei: number, centerStar: number): { direction: Direction; positionIndex: number } {
  const offset = ((honmeisei - centerStar) % 9 + 9) % 9;
  return {
    direction: DIRECTIONS[offset],
    positionIndex: offset,
  };
}

// --- 九星盤の各位置での運勢 ---
const POSITION_FORTUNES: Record<Direction, { theme: string; energy: number; advice: string; caution: string }> = {
  "北": { theme: "忍耐と蓄積の時期", energy: 30, advice: "内面を見つめ直し、力を蓄える大切な期間です", caution: "大きな行動は控え、準備に徹しましょう" },
  "南西": { theme: "地道な努力の時期", energy: 45, advice: "コツコツと基盤を固める時。縁の下の力持ちとして活躍", caution: "目立たなくても焦らず、着実に進みましょう" },
  "東": { theme: "発展と活力の時期", energy: 70, advice: "新しいことを始めるのに良い時期。積極的に動いて", caution: "勢いに乗りすぎず、周囲への配慮も忘れずに" },
  "南東": { theme: "人間関係と整備の時期", energy: 75, advice: "人脈が広がり、良い縁に恵まれる時。信用を大切に", caution: "人の意見に流されすぎないよう、自分軸を保って" },
  "中央": { theme: "力がみなぎる時期", energy: 80, advice: "最もエネルギーが強い年。大きな決断にも向いています", caution: "強い力は両刃の剣。謙虚さと慎重さを忘れずに" },
  "北西": { theme: "天の恵みの時期", energy: 90, advice: "目上の人や天の助けを得やすい充実期。リーダーシップを発揮", caution: "好調でも感謝の気持ちを忘れずに" },
  "西": { theme: "収穫と喜びの時期", energy: 75, advice: "努力の成果が実り、楽しいことが増える時期", caution: "遊びすぎに注意。お金の使い方も計画的に" },
  "北東": { theme: "変化と転機の時期", energy: 55, advice: "変化が起こりやすい時。変化を恐れず新しい自分を受け入れて", caution: "急な変化に動揺しないよう、心の準備を" },
  "南": { theme: "頂点と注目の時期", energy: 85, advice: "注目を浴び、才能が輝く時。自己表現を存分に", caution: "目立つ分、批判も受けやすい。言動に注意" },
};

// --- 吉方位の算出 ---
// 五行の相生関係（生む側 → 生まれる側）
// 水→木→火→土→金→水
const ELEMENT_GENERATES: Record<string, string> = {
  "水": "木", "木": "火", "火": "土", "土": "金", "金": "水",
};
const ELEMENT_GENERATED_BY: Record<string, string> = {
  "木": "水", "火": "木", "土": "火", "金": "土", "水": "金",
};

/**
 * 吉方位を算出
 * 本命星と相生関係にある星がいる方位が吉方位
 * 五黄殺（五黄土星の方位）と暗剣殺（その対面）は凶方位
 */
function calcLuckyDirections(honmeisei: number, centerStar: number): { lucky: string[]; unlucky: string[] } {
  const board = buildBoard(centerStar);
  const myElement = NINE_STARS[honmeisei - 1].element;

  // 相生関係の元素を持つ星が吉
  const generatesElement = ELEMENT_GENERATES[myElement]; // 自分が生む
  const generatedByElement = ELEMENT_GENERATED_BY[myElement]; // 自分を生む

  const lucky: string[] = [];
  const unlucky: string[] = [];

  // 五黄土星の方位 = 五黄殺
  let goouDirection: Direction | null = null;
  for (const [dir, star] of Object.entries(board)) {
    if (star === 5 && dir !== "中央") {
      goouDirection = dir as Direction;
    }
  }

  // 対面の方位マップ
  const opposite: Record<string, string> = {
    "北": "南", "南": "北", "東": "西", "西": "東",
    "北東": "南西", "南西": "北東", "北西": "南東", "南東": "北西",
  };

  const unluckyDirs = new Set<string>();
  if (goouDirection) {
    unluckyDirs.add(goouDirection);
    if (opposite[goouDirection]) unluckyDirs.add(opposite[goouDirection]);
  }

  // 本命殺（自分の星がいる方位）と的殺（その対面）
  for (const [dir, star] of Object.entries(board)) {
    if (star === honmeisei && dir !== "中央") {
      unluckyDirs.add(dir);
      if (opposite[dir]) unluckyDirs.add(opposite[dir]);
    }
  }

  for (const [dir, star] of Object.entries(board)) {
    if (dir === "中央") continue;
    const starElement = NINE_STARS[star - 1].element;

    if (unluckyDirs.has(dir)) {
      unlucky.push(dir);
    } else if (starElement === generatesElement || starElement === generatedByElement) {
      lucky.push(dir);
    }
  }

  return { lucky, unlucky };
}

// --- メイン計算 ---
export interface NineStarResult {
  honmeisei: {
    number: number;
    name: string;
    element: string;
    personality: string;
    strength: string;
  };
  getsumeisei: {
    number: number;
    name: string;
    element: string;
    personality: string;
    strength: string;
  };
  yearPosition: {
    direction: string;
    theme: string;
    energy: number;
    advice: string;
    caution: string;
  };
  luckyDirections: string[];
  unluckyDirections: string[];
}

export function calcNineStar(birthDate: string, year: number = new Date().getFullYear()): NineStarResult {
  const honmei = calcHonmeisei(birthDate);
  const getsu = calcGetsumeisei(birthDate);
  const yearCenter = calcYearStar(year);
  const position = getPositionInBoard(honmei, yearCenter);
  const fortune = POSITION_FORTUNES[position.direction];
  const directions = calcLuckyDirections(honmei, yearCenter);

  const honmeiStar = NINE_STARS[honmei - 1];
  const getsuStar = NINE_STARS[getsu - 1];

  return {
    honmeisei: {
      number: honmei,
      name: honmeiStar.name,
      element: honmeiStar.element,
      personality: honmeiStar.personality,
      strength: honmeiStar.strength,
    },
    getsumeisei: {
      number: getsu,
      name: getsuStar.name,
      element: getsuStar.element,
      personality: getsuStar.personality,
      strength: getsuStar.strength,
    },
    yearPosition: {
      direction: position.direction,
      ...fortune,
    },
    luckyDirections: directions.lucky,
    unluckyDirections: directions.unlucky,
  };
}

/** グラフ用: 指定年の運勢エネルギー値を返す */
export function getNineStarWave(birthDate: string, year: number): number {
  const honmei = calcHonmeisei(birthDate);
  const yearCenter = calcYearStar(year);
  const position = getPositionInBoard(honmei, yearCenter);
  return POSITION_FORTUNES[position.direction].energy;
}

/** グラフ用: 指定年のポジション名を返す */
export function getNineStarPositionName(birthDate: string, year: number): string {
  const honmei = calcHonmeisei(birthDate);
  const yearCenter = calcYearStar(year);
  const position = getPositionInBoard(honmei, yearCenter);
  return `${position.direction}（${POSITION_FORTUNES[position.direction].theme}）`;
}
