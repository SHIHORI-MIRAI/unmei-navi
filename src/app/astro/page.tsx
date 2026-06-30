"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadProfile, type UserProfile } from "@/lib/storage";
import {
  calcAstroChart,
  rankCities,
  citySummary,
  lineMessage,
  PLANETS,
  PLANET_META,
  PURPOSES,
  PURPOSE_MAP,
  ANGLE_LABEL,
  type AstroChart,
  type CityScore,
} from "@/lib/divination";
import { REGION_LABEL, type WorldCity, type WorldRegion } from "@/lib/divination";
import {
  BIRTH_LOCATIONS,
  BIRTH_LOCATION_MAP,
  LOCATION_GROUPS,
  offsetHoursForBirth,
  guessLocationId,
} from "@/lib/divination";
import type { Body } from "@/lib/divination";
import AstroWorldMap, { type AngleVisibility } from "@/components/AstroWorldMap";

const LOC_KEY = "unmei-astro-loc";

/** オフセット（時）を「+9」「+5:30」のように表示 */
function fmtOffset(h: number): string {
  const sign = h < 0 ? "-" : "+";
  const abs = Math.abs(h);
  const hh = Math.floor(abs);
  const mm = Math.round((abs - hh) * 60);
  return mm === 0 ? `${sign}${hh}` : `${sign}${hh}:${String(mm).padStart(2, "0")}`;
}

/** 星表示 */
function Stars({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`tracking-tight ${className}`} aria-label={`星${n}`}>
      <span className="text-accent-gold">{"★".repeat(n)}</span>
      <span className="text-accent-gold/25">{"☆".repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

export default function AstroPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [locId, setLocId] = useState<string>("jp");
  const [purposeId, setPurposeId] = useState<string>("overall");
  const [visiblePlanets, setVisiblePlanets] = useState<Set<Body>>(
    new Set<Body>(["sun", "venus", "jupiter", "moon"])
  );
  const [angleVis, setAngleVis] = useState<AngleVisibility>({
    MC: true,
    IC: false,
    AC: true,
    DC: true,
  });
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [regionFilter, setRegionFilter] = useState<WorldRegion | "all">("all");
  const [showAll, setShowAll] = useState(false);
  const [cityQuery, setCityQuery] = useState("");

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.push("/profile");
      return;
    }
    setProfile(p);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LOC_KEY);
      if (saved && BIRTH_LOCATION_MAP[saved]) {
        setLocId(saved);
      } else {
        // 保存がなければ出生地テキストから推測
        setLocId(guessLocationId(p.birthPlace));
      }
    }
  }, [router]);

  function changeLoc(v: string) {
    setLocId(v);
    if (typeof window !== "undefined") localStorage.setItem(LOC_KEY, v);
  }

  const loc = BIRTH_LOCATION_MAP[locId] ?? BIRTH_LOCATIONS[0];

  // 出生地ゾーンと生年月日から、その瞬間の実際の時差（サマータイム込み）
  const tz = useMemo(() => {
    if (!profile) return loc.fallback;
    return offsetHoursForBirth(
      loc.zone,
      profile.birthDate,
      profile.birthTime || "",
      loc.fallback
    );
  }, [profile, loc]);

  const chart: AstroChart | null = useMemo(() => {
    if (!profile) return null;
    return calcAstroChart(profile.birthDate, profile.birthTime || "", tz);
  }, [profile, tz]);

  const purpose = PURPOSE_MAP[purposeId] ?? PURPOSES[0];

  // 目的が変わったら、その目的の主要天体を地図に表示
  useEffect(() => {
    const primary = (Object.keys(purpose.planetWeights) as Body[]).filter(
      (b) => (purpose.planetWeights[b] ?? 0) >= 0.6
    );
    if (primary.length > 0) setVisiblePlanets(new Set(primary));
  }, [purposeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const ranked: CityScore[] = useMemo(() => {
    if (!chart) return [];
    return rankCities(chart, purposeId);
  }, [chart, purposeId]);

  const topCityIds = useMemo(
    () => new Set(ranked.slice(0, 8).map((r) => r.city.id)),
    [ranked]
  );

  const filtered = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    return ranked.filter((r) => {
      if (regionFilter !== "all" && r.city.region !== regionFilter) return false;
      if (!q) return true;
      const c = r.city;
      return (
        c.name.toLowerCase().includes(q) ||
        c.enName.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
      );
    });
  }, [ranked, regionFilter, cityQuery]);

  // 検索中は件数制限を外して全ヒットを表示
  const searching = cityQuery.trim().length > 0;
  const visibleList = showAll || searching ? filtered : filtered.slice(0, 12);

  const selectedScore = useMemo(
    () => ranked.find((r) => r.city.id === selectedCityId) ?? null,
    [ranked, selectedCityId]
  );

  function togglePlanet(b: Body) {
    setVisiblePlanets((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  }

  function selectCity(c: WorldCity) {
    setSelectedCityId((prev) => (prev === c.id ? "" : c.id));
  }

  if (!profile) {
    return <p className="text-muted text-center py-10">読み込み中...</p>;
  }

  // 目的別カードで強調する天体（重み上位3）
  const purposeTopPlanets = (Object.keys(purpose.planetWeights) as Body[])
    .sort((a, b) => (purpose.planetWeights[b] ?? 0) - (purpose.planetWeights[a] ?? 0))
    .slice(0, 3);

  const regions: (WorldRegion | "all")[] = [
    "all",
    "japan",
    "east-asia",
    "se-asia",
    "oceania",
    "north-america",
    "europe",
    "middle-east",
    "south-asia",
    "africa",
    "latin-america",
  ];

  return (
    <div className="space-y-5">
      {/* タイトル */}
      <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-card-border shadow-sm bg-gradient-to-br from-card-bg via-card-bg to-[#e9eef9] p-5">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-accent-gold text-sm">
            <span className="sparkle">✦</span>
            <span>アストロカートグラフィー</span>
          </div>
          <h2 className="font-mincho text-xl font-bold text-foreground leading-relaxed">
            あなたの星が輝く場所を、世界地図で。
          </h2>
          <p className="text-xs text-muted leading-relaxed">
            出生データから10天体のライン（MC・IC・AC・DC）を世界地図に描き、
            「どの土地でどんな運が後押しされやすいか」を目的別に整理します。
          </p>
        </div>
      </section>

      {/* 出生情報 + タイムゾーン */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">対象</span>
          <span className="font-bold text-foreground">{profile.name || "（名称未設定）"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">生年月日</span>
          <span className="text-foreground">
            {profile.birthDate}
            {profile.birthTime ? ` ${profile.birthTime}` : "（時刻未設定）"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm gap-2">
          <span className="text-muted whitespace-nowrap">生まれた国・地域</span>
          <select
            value={locId}
            onChange={(e) => changeLoc(e.target.value)}
            className="border border-card-border rounded-lg px-2 py-1.5 text-sm bg-white text-foreground max-w-[60%]"
          >
            {LOCATION_GROUPS.map((g) => (
              <optgroup key={g} label={g}>
                {BIRTH_LOCATIONS.filter((l) => l.group === g).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <p className="text-[11px] text-muted flex items-center justify-between gap-2">
          <span>適用される時差（出生日基準）</span>
          <span className="font-mono font-bold text-foreground">UTC {fmtOffset(tz)}</span>
        </p>
        {!profile.birthTime && (
          <p className="text-[11px] text-danger/80 bg-danger/5 rounded-lg px-3 py-2 leading-relaxed">
            出生時刻が未設定のため正午で計算しています。MC/AC線は時刻で大きく動くため、
            <Link href="/profile" className="underline">プロフィール</Link>で出生時刻を登録すると精度が上がります。
          </p>
        )}
      </section>

      {/* 目的選択 */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> 目的を選ぶ
        </h3>
        <div className="flex flex-wrap gap-2">
          {PURPOSES.map((p) => {
            const active = p.id === purposeId;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setPurposeId(p.id);
                  setShowAll(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "bg-accent-orange text-white border-accent-orange shadow-sm"
                    : "bg-white text-muted border-card-border hover:border-accent-gold"
                }`}
              >
                {p.emoji} {p.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted px-1">{purpose.description}</p>
      </section>

      {/* 世界地図 */}
      {chart && (
        <section className="space-y-2.5">
          <AstroWorldMap
            chart={chart}
            visiblePlanets={visiblePlanets}
            angleVisibility={angleVis}
            selectedCityId={selectedCityId}
            highlightCityIds={topCityIds}
            onSelectCity={selectCity}
          />

          {/* 天体トグル（凡例） */}
          <div className="flex flex-wrap gap-1.5">
            {PLANETS.map((p) => {
              const on = visiblePlanets.has(p.body);
              return (
                <button
                  key={p.body}
                  onClick={() => togglePlanet(p.body)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border transition-opacity ${
                    on ? "bg-white shadow-sm" : "bg-transparent opacity-45"
                  }`}
                  style={{ borderColor: p.color }}
                >
                  <span style={{ color: p.color }} className="text-sm leading-none">
                    {p.symbol}
                  </span>
                  <span className="text-foreground">{p.name}</span>
                </button>
              );
            })}
          </div>

          {/* アングルトグル */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-muted mr-1">ライン種別:</span>
            {(Object.keys(angleVis) as (keyof AngleVisibility)[]).map((a) => (
              <button
                key={a}
                onClick={() => setAngleVis((prev) => ({ ...prev, [a]: !prev[a] }))}
                className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${
                  angleVis[a]
                    ? "bg-accent-gold/15 border-accent-gold text-foreground"
                    : "bg-white border-card-border text-muted"
                }`}
              >
                {ANGLE_LABEL[a]}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted/70 px-1 leading-relaxed">
            実線=MC/AC、点線=IC、破線=DC。金色の輪はこの目的のおすすめ上位都市、
            オレンジの輪は選択中の都市です。地図上の都市をタップすると詳細が見られます。
          </p>
        </section>
      )}

      {/* 選択都市の詳細 */}
      {selectedScore && (
        <CityDetailCard score={selectedScore} purposeLabel={purpose.label} />
      )}

      {/* 地域フィルター */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> {purpose.emoji} {purpose.label}におすすめの土地
        </h3>
        <div className="relative">
          <input
            type="search"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder="都市名・国名で検索（例: 名古屋 / Lyon）"
            className="w-full border border-card-border rounded-full pl-9 pr-3 py-2 text-sm bg-white text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent-gold"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/60 text-sm pointer-events-none">
            ⌕
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {regions.map((r) => {
            const active = r === regionFilter;
            return (
              <button
                key={r}
                onClick={() => {
                  setRegionFilter(r);
                  setShowAll(false);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                  active
                    ? "bg-accent-orange text-white border-accent-orange"
                    : "bg-white text-muted border-card-border"
                }`}
              >
                {r === "all" ? "全て" : REGION_LABEL[r]}
              </button>
            );
          })}
        </div>
      </section>

      {/* ランキング */}
      <section className="space-y-2.5">
        {visibleList.map((cs) => {
          const rank = ranked.indexOf(cs) + 1;
          const isSel = cs.city.id === selectedCityId;
          return (
            <button
              key={cs.city.id}
              onClick={() => selectCity(cs.city)}
              className={`w-full text-left rounded-2xl border p-3.5 shadow-sm transition-colors ${
                isSel
                  ? "border-accent-orange bg-accent-orange/5"
                  : "border-card-border bg-card-bg hover:border-accent-gold"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex-shrink-0 w-7 text-center font-bold text-sm ${
                    rank <= 3 ? "text-accent-orange" : "text-muted"
                  }`}
                >
                  {rank}
                </span>
                <span className="text-2xl flex-shrink-0">{cs.city.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground leading-tight">
                    {cs.city.name}
                    <span className="text-[11px] text-muted font-normal ml-1.5">
                      {cs.city.country}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Stars n={cs.purposeStars} className="text-xs" />
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-bold text-lg text-accent-orange leading-none">
                    {cs.purposeScore}
                    <span className="text-[10px] text-muted font-normal">点</span>
                  </p>
                </div>
              </div>

              {/* 主要天体の星 */}
              <div className="flex items-center gap-3 mt-2.5 pl-10 flex-wrap">
                {purposeTopPlanets.map((b) => {
                  const meta = PLANET_META[b];
                  return (
                    <span key={b} className="flex items-center gap-1 text-[11px]">
                      <span style={{ color: meta.color }} className="text-sm leading-none">
                        {meta.symbol}
                      </span>
                      <Stars n={cs.planetStars[b] ?? 0} className="text-[10px]" />
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center text-muted text-sm py-6">
            {searching
              ? `「${cityQuery.trim()}」に一致する都市が見つかりません。`
              : "この地域の都市はデータにありません。"}
          </p>
        )}

        {!showAll && !searching && filtered.length > 12 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-center text-sm text-accent-gold py-2.5 rounded-full border border-accent-gold/40 bg-accent-gold/5 hover:bg-accent-gold/10 transition-colors"
          >
            さらに表示（残り{filtered.length - 12}都市）
          </button>
        )}
      </section>

      {/* 免責 */}
      <p className="text-center text-xs text-muted/60 px-4">
        ※ 天体位置は簡易計算による参考値です。占いは参考情報として、人生の重要な判断はご自身の責任で行ってください。
      </p>
    </div>
  );
}

/** 選択都市の詳細カード */
function CityDetailCard({
  score,
  purposeLabel,
}: {
  score: CityScore;
  purposeLabel: string;
}) {
  const top = score.activeLines.slice(0, 4);
  return (
    <section className="animate-fade-up bg-gradient-to-br from-accent-gold/10 via-card-bg to-accent-orange/5 border border-accent-gold/30 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{score.city.flag}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg text-foreground leading-tight">
            {score.city.name}
          </p>
          <p className="text-[11px] text-muted">
            {score.city.country}・{score.city.enName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted">{purposeLabel}</p>
          <p className="font-bold text-2xl text-accent-orange leading-none">
            {score.purposeScore}
            <span className="text-xs">点</span>
          </p>
          <Stars n={score.purposeStars} className="text-xs" />
        </div>
      </div>

      <p className="text-sm text-foreground/85 leading-relaxed bg-white/60 rounded-xl px-3 py-2">
        {citySummary(score)}
      </p>

      {/* 効いているライン */}
      {top.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-accent-gold font-medium">この土地で効いている天体ライン</p>
          {top.map((al, i) => {
            const meta = PLANET_META[al.body];
            return (
              <div
                key={i}
                className="flex items-start gap-2 text-[12px] bg-white/60 rounded-lg px-3 py-2"
              >
                <span style={{ color: meta.color }} className="text-base leading-none mt-0.5">
                  {meta.symbol}
                </span>
                <p className="text-foreground/85 leading-relaxed flex-1">
                  {lineMessage(al.body, al.angle)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* 全天体の星 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
        {PLANETS.map((p) => (
          <div key={p.body} className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-muted">
              <span style={{ color: p.color }} className="text-sm leading-none">
                {p.symbol}
              </span>
              {p.name}
            </span>
            <Stars n={score.planetStars[p.body] ?? 0} className="text-[10px]" />
          </div>
        ))}
      </div>
    </section>
  );
}
