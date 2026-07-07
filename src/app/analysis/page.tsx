"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProfile, type UserProfile } from "@/lib/storage";
import UsageHelp from "@/components/UsageHelp";
import { useI18n } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/dict";
import {
  mayanSealName,
  mayanSealKeyword,
  mayanToneName,
  mayanToneKeyword,
  nineStarName,
  elementName,
} from "@/lib/i18n/fortune-terms";
import {
  calcNumerology,
  calcMayan,
  calcNineStar,
  calcFourPillars,
  calcSanmeigaku,
  getNumerologyDetail,
  getMayanDetail,
  getFourPillarsDetail,
  getSanmeigakuDetail,
  getNineStarDetail,
  type NumerologyResult,
  type MayanResult,
  type NineStarResult,
  type FourPillarsResult,
  type SanmeigakuResult,
  type DetailedTrait,
} from "@/lib/divination";

// --- 画面固有の二言語文言（dict.ts は編集禁止のためローカルに保持） ---
const L: Record<Lang, Record<string, string>> = {
  ja: {
    pageTitle: "強み・性格分析",
    helpTitle: "強み・性格分析の見方",
    summaryTitle: "あなたの総合プロフィール",
    coreTitle: "コアの強み",
    coreNote: "複数の占術で共通",
    otherTitle: "その他の資質",
    layerAnalysisTitle: "レイヤー別 性格分析",
    detailButton: "それぞれの占いをさらにくわしく",
    detailNote: "5つの占術それぞれの視点から見た、あなたの深い特徴です。",
    hintTitle: "強みの活かし方ヒント",
    strengthPrefix: "強み",
    hintWork: "仕事・ビジネス",
    hintRelation: "人間関係",
    hintGrowth: "成長のカギ",
    layerSoulName: "魂・本質の層",
    layerSoulDesc: "あなたの魂が持って生まれた本質的な性格",
    layerFortuneName: "運気・時期の層",
    layerFortuneDesc: "運気の流れと時期の特性",
    layerTalentName: "性格・才能の層",
    layerTalentDesc: "算命学が示す才能と資質",
    itemNumerology: "数秘術",
    itemMayanSeal: "マヤ暦 - 太陽の紋章",
    itemMayanWave: "マヤ暦 - ウェイブスペル",
    itemMayanTone: "マヤ暦 - 銀河の音",
    itemFourPillars: "四柱推命 - 日主",
    itemNineHonmei: "九星気学 - 本命星",
    itemNineGetsu: "九星気学 - 月命星",
    itemSanmeigaku: "算命学 - 主星",
    prefixLifeTheme: "人生のテーマ：",
    prefixSealMission: "表に見せる顔・使命：",
    prefixInner: "内面・潜在意識：",
    prefixRole: "役割：",
    rowChar: "本質・性格",
    rowWork: "仕事・才能",
    rowRelation: "人間関係",
    rowAdvice: "輝くヒント",
    termLifePath: "ライフパスナンバー",
    termSolarSeal: "太陽の紋章",
    termDayMaster: "日主",
    termMainStar: "主星",
    termHonmei: "本命星",
    termTone: "音",
  },
  ko: {
    pageTitle: "강점·성격 분석",
    helpTitle: "강점·성격 분석 보는 법",
    summaryTitle: "당신의 종합 프로필",
    coreTitle: "핵심 강점",
    coreNote: "여러 점술에서 공통",
    otherTitle: "그 밖의 자질",
    layerAnalysisTitle: "레이어별 성격 분석",
    detailButton: "각 점술을 더 자세히",
    detailNote: "5가지 점술 각각의 관점에서 본, 당신의 깊은 특징입니다.",
    hintTitle: "강점 활용 힌트",
    strengthPrefix: "강점",
    hintWork: "일·비즈니스",
    hintRelation: "인간관계",
    hintGrowth: "성장의 열쇠",
    layerSoulName: "영혼·본질의 층",
    layerSoulDesc: "당신의 영혼이 타고난 본질적인 성격",
    layerFortuneName: "운기·시기의 층",
    layerFortuneDesc: "운기의 흐름과 시기의 특성",
    layerTalentName: "성격·재능의 층",
    layerTalentDesc: "산명학이 보여주는 재능과 자질",
    itemNumerology: "수비학",
    itemMayanSeal: "마야력 - 태양의 문장",
    itemMayanWave: "마야력 - 웨이브 스펠",
    itemMayanTone: "마야력 - 은하의 음",
    itemFourPillars: "사주 - 일주",
    itemNineHonmei: "구성기학 - 본명성",
    itemNineGetsu: "구성기학 - 월명성",
    itemSanmeigaku: "산명학 - 주성",
    prefixLifeTheme: "인생의 테마：",
    prefixSealMission: "겉으로 드러나는 얼굴·사명：",
    prefixInner: "내면·잠재의식：",
    prefixRole: "역할：",
    rowChar: "본질·성격",
    rowWork: "일·재능",
    rowRelation: "인간관계",
    rowAdvice: "빛나는 힌트",
    termLifePath: "라이프패스 넘버",
    termSolarSeal: "태양의 문장",
    termDayMaster: "일주",
    termMainStar: "주성",
    termHonmei: "본명성",
    termTone: "음",
  },
};

// 占術名（テーマの出典ラベル）
const SOURCE_LABELS: Record<Lang, Record<string, string>> = {
  ja: {
    数秘術: "数秘術",
    マヤ暦: "マヤ暦",
    四柱推命: "四柱推命",
    算命学: "算命学",
    九星気学: "九星気学",
  },
  ko: {
    数秘術: "수비학",
    マヤ暦: "마야력",
    四柱推命: "사주",
    算命学: "산명학",
    九星気学: "구성기학",
  },
};

// コアテーマ名（THEME_GROUPS のキー）の訳
const THEME_LABELS: Record<Lang, Record<string, string>> = {
  ja: {},
  ko: {
    リーダーシップ: "리더십",
    行動力: "행동력",
    創造力: "창조력",
    "調和・協調": "조화·협조",
    "知性・分析力": "지성·분석력",
    "忍耐・堅実さ": "인내·견실함",
    "社交性・魅力": "사교성·매력",
    "自由・冒険": "자유·모험",
    "愛情・癒し": "애정·치유",
    "意志力・精神力": "의지력·정신력",
  },
};

// 九星（本命星・月命星）の性格・強みは phase1 エンジンで未ローカライズのため画面側で対応
const NINE_STAR_PROSE_KO: Record<string, { personality: string; strength: string }> = {
  一白水星: { personality: "물처럼 유연하고 적응력이 높은 사람. 지성과 포용력으로 주위를 촉촉하게 하는 존재", strength: "적응력·지성·포용력" },
  二黒土星: { personality: "어머니 같은 따뜻함과 인내력을 지님. 꾸준하고 착실하게 노력할 수 있음", strength: "인내력·견실함·봉사" },
  三碧木星: { personality: "젊고 싱그러운 에너지가 넘침. 행동력이 있고 새로운 일에 적극적", strength: "행동력·발전력·젊음" },
  四緑木星: { personality: "온화하고 조화를 소중히 함. 인맥을 쌓는 힘이 뛰어나 신뢰를 모음", strength: "조화력·인맥·신뢰" },
  五黄土星: { personality: "강한 의지와 카리스마의 소유자. 제왕의 별이라 불리며 주위를 움직이는 힘이 있음", strength: "카리스마·통솔력·의지력" },
  六白金星: { personality: "품격이 있고 리더십이 뛰어남. 하늘의 은혜를 받기 쉬움", strength: "품격·리더십·직관" },
  七赤金星: { personality: "사교적이고 즐거운 것을 좋아함. 대화에 능하고 사람을 끌어당기는 매력이 있음", strength: "사교성·화술·매력" },
  八白土星: { personality: "산과 같은 안정감과 변혁의 힘을 지님. 끈기 있게 목표를 달성함", strength: "안정감·변혁력·끈기" },
  九紫火星: { personality: "화려하고 지적. 미적 감각과 열정을 지니고 정상을 목표로 함", strength: "지성·미적 감각·열정" },
};

// マヤ暦・銀河の音のエネルギー語
const TONE_ENERGY_KO: Record<string, string> = {
  統合: "통합", 極性: "극성", つながり: "연결", 定義: "정의", 輝き: "빛남",
  平等: "평등", 調和: "조화", 誠実: "성실", 意図: "의도", 顕現: "현현",
  解放: "해방", 協力: "협력", 存在: "존재",
};

const firstToken = (s: string): string => s.split(/[・·,、]/)[0];

function themeLabel(theme: string, lang: Lang): string {
  return THEME_LABELS[lang][theme] ?? theme;
}

function sourceLabel(source: string, lang: Lang): string {
  return SOURCE_LABELS[lang][source] ?? source;
}

function nineStarPersonality(name: string, lang: Lang, fallback: string): string {
  if (lang === "ko") return NINE_STAR_PROSE_KO[name]?.personality ?? fallback;
  return fallback;
}

function nineStarStrength(name: string, lang: Lang, fallback: string): string {
  if (lang === "ko") return NINE_STAR_PROSE_KO[name]?.strength ?? fallback;
  return fallback;
}

/** 全占術の強みキーワードを統合して頻出テーマを抽出（日本語の強みで抽出する） */
function extractCoreThemes(
  numerology: NumerologyResult,
  mayan: MayanResult,
  nineStar: NineStarResult,
  fourPillars: FourPillarsResult,
  sanmeigaku: SanmeigakuResult
): { theme: string; count: number; sources: string[] }[] {
  // 各占術からキーワードを収集（source付き）
  const keywordEntries: { keyword: string; source: string }[] = [];

  // 数秘術の強み
  const nStrengths = numerology.lifePathMeaning.strength.split(/[・、,]/).map((s) => s.trim());
  nStrengths.forEach((k) => keywordEntries.push({ keyword: k, source: "数秘術" }));

  // マヤ暦の太陽の紋章キーワード
  mayan.solarSeal.keyword.split(/[・、,]/).forEach((k) =>
    keywordEntries.push({ keyword: k.trim(), source: "マヤ暦" })
  );

  // 四柱推命の日主の強み
  fourPillars.dayMaster.strength.split(/[・、,]/).forEach((k) =>
    keywordEntries.push({ keyword: k.trim(), source: "四柱推命" })
  );

  // 算命学の主星の強み
  sanmeigaku.mainStar.strength.split(/[・、,]/).forEach((k) =>
    keywordEntries.push({ keyword: k.trim(), source: "算命学" })
  );

  // 九星気学の本命星の強み
  nineStar.honmeisei.strength.split(/[・、,]/).forEach((k) =>
    keywordEntries.push({ keyword: k.trim(), source: "九星気学" })
  );

  // 類似キーワードをグルーピング
  const themeMap: Record<string, { keywords: string[]; sources: Set<string> }> = {};
  const THEME_GROUPS: Record<string, string[]> = {
    "リーダーシップ": ["リーダー", "リーダーシップ", "統率力", "統率", "カリスマ性", "カリスマ", "開拓力"],
    "行動力": ["行動力", "実行力", "決断力", "情熱", "競争心", "挑戦"],
    "創造力": ["創造力", "独創性", "革新力", "芸術性", "美的センス", "表現"],
    "調和・協調": ["調和", "調和力", "協調性", "バランス", "安定感", "共感力", "包容力"],
    "知性・分析力": ["知性", "分析力", "知恵", "直感", "直感力", "精神性"],
    "忍耐・堅実さ": ["忍耐力", "堅実さ", "堅実", "責任感", "粘り強さ", "忍耐"],
    "社交性・魅力": ["社交性", "魅力", "話術", "コミュニケーション", "人脈", "信頼"],
    "自由・冒険": ["自由", "好奇心", "適応力", "変革力", "発展力"],
    "愛情・癒し": ["愛情", "癒し", "優しさ", "母性", "奉仕", "献身性", "共感力"],
    "意志力・精神力": ["意志力", "精神力", "冷静さ", "審美眼", "再生力"],
  };

  for (const entry of keywordEntries) {
    let matched = false;
    for (const [theme, group] of Object.entries(THEME_GROUPS)) {
      if (group.some((g) => entry.keyword.includes(g) || g.includes(entry.keyword))) {
        if (!themeMap[theme]) themeMap[theme] = { keywords: [], sources: new Set() };
        if (!themeMap[theme].keywords.includes(entry.keyword)) {
          themeMap[theme].keywords.push(entry.keyword);
        }
        themeMap[theme].sources.add(entry.source);
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (!themeMap[entry.keyword]) themeMap[entry.keyword] = { keywords: [], sources: new Set() };
      themeMap[entry.keyword].keywords.push(entry.keyword);
      themeMap[entry.keyword].sources.add(entry.source);
    }
  }

  return Object.entries(themeMap)
    .map(([theme, data]) => ({
      theme,
      count: data.sources.size,
      sources: Array.from(data.sources),
    }))
    .sort((a, b) => b.count - a.count);
}

/** 総合的な強みサマリーを生成（表示用のローカライズ済み結果を受け取る） */
function generateSummary(
  numerology: NumerologyResult,
  mayan: MayanResult,
  nineStar: NineStarResult,
  fourPillars: FourPillarsResult,
  sanmeigaku: SanmeigakuResult,
  lang: Lang
): string {
  const n = numerology.lifePathMeaning;
  const seal = mayanSealName(mayan.solarSeal.name, lang);
  const honmei = nineStarName(nineStar.honmeisei.name, lang);
  const dm = fourPillars.dayMaster;
  const mainStar = sanmeigaku.mainStar;

  if (lang === "ko") {
    return `당신은 수비학에서는 「${n.title}」, 마야력에서는 「${seal}」의 문장, 사주에서는 「${dm.title}(${dm.stem})」, 산명학에서는 「${mainStar.name}」, 구성기학에서는 「${honmei}」을(를) 지닌 사람입니다. 「${n.theme}」것이 인생의 테마이며, ${firstToken(dm.strength)}과(와) ${mainStar.keyword}이(가) 어우러진, 유니크한 강점의 조합을 지니고 있습니다.`;
  }

  return `あなたは数秘術では「${n.title}」、マヤ暦では「${seal}」の紋章、四柱推命では「${dm.title}（${dm.stem}）」、算命学では「${mainStar.name}」、九星気学では「${honmei}」の持ち主です。${n.theme}ことが人生のテーマであり、${firstToken(dm.strength)}と${mainStar.keyword}が掛け合わさった、ユニークな強みの組み合わせを持っています。`;
}

export default function AnalysisPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.push("/profile");
      return;
    }
    setProfile(p);
  }, [router]);

  if (!profile) {
    return <p className="text-muted text-center py-10">{t("astro.loading")}</p>;
  }

  const dd = L[lang];
  const today = new Date();
  const bd = profile.birthDate;
  const bt = profile.birthTime || undefined;

  // 表示用（ローカライズ済み）
  const numerology = calcNumerology(bd, today, lang);
  const mayan = calcMayan(bd); // マヤ暦は常に日本語（fortune-terms で変換）
  const nineStar = calcNineStar(bd, today.getFullYear(), lang);
  const fourPillars = calcFourPillars(bd, bt, lang);
  const sanmeigaku = calcSanmeigaku(bd, lang);

  // テーマ抽出・詳細キー用（日本語固定）
  const numJa = lang === "ja" ? numerology : calcNumerology(bd, today, "ja");
  const fourPillarsJa = lang === "ja" ? fourPillars : calcFourPillars(bd, bt, "ja");
  const sanmeigakuJa = lang === "ja" ? sanmeigaku : calcSanmeigaku(bd, "ja");

  const coreThemes = extractCoreThemes(numJa, mayan, nineStar, fourPillarsJa, sanmeigakuJa);
  const summary = generateSummary(numerology, mayan, nineStar, fourPillars, sanmeigaku, lang);
  const multiSourceThemes = coreThemes.filter((th) => th.count >= 2);
  const singleThemes = coreThemes.filter((th) => th.count === 1);

  const isKo = lang === "ko";
  const helpSteps = isKo
    ? [
        <>5가지 점술(수비학·마야력·사주·산명학·구성기학)의 결과를 <strong>한꺼번에 분석</strong>한 페이지입니다. 입력은 필요 없고, 자동으로 표시됩니다.</>,
        <><strong>핵심 강점</strong>은 여러 점술에서 공통으로 나온 당신의 축. 가장 신뢰할 수 있는 장점입니다.</>,
        <>아래의 「<strong>각 점술을 더 자세히</strong>」를 열면, 점술별 본질·일·인간관계의 특징을 읽을 수 있습니다.</>,
        <>일·인간관계·성장 힌트도 담겨 있어, 자기소개나 강점을 언어화하는 데 활용할 수 있습니다.</>,
      ]
    : [
        <>5つの占術（数秘術・マヤ暦・四柱推命・算命学・九星気学）の結果を<strong>まとめて分析</strong>したページです。入力は不要、自動で表示されます。</>,
        <><strong>コアの強み</strong>は、複数の占術で共通して出たあなたの軸。最も信頼できる長所です。</>,
        <>下の「<strong>それぞれの占いをさらにくわしく</strong>」を開くと、占術ごとの本質・仕事・人間関係の特徴が読めます。</>,
        <>仕事・人間関係・成長のヒントも載っているので、自己紹介や強みの言語化に活用できます。</>,
      ];

  const dmBracket = isKo
    ? `(${fourPillars.dayMaster.title}·${elementName(fourPillars.dayMaster.element, lang)})`
    : `（${fourPillars.dayMaster.title}・${elementName(fourPillars.dayMaster.element, lang)}）`;
  const mainStarBracket = isKo
    ? `(${sanmeigaku.mainStar.keyword})`
    : `（${sanmeigaku.mainStar.keyword}）`;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">✦</span>
        {dd.pageTitle}
      </h2>

      <UsageHelp
        storageKey="usage-help-analysis"
        title={dd.helpTitle}
        steps={helpSteps}
      />

      {/* 総合サマリー */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-medium text-accent-gold mb-2 flex items-center gap-1.5">
          <span>◈</span> {dd.summaryTitle}
        </h3>
        <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
      </div>

      {/* コア強み（複数占術で一致） */}
      {multiSourceThemes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
            <span>◈</span> {dd.coreTitle}
            <span className="text-xs text-muted font-normal ml-1">{dd.coreNote}</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {multiSourceThemes.map((th) => (
              <div
                key={th.theme}
                className="bg-card-bg border border-accent-orange/30 rounded-xl p-3 shadow-sm"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-accent-orange text-base font-bold">{themeLabel(th.theme, lang)}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {th.sources.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] bg-accent-orange/10 text-accent-orange px-1.5 py-0.5 rounded-full"
                    >
                      {sourceLabel(s, lang)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* その他の強み */}
      {singleThemes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
            <span>◇</span> {dd.otherTitle}
          </h3>
          <div className="flex flex-wrap gap-2">
            {singleThemes.map((th) => (
              <span
                key={th.theme}
                className="text-xs bg-card-bg border border-card-border text-foreground/70 px-2.5 py-1 rounded-full"
              >
                {themeLabel(th.theme, lang)}
                <span className="text-muted ml-1">({sourceLabel(th.sources[0], lang)})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* レイヤー別 詳細分析 */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> {dd.layerAnalysisTitle}
        </h3>

        {/* 魂・本質の層 */}
        <LayerCard
          layerName={dd.layerSoulName}
          layerDescription={dd.layerSoulDesc}
          items={[
            {
              title: dd.itemNumerology,
              subtitle: `${dd.termLifePath} ${numerology.lifePathNumber}「${numerology.lifePathMeaning.title}」`,
              color: "#8b5cf6",
              personality: `${dd.prefixLifeTheme}${numerology.lifePathMeaning.theme}`,
              strength: numerology.lifePathMeaning.strength,
            },
            {
              title: dd.itemMayanSeal,
              subtitle: mayanSealName(mayan.solarSeal.name, lang),
              color: "#e11d48",
              personality: `${dd.prefixSealMission}${mayanSealKeyword(mayan.solarSeal.keyword, lang)}`,
              strength: mayanSealKeyword(mayan.solarSeal.keyword, lang),
            },
            {
              title: dd.itemMayanWave,
              subtitle: mayanSealName(mayan.waveSpell.name, lang),
              color: "#e11d48",
              personality: `${dd.prefixInner}${mayanSealKeyword(mayan.waveSpell.keyword, lang)}`,
              strength: mayanSealKeyword(mayan.waveSpell.keyword, lang),
            },
            {
              title: dd.itemMayanTone,
              subtitle: `${dd.termTone}${mayan.galacticTone.tone}「${mayanToneName(mayan.galacticTone.name, lang)}」`,
              color: "#e11d48",
              personality: `${dd.prefixRole}${mayanToneKeyword(mayan.galacticTone.keyword, lang)}`,
              strength: isKo ? (TONE_ENERGY_KO[mayan.galacticTone.energy] ?? mayan.galacticTone.energy) : mayan.galacticTone.energy,
            },
          ]}
        />

        {/* 運気・時期の層 */}
        <LayerCard
          layerName={dd.layerFortuneName}
          layerDescription={dd.layerFortuneDesc}
          items={[
            {
              title: dd.itemFourPillars,
              subtitle: `${fourPillars.dayMaster.stem}${dmBracket}`,
              color: "#06b6d4",
              personality: fourPillars.dayMaster.personality,
              strength: fourPillars.dayMaster.strength,
            },
            {
              title: dd.itemNineHonmei,
              subtitle: nineStarName(nineStar.honmeisei.name, lang),
              color: "#10b981",
              personality: nineStarPersonality(nineStar.honmeisei.name, lang, nineStar.honmeisei.personality),
              strength: nineStarStrength(nineStar.honmeisei.name, lang, nineStar.honmeisei.strength),
            },
            {
              title: dd.itemNineGetsu,
              subtitle: nineStarName(nineStar.getsumeisei.name, lang),
              color: "#10b981",
              personality: nineStarPersonality(nineStar.getsumeisei.name, lang, nineStar.getsumeisei.personality),
              strength: nineStarStrength(nineStar.getsumeisei.name, lang, nineStar.getsumeisei.strength),
            },
          ]}
        />

        {/* 性格・才能の層 */}
        <LayerCard
          layerName={dd.layerTalentName}
          layerDescription={dd.layerTalentDesc}
          items={[
            {
              title: dd.itemSanmeigaku,
              subtitle: `${sanmeigaku.mainStar.name}${mainStarBracket}`,
              color: "#8b5cf6",
              personality: sanmeigaku.mainStar.personality,
              strength: sanmeigaku.mainStar.strength,
            },
          ]}
        />
      </section>

      {/* それぞれの占いをさらにくわしく */}
      <DetailSection
        details={[
          {
            title: sourceLabel("数秘術", lang),
            subtitle: `${dd.termLifePath} ${numerology.lifePathNumber}「${numerology.lifePathMeaning.title}」`,
            color: "#8b5cf6",
            trait: getNumerologyDetail(numerology.lifePathNumber, lang),
          },
          {
            title: sourceLabel("マヤ暦", lang),
            subtitle: `${dd.termSolarSeal}「${mayanSealName(mayan.solarSeal.name, lang)}」`,
            color: "#e11d48",
            trait: getMayanDetail(mayan.solarSeal.name, lang),
          },
          {
            title: sourceLabel("四柱推命", lang),
            subtitle: `${dd.termDayMaster}「${fourPillars.dayMaster.stem}・${fourPillars.dayMaster.title}」`,
            color: "#06b6d4",
            trait: getFourPillarsDetail(fourPillars.dayMaster.stem, lang),
          },
          {
            title: sourceLabel("算命学", lang),
            subtitle: `${dd.termMainStar}「${sanmeigaku.mainStar.name}」`,
            color: "#f59e0b",
            // 詳細テーブルのキーは日本語主星名（表示名は ko だと訳語のため ja を使用）
            trait: getSanmeigakuDetail(sanmeigakuJa.mainStar.name, lang),
          },
          {
            title: sourceLabel("九星気学", lang),
            subtitle: `${dd.termHonmei}「${nineStarName(nineStar.honmeisei.name, lang)}」`,
            color: "#10b981",
            trait: getNineStarDetail(nineStar.honmeisei.name, lang),
          },
        ]}
      />

      {/* 強みの活かし方ヒント */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-medium text-accent-gold mb-3 flex items-center gap-1.5">
          <span>◈</span> {dd.hintTitle}
        </h3>
        <div className="space-y-2.5">
          <HintItem
            label={dd.hintWork}
            text={getBusinessHint(numerology, nineStar, lang)}
          />
          <HintItem
            label={dd.hintRelation}
            text={getRelationshipHint(mayan, nineStar, lang)}
          />
          <HintItem
            label={dd.hintGrowth}
            text={getGrowthHint(numerology, mayan, lang)}
          />
        </div>
      </div>

      <p className="text-center text-xs text-muted/60 px-4">
        {t("common.disclaimer")}
      </p>
    </div>
  );
}

// --- サブコンポーネント ---

function LayerCard({
  layerName,
  layerDescription,
  items,
}: {
  layerName: string;
  layerDescription: string;
  items: { title: string; subtitle: string; color: string; personality: string; strength: string }[];
}) {
  const { lang } = useI18n();
  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">{layerName}</p>
        <p className="text-xs text-muted">{layerDescription}</p>
      </div>
      {items.map((item) => (
        <div key={item.title} className="border-t border-card-border pt-3 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs font-medium text-foreground">{item.title}</span>
          </div>
          <p className="text-sm font-medium text-accent-orange ml-4">{item.subtitle}</p>
          <p className="text-sm text-foreground/80 ml-4">{item.personality}</p>
          <p className="text-xs text-accent-gold ml-4">
            ▸ {L[lang].strengthPrefix}：{item.strength}
          </p>
        </div>
      ))}
    </div>
  );
}

interface DetailItem {
  title: string;
  subtitle: string;
  color: string;
  trait: DetailedTrait;
}

function DetailSection({ details }: { details: DetailItem[] }) {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const dd = L[lang];

  return (
    <section className="space-y-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-gradient-to-r from-accent-orange to-accent-gold text-white rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform"
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <span>✧</span>
          {dd.detailButton}
        </span>
        <span className={`text-lg transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      {open && (
        <div className="space-y-3">
          <p className="text-xs text-muted px-1">
            {dd.detailNote}
          </p>
          {details.map((d) => (
            <DetailCard key={d.title} item={d} />
          ))}
        </div>
      )}
    </section>
  );
}

function DetailCard({ item }: { item: DetailItem }) {
  const { lang } = useI18n();
  const dd = L[lang];
  const rows: { label: string; text: string }[] = [
    { label: dd.rowChar, text: item.trait.character },
    { label: dd.rowWork, text: item.trait.work },
    { label: dd.rowRelation, text: item.trait.relationship },
    { label: dd.rowAdvice, text: item.trait.advice },
  ];

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
        <span className="text-sm font-bold text-foreground">{item.title}</span>
      </div>
      <p className="text-sm font-medium text-accent-orange">{item.subtitle}</p>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="space-y-0.5">
            <p className="text-xs font-medium text-accent-gold flex items-center gap-1">
              <span>▸</span>
              {r.label}
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed pl-3.5">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HintItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-accent-orange font-medium whitespace-nowrap mt-0.5">{label}</span>
      <p className="text-xs text-foreground/80 leading-relaxed">{text}</p>
    </div>
  );
}

// --- ヒント生成関数（表示用ローカライズ済み結果を受け取る） ---

function getBusinessHint(
  n: NumerologyResult,
  ns: NineStarResult,
  lang: Lang
): string {
  const lpn = n.lifePathNumber;
  const ko = lang === "ko";
  const base = (() => {
    if ([1, 8, 22].includes(lpn))
      return ko
        ? "리더십을 살려 자신의 비전으로 사람을 이끄는 자리가 잘 맞아요"
        : "リーダーシップを活かし、自分のビジョンで人を導く立場が向いています";
    if ([2, 6, 33].includes(lpn))
      return ko
        ? "사람을 지지하고 키우는 힘이 있어, 팀의 서포트 역할이나 코치로서 힘을 발휘해요"
        : "人を支え育てる力があり、チームのサポート役やコーチとして力を発揮します";
    if ([3, 5].includes(lpn))
      return ko
        ? "새로운 아이디어와 유연함으로, 창의적인 분야나 변화가 많은 환경에서 빛나요"
        : "新しいアイデアと柔軟さで、クリエイティブな分野や変化の多い環境で輝きます";
    if ([4, 7].includes(lpn))
      return ko
        ? "분석력과 견실함을 살려, 전문성을 깊이 파는 일이나 연구직에서 성과를 낼 수 있어요"
        : "分析力と堅実さを活かし、専門性を深める仕事や研究職で成果を出せます";
    if ([9, 11].includes(lpn))
      return ko
        ? "넓은 시야와 직관력을 살려, 사람에게 영향을 주는 교육이나 상담에 잘 맞아요"
        : "広い視野と直感力を活かし、人に影響を与える教育やカウンセリングに向いています";
    return ko
      ? "자신의 강점을 살릴 수 있는 분야에서, 착실하게 실적을 쌓아가요"
      : "自分の強みを活かせる分野で、着実に実績を積み上げていきましょう";
  })();
  const starName = nineStarName(ns.honmeisei.name, lang);
  const starStrength = firstToken(nineStarStrength(ns.honmeisei.name, lang, ns.honmeisei.strength));
  return ko
    ? `${base}. 구성기학의 ${starName}가 지닌 「${starStrength}」도 큰 무기예요.`
    : `${base}。九星の${starName}の「${starStrength}」も大きな武器です。`;
}

function getRelationshipHint(
  m: MayanResult,
  ns: NineStarResult,
  lang: Lang
): string {
  const ko = lang === "ko";
  const sealColor = m.solarSeal.color; // マヤ暦は常に日本語（色名で分岐）
  const colorHint = (() => {
    if (sealColor === "赤")
      return ko
        ? "정열적이고 에너지가 넘치는 당신은, 행동으로 주위를 끌어들이는 힘이 있어요"
        : "情熱的でエネルギーに溢れるあなたは、行動で周囲を巻き込む力があります";
    if (sealColor === "白")
      return ko
        ? "섬세하고 정신성이 높은 당신은, 깊은 신뢰 관계를 쌓는 데 능해요"
        : "繊細で精神性が高いあなたは、深い信頼関係を築くことが得意です";
    if (sealColor === "青")
      return ko
        ? "변용의 에너지를 지닌 당신은, 사람의 가능성을 이끌어내는 힘이 있어요"
        : "変容のエネルギーを持つあなたは、人の可能性を引き出す力があります";
    if (sealColor === "黄")
      return ko
        ? "따뜻하고 안정된 존재감의 당신은, 주위에 안심감을 줘요"
        : "温かく安定した存在感のあなたは、周囲に安心感を与えます";
    return ko ? "독자적인 매력으로 사람을 끌어당겨요" : "独自の魅力で人を惹きつけます";
  })();
  const getsuName = nineStarName(ns.getsumeisei.name, lang);
  return ko
    ? `${colorHint}. 구성기학의 월명성 「${getsuName}」은(는) 내면의 성격을 나타내며, 가까운 사람과의 관계에서 드러나요.`
    : `${colorHint}。九星の月命星「${getsuName}」は内面の性格を表し、親しい人との関係で現れます。`;
}

function getGrowthHint(
  n: NumerologyResult,
  m: MayanResult,
  lang: Lang
): string {
  const ko = lang === "ko";
  const tone = m.galacticTone.tone;
  const toneHint = (() => {
    if (tone <= 4)
      return ko
        ? "우선 자신의 기반을 다지고, 형태를 명확히 하는 것이 성장의 첫걸음"
        : "まずは自分の基盤を固め、形を明確にすることが成長への第一歩";
    if (tone <= 8)
      return ko
        ? "주위와의 조화를 이루면서, 자신의 힘을 발휘하는 균형이 중요"
        : "周囲との調和を取りながら、自分の力を発揮するバランスが大切";
    if (tone <= 10)
      return ko
        ? "적극적으로 밖을 향해 에너지를 발신하고, 영향력을 넓히는 단계"
        : "積極的に外に向かってエネルギーを発信し、影響力を広げるステージ";
    return ko
      ? "더 큰 시점으로 사물을 바라보고, 내려놓음으로써 새로운 가능성이 열려요"
      : "より大きな視点で物事を捉え、手放すことで新たな可能性が開きます";
  })();
  const theme = n.lifePathMeaning.theme;
  return ko
    ? `${toneHint}. 수비학의 「${theme}」라는 테마를 의식하면, 지금 시기에 맞는 성장을 할 수 있어요.`
    : `${toneHint}。数秘の「${theme}」というテーマを意識すると、今の時期に合った成長ができます。`;
}
