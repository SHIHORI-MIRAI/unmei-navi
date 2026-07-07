"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadProfile, type UserProfile } from "@/lib/storage";
import { useI18n } from "@/lib/i18n/provider";
import {
  calcAstroChart,
  rankCities,
  citySummary,
  lineMessage,
  lineDistanceLabel,
  signOf,
  planetName,
  toneLabel,
  angleLabel,
  purposeText,
  PLANETS,
  PLANET_META,
  TONE_META,
  PURPOSES,
  PURPOSE_MAP,
  type AstroChart,
  type CityScore,
} from "@/lib/divination";
import {
  regionLabel,
  countryLabel,
  cityName,
  type WorldCity,
  type WorldRegion,
} from "@/lib/divination";
import {
  BIRTH_LOCATIONS,
  BIRTH_LOCATION_MAP,
  LOCATION_GROUPS,
  offsetHoursForBirth,
  guessLocationId,
  birthLocationLabel,
  locationGroupLabel,
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

/** "HH:MM" → 0..1439 分 */
function parseHM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
/** 0..1439 分 → "HH:MM" */
function fmtHM(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
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
  const { t, lang } = useI18n();
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
  // 出生時刻の上書き（スライダー/入力で探索・修正）。null なら登録値を使用
  const [timeOverride, setTimeOverride] = useState<string | null>(null);

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

  // プロフィールに登録済みの出生時刻（妥当性チェック）
  const profileTime = useMemo(() => {
    const t = profile?.birthTime ?? "";
    return /^\d{1,2}:\d{2}$/.test(t) ? t : null;
  }, [profile]);

  // 実際に計算へ使う時刻：スライダー等での上書きがあれば優先
  const effectiveTime = timeOverride ?? profileTime;

  // 出生地ゾーンと生年月日から、その瞬間の実際の時差（サマータイム込み）
  const tz = useMemo(() => {
    if (!profile) return loc.fallback;
    return offsetHoursForBirth(
      loc.zone,
      profile.birthDate,
      effectiveTime || "",
      loc.fallback
    );
  }, [profile, loc, effectiveTime]);

  const chart: AstroChart | null = useMemo(() => {
    if (!profile) return null;
    return calcAstroChart(profile.birthDate, effectiveTime || "", tz);
  }, [profile, effectiveTime, tz]);

  const purpose = PURPOSE_MAP[purposeId] ?? PURPOSES[0];
  const purposeTx = purposeText(purposeId, lang);

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
    return <p className="text-muted text-center py-10">{t("astro.loading")}</p>;
  }

  // 出生時刻が有効に入っているか（MC/AC/DC線は時刻がないと定まらない）
  const hasTime = !!effectiveTime;
  // 登録された正確な時刻をそのまま使っているか（＝信頼度が高い状態）
  const timeIsExact =
    !!profileTime && (timeOverride === null || timeOverride === profileTime);
  const sliderMinutes = effectiveTime ? parseHM(effectiveTime) : 12 * 60;

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
            <span>{t("astro.brand")}</span>
          </div>
          <h2 className="font-mincho text-xl font-bold text-foreground leading-relaxed">
            {t("astro.tagline")}
          </h2>
          <p className="text-xs text-muted leading-relaxed">
            {t("astro.intro")}
          </p>
        </div>
      </section>

      {/* 出生情報 + タイムゾーン */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{t("astro.target")}</span>
          <span className="font-bold text-foreground">{profile.name || t("astro.nameUnset")}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{t("astro.birthDate")}</span>
          <span className="text-foreground">
            {profile.birthDate}
            {profile.birthTime ? ` ${profile.birthTime}` : t("astro.timeUnset")}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm gap-2">
          <span className="text-muted whitespace-nowrap">{t("astro.birthCountry")}</span>
          <select
            value={locId}
            onChange={(e) => changeLoc(e.target.value)}
            className="border border-card-border rounded-lg px-2 py-1.5 text-sm bg-white text-foreground max-w-[60%]"
          >
            {LOCATION_GROUPS.map((g) => (
              <optgroup key={g} label={locationGroupLabel(g, lang)}>
                {BIRTH_LOCATIONS.filter((l) => l.group === g).map((l) => (
                  <option key={l.id} value={l.id}>
                    {birthLocationLabel(l, lang)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <p className="text-[11px] text-muted flex items-center justify-between gap-2">
          <span>{t("astro.appliedOffset")}</span>
          <span className="font-mono font-bold text-foreground">UTC {fmtOffset(tz)}</span>
        </p>
      </section>

      {/* 出生時刻コントロール（アストロマップの生命線） */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
            <span>◈</span> {t("astro.birthTime")}
          </h3>
          {/* 信頼度バッジ */}
          {timeIsExact ? (
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
              style={{ backgroundColor: "#e7f6ee", color: "#1f7a4d", borderColor: "#bfe3cf" }}
            >
              {t("astro.confHigh")}
            </span>
          ) : hasTime ? (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/40">
              {t("astro.confTentative")}
            </span>
          ) : (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/30">
              {t("astro.confNone")}
            </span>
          )}
        </div>

        {/* 時刻入力 + 現在値 */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="time"
            value={effectiveTime ?? ""}
            onChange={(e) => setTimeOverride(e.target.value || null)}
            className="border border-card-border rounded-lg px-2 py-1.5 text-sm bg-white text-foreground"
          />
          <span className="font-mono text-xl font-bold text-foreground">
            {effectiveTime ?? "--:--"}
          </span>
          {profileTime && timeOverride !== null && timeOverride !== profileTime && (
            <button
              onClick={() => setTimeOverride(null)}
              className="text-[11px] text-muted underline hover:text-accent-orange"
            >
              {t("astro.resetToRegistered", { time: profileTime })}
            </button>
          )}
        </div>

        {/* スライダー（0:00〜23:59） */}
        <div className="space-y-1.5">
          <input
            type="range"
            min={0}
            max={1439}
            step={1}
            value={sliderMinutes}
            onChange={(e) => setTimeOverride(fmtHM(Number(e.target.value)))}
            className="w-full accent-accent-orange"
            aria-label={t("astro.sliderAria")}
          />
          <div className="flex justify-between text-[9px] text-muted/70 font-mono px-0.5">
            <span>0:00</span>
            <span>6:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">
            {t("astro.sliderNote")}
          </p>
        </div>

        {/* 状態に応じた案内 */}
        {timeIsExact ? (
          <p className="text-[11px] leading-relaxed rounded-lg px-3 py-2 bg-[#e7f6ee]/70 text-[#1f7a4d]">
            {t("astro.stateExact")}
          </p>
        ) : profileTime ? (
          <p className="text-[11px] leading-relaxed rounded-lg px-3 py-2 bg-accent-gold/10 text-accent-gold">
            {t("astro.stateTentative", { time: profileTime })}
          </p>
        ) : (
          <p className="text-[11px] leading-relaxed rounded-lg px-3 py-2 bg-danger/5 text-danger/90">
            {t("astro.stateNoneA")}
            <Link href="/profile" className="underline">{t("astro.stateNoneLink")}</Link>
            {t("astro.stateNoneB")}
          </p>
        )}
      </section>

      {hasTime ? (
        <>
      {/* 目的選択 */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> {t("astro.chooseGoal")}
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
                {p.emoji} {purposeText(p.id, lang).label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted px-1">{purposeTx.description}</p>
      </section>

      {/* 世界地図 */}
      {chart && (
        <section className="space-y-2.5">
          {!timeIsExact && (
            <p className="text-[11px] text-accent-gold bg-accent-gold/10 border border-accent-gold/30 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              <span>⚠</span>
              {t("astro.tentativeMapNote", { time: effectiveTime ?? "" })}
            </p>
          )}
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
                  <span className="text-foreground">{planetName(p.body, lang)}</span>
                </button>
              );
            })}
          </div>

          {/* アングルトグル */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-muted mr-1">{t("astro.lineType")}</span>
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
                {angleLabel(a, lang)}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted/70 px-1 leading-relaxed">
            {t("astro.mapLegend")}
          </p>
        </section>
      )}

      {/* 選択都市の詳細 */}
      {selectedScore && (
        <CityDetailCard score={selectedScore} purposeLabel={purposeTx.label} />
      )}

      {/* 地域フィルター */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> {purposeTx.emoji} {purposeTx.label}{t("astro.rankingHeading")}
        </h3>
        <div className="relative">
          <input
            type="search"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder={t("astro.searchPlaceholder")}
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
                {r === "all" ? t("astro.all") : regionLabel(r, lang)}
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
                    {cityName(cs.city, lang)}
                    <span className="text-[11px] text-muted font-normal ml-1.5">
                      {countryLabel(cs.city.country, lang)}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Stars n={cs.purposeStars} className="text-xs" />
                    {cs.activeLines[0] && (
                      <span
                        className="text-[9px] rounded-full px-1.5 py-0.5 whitespace-nowrap"
                        style={{
                          color: TONE_META[PLANET_META[cs.activeLines[0].body].tone].color,
                          backgroundColor: `${TONE_META[PLANET_META[cs.activeLines[0].body].tone].color}14`,
                        }}
                      >
                        {toneLabel(PLANET_META[cs.activeLines[0].body].tone, lang)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-bold text-lg text-accent-orange leading-none">
                    {cs.purposeScore}
                    <span className="text-[10px] text-muted font-normal">{t("astro.points")}</span>
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
              ? t("astro.noMatch", { q: cityQuery.trim() })
              : t("astro.noCityInRegion")}
          </p>
        )}

        {!showAll && !searching && filtered.length > 12 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-center text-sm text-accent-gold py-2.5 rounded-full border border-accent-gold/40 bg-accent-gold/5 hover:bg-accent-gold/10 transition-colors"
          >
            {t("astro.showMore", { n: filtered.length - 12 })}
          </button>
        )}
      </section>
        </>
      ) : (
        <TimeGate chart={chart} />
      )}

      {/* 免責 */}
      <p className="text-center text-xs text-muted/60 px-4 leading-relaxed">
        {t("astro.disclaimer")}
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
  const { t, lang } = useI18n();
  const top = score.activeLines.slice(0, 4);
  return (
    <section className="animate-fade-up bg-gradient-to-br from-accent-gold/10 via-card-bg to-accent-orange/5 border border-accent-gold/30 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{score.city.flag}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg text-foreground leading-tight">
            {cityName(score.city, lang)}
          </p>
          <p className="text-[11px] text-muted">
            {countryLabel(score.city.country, lang)}・{score.city.enName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted">{purposeLabel}</p>
          <p className="font-bold text-2xl text-accent-orange leading-none">
            {score.purposeScore}
            <span className="text-xs">{t("astro.points")}</span>
          </p>
          <Stars n={score.purposeStars} className="text-xs" />
        </div>
      </div>

      <p className="text-sm text-foreground/85 leading-relaxed bg-white/60 rounded-xl px-3 py-2">
        {citySummary(score, lang)}
      </p>

      {/* 効いているライン */}
      {top.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-accent-gold font-medium">{t("astro.activeLinesTitle")}</p>
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
                <div className="flex-1 min-w-0">
                  <p className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="font-bold text-foreground">
                      {t("astro.lineName", { planet: planetName(al.body, lang), angle: al.angle })}
                    </span>
                    <span
                      className="text-[10px] rounded-full px-1.5 py-0.5 whitespace-nowrap"
                      style={{
                        color: TONE_META[meta.tone].color,
                        backgroundColor: `${TONE_META[meta.tone].color}1a`,
                      }}
                    >
                      {toneLabel(meta.tone, lang)}
                    </span>
                    <span className="text-[10px] text-muted bg-muted/10 rounded-full px-1.5 py-0.5 whitespace-nowrap">
                      {lineDistanceLabel(al, lang)}
                    </span>
                  </p>
                  <p className="text-foreground/85 leading-relaxed">
                    {lineMessage(al.body, al.angle, lang)}
                  </p>
                </div>
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
              {planetName(p.body, lang)}
            </span>
            <Stars n={score.planetStars[p.body] ?? 0} className="text-[10px]" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** 出生時刻が未設定のときの案内＋時刻に依存しにくい星座配置 */
function TimeGate({ chart }: { chart: AstroChart | null }) {
  const { t, lang } = useI18n();
  return (
    <div className="space-y-4">
      <section className="animate-fade-up bg-gradient-to-br from-danger/5 via-card-bg to-accent-gold/5 border border-danger/25 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-danger">
          <span className="text-lg">◷</span>
          <h3 className="font-bold text-foreground">{t("astro.gate.title")}</h3>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">
          {t("astro.gate.body")}
        </p>

        <div className="bg-white/60 rounded-xl px-3.5 py-3 space-y-2 text-[12px] leading-relaxed">
          <p className="font-bold text-foreground flex items-center gap-1.5">
            <span className="text-accent-gold">🔎</span> {t("astro.gate.howTitle")}
          </p>
          <ul className="list-disc pl-4 space-y-1 text-foreground/75">
            <li>{t("astro.gate.how1")}</li>
            <li>{t("astro.gate.how2")}</li>
            <li>{t("astro.gate.how3")}</li>
          </ul>
          <p className="text-[11px] text-muted pt-0.5">
            {t("astro.gate.howNote")}
          </p>
        </div>

        <Link
          href="/profile"
          className="inline-block bg-accent-orange text-white text-sm font-medium rounded-full px-4 py-2 shadow-sm hover:bg-accent-orange/90 transition-colors"
        >
          {t("astro.gate.cta")}
        </Link>
      </section>

      {chart && (
        <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
            <span>◈</span> {t("astro.gate.skyTitle")}
          </h3>
          <p className="text-[11px] text-muted leading-relaxed">
            {t("astro.gate.skyNote")}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {PLANETS.map((p) => (
              <div key={p.body} className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-1.5 text-muted">
                  <span style={{ color: p.color }} className="text-sm leading-none">
                    {p.symbol}
                  </span>
                  {planetName(p.body, lang)}
                </span>
                <span className="text-foreground font-medium">
                  {signOf(chart.sky.positions[p.body].eclLon, lang)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted/70 leading-relaxed">
            {t("astro.gate.skyFootnote")}
          </p>
        </section>
      )}
    </div>
  );
}
