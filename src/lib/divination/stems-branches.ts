/**
 * 天干地支（干支）計算の基盤モジュール
 *
 * 四柱推命・算命学の共通基盤。
 * 年柱・月柱・日柱・時柱の天干・地支を算出する。
 */

// --- 天干（十干）---
export const HEAVENLY_STEMS = [
  { name: "甲", reading: "きのえ", element: "木", yin_yang: "陽" },
  { name: "乙", reading: "きのと", element: "木", yin_yang: "陰" },
  { name: "丙", reading: "ひのえ", element: "火", yin_yang: "陽" },
  { name: "丁", reading: "ひのと", element: "火", yin_yang: "陰" },
  { name: "戊", reading: "つちのえ", element: "土", yin_yang: "陽" },
  { name: "己", reading: "つちのと", element: "土", yin_yang: "陰" },
  { name: "庚", reading: "かのえ", element: "金", yin_yang: "陽" },
  { name: "辛", reading: "かのと", element: "金", yin_yang: "陰" },
  { name: "壬", reading: "みずのえ", element: "水", yin_yang: "陽" },
  { name: "癸", reading: "みずのと", element: "水", yin_yang: "陰" },
] as const;

// --- 地支（十二支）---
export const EARTHLY_BRANCHES = [
  { name: "子", reading: "ね", animal: "ねずみ", element: "水", yin_yang: "陽" },
  { name: "丑", reading: "うし", animal: "うし", element: "土", yin_yang: "陰" },
  { name: "寅", reading: "とら", animal: "とら", element: "木", yin_yang: "陽" },
  { name: "卯", reading: "う", animal: "うさぎ", element: "木", yin_yang: "陰" },
  { name: "辰", reading: "たつ", animal: "たつ", element: "土", yin_yang: "陽" },
  { name: "巳", reading: "み", animal: "へび", element: "火", yin_yang: "陰" },
  { name: "午", reading: "うま", animal: "うま", element: "火", yin_yang: "陽" },
  { name: "未", reading: "ひつじ", animal: "ひつじ", element: "土", yin_yang: "陰" },
  { name: "申", reading: "さる", animal: "さる", element: "金", yin_yang: "陽" },
  { name: "酉", reading: "とり", animal: "とり", element: "金", yin_yang: "陰" },
  { name: "戌", reading: "いぬ", animal: "いぬ", element: "土", yin_yang: "陽" },
  { name: "亥", reading: "い", animal: "いのしし", element: "水", yin_yang: "陰" },
] as const;

// --- 五行 ---
export const FIVE_ELEMENTS = ["木", "火", "土", "金", "水"] as const;
export type FiveElement = (typeof FIVE_ELEMENTS)[number];

export interface StemBranch {
  stem: (typeof HEAVENLY_STEMS)[number];
  branch: (typeof EARTHLY_BRANCHES)[number];
  kanshi: string; // "甲子" 等
}

/**
 * 節入り日（立春〜小寒）- 月の切り替わり
 * 簡易版: 各月の節入り日を固定値で設定
 * (実際は年によって1日前後するが、簡易版として固定)
 */
const SETSUIRI_DAYS: Record<number, number> = {
  1: 6,   // 小寒 → 丑月
  2: 4,   // 立春 → 寅月（年の切り替わり）
  3: 6,   // 啓蟄 → 卯月
  4: 5,   // 清明 → 辰月
  5: 6,   // 立夏 → 巳月
  6: 6,   // 芒種 → 午月
  7: 7,   // 小暑 → 未月
  8: 8,   // 立秋 → 申月
  9: 8,   // 白露 → 酉月
  10: 8,  // 寒露 → 戌月
  11: 7,  // 立冬 → 亥月
  12: 7,  // 大雪 → 子月
};

/**
 * 立春前かどうかを判定（年柱の切り替わり）
 */
export function isBeforeRisshun(month: number, day: number): boolean {
  if (month < 2) return true;
  if (month === 2 && day < 4) return true;
  return false;
}

/**
 * 節入り日に基づく月の地支インデックスを取得
 * 寅月(2) = index 2, 卯月(3) = index 3, ..., 丑月(1) = index 1
 */
function getMonthBranchIndex(month: number, day: number): number {
  // 節入り日前なら前月
  const setsuiri = SETSUIRI_DAYS[month] || 5;
  let adjustedMonth = month;
  if (day < setsuiri) {
    adjustedMonth = month === 1 ? 12 : month - 1;
  }
  // 月→地支: 1月=丑(1), 2月=寅(2), ..., 12月=子(0)
  return adjustedMonth === 12 ? 0 : adjustedMonth;
}

// --- 年柱の計算 ---

/**
 * 年柱の天干インデックス（0-9）
 * 西暦年 % 10 で算出: 4=甲, 5=乙, 6=丙, ...
 */
export function getYearStemIndex(year: number): number {
  return (year - 4) % 10;
}

/**
 * 年柱の地支インデックス（0-11）
 * 西暦年 % 12 で算出: 4=子, 5=丑, ...
 */
export function getYearBranchIndex(year: number): number {
  return (year - 4) % 12;
}

export function calcYearPillar(year: number, month: number, day: number): StemBranch {
  // 立春前は前年
  const adjustedYear = isBeforeRisshun(month, day) ? year - 1 : year;
  const stemIdx = ((adjustedYear - 4) % 10 + 10) % 10;
  const branchIdx = ((adjustedYear - 4) % 12 + 12) % 12;
  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    kanshi: HEAVENLY_STEMS[stemIdx].name + EARTHLY_BRANCHES[branchIdx].name,
  };
}

// --- 月柱の計算 ---

/**
 * 月柱の天干は年干から決まる（年干×2 + 月支インデックス）
 * 甲・己の年 → 丙寅月から始まる
 * 乙・庚の年 → 戊寅月から始まる
 * 丙・辛の年 → 庚寅月から始まる
 * 丁・壬の年 → 壬寅月から始まる
 * 戊・癸の年 → 甲寅月から始まる
 */
function getMonthStemBase(yearStemIdx: number): number {
  // 年干 % 5 でグループ分け, 寅月の天干を返す
  const group = yearStemIdx % 5;
  // 甲己→丙(2), 乙庚→戊(4), 丙辛→庚(6), 丁壬→壬(8), 戊癸→甲(0)
  return [2, 4, 6, 8, 0][group];
}

export function calcMonthPillar(
  year: number,
  month: number,
  day: number
): StemBranch {
  const yearPillar = calcYearPillar(year, month, day);
  const yearStemIdx = HEAVENLY_STEMS.findIndex(
    (s) => s.name === yearPillar.stem.name
  );

  const branchIdx = getMonthBranchIndex(month, day);
  const monthStemBase = getMonthStemBase(yearStemIdx);

  // 寅月(index=2)からのオフセット
  const offset = (branchIdx - 2 + 12) % 12;
  const stemIdx = (monthStemBase + offset) % 10;

  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    kanshi: HEAVENLY_STEMS[stemIdx].name + EARTHLY_BRANCHES[branchIdx].name,
  };
}

// --- 日柱の計算 ---

/**
 * 日柱はユリウス日から算出
 * 基準日: 1900年1月1日 = 甲子(0) → 実際は 1900-01-01 = 庚子
 * 正確な基準: 1900-01-01 のJD = 2415021, 干支は庚子(36番目, 0始まりで36)
 */
function julianDayNumber(year: number, month: number, day: number): number {
  // グレゴリオ暦 → ユリウス日 (簡易版)
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    B -
    1524.5
  );
}

export function calcDayPillar(
  year: number,
  month: number,
  day: number
): StemBranch {
  const jd = julianDayNumber(year, month, day);
  // 基準: JD 2415020 (1900-01-01) = 干支番号36 (庚子)
  const kanshiNum = ((Math.floor(jd) - 2415020 + 36) % 60 + 60) % 60;
  const stemIdx = kanshiNum % 10;
  const branchIdx = kanshiNum % 12;

  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    kanshi: HEAVENLY_STEMS[stemIdx].name + EARTHLY_BRANCHES[branchIdx].name,
  };
}

// --- 時柱の計算 ---

/**
 * 時柱の地支: 時刻から決定
 * 23:00-00:59=子, 01:00-02:59=丑, ..., 21:00-22:59=亥
 */
function getHourBranchIndex(hour: number): number {
  // 23時台は子(0)
  if (hour === 23) return 0;
  return Math.floor((hour + 1) / 2);
}

/**
 * 時柱の天干は日干から決まる
 * 甲・己の日 → 甲子時から始まる
 * 乙・庚の日 → 丙子時
 * 丙・辛の日 → 戊子時
 * 丁・壬の日 → 庚子時
 * 戊・癸の日 → 壬子時
 */
function getHourStemBase(dayStemIdx: number): number {
  const group = dayStemIdx % 5;
  return [0, 2, 4, 6, 8][group];
}

export function calcHourPillar(
  year: number,
  month: number,
  day: number,
  hour: number
): StemBranch {
  const dayPillar = calcDayPillar(year, month, day);
  const dayStemIdx = HEAVENLY_STEMS.findIndex(
    (s) => s.name === dayPillar.stem.name
  );

  const branchIdx = getHourBranchIndex(hour);
  const hourStemBase = getHourStemBase(dayStemIdx);
  const stemIdx = (hourStemBase + branchIdx) % 10;

  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    kanshi: HEAVENLY_STEMS[stemIdx].name + EARTHLY_BRANCHES[branchIdx].name,
  };
}

// --- 五行バランス計算 ---

export interface FiveElementBalance {
  木: number;
  火: number;
  土: number;
  金: number;
  水: number;
}

/**
 * 四柱から五行バランスを算出
 * 各柱の天干・地支の五行をカウント
 */
export function calcFiveElementBalance(
  pillars: StemBranch[]
): FiveElementBalance {
  const balance: FiveElementBalance = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const p of pillars) {
    balance[p.stem.element as FiveElement]++;
    balance[p.branch.element as FiveElement]++;
  }
  return balance;
}

/**
 * 日干（日主）から喜ぶ五行（用神の簡易版）を推定
 * 身強（自分の五行が多い）→ 剋す五行が吉
 * 身弱（自分の五行が少ない）→ 生じる五行が吉
 */
export function estimateFavorableElement(
  dayElement: FiveElement,
  balance: FiveElementBalance
): { element: FiveElement; reason: string } {
  // 日干の五行のカウント
  const selfCount = balance[dayElement];
  const total = Object.values(balance).reduce((a, b) => a + b, 0);

  // 相生関係: 木→火→土→金→水→木
  const generates: Record<FiveElement, FiveElement> = {
    木: "火", 火: "土", 土: "金", 金: "水", 水: "木",
  };
  const controls: Record<FiveElement, FiveElement> = {
    木: "土", 火: "金", 土: "水", 金: "木", 水: "火",
  };
  const generatedBy: Record<FiveElement, FiveElement> = {
    木: "水", 火: "木", 土: "火", 金: "土", 水: "金",
  };

  if (selfCount >= total / 2.5) {
    // 身強 → 洩らす・剋す五行が吉
    const favorable = generates[dayElement];
    return {
      element: favorable,
      reason: `${dayElement}の気が強いため、${favorable}で力を発散させると吉`,
    };
  } else {
    // 身弱 → 生じてくれる五行が吉
    const favorable = generatedBy[dayElement];
    return {
      element: favorable,
      reason: `${dayElement}の気を補うため、${favorable}の力を借りると吉`,
    };
  }
}
