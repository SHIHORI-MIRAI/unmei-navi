/**
 * 相性診断エンジン
 * 4占術で2人の相性をスコア化する
 */

import { calcLifePathNumber } from "./numerology";
import { calcKinNumber, calcGalacticTone, calcSolarSealIndex } from "./mayan";
import { calcHonmeisei } from "./nine-star";
import { calcDayPillar, HEAVENLY_STEMS } from "./stems-branches";
import type { Lang } from "@/lib/i18n/dict";
import { elementName, nineStarName } from "@/lib/i18n/fortune-terms";

/** 十干の韓国語読み（天干合・冲の説明文で使用） */
const STEM_KO: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};
const stemKo = (ja: string, lang: Lang): string => (lang === "ko" ? STEM_KO[ja] ?? ja : ja);

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

function numerologyDetail(score: number, a: number, b: number, lang: Lang = "ja"): string {
  if (lang === "ko") {
    if (score >= 80) return `라이프패스 ${a} × ${b}는 자연스럽게 서로를 끌어올리는 조합. 서로의 개성이 에너지를 이끌어냅니다`;
    if (score >= 70) return `라이프패스 ${a} × ${b}는 공명하기 쉬운 페어. 같은 가치관으로 나아가는 관계입니다`;
    if (score >= 55) return `라이프패스 ${a} × ${b}는 균형형. 차이를 서로 이해하면 관계가 깊어집니다`;
    return `라이프패스 ${a} × ${b}는 차이에서 배우는 조합. 차이를 존중하면 성장이 가속됩니다`;
  }
  if (score >= 80) return `ライフパス ${a} × ${b} は自然に高め合える組み合わせ。お互いの個性がエネルギーを引き出します`;
  if (score >= 70) return `ライフパス ${a} × ${b} は共鳴しやすいペア。同じ価値観で進める関係です`;
  if (score >= 55) return `ライフパス ${a} × ${b} はバランス型。違いを理解し合うと深まります`;
  return `ライフパス ${a} × ${b} は違いから学ぶ組み合わせ。違いをリスペクトすると成長が加速します`;
}

function numerology(birthA: string, birthB: string, lang: Lang = "ja"): CompatibilityDimension {
  const a = calcLifePathNumber(birthA);
  const b = calcLifePathNumber(birthB);
  const score = numerologyScore(a, b);
  return {
    score,
    label: `${a} × ${b}`,
    detail: numerologyDetail(score, a, b, lang),
  };
}

// --- マヤ暦 ---

/** マヤ暦の関係タイプ（日本語ラベルをキー）→ 韓国語のラベル・説明 */
const MAYAN_KO: Record<string, { label: string; detail: string }> = {
  "類似KIN": {
    label: "유사 KIN",
    detail: "같은 문장을 지닌 유사 관계. 본질적으로 비슷한 가치관으로 깊이 공명합니다",
  },
  "同一KIN": {
    label: "동일 KIN",
    detail: "완전히 같은 KIN. 쌍둥이 같은 깊은 이해와 공감이 생기는 관계",
  },
  "ガイドKIN": {
    label: "가이드 KIN",
    detail: "같은 은하의 음을 지닌 서로 이끄는 관계. 리듬이 맞아 서로의 버팀목이 됩니다",
  },
  "鏡KIN": {
    label: "거울 KIN",
    detail: "서로를 비추는 거울 관계. 상대를 통해 자신을 알아가는 배움이 있는 조합",
  },
  "反対KIN": {
    label: "반대 KIN",
    detail: "정반대의 개성을 지닌 관계. 정반대이기에 서로 보완하며 인생을 넓혀 주는 인연",
  },
  "神秘KIN": {
    label: "신비 KIN",
    detail: "서로 끌어당기는 신비의 관계. 이유는 모르지만 서로 이끌리는 신기한 인연",
  },
  "通常関係": {
    label: "일반 관계",
    detail: "자연스럽게 서로의 개성을 존중하는 관계. 무리 없는 거리감이 편안한 조합",
  },
};

function mayan(birthA: string, birthB: string, lang: Lang = "ja"): CompatibilityDimension {
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

  if (lang === "ko") {
    const ko = MAYAN_KO[label];
    if (ko) return { score, label: ko.label, detail: ko.detail };
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

function nineStar(birthA: string, birthB: string, lang: Lang = "ja"): CompatibilityDimension {
  const a = calcHonmeisei(birthA);
  const b = calcHonmeisei(birthB);
  const elA = STAR_ELEMENT[a];
  const elB = STAR_ELEMENT[b];

  const generates: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  const ko = lang === "ko";
  const elAName = elementName(elA, lang);
  const elBName = elementName(elB, lang);
  const starA = nineStarName(STAR_NAME[a], lang);
  const starB = nineStarName(STAR_NAME[b], lang);

  let score = 60;
  let detail = "";

  if (elA === elB) {
    score = 75;
    detail = ko
      ? `같은 ${elAName} 기운을 지닌 비화(比和) 관계. 가치관이 가까워 온화하게 협력할 수 있어요`
      : `同じ${elA}の気を持つ比和の関係。価値観が近く、穏やかに協力できます`;
  } else if (generates[elA] === elB) {
    score = 85;
    detail = ko
      ? `${starA}이(가) ${starB}을(를) 낳는 상생 관계. 당신이 상대를 지지하고 키우는 입장`
      : `${STAR_NAME[a]}が${STAR_NAME[b]}を生む相生関係。あなたが相手を支え育てる立場`;
  } else if (generates[elB] === elA) {
    score = 85;
    detail = ko
      ? `${starB}이(가) ${starA}을(를) 낳는 상생 관계. 상대가 당신을 지지하고 키워 주는 입장`
      : `${STAR_NAME[b]}が${STAR_NAME[a]}を生む相生関係。相手があなたを支え育ててくれる立場`;
  } else {
    score = 45;
    detail = ko
      ? `${elAName}과(와) ${elBName}은(는) 상극 관계. 차이가 큰 만큼, 차이를 존중하면 서로 성장을 촉진할 수 있어요`
      : `${elA}と${elB}は相剋の関係。違いが大きいぶん、違いを尊重すれば成長を促し合えます`;
  }

  return {
    score,
    label: `${starA} × ${starB}`,
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

function fourPillars(birthA: string, birthB: string, lang: Lang = "ja"): CompatibilityDimension {
  const [ay, am, ad] = birthA.split("-").map(Number);
  const [by, bm, bd] = birthB.split("-").map(Number);
  const pillarA = calcDayPillar(ay, am, ad);
  const pillarB = calcDayPillar(by, bm, bd);
  const stemA = pillarA.stem.name;
  const stemB = pillarB.stem.name;
  const ko = lang === "ko";
  const sA = stemKo(stemA, lang);
  const sB = stemKo(stemB, lang);

  let score = 60;
  let detail = "";

  if (stemA === stemB) {
    score = 72;
    detail = ko
      ? `일간이 같은 ${sA}. 비슷한 본질을 지녀 안심하고 자연스럽게 있을 수 있는 관계`
      : `日主が同じ${stemA}。似た本質を持ち、安心して自然体でいられる関係`;
  } else if (STEM_UNION[stemA] === stemB) {
    score = 88;
    detail = ko
      ? `일간 ${sA}과(와) ${sB}는 천간합(天干合). 서로 끌어당겨 조화를 이루는, 가장 친화력이 높은 조합`
      : `日主${stemA}と${stemB}は天干合。引き合って調和を生む、最も親和性の高い組み合わせ`;
  } else if (STEM_CLASH[stemA] === stemB) {
    score = 42;
    detail = ko
      ? `일간 ${sA}과(와) ${sB}는 천간충(天干剋). 자극이 많은 관계. 차이를 존중할 수 있다면 크게 성장할 수 있어요`
      : `日主${stemA}と${stemB}は天干剋。刺激の多い関係。違いを尊重できれば大きく成長できます`;
  } else {
    // 五行の相生相剋で判定
    const elA = pillarA.stem.element;
    const elB = pillarB.stem.element;
    const elAName = elementName(elA, lang);
    const elBName = elementName(elB, lang);
    const generates: Record<string, string> = {
      木: "火", 火: "土", 土: "金", 金: "水", 水: "木",
    };
    if (elA === elB) {
      score = 68;
      detail = ko
        ? `오행이 같은 ${elAName}. 가치관이 가까워 온화하게 지낼 수 있는 관계`
        : `五行が同じ${elA}。価値観が近く、穏やかに付き合える関係`;
    } else if (generates[elA] === elB || generates[elB] === elA) {
      score = 75;
      detail = ko
        ? `${elAName}과(와) ${elBName}는 상생 관계. 자연스럽게 흐름이 생기는 좋은 조합`
        : `${elA}と${elB}は相生関係。自然と流れが生まれる良い組み合わせ`;
    } else {
      score = 50;
      detail = ko
        ? `${elAName}과(와) ${elBName}는 상극 관계. 차이에서 배우는 관계로, 서로를 이해하면 함께 성장할 수 있어요`
        : `${elA}と${elB}は相剋関係。違いから学ぶ関係で、お互いを理解すれば成長し合えます`;
    }
  }

  return {
    score,
    label: ko ? `일간 ${sA} × ${sB}` : `日主 ${stemA} × ${stemB}`,
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

export const MODE_LABELS_KO: Record<RelationMode, string> = {
  love: "연애·파트너",
  business: "비즈니스·일",
  family: "가족·친구",
};

/** モードラベルを言語に応じて返す */
export function modeLabel(mode: RelationMode, lang: Lang = "ja"): string {
  return lang === "ko" ? MODE_LABELS_KO[mode] : MODE_LABELS[mode];
}

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

/** DIMENSION_META の韓国語版（構造は同一） */
const DIMENSION_META_KO: Record<
  "numerology" | "mayan" | "nineStar" | "fourPillars",
  { name: string; aspect: Record<RelationMode, string> }
> = {
  numerology: {
    name: "수비학",
    aspect: {
      love: "가치관·인생관의 방향성",
      business: "목적의식·커리어관의 방향성",
      family: "삶의 방식·인생관의 겹침",
    },
  },
  mayan: {
    name: "마야력",
    aspect: {
      love: "영혼의 리듬·본질적인 끌림",
      business: "발상·직관의 리듬",
      family: "본질적인 공명·유대의 깊이",
    },
  },
  nineStar: {
    name: "구성기학",
    aspect: {
      love: "기 에너지의 궁합",
      business: "입장·역할의 궁합(오행 관계)",
      family: "일상 에너지의 조화",
    },
  },
  fourPillars: {
    name: "사주",
    aspect: {
      love: "타고난 성질의 어울림",
      business: "실무적인 맞물림",
      family: "일상적인 관계 방식의 궁합",
    },
  },
};

/** 占術メタを言語に応じて返す */
function dimensionMeta(
  key: "numerology" | "mayan" | "nineStar" | "fourPillars",
  lang: Lang
) {
  return lang === "ko" ? DIMENSION_META_KO[key] : DIMENSION_META[key];
}

interface DimensionLite {
  key: "numerology" | "mayan" | "nineStar" | "fourPillars";
  score: number;
  label: string;
  detail: string;
}

/** 占術ごとの「強さの位置づけ語」をモード×スコアで返す */
function modePhrase(mode: RelationMode, score: number, lang: Lang = "ja"): string {
  const high = score >= 80;
  const mid = score >= 60 && score < 80;
  if (lang === "ko") {
    if (mode === "love") return high ? "깊이 끌리는 기반" : mid ? "온화하게 공명할 수 있는 토대" : "차이에서 배울 수 있는 여지";
    if (mode === "business") return high ? "강력한 협업 기반" : mid ? "상호 보완적인 역할 분담" : "관점의 다양성이라는 강점";
    return high ? "안정감 있는 유대의 바탕" : mid ? "서로 지지하는 토대" : "성장을 촉진하는 잠재력";
  }
  if (mode === "love") return high ? "深く惹かれ合う基盤" : mid ? "穏やかに共鳴できる土台" : "違いから学べる余地";
  if (mode === "business") return high ? "強力な協働基盤" : mid ? "補完的な役割分担が機能" : "視点の多様性が武器";
  return high ? "安心感のある絆の素地" : mid ? "互いを支え合う土台" : "成長を促し合う伸びしろ";
}

/** 注意点の文脈語：低いと「すれ違い」、中庸だと「微調整ポイント」になる */
function modeCautionPhrase(mode: RelationMode, score: number, lang: Lang = "ja"): string {
  if (lang === "ko") {
    if (score < 50) {
      if (mode === "love") return "감정의 엇갈림이나 템포 차이";
      if (mode === "business") return "결정 프로세스나 진행 방식의 어긋남";
      return "가치관의 마찰·거리감 조절";
    }
    if (mode === "love") return "말로 하지 않으면 전해지기 어려운 점";
    if (mode === "business") return "기대치를 맞추는 조율이 필요한 점";
    return "다가가는 방식의 조절이 필요한 점";
  }
  if (score < 50) {
    if (mode === "love") return "感情のすれ違いやテンポの差";
    if (mode === "business") return "決定プロセスや進め方のズレ";
    return "価値観の摩擦・距離感の取り方";
  }
  if (mode === "love") return "言葉にしないと伝わりにくい点";
  if (mode === "business") return "期待値のすり合わせが必要な点";
  return "踏み込み方の調整が必要な点";
}

function buildStrengthMsg(top: DimensionLite, mode: RelationMode, lang: Lang = "ja"): string {
  const meta = dimensionMeta(top.key, lang);
  if (lang === "ko") {
    return `${meta.name} 항목(${meta.aspect[mode]})이 ${top.score}점으로 가장 높으며, ${modePhrase(mode, top.score, lang)}입니다. ${top.detail}`;
  }
  return `${meta.name}（${meta.aspect[mode]}）で${top.score}点と最も高く、${modePhrase(mode, top.score)}になります。${top.detail}`;
}

function buildCautionMsg(bottom: DimensionLite, mode: RelationMode, lang: Lang = "ja"): string {
  const meta = dimensionMeta(bottom.key, lang);
  if (lang === "ko") {
    if (bottom.score >= 70) {
      return `4개 점술 모두 ${bottom.score}점 이상으로 전반적으로 높은 수준입니다. ${meta.name} 항목에서도 안정적이어서, 특별히 큰 주의점은 없습니다.`;
    }
    return `${meta.name} 항목(${meta.aspect[mode]})이 ${bottom.score}점으로 다소 낮아, ${modeCautionPhrase(mode, bottom.score, lang)} 등이 나타나기 쉬운 면이 있습니다. ${bottom.detail}`;
  }
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
  mode: RelationMode,
  lang: Lang = "ja"
): string {
  const variance = top.score - bottom.score;
  const topMeta = dimensionMeta(top.key, lang);
  const bottomMeta = dimensionMeta(bottom.key, lang);

  type Pattern = "balanced-high" | "balanced-mid" | "balanced-low" | "spike-high" | "spike-low";
  let pattern: Pattern;
  if (variance < 15 && overall >= 72) pattern = "balanced-high";
  else if (variance < 15 && overall >= 55) pattern = "balanced-mid";
  else if (variance < 15) pattern = "balanced-low";
  else if (top.score >= 80) pattern = "spike-high";
  else pattern = "spike-low";

  if (lang === "ko") {
    const goalKo: Record<RelationMode, string> = {
      love: "관계를 깊게 하는 요령",
      business: "협업을 성공시키는 요령",
      family: "유대를 키우는 요령",
    };
    switch (pattern) {
      case "balanced-high":
        return `종합 ${overall}점. 4개 점술 모두 높은 수준이고 편차도 작은 안정형 페어. 본질적으로 궁합이 좋아, 특별한 노력 없이도 자연스러운 관계를 쌓을 수 있습니다. ${goalKo[mode]}은 너무 당연해서 안 보이기 쉬운 상대의 좋은 점을 말로 전하는 것입니다.`;
      case "balanced-mid":
        return `종합 ${overall}점. 4개 점술 모두 중간 수준이고 편차도 작은 균형형. 화려한 궁합은 아니지만 온화하게 오래 이어지는 타입입니다. ${goalKo[mode]}은 상대의 작은 변화를 알아차리는 것. 안정 속에서 변화를 발견할 수 있으면 관계가 깊어집니다.`;
      case "balanced-low":
        return `종합 ${overall}점. 4개 점술 모두 차이가 크고 편차는 작은 챌린지형. 표면적인 편안함보다 함께 극복해 나갈 테마가 있는 관계입니다. 진지하게 마주할 각오가 있다면, 다른 데서는 얻을 수 없는 유일무이한 유대가 될 수 있습니다.`;
      case "spike-high":
        return `종합 ${overall}점. ${topMeta.name} 항목이 유독 강하고(${top.score}점), ${bottomMeta.name} 항목은 다소 약한(${bottom.score}점) 굴곡형. ${topMeta.aspect[mode]} 측면을 살리는 장면에서 관계가 빛납니다. ${bottomMeta.aspect[mode]} 측면에서는 무리하게 같은 템포를 요구하지 말고 거리감을 의식하면 좋습니다.`;
      case "spike-low":
        return `종합 ${overall}점. ${topMeta.name} 항목(${top.score}점)과 ${bottomMeta.name} 항목(${bottom.score}점)의 차이가 커서, 잘 맞는 부분과 어려운 부분이 뚜렷하게 나뉘는 페어. ${topMeta.aspect[mode]} 측면으로 이어져 있는 시간을 의식적으로 늘리고, ${bottomMeta.aspect[mode]} 측면은 무리하게 맞추지 말고 받아들이면 잘 풀립니다.`;
    }
  }

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
  mode: RelationMode,
  lang: Lang = "ja"
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
    advice: buildAdviceMsg(result.overall, top, bottom, mode, lang),
    strength: buildStrengthMsg(top, mode, lang),
    caution: buildCautionMsg(bottom, mode, lang),
  };
}

export function calcCompatibility(
  birthA: string,
  birthB: string,
  mode: RelationMode = "love",
  lang: Lang = "ja"
): CompatibilityResult {
  const n = numerology(birthA, birthB, lang);
  const m = mayan(birthA, birthB, lang);
  const ns = nineStar(birthA, birthB, lang);
  const fp = fourPillars(birthA, birthB, lang);

  const w = MODE_WEIGHTS[mode];
  const weighted =
    n.score * w.numerology + m.score * w.mayan + ns.score * w.nineStar + fp.score * w.fourPillars;
  const totalWeight = w.numerology + w.mayan + w.nineStar + w.fourPillars;
  const overall = Math.round(weighted / totalWeight);

  const { advice, strength, caution } = buildAdvice(
    { overall, numerology: n, mayan: m, nineStar: ns, fourPillars: fp },
    mode,
    lang
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
