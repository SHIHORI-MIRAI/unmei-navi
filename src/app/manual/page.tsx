"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadProfile, loadLifeEvents, type UserProfile } from "@/lib/storage";
import {
  buildSelfManual,
  analyzeLifePatterns,
  type SelfManual,
  type ManualDetail,
} from "@/lib/divination";
import { useI18n } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/dict";
import UsageHelp from "@/components/UsageHelp";

/** この画面固有の二言語文言（dict.ts は編集禁止のためローカルで持つ） */
const L: Record<Lang, Record<string, string>> = {
  ja: {
    title: "わたしの取扱説明書",
    subtitle: " 専用・運命ナビの占術データから自動作成",
    you: "あなた",
    print: "🖨 印刷/保存",
    helpTitle: "取扱説明書の使い方",
    toc: "目次",
    sep: "・",
    sentenceEnd: "。",
    // 目次（短）
    toc01: "基本仕様",
    toc02: "この製品について",
    toc03: "正しい使い方",
    toc04: "メンテナンス（充電）",
    toc05: "取扱注意",
    toc06: "不調のときの対処",
    toc07: "詳しい特性",
    toc08: "今のモード",
    toc09: "まわりへのお願い",
    // 章タイトル（長）
    ch01: "基本仕様",
    ch02: "この製品について",
    ch03: "正しい使い方（力を発揮する条件）",
    ch04: "メンテナンス（充電のしかた）",
    ch05: "取扱注意・してはいけないこと",
    ch06: "不調のときの対処（トラブル対処）",
    ch07: "詳しい特性",
    ch08: "今のモード（時期）",
    ch09: "💌 まわりへのお願い（他己紹介用）",
    // スペック
    specNum: "数秘（魂）",
    specFour: "四柱推命（本質）",
    specSan: "算命学（才能）",
    specNine: "九星気学（性格）",
    specMaya: "マヤ暦（役割）",
    strengthsHeading: "得意なこと・強み",
    // 充電
    chargeColor: "ラッキーカラー",
    chargeNumber: "ナンバー",
    chargeDir: "ラッキー方位",
    chargeMoon: "月",
    luckyDirLabel: "吉方位（引越・旅行）：",
    favorablePrefix: "補うと整う気：",
    // 折りたたみ
    foldWork: "仕事・才能の活かし方",
    foldRel: "人間関係のトリセツ",
    foldAdvice: "さらに伸びるヒント",
    // 今のモード
    nineStarLabel: "九星の巡り",
    timingLinkPre: "もっと詳しい年ごとのリズムは ",
    timingLinkLabel: "人生の棚卸し",
    timingLinkPost: " の「9年サイクル」で見られます。",
    // まわりへのお願い
    forOthersNote: "※ 家族・受講生に「私の説明書」として渡せます。",
    // フッター
    footer: "※ 各占術の簡易計算による参考情報です。人生の主役はいつもあなた自身。",
    footerTime: "（出生時刻を登録すると四柱推命がより精密になります）",
    // 有料版への導線
    proBadge: "PREMIUM",
    proTitle: "もっと詳しい、全20ページの取扱説明書",
    proBody:
      "才能・人間関係・仕事・お金・これから3年の過ごし方まで。あなただけの鑑定書としてお作りします。",
    proCta: "くわしく見る",
  },
  ko: {
    title: "나만의 사용설명서",
    subtitle: " 전용·운명내비의 점술 데이터로 자동 작성",
    you: "당신",
    print: "🖨 인쇄/저장",
    helpTitle: "사용설명서 이용 방법",
    toc: "목차",
    sep: "·",
    sentenceEnd: ". ",
    // 목차（짧게）
    toc01: "기본 사양",
    toc02: "이 제품에 대하여",
    toc03: "올바른 사용법",
    toc04: "유지관리(충전)",
    toc05: "취급 주의",
    toc06: "컨디션 난조 시 대처",
    toc07: "상세 특성",
    toc08: "지금의 모드",
    toc09: "주위에 드리는 부탁",
    // 챕터 제목（길게）
    ch01: "기본 사양",
    ch02: "이 제품에 대하여",
    ch03: "올바른 사용법(힘을 발휘하는 조건)",
    ch04: "유지관리(충전 방법)",
    ch05: "취급 주의·해서는 안 되는 것",
    ch06: "컨디션 난조 시 대처(문제 해결)",
    ch07: "상세 특성",
    ch08: "지금의 모드(시기)",
    ch09: "💌 주위에 드리는 부탁(타인 소개용)",
    // 스펙
    specNum: "수비학(영혼)",
    specFour: "사주(본질)",
    specSan: "산명학(재능)",
    specNine: "구성기학(성격)",
    specMaya: "마야력(역할)",
    strengthsHeading: "잘하는 것·강점",
    // 충전
    chargeColor: "행운의 색",
    chargeNumber: "넘버",
    chargeDir: "행운의 방위",
    chargeMoon: "달",
    luckyDirLabel: "길방위(이사·여행):",
    favorablePrefix: "보충하면 안정되는 기운:",
    // 접이식
    foldWork: "일·재능을 살리는 법",
    foldRel: "인간관계 사용설명서",
    foldAdvice: "더 성장하는 힌트",
    // 지금의 모드
    nineStarLabel: "구성의 순환",
    timingLinkPre: "더 자세한 해마다의 리듬은 ",
    timingLinkLabel: "인생 총정리",
    timingLinkPost: " 의 「9년 사이클」에서 볼 수 있어요.",
    // 주위에 드리는 부탁
    forOthersNote: "※ 가족·수강생에게 「나의 설명서」로 건넬 수 있어요.",
    // 푸터
    footer: "※ 각 점술의 간이 계산에 따른 참고 정보예요. 인생의 주인공은 언제나 당신 자신이에요.",
    footerTime: "(출생 시각을 등록하면 사주가 더 정밀해져요.)",
    // 유료판 안내
    proBadge: "PREMIUM",
    proTitle: "더 자세한, 전 20페이지의 사용설명서",
    proBody:
      "재능·인간관계·일·돈, 그리고 앞으로 3년을 보내는 법까지. 당신만을 위한 감정서로 만들어 드려요.",
    proCta: "자세히 보기",
  },
};

export default function ManualPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<ReturnType<typeof loadLifeEvents>>([]);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.push("/profile");
      return;
    }
    setProfile(p);
    setEvents(loadLifeEvents());
  }, [router]);

  const manual: SelfManual | null = useMemo(
    () =>
      profile
        ? buildSelfManual(profile.birthDate, profile.birthTime, new Date(), lang)
        : null,
    [profile, lang]
  );

  const patterns = useMemo(
    () => (profile ? analyzeLifePatterns(events, profile.birthDate, lang) : null),
    [profile, events, lang]
  );

  if (!profile || !manual) {
    return <p className="text-muted text-center py-10">{t("astro.loading")}</p>;
  }

  const s = L[lang];

  const TOC = [
    { id: "s01", n: "01", title: s.toc01 },
    { id: "s02", n: "02", title: s.toc02 },
    { id: "s03", n: "03", title: s.toc03 },
    { id: "s04", n: "04", title: s.toc04 },
    { id: "s05", n: "05", title: s.toc05 },
    { id: "s06", n: "06", title: s.toc06 },
    { id: "s07", n: "07", title: s.toc07 },
    { id: "s08", n: "08", title: s.toc08 },
    { id: "s09", n: "09", title: s.toc09 },
  ];

  const helpSteps =
    lang === "ko"
      ? [
          <>당신의 <strong>생년월일로 계산한 각 점술(수비학·마야력·사주·산명학·구성기학)</strong>을 하나로 정리한, 나만의 설명서예요.</>,
          <><strong>올바른 사용법·취급 주의·컨디션 난조 시 대처</strong>를 알아두면, 무리 없이 자신을 살릴 수 있어요.</>,
          <>목차에서 각 장으로 이동할 수 있어요. 맨 아래의 <strong>「주위에 드리는 부탁」</strong>은 타인 소개에도 쓸 수 있어요.</>,
          <>인쇄/저장 버튼(또는 스크린샷)으로 손안에 남길 수 있어요.</>,
        ]
      : [
          <>あなたの<strong>生年月日から計算した各占術（数秘・マヤ・四柱推命・算命学・九星）</strong>を1つにまとめた、自分だけの説明書です。</>,
          <><strong>正しい使い方・取扱注意・不調のときの対処</strong>を知っておくと、無理なく自分を活かせます。</>,
          <>目次から各章にジャンプできます。いちばん下の<strong>「まわりへのお願い」</strong>は他己紹介にも使えます。</>,
          <>印刷/保存ボタン（またはスクショ）で手元に残せます。</>,
        ];

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
            <span className="text-accent-gold">📖</span> {s.title}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {profile.name || s.you}
            {s.subtitle}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex-shrink-0 text-xs bg-white border border-card-border rounded-full px-3 py-1.5 text-muted hover:border-accent-gold transition-colors"
        >
          {s.print}
        </button>
      </div>

      <UsageHelp
        storageKey="usage-help-manual"
        title={s.helpTitle}
        steps={helpSteps}
      />

      {/* 有料版（全20ページ）への導線 */}
      <Link
        href="/manual/pro"
        className="no-print block bg-gradient-to-br from-accent-gold/15 via-card-bg to-accent-orange/10 border border-accent-gold/40 rounded-2xl p-3.5 shadow-sm space-y-1.5"
      >
        <div className="flex items-center gap-2">
          <span className="text-[9px] tracking-[0.18em] font-bold text-accent-gold border border-accent-gold/50 rounded-full px-2 py-0.5">
            {s.proBadge}
          </span>
          <span className="text-[13px] font-bold text-foreground">{s.proTitle}</span>
        </div>
        <p className="text-[12px] text-foreground/80 leading-relaxed">{s.proBody}</p>
        <p className="text-[12px] text-accent-orange font-medium">{s.proCta} →</p>
      </Link>

      {/* 目次 */}
      <nav className="bg-card-bg border border-card-border rounded-2xl p-3.5 shadow-sm">
        <p className="text-xs font-bold text-accent-gold mb-2 flex items-center gap-1.5">
          <span>≡</span> {s.toc}
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {TOC.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-[12px] text-foreground/80 hover:text-accent-orange py-0.5 flex items-center gap-1.5"
            >
              <span className="text-accent-gold font-bold">{item.n}</span>
              {item.title}
            </a>
          ))}
        </div>
      </nav>

      {/* 01 基本仕様 */}
      <Chapter n="01" title={s.ch01} emoji="◈" id="s01" hero>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <SpecRow label={s.specNum} value={manual.spec.lifePath} />
          <SpecRow label={s.specFour} value={manual.spec.dayMaster} />
          <SpecRow label={s.specSan} value={manual.spec.mainStar} />
          <SpecRow label={s.specNine} value={manual.spec.honmeisei} />
          <SpecRow label={s.specMaya} value={manual.spec.mayan} full />
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed bg-white/60 rounded-xl px-3 py-2.5">
          {manual.spec.catchphrase}
        </p>
      </Chapter>

      {/* 02 この製品について */}
      <Chapter n="02" title={s.ch02} emoji="🌿" id="s02">
        <DetailList details={manual.details} field="character" sep={s.sep} />
        <div className="pt-1 border-t border-card-border space-y-1.5">
          <p className="text-xs font-bold text-accent-gold">{s.strengthsHeading}</p>
          {manual.strengths.map((st, i) => (
            <div key={i} className="flex items-start gap-2 text-[13px]">
              <span className="text-[10px] text-accent-gold bg-accent-gold/10 rounded-full px-1.5 py-0.5 mt-0.5 whitespace-nowrap">
                {st.source}
              </span>
              <span className="text-foreground/85">{st.text}</span>
            </div>
          ))}
        </div>
      </Chapter>

      {/* 03 正しい使い方 */}
      <Chapter n="03" title={s.ch03} emoji="✅" id="s03">
        <ul className="space-y-1.5">
          {manual.usage.map((u, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px]">
              <span className="text-accent-gold mt-0.5">✓</span>
              <span className="text-foreground/85 leading-relaxed">{u}</span>
            </li>
          ))}
        </ul>
      </Chapter>

      {/* 04 メンテナンス（充電） */}
      <Chapter n="04" title={s.ch04} emoji="🔋" id="s04">
        <div className="flex flex-wrap gap-2 text-[12px]">
          <ChargeChip label={s.chargeColor}>
            <span
              className="inline-block w-3 h-3 rounded-full mr-1 align-middle border border-black/10"
              style={{ backgroundColor: manual.charge.colorHex }}
            />
            {manual.charge.color}
          </ChargeChip>
          <ChargeChip label={s.chargeNumber}>{manual.charge.number}</ChargeChip>
          <ChargeChip label={s.chargeDir}>{manual.charge.direction}</ChargeChip>
          <ChargeChip label={s.chargeMoon}>
            {manual.charge.moonEmoji} {manual.charge.moonPhase}
          </ChargeChip>
        </div>
        {manual.charge.luckyDirections.length > 0 && (
          <p className="text-[12px] text-foreground/80">
            <span className="text-muted">{s.luckyDirLabel}</span>
            {manual.charge.luckyDirections.join(s.sep)}
          </p>
        )}
        <p className="text-[12px] text-foreground/80 bg-white/60 rounded-lg px-3 py-2 leading-relaxed">
          <span className="text-accent-gold font-medium">
            {s.favorablePrefix}
            {manual.charge.favorableElement}
          </span>
          <br />
          {manual.charge.favorableReason}
        </p>
      </Chapter>

      {/* 05 取扱注意 */}
      <Chapter n="05" title={s.ch05} emoji="⚠️" id="s05">
        <ul className="space-y-1.5">
          {manual.avoid.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px]">
              <span className="text-danger mt-0.5">✕</span>
              <span className="text-foreground/85 leading-relaxed">{a}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1.5 pt-1 border-t border-card-border">
          {manual.cautions.map((c, i) => (
            <p
              key={i}
              className="text-[12px] text-foreground/85 leading-relaxed bg-danger/5 rounded-lg px-3 py-2"
            >
              {c}
            </p>
          ))}
          {patterns && patterns.challengeCategory && (
            <p className="text-[12px] text-foreground/85 leading-relaxed bg-danger/5 rounded-lg px-3 py-2">
              {lang === "ko"
                ? `【행동 습관】「${patterns.challengeCategory.category}」의 상황에서 힘들어지기 쉬운 경향이 있어요. 하지만 그곳을 지날 때마다 강해지고 있어요. 무리하지 말고, 기댈 수 있는 곳은 사람에게 기대 보세요.`
                : `【行動のクセ】「${patterns.challengeCategory.category}」の場面で苦しみやすい傾向。でもそこを通るたびに強くなっています。無理せず、頼れるところは人に頼って。`}
            </p>
          )}
        </div>
      </Chapter>

      {/* 06 不調のときの対処 */}
      <Chapter n="06" title={s.ch06} emoji="🔧" id="s06">
        <div className="space-y-2">
          {manual.troubleshooting.map((tr, i) => (
            <div key={i} className="bg-white/60 rounded-lg px-3 py-2.5">
              <p className="text-[12px] font-bold text-foreground flex items-start gap-1.5">
                <span className="text-accent-orange">Q.</span> {tr.symptom}
              </p>
              <p className="text-[12px] text-foreground/80 leading-relaxed mt-1 flex items-start gap-1.5">
                <span className="text-accent-gold font-bold">A.</span> {tr.action}
              </p>
            </div>
          ))}
        </div>
      </Chapter>

      {/* 07 詳しい特性（折りたたみ） */}
      <Chapter n="07" title={s.ch07} emoji="🔍" id="s07">
        <FoldRow title={s.foldWork} emoji="💼">
          <DetailList details={manual.details} field="work" sep={s.sep} />
        </FoldRow>
        <FoldRow title={s.foldRel} emoji="🤝">
          <DetailList details={manual.details} field="relationship" sep={s.sep} />
        </FoldRow>
        <FoldRow title={s.foldAdvice} emoji="🌱">
          <DetailList details={manual.details} field="advice" sep={s.sep} />
        </FoldRow>
      </Chapter>

      {/* 08 今のモード */}
      <Chapter n="08" title={s.ch08} emoji="🗓" id="s08">
        <p className="text-[13px] text-foreground/85 leading-relaxed">
          <span className="font-bold text-accent-orange">
            {lang === "ko"
              ? `수비 ${manual.timing.personalYear} 「${manual.timing.cycleLabel}」의 해`
              : `数秘${manual.timing.personalYear}「${manual.timing.cycleLabel}」の年`}
          </span>{" "}
          — {manual.timing.personalYearTheme}
          {s.sentenceEnd}
          {manual.timing.personalYearAdvice}
        </p>
        <p className="text-[13px] text-foreground/85 leading-relaxed">
          <span className="font-bold text-accent-orange">{s.nineStarLabel}</span> —{" "}
          {manual.timing.nineStarTheme}
          {s.sentenceEnd}
          {manual.timing.nineStarAdvice}
        </p>
        <p className="text-[11px] text-muted pt-0.5">
          {s.timingLinkPre}
          <Link href="/life" className="underline text-accent-gold">
            {s.timingLinkLabel}
          </Link>
          {s.timingLinkPost}
        </p>
      </Chapter>

      {/* 09 まわりへのお願い */}
      <section
        id="s09"
        className="scroll-mt-4 bg-gradient-to-br from-accent-orange/10 via-card-bg to-accent-gold/5 border border-accent-orange/30 rounded-2xl p-4 shadow-sm space-y-2"
      >
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-orange/15 text-accent-orange text-[11px] font-bold flex items-center justify-center">
            09
          </span>
          <span>{s.ch09}</span>
        </h3>
        <p className="text-sm text-foreground/90 leading-relaxed bg-white/60 rounded-xl px-3.5 py-3">
          {manual.forOthers}
        </p>
        <p className="text-[10px] text-muted/70">{s.forOthersNote}</p>
      </section>

      <p className="text-center text-xs text-muted/60 px-4 leading-relaxed">
        {s.footer}
        {!manual.hasTime && s.footerTime}
      </p>
    </div>
  );
}

// --- サブコンポーネント ---

function Chapter({
  n,
  title,
  emoji,
  id,
  hero = false,
  children,
}: {
  n: string;
  title: string;
  emoji: string;
  id: string;
  hero?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-4 rounded-2xl border p-4 shadow-sm space-y-3 ${
        hero
          ? "bg-gradient-to-br from-accent-gold/10 via-card-bg to-accent-orange/5 border-accent-gold/30"
          : "bg-card-bg border-card-border"
      }`}
    >
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-orange/15 text-accent-orange text-[11px] font-bold flex items-center justify-center">
          {n}
        </span>
        <span>
          {emoji} {title}
        </span>
      </h3>
      {children}
    </section>
  );
}

function SpecRow({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={`bg-white/60 rounded-lg px-2.5 py-1.5 ${full ? "col-span-2" : ""}`}>
      <p className="text-[10px] text-muted">{label}</p>
      <p className="text-foreground font-medium leading-tight">{value}</p>
    </div>
  );
}

function FoldRow({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-card-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-medium text-foreground"
      >
        <span className="flex items-center gap-1.5">
          <span>{emoji}</span> {title}
        </span>
        <span className="text-accent-gold text-xs">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function DetailList({
  details,
  field,
  sep,
}: {
  details: ManualDetail[];
  field: keyof ManualDetail["trait"];
  sep: string;
}) {
  return (
    <div className="space-y-2">
      {details
        .filter((d) => d.trait[field])
        .map((d, i) => (
          <div key={i} className="space-y-0.5">
            <p className="text-[11px] text-accent-gold font-medium">
              {d.source}
              {sep}
              {d.label}
            </p>
            <p className="text-[13px] text-foreground/85 leading-relaxed">{d.trait[field]}</p>
          </div>
        ))}
    </div>
  );
}

function ChargeChip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="bg-white/60 rounded-lg px-2.5 py-1.5">
      <span className="text-[10px] text-muted block leading-none mb-0.5">{label}</span>
      <span className="text-foreground font-medium">{children}</span>
    </span>
  );
}
