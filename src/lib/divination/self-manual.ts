/**
 * self-manual.ts — 「わたしの取扱説明書（トリセツ）」を各占術データから組み立てる
 *
 * プロフィール（生年月日・出生時刻）から、数秘・マヤ・四柱推命・算命学・九星の
 * 結果を統合し、実用的な"自分の説明書"として構造化する。ルールベース・API不要。
 *
 * 多言語対応: buildSelfManual に lang を渡すと各セクション文言を各言語で返す。
 * 未指定なら日本語（既存挙動を維持）。localStorage 等の値は日本語表記を正とする。
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
import type { Lang } from "@/lib/i18n/dict";
import {
  mayanSealName,
  nineStarName,
  directionName,
  elementName,
} from "@/lib/i18n/fortune-terms";

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
  usage: string[]; // 正しい使い方（力を発揮する条件）
  avoid: string[]; // してはいけないこと（消耗を避ける）
  troubleshooting: { symptom: string; action: string }[]; // 不調→対処
  timing: SelfManualTiming;
  forOthers: string;
}

// --- 韓国語辞書（多言語対応・日本語をキーに変換） ---

/** 占術名（フル／短縮） */
const SOURCE_KO: Record<string, string> = {
  数秘術: "수비학",
  マヤ暦: "마야력",
  四柱推命: "사주",
  算命学: "산명학",
  九星気学: "구성기학",
  数秘: "수비",
};

/** 四柱推命・日主（日干）の称号と強み */
const DAY_MASTER_KO: Record<string, { title: string; strength: string }> = {
  甲: { title: "거목", strength: "통솔력·정의감·향상심" },
  乙: { title: "화초", strength: "유연성·협조성·끈기" },
  丙: { title: "태양", strength: "열정·카리스마·행동력" },
  丁: { title: "등불", strength: "통찰력·섬세함·예술성" },
  戊: { title: "산", strength: "안정감·포용력·신뢰감" },
  己: { title: "전답", strength: "육성력·겸허함·인내력" },
  庚: { title: "검·쇠", strength: "결단력·실행력·정의감" },
  辛: { title: "보석", strength: "미의식·감수성·품격" },
  壬: { title: "큰바다", strength: "지성·자유·포용력" },
  癸: { title: "비·안개", strength: "직관력·치유·정신성" },
};

/** 算命学・十大主星（中央の主星）の名前・キーワード・強み */
const SANMEI_STAR_KO: Record<
  string,
  { name: string; keyword: string; strength: string }
> = {
  貫索星: { name: "관삭성", keyword: "자립·수비", strength: "독립심·인내력·신념" },
  石門星: { name: "석문성", keyword: "사교·동료", strength: "협조성·사교성·중개력" },
  龍高星: { name: "용고성", keyword: "지혜·방랑", strength: "지식욕·모험심·개혁력" },
  玉堂星: { name: "옥당성", keyword: "학문·모성", strength: "학문·교육력·모성" },
  車騎星: { name: "차기성", keyword: "행동·투쟁", strength: "행동력·투쟁심·스피드" },
  牽牛星: { name: "견우성", keyword: "명예·책임", strength: "책임감·품격·조직력" },
  禄存星: { name: "녹존성", keyword: "매력·재물", strength: "인간적 매력·경제력·봉사정신" },
  司禄星: { name: "사록성", keyword: "축적·견실", strength: "견실함·축재력·안정감" },
  鳳閣星: { name: "봉각성", keyword: "낙관·표현", strength: "낙관성·표현력·너그러움" },
  調舒星: { name: "조서성", keyword: "감성·예술", strength: "감성·예술성·직관력" },
};

/** 算命学・天中殺グループの名前・テーマ・意味 */
const TENCHU_KO: Record<
  string,
  { name: string; theme: string; meaning: string }
> = {
  戌亥天中殺: {
    name: "술해천중살",
    theme: "자립하여 새로운 길을 개척하는 힘을 지녔습니다. 가문을 넘어선 삶의 방식이 길합니다",
    meaning: "초대운. 부모의 힘에 기대지 않고 스스로 인생을 개척합니다. 북서의 기운이 부족합니다",
  },
  申酉天中殺: {
    name: "신유천중살",
    theme: "과정을 즐기는 삶의 방식이 길합니다. 남을 위해 움직이면 운이 열립니다",
    meaning: "서방의 기운이 부족합니다. 결과나 돈에 지나치게 집착하면 운이 떨어집니다",
  },
  午未天中殺: {
    name: "오미천중살",
    theme: "자신의 힘으로 길을 개척합니다. 만년을 향해 운기가 상승합니다",
    meaning: "말대운. 가문이나 혈연의 얽매임에서 자유로워질 수 있는 별입니다",
  },
  辰巳天中殺: {
    name: "진사천중살",
    theme: "정신적 성장을 중시하는 삶의 방식이 길합니다. 물질보다 마음의 풍요를 추구합니다",
    meaning: "가정운에 변화가 나타나기 쉽습니다. 정신세계에 강한 관심을 갖는 경향이 있습니다",
  },
  寅卯天中殺: {
    name: "인묘천중살",
    theme: "조직보다 개인으로 힘을 발휘합니다. 창조성과 자유로운 발상이 무기가 됩니다",
    meaning: "동방의 기운이 부족합니다. 사회의 틀 안에서 사는 것에 위화감을 느끼기 쉽습니다",
  },
  子丑天中殺: {
    name: "자축천중살",
    theme: "자립심을 살려 새로운 분야를 개척하는 힘이 있습니다",
    meaning: "북방의 기운이 부족합니다. 초대운이며, 부모 곁을 떠나 자립하면 운이 열립니다",
  },
};

/** 九星気学・本命星の強み */
const NINE_STAR_STRENGTH_KO: Record<string, string> = {
  一白水星: "적응력·지성·포용력",
  二黒土星: "인내력·견실함·봉사",
  三碧木星: "행동력·발전력·젊음",
  四緑木星: "조화력·인맥·신뢰",
  五黄土星: "카리스마·통솔력·의지력",
  六白金星: "품격·리더십·직관",
  七赤金星: "사교성·화술·매력",
  八白土星: "안정감·변혁력·끈기",
  九紫火星: "지성·미적 감각·열정",
};

/** 9年サイクル（数秘パーソナルイヤー1〜9）のラベルとヒント */
const CYCLE_LABELS_KO: Record<number, { label: string; hint: string }> = {
  1: { label: "시작", hint: "새로운 장소·세계로 뛰어들기·큰 출발" },
  2: { label: "협력", hint: "사람과의 인연 키우기·동료 만들기·차분히" },
  3: { label: "표현", hint: "발신·창조·즐기기·만들어내기" },
  4: { label: "토대", hint: "기반 다지기·꾸준함·배움에 투자" },
  5: { label: "변화", hint: "새로운 경험·도전·움직임·자유" },
  6: { label: "사랑", hint: "가족·소중한 사람·책임·연결" },
  7: { label: "배움", hint: "성찰·전문성 심화·혼자만의 시간" },
  8: { label: "결실", hint: "성과·달성·돈·승부처" },
  9: { label: "내려놓음", hint: "완성·내려놓기·다음 씨뿌리기·되돌아보기" },
};

/** 算命学・主星ごとの人間関係ヒント（不調対処の1文） */
const SANMEI_REL_KO: Record<string, string> = {
  貫索星: "성실함으로 깊은 신뢰를 쌓아요.",
  石門星: "누구와도 잘 어울리는 매력이 있어요.",
  龍高星: "자극적인 매력으로 끌어당겨요.",
  玉堂星: "감싸는 다정함으로 따름을 받아요.",
  車騎星: "산뜻한 정직함으로 사랑받아요.",
  牽牛星: "늠름한 매력으로 존경받아요.",
  禄存星: "애정이 풍부해 많은 사람에게 사랑받아요.",
  司禄星: "성실한 안정감으로 신뢰받아요.",
  鳳閣星: "함께 있으면 위로가 되는 존재예요.",
  調舒星: "독특한 매력으로 끌어당겨요.",
};

/** 五行の相生（生む側 → 生まれる側） */
const ELEMENT_GENERATES: Record<string, string> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木",
};

/** マスターナンバーを1〜9へ */
function toBase(n: number): number {
  if (n === 11) return 2;
  if (n === 22) return 4;
  if (n === 33) return 6;
  return n;
}

/** 強み文字列の先頭語を取り出す（「独立心・忍耐力・信念」→「独立心」） */
function firstPhrase(s: string): string {
  return s.split(/[・、,／/·]/)[0]?.trim() || s;
}

/** 最初の一文を取り出す */
function firstSentence(s: string): string {
  const i = s.indexOf("。");
  return i >= 0 ? s.slice(0, i + 1) : s;
}

export function buildSelfManual(
  birthDate: string,
  birthTime: string,
  today: Date,
  lang: Lang = "ja"
): SelfManual {
  const isKo = lang === "ko";

  const num = calcNumerology(birthDate, today, lang);
  const mayan = calcMayan(birthDate);
  const fp = calcFourPillars(birthDate, birthTime || undefined);
  const sanmei = calcSanmeigaku(birthDate);
  const nine = calcNineStar(birthDate, today.getFullYear(), lang);
  const lucky = calcLuckyInfo(today, num.lifePathNumber, lang);

  // 表示区切り文字（言語ごと）
  const dot = isKo ? "·" : "・";
  const lpar = isKo ? "(" : "（";
  const rpar = isKo ? ")" : "）";

  // 占術名（フル／短縮）を言語に応じて返す
  const src = (ja: string) => (isKo ? SOURCE_KO[ja] ?? ja : ja);

  // 数秘（calcNumerology が言語対応済み）
  const lp = num.lifePathMeaning; // title / strength / theme

  // 四柱推命・日主（エンジンは日本語のみ → KO はローカル辞書）
  const dm = fp.dayMaster;
  const dmKo = DAY_MASTER_KO[dm.stem];
  const dmTitle = isKo && dmKo ? dmKo.title : dm.title;
  const dmStrength = isKo && dmKo ? dmKo.strength : dm.strength;
  const dmEl = elementName(dm.element, lang);

  // 算命学・主星
  const ms = sanmei.mainStar;
  const msKo = SANMEI_STAR_KO[ms.name];
  const msName = isKo && msKo ? msKo.name : ms.name;
  const msKeyword = isKo && msKo ? msKo.keyword : ms.keyword;
  const msStrength = isKo && msKo ? msKo.strength : ms.strength;

  // 算命学・天中殺
  const tc = sanmei.tenchu;
  const tcKo = TENCHU_KO[tc.name];
  const tcName = isKo && tcKo ? tcKo.name : tc.name;
  const tcTheme = isKo && tcKo ? tcKo.theme : tc.theme;
  const tcMeaning = isKo && tcKo ? tcKo.meaning : tc.meaning;

  // 九星気学・本命星
  const honmeiName = nineStarName(nine.honmeisei.name, lang);
  const honmeiStrength = isKo
    ? NINE_STAR_STRENGTH_KO[nine.honmeisei.name] ?? nine.honmeisei.strength
    : nine.honmeisei.strength;

  // マヤ暦・紋章名
  const sealName = mayanSealName(mayan.solarSeal.name, lang);
  const waveName = mayanSealName(mayan.waveSpell.name, lang);

  // 9年サイクル
  const cyc = CYCLE_LABELS[toBase(num.personalYear)];
  const cycKo = CYCLE_LABELS_KO[toBase(num.personalYear)];
  const cycLabel = isKo && cycKo ? cycKo.label : cyc.label;
  const cycHint = isKo && cycKo ? cycKo.hint : cyc.hint;

  // 用神（ラッキー五行）— エンジンは日本語のみ → KO は五行の相生から文を再構成
  const favEl = fp.favorableElement.element;
  const favElDisp = elementName(favEl, lang);
  const favReason = isKo
    ? ELEMENT_GENERATES[dm.element] === favEl
      ? `${elementName(dm.element, lang)}의 기운이 강하므로, ${favElDisp}로 힘을 발산하면 길합니다`
      : `${elementName(dm.element, lang)}의 기운을 보완하기 위해, ${favElDisp}의 힘을 빌리면 길합니다`
    : fp.favorableElement.reason;

  // 吉方位（表示用に翻訳）
  const luckyDirs = isKo
    ? nine.luckyDirections.map((d) => directionName(d, lang))
    : nine.luckyDirections;

  const details: ManualDetail[] = [
    {
      source: src("数秘術"),
      label: `${num.lifePathNumber}${dot}${lp.title}`,
      trait: getNumerologyDetail(num.lifePathNumber, lang),
    },
    {
      source: src("マヤ暦"),
      label: sealName,
      trait: getMayanDetail(mayan.solarSeal.name, lang),
    },
    {
      source: src("四柱推命"),
      label: `${dm.stem}${dot}${dmTitle}`,
      trait: getFourPillarsDetail(dm.stem, lang),
    },
    {
      source: src("算命学"),
      label: msName,
      trait: getSanmeigakuDetail(ms.name, lang),
    },
    {
      source: src("九星気学"),
      label: honmeiName,
      trait: getNineStarDetail(nine.honmeisei.name, lang),
    },
  ];

  const strengths = [
    { source: src("数秘"), text: lp.strength },
    { source: src("四柱推命"), text: dmStrength },
    { source: src("算命学"), text: msStrength },
    { source: src("九星気学"), text: honmeiStrength },
  ].filter((s) => s.text);

  const spec: SelfManualSpec = {
    lifePath: `${num.lifePathNumber}${dot}${lp.title}`,
    dayMaster: `${dm.stem}${dot}${dmTitle}${lpar}${dmEl}${rpar}`,
    mainStar: `${msName}${lpar}${msKeyword}${rpar}`,
    honmeisei: honmeiName,
    mayan: `${sealName} × ${waveName}`,
    catchphrase: isKo
      ? `「${lp.title}」의 영혼을 지닌, ${msKeyword}의 사람. ${lp.theme}.`
      : `「${lp.title}」の魂を持つ、${msKeyword}の人。${lp.theme}。`,
  };

  const charge: SelfManualCharge = {
    color: lucky.color.name,
    colorHex: lucky.color.hex,
    number: lucky.number,
    direction: lucky.direction,
    luckyDirections: luckyDirs,
    moonPhase: lucky.moonPhase,
    moonEmoji: lucky.moonEmoji,
    favorableElement: favElDisp,
    favorableReason: favReason,
  };

  const cautions = isKo
    ? [
        `【숙명의 테마】${tcName}: ${tcTheme}`,
        `【올해의 주의】${nine.yearPosition.caution}`,
      ]
    : [
        `【宿命のテーマ】${tcName}：${tcTheme}`,
        `【今年の注意】${nine.yearPosition.caution}`,
      ];

  const timing: SelfManualTiming = {
    personalYear: num.personalYear,
    cycleLabel: cycLabel,
    cycleHint: cycHint,
    personalYearTheme: num.personalYearMeaning.theme,
    personalYearAdvice: num.personalYearMeaning.advice,
    nineStarTheme: nine.yearPosition.theme,
    nineStarAdvice: nine.yearPosition.advice,
  };

  const forOthers = isKo
    ? `저는 「${lp.title}」 타입이에요. ${msKeyword}을(를) 소중히 여기고, ${dmTitle} 같은 자세로 살아갑니다. 강점은 ${firstPhrase(lp.strength)}. 기운이 회복되는 건 ${lucky.color.name}·행운의 숫자 ${lucky.number}·${firstPhrase(favElDisp)}의 기운에 닿을 때예요. 이렇게 대해 주시면 가장 힘을 발휘할 수 있어요.`
    : `私は「${lp.title}」タイプ。${msKeyword}を大切にし、${dmTitle}のような在り方で歩みます。強みは${firstPhrase(lp.strength)}。元気が回復するのは${lucky.color.name}・ラッキーナンバー${lucky.number}・${firstPhrase(favElDisp)}の気に触れるとき。こう接してもらえると、いちばん力を発揮できます。`;

  // 正しい使い方（力を発揮する条件）
  const usage: string[] = isKo
    ? [
        `강점 「${lp.strength}」을(를) 발휘할 수 있는 역할·환경을 선택하면 가장 빛나요.`,
        `보완하면 균형이 잡히는 기운은 「${favElDisp}」. ${favReason}`,
        `${lucky.color.name}·행운의 숫자 ${lucky.number}·방위 「${lucky.direction}」을(를) 일상에 도입하면 힘이 되어줘요.`,
      ]
    : [
        `強み「${lp.strength}」を発揮できる役割・環境を選ぶと、いちばん輝きます。`,
        `補うと整う気は「${favElDisp}」。${favReason}`,
        `${lucky.color.name}・ラッキーナンバー${lucky.number}・方位「${lucky.direction}」を日常に取り入れると後押しになります。`,
      ];
  if (nine.luckyDirections.length > 0) {
    usage.push(
      isKo
        ? `이사·여행은 길방위(${luckyDirs.join("·")})를 선택하면 운이 열려요.`
        : `引越し・旅行は吉方位（${luckyDirs.join("・")}）を選ぶと運が開けます。`
    );
  }

  // してはいけないこと（消耗を避ける）
  const avoid: string[] = isKo
    ? [
        tcMeaning,
        nine.yearPosition.caution,
        `강점도 지나치면 피로의 원인이 돼요. 너무 애썼다면 의식적으로 쉬는 시간을 만들어 주세요.`,
      ]
    : [
        tcMeaning,
        nine.yearPosition.caution,
        `強みも行き過ぎると疲れのもと。頑張りすぎたら、意識して休む時間をつくって。`,
      ];

  // 不調のときの対処（トラブルシューティング）
  const sanmeiRel = getSanmeigakuDetail(ms.name, lang).relationship;
  const troubleshooting = isKo
    ? [
        {
          symptom: "지치거나 소모되었다고 느껴지면",
          action: `${lucky.color.name}에 닿아보고, 방향 「${lucky.direction}」쪽으로 조금 걸어보세요. 지금은 ${lucky.moonEmoji}${lucky.moonPhase}. 무리하지 말고 충분히 충전을.`,
        },
        {
          symptom: "조급함·헛도는 느낌이 들면",
          action: `지금은 수비 ${num.personalYear}「${cycLabel}」의 해예요. ${num.personalYearMeaning.caution}`,
        },
        {
          symptom: "인간관계로 지쳤다면",
          action: SANMEI_REL_KO[ms.name] ?? firstSentence(sanmeiRel),
        },
        {
          symptom: "망설여져 결정하지 못할 때",
          action: `당신의 축은 「${lp.theme}」. 그에 맞는 쪽을 선택하면 괜찮아요.`,
        },
      ]
    : [
        {
          symptom: "疲れた・消耗したと感じたら",
          action: `${lucky.color.name}に触れ、方角「${lucky.direction}」へ少し歩いてみて。今は${lucky.moonEmoji}${lucky.moonPhase}。無理に頑張らず、しっかり充電を。`,
        },
        {
          symptom: "焦り・空回りを感じたら",
          action: `今は数秘${num.personalYear}「${cycLabel}」の年。${num.personalYearMeaning.caution}`,
        },
        {
          symptom: "人間関係で疲れたら",
          action: firstSentence(sanmeiRel),
        },
        {
          symptom: "迷って決められないとき",
          action: `あなたの軸は「${lp.theme}」。それに沿う方を選べば大丈夫。`,
        },
      ];

  return {
    hasTime: !!birthTime,
    spec,
    strengths,
    details,
    charge,
    cautions,
    usage,
    avoid,
    troubleshooting,
    timing,
    forOthers,
  };
}
