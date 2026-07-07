"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadProfiles, type UserProfile } from "@/lib/storage";
import { calcCompatibility, MODE_LABELS, type RelationMode } from "@/lib/divination";
import { modeLabel } from "@/lib/divination/compatibility";
import { useI18n } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/dict";

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

/** この画面固有のUI文言（dict.tsは編集禁止のためローカルで保持） */
const L: Record<Lang, Record<string, string>> = {
  ja: {
    title: "相性マトリックス",
    need2: "相性をクロスで見るには、プロフィールを2人以上登録してください",
    toProfile: "プロフィール登録へ",
    intro:
      "登録済の人をクロスで相性スコア化します。男女に分けたり、対象を絞ったりできます。結婚相談所のカウンセリング、チーム編成、ご家族の関係を俯瞰したいときに。",
    modeHeading: "関係のモード",
    patternHeading: "表示パターン",
    femaleMale: "女性 × 男性",
    allAll: "全員 × 全員",
    genderNote:
      "「女性 × 男性」を選ぶには、各プロフィールの性別が設定されている必要があります",
    targetHeading: "対象",
    catAll: "全員",
    catStudent: "受講生／顧客",
    catFamily: "家族のみ",
    emptyMixed:
      "男性または女性のプロフィールが登録されていません。プロフィール画面で性別を設定してください。",
    emptyAll: "対象のプロフィールが2人未満です。",
    rankingTitle: "相性ランキング TOP",
    noName: "名前未設定",
    numShort: "数秘",
    mayaShort: "マヤ",
    nineShort: "九星",
    fourShort: "四柱",
    matrixTitle: "マトリックス表",
    rowCol: "↓行 / 列→",
    legendLabel: "色の意味：",
    legend80: "自然に高め合う",
    legend70: "共鳴しやすい",
    legend55: "バランス型",
    legend45: "違いから学ぶ",
    legend44: "違いが大きい",
    toDetail: "個別の詳しい相性診断は「相性診断」ページへ →",
    loading: "読み込み中…",
  },
  ko: {
    title: "궁합 매트릭스",
    need2: "궁합을 교차로 보려면 프로필을 2명 이상 등록해 주세요",
    toProfile: "프로필 등록하기",
    intro:
      "등록된 사람들을 교차하여 궁합 점수로 나타냅니다. 남녀로 나누거나 대상을 좁힐 수 있습니다. 결혼상담소 상담, 팀 편성, 가족 관계를 한눈에 살펴보고 싶을 때 활용하세요.",
    modeHeading: "관계 모드",
    patternHeading: "표시 패턴",
    femaleMale: "여성 × 남성",
    allAll: "전원 × 전원",
    genderNote:
      "'여성 × 남성'을 선택하려면 각 프로필의 성별이 설정되어 있어야 합니다",
    targetHeading: "대상",
    catAll: "전원",
    catStudent: "수강생／고객",
    catFamily: "가족만",
    emptyMixed:
      "남성 또는 여성 프로필이 등록되어 있지 않습니다. 프로필 화면에서 성별을 설정해 주세요.",
    emptyAll: "대상 프로필이 2명 미만입니다.",
    rankingTitle: "궁합 랭킹 TOP",
    noName: "이름 미설정",
    numShort: "수비",
    mayaShort: "마야",
    nineShort: "구성",
    fourShort: "사주",
    matrixTitle: "매트릭스 표",
    rowCol: "↓행 / 열→",
    legendLabel: "색의 의미：",
    legend80: "자연스럽게 서로 끌어올림",
    legend70: "공명하기 쉬움",
    legend55: "균형형",
    legend45: "차이에서 배움",
    legend44: "차이가 큼",
    toDetail: "개별 상세 궁합 진단은 '궁합 진단' 페이지로 →",
    loading: "불러오는 중…",
  },
};

export default function MatrixPage() {
  const { lang } = useI18n();
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
          const r = calcCompatibility(a.birthDate, b.birthDate, mode, lang);
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
  }, [rows, cols, mode, lang]);

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
    return <p className="text-sm text-muted">{L[lang].loading}</p>;
  }

  if (profiles.length < 2) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
          <span className="text-accent-gold">♡</span>
          {L[lang].title}
        </h2>
        <p className="text-sm text-muted">{L[lang].need2}</p>
        <Link
          href="/profile"
          className="inline-block bg-accent-orange text-white px-4 py-2 rounded-full text-sm"
        >
          {L[lang].toProfile}
        </Link>
      </div>
    );
  }

  const countLine =
    lang === "ko"
      ? `대상: ${rows.length}명 × ${cols.length}명 = ${pairs.length}쌍 계산`
      : `対象: ${rows.length}人 × ${cols.length}人 = ${pairs.length}ペアを計算`;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">♡</span>
        {L[lang].title}
      </h2>
      <p className="text-xs text-muted leading-relaxed">{L[lang].intro}</p>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-accent-gold">{L[lang].modeHeading}</h3>
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
              {modeLabel(m, lang)}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-accent-gold">{L[lang].patternHeading}</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setGenderFilter("mixed")}
            className={`py-2.5 rounded-xl text-sm border transition-colors ${
              genderFilter === "mixed"
                ? "bg-accent-orange text-white border-accent-orange"
                : "bg-card-bg text-foreground border-card-border hover:border-accent-orange/50"
            }`}
          >
            {L[lang].femaleMale}
          </button>
          <button
            onClick={() => setGenderFilter("all")}
            className={`py-2.5 rounded-xl text-sm border transition-colors ${
              genderFilter === "all"
                ? "bg-accent-orange text-white border-accent-orange"
                : "bg-card-bg text-foreground border-card-border hover:border-accent-orange/50"
            }`}
          >
            {L[lang].allAll}
          </button>
        </div>
        <p className="text-[11px] text-muted">{L[lang].genderNote}</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-accent-gold">{L[lang].targetHeading}</h3>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: "all", label: L[lang].catAll },
              { value: "student", label: L[lang].catStudent },
              { value: "family", label: L[lang].catFamily },
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

      <p className="text-xs text-muted">{countLine}</p>

      {pairs.length === 0 && (
        <p className="text-sm text-muted leading-relaxed">
          {genderFilter === "mixed" ? L[lang].emptyMixed : L[lang].emptyAll}
        </p>
      )}

      {ranking.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
            <span>◈</span> {L[lang].rankingTitle}
            {Math.min(10, ranking.length)}
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
                    {p.a.name || L[lang].noName} × {p.b.name || L[lang].noName}
                  </p>
                  <p className="text-[11px] text-muted">
                    {L[lang].numShort} {p.numerologyScore} ・ {L[lang].mayaShort}{" "}
                    {p.mayanScore} ・ {L[lang].nineShort} {p.nineStarScore} ・{" "}
                    {L[lang].fourShort} {p.fourPillarsScore}
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
            <span>◈</span> {L[lang].matrixTitle}
          </h3>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-card-border bg-card-bg p-2 sticky left-0 z-10 text-muted text-[10px]">
                    {L[lang].rowCol}
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
            {L[lang].legendLabel}
            <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded mx-0.5">80+</span>
            {L[lang].legend80}・
            <span className="bg-sky-100 text-sky-700 px-1.5 rounded mx-0.5">70-79</span>
            {L[lang].legend70}・
            <span className="bg-amber-50 text-amber-700 px-1.5 rounded mx-0.5">55-69</span>
            {L[lang].legend55}・
            <span className="bg-orange-50 text-orange-700 px-1.5 rounded mx-0.5">45-54</span>
            {L[lang].legend45}・
            <span className="bg-red-50 text-red-600 px-1.5 rounded mx-0.5">44-</span>
            {L[lang].legend44}
          </p>
        </section>
      )}

      <div className="pt-2">
        <Link
          href="/compatibility"
          className="block text-center text-xs text-accent-orange hover:text-accent-light"
        >
          {L[lang].toDetail}
        </Link>
      </div>
    </div>
  );
}
