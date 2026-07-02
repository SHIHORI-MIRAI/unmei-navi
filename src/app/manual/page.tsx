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
import UsageHelp from "@/components/UsageHelp";

const TOC = [
  { id: "s01", n: "01", title: "基本仕様" },
  { id: "s02", n: "02", title: "この製品について" },
  { id: "s03", n: "03", title: "正しい使い方" },
  { id: "s04", n: "04", title: "メンテナンス（充電）" },
  { id: "s05", n: "05", title: "取扱注意" },
  { id: "s06", n: "06", title: "不調のときの対処" },
  { id: "s07", n: "07", title: "詳しい特性" },
  { id: "s08", n: "08", title: "今のモード" },
  { id: "s09", n: "09", title: "まわりへのお願い" },
];

export default function ManualPage() {
  const router = useRouter();
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
    () => (profile ? buildSelfManual(profile.birthDate, profile.birthTime, new Date()) : null),
    [profile]
  );

  const patterns = useMemo(
    () => (profile ? analyzeLifePatterns(events, profile.birthDate) : null),
    [profile, events]
  );

  if (!profile || !manual) {
    return <p className="text-muted text-center py-10">読み込み中...</p>;
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
            <span className="text-accent-gold">📖</span> わたしの取扱説明書
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {profile.name || "あなた"} 専用・運命ナビの占術データから自動作成
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex-shrink-0 text-xs bg-white border border-card-border rounded-full px-3 py-1.5 text-muted hover:border-accent-gold transition-colors"
        >
          🖨 印刷/保存
        </button>
      </div>

      <UsageHelp
        storageKey="usage-help-manual"
        title="取扱説明書の使い方"
        steps={[
          <>あなたの<strong>生年月日から計算した各占術（数秘・マヤ・四柱推命・算命学・九星）</strong>を1つにまとめた、自分だけの説明書です。</>,
          <><strong>正しい使い方・取扱注意・不調のときの対処</strong>を知っておくと、無理なく自分を活かせます。</>,
          <>目次から各章にジャンプできます。いちばん下の<strong>「まわりへのお願い」</strong>は他己紹介にも使えます。</>,
          <>印刷/保存ボタン（またはスクショ）で手元に残せます。</>,
        ]}
      />

      {/* 目次 */}
      <nav className="bg-card-bg border border-card-border rounded-2xl p-3.5 shadow-sm">
        <p className="text-xs font-bold text-accent-gold mb-2 flex items-center gap-1.5">
          <span>≡</span> 目次
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {TOC.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="text-[12px] text-foreground/80 hover:text-accent-orange py-0.5 flex items-center gap-1.5"
            >
              <span className="text-accent-gold font-bold">{t.n}</span>
              {t.title}
            </a>
          ))}
        </div>
      </nav>

      {/* 01 基本仕様 */}
      <Chapter n="01" title="基本仕様" emoji="◈" id="s01" hero>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <SpecRow label="数秘（魂）" value={manual.spec.lifePath} />
          <SpecRow label="四柱推命（本質）" value={manual.spec.dayMaster} />
          <SpecRow label="算命学（才能）" value={manual.spec.mainStar} />
          <SpecRow label="九星気学（性格）" value={manual.spec.honmeisei} />
          <SpecRow label="マヤ暦（役割）" value={manual.spec.mayan} full />
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed bg-white/60 rounded-xl px-3 py-2.5">
          {manual.spec.catchphrase}
        </p>
      </Chapter>

      {/* 02 この製品について */}
      <Chapter n="02" title="この製品について" emoji="🌿" id="s02">
        <DetailList details={manual.details} field="character" />
        <div className="pt-1 border-t border-card-border space-y-1.5">
          <p className="text-xs font-bold text-accent-gold">得意なこと・強み</p>
          {manual.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-[13px]">
              <span className="text-[10px] text-accent-gold bg-accent-gold/10 rounded-full px-1.5 py-0.5 mt-0.5 whitespace-nowrap">
                {s.source}
              </span>
              <span className="text-foreground/85">{s.text}</span>
            </div>
          ))}
        </div>
      </Chapter>

      {/* 03 正しい使い方 */}
      <Chapter n="03" title="正しい使い方（力を発揮する条件）" emoji="✅" id="s03">
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
      <Chapter n="04" title="メンテナンス（充電のしかた）" emoji="🔋" id="s04">
        <div className="flex flex-wrap gap-2 text-[12px]">
          <ChargeChip label="ラッキーカラー">
            <span
              className="inline-block w-3 h-3 rounded-full mr-1 align-middle border border-black/10"
              style={{ backgroundColor: manual.charge.colorHex }}
            />
            {manual.charge.color}
          </ChargeChip>
          <ChargeChip label="ナンバー">{manual.charge.number}</ChargeChip>
          <ChargeChip label="ラッキー方位">{manual.charge.direction}</ChargeChip>
          <ChargeChip label="月">
            {manual.charge.moonEmoji} {manual.charge.moonPhase}
          </ChargeChip>
        </div>
        {manual.charge.luckyDirections.length > 0 && (
          <p className="text-[12px] text-foreground/80">
            <span className="text-muted">吉方位（引越・旅行）：</span>
            {manual.charge.luckyDirections.join("・")}
          </p>
        )}
        <p className="text-[12px] text-foreground/80 bg-white/60 rounded-lg px-3 py-2 leading-relaxed">
          <span className="text-accent-gold font-medium">補うと整う気：{manual.charge.favorableElement}</span>
          <br />
          {manual.charge.favorableReason}
        </p>
      </Chapter>

      {/* 05 取扱注意 */}
      <Chapter n="05" title="取扱注意・してはいけないこと" emoji="⚠️" id="s05">
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
              【行動のクセ】「{patterns.challengeCategory.category}」の場面で苦しみやすい傾向。
              でもそこを通るたびに強くなっています。無理せず、頼れるところは人に頼って。
            </p>
          )}
        </div>
      </Chapter>

      {/* 06 不調のときの対処 */}
      <Chapter n="06" title="不調のときの対処（トラブル対処）" emoji="🔧" id="s06">
        <div className="space-y-2">
          {manual.troubleshooting.map((t, i) => (
            <div key={i} className="bg-white/60 rounded-lg px-3 py-2.5">
              <p className="text-[12px] font-bold text-foreground flex items-start gap-1.5">
                <span className="text-accent-orange">Q.</span> {t.symptom}
              </p>
              <p className="text-[12px] text-foreground/80 leading-relaxed mt-1 flex items-start gap-1.5">
                <span className="text-accent-gold font-bold">A.</span> {t.action}
              </p>
            </div>
          ))}
        </div>
      </Chapter>

      {/* 07 詳しい特性（折りたたみ） */}
      <Chapter n="07" title="詳しい特性" emoji="🔍" id="s07">
        <FoldRow title="仕事・才能の活かし方" emoji="💼">
          <DetailList details={manual.details} field="work" />
        </FoldRow>
        <FoldRow title="人間関係のトリセツ" emoji="🤝">
          <DetailList details={manual.details} field="relationship" />
        </FoldRow>
        <FoldRow title="さらに伸びるヒント" emoji="🌱">
          <DetailList details={manual.details} field="advice" />
        </FoldRow>
      </Chapter>

      {/* 08 今のモード */}
      <Chapter n="08" title="今のモード（時期）" emoji="🗓" id="s08">
        <p className="text-[13px] text-foreground/85 leading-relaxed">
          <span className="font-bold text-accent-orange">
            数秘{manual.timing.personalYear}「{manual.timing.cycleLabel}」の年
          </span>
          — {manual.timing.personalYearTheme}。{manual.timing.personalYearAdvice}
        </p>
        <p className="text-[13px] text-foreground/85 leading-relaxed">
          <span className="font-bold text-accent-orange">九星の巡り</span> — {manual.timing.nineStarTheme}。
          {manual.timing.nineStarAdvice}
        </p>
        <p className="text-[11px] text-muted pt-0.5">
          もっと詳しい年ごとのリズムは{" "}
          <Link href="/life" className="underline text-accent-gold">人生の棚卸し</Link>{" "}
          の「9年サイクル」で見られます。
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
          <span>💌 まわりへのお願い（他己紹介用）</span>
        </h3>
        <p className="text-sm text-foreground/90 leading-relaxed bg-white/60 rounded-xl px-3.5 py-3">
          {manual.forOthers}
        </p>
        <p className="text-[10px] text-muted/70">
          ※ 家族・受講生に「私の説明書」として渡せます。
        </p>
      </section>

      <p className="text-center text-xs text-muted/60 px-4 leading-relaxed">
        ※ 各占術の簡易計算による参考情報です。人生の主役はいつもあなた自身。
        {!manual.hasTime && "（出生時刻を登録すると四柱推命がより精密になります）"}
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
}: {
  details: ManualDetail[];
  field: keyof ManualDetail["trait"];
}) {
  return (
    <div className="space-y-2">
      {details
        .filter((d) => d.trait[field])
        .map((d, i) => (
          <div key={i} className="space-y-0.5">
            <p className="text-[11px] text-accent-gold font-medium">
              {d.source}・{d.label}
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
