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

// --- 多言語対応 ---
import type { Lang } from "@/lib/i18n/dict";
import { elementName } from "@/lib/i18n/fortune-terms";

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

const TSUUHEN_MEANINGS_KO: Record<TsuuhenStar, { keyword: string; personality: string }> = {
  比肩: { keyword: "자립·독립", personality: "자기 힘으로 길을 개척하는 독립심이 강한 타입. 마이페이스로 신념을 관철하는 힘이 있어요" },
  劫財: { keyword: "경쟁·사교", personality: "지기 싫어하고 행동력이 있는 타입. 사교적이며 사람을 끌어들이는 힘이 있어요" },
  食神: { keyword: "재능·낙관", personality: "천진난만하고 재능이 풍부해요. 먹는 것·즐기는 것을 좋아하고 사람을 치유하는 힘이 있어요" },
  傷官: { keyword: "감성·표현", personality: "감성이 예리하고 예술적인 재능이 있어요. 완벽주의이며 섬세한 마음의 소유자입니다" },
  偏財: { keyword: "사교·상재", personality: "사람 사귀는 것이 능숙하고 돈을 움직이는 힘이 있어요. 활동적이고 남을 잘 챙깁니다" },
  正財: { keyword: "견실·신용", personality: "성실하고 견실해요. 차근차근 쌓아가는 힘이 있고 신용을 소중히 여깁니다" },
  偏官: { keyword: "행동·개혁", personality: "행동력과 결단력이 넘쳐요. 조직을 움직이는 힘이 있는 개혁가 타입입니다" },
  正官: { keyword: "책임·품격", personality: "책임감이 강하고 예의 바릅니다. 사회적 신뢰를 얻기 쉬운 품격의 소유자입니다" },
  偏印: { keyword: "지성·독창", personality: "독특한 발상력과 지적 호기심의 소유자. 틀에 얽매이지 않는 자유로운 사고가 강점입니다" },
  印綬: { keyword: "학문·사려", personality: "지성과 교양이 높고 배우는 것을 좋아해요. 사려 깊고 사람을 가르치는 힘이 있어요" },
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

const DAY_MASTER_MEANINGS_KO: Record<string, { title: string; personality: string; strength: string }> = {
  甲: {
    title: "큰 나무",
    personality: "곧게 뻗어가는 큰 나무처럼 정의감이 강하고 리더십이 있어요. 그릇된 것을 싫어합니다",
    strength: "통솔력·정의감·향상심",
  },
  乙: {
    title: "화초",
    personality: "유연한 화초처럼 융통성이 있고 적응력이 있어요. 상냥하고 남의 마음에 다가갈 수 있어요",
    strength: "유연성·협조성·끈기",
  },
  丙: {
    title: "태양",
    personality: "태양처럼 밝고 주위를 비추는 존재. 열정적이며 사람을 끌어당기는 카리스마가 있어요",
    strength: "열정·카리스마·행동력",
  },
  丁: {
    title: "등불",
    personality: "등불처럼 섬세하고 따뜻해요. 내면에 격렬한 열정을 지니면서도 겉은 온화합니다",
    strength: "통찰력·섬세함·예술성",
  },
  戊: {
    title: "산",
    personality: "산처럼 든든하게 자리 잡아 안정감이 있어요. 잘 돌보고 신뢰받는 존재입니다",
    strength: "안정감·포용력·신뢰감",
  },
  己: {
    title: "논밭",
    personality: "풍요로운 논밭처럼 사람을 키우는 힘이 있어요. 겸손하고 묵묵히 뒷받침하는 조력자입니다",
    strength: "육성력·겸손함·인내력",
  },
  庚: {
    title: "검·쇠",
    personality: "단련된 쇠처럼 강한 의지와 결단력이 있어요. 정의감이 강하고 스토익합니다",
    strength: "결단력·실행력·정의감",
  },
  辛: {
    title: "보석",
    personality: "다듬어진 보석처럼 미의식이 높고 완벽을 추구해요. 섬세하고 감수성이 풍부합니다",
    strength: "미의식·감수성·품격",
  },
  壬: {
    title: "큰 바다",
    personality: "큰 바다처럼 자유롭고 스케일이 큰 발상을 할 수 있어요. 지성파이며 많은 사람을 받아들입니다",
    strength: "지성·자유·포용력",
  },
  癸: {
    title: "비·안개",
    personality: "고요한 비처럼 촉촉함과 치유를 주는 존재. 직감이 예리하고 정신성이 높아요",
    strength: "직감력·치유·정신성",
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

const TAIUN_THEMES: Record<FiveElement, string> = {
  木: "成長と発展の時期。新しいことを始めるのに最適",
  火: "情熱と輝きの時期。積極的に行動すると吉",
  土: "安定と蓄積の時期。地盤を固める好機",
  金: "収穫と決断の時期。実力が試される時",
  水: "知恵と変化の時期。学びと柔軟さが鍵",
};

const TAIUN_THEMES_KO: Record<FiveElement, string> = {
  木: "성장과 발전의 시기. 새로운 것을 시작하기에 최적입니다",
  火: "열정과 빛남의 시기. 적극적으로 행동하면 길합니다",
  土: "안정과 축적의 시기. 기반을 다지는 좋은 기회입니다",
  金: "수확과 결단의 시기. 실력이 시험받는 때입니다",
  水: "지혜와 변화의 시기. 배움과 유연함이 열쇠입니다",
};

function calcTaiUnSimple(
  monthPillar: StemBranch,
  yearStemYinYang: string,
  gender: "male" | "female",
  lang: Lang = "ja"
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

    const themes = lang === "ko" ? TAIUN_THEMES_KO : TAIUN_THEMES;

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
  birthTime?: string,
  lang: Lang = "ja"
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
  const dayMasterTable = lang === "ko" ? DAY_MASTER_MEANINGS_KO : DAY_MASTER_MEANINGS;
  const dayMasterData = dayMasterTable[dayPillar.stem.name] || dayMasterTable["甲"];
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
  const tsuuhenMeaning = (lang === "ko" ? TSUUHEN_MEANINGS_KO : TSUUHEN_MEANINGS)[monthStar];

  // 大運
  const taiUn = calcTaiUnSimple(monthPillar, yearPillar.stem.yin_yang, "female", lang);

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

/**
 * 四柱推命の月運エネルギーを算出（グラフ用）
 * 日主と月柱（対象年月）の五行相性で点数化
 */
export function getFourPillarsMonthWave(
  birthDate: string,
  year: number,
  month: number
): number {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const dayPillar = calcDayPillar(by, bm, bd);
  const dayElement = dayPillar.stem.element as FiveElement;

  // 対象年月の月柱を代表日(15日)で取得
  const monthPillar = calcMonthPillar(year, month, 15);
  const monthElement = monthPillar.stem.element as FiveElement;

  const generates: Record<FiveElement, FiveElement> = {
    木: "火", 火: "土", 土: "金", 金: "水", 水: "木",
  };
  const generatedBy: Record<FiveElement, FiveElement> = {
    木: "水", 火: "木", 土: "火", 金: "土", 水: "金",
  };

  let score = 50;
  if (generatedBy[dayElement] === monthElement) score = 80;
  else if (generates[dayElement] === monthElement) score = 65;
  else if (dayElement === monthElement) score = 70;
  else if (generates[monthElement] === dayElement) score = 35;
  else score = 45;

  const monthBranchElement = monthPillar.branch.element as FiveElement;
  if (generatedBy[dayElement] === monthBranchElement) score += 10;
  else if (generates[monthBranchElement] === dayElement) score -= 10;

  return Math.max(10, Math.min(100, score));
}

/**
 * 月柱の天干・地支（月運表示用）
 */
export function getFourPillarsMonthInfo(
  year: number,
  month: number,
  lang: Lang = "ja"
): { stem: string; branch: string; kanshi: string; element: string } {
  const monthPillar = calcMonthPillar(year, month, 15);
  return {
    stem: monthPillar.stem.name,
    branch: monthPillar.branch.name,
    kanshi: monthPillar.kanshi,
    element: elementName(monthPillar.stem.element, lang),
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
