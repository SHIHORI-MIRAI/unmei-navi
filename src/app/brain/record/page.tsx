"use client";

/**
 * ノボケア — 記録
 *
 * 脳年齢の推移・領域別の力・日別の脳活ポイントを振り返る。
 * グラフはライブラリを使わず素のSVG（軽く、印刷しても崩れない）。
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DOMAINS, getDomain, getGame } from "@/lib/brain/games";
import {
  DAILY_GOAL,
  brainRank,
  calcBrainAge,
  calcStreak,
  dateKey,
} from "@/lib/brain/score";
import { clearBrainSessions, loadBrainSessions, type BrainSession } from "@/lib/storage";

const CHART_DAYS = 14;

interface DayPoint {
  date: string;
  label: string;
  points: number;
  plays: number;
  brainAge: number | null;
}

function buildDays(sessions: BrainSession[], today: Date): DayPoint[] {
  const days: DayPoint[] = [];
  for (let i = CHART_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const rows = sessions.filter((s) => s.date === key);
    // その日までの記録で脳年齢を出す（プレイのない日は線を描かない）
    const age = rows.length > 0 ? calcBrainAge(sessions, d).age : null;
    days.push({
      date: key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      points: rows.reduce((a, s) => a + s.points, 0),
      plays: rows.length,
      brainAge: age && age > 0 ? age : null,
    });
  }
  return days;
}

export default function BrainRecordPage() {
  const [sessions, setSessions] = useState<BrainSession[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setSessions(loadBrainSessions());
    setLoaded(true);
  }, []);

  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => buildDays(sessions, today), [sessions, today]);
  const current = useMemo(() => calcBrainAge(sessions, today), [sessions, today]);
  const totalPoints = useMemo(
    () => sessions.reduce((a, s) => a + s.points, 0),
    [sessions]
  );
  const streak = useMemo(() => calcStreak(sessions, today), [sessions, today]);

  function reset() {
    clearBrainSessions();
    setSessions([]);
    setConfirming(false);
  }

  if (!loaded) {
    return <p className="text-center text-muted text-sm py-16">読み込み中...</p>;
  }

  const ages = days.filter((d) => d.brainAge !== null).map((d) => d.brainAge!);
  const best = ages.length > 0 ? Math.min(...ages) : null;

  return (
    <div className="space-y-5 pb-4">
      <Link href="/brain" className="block text-xs text-muted hover:text-accent-orange">
        ← ノボケアへ
      </Link>

      <section className="text-center animate-fade-up">
        <h1 className="font-mincho text-xl font-bold text-accent-orange tracking-wide">
          脳の記録
        </h1>
        <p className="text-xs text-muted mt-1">続けた分だけ、数字は動きます</p>
      </section>

      {sessions.length === 0 ? (
        <section className="bg-card-bg border border-card-border rounded-3xl p-8 text-center space-y-3 shadow-sm">
          <p className="text-4xl">🧠</p>
          <p className="text-sm text-foreground/80">まだ記録がありません。</p>
          <Link
            href="/brain"
            className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-accent-orange to-accent-gold text-white text-sm font-bold shadow-md"
          >
            はじめのゲームへ
          </Link>
        </section>
      ) : (
        <>
          {/* サマリー */}
          <section className="grid grid-cols-3 gap-2.5">
            {[
              { label: "いまの脳年齢", value: `${current.age}歳`, sub: brainRank(current.age).label },
              { label: "ベスト脳年齢", value: best ? `${best}歳` : "—", sub: "直近14日" },
              { label: "連続日数", value: `${streak}日`, sub: `通算 ${sessions.length}プレイ` },
            ].map((c) => (
              <div
                key={c.label}
                className="bg-card-bg border border-card-border rounded-2xl p-3 text-center shadow-sm"
              >
                <p className="text-[10px] text-muted">{c.label}</p>
                <p className="text-xl font-bold text-accent-orange mt-1">{c.value}</p>
                <p className="text-[10px] text-muted mt-0.5 truncate">{c.sub}</p>
              </div>
            ))}
          </section>

          {/* 脳年齢の推移 */}
          <section className="bg-card-bg border border-card-border rounded-3xl p-5 shadow-sm space-y-3">
            <h2 className="font-mincho text-base font-bold text-foreground">
              脳年齢の推移（14日）
            </h2>
            <AgeChart days={days} />
            <p className="text-[11px] text-muted">
              下にいくほど脳年齢が若い状態です。プレイのない日は点がつきません。
            </p>
          </section>

          {/* 日別の脳活ポイント */}
          <section className="bg-card-bg border border-card-border rounded-3xl p-5 shadow-sm space-y-3">
            <h2 className="font-mincho text-base font-bold text-foreground">
              日別の脳活ポイント
            </h2>
            <div className="flex items-end gap-1 h-28">
              {days.map((d) => {
                const h = Math.min(100, (d.points / (DAILY_GOAL * 1.5)) * 100);
                return (
                  <div key={d.date} className="flex-1 h-full flex flex-col justify-end">
                    <span
                      className={`w-full rounded-t transition-all ${
                        d.points > 0 ? "bg-accent-orange/80" : "bg-card-border"
                      }`}
                      style={{ height: `${Math.max(h, d.points > 0 ? 8 : 3)}%` }}
                      title={`${d.label} ${d.points}pt`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-muted">
              <span>{days[0].label}</span>
              <span>今日</span>
            </div>
            <p className="text-[11px] text-muted">
              通算 {totalPoints}pt ・ 1日の目標は {DAILY_GOAL}pt です。
            </p>
          </section>

          {/* 領域別の力 */}
          <section className="bg-card-bg border border-card-border rounded-3xl p-5 shadow-sm space-y-3">
            <h2 className="font-mincho text-base font-bold text-foreground">
              5つの力のバランス
            </h2>
            {DOMAINS.map((d) => {
              const v = current.domainPower[d.id];
              return (
                <div key={d.id} className="flex items-center gap-2">
                  <span className="w-[5rem] text-[11px] text-foreground/80 shrink-0">
                    {d.emoji} {d.name}
                  </span>
                  <span className="flex-1 h-2.5 rounded-full bg-card-border/60 overflow-hidden">
                    <span
                      className="block h-full rounded-full transition-all duration-500"
                      style={{ width: `${v ?? 0}%`, backgroundColor: d.color }}
                    />
                  </span>
                  <span className="w-10 text-right text-[10px] text-muted">
                    {v === null ? "未" : v}
                  </span>
                </div>
              );
            })}
            <p className="text-[11px] text-muted">
              {current.coverage < DOMAINS.length
                ? "まだ触れていない力があります。満遍なく遊ぶほど脳年齢は若く出ます。"
                : "5つの力すべてを使えています。バランス満点です。"}
            </p>
          </section>

          {/* 履歴 */}
          <section className="space-y-2">
            <h2 className="font-mincho text-base font-bold text-foreground px-1">
              プレイ履歴
            </h2>
            {sessions.slice(0, 30).map((s) => {
              const game = getGame(s.gameId);
              const domain = game ? getDomain(game.domain) : null;
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 bg-card-bg border border-card-border rounded-2xl px-4 py-3 shadow-sm"
                >
                  <span className="text-2xl">{game?.emoji ?? "🧠"}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-foreground font-medium truncate">
                      {game?.name ?? s.gameId}・Lv{s.level}
                    </span>
                    <span className="block text-[10px] text-muted">
                      {s.date} ・ {domain?.name ?? ""} ・ {(s.timeMs / 1000).toFixed(1)}秒
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-bold text-accent-orange">
                      {s.score}点
                    </span>
                    <span className="block text-[10px] text-accent-gold">
                      {"★".repeat(s.stars)}
                      {"☆".repeat(3 - s.stars)} +{s.points}pt
                    </span>
                  </span>
                </div>
              );
            })}
            {sessions.length > 30 && (
              <p className="text-center text-[11px] text-muted">
                ほか {sessions.length - 30}件（新しい400件まで保存されます）
              </p>
            )}
          </section>

          {/* リセット */}
          <section className="pt-2">
            {confirming ? (
              <div className="border border-danger/40 rounded-2xl p-4 space-y-3 bg-card-bg">
                <p className="text-sm text-foreground/80">
                  脳トレの記録をすべて消します。占いのデータは残ります。よろしいですか？
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setConfirming(false)}
                    className="py-2.5 rounded-full border border-card-border text-sm text-muted"
                  >
                    やめる
                  </button>
                  <button
                    onClick={reset}
                    className="py-2.5 rounded-full bg-danger text-white text-sm font-bold"
                  >
                    削除する
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="w-full text-center text-xs text-muted hover:text-danger py-2"
              >
                脳トレの記録をリセットする
              </button>
            )}
          </section>
        </>
      )}

      <p className="text-center text-[11px] text-muted/70 px-4 leading-relaxed">
        ※ 脳年齢・脳活ポイントは、このアプリ独自の遊びの指標です。医学的な診断ではありません。
      </p>
    </div>
  );
}

/** 脳年齢の折れ線（20〜80歳を縦軸に。若い＝下） */
function AgeChart({ days }: { days: DayPoint[] }) {
  const W = 320;
  const H = 140;
  const PAD = 8;
  const points = days
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.brainAge !== null)
    .map(({ d, i }) => {
      const x = PAD + (i / (days.length - 1)) * (W - PAD * 2);
      // 20歳→上端、80歳→下端
      const y = PAD + ((d.brainAge! - 20) / 60) * (H - PAD * 2);
      return { x, y, age: d.brainAge!, label: d.label };
    });

  if (points.length === 0) {
    return <p className="text-center text-xs text-muted py-8">まだデータがありません</p>;
  }

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36">
      {[30, 45, 60].map((age) => {
        const y = PAD + ((age - 20) / 60) * (H - PAD * 2);
        return (
          <g key={age}>
            <line x1={PAD} x2={W - PAD} y1={y} y2={y} stroke="#f0d9b5" strokeWidth="1" />
            <text x={W - PAD} y={y - 3} textAnchor="end" fontSize="8" fill="#9a8a7a">
              {age}歳
            </text>
          </g>
        );
      })}
      {points.length > 1 && (
        <path d={path} fill="none" stroke="#e8820c" strokeWidth="2.5" strokeLinejoin="round" />
      )}
      {points.map((p) => (
        <circle key={p.label} cx={p.x} cy={p.y} r="3.5" fill="#e8820c" />
      ))}
      {points.length > 0 && (
        <text
          x={points[points.length - 1].x}
          y={points[points.length - 1].y - 8}
          textAnchor="middle"
          fontSize="10"
          fill="#3a2a1a"
          fontWeight="bold"
        >
          {points[points.length - 1].age}
        </text>
      )}
    </svg>
  );
}
