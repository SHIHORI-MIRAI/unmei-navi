"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadProfile } from "@/lib/storage";
import {
  calcNumerology,
  calcMayan,
  calcTodayMayan,
  calcNineStar,
  calcFourPillars,
  calcSanmeigaku,
  type NumerologyResult,
  type MayanResult,
  type NineStarResult,
  type FourPillarsResult,
  type SanmeigakuResult,
} from "@/lib/divination";
import { useI18n } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/dict";
import {
  mayanSealName,
  mayanSealKeyword,
  mayanToneName,
  mayanToneKeyword,
  nineStarName,
  directionName,
  elementName,
} from "@/lib/i18n/fortune-terms";

/** この画面固有の二言語文言 */
const L: Record<Lang, Record<string, string>> = {
  ja: {
    title: "今日の詳細",
    auto: "自動計算 ★★",
    layerSoul: "魂・本質の層",
    layerFortune: "運気・時期の層",
    layerTalent: "性格・才能の層",
    numerology: "数秘術",
    mayanSelf: "マヤ暦（あなたの本質）",
    mayanToday: "マヤ暦（今日のエネルギー）",
    fourPillars: "四柱推命",
    nineStar: "九星気学",
    sanmeigaku: "算命学",
    lifePath: "ライフパスナンバー：",
    theme: "テーマ：",
    personalYear: "パーソナルイヤー：",
    personalMonth: "パーソナルマンス：",
    personalDay: "パーソナルデイ：",
    kin: "KIN：",
    solarSeal: "太陽の紋章：",
    waveSpell: "ウェイブスペル：",
    galacticTone: "銀河の音：",
    todayKin: "今日のKIN：",
    todaySeal: "今日の紋章：",
    todayTone: "今日の音：",
    pillarHour: "時柱",
    pillarDay: "日柱",
    pillarMonth: "月柱",
    pillarYear: "年柱",
    dayMaster: "日主（あなたの本質）：",
    monthTsuuhen: "月柱の通変星：",
    fiveElements: "五行バランス",
    honmei: "本命星：",
    getsumei: "月命星：",
    yearPos: "今年の位置：",
    luckyDir: "吉方位：",
    unluckyDir: "凶方位：",
    mainStar: "主星：",
    bodyChartTitle: "人体星図（十大主星）",
    bodyNorth: "北（頭）",
    bodyEast: "東",
    bodyCenter: "中央",
    bodyWest: "西",
    bodySouth: "南（腹）",
    subStarTitle: "十二大従星（エネルギー）",
    totalEnergy: "総合エネルギー：",
    energyHigh: "高エネルギー型",
    energyBalance: "バランス型",
    energyEco: "省エネ型",
    subHead: "頭",
    subChest: "胸",
    subBelly: "腹",
    tenchu: "天中殺：",
    astroLink: "🌍 {brand}で運命の土地を見る →",
    readingsLink: "鑑定結果を登録・管理する →",
  },
  ko: {
    title: "오늘의 상세",
    auto: "자동계산 ★★",
    layerSoul: "영혼·본질의 층",
    layerFortune: "운기·시기의 층",
    layerTalent: "성격·재능의 층",
    numerology: "수비학",
    mayanSelf: "마야력（당신의 본질）",
    mayanToday: "마야력（오늘의 에너지）",
    fourPillars: "사주",
    nineStar: "구성기학",
    sanmeigaku: "산명학",
    lifePath: "라이프패스 넘버：",
    theme: "테마：",
    personalYear: "퍼스널 이어：",
    personalMonth: "퍼스널 먼스：",
    personalDay: "퍼스널 데이：",
    kin: "KIN：",
    solarSeal: "태양의 문장：",
    waveSpell: "웨이브 스펠：",
    galacticTone: "은하의 음：",
    todayKin: "오늘의 KIN：",
    todaySeal: "오늘의 문장：",
    todayTone: "오늘의 음：",
    pillarHour: "시주",
    pillarDay: "일주",
    pillarMonth: "월주",
    pillarYear: "연주",
    dayMaster: "일간（당신의 본질）：",
    monthTsuuhen: "월주의 통변성：",
    fiveElements: "오행 밸런스",
    honmei: "본명성：",
    getsumei: "월명성：",
    yearPos: "올해의 위치：",
    luckyDir: "길방위：",
    unluckyDir: "흉방위：",
    mainStar: "주성：",
    bodyChartTitle: "인체성도（십대주성）",
    bodyNorth: "북（머리）",
    bodyEast: "동",
    bodyCenter: "중앙",
    bodyWest: "서",
    bodySouth: "남（배）",
    subStarTitle: "십이대종성（에너지）",
    totalEnergy: "종합 에너지：",
    energyHigh: "고에너지형",
    energyBalance: "밸런스형",
    energyEco: "절약형",
    subHead: "머리",
    subChest: "가슴",
    subBelly: "배",
    tenchu: "천중살：",
    astroLink: "🌍 {brand}에서 운명의 땅을 보기 →",
    readingsLink: "감정 결과를 등록·관리하기 →",
  },
};

/** 本命星・月命星の性格文（エンジンは日本語のみ返すため、韓国語はこの画面で補う） */
const NINE_STAR_PERSONALITY_KO: Record<number, string> = {
  1: "유연하고 적응력이 높아요. 지성과 포용력을 지니고 주위를 촉촉하게 적셔주는 존재예요",
  2: "어머니 같은 따뜻함과 인내력을 지녔어요. 꾸준하고 착실하게 노력할 수 있어요",
  3: "젊고 싱그러운 에너지가 넘쳐요. 행동력이 있고 새로운 일에 적극적이에요",
  4: "온화하고 조화를 소중히 여겨요. 인맥을 쌓는 힘이 뛰어나 신뢰를 모아요",
  5: "강한 의지와 카리스마의 소유자예요. 제왕의 별이라 불리며 주위를 움직이는 힘이 있어요",
  6: "품격이 있고 리더십이 뛰어나요. 하늘의 은혜를 받기 쉬워요",
  7: "사교적이고 즐거운 것을 좋아해요. 대화에 능숙하고 사람을 끌어당기는 매력이 있어요",
  8: "산과 같은 안정감과 변혁의 힘을 지녔어요. 끈기 있게 목표를 달성해요",
  9: "화려하고 지적이에요. 미적 감각과 열정을 지니고 정상을 향해 나아가요",
};

function nineStarPersonality(num: number, ja: string, lang: Lang): string {
  return lang === "ko" ? NINE_STAR_PERSONALITY_KO[num] ?? ja : ja;
}

/** 用神の理由文（エンジンは日本語のみのため、韓国語は要素から再構成） */
const FAVORABLE_GENERATES: Record<string, string> = {
  木: "火", 火: "土", 土: "金", 金: "水", 水: "木",
};

function favorableReason(
  dayElement: string,
  favElement: string,
  jaReason: string,
  lang: Lang
): string {
  if (lang !== "ko") return jaReason;
  const dayEl = elementName(dayElement, lang);
  const favEl = elementName(favElement, lang);
  // 身強（洩らす五行が吉）か身弱（生じる五行が吉）かを結果値から判定
  if (FAVORABLE_GENERATES[dayElement] === favElement) {
    return `${dayEl} 기운이 강하므로, ${favEl} 기운으로 발산하면 길해요`;
  }
  return `${dayEl} 기운을 보완하기 위해, ${favEl} 기운을 빌리면 길해요`;
}

export default function DetailPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [numerology, setNumerology] = useState<NumerologyResult | null>(null);
  const [mayan, setMayan] = useState<MayanResult | null>(null);
  const [todayMayan, setTodayMayan] = useState<MayanResult | null>(null);
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
    setNumerology(calcNumerology(profile.birthDate, today, lang));
    setMayan(calcMayan(profile.birthDate));
    setTodayMayan(calcTodayMayan(today));
    setNineStar(calcNineStar(profile.birthDate, today.getFullYear(), lang));
    setFourPillars(calcFourPillars(profile.birthDate, profile.birthTime || undefined, lang));
    setSanmeigaku(calcSanmeigaku(profile.birthDate, lang));
  }, [router, lang]);

  const s = L[lang];

  if (!numerology || !mayan || !todayMayan || !nineStar || !fourPillars || !sanmeigaku) {
    return <p className="text-muted text-center py-10">{t("astro.loading")}</p>;
  }

  const energyType =
    sanmeigaku.totalEnergy >= 24 ? s.energyHigh : sanmeigaku.totalEnergy >= 15 ? s.energyBalance : s.energyEco;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">☽</span>
        {s.title}
      </h2>

      {/* 魂・本質の層 */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> {s.layerSoul}
        </h3>

        {/* 数秘術 */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{s.numerology}</span>
            <span className="text-xs text-muted">{s.auto}</span>
          </div>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted">{s.lifePath}</span>
              <span className="text-accent-orange font-bold text-lg">{numerology.lifePathNumber}</span>
              <span className="text-muted ml-1">（{numerology.lifePathMeaning.title}）</span>
            </p>
            <p className="text-foreground/80">{numerology.lifePathMeaning.strength}</p>
            <p className="text-xs text-muted mt-1">{s.theme}{numerology.lifePathMeaning.theme}</p>
            <div className="border-t border-card-border mt-2 pt-2">
              <p>
                <span className="text-muted">{s.personalYear}</span>
                <span className="font-medium">{numerology.personalYear}</span>
                <span className="text-muted ml-1">（{numerology.personalYearMeaning.theme}）</span>
              </p>
              <p>
                <span className="text-muted">{s.personalMonth}</span>
                <span className="font-medium">{numerology.personalMonth}</span>
              </p>
              <p>
                <span className="text-muted">{s.personalDay}</span>
                <span className="font-medium">{numerology.personalDay}</span>
              </p>
            </div>
          </div>
        </div>

        {/* マヤ暦（自分） */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{s.mayanSelf}</span>
            <span className="text-xs text-muted">{s.auto}</span>
          </div>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted">{s.kin}</span>
              <span className="text-accent-orange font-bold text-lg">{mayan.kinNumber}</span>
            </p>
            <p>
              <span className="text-muted">{s.solarSeal}</span>
              <span className="font-medium">{mayanSealName(mayan.solarSeal.name, lang)}</span>
              <span className="text-muted ml-1">（{mayanSealKeyword(mayan.solarSeal.keyword, lang)}）</span>
            </p>
            <p>
              <span className="text-muted">{s.waveSpell}</span>
              <span className="font-medium">{mayanSealName(mayan.waveSpell.name, lang)}</span>
              <span className="text-muted ml-1">（{mayanSealKeyword(mayan.waveSpell.keyword, lang)}）</span>
            </p>
            <p>
              <span className="text-muted">{s.galacticTone}</span>
              <span className="font-medium">{mayan.galacticTone.tone}（{mayanToneName(mayan.galacticTone.name, lang)}）</span>
              <span className="text-muted ml-1">- {mayanToneKeyword(mayan.galacticTone.keyword, lang)}</span>
            </p>
          </div>
        </div>

        {/* マヤ暦（今日のエネルギー） */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{s.mayanToday}</span>
            <span className="text-xs text-muted">{s.auto}</span>
          </div>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted">{s.todayKin}</span>
              <span className="font-bold">{todayMayan.kinNumber}</span>
            </p>
            <p>
              <span className="text-muted">{s.todaySeal}</span>
              <span className="font-medium">{mayanSealName(todayMayan.solarSeal.name, lang)}</span>
              <span className="text-muted ml-1">（{mayanSealKeyword(todayMayan.solarSeal.keyword, lang)}）</span>
            </p>
            <p>
              <span className="text-muted">{s.todayTone}</span>
              <span className="font-medium">{todayMayan.galacticTone.tone}（{mayanToneName(todayMayan.galacticTone.name, lang)}）</span>
            </p>
          </div>
        </div>
      </section>

      {/* 運気・時期の層 */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> {s.layerFortune}
        </h3>

        {/* 四柱推命 */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{s.fourPillars}</span>
            <span className="text-xs text-muted">{s.auto}</span>
          </div>
          <div className="text-sm space-y-1">
            {/* 命式表 */}
            <div className="grid grid-cols-4 gap-1 text-center text-xs mb-2">
              <div className="text-muted">{s.pillarHour}</div>
              <div className="text-muted">{s.pillarDay}</div>
              <div className="text-muted">{s.pillarMonth}</div>
              <div className="text-muted">{s.pillarYear}</div>
              <div className="bg-accent-orange/10 rounded py-1 font-medium">
                {fourPillars.hourPillar?.stem.name || "—"}
              </div>
              <div className="bg-accent-orange/10 rounded py-1 font-bold text-accent-orange">
                {fourPillars.dayPillar.stem.name}
              </div>
              <div className="bg-accent-orange/10 rounded py-1 font-medium">
                {fourPillars.monthPillar.stem.name}
              </div>
              <div className="bg-accent-orange/10 rounded py-1 font-medium">
                {fourPillars.yearPillar.stem.name}
              </div>
              <div className="bg-card-border/30 rounded py-1">
                {fourPillars.hourPillar?.branch.name || "—"}
              </div>
              <div className="bg-card-border/30 rounded py-1 font-medium">
                {fourPillars.dayPillar.branch.name}
              </div>
              <div className="bg-card-border/30 rounded py-1">
                {fourPillars.monthPillar.branch.name}
              </div>
              <div className="bg-card-border/30 rounded py-1">
                {fourPillars.yearPillar.branch.name}
              </div>
            </div>

            {/* 日主 */}
            <p>
              <span className="text-muted">{s.dayMaster}</span>
              <span className="text-accent-orange font-bold">{fourPillars.dayMaster.stem}</span>
              <span className="text-muted ml-1">（{fourPillars.dayMaster.title}・{elementName(fourPillars.dayMaster.element, lang)}）</span>
            </p>
            <p className="text-foreground/80">{fourPillars.dayMaster.personality}</p>

            {/* 通変星 */}
            <div className="border-t border-card-border mt-2 pt-2">
              <p>
                <span className="text-muted">{s.monthTsuuhen}</span>
                <span className="font-medium">{fourPillars.tsuuhenStars.monthStar}</span>
                <span className="text-muted ml-1">（{fourPillars.tsuuhenMeaning.keyword}）</span>
              </p>
              <p className="text-foreground/80 text-xs">{fourPillars.tsuuhenMeaning.personality}</p>
            </div>

            {/* 五行バランス */}
            <div className="border-t border-card-border mt-2 pt-2">
              <p className="text-muted text-xs mb-1">{s.fiveElements}</p>
              <div className="flex gap-1">
                {(["木", "火", "土", "金", "水"] as const).map((el) => {
                  const count = fourPillars.fiveElements[el];
                  const colors: Record<string, string> = {
                    木: "#22c55e", 火: "#ef4444", 土: "#eab308", 金: "#a3a3a3", 水: "#3b82f6",
                  };
                  return (
                    <div key={el} className="flex-1 text-center">
                      <div
                        className="rounded-full h-6 flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: colors[el], opacity: count > 0 ? 1 : 0.3 }}
                      >
                        {el}{count}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-accent-gold mt-1">
                ▸ {favorableReason(fourPillars.dayMaster.element, fourPillars.favorableElement.element, fourPillars.favorableElement.reason, lang)}
              </p>
            </div>
          </div>
        </div>

        {/* 九星気学 */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{s.nineStar}</span>
            <span className="text-xs text-muted">{s.auto}</span>
          </div>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted">{s.honmei}</span>
              <span className="text-accent-orange font-bold">{nineStarName(nineStar.honmeisei.name, lang)}</span>
            </p>
            <p className="text-foreground/80">{nineStarPersonality(nineStar.honmeisei.number, nineStar.honmeisei.personality, lang)}</p>
            <p>
              <span className="text-muted">{s.getsumei}</span>
              <span className="font-medium">{nineStarName(nineStar.getsumeisei.name, lang)}</span>
            </p>
            <p className="text-foreground/80 text-xs">{nineStarPersonality(nineStar.getsumeisei.number, nineStar.getsumeisei.personality, lang)}</p>
            <div className="border-t border-card-border mt-2 pt-2">
              <p>
                <span className="text-muted">{s.yearPos}</span>
                <span className="font-medium">{directionName(nineStar.yearPosition.direction, lang)}</span>
              </p>
              <p className="text-foreground/80">{nineStar.yearPosition.theme}</p>
              <p className="text-xs text-accent-gold mt-1">
                ▸ {nineStar.yearPosition.advice}
              </p>
              <p className="text-xs text-muted mt-0.5">
                ▸ {nineStar.yearPosition.caution}
              </p>
            </div>
            {nineStar.luckyDirections.length > 0 && (
              <div className="border-t border-card-border mt-2 pt-2">
                <p>
                  <span className="text-muted">{s.luckyDir}</span>
                  <span className="text-accent-gold font-medium">{nineStar.luckyDirections.map((d) => directionName(d, lang)).join("・")}</span>
                </p>
                {nineStar.unluckyDirections.length > 0 && (
                  <p>
                    <span className="text-muted">{s.unluckyDir}</span>
                    <span className="text-foreground/60">{nineStar.unluckyDirections.map((d) => directionName(d, lang)).join("・")}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 性格・才能の層 */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> {s.layerTalent}
        </h3>

        {/* 算命学 */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{s.sanmeigaku}</span>
            <span className="text-xs text-muted">{s.auto}</span>
          </div>
          <div className="text-sm space-y-1">
            {/* 主星 */}
            <p>
              <span className="text-muted">{s.mainStar}</span>
              <span className="text-accent-orange font-bold">{sanmeigaku.mainStar.name}</span>
              <span className="text-muted ml-1">（{sanmeigaku.mainStar.keyword}）</span>
            </p>
            <p className="text-foreground/80">{sanmeigaku.mainStar.personality}</p>

            {/* 人体星図 */}
            <div className="border-t border-card-border mt-2 pt-2">
              <p className="text-muted text-xs mb-1">{s.bodyChartTitle}</p>
              <div className="grid grid-cols-3 gap-1 text-center text-xs max-w-[220px] mx-auto">
                <div />
                <div className="bg-accent-gold/10 border border-accent-gold/30 rounded py-1.5">
                  <p className="text-[10px] text-muted">{s.bodyNorth}</p>
                  <p className="font-medium text-foreground">{sanmeigaku.bodyChart.north.name}</p>
                </div>
                <div />
                <div className="bg-accent-gold/10 border border-accent-gold/30 rounded py-1.5">
                  <p className="text-[10px] text-muted">{s.bodyEast}</p>
                  <p className="font-medium text-foreground">{sanmeigaku.bodyChart.east.name}</p>
                </div>
                <div className="bg-accent-orange/10 border border-accent-orange/30 rounded py-1.5">
                  <p className="text-[10px] text-muted">{s.bodyCenter}</p>
                  <p className="font-bold text-accent-orange">{sanmeigaku.bodyChart.center.name}</p>
                </div>
                <div className="bg-accent-gold/10 border border-accent-gold/30 rounded py-1.5">
                  <p className="text-[10px] text-muted">{s.bodyWest}</p>
                  <p className="font-medium text-foreground">{sanmeigaku.bodyChart.west.name}</p>
                </div>
                <div />
                <div className="bg-accent-gold/10 border border-accent-gold/30 rounded py-1.5">
                  <p className="text-[10px] text-muted">{s.bodySouth}</p>
                  <p className="font-medium text-foreground">{sanmeigaku.bodyChart.south.name}</p>
                </div>
                <div />
              </div>
            </div>

            {/* 従星 */}
            <div className="border-t border-card-border mt-2 pt-2">
              <p className="text-muted text-xs mb-1">{s.subStarTitle}</p>
              <div className="space-y-1">
                {[
                  { label: s.subHead, star: sanmeigaku.subStars.head },
                  { label: s.subChest, star: sanmeigaku.subStars.chest },
                  { label: s.subBelly, star: sanmeigaku.subStars.belly },
                ].map((sub) => (
                  <div key={sub.label} className="flex items-center gap-2">
                    <span className="text-xs text-muted w-6">{sub.label}</span>
                    <span className="text-xs font-medium w-16">{sub.star.name}</span>
                    <div className="flex-1 bg-background rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-accent-orange/70"
                        style={{ width: `${(sub.star.energy / 12) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted w-4">{sub.star.energy}</span>
                  </div>
                ))}
                <p className="text-xs text-accent-gold mt-1">
                  ▸ {s.totalEnergy}{sanmeigaku.totalEnergy}/36（{energyType}）
                </p>
              </div>
            </div>

            {/* 天中殺 */}
            <div className="border-t border-card-border mt-2 pt-2">
              <p>
                <span className="text-muted">{s.tenchu}</span>
                <span className="font-medium">{sanmeigaku.tenchu.name}</span>
              </p>
              <p className="text-foreground/80 text-xs">{sanmeigaku.tenchu.meaning}</p>
              <p className="text-xs text-accent-gold mt-1">
                ▸ {sanmeigaku.tenchu.theme}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* アストロマップへ */}
      <Link
        href="/astro"
        className="block text-center py-3 bg-gradient-to-r from-[#5b8fd6]/10 via-card-bg to-accent-orange/10 border border-accent-gold/30 rounded-2xl shadow-sm text-accent-orange text-sm font-medium hover:opacity-90 transition-opacity"
      >
        {s.astroLink.replace("{brand}", t("astro.brand"))}
      </Link>

      {/* 鑑定結果登録へ */}
      <Link
        href="/readings"
        className="block text-center py-3 bg-card-bg border border-card-border rounded-2xl shadow-sm text-accent-orange text-sm font-medium hover:bg-accent-orange/5 transition-colors"
      >
        {s.readingsLink}
      </Link>

      <p className="text-center text-xs text-muted/60 px-4">
        {t("common.disclaimer")}
      </p>
    </div>
  );
}
