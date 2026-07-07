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

import {
  calcPersonalYear,
  getPersonalYearMeaning,
  getYearWave,
  calcLifePathNumber,
  getLifePathMeaning,
} from "./numerology";
import { calcNineStar } from "./nine-star";
import type { Lang } from "@/lib/i18n/dict";
import { directionName } from "@/lib/i18n/fortune-terms";

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

/** 年齢マイルストーンの韓国語版（key で対応） */
const AGE_MILESTONES_KO: Record<string, { label: string; theme: string }> = {
  jup1: { label: "목성 회귀①", theme: "세계가 넓어지기 시작하고 흥미가 싹트는 시기" },
  "sat-opp1": { label: "토성 오포지션", theme: "자신의 의지가 싹트고 자립으로 흔들리는 시기" },
  jup2: { label: "목성 회귀②", theme: "세계가 한 단계 더 넓어지는·기회가 다시 찾아오는 시기" },
  sat1: { label: "토성 회귀①", theme: "인생의 재구축·「진짜 나의 선택」을 하는 전환점" },
  jup3: { label: "목성 회귀③", theme: "확대와 비약·실력이 형태를 갖추기 시작하는 시기" },
  "ura-opp": { label: "천왕성 오포지션", theme: "미드라이프의 변혁·진짜 자신으로 돌아가는 시기" },
  "sat-opp2": { label: "인생의 중간점", theme: "지금까지를 재검토하고 궤도를 조정하는 재평가의 시기" },
  jup4: { label: "목성 회귀④", theme: "결실과 새로운 전개·시야가 성숙해지는 시기" },
  chiron: { label: "카이런 회귀", theme: "깊은 치유와, 경험을 남에게 돌려주는 사명이 보이기 시작하는 시기" },
  sat2: { label: "토성 회귀②", theme: "집대성·제2의 인생을 설계하는 전환점" },
};

/** 年齢からマイルストーン（複数可）を返す */
export function getAgeMilestones(age: number, lang: Lang = "ja"): AgeMilestone[] {
  return AGE_MILESTONES.filter(
    ({ range }) => age >= range[0] && age <= range[1]
  ).map(({ m }) => {
    if (lang === "ko") {
      const ko = AGE_MILESTONES_KO[m.key];
      if (ko) return { ...m, label: ko.label, theme: ko.theme };
    }
    return m;
  });
}

/** 出来事の年に、その時期の運気＋星の節目を重ねる */
export function getLifePeriod(
  birthDate: string,
  year: number,
  lang: Lang = "ja"
): LifePeriod {
  const birthYear = Number(birthDate.split("-")[0]) || year;
  const age = year - birthYear;

  const py = calcPersonalYear(birthDate, year);
  const pyMeaning = getPersonalYearMeaning(py, lang);

  let nineStarDirection = "";
  let nineStarEnergy = 50;
  try {
    const nine = calcNineStar(birthDate, year, lang);
    const dir = nine.yearPosition?.direction || "";
    nineStarDirection = dir && lang === "ko" ? directionName(dir, lang) : dir;
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
    milestones: getAgeMilestones(age, lang),
  };
}

// ===== 9年サイクル分析（数秘パーソナルイヤー × 人生の出来事） =====

/** マスターナンバーを1〜9のサイクルに落とす（11→2, 22→4, 33→6） */
function reduceCycle(n: number): number {
  if (n === 11) return 2;
  if (n === 22) return 4;
  if (n === 33) return 6;
  return n;
}

/** 各サイクル年（1〜9）の短いラベルと使い方ヒント */
export const CYCLE_LABELS: Record<number, { label: string; hint: string }> = {
  1: { label: "始まり", hint: "新しい場所・世界へ飛び込む・大きなスタート" },
  2: { label: "協力", hint: "人との縁を育てる・仲間づくり・じっくり" },
  3: { label: "表現", hint: "発信・創造・楽しむ・生み出す" },
  4: { label: "土台", hint: "基盤を固める・地道・学びに投資" },
  5: { label: "変化", hint: "新しい体験・挑戦・動く・自由" },
  6: { label: "愛", hint: "家族・大切な人・責任・つながり" },
  7: { label: "学び", hint: "内省・専門を深める・一人の時間" },
  8: { label: "実り", hint: "成果・達成・お金・勝負所" },
  9: { label: "手放し", hint: "完成・手放す・次の種まき・振り返り" },
};

/** 各サイクル年（1〜9）の韓国語版ラベルとヒント */
export const CYCLE_LABELS_KO: Record<number, { label: string; hint: string }> = {
  1: { label: "시작", hint: "새로운 장소·세계로 뛰어들기·큰 출발" },
  2: { label: "협력", hint: "사람과의 인연을 키우기·동료 만들기·차분히" },
  3: { label: "표현", hint: "발신·창조·즐기기·만들어내기" },
  4: { label: "토대", hint: "기반을 다지기·꾸준히·배움에 투자" },
  5: { label: "변화", hint: "새로운 경험·도전·움직이기·자유" },
  6: { label: "사랑", hint: "가족·소중한 사람·책임·연결" },
  7: { label: "배움", hint: "성찰·전문을 깊이기·혼자만의 시간" },
  8: { label: "결실", hint: "성과·달성·돈·승부처" },
  9: { label: "내려놓음", hint: "완성·내려놓기·다음 씨앗 뿌리기·되돌아보기" },
};

/** サイクルラベルを言語に応じて返す */
function cycleLabelOf(n: number, lang: Lang): { label: string; hint: string } {
  return (lang === "ko" ? CYCLE_LABELS_KO : CYCLE_LABELS)[n];
}

export interface YearCycleEvent {
  year: number;
  age: number;
  title: string;
  rawNumber: number; // 実際の数秘（11等のマスターも保持）
}

export interface YearCycleSlot {
  number: number; // 1〜9
  label: string;
  hint: string;
  events: YearCycleEvent[];
}

export interface YearCycleUpcoming {
  year: number;
  number: number; // 1〜9
  rawNumber: number;
}

export interface YearCycle {
  slots: YearCycleSlot[]; // 1〜9
  currentYear: number;
  currentNumber: number; // 1〜9
  currentRaw: number;
  upcoming: YearCycleUpcoming[]; // 今後3年
}

/**
 * 出来事を数秘のパーソナルイヤー（1〜9）ごとに束ね、
 * 「その数の年に、あなたが過去に何をしてきたか」を自動抽出する。
 * さらに今年の位置と今後3年のリズムも返す。
 */
export function buildYearCycle(
  birthDate: string,
  events: { year: number; title: string }[],
  currentYear: number,
  lang: Lang = "ja"
): YearCycle {
  const birthYear = Number(birthDate.split("-")[0]) || currentYear;

  const slots: YearCycleSlot[] = [];
  const byNum = new Map<number, YearCycleSlot>();
  for (let n = 1; n <= 9; n++) {
    const slot: YearCycleSlot = { number: n, ...cycleLabelOf(n, lang), events: [] };
    slots.push(slot);
    byNum.set(n, slot);
  }

  for (const e of events) {
    const raw = calcPersonalYear(birthDate, e.year);
    const slot = byNum.get(reduceCycle(raw));
    if (slot) {
      slot.events.push({
        year: e.year,
        age: e.year - birthYear,
        title: e.title,
        rawNumber: raw,
      });
    }
  }
  slots.forEach((s) => s.events.sort((a, b) => a.year - b.year));

  const currentRaw = calcPersonalYear(birthDate, currentYear);
  const upcoming: YearCycleUpcoming[] = [1, 2, 3].map((d) => {
    const y = currentYear + d;
    const raw = calcPersonalYear(birthDate, y);
    return { year: y, number: reduceCycle(raw), rawNumber: raw };
  });

  return {
    slots,
    currentYear,
    currentNumber: reduceCycle(currentRaw),
    currentRaw,
    upcoming,
  };
}

// ===== 9年サイクル・マトリクス（積み重ねて縦に相似性を見る） =====

export type CycleConfidence = "clear" | "soft" | "thin";

export interface MatrixCell {
  year: number;
  age: number;
  position: number; // 1〜9
  events: YearCycleEvent[];
  isCurrent: boolean;
  isFuture: boolean; // 今年より後
}

export interface MatrixRow {
  startYear: number;
  endYear: number;
  ageStart: number;
  ageEnd: number;
  isFuture: boolean; // サイクル全体が未来
  cells: MatrixCell[]; // 長さ9（position 1..9）
}

export interface MatrixColumn {
  position: number; // 1〜9
  label: string;
  hint: string;
  events: YearCycleEvent[]; // その位置に起きた過去の出来事（全サイクル）
  cyclesWithEvents: number; // 出来事のあったサイクル数（＝繰り返しの強さ）
  confidence: CycleConfidence;
}

export interface CycleMatrix {
  rows: MatrixRow[];
  columns: MatrixColumn[]; // 1..9（深掘り＋確信度）
  currentYear: number;
  currentPosition: number; // 1〜9
  hasFuture: boolean;
}

/** ある年が属する9年サイクルの開始年（＝その年以前で直近のパーソナルイヤー1の年） */
function cycleStartYear(birthDate: string, year: number): number {
  let y = year;
  for (let i = 0; i < 9; i++) {
    if (reduceCycle(calcPersonalYear(birthDate, y)) === 1) return y;
    y--;
  }
  return year;
}

/**
 * 人生を「9年サイクル」ごとの行に積み重ねたマトリクスを作る。
 * 縦（同じ位置＝同じ数の年）に読むと、繰り返し起きた出来事＝相似性が見える。
 * 記録の少ない位置は confidence:"thin" として、無理に意味づけしない。
 */
export function buildCycleMatrix(
  birthDate: string,
  events: { year: number; title: string }[],
  currentYear: number,
  lang: Lang = "ja"
): CycleMatrix {
  const birthYear = Number(birthDate.split("-")[0]) || currentYear;

  const byYear = new Map<number, YearCycleEvent[]>();
  for (const e of events) {
    const raw = calcPersonalYear(birthDate, e.year);
    const arr = byYear.get(e.year) ?? [];
    arr.push({ year: e.year, age: e.year - birthYear, title: e.title, rawNumber: raw });
    byYear.set(e.year, arr);
  }

  const years = events.map((e) => e.year);
  const earliest = years.length ? Math.min(...years) : currentYear;
  const firstStart = cycleStartYear(birthDate, earliest);
  const currentStart = cycleStartYear(birthDate, currentYear);

  const rows: MatrixRow[] = [];
  for (let s = firstStart; s <= currentStart + 9; s += 9) {
    const cells: MatrixCell[] = [];
    for (let p = 1; p <= 9; p++) {
      const y = s + (p - 1);
      cells.push({
        year: y,
        age: y - birthYear,
        position: p,
        events: byYear.get(y) ?? [],
        isCurrent: y === currentYear,
        isFuture: y > currentYear,
      });
    }
    rows.push({
      startYear: s,
      endYear: s + 8,
      ageStart: s - birthYear,
      ageEnd: s + 8 - birthYear,
      isFuture: s > currentYear,
      cells,
    });
  }

  const columns: MatrixColumn[] = [];
  for (let p = 1; p <= 9; p++) {
    const evs: YearCycleEvent[] = [];
    let cyclesWith = 0;
    for (const row of rows) {
      const cell = row.cells[p - 1];
      if (cell.isFuture) continue; // 未来は判定に含めない
      if (cell.events.length > 0) {
        cyclesWith++;
        evs.push(...cell.events);
      }
    }
    evs.sort((a, b) => a.year - b.year);
    const confidence: CycleConfidence =
      cyclesWith >= 3 ? "clear" : cyclesWith === 2 ? "soft" : "thin";
    const cl = cycleLabelOf(p, lang);
    columns.push({
      position: p,
      label: cl.label,
      hint: cl.hint,
      events: evs,
      cyclesWithEvents: cyclesWith,
      confidence,
    });
  }

  return {
    rows,
    columns,
    currentYear,
    currentPosition: reduceCycle(calcPersonalYear(birthDate, currentYear)),
    hasFuture: rows.some((r) => r.isFuture),
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
  birthDate: string,
  lang: Lang = "ja"
): LifePatternInsight {
  const birthYear = Number(birthDate.split("-")[0]) || 0;
  const lp = calcLifePathNumber(birthDate);
  const lpMeaning = getLifePathMeaning(lp, lang);

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
    const c = base.recurringCategory.category;
    t.push(
      lang === "ko"
        ? `당신의 인생은 「${c}」을(를) 축으로 움직여 온 것 같습니다. 여기에 당신의 소중한 테마가 깃들어 있습니다.`
        : `あなたの人生は「${c}」を軸に動いてきたようです。ここにあなたの大切なテーマが宿っています。`
    );
  }
  if (base.challengeCategory) {
    const c = base.challengeCategory.category;
    t.push(
      lang === "ko"
        ? `「${c}」에서는 힘든 국면도 있었던 것 같지만, 그곳을 지날 때마다 당신은 강해지고 있습니다. 과제는 당신의 사명의 이면일지도 모릅니다.`
        : `「${c}」では苦しい局面もあったようですが、そこを通るたびにあなたは強くなっています。課題は、あなたの使命の裏返しかもしれません。`
    );
  }
  if (milestoneCount >= 2) {
    t.push(
      lang === "ko"
        ? `큰 사건의 대부분이 별의 전환점(토성 회귀 등 인생의 전환기)과 겹칩니다. 당신은 "인생의 리듬"에 따라 걸어온 사람입니다.`
        : `大きな出来事の多くが、星の節目（土星回帰などの人生の転換期）と重なっています。あなたは"人生のリズム"に沿って歩んできた人です。`
    );
  }
  t.push(
    lang === "ko"
      ? `핵심이 되는 강점은 「${lpMeaning.title}」＝${lpMeaning.strength}. 이 힘이 지금까지의 사건들의 밑바닥에 흐르고 있습니다.`
      : `核となる強みは「${lpMeaning.title}」＝${lpMeaning.strength}。この力が、これまでの出来事の底を流れています。`
  );

  base.tentative = t;
  return base;
}

// ===== 人生物語（出来事×星の巡りを流れる文章に紡ぐ・ルールベース） =====

interface StoryEvent {
  year: number;
  title: string;
  category: string;
  magnitude: number;
  emotion: number;
  learning?: string;
}

export interface LifeStory {
  intro: string;
  chapters: { label: string; text: string }[];
  patterns: string;
  stars: string;
  now: string;
  fullText: string; // コピー用の全文
}

function decadeLabelOf(d: number, lang: Lang = "ja"): string {
  if (lang === "ko") return d === 0 ? "유년기" : `${d}대`;
  return d === 0 ? "幼少期" : `${d}代`;
}

/** その年代の章の文章（重要な出来事を選び、星の節目を織り込む） */
function chapterText(
  evs: StoryEvent[],
  birthYear: number,
  birthDate: string,
  lang: Lang = "ja"
): string {
  const scored = evs.map((e) => {
    const age = e.year - birthYear;
    const hasMs = getAgeMilestones(age).length > 0;
    const score =
      e.magnitude * 2 + (hasMs ? 2 : 0) + (e.emotion <= 2 || e.emotion === 5 ? 1 : 0);
    return { e, age, score };
  });
  const notable = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .sort((a, b) => a.e.year - b.e.year);

  const parts = notable.map(({ e, age }) => {
    const ms = getAgeMilestones(age, lang);
    let s =
      lang === "ko" ? `${age}세 때, ${e.title}. ` : `${age}歳のとき、${e.title}。`;
    if (ms.length > 0 && e.magnitude >= 2) {
      s +=
        lang === "ko"
          ? `마침 ${ms[0].label}——${ms[0].theme}의 시기였습니다. `
          : `ちょうど${ms[0].label}——${ms[0].theme}の時期でした。`;
    } else if (e.magnitude === 3) {
      const py = reduceCycle(calcPersonalYear(birthDate, e.year));
      const label = cycleLabelOf(py, lang).label;
      s +=
        lang === "ko"
          ? `수비 ${py} 「${label}」의 해의, 큰 전환점입니다. `
          : `数秘${py}「${label}」の年の、大きな節目です。`;
    }
    return s;
  });

  let text = parts.join("");
  const more = evs.length - notable.length;
  if (more > 0)
    text +=
      lang === "ko"
        ? `(이 밖에도 ${more}건의 발자취가 있었습니다.)`
        : `（このほかにも${more}件の歩みがありました。）`;
  return text;
}

/**
 * 年表から「人生物語」を紡ぐ。出来事を年代ごとの章にまとめ、
 * 星の節目（土星回帰など）やパーソナルイヤーの巡りが人生と重なった部分を織り込む。
 */
export function buildLifeStory(
  birthDate: string,
  events: StoryEvent[],
  currentYear: number,
  lang: Lang = "ja"
): LifeStory {
  const birthYear = Number(birthDate.split("-")[0]) || currentYear;
  const lp = calcLifePathNumber(birthDate);
  const lpM = getLifePathMeaning(lp, lang);

  const sorted = [...events].sort((a, b) => a.year - b.year);
  const firstYear = sorted.length ? sorted[0].year : currentYear;
  const lastYear = sorted.length ? sorted[sorted.length - 1].year : currentYear;

  const intro =
    lang === "ko"
      ? `이것은 ${firstYear}년부터 ${lastYear}년까지의, 당신의 이야기입니다. ${events.length}개의 사건이 지금의 당신을 만들어 왔습니다. 수비 ${lp} 「${lpM.title}」의 영혼을 지닌 당신의 발자취를, 살며시 따라가 봅시다.`
      : `これは、${firstYear}年から${lastYear}年までの、あなたの物語です。${events.length}の出来事が、今のあなたをかたち作ってきました。数秘${lp}「${lpM.title}」の魂を持つあなたの歩みを、そっとたどってみましょう。`;

  // 年代ごとの章
  const byDecade = new Map<number, StoryEvent[]>();
  for (const e of sorted) {
    const d = Math.floor(Math.max(0, e.year - birthYear) / 10) * 10;
    const arr = byDecade.get(d) ?? [];
    arr.push(e);
    byDecade.set(d, arr);
  }
  const chapters = [...byDecade.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([d, evs]) => ({
      label: decadeLabelOf(d, lang),
      text: chapterText(evs, birthYear, birthDate, lang),
    }));

  // 繰り返すテーマ
  const insight = analyzeLifePatterns(events, birthDate, lang);
  const patterns = insight.tentative.join(" ");

  // 星との重なり
  let milestoneBig = 0;
  let py1Big = 0;
  for (const e of events) {
    const age = e.year - birthYear;
    if (getAgeMilestones(age).length > 0 && e.magnitude >= 2) milestoneBig++;
    if (reduceCycle(calcPersonalYear(birthDate, e.year)) === 1 && e.magnitude >= 2) py1Big++;
  }
  const starParts: string[] = [];
  if (milestoneBig >= 2) {
    starParts.push(
      lang === "ko"
        ? `큰 사건의 대부분이 별의 전환점(토성 회귀 등 인생의 전환기)과 겹칩니다. 당신은 "인생의 리듬"에 따라 걸어온 사람입니다.`
        : `大きな出来事の多くが、星の節目（土星回帰などの人生の転換期）と重なっています。あなたは"人生のリズム"に沿って歩んできた人です。`
    );
  }
  if (py1Big >= 2) {
    starParts.push(
      lang === "ko"
        ? `수비 「1(시작의 해)」에 새로운 한 걸음을 내딛는 경향이 뚜렷하게 나타납니다——이것이 당신의 "시작하는 방식의 버릇"입니다.`
        : `数秘「1（始まりの年）」に新しい一歩を踏み出す傾向がはっきり出ています——これがあなたの"始め方のクセ"です。`
    );
  }
  if (starParts.length === 0) {
    starParts.push(
      lang === "ko"
        ? `사건을 더 적어 갈수록 별의 순환과의 겹침이 보이기 시작합니다.`
        : `出来事を書き足していくほど、星の巡りとの重なりが見えてきます。`
    );
  }
  const stars = starParts.join(" ");

  // 今、そしてこれから
  const nowN = reduceCycle(calcPersonalYear(birthDate, currentYear));
  const nowM = getPersonalYearMeaning(nowN, lang);
  const nowLabel = cycleLabelOf(nowN, lang).label;
  const now =
    lang === "ko"
      ? `그리고 지금, ${currentYear}년. 당신은 수비 ${nowN} 「${nowLabel}」의 해에 있습니다. ${nowM.theme}. ${nowM.advice}. 이 이야기는 아직 계속됩니다.`
      : `そして今、${currentYear}年。あなたは数秘${nowN}「${nowLabel}」の年にいます。${nowM.theme}。${nowM.advice}。この物語は、まだ続いていきます。`;

  const secPatterns = lang === "ko" ? "반복되는 테마" : "繰り返すテーマ";
  const secStars = lang === "ko" ? "별과의 겹침" : "星との重なり";
  const secNow = lang === "ko" ? "지금, 그리고 앞으로" : "今、そしてこれから";

  const fullText = [
    intro,
    ...chapters.map((c) => `【${c.label}】\n${c.text}`),
    `【${secPatterns}】\n${patterns}`,
    `【${secStars}】\n${stars}`,
    `【${secNow}】\n${now}`,
  ].join("\n\n");

  return { intro, chapters, patterns, stars, now, fullText };
}
