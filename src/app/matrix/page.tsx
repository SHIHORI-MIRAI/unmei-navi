"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadProfiles, type UserProfile } from "@/lib/storage";
import { calcCompatibility, MODE_LABELS, type RelationMode } from "@/lib/divination";

type GenderFilter = "mixed" | "all";
type CategoryFilter = "all" | "student" | "family";

interface PairResult {
  a: UserProfile;
  b: UserProfile;
  score: number;
  numerologyScore: number;
  mayanScore: number;
  nineStarScore: number;
  fourPillarsScore: number;
}

export default function MatrixPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [mode, setMode] = useState<RelationMode>("love");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("mixed");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProfiles(loadProfiles());
    setLoaded(true);
  }, []);

  const targetProfiles = useMemo(() => {
    let list = profiles.filter((p) => p.birthDate);
    if (categoryFilter !== "all") {
      list = list.filter((p) => (p.category ?? "self") === categoryFilter);
    }
    return list;
  }, [profiles, categoryFilter]);

  const { rows, cols } = useMemo(() => {
    if (genderFilter === "mixed") {
      const females = targetProfiles.filter((p) => p.gender === "female");
      const males = targetProfiles.filter((p) => p.gender === "male");
      return { rows: females, cols: males };
    }
    return { rows: targetProfiles, cols: targetProfiles };
  }, [targetProfiles, genderFilter]);

  const pairs = useMemo<PairResult[]>(() => {
    const results: PairResult[] = [];
    rows.forEach((a) => {
      cols.forEach((b) => {
        if (a.id === b.id) return;
        try {
          const r = calcCompatibility(a.birthDate, b.birthDate, mode);
          results.push({
            a,
            b,
            score: r.overall,
            numerologyScore: r.numerology.score,
            mayanScore: r.mayan.score,
            nineStarScore: r.nineStar.score,
            fourPillarsScore: r.fourPillars.score,
          });
        } catch {
          // 不正な生年月日はスキップ
        }
      });
    });
    return results;
  }, [rows, cols, mode]);

  const scoreMap = useMemo(() => {
    const map = new Map<string, number>();
    pairs.forEach((p) => map.set(`${p.a.id}-${p.b.id}`, p.score));
    return map;
  }, [pairs]);

  // 全員×全員モードは(a,b)(b,a)が両方入るので重複除去
  const ranking = useMemo<PairResult[]>(() => {
    if (genderFilter === "mixed") {
      return [...pairs].sort((a, b) => b.score - a.score).slice(0, 10);
    }
    const seen = new Set<string>();
    return [...pairs]
      .filter((p) => {
        const key = [p.a.id, p.b.id].sort().join("-");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [pairs, genderFilter]);

  function scoreColor(score: number): string {
    if (score >= 80) return "bg-emerald-100 text-emerald-700";
    if (score >= 70) return "bg-sky-100 text-sky-700";
    if (score >= 55) return "bg-amber-50 text-amber-700";
    if (score >= 45) return "bg-orange-50 text-orange-700";
    return "bg-red-50 text-red-600";
  }

  if (!loaded) {
    return <p className="text-sm text-muted">読み込み中…</p>;
  }

  if (profiles.length < 2) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
          <span className="text-accent-gold">♡</span>
          相性マトリックス
        </h2>
        <p className="text-sm text-muted">
          相性をクロスで見るには、プロフィールを2人以上登録してください
        </p>
        <Link
          href="/profile"
          className="inline-block bg-accent-orange text-white px-4 py-2 rounded-full text-sm"
        >
          プロフィール登録へ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">♡</span>
        相性マトリックス
      </h2>
      <p className="text-xs text-muted leading-relaxed">
        登録済の人をクロスで相性スコア化します。男女に分けたり、対象を絞ったりできます。
        結婚相談所のカウンセリング、チーム編成、ご家族の関係を俯瞰したいときに。
      </p>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-accent-gold">関係のモード</h3>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(MODE_LABELS) as RelationMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`py-2.5 rounded-xl text-sm border transition-colors ${
                mode === m
                  ? "bg-accent-orange text-white border-accent-orange"
                  : "bg-card-bg text-foreground border-card-border hover:border-accent-orange/50"
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-accent-gold">表示パターン</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setGenderFilter("mixed")}
            className={`py-2.5 rounded-xl text-sm border transition-colors ${
              genderFilter === "mixed"
                ? "bg-accent-orange text-white border-accent-orange"
                : "bg-card-bg text-foreground border-card-border hover:border-accent-orange/50"
            }`}
          >
            女性 × 男性
          </button>
          <button
            onClick={() => setGenderFilter("all")}
            className={`py-2.5 rounded-xl text-sm border transition-colors ${
              genderFilter === "all"
                ? "bg-accent-orange text-white border-accent-orange"
                : "bg-card-bg text-foreground border-card-border hover:border-accent-orange/50"
            }`}
          >
            全員 × 全員
          </button>
        </div>
        <p className="text-[11px] text-muted">
          「女性 × 男性」を選ぶには、各プロフィールの性別が設定されている必要があります
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-accent-gold">対象</h3>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: "all", label: "全員" },
              { value: "student", label: "受講生／顧客" },
              { value: "family", label: "家族のみ" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCategoryFilter(opt.value)}
              className={`py-2 rounded-xl text-xs border transition-colors ${
                categoryFilter === opt.value
                  ? "bg-accent-orange text-white border-accent-orange"
                  : "bg-card-bg text-foreground border-card-border hover:border-accent-orange/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted">
        対象: {rows.length}人 × {cols.length}人 = {pairs.length}ペアを計算
      </p>

      {pairs.length === 0 && (
        <p className="text-sm text-muted leading-relaxed">
          {genderFilter === "mixed"
            ? "男性または女性のプロフィールが登録されていません。プロフィール画面で性別を設定してください。"
            : "対象のプロフィールが2人未満です。"}
        </p>
      )}

      {ranking.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
            <span>◈</span> 相性ランキング TOP{Math.min(10, ranking.length)}
          </h3>
          <div className="space-y-2">
            {ranking.map((p, i) => (
              <div
                key={`${p.a.id}-${p.b.id}`}
                className="bg-card-bg border border-card-border rounded-2xl p-3 shadow-sm flex items-center gap-3"
              >
                <span className="text-accent-gold font-bold w-6 text-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {p.a.name || "名前未設定"} × {p.b.name || "名前未設定"}
                  </p>
                  <p className="text-[11px] text-muted">
                    数秘 {p.numerologyScore} ・ マヤ {p.mayanScore} ・ 九星{" "}
                    {p.nineStarScore} ・ 四柱 {p.fourPillarsScore}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-full flex-shrink-0 ${scoreColor(
                    p.score
                  )}`}
                >
                  {p.score}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {pairs.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
            <span>◈</span> マトリックス表
          </h3>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-card-border bg-card-bg p-2 sticky left-0 z-10 text-muted text-[10px]">
                    ↓行 / 列→
                  </th>
                  {cols.map((c) => (
                    <th
                      key={c.id}
                      className="border border-card-border bg-card-bg p-2 whitespace-nowrap min-w-[80px]"
                    >
                      {c.name || "—"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <th className="border border-card-border bg-card-bg p-2 whitespace-nowrap sticky left-0 z-10 text-left">
                      {r.name || "—"}
                    </th>
                    {cols.map((c) => {
                      if (r.id === c.id) {
                        return (
                          <td
                            key={c.id}
                            className="border border-card-border bg-background p-2 text-center text-muted/40"
                          >
                            —
                          </td>
                        );
                      }
                      const score = scoreMap.get(`${r.id}-${c.id}`);
                      if (score === undefined) {
                        return (
                          <td
                            key={c.id}
                            className="border border-card-border bg-background p-2 text-center text-muted/40"
                          >
                            —
                          </td>
                        );
                      }
                      return (
                        <td
                          key={c.id}
                          className={`border border-card-border p-2 text-center font-medium ${scoreColor(
                            score
                          )}`}
                        >
                          {score}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">
            色の意味：
            <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded mx-0.5">80+</span>
            自然に高め合う・
            <span className="bg-sky-100 text-sky-700 px-1.5 rounded mx-0.5">70-79</span>
            共鳴しやすい・
            <span className="bg-amber-50 text-amber-700 px-1.5 rounded mx-0.5">55-69</span>
            バランス型・
            <span className="bg-orange-50 text-orange-700 px-1.5 rounded mx-0.5">45-54</span>
            違いから学ぶ・
            <span className="bg-red-50 text-red-600 px-1.5 rounded mx-0.5">44-</span>
            違いが大きい
          </p>
        </section>
      )}

      <div className="pt-2">
        <Link
          href="/compatibility"
          className="block text-center text-xs text-accent-orange hover:text-accent-light"
        >
          個別の詳しい相性診断は「相性診断」ページへ →
        </Link>
      </div>
    </div>
  );
}
