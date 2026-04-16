"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProfile } from "@/lib/storage";
import {
  calcNumerology,
  calcMayan,
  calcNineStar,
  calcFourPillars,
  calcSanmeigaku,
  type NumerologyResult,
  type MayanResult,
  type NineStarResult,
  type FourPillarsResult,
  type SanmeigakuResult,
} from "@/lib/divination";

/** 全占術の強みキーワードを統合して頻出テーマを抽出 */
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

/** 総合的な強みサマリーを生成 */
function generateSummary(
  numerology: NumerologyResult,
  mayan: MayanResult,
  nineStar: NineStarResult,
  fourPillars: FourPillarsResult,
  sanmeigaku: SanmeigakuResult
): string {
  const n = numerology.lifePathMeaning;
  const seal = mayan.solarSeal.name;
  const honmei = nineStar.honmeisei.name;
  const dayMaster = fourPillars.dayMaster;
  const mainStar = sanmeigaku.mainStar;

  return `あなたは数秘術では「${n.title}」、マヤ暦では「${seal}」の紋章、四柱推命では「${dayMaster.title}（${dayMaster.stem}）」、算命学では「${mainStar.name}」、九星気学では「${honmei}」の持ち主です。${n.theme}ことが人生のテーマであり、${dayMaster.strength.split("・")[0]}と${mainStar.keyword}が掛け合わさった、ユニークな強みの組み合わせを持っています。`;
}

export default function AnalysisPage() {
  const router = useRouter();
  const [numerology, setNumerology] = useState<NumerologyResult | null>(null);
  const [mayan, setMayan] = useState<MayanResult | null>(null);
  const [nineStar, setNineStar] = useState<NineStarResult | null>(null);
  const [fourPillars, setFourPillars] = useState<FourPillarsResult | null>(null);
  const [sanmeigaku, setSanmeigaku] = useState<SanmeigakuResult | null>(null);

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) {
      router.push("/profile");
      return;
    }
    const today = new Date();
    setNumerology(calcNumerology(profile.birthDate, today));
    setMayan(calcMayan(profile.birthDate));
    setNineStar(calcNineStar(profile.birthDate, today.getFullYear()));
    setFourPillars(calcFourPillars(profile.birthDate, profile.birthTime || undefined));
    setSanmeigaku(calcSanmeigaku(profile.birthDate));
  }, [router]);

  if (!numerology || !mayan || !nineStar || !fourPillars || !sanmeigaku) {
    return <p className="text-muted text-center py-10">読み込み中...</p>;
  }

  const coreThemes = extractCoreThemes(numerology, mayan, nineStar, fourPillars, sanmeigaku);
  const summary = generateSummary(numerology, mayan, nineStar, fourPillars, sanmeigaku);
  const multiSourceThemes = coreThemes.filter((t) => t.count >= 2);
  const singleThemes = coreThemes.filter((t) => t.count === 1);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">✦</span>
        強み・性格分析
      </h2>

      {/* 総合サマリー */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-medium text-accent-gold mb-2 flex items-center gap-1.5">
          <span>◈</span> あなたの総合プロフィール
        </h3>
        <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
      </div>

      {/* コア強み（複数占術で一致） */}
      {multiSourceThemes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
            <span>◈</span> コアの強み
            <span className="text-xs text-muted font-normal ml-1">複数の占術で共通</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {multiSourceThemes.map((t) => (
              <div
                key={t.theme}
                className="bg-card-bg border border-accent-orange/30 rounded-xl p-3 shadow-sm"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-accent-orange text-base font-bold">{t.theme}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {t.sources.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] bg-accent-orange/10 text-accent-orange px-1.5 py-0.5 rounded-full"
                    >
                      {s}
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
            <span>◇</span> その他の資質
          </h3>
          <div className="flex flex-wrap gap-2">
            {singleThemes.map((t) => (
              <span
                key={t.theme}
                className="text-xs bg-card-bg border border-card-border text-foreground/70 px-2.5 py-1 rounded-full"
              >
                {t.theme}
                <span className="text-muted ml-1">({t.sources[0]})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* レイヤー別 詳細分析 */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> レイヤー別 性格分析
        </h3>

        {/* 魂・本質の層 */}
        <LayerCard
          layerName="魂・本質の層"
          layerDescription="あなたの魂が持って生まれた本質的な性格"
          items={[
            {
              title: "数秘術",
              subtitle: `ライフパスナンバー ${numerology.lifePathNumber}「${numerology.lifePathMeaning.title}」`,
              color: "#8b5cf6",
              personality: `人生のテーマ：${numerology.lifePathMeaning.theme}`,
              strength: numerology.lifePathMeaning.strength,
            },
            {
              title: "マヤ暦 - 太陽の紋章",
              subtitle: `${mayan.solarSeal.name}`,
              color: "#e11d48",
              personality: `表に見せる顔・使命：${mayan.solarSeal.keyword}`,
              strength: mayan.solarSeal.keyword,
            },
            {
              title: "マヤ暦 - ウェイブスペル",
              subtitle: `${mayan.waveSpell.name}`,
              color: "#e11d48",
              personality: `内面・潜在意識：${mayan.waveSpell.keyword}`,
              strength: mayan.waveSpell.keyword,
            },
            {
              title: "マヤ暦 - 銀河の音",
              subtitle: `音${mayan.galacticTone.tone}「${mayan.galacticTone.name}」`,
              color: "#e11d48",
              personality: `役割：${mayan.galacticTone.keyword}`,
              strength: mayan.galacticTone.energy,
            },
          ]}
        />

        {/* 運気・時期の層 */}
        <LayerCard
          layerName="運気・時期の層"
          layerDescription="運気の流れと時期の特性"
          items={[
            {
              title: "四柱推命 - 日主",
              subtitle: `${fourPillars.dayMaster.stem}（${fourPillars.dayMaster.title}・${fourPillars.dayMaster.element}）`,
              color: "#06b6d4",
              personality: fourPillars.dayMaster.personality,
              strength: fourPillars.dayMaster.strength,
            },
            {
              title: "九星気学 - 本命星",
              subtitle: nineStar.honmeisei.name,
              color: "#10b981",
              personality: nineStar.honmeisei.personality,
              strength: nineStar.honmeisei.strength,
            },
            {
              title: "九星気学 - 月命星",
              subtitle: nineStar.getsumeisei.name,
              color: "#10b981",
              personality: nineStar.getsumeisei.personality,
              strength: nineStar.getsumeisei.strength,
            },
          ]}
        />

        {/* 性格・才能の層 */}
        <LayerCard
          layerName="性格・才能の層"
          layerDescription="算命学が示す才能と資質"
          items={[
            {
              title: "算命学 - 主星",
              subtitle: `${sanmeigaku.mainStar.name}（${sanmeigaku.mainStar.keyword}）`,
              color: "#8b5cf6",
              personality: sanmeigaku.mainStar.personality,
              strength: sanmeigaku.mainStar.strength,
            },
          ]}
        />
      </section>

      {/* 強みの活かし方ヒント */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-medium text-accent-gold mb-3 flex items-center gap-1.5">
          <span>◈</span> 強みの活かし方ヒント
        </h3>
        <div className="space-y-2.5">
          <HintItem
            label="仕事・ビジネス"
            text={getBusinessHint(numerology, nineStar)}
          />
          <HintItem
            label="人間関係"
            text={getRelationshipHint(numerology, mayan, nineStar)}
          />
          <HintItem
            label="成長のカギ"
            text={getGrowthHint(numerology, mayan)}
          />
        </div>
      </div>

      <p className="text-center text-xs text-muted/60 px-4">
        ※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。
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
            ▸ 強み：{item.strength}
          </p>
        </div>
      ))}
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

// --- ヒント生成関数 ---

function getBusinessHint(
  n: NumerologyResult,
  ns: NineStarResult
): string {
  const lpn = n.lifePathNumber;
  const base = (() => {
    if ([1, 8, 22].includes(lpn)) return "リーダーシップを活かし、自分のビジョンで人を導く立場が向いています";
    if ([2, 6, 33].includes(lpn)) return "人を支え育てる力があり、チームのサポート役やコーチとして力を発揮します";
    if ([3, 5].includes(lpn)) return "新しいアイデアと柔軟さで、クリエイティブな分野や変化の多い環境で輝きます";
    if ([4, 7].includes(lpn)) return "分析力と堅実さを活かし、専門性を深める仕事や研究職で成果を出せます";
    if ([9, 11].includes(lpn)) return "広い視野と直感力を活かし、人に影響を与える教育やカウンセリングに向いています";
    return "自分の強みを活かせる分野で、着実に実績を積み上げていきましょう";
  })();
  return `${base}。九星の${ns.honmeisei.name}の「${ns.honmeisei.strength.split("・")[0]}」も大きな武器です。`;
}

function getRelationshipHint(
  n: NumerologyResult,
  m: MayanResult,
  ns: NineStarResult
): string {
  const sealColor = m.solarSeal.color;
  const colorHint = (() => {
    if (sealColor === "赤") return "情熱的でエネルギーに溢れるあなたは、行動で周囲を巻き込む力があります";
    if (sealColor === "白") return "繊細で精神性が高いあなたは、深い信頼関係を築くことが得意です";
    if (sealColor === "青") return "変容のエネルギーを持つあなたは、人の可能性を引き出す力があります";
    if (sealColor === "黄") return "温かく安定した存在感のあなたは、周囲に安心感を与えます";
    return "独自の魅力で人を惹きつけます";
  })();
  return `${colorHint}。九星の月命星「${ns.getsumeisei.name}」は内面の性格を表し、親しい人との関係で現れます。`;
}

function getGrowthHint(
  n: NumerologyResult,
  m: MayanResult
): string {
  const tone = m.galacticTone.tone;
  const toneHint = (() => {
    if (tone <= 4) return "まずは自分の基盤を固め、形を明確にすることが成長への第一歩";
    if (tone <= 8) return "周囲との調和を取りながら、自分の力を発揮するバランスが大切";
    if (tone <= 10) return "積極的に外に向かってエネルギーを発信し、影響力を広げるステージ";
    return "より大きな視点で物事を捉え、手放すことで新たな可能性が開きます";
  })();
  return `${toneHint}。数秘の「${n.lifePathMeaning.theme}」というテーマを意識すると、今の時期に合った成長ができます。`;
}
