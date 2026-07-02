/**
 * self-manual.ts — 「わたしの取扱説明書（トリセツ）」を各占術データから組み立てる
 *
 * プロフィール（生年月日・出生時刻）から、数秘・マヤ・四柱推命・算命学・九星の
 * 結果を統合し、実用的な"自分の説明書"として構造化する。ルールベース・API不要。
 */

import { calcNumerology } from "./numerology";
import { calcMayan } from "./mayan";
import { calcFourPillars } from "./four-pillars";
import { calcSanmeigaku } from "./sanmeigaku";
import { calcNineStar } from "./nine-star";
import { calcLuckyInfo } from "./lucky";
import {
  getNumerologyDetail,
  getMayanDetail,
  getFourPillarsDetail,
  getSanmeigakuDetail,
  getNineStarDetail,
  type DetailedTrait,
} from "./detailed-traits";
import { CYCLE_LABELS } from "./life-timeline";

export interface ManualDetail {
  source: string; // 占術名
  label: string; // その占術での自分（星・数）
  trait: DetailedTrait; // character / work / relationship / advice
}

export interface SelfManualSpec {
  lifePath: string;
  dayMaster: string;
  mainStar: string;
  honmeisei: string;
  mayan: string;
  catchphrase: string;
}

export interface SelfManualCharge {
  color: string;
  colorHex: string;
  number: number;
  direction: string;
  luckyDirections: string[];
  moonPhase: string;
  moonEmoji: string;
  favorableElement: string;
  favorableReason: string;
}

export interface SelfManualTiming {
  personalYear: number;
  cycleLabel: string;
  cycleHint: string;
  personalYearTheme: string;
  personalYearAdvice: string;
  nineStarTheme: string;
  nineStarAdvice: string;
}

export interface SelfManual {
  hasTime: boolean;
  spec: SelfManualSpec;
  strengths: { source: string; text: string }[];
  details: ManualDetail[];
  charge: SelfManualCharge;
  cautions: string[];
  timing: SelfManualTiming;
  forOthers: string;
}

/** マスターナンバーを1〜9へ */
function toBase(n: number): number {
  if (n === 11) return 2;
  if (n === 22) return 4;
  if (n === 33) return 6;
  return n;
}

/** 強み文字列の先頭語を取り出す（「独立心・忍耐力・信念」→「独立心」） */
function firstPhrase(s: string): string {
  return s.split(/[・、,／/]/)[0]?.trim() || s;
}

export function buildSelfManual(
  birthDate: string,
  birthTime: string,
  today: Date
): SelfManual {
  const num = calcNumerology(birthDate, today);
  const mayan = calcMayan(birthDate);
  const fp = calcFourPillars(birthDate, birthTime || undefined);
  const sanmei = calcSanmeigaku(birthDate);
  const nine = calcNineStar(birthDate, today.getFullYear());
  const lucky = calcLuckyInfo(today, num.lifePathNumber);

  const details: ManualDetail[] = [
    {
      source: "数秘術",
      label: `${num.lifePathNumber}・${num.lifePathMeaning.title}`,
      trait: getNumerologyDetail(num.lifePathNumber),
    },
    {
      source: "マヤ暦",
      label: mayan.solarSeal.name,
      trait: getMayanDetail(mayan.solarSeal.name),
    },
    {
      source: "四柱推命",
      label: `${fp.dayMaster.stem}・${fp.dayMaster.title}`,
      trait: getFourPillarsDetail(fp.dayMaster.stem),
    },
    {
      source: "算命学",
      label: sanmei.mainStar.name,
      trait: getSanmeigakuDetail(sanmei.mainStar.name),
    },
    {
      source: "九星気学",
      label: nine.honmeisei.name,
      trait: getNineStarDetail(nine.honmeisei.name),
    },
  ];

  const strengths = [
    { source: "数秘", text: num.lifePathMeaning.strength },
    { source: "四柱推命", text: fp.dayMaster.strength },
    { source: "算命学", text: sanmei.mainStar.strength },
    { source: "九星気学", text: nine.honmeisei.strength },
  ].filter((s) => s.text);

  const cyc = CYCLE_LABELS[toBase(num.personalYear)];

  const spec: SelfManualSpec = {
    lifePath: `${num.lifePathNumber}・${num.lifePathMeaning.title}`,
    dayMaster: `${fp.dayMaster.stem}・${fp.dayMaster.title}（${fp.dayMaster.element}）`,
    mainStar: `${sanmei.mainStar.name}（${sanmei.mainStar.keyword}）`,
    honmeisei: nine.honmeisei.name,
    mayan: `${mayan.solarSeal.name} × ${mayan.waveSpell.name}`,
    catchphrase: `「${num.lifePathMeaning.title}」の魂を持つ、${sanmei.mainStar.keyword}の人。${num.lifePathMeaning.theme}。`,
  };

  const charge: SelfManualCharge = {
    color: lucky.color.name,
    colorHex: lucky.color.hex,
    number: lucky.number,
    direction: lucky.direction,
    luckyDirections: nine.luckyDirections,
    moonPhase: lucky.moonPhase,
    moonEmoji: lucky.moonEmoji,
    favorableElement: fp.favorableElement.element,
    favorableReason: fp.favorableElement.reason,
  };

  const cautions = [
    `【宿命のテーマ】${sanmei.tenchu.name}：${sanmei.tenchu.theme}`,
    `【今年の注意】${nine.yearPosition.caution}`,
  ];

  const timing: SelfManualTiming = {
    personalYear: num.personalYear,
    cycleLabel: cyc.label,
    cycleHint: cyc.hint,
    personalYearTheme: num.personalYearMeaning.theme,
    personalYearAdvice: num.personalYearMeaning.advice,
    nineStarTheme: nine.yearPosition.theme,
    nineStarAdvice: nine.yearPosition.advice,
  };

  const forOthers = `私は「${num.lifePathMeaning.title}」タイプ。${sanmei.mainStar.keyword}を大切にし、${fp.dayMaster.title}のような在り方で歩みます。強みは${firstPhrase(num.lifePathMeaning.strength)}。元気が回復するのは${lucky.color.name}・ラッキーナンバー${lucky.number}・${firstPhrase(charge.favorableElement)}の気に触れるとき。こう接してもらえると、いちばん力を発揮できます。`;

  return { hasTime: !!birthTime, spec, strengths, details, charge, cautions, timing, forOthers };
}
