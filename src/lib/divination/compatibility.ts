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

/**
 * 占術ごとの「人生の側面」と、モードごとの位置づけ。
 * アドバイス文面の生成で「○○の観点で...」と具体的に表現するための辞書。
 */
const DIMENSION_META: Record<
  "numerology" | "mayan" | "nineStar" | "fourPillars",
  { name: string; aspect: Record<RelationMode, string> }
> = {
  numerology: {
    name: "数秘術",
    aspect: {
      love: "価値観・人生観の方向性",
      business: "目的意識・キャリア観の方向性",
      family: "生き方・人生観の重なり",
    },
  },
  mayan: {
    name: "マヤ暦",
    aspect: {
      love: "魂のリズム・本質的な惹かれ合い",
      business: "発想・直感のリズム",
      family: "本質的な共鳴・絆の深さ",
    },
  },
  nineStar: {
    name: "九星気学",
    aspect: {
      love: "気のエネルギーの相性",
      business: "立場・役割の相性（五行関係）",
      family: "日常エネルギーの調和",
    },
  },
  fourPillars: {
    name: "四柱推命",
    aspect: {
      love: "生まれ持った性質の合い方",
      business: "実務的な噛み合い",
      family: "日常の関わり方の相性",
    },
  },
};

interface DimensionLite {
  key: "numerology" | "mayan" | "nineStar" | "fourPillars";
  score: number;
  label: string;
  detail: string;
}

/** 占術ごとの「強さの位置づけ語」をモード×スコアで返す */
function modePhrase(mode: RelationMode, score: number): string {
  const high = score >= 80;
  const mid = score >= 60 && score < 80;
  if (mode === "love") return high ? "深く惹かれ合う基盤" : mid ? "穏やかに共鳴できる土台" : "違いから学べる余地";
  if (mode === "business") return high ? "強力な協働基盤" : mid ? "補完的な役割分担が機能" : "視点の多様性が武器";
  return high ? "安心感のある絆の素地" : mid ? "互いを支え合う土台" : "成長を促し合う伸びしろ";
}

/** 注意点の文脈語：低いと「すれ違い」、中庸だと「微調整ポイント」になる */
function modeCautionPhrase(mode: RelationMode, score: number): string {
  if (score < 50) {
    if (mode === "love") return "感情のすれ違いやテンポの差";
    if (mode === "business") return "決定プロセスや進め方のズレ";
    return "価値観の摩擦・距離感の取り方";
  }
  if (mode === "love") return "言葉にしないと伝わりにくい点";
  if (mode === "business") return "期待値のすり合わせが必要な点";
  return "踏み込み方の調整が必要な点";
}

function buildStrengthMsg(top: DimensionLite, mode: RelationMode): string {
  const meta = DIMENSION_META[top.key];
  return `${meta.name}（${meta.aspect[mode]}）で${top.score}点と最も高く、${modePhrase(mode, top.score)}になります。${top.detail}`;
}

function buildCautionMsg(bottom: DimensionLite, mode: RelationMode): string {
  const meta = DIMENSION_META[bottom.key];
  if (bottom.score >= 70) {
    return `4占術すべてで${bottom.score}点以上と全体的に高水準。${meta.name}の観点でも安定しており、特に大きな注意点はありません。`;
  }
  return `${meta.name}（${meta.aspect[mode]}）が${bottom.score}点とやや低く、${modeCautionPhrase(mode, bottom.score)}が起きやすい面があります。${bottom.detail}`;
}

/** ばらつき・スコア帯から「どんなタイプの相性か」を5分類して具体的に説明する */
function buildAdviceMsg(
  overall: number,
  top: DimensionLite,
  bottom: DimensionLite,
  mode: RelationMode
): string {
  const variance = top.score - bottom.score;
  const topMeta = DIMENSION_META[top.key];
  const bottomMeta = DIMENSION_META[bottom.key];

  type Pattern = "balanced-high" | "balanced-mid" | "balanced-low" | "spike-high" | "spike-low";
  let pattern: Pattern;
  if (variance < 15 && overall >= 72) pattern = "balanced-high";
  else if (variance < 15 && overall >= 55) pattern = "balanced-mid";
  else if (variance < 15) pattern = "balanced-low";
  else if (top.score >= 80) pattern = "spike-high";
  else pattern = "spike-low";

  const goal: Record<RelationMode, string> = {
    love: "関係を深めるコツ",
    business: "協働を成功させるコツ",
    family: "絆を育むコツ",
  };

  switch (pattern) {
    case "balanced-high":
      return `総合${overall}点。4占術すべてで高水準、ばらつきも小さい安定型のペア。本質から相性が良く、特別な工夫なしに自然な関係が築けます。${goal[mode]}は、当たり前すぎて見えなくなりがちな相手の良さを言葉にして伝えること。`;
    case "balanced-mid":
      return `総合${overall}点。4占術すべてが中庸、ばらつきも小さいバランス型。派手な相性ではなく、穏やかに長く続くタイプです。${goal[mode]}は、相手の小さな変化に気づくこと。安定のなかに変化を見つけられると関係が深まります。`;
    case "balanced-low":
      return `総合${overall}点。4占術すべてで違いが大きく、ばらつきも小さいチャレンジ型。表面的な居心地より、共に乗り越えるテーマがある関係です。真剣に向き合う覚悟があるなら、他では得られない唯一無二の絆になり得ます。`;
    case "spike-high":
      return `総合${overall}点。${topMeta.name}が際立って強く（${top.score}点）、${bottomMeta.name}は控えめ（${bottom.score}点）の凸凹型。${topMeta.aspect[mode]}を活かす場面で関係が輝きます。${bottomMeta.aspect[mode]}の領域では、無理に同じテンポを求めず距離感を意識すると◎。`;
    case "spike-low":
      return `総合${overall}点。${topMeta.name}（${top.score}点）と${bottomMeta.name}（${bottom.score}点）の差が大きく、得意・苦手がはっきり分かれるペア。${topMeta.aspect[mode]}で繋がっている時間を意識的に増やし、${bottomMeta.aspect[mode]}の領域は無理に合わせず割り切ると上手くいきます。`;
  }
}

function buildAdvice(
  result: {
    overall: number;
    numerology: CompatibilityDimension;
    mayan: CompatibilityDimension;
    nineStar: CompatibilityDimension;
    fourPillars: CompatibilityDimension;
  },
  mode: RelationMode
): { advice: string; strength: string; caution: string } {
  const dims: DimensionLite[] = [
    { key: "numerology", ...result.numerology },
    { key: "mayan", ...result.mayan },
    { key: "nineStar", ...result.nineStar },
    { key: "fourPillars", ...result.fourPillars },
  ];
  const sorted = [...dims].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  return {
    advice: buildAdviceMsg(result.overall, top, bottom, mode),
    strength: buildStrengthMsg(top, mode),
    caution: buildCautionMsg(bottom, mode),
  };
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

  const { advice, strength, caution } = buildAdvice(
    { overall, numerology: n, mayan: m, nineStar: ns, fourPillars: fp },
    mode
  );

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
