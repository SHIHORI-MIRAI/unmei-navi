"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadManaged, type UserProfile } from "@/lib/storage";
import {
  calcSanmeigaku,
  calcFourPillars,
  calcNineStar,
  checkTenchusatsuYear,
} from "@/lib/divination";
import { useI18n } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/dict";

type FilterType = "all" | "student" | "client";

/** この画面固有の文言（dict.ts は編集禁止のためローカルで保持） */
const L: Record<Lang, Record<string, string>> = {
  ja: {
    title: "対象者一覧",
    add: "+ 追加",
    intro:
      "プロフィール設定で「受講生」または「顧客」を選んだ人がここに並びます。カードをタップすると、その人の強み・今月の運勢・天中殺・伴走アドバイスが見られます。",
    tabAll: "すべて",
    tabStudent: "受講生",
    tabClient: "顧客",
    emptyAll: "まだ受講生・顧客は登録されていません",
    emptyStudent: "受講生は登録されていません",
    emptyClient: "顧客は登録されていません",
    toProfile: "プロフィール設定へ",
    emptyHint:
      "既存のプロフィールも、編集画面で種別を変えれば一覧に表示されます",
    noName: "名前未設定",
    badgeClient: "顧客",
    badgeStudent: "受講生",
    ageSuffix: "歳",
    tenchuYear: "天中殺年",
    mainStar: "主星",
    dayMaster: "日主",
    honmeisei: "本命星",
    tenchu: "天中殺",
  },
  ko: {
    title: "대상자 목록",
    add: "+ 추가",
    intro:
      "프로필 설정에서 '수강생' 또는 '고객'을 선택한 사람이 여기에 표시됩니다. 카드를 탭하면 그 사람의 강점·이번 달 운세·천중살·동반 조언을 볼 수 있어요.",
    tabAll: "전체",
    tabStudent: "수강생",
    tabClient: "고객",
    emptyAll: "아직 수강생·고객이 등록되지 않았습니다",
    emptyStudent: "수강생이 등록되지 않았습니다",
    emptyClient: "고객이 등록되지 않았습니다",
    toProfile: "프로필 설정으로",
    emptyHint:
      "기존 프로필도 편집 화면에서 종류를 바꾸면 목록에 표시됩니다",
    noName: "이름 미설정",
    badgeClient: "고객",
    badgeStudent: "수강생",
    ageSuffix: "세",
    tenchuYear: "천중살 해",
    mainStar: "주성",
    dayMaster: "일주",
    honmeisei: "본명성",
    tenchu: "천중살",
  },
};

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

interface PersonSummary {
  profile: UserProfile;
  age: number | null;
  mainStarName: string;
  dayMasterStem: string;
  honmeiseiName: string;
  tenchuName: string;
  isTenchuYear: boolean;
}

function buildSummary(profile: UserProfile, lang: Lang): PersonSummary {
  const sanmei = calcSanmeigaku(profile.birthDate, lang);
  const fourP = calcFourPillars(profile.birthDate, profile.birthTime, lang);
  const nine = calcNineStar(profile.birthDate, new Date().getFullYear(), lang);
  const isTenchuYear = checkTenchusatsuYear(
    profile.birthDate,
    new Date().getFullYear(),
    lang
  ).isTenchusatsu;
  return {
    profile,
    age: calcAge(profile.birthDate),
    mainStarName: sanmei.mainStar.name,
    dayMasterStem: fourP.dayMaster.stem,
    honmeiseiName: nine.honmeisei.name,
    tenchuName: sanmei.tenchu.name,
    isTenchuYear,
  };
}

export default function StudentsPage() {
  const { lang } = useI18n();
  const tx = L[lang];
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    setPeople(loadManaged());
    setLoaded(true);
  }, []);

  const counts = useMemo(() => {
    return {
      all: people.length,
      student: people.filter((p) => p.category === "student").length,
      client: people.filter((p) => p.category === "client").length,
    };
  }, [people]);

  const summaries = useMemo<PersonSummary[]>(() => {
    return people
      .filter((p) => p.birthDate)
      .filter((p) => filter === "all" || p.category === filter)
      .map((p) => {
        try {
          return buildSummary(p, lang);
        } catch {
          return {
            profile: p,
            age: calcAge(p.birthDate),
            mainStarName: "—",
            dayMasterStem: "—",
            honmeiseiName: "—",
            tenchuName: "—",
            isTenchuYear: false,
          };
        }
      });
  }, [people, filter, lang]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
          <span className="text-accent-gold">✦</span>
          {tx.title}
        </h2>
        <Link
          href="/profile"
          className="text-xs bg-accent-orange text-white px-3 py-1.5 rounded-full hover:bg-accent-orange/90 transition-colors"
        >
          {tx.add}
        </Link>
      </div>

      <p className="text-xs text-muted leading-relaxed">{tx.intro}</p>

      {/* フィルタタブ */}
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { value: "all", label: `${tx.tabAll} (${counts.all})` },
            { value: "student", label: `${tx.tabStudent} (${counts.student})` },
            { value: "client", label: `${tx.tabClient} (${counts.client})` },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`py-2 rounded-xl text-xs border transition-colors ${
              filter === opt.value
                ? "bg-accent-orange text-white border-accent-orange"
                : "bg-card-bg text-foreground border-card-border hover:border-accent-orange/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loaded && summaries.length === 0 && (
        <div className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm text-center space-y-3">
          <p className="text-sm text-muted">
            {filter === "all"
              ? tx.emptyAll
              : filter === "student"
              ? tx.emptyStudent
              : tx.emptyClient}
          </p>
          <Link
            href="/profile"
            className="inline-block bg-accent-orange text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-accent-orange/90 transition-colors"
          >
            {tx.toProfile}
          </Link>
          <p className="text-[11px] text-muted/80">{tx.emptyHint}</p>
        </div>
      )}

      <div className="space-y-3">
        {summaries.map((s) => (
          <Link
            key={s.profile.id}
            href={`/students/${s.profile.id}`}
            className="block bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm hover:border-accent-orange/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-medium text-foreground truncate">
                    {s.profile.name || tx.noName}
                  </p>
                  {s.profile.category === "client" ? (
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">
                      {tx.badgeClient}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full">
                      {tx.badgeStudent}
                    </span>
                  )}
                  {s.age !== null && (
                    <span className="text-[11px] text-muted">
                      {s.age}
                      {tx.ageSuffix}
                    </span>
                  )}
                  {s.isTenchuYear && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                      {tx.tenchuYear}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {s.profile.birthDate.replace(/-/g, "/")}
                  {s.profile.birthPlace ? ` / ${s.profile.birthPlace}` : ""}
                </p>
              </div>
              <span className="text-accent-gold text-sm flex-shrink-0">›</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <div className="bg-background rounded-lg px-2 py-1.5">
                <p className="text-muted">{tx.mainStar}</p>
                <p className="text-foreground font-medium">{s.mainStarName}</p>
              </div>
              <div className="bg-background rounded-lg px-2 py-1.5">
                <p className="text-muted">{tx.dayMaster}</p>
                <p className="text-foreground font-medium">{s.dayMasterStem}</p>
              </div>
              <div className="bg-background rounded-lg px-2 py-1.5">
                <p className="text-muted">{tx.honmeisei}</p>
                <p className="text-foreground font-medium">{s.honmeiseiName}</p>
              </div>
            </div>

            <p className="mt-2 text-[11px] text-muted">
              {tx.tenchu}：<span className="text-foreground">{s.tenchuName}</span>
            </p>

            {s.profile.note && (
              <p className="mt-2 text-xs text-foreground/80 line-clamp-2 whitespace-pre-wrap">
                📝 {s.profile.note}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
