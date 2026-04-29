/**
 * 相性診断エンジン
 * 4占術で2人の相性をスコア化する
 */

import { calcLifePathNumber } from "./numerology";
import { calcKinNumber, calcGalacticTone, calcSolarSealIndex } from "./mayan";
import { calcHonmeisei } from "./nine-star";
import { calcDayPillar, HEAVENLY_STEMS } from "./stems-branches";

export type RelationMode = "love" | "business" | "family";

export interface CompatibilityDimension {
  score: number; // 0-100
  label: string;
  detail: string;
}

export interface CompatibilityResult {
  overall: number;
  numerology: CompatibilityDimension;
  mayan: CompatibilityDimension;
  nineStar: CompatibilityDimension;
  fourPillars: CompatibilityDimension;
  advice: string;
  strength: string;
  caution: string;
}

// --- 数秘術 ---

/** ライフパスナンバーの組み合わせによる相性スコア */
function numerologyScore(a: number, b: number): number {
  // 同じ数: 70（似すぎる面もあり）
  if (a === b) return 70;
  // マスターナンバー同士は高相性
  if ([11, 22, 33].includes(a) && [11, 22, 33].includes(b)) return 85;
  // 相性の高いペア
  const highPairs: [number, number][] = [
    [1, 3], [1, 5], [1, 9],
    [2, 6], [2, 8], [2, 4],
    [3, 5], [3, 9], [3, 6],
    [4, 8], [4, 6], [4, 7],
    [5, 7], [5, 9],
    [6, 9],
    [7, 9],
  ];
  const pair: [number, number] = a < b ? [a, b] : [b, a];
  if (highPairs.some((p) => p[0] === pair[0] && p[1] === pair[1])) return 80;

  // 相性の難しいペア（違いから学ぶ関係）
  const challengingPairs: [number, number][] = [
    [1, 2], [1, 6], [1, 7],
    [4, 5], [5, 6], [5, 8],
    [7, 8], [8, 9],
  ];
  if (challengingPairs.some((p) => p[0] === pair[0] && p[1] === pair[1])) return 45;

  return 60;
}

function numerologyDetail(score: number, a: number, b: number): string {
  if (score >= 80) return `ライフパス ${a} × ${b} は自然に高め合える組み合わせ。お互いの個性がエネルギーを引き出します`;
  if (score >= 70) return `ライフパス ${a} × ${b} は共鳴しやすいペア。同じ価値観で進める関係です`;
  if (score >= 55) return `ライフパス ${a} × ${b} はバランス型。違いを理解し合うと深まります`;
  return `ライフパス ${a} × ${b} は違いから学ぶ組み合わせ。違いをリスペクトすると成長が加速します`;
}

function numerology(birthA: string, birthB: string): CompatibilityDimension {
  const a = calcLifePathNumber(birthA);
  const b = calcLifePathNumber(birthB);
  const score = numerologyScore(a, b);
  return {
    score,
    label: `${a} × ${b}`,
    detail: numerologyDetail(score, a, b),
  };
}

// --- マヤ暦 ---

function mayan(birthA: string, birthB: string): CompatibilityDimension {
  const kinA = calcKinNumber(birthA);
  const kinB = calcKinNumber(birthB);
  const sealA = calcSolarSealIndex(kinA);
  const sealB = calcSolarSealIndex(kinB);
  const toneA = calcGalacticTone(kinA);
  const toneB = calcGalacticTone(kinB);

  let label = "";
  let detail = "";
  let score = 60;

  // 類似KIN: 同じ紋章
  if (sealA === sealB && kinA !== kinB) {
    score = 90;
    label = "類似KIN";
    detail = "同じ紋章を持つ類似関係。本質的に似た価値観で深く共鳴します";
  }
  // 同じKIN
  else if (kinA === kinB) {
    score = 85;
    label = "同一KIN";
    detail = "全く同じKIN。双子のような深い理解と共感が生まれる関係";
  }
  // ガイドKIN: 同じ音
  else if (toneA === toneB) {
    score = 80;
    label = "ガイドKIN";
    detail = "同じ銀河の音を持つ導き合う関係。リズムが合い、お互いの支えになります";
  }
  // 鏡KIN: KIN差が合計で261、または紋章が鏡の関係(足して19)
  else if ((kinA + kinB) % 260 === 1 || sealA + sealB === 19) {
    score = 75;
    label = "鏡KIN";
    detail = "お互いを映し出す鏡の関係。相手を通して自分を知る学びがある組み合わせ";
  }
  // 反対KIN: KIN差がちょうど130
  else if (Math.abs(kinA - kinB) === 130) {
    score = 70;
    label = "反対KIN";
    detail = "正反対の個性を持つ関係。真逆だからこそ補い合い、人生を広げ合える縁";
  }
  // 神秘KIN: 音が合計14、紋章の色が違う
  else if (toneA + toneB === 14) {
    score = 78;
    label = "神秘KIN";
    detail = "引き寄せ合う神秘の関係。理由はわからないけれど惹かれ合う不思議な縁";
  } else {
    score = 60;
    label = "通常関係";
    detail = "自然体でお互いの個性を尊重する関係。無理のない距離感が心地よい組み合わせ";
  }

  return { score, label, detail };
}

// --- 九星気学（五行相性）---

const STAR_ELEMENT: Record<number, "木" | "火" | "土" | "金" | "水"> = {
  1: "水", 2: "土", 3: "木", 4: "木", 5: "土",
  6: "金", 7: "金", 8: "土", 9: "火",
};

const STAR_NAME: Record<number, string> = {
  1: "一白水星", 2: "二黒土星", 3: "三碧木星", 4: "四緑木星", 5: "五黄土星",
  6: "六白金星", 7: "七赤金星", 8: "八白土星", 9: "九紫火星",
};

function nineStar(birthA: string, birthB: string): CompatibilityDimension {
  const a = calcHonmeisei(birthA);
  const b = calcHonmeisei(birthB);
  const elA = STAR_ELEMENT[a];
  const elB = STAR_ELEMENT[b];

  const generates: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };

  let score = 60;
  let detail = "";

  if (elA === elB) {
    score = 75;
    detail = `同じ${elA}の気を持つ比和の関係。価値観が近く、穏やかに協力できます`;
  } else if (generates[elA] === elB) {
    score = 85;
    detail = `${STAR_NAME[a]}が${STAR_NAME[b]}を生む相生関係。あなたが相手を支え育てる立場`;
  } else if (generates[elB] === elA) {
    score = 85;
    detail = `${STAR_NAME[b]}が${STAR_NAME[a]}を生む相生関係。相手があなたを支え育ててくれる立場`;
  } else {
    score = 45;
    detail = `${elA}と${elB}は相剋の関係。違いが大きいぶん、違いを尊重すれば成長を促し合えます`;
  }

  return {
    score,
    label: `${STAR_NAME[a]} × ${STAR_NAME[b]}`,
    detail,
  };
}

// --- 四柱推命（日主の合・冲）---

/** 十干の合（天干合）: 甲己・乙庚・丙辛・丁壬・戊癸 */
const STEM_UNION: Record<string, string> = {
  甲: "己", 己: "甲",
  乙: "庚", 庚: "乙",
  丙: "辛", 辛: "丙",
  丁: "壬", 壬: "丁",
  戊: "癸", 癸: "戊",
};

/** 十干の冲（天干剋）: 対角の関係 */
const STEM_CLASH: Record<string, string> = {
  甲: "庚", 庚: "甲",
  乙: "辛", 辛: "乙",
  丙: "壬", 壬: "丙",
  丁: "癸", 癸: "丁",
};

function fourPillars(birthA: string, birthB: string): CompatibilityDimension {
  const [ay, am, ad] = birthA.split("-").map(Number);
  const [by, bm, bd] = birthB.split("-").map(Number);
  const pillarA = calcDayPillar(ay, am, ad);
  const pillarB = calcDayPillar(by, bm, bd);
  const stemA = pillarA.stem.name;
  const stemB = pillarB.stem.name;

  let score = 60;
  let detail = "";

  if (stemA === stemB) {
    score = 72;
    detail = `日主が同じ${stemA}。似た本質を持ち、安心して自然体でいられる関係`;
  } else if (STEM_UNION[stemA] === stemB) {
    score = 88;
    detail = `日主${stemA}と${stemB}は天干合。引き合って調和を生む、最も親和性の高い組み合わせ`;
  } else if (STEM_CLASH[stemA] === stemB) {
    score = 42;
    detail = `日主${stemA}と${stemB}は天干剋。刺激の多い関係。違いを尊重できれば大きく成長できます`;
  } else {
    // 五行の相生相剋で判定
    const elA = pillarA.stem.element;
    const elB = pillarB.stem.element;
    const generates: Record<string, string> = {
      木: "火", 火: "土", 土: "金", 金: "水", 水: "木",
    };
    if (elA === elB) {
      score = 68;
      detail = `五行が同じ${elA}。価値観が近く、穏やかに付き合える関係`;
    } else if (generates[elA] === elB || generates[elB] === elA) {
      score = 75;
      detail = `${elA}と${elB}は相生関係。自然と流れが生まれる良い組み合わせ`;
    } else {
      score = 50;
      detail = `${elA}と${elB}は相剋関係。違いから学ぶ関係で、お互いを理解すれば成長し合えます`;
    }
  }

  return {
    score,
    label: `日主 ${stemA} × ${stemB}`,
    detail,
  };
}

// --- 総合 ---

const MODE_WEIGHTS: Record<RelationMode, { numerology: number; mayan: number; nineStar: number; fourPillars: number }> = {
  love: { numerology: 1.2, mayan: 1.3, nineStar: 0.9, fourPillars: 1.1 },
  business: { numerology: 0.9, mayan: 0.8, nineStar: 1.2, fourPillars: 1.3 },
  family: { numerology: 1.0, mayan: 1.1, nineStar: 1.1, fourPillars: 1.0 },
};

export const MODE_LABELS: Record<RelationMode, string> = {
  love: "恋愛・パートナー",
  business: "ビジネス・仕事",
  family: "家族・友人",
};

function buildAdvice(score: number, mode: RelationMode): { advice: string; strength: string; caution: string } {
  const modeMap: Record<RelationMode, { high: string; mid: string; low: string; strengthHigh: string; strengthMid: string; strengthLow: string; cautionHigh: string; cautionMid: string; cautionLow: string }> = {
    love: {
      high: "自然に惹かれ合い、安心できる関係。深い絆が育つ組み合わせです",
      mid: "お互いを尊重し合える関係。違いを受け入れることで関係が深まります",
      low: "最初は違和感を感じやすい関係。対話を重ねることで、唯一無二の絆になり得ます",
      strengthHigh: "感性が共鳴しやすく、言わなくても伝わる瞬間が多い",
      strengthMid: "適度な距離感で長く続く関係を築ける",
      strengthLow: "違いを理解した時、他の誰とも得られない深い繋がりになる",
      cautionHigh: "似すぎて同じ弱点を持つことも。外の世界との交流も大切に",
      cautionMid: "遠慮しすぎず、本音を少しずつ開示していくと深まります",
      cautionLow: "相手を変えようとせず、違いを受け入れる姿勢を忘れずに",
    },
    business: {
      high: "補い合える最高のパートナー。役割分担が自然に決まります",
      mid: "お互いの強みを活かせる関係。事前の役割・期待値合わせが鍵",
      low: "得意分野が真逆。明確な役割分担と合意形成があれば結果を出せます",
      strengthHigh: "意思決定が早く、同じゴールに向かって動ける",
      strengthMid: "お互いの得意・不得意を補完できる",
      strengthLow: "違う視点からアイデアが生まれ、新しい価値を創造できる",
      cautionHigh: "視点が似通うため、異なる意見を持つ第三者を入れると◎",
      cautionMid: "コミュニケーション頻度を意識的に上げると誤解を防げます",
      cautionLow: "感情ではなく事実ベースで対話を。合意書やルール化が効果的",
    },
    family: {
      high: "安心感と信頼が自然に育つ関係。家族や親友として長く続く縁",
      mid: "穏やかでバランスの取れた関係。節目ごとに関係を見直すと良好",
      low: "近すぎると摩擦も。適度な距離感を保つことで良い関係を維持できます",
      strengthHigh: "一緒にいるだけで癒される、帰る場所のような存在",
      strengthMid: "必要な時に支え合える、ちょうど良い距離感",
      strengthLow: "違いがあるからこそ、お互いの世界を広げ合える",
      cautionHigh: "近すぎて依存にならないよう、それぞれの世界も大切に",
      cautionMid: "期待しすぎず、相手の選択を尊重することで関係が続きます",
      cautionLow: "『こうあるべき』を押し付けず、違いを認め合う関わり方を",
    },
  };

  const map = modeMap[mode];
  if (score >= 75) return { advice: map.high, strength: map.strengthHigh, caution: map.cautionHigh };
  if (score >= 55) return { advice: map.mid, strength: map.strengthMid, caution: map.cautionMid };
  return { advice: map.low, strength: map.strengthLow, caution: map.cautionLow };
}

export function calcCompatibility(
  birthA: string,
  birthB: string,
  mode: RelationMode = "love"
): CompatibilityResult {
  const n = numerology(birthA, birthB);
  const m = mayan(birthA, birthB);
  const ns = nineStar(birthA, birthB);
  const fp = fourPillars(birthA, birthB);

  const w = MODE_WEIGHTS[mode];
  const weighted =
    n.score * w.numerology + m.score * w.mayan + ns.score * w.nineStar + fp.score * w.fourPillars;
  const totalWeight = w.numerology + w.mayan + w.nineStar + w.fourPillars;
  const overall = Math.round(weighted / totalWeight);

  const { advice, strength, caution } = buildAdvice(overall, mode);

  return {
    overall,
    numerology: n,
    mayan: m,
    nineStar: ns,
    fourPillars: fp,
    advice,
    strength,
    caution,
  };
}
