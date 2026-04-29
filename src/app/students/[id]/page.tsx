"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { loadProfileById, type UserProfile } from "@/lib/storage";
import {
  calcNumerology,
  calcMayan,
  calcNineStar,
  calcFourPillars,
  calcSanmeigaku,
  calcPersonalMonth,
  getPersonalMonthMeaning,
  checkTenchusatsuYear,
  type NumerologyResult,
  type MayanResult,
  type NineStarResult,
  type FourPillarsResult,
  type SanmeigakuResult,
} from "@/lib/divination";

function calcAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() + 1 < m ||
    (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

interface Calculated {
  numerology: NumerologyResult;
  mayan: MayanResult;
  nineStar: NineStarResult;
  fourPillars: FourPillarsResult;
  sanmeigaku: SanmeigakuResult;
  personalMonth: number;
  personalMonthMeaning: { theme: string; advice: string; caution: string };
  isTenchuYear: boolean;
}

function buildCalculated(profile: UserProfile): Calculated {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const personalMonth = calcPersonalMonth(profile.birthDate, year, month);
  return {
    numerology: calcNumerology(profile.birthDate),
    mayan: calcMayan(profile.birthDate),
    nineStar: calcNineStar(profile.birthDate, year),
    fourPillars: calcFourPillars(profile.birthDate, profile.birthTime),
    sanmeigaku: calcSanmeigaku(profile.birthDate),
    personalMonth,
    personalMonthMeaning: getPersonalMonthMeaning(personalMonth),
    isTenchuYear: checkTenchusatsuYear(profile.birthDate, year).isTenchusatsu,
  };
}

/** 強み・特徴を3-5個の短いキーワードで抽出 */
function extractStrengthBullets(c: Calculated): string[] {
  const set = new Set<string>();
  c.numerology.lifePathMeaning.strength
    .split(/[・、,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => set.add(s));
  c.fourPillars.dayMaster.strength
    .split(/[・、,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => set.add(s));
  c.sanmeigaku.mainStar.strength
    .split(/[・、,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => set.add(s));
  return Array.from(set).slice(0, 6);
}

/** 伴走アドバイス（運気×天中殺×強みから） */
function buildCoachAdvice(c: Calculated): string {
  const parts: string[] = [];
  if (c.isTenchuYear) {
    parts.push(
      "今年は天中殺年。新規拡大より「学び・準備・整理」がテーマ。本人が焦っていたら『今は土台づくりの時期』と伝えると◎"
    );
  }
  parts.push(
    `今月は「${c.personalMonthMeaning.theme}」。${c.personalMonthMeaning.advice}`
  );
  parts.push(
    `強みの軸は ${c.sanmeigaku.mainStar.name}（${c.sanmeigaku.mainStar.keyword}）。${c.sanmeigaku.mainStar.personality}`
  );
  return parts.join("\n\n");
}

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProfile(loadProfileById(id));
    setLoaded(true);
  }, [id]);

  const calc = useMemo<Calculated | null>(() => {
    if (!profile || !profile.birthDate) return null;
    try {
      return buildCalculated(profile);
    } catch {
      return null;
    }
  }, [profile]);

  if (!loaded) {
    return <p className="text-sm text-muted">読み込み中…</p>;
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">受講生が見つかりません</p>
        <Link
          href="/students"
          className="inline-block text-sm text-accent-orange underline"
        >
          受講生一覧へ戻る
        </Link>
      </div>
    );
  }

  if (!calc) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">
          生年月日が登録されていないため、運勢を計算できません
        </p>
        <Link
          href="/profile"
          className="inline-block text-sm text-accent-orange underline"
        >
          プロフィール設定へ
        </Link>
      </div>
    );
  }

  const age = calcAge(profile.birthDate);
  const strengths = extractStrengthBullets(calc);
  const advice = buildCoachAdvice(calc);

  return (
    <div className="space-y-6">
      {/* 戻る */}
      <div>
        <Link
          href="/students"
          className="text-xs text-muted hover:text-foreground"
        >
          ← 受講生一覧
        </Link>
      </div>

      {/* ヘッダー */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-bold text-accent-orange">
            {profile.name || "名前未設定"}
          </h2>
          {age !== null && (
            <span className="text-xs text-muted">{age}歳</span>
          )}
          {calc.isTenchuYear && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
              天中殺年
            </span>
          )}
        </div>
        <p className="text-xs text-muted">
          {profile.birthDate.replace(/-/g, "/")}
          {profile.birthTime ? ` ${profile.birthTime}` : ""}
          {profile.birthPlace ? ` / ${profile.birthPlace}` : ""}
        </p>
      </section>

      {/* 基本占術プロフィール */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> 占術プロフィール
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-background rounded-lg px-3 py-2">
            <p className="text-muted text-[11px]">主星（算命学）</p>
            <p className="text-foreground font-medium">{calc.sanmeigaku.mainStar.name}</p>
            <p className="text-[11px] text-muted mt-0.5">{calc.sanmeigaku.mainStar.keyword}</p>
          </div>
          <div className="bg-background rounded-lg px-3 py-2">
            <p className="text-muted text-[11px]">日主（四柱推命）</p>
            <p className="text-foreground font-medium">
              {calc.fourPillars.dayMaster.stem}（{calc.fourPillars.dayMaster.element}）
            </p>
            <p className="text-[11px] text-muted mt-0.5">{calc.fourPillars.dayMaster.title}</p>
          </div>
          <div className="bg-background rounded-lg px-3 py-2">
            <p className="text-muted text-[11px]">本命星（九星気学）</p>
            <p className="text-foreground font-medium">{calc.nineStar.honmeisei.name}</p>
            <p className="text-[11px] text-muted mt-0.5">{calc.nineStar.honmeisei.element}</p>
          </div>
          <div className="bg-background rounded-lg px-3 py-2">
            <p className="text-muted text-[11px]">ライフパス（数秘術）</p>
            <p className="text-foreground font-medium">{calc.numerology.lifePathNumber}</p>
            <p className="text-[11px] text-muted mt-0.5">{calc.numerology.lifePathMeaning.title}</p>
          </div>
          <div className="bg-background rounded-lg px-3 py-2">
            <p className="text-muted text-[11px]">マヤ暦KIN</p>
            <p className="text-foreground font-medium">KIN {calc.mayan.kinNumber}</p>
            <p className="text-[11px] text-muted mt-0.5">{calc.mayan.solarSeal.name}</p>
          </div>
          <div className="bg-background rounded-lg px-3 py-2">
            <p className="text-muted text-[11px]">天中殺</p>
            <p className="text-foreground font-medium">{calc.sanmeigaku.tenchu.name}</p>
            <p className="text-[11px] text-muted mt-0.5">
              {calc.isTenchuYear ? "今年該当" : "今年は通常運"}
            </p>
          </div>
        </div>
      </section>

      {/* 強み */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> 強みキーワード
        </h3>
        <div className="flex flex-wrap gap-2">
          {strengths.map((s) => (
            <span
              key={s}
              className="text-xs bg-accent-orange/10 text-accent-orange px-3 py-1 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted leading-relaxed">
          {calc.sanmeigaku.mainStar.personality}
        </p>
      </section>

      {/* 今月の運勢 */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> 今月のテーマ
        </h3>
        <p className="text-base font-medium text-foreground">
          {calc.personalMonthMeaning.theme}
        </p>
        <p className="text-xs text-foreground/80 leading-relaxed">
          ✨ {calc.personalMonthMeaning.advice}
        </p>
        <p className="text-xs text-muted leading-relaxed">
          ⚠ {calc.personalMonthMeaning.caution}
        </p>
      </section>

      {/* 伴走アドバイス */}
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm space-y-2">
        <h3 className="text-sm font-medium text-amber-700 flex items-center gap-1.5">
          <span>◈</span> 伴走者向けアドバイス
        </h3>
        <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {advice}
        </p>
      </section>

      {/* メモ */}
      {profile.note && (
        <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
            <span>◈</span> メモ
          </h3>
          <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {profile.note}
          </p>
        </section>
      )}

      {/* 編集導線 */}
      <div className="pt-2">
        <Link
          href="/profile"
          className="block w-full text-center py-2.5 bg-card-bg border border-card-border rounded-xl text-sm font-medium text-foreground hover:border-accent-orange/50 transition-colors"
        >
          プロフィール・メモを編集
        </Link>
      </div>
    </div>
  );
}
