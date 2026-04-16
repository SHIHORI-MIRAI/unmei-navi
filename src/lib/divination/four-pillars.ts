/**
 * 四柱推命（Four Pillars of Destiny）計算エンジン
 *
 * 生年月日・時間から四柱（年柱・月柱・日柱・時柱）を算出し、
 * 五行バランス、通変星、日主の性格を分析する。
 */

import {
  calcYearPillar,
  calcMonthPillar,
  calcDayPillar,
  calcHourPillar,
  calcFiveElementBalance,
  estimateFavorableElement,
  HEAVENLY_STEMS,
  type StemBranch,
  type FiveElementBalance,
  type FiveElement,
} from "./stems-branches";

// --- 通変星（十神）---

const TSUUHEN_NAMES = [
  "比肩", "劫財", "食神", "傷官", "偏財",
  "正財", "偏官", "正官", "偏印", "印綬",
] as const;

type TsuuhenStar = (typeof TSUUHEN_NAMES)[number];

const TSUUHEN_MEANINGS: Record<TsuuhenStar, { keyword: string; personality: string }> = {
  比肩: { keyword: "自立・独立", personality: "自分の力で切り開く独立心が強いタイプ。マイペースで信念を貫く力がある" },
  劫財: { keyword: "競争・社交", personality: "負けず嫌いで行動力があるタイプ。社交的で人を巻き込む力がある" },
  食神: { keyword: "才能・楽観", personality: "天真爛漫で才能豊か。食べること・楽しむことが好きで、人を癒す力がある" },
  傷官: { keyword: "感性・表現", personality: "感性が鋭く、芸術的な才能がある。完璧主義で、繊細な心の持ち主" },
  偏財: { keyword: "社交・商才", personality: "人付き合いが上手で、お金を動かす力がある。活動的で世話好き" },
  正財: { keyword: "堅実・信用", personality: "真面目で堅実。コツコツ積み上げる力があり、信用を大切にする" },
  偏官: { keyword: "行動・改革", personality: "行動力と決断力に溢れる。組織を動かす力があり、改革者タイプ" },
  正官: { keyword: "責任・品格", personality: "責任感が強く、礼儀正しい。社会的な信頼を得やすい品格の持ち主" },
  偏印: { keyword: "知性・独創", personality: "独特な発想力と知的好奇心の持ち主。型にはまらない自由な思考が強み" },
  印綬: { keyword: "学問・思慮", personality: "知性と教養が高く、学ぶことが好き。思慮深く、人に教える力がある" },
};

/**
 * 通変星を算出
 * 日干を基準に、他の天干との関係を五行の相生相剋で判定
 */
function calcTsuuhenStar(dayStemIdx: number, targetStemIdx: number): TsuuhenStar {
  const diff = ((targetStemIdx - dayStemIdx) % 10 + 10) % 10;
  return TSUUHEN_NAMES[diff];
}

// --- 日主（日干）の性格 ---

const DAY_MASTER_MEANINGS: Record<string, { title: string; personality: string; strength: string }> = {
  甲: {
    title: "大樹",
    personality: "まっすぐに伸びる大樹のように、正義感が強く、リーダーシップがある。曲がったことが嫌い",
    strength: "統率力・正義感・向上心",
  },
  乙: {
    title: "草花",
    personality: "しなやかな草花のように、柔軟で適応力がある。優しく、人の気持ちに寄り添える",
    strength: "柔軟性・協調性・粘り強さ",
  },
  丙: {
    title: "太陽",
    personality: "太陽のように明るく、周囲を照らす存在。情熱的で、人を惹きつけるカリスマ性がある",
    strength: "情熱・カリスマ性・行動力",
  },
  丁: {
    title: "灯火",
    personality: "灯火のように繊細で温かい。内面に激しい情熱を持ちながらも、表面は穏やか",
    strength: "洞察力・繊細さ・芸術性",
  },
  戊: {
    title: "山",
    personality: "山のようにどっしりと構え、安定感がある。面倒見がよく、信頼される存在",
    strength: "安定感・包容力・信頼感",
  },
  己: {
    title: "田畑",
    personality: "豊かな田畑のように、人を育てる力がある。謙虚で、縁の下の力持ち",
    strength: "育成力・謙虚さ・忍耐力",
  },
  庚: {
    title: "剣・鉄",
    personality: "鍛えられた鉄のように、強い意志と決断力がある。正義感が強く、ストイック",
    strength: "決断力・実行力・正義感",
  },
  辛: {
    title: "宝石",
    personality: "磨かれた宝石のように、美意識が高く、完璧を求める。繊細で感受性豊か",
    strength: "美意識・感受性・品格",
  },
  壬: {
    title: "大海",
    personality: "大海のように自由で、スケールの大きな発想ができる。知性派で、多くの人を受け入れる",
    strength: "知性・自由・包容力",
  },
  癸: {
    title: "雨・霧",
    personality: "静かな雨のように、潤いと癒しを与える存在。直感が鋭く、精神性が高い",
    strength: "直感力・癒し・精神性",
  },
};

// --- 大運（10年ごとの運気）簡易版 ---

interface TaiUn {
  startAge: number;
  stem: string;
  branch: string;
  element: FiveElement;
  theme: string;
}

function calcTaiUnSimple(
  monthPillar: StemBranch,
  yearStemYinYang: string,
  gender: "male" | "female"
): TaiUn[] {
  const monthStemIdx = HEAVENLY_STEMS.findIndex(
    (s) => s.name === monthPillar.stem.name
  );
  const monthBranchIdx = monthPillar.branch === undefined ? 0 :
    ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
      .indexOf(monthPillar.branch.name);

  // 順行 or 逆行: 男性陽年/女性陰年 → 順行、それ以外 → 逆行
  const isForward =
    (gender === "male" && yearStemYinYang === "陽") ||
    (gender === "female" && yearStemYinYang === "陰");

  const result: TaiUn[] = [];
  for (let i = 1; i <= 8; i++) {
    const offset = isForward ? i : -i;
    const stemIdx = ((monthStemIdx + offset) % 10 + 10) % 10;
    const branchIdx = ((monthBranchIdx + offset) % 12 + 12) % 12;
    const stem = HEAVENLY_STEMS[stemIdx];
    const branch = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"][branchIdx];
    const element = stem.element as FiveElement;

    const themes: Record<FiveElement, string> = {
      木: "成長と発展の時期。新しいことを始めるのに最適",
      火: "情熱と輝きの時期。積極的に行動すると吉",
      土: "安定と蓄積の時期。地盤を固める好機",
      金: "収穫と決断の時期。実力が試される時",
      水: "知恵と変化の時期。学びと柔軟さが鍵",
    };

    result.push({
      startAge: i * 10 - 7, // 簡易的に3歳起算
      stem: stem.name,
      branch,
      element,
      theme: themes[element],
    });
  }

  return result;
}

// --- メインの計算関数 ---

export interface FourPillarsResult {
  yearPillar: StemBranch;
  monthPillar: StemBranch;
  dayPillar: StemBranch;
  hourPillar: StemBranch | null;
  dayMaster: {
    stem: string;
    element: FiveElement;
    title: string;
    personality: string;
    strength: string;
  };
  fiveElements: FiveElementBalance;
  favorableElement: { element: FiveElement; reason: string };
  tsuuhenStars: {
    yearStar: TsuuhenStar;
    monthStar: TsuuhenStar;
    hourStar: TsuuhenStar | null;
  };
  tsuuhenMeaning: { keyword: string; personality: string };
  taiUn: TaiUn[];
}

export function calcFourPillars(
  birthDate: string,
  birthTime?: string
): FourPillarsResult {
  const [y, m, d] = birthDate.split("-").map(Number);

  const yearPillar = calcYearPillar(y, m, d);
  const monthPillar = calcMonthPillar(y, m, d);
  const dayPillar = calcDayPillar(y, m, d);

  let hourPillar: StemBranch | null = null;
  if (birthTime) {
    const hour = parseInt(birthTime.split(":")[0], 10);
    if (!isNaN(hour)) {
      hourPillar = calcHourPillar(y, m, d, hour);
    }
  }

  // 日主
  const dayMasterData = DAY_MASTER_MEANINGS[dayPillar.stem.name] || DAY_MASTER_MEANINGS["甲"];
  const dayMaster = {
    stem: dayPillar.stem.name,
    element: dayPillar.stem.element as FiveElement,
    ...dayMasterData,
  };

  // 五行バランス
  const pillars = [yearPillar, monthPillar, dayPillar];
  if (hourPillar) pillars.push(hourPillar);
  const fiveElements = calcFiveElementBalance(pillars);

  // 用神
  const favorableElement = estimateFavorableElement(
    dayPillar.stem.element as FiveElement,
    fiveElements
  );

  // 通変星
  const dayStemIdx = HEAVENLY_STEMS.findIndex(
    (s) => s.name === dayPillar.stem.name
  );
  const yearStemIdx = HEAVENLY_STEMS.findIndex(
    (s) => s.name === yearPillar.stem.name
  );
  const monthStemIdx = HEAVENLY_STEMS.findIndex(
    (s) => s.name === monthPillar.stem.name
  );

  const yearStar = calcTsuuhenStar(dayStemIdx, yearStemIdx);
  const monthStar = calcTsuuhenStar(dayStemIdx, monthStemIdx);
  let hourStar: TsuuhenStar | null = null;
  if (hourPillar) {
    const hourStemIdx = HEAVENLY_STEMS.findIndex(
      (s) => s.name === hourPillar!.stem.name
    );
    hourStar = calcTsuuhenStar(dayStemIdx, hourStemIdx);
  }

  // 月柱の通変星が最も影響力が大きい
  const tsuuhenMeaning = TSUUHEN_MEANINGS[monthStar];

  // 大運
  const taiUn = calcTaiUnSimple(monthPillar, yearPillar.stem.yin_yang, "female");

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster,
    fiveElements,
    favorableElement,
    tsuuhenStars: { yearStar, monthStar, hourStar },
    tsuuhenMeaning,
    taiUn,
  };
}

/** 四柱推命の年運エネルギーを算出（グラフ用） */
export function getFourPillarsWave(birthDate: string, year: number): number {
  const [, bm, bd] = birthDate.split("-").map(Number);
  const dayPillar = calcDayPillar(
    parseInt(birthDate.split("-")[0]),
    bm,
    bd
  );
  const dayElement = dayPillar.stem.element as FiveElement;

  // その年の年柱の五行との相性でエネルギーを算出
  const yearPillar = calcYearPillar(year, 6, 15); // 年の中間で計算
  const yearElement = yearPillar.stem.element as FiveElement;

  // 相生相剋の関係で点数化
  const generates: Record<FiveElement, FiveElement> = {
    木: "火", 火: "土", 土: "金", 金: "水", 水: "木",
  };
  const generatedBy: Record<FiveElement, FiveElement> = {
    木: "水", 火: "木", 土: "火", 金: "土", 水: "金",
  };

  let score = 50;
  if (generatedBy[dayElement] === yearElement) score = 80;  // 生じてくれる
  else if (generates[dayElement] === yearElement) score = 65; // 自分が生じる
  else if (dayElement === yearElement) score = 70;            // 同じ五行
  else if (generates[yearElement] === dayElement) score = 35; // 剋される
  else score = 45; // 自分が剋す

  // 地支の影響も加味
  const yearBranchElement = yearPillar.branch.element as FiveElement;
  if (generatedBy[dayElement] === yearBranchElement) score += 10;
  else if (generates[yearBranchElement] === dayElement) score -= 10;

  return Math.max(10, Math.min(100, score));
}
