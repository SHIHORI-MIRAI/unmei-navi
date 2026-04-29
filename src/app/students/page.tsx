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

type FilterType = "all" | "student" | "client";

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

function buildSummary(profile: UserProfile): PersonSummary {
  const sanmei = calcSanmeigaku(profile.birthDate);
  const fourP = calcFourPillars(profile.birthDate, profile.birthTime);
  const nine = calcNineStar(profile.birthDate);
  const isTenchuYear = checkTenchusatsuYear(
    profile.birthDate,
    new Date().getFullYear()
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
          return buildSummary(p);
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
  }, [people, filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
          <span className="text-accent-gold">✦</span>
          対象者一覧
        </h2>
        <Link
          href="/profile"
          className="text-xs bg-accent-orange text-white px-3 py-1.5 rounded-full hover:bg-accent-orange/90 transition-colors"
        >
          + 追加
        </Link>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        プロフィール設定で「受講生」または「顧客」を選んだ人がここに並びます。
        カードをタップすると、その人の強み・今月の運勢・天中殺・伴走アドバイスが見られます。
      </p>

      {/* フィルタタブ */}
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { value: "all", label: `すべて (${counts.all})` },
            { value: "student", label: `受講生 (${counts.student})` },
            { value: "client", label: `顧客 (${counts.client})` },
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
              ? "まだ受講生・顧客は登録されていません"
              : filter === "student"
              ? "受講生は登録されていません"
              : "顧客は登録されていません"}
          </p>
          <Link
            href="/profile"
            className="inline-block bg-accent-orange text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-accent-orange/90 transition-colors"
          >
            プロフィール設定へ
          </Link>
          <p className="text-[11px] text-muted/80">
            既存のプロフィールも、編集画面で種別を変えれば一覧に表示されます
          </p>
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
                    {s.profile.name || "名前未設定"}
                  </p>
                  {s.profile.category === "client" ? (
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">
                      顧客
                    </span>
                  ) : (
                    <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full">
                      受講生
                    </span>
                  )}
                  {s.age !== null && (
                    <span className="text-[11px] text-muted">
                      {s.age}歳
                    </span>
                  )}
                  {s.isTenchuYear && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                      天中殺年
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
                <p className="text-muted">主星</p>
                <p className="text-foreground font-medium">{s.mainStarName}</p>
              </div>
              <div className="bg-background rounded-lg px-2 py-1.5">
                <p className="text-muted">日主</p>
                <p className="text-foreground font-medium">{s.dayMasterStem}</p>
              </div>
              <div className="bg-background rounded-lg px-2 py-1.5">
                <p className="text-muted">本命星</p>
                <p className="text-foreground font-medium">{s.honmeiseiName}</p>
              </div>
            </div>

            <p className="mt-2 text-[11px] text-muted">
              天中殺：<span className="text-foreground">{s.tenchuName}</span>
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
