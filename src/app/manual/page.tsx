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
          <><strong>充電のしかた</strong>や<strong>取扱注意</strong>を知っておくと、無理なく自分を活かせます。</>,
          <>いちばん下の<strong>「まわりへのお願い」</strong>は、家族や受講生に「私はこういう人」と渡せる他己紹介文です。</>,
          <>印刷/保存ボタン（またはスクショ）で手元に残せます。</>,
        ]}
      />

      {/* 基本仕様 */}
      <section className="bg-gradient-to-br from-accent-gold/10 via-card-bg to-accent-orange/5 border border-accent-gold/30 rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <span className="text-accent-gold">◈</span> 基本仕様
        </h3>
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
      </section>

      {/* 強み・才能 */}
      <ManualCard title="わたしの強み・才能" emoji="💪">
        <div className="space-y-1.5">
          {manual.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-[13px]">
              <span className="text-[10px] text-accent-gold bg-accent-gold/10 rounded-full px-1.5 py-0.5 mt-0.5 whitespace-nowrap">
                {s.source}
              </span>
              <span className="text-foreground/85">{s.text}</span>
            </div>
          ))}
        </div>
      </ManualCard>

      {/* 本質（常時表示） */}
      <ManualCard title="わたしの本質" emoji="🌿">
        <DetailList details={manual.details} field="character" />
      </ManualCard>

      {/* 充電のしかた */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2.5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <span>🔋</span> 充電のしかた（元気を回復する条件）
        </h3>
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
      </section>

      {/* 取扱注意 */}
      <ManualCard title="取扱注意" emoji="⚠️">
        <div className="space-y-1.5">
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
      </ManualCard>

      {/* 仕事・人間関係・伸びるヒント（折りたたみ） */}
      <FoldCard title="仕事・才能の活かし方" emoji="💼">
        <DetailList details={manual.details} field="work" />
      </FoldCard>
      <FoldCard title="人間関係のトリセツ" emoji="🤝">
        <DetailList details={manual.details} field="relationship" />
      </FoldCard>
      <FoldCard title="さらに伸びるヒント" emoji="🌱">
        <DetailList details={manual.details} field="advice" />
      </FoldCard>

      {/* 今の時期 */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <span>🗓</span> 今の時期の過ごし方
        </h3>
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
          もっと詳しい年ごとのリズムは <Link href="/life" className="underline text-accent-gold">人生の棚卸し</Link> の「9年サイクル」で見られます。
        </p>
      </section>

      {/* まわりへのお願い */}
      <section className="bg-gradient-to-br from-accent-orange/10 via-card-bg to-accent-gold/5 border border-accent-orange/30 rounded-2xl p-4 shadow-sm space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <span>💌</span> まわりへのお願い（他己紹介用）
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

function SpecRow({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={`bg-white/60 rounded-lg px-2.5 py-1.5 ${full ? "col-span-2" : ""}`}>
      <p className="text-[10px] text-muted">{label}</p>
      <p className="text-foreground font-medium leading-tight">{value}</p>
    </div>
  );
}

function ManualCard({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2.5">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <span>{emoji}</span> {title}
      </h3>
      {children}
    </section>
  );
}

function FoldCard({
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
    <section className="bg-card-bg border border-card-border rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-foreground"
      >
        <span className="flex items-center gap-1.5">
          <span>{emoji}</span> {title}
        </span>
        <span className="text-accent-gold text-xs">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="px-4 pb-4 -mt-1">{children}</div>}
    </section>
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
            <p className="text-[13px] text-foreground/85 leading-relaxed">
              {d.trait[field]}
            </p>
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
