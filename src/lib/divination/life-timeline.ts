/**
 * life-timeline.ts — 人生の棚卸し（ライフストーリー）用ロジック
 *
 * 出来事の「年」に、その時期の運気（数秘パーソナルイヤー・九星）と、
 * 年齢で決まる占星術の節目（土星回帰などのリターン／オポジション）を重ねる。
 * さらに複数の出来事から、繰り返すテーマ＝人生の癖・課題の"芽"を抽出する。
 *
 * ※ Phase 1 はルールベース（0円）。深い読み解き（使命・強み）は Phase 2 の
 *   AI 機能に委ねる前提の、あくまで"気づきの入口"。
 */

import { calcPersonalYear, getPersonalYearMeaning, getYearWave, calcLifePathNumber, getLifePathMeaning } from "./numerology";
import { calcNineStar } from "./nine-star";

/** 年齢で（ほぼ誰にでも）訪れる占星術の節目 */
export interface AgeMilestone {
  key: string;
  label: string; // 例: 土星回帰
  theme: string; // ポジティブな一言
  emoji: string;
}

/** 出来事の年に重ねる「その時期」の情報 */
export interface LifePeriod {
  age: number;
  year: number;
  personalYear: number;
  personalYearTheme: string;
  personalYearAdvice: string;
  energy: number; // 0..100（数秘の年運の波）
  nineStarDirection: string;
  nineStarEnergy: number;
  milestones: AgeMilestone[];
}

/**
 * 年齢ごとの占星術マイルストーン（目安・±1歳で判定）。
 * 土星回帰・木星回帰などは個人差が小さく、ほぼ同じ年齢で訪れるため
 * 「その頃こういう星の時期だった」と重ねられる。すべて前向きな表現。
 */
const AGE_MILESTONES: { range: [number, number]; m: AgeMilestone }[] = [
  { range: [11, 12], m: { key: "jup1", label: "木星回帰①", emoji: "🌱", theme: "世界が広がり始める・興味が芽吹く時期" } },
  { range: [14, 15], m: { key: "sat-opp1", label: "土星オポジション", emoji: "🌗", theme: "自分の意志が芽生え、自立へと揺れる時期" } },
  { range: [23, 24], m: { key: "jup2", label: "木星回帰②", emoji: "🌿", theme: "世界がもう一段広がる・チャンスの再来" } },
  { range: [29, 30], m: { key: "sat1", label: "土星回帰①", emoji: "🪐", theme: "人生の再構築・「本当の自分の選択」をする節目" } },
  { range: [35, 37], m: { key: "jup3", label: "木星回帰③", emoji: "🌳", theme: "拡大と飛躍・実力が形になり始める時期" } },
  { range: [40, 42], m: { key: "ura-opp", label: "天王星オポジション", emoji: "⚡", theme: "ミッドライフの変革・本当の自分に立ち返る時期" } },
  { range: [43, 45], m: { key: "sat-opp2", label: "人生の中間点", emoji: "🧭", theme: "これまでを見直し、軌道を調整する再評価の時期" } },
  { range: [47, 49], m: { key: "jup4", label: "木星回帰④", emoji: "🍃", theme: "実りと新展開・視野が成熟する時期" } },
  { range: [50, 51], m: { key: "chiron", label: "ケイロン回帰", emoji: "💗", theme: "深い癒しと、経験を人に還す使命が見えてくる時期" } },
  { range: [58, 60], m: { key: "sat2", label: "土星回帰②", emoji: "🪐", theme: "集大成・第二の人生を設計する節目" } },
];

/** 年齢からマイルストーン（複数可）を返す */
export function getAgeMilestones(age: number): AgeMilestone[] {
  return AGE_MILESTONES.filter(
    ({ range }) => age >= range[0] && age <= range[1]
  ).map(({ m }) => m);
}

/** 出来事の年に、その時期の運気＋星の節目を重ねる */
export function getLifePeriod(birthDate: string, year: number): LifePeriod {
  const birthYear = Number(birthDate.split("-")[0]) || year;
  const age = year - birthYear;

  const py = calcPersonalYear(birthDate, year);
  const pyMeaning = getPersonalYearMeaning(py);

  let nineStarDirection = "";
  let nineStarEnergy = 50;
  try {
    const nine = calcNineStar(birthDate, year);
    nineStarDirection = nine.yearPosition?.direction || "";
    nineStarEnergy = nine.yearPosition?.energy ?? 50;
  } catch {
    // 九星が計算できない年（範囲外など）は無視
  }

  return {
    age,
    year,
    personalYear: py,
    personalYearTheme: pyMeaning.theme,
    personalYearAdvice: pyMeaning.advice,
    energy: getYearWave(py),
    nineStarDirection,
    nineStarEnergy,
    milestones: getAgeMilestones(age),
  };
}

// ===== パターンの"芽"（Phase 1・ルールベース） =====

interface LifeEventLike {
  year: number;
  category: string;
  emotion: number; // 1..5
  magnitude: number; // 1..3
}

export interface LifePatternInsight {
  enough: boolean; // 分析に足る件数があるか
  eventCount: number;
  /** 最も繰り返されているカテゴリ（2件以上） */
  recurringCategory: { category: string; count: number } | null;
  /** 星の節目の年に重なった出来事の数 */
  milestoneCount: number;
  /** つらい局面（感情が低い出来事）が多いカテゴリ */
  challengeCategory: { category: string; count: number } | null;
  /** ライフパスの核となる強み（既存の数秘から） */
  lifePathTitle: string;
  coreStrength: string;
  /** 前向きな"気づきの芽"（1〜3文） */
  tentative: string[];
}

/**
 * 複数の出来事から、繰り返すテーマ＝人生の癖・課題の"芽"を抽出する。
 * ありのままの感情は尊重しつつ、意味づけ（芽）は前向きに表現する。
 */
export function analyzeLifePatterns(
  events: LifeEventLike[],
  birthDate: string
): LifePatternInsight {
  const birthYear = Number(birthDate.split("-")[0]) || 0;
  const lp = calcLifePathNumber(birthDate);
  const lpMeaning = getLifePathMeaning(lp);

  const base: LifePatternInsight = {
    enough: events.length >= 3,
    eventCount: events.length,
    recurringCategory: null,
    milestoneCount: 0,
    challengeCategory: null,
    lifePathTitle: lpMeaning.title,
    coreStrength: lpMeaning.strength,
    tentative: [],
  };

  if (events.length === 0) return base;

  // カテゴリ集計
  const catCount: Record<string, number> = {};
  const challengeCount: Record<string, number> = {};
  let milestoneCount = 0;

  for (const e of events) {
    catCount[e.category] = (catCount[e.category] ?? 0) + 1;
    // つらい局面（感情1-2）はカテゴリ別に集計
    if (e.emotion <= 2) {
      challengeCount[e.category] = (challengeCount[e.category] ?? 0) + 1;
    }
    // 星の節目の年と重なるか
    const age = e.year - birthYear;
    if (getAgeMilestones(age).length > 0 && e.magnitude >= 2) {
      milestoneCount++;
    }
  }

  const topCat = Object.entries(catCount)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])[0];
  const topChallenge = Object.entries(challengeCount)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])[0];

  base.recurringCategory = topCat
    ? { category: topCat[0], count: topCat[1] }
    : null;
  base.challengeCategory = topChallenge
    ? { category: topChallenge[0], count: topChallenge[1] }
    : null;
  base.milestoneCount = milestoneCount;

  // 前向きな芽（tease）
  const t: string[] = [];
  if (base.recurringCategory) {
    t.push(
      `あなたの人生は「${base.recurringCategory.category}」を軸に動いてきたようです。ここにあなたの大切なテーマが宿っています。`
    );
  }
  if (base.challengeCategory) {
    t.push(
      `「${base.challengeCategory.category}」では苦しい局面もあったようですが、そこを通るたびにあなたは強くなっています。課題は、あなたの使命の裏返しかもしれません。`
    );
  }
  if (milestoneCount >= 2) {
    t.push(
      `大きな出来事の多くが、星の節目（土星回帰などの人生の転換期）と重なっています。あなたは"人生のリズム"に沿って歩んできた人です。`
    );
  }
  t.push(
    `核となる強みは「${lpMeaning.title}」＝${lpMeaning.strength}。この力が、これまでの出来事の底を流れています。`
  );

  base.tentative = t;
  return base;
}
