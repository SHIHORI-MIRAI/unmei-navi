"use client";

/**
 * ノボケア — 脳トレのホーム
 *
 * 1画面の中で「一覧 → レベル選択 → プレイ → 結果」を切り替える。
 * ページ遷移にすると、プレイ中の状態やタイマーが壊れやすいため。
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CalcSprint from "@/components/brain/CalcSprint";
import ColorStroop from "@/components/brain/ColorStroop";
import FlashNumber from "@/components/brain/FlashNumber";
import MemoryFlip from "@/components/brain/MemoryFlip";
import OrderTap from "@/components/brain/OrderTap";
import WordBuild from "@/components/brain/WordBuild";
import type { GameResult } from "@/components/brain/types";
import {
  BRAIN_GAMES,
  DOMAINS,
  LEVEL_LABELS,
  MAX_LEVEL,
  getDomain,
  getGame,
  parMsFor,
  type BrainGameDef,
  type BrainGameId,
} from "@/lib/brain/games";
import {
  DAILY_GOAL,
  MAX_TOTAL_STARS,
  ageDiffMessage,
  brainRank,
  buildSession,
  calcBrainAge,
  calcDailySummary,
  calcProgress,
  realAgeFrom,
  totalStars,
} from "@/lib/brain/score";
import {
  loadBrainSessions,
  loadProfile,
  saveBrainSession,
  type BrainSession,
} from "@/lib/storage";

type View =
  | { kind: "hub" }
  | { kind: "levels"; gameId: BrainGameId }
  | { kind: "play"; gameId: BrainGameId; level: number }
  | { kind: "result"; gameId: BrainGameId; level: number; session: BrainSession };

export default function BrainPage() {
  const [sessions, setSessions] = useState<BrainSession[]>([]);
  const [birthDate, setBirthDate] = useState("");
  const [view, setView] = useState<View>({ kind: "hub" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSessions(loadBrainSessions());
    setBirthDate(loadProfile()?.birthDate ?? "");
    setLoaded(true);
  }, []);

  const progress = useMemo(() => calcProgress(sessions), [sessions]);
  const daily = useMemo(() => calcDailySummary(sessions), [sessions]);
  const brainAge = useMemo(() => calcBrainAge(sessions), [sessions]);
  const realAge = useMemo(() => realAgeFrom(birthDate), [birthDate]);

  function handleFinish(gameId: BrainGameId, level: number, result: GameResult) {
    const session = buildSession(gameId, level, result);
    saveBrainSession(session);
    setSessions((prev) => [session, ...prev]);
    setView({ kind: "result", gameId, level, session });
  }

  if (!loaded) {
    return <p className="text-center text-muted text-sm py-16">読み込み中...</p>;
  }

  if (view.kind === "levels") {
    return (
      <LevelSelect
        game={getGame(view.gameId)!}
        unlocked={progress[view.gameId].unlockedLevel}
        bests={progress[view.gameId].levels}
        onBack={() => setView({ kind: "hub" })}
        onStart={(level) => setView({ kind: "play", gameId: view.gameId, level })}
      />
    );
  }

  if (view.kind === "play") {
    return (
      <PlayView
        game={getGame(view.gameId)!}
        level={view.level}
        onQuit={() => setView({ kind: "levels", gameId: view.gameId })}
        onFinish={(r) => handleFinish(view.gameId, view.level, r)}
      />
    );
  }

  if (view.kind === "result") {
    return (
      <ResultView
        game={getGame(view.gameId)!}
        session={view.session}
        brainAge={brainAge.age}
        realAge={realAge}
        todayPoints={daily.points}
        canGoNext={view.level < MAX_LEVEL}
        onRetry={() => setView({ kind: "play", gameId: view.gameId, level: view.level })}
        onNext={() =>
          setView({ kind: "play", gameId: view.gameId, level: view.level + 1 })
        }
        onList={() => setView({ kind: "hub" })}
      />
    );
  }

  const stars = totalStars(progress);

  return (
    <div className="space-y-5 pb-4">
      {/* タイトル */}
      <section className="animate-fade-up text-center pt-1">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl float-slow">🧠</span>
          <h1 className="font-mincho text-2xl font-bold text-accent-orange tracking-[0.1em]">
            ノボケア
          </h1>
          <span className="text-accent-gold sparkle">✦</span>
        </div>
        <p className="text-xs text-muted mt-1.5">
          遊びながら、今日どれくらい脳を使ったかがわかる
        </p>
      </section>

      {/* 今日の脳の使用量 */}
      <section className="animate-fade-up bg-card-bg border border-card-border rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-5">
          <UsageRing pct={daily.usagePct} />
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="font-mincho text-lg font-bold text-foreground">
              {daily.headline}
            </p>
            <p className="text-xs text-foreground/75 leading-relaxed">{daily.comment}</p>
            <p className="text-[11px] text-muted">
              脳活ポイント {daily.points} / {DAILY_GOAL}pt
              {daily.streak > 0 && (
                <span className="ml-2 text-accent-orange">🔥 {daily.streak}日連続</span>
              )}
            </p>
          </div>
        </div>

        {/* 今日つかった脳の場所 */}
        <div className="mt-4 pt-4 border-t border-card-border space-y-2">
          <p className="text-[11px] text-muted">今日つかった脳の場所</p>
          {DOMAINS.map((d) => {
            const usage = daily.byDomain.find((u) => u.domain === d.id)!;
            const width = Math.min(100, Math.round((usage.points / 60) * 100));
            return (
              <div key={d.id} className="flex items-center gap-2">
                <span className="w-[4.5rem] text-[11px] text-foreground/80 shrink-0">
                  {d.emoji} {d.name}
                </span>
                <span className="flex-1 h-2 rounded-full bg-card-border/60 overflow-hidden">
                  <span
                    className="block h-full rounded-full transition-all duration-500"
                    style={{ width: `${width}%`, backgroundColor: d.color }}
                  />
                </span>
                <span className="w-9 text-right text-[10px] text-muted">
                  {usage.points}pt
                </span>
              </div>
            );
          })}
          {daily.unusedDomains.length > 0 && daily.plays > 0 && (
            <p className="text-[11px] text-accent-gold pt-1">
              まだ「{getDomain(daily.unusedDomains[0]).name}」を使っていません。別の場所も刺激してみましょう。
            </p>
          )}
        </div>
      </section>

      {/* 脳年齢 */}
      <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-accent-gold/40 p-5 shadow-sm bg-gradient-to-br from-accent-gold/15 via-card-bg to-accent-orange/10">
        {brainAge.age === 0 ? (
          <div className="space-y-2 text-center">
            <p className="font-mincho text-lg font-bold text-foreground">
              あなたの脳年齢は、これから測定します
            </p>
            <p className="text-xs text-muted">
              どれか1ゲーム遊ぶと、今日の脳年齢が出ます。
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 text-center">
            <p className="text-xs text-muted tracking-[0.2em]">きょうの脳年齢</p>
            <p className="font-mincho">
              <span className="text-6xl font-bold text-accent-orange">{brainAge.age}</span>
              <span className="text-xl text-accent-gold ml-1">歳</span>
            </p>
            <p className="text-sm font-bold text-accent-gold">
              {brainRank(brainAge.age).emoji} {brainRank(brainAge.age).label}
            </p>
            <p className="text-xs text-foreground/75 leading-relaxed px-2">
              {brainRank(brainAge.age).comment}
            </p>
            <p className="text-xs text-foreground/80 bg-white/60 rounded-full py-1.5 px-3 inline-block">
              {ageDiffMessage(brainAge.age, realAge)}
            </p>
            <p className="text-[10px] text-muted">
              直近{brainAge.basisCount}プレイ・{brainAge.coverage}種類の力から算出
            </p>
          </div>
        )}
      </section>

      {/* 集めた星 */}
      <section className="animate-fade-up bg-card-bg border border-card-border rounded-2xl px-5 py-3.5 shadow-sm flex items-center justify-between">
        <span className="text-sm text-foreground/80">集めた星</span>
        <span className="text-sm">
          <span className="text-accent-gold text-lg">★</span>{" "}
          <span className="font-bold text-accent-orange text-lg">{stars}</span>
          <span className="text-muted"> / {MAX_TOTAL_STARS}</span>
        </span>
      </section>

      {/* ゲーム一覧 */}
      <section className="space-y-2.5">
        <h2 className="font-mincho text-base font-bold text-foreground px-1">
          脳トレゲーム（全{BRAIN_GAMES.length}種）
        </h2>
        {BRAIN_GAMES.map((game, i) => {
          const p = progress[game.id];
          const domain = getDomain(game.domain);
          return (
            <button
              key={game.id}
              onClick={() => setView({ kind: "levels", gameId: game.id })}
              className="animate-fade-up w-full text-left flex items-center gap-3.5 rounded-2xl border border-card-border p-3.5 shadow-sm transition-transform active:scale-[0.99]"
              style={{ background: game.bg, animationDelay: `${0.05 * i}s` }}
            >
              <span className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center text-3xl shadow-inner">
                {game.emoji}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="font-mincho text-base font-bold text-foreground">
                    {game.name}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: domain.color }}
                  >
                    {domain.name}
                  </span>
                </span>
                <span className="block text-[11px] text-muted mt-0.5">{game.catch}</span>
                <span className="block text-[11px] text-accent-gold mt-1">
                  ★ {p.stars} / {MAX_LEVEL * 3} ・ レベル{p.unlockedLevel}まで開放
                </span>
              </span>
              <span className="text-accent-gold/60 text-2xl mr-1">›</span>
            </button>
          );
        })}
      </section>

      <Link
        href="/brain/record"
        className="block text-center font-mincho text-base font-bold tracking-wide text-accent-gold py-3.5 rounded-full border border-accent-gold/40 bg-gradient-to-r from-accent-gold/5 via-card-bg to-accent-gold/5 shadow-sm hover:from-accent-gold/10 hover:to-accent-gold/10 transition-colors"
      >
        脳年齢の記録をみる
      </Link>

      <p className="text-center text-[11px] text-muted/70 px-4 leading-relaxed">
        ※ 脳年齢・脳活ポイントは、このアプリ独自の遊びの指標です。
        医学的な診断ではありません。体調が気になるときは医療機関にご相談ください。
      </p>

      <Link href="/" className="block text-center text-xs text-muted hover:text-accent-orange">
        ← 運命ナビのホームへ
      </Link>
    </div>
  );
}

/** 今日の使用量リング（SVGの円周を描画で表現） */
function UsageRing({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#f0d9b5" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#e8820c"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-accent-orange leading-none">{pct}</span>
        <span className="text-[10px] text-muted mt-0.5">%</span>
      </span>
    </div>
  );
}

function Stars({ count, size = "text-base" }: { count: number; size?: string }) {
  return (
    <span className={`${size} tracking-wider`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= count ? "text-accent-gold" : "text-card-border"}>
          ★
        </span>
      ))}
    </span>
  );
}

/** レベル選択 */
function LevelSelect({
  game,
  unlocked,
  bests,
  onBack,
  onStart,
}: {
  game: BrainGameDef;
  unlocked: number;
  bests: { level: number; bestScore: number; stars: number; plays: number }[];
  onBack: () => void;
  onStart: (level: number) => void;
}) {
  const domain = getDomain(game.domain);
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-xs text-muted hover:text-accent-orange">
        ← ゲーム一覧へ
      </button>

      <section
        className="animate-fade-up rounded-3xl border border-card-border p-5 shadow-sm text-center space-y-2"
        style={{ background: game.bg }}
      >
        <span className="text-4xl block">{game.emoji}</span>
        <h1 className="font-mincho text-xl font-bold text-foreground">{game.name}</h1>
        <span
          className="inline-block text-[10px] px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: domain.color }}
        >
          きたえる力：{domain.name}
        </span>
        <p className="text-xs text-foreground/75 leading-relaxed pt-1">{game.howTo}</p>
      </section>

      <section className="space-y-2.5">
        {bests.map((b) => {
          const locked = b.level > unlocked;
          return (
            <button
              key={b.level}
              disabled={locked}
              onClick={() => onStart(b.level)}
              className={`w-full flex items-center gap-3.5 rounded-2xl border p-4 shadow-sm transition-transform ${
                locked
                  ? "border-card-border bg-card-border/20 opacity-60"
                  : "border-card-border bg-card-bg active:scale-[0.99] hover:border-accent-gold"
              }`}
            >
              <span
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                  locked
                    ? "bg-card-border/50 text-muted"
                    : "bg-accent-orange/12 text-accent-orange"
                }`}
              >
                {locked ? "🔒" : b.level}
              </span>
              <span className="flex-1 min-w-0 text-left">
                <span className="block text-sm font-bold text-foreground">
                  レベル{b.level}・{LEVEL_LABELS[b.level - 1]}
                </span>
                <span className="block text-[11px] text-muted mt-0.5">
                  {locked
                    ? `レベル${b.level - 1}で★を1つ取ると開きます`
                    : b.plays > 0
                      ? `ベスト ${b.bestScore}点 ・ ${b.plays}回プレイ ・ 目安 ${game.parSec[b.level - 1]}秒`
                      : `未挑戦 ・ 目安 ${game.parSec[b.level - 1]}秒`}
                </span>
              </span>
              <Stars count={b.stars} />
            </button>
          );
        })}
      </section>

      <p className="text-center text-[11px] text-muted/70">
        ★1つ以上でクリア。次のレベルが開きます。
      </p>
    </div>
  );
}

/** カウントダウン → プレイ */
function PlayView({
  game,
  level,
  onQuit,
  onFinish,
}: {
  game: BrainGameDef;
  level: number;
  onQuit: () => void;
  onFinish: (result: GameResult) => void;
}) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) return;
    const id = setTimeout(() => setCount((c) => c - 1), 700);
    return () => clearTimeout(id);
  }, [count]);

  if (count > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-muted">
          {game.name}・レベル{level}
        </p>
        <p key={count} className="text-7xl font-bold text-accent-orange animate-fade-up">
          {count}
        </p>
        <p className="text-xs text-muted">よーい…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">
          {game.emoji} {game.name}・レベル{level}
        </span>
        <button onClick={onQuit} className="text-xs text-muted hover:text-danger">
          やめる
        </button>
      </div>
      <GameById gameId={game.id} level={level} onFinish={onFinish} />
    </div>
  );
}

function GameById({
  gameId,
  level,
  onFinish,
}: {
  gameId: BrainGameId;
  level: number;
  onFinish: (result: GameResult) => void;
}) {
  switch (gameId) {
    case "calc-sprint":
      return <CalcSprint level={level} onFinish={onFinish} />;
    case "memory-flip":
      return <MemoryFlip level={level} onFinish={onFinish} />;
    case "flash-number":
      return <FlashNumber level={level} onFinish={onFinish} />;
    case "color-stroop":
      return <ColorStroop level={level} onFinish={onFinish} />;
    case "order-tap":
      return <OrderTap level={level} onFinish={onFinish} />;
    case "word-build":
      return <WordBuild level={level} onFinish={onFinish} />;
  }
}

/** 結果画面 */
function ResultView({
  game,
  session,
  brainAge,
  realAge,
  todayPoints,
  canGoNext,
  onRetry,
  onNext,
  onList,
}: {
  game: BrainGameDef;
  session: BrainSession;
  brainAge: number;
  realAge: number | null;
  todayPoints: number;
  canGoNext: boolean;
  onRetry: () => void;
  onNext: () => void;
  onList: () => void;
}) {
  const cleared = session.stars >= 1;
  const parSec = Math.round(parMsFor(game, session.level) / 1000);
  const sec = (session.timeMs / 1000).toFixed(1);
  const domain = getDomain(game.domain);

  const comment = cleared
    ? session.stars === 3
      ? "文句なしの完璧プレイ！ このレベルはもう手の内ですね。"
      : session.stars === 2
        ? "いい仕上がり。あと少しの速さで★3が見えてきます。"
        : "クリア！ 次のレベルが開きました。"
    : "惜しい！ もう一度やると、脳がコツを覚えて必ず伸びます。";

  return (
    <div className="space-y-5">
      <section className="animate-fade-up rounded-3xl border border-accent-gold/40 p-6 shadow-sm text-center space-y-3 bg-gradient-to-br from-accent-gold/15 via-card-bg to-accent-orange/10">
        <p className="text-xs text-muted">
          {game.name}・レベル{session.level}
        </p>
        <Stars count={session.stars} size="text-4xl" />
        <p className="font-mincho">
          <span className="text-5xl font-bold text-accent-orange">{session.score}</span>
          <span className="text-base text-accent-gold ml-1">点</span>
        </p>
        <p className="text-sm text-foreground/80">{comment}</p>
      </section>

      <section className="bg-card-bg border border-card-border rounded-2xl p-5 shadow-sm space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">
            {game.id === "memory-flip" ? "そろえたペア / 手数" : "正解"}
          </span>
          <span className="font-bold text-foreground">
            {session.correct} / {session.total}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">タイム</span>
          <span className="font-bold text-foreground">
            {sec}秒 <span className="text-[11px] text-muted font-normal">（目安 {parSec}秒）</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">きたえた力</span>
          <span className="font-bold" style={{ color: domain.color }}>
            {domain.emoji} {domain.name}
          </span>
        </div>
        <div className="flex justify-between pt-2.5 border-t border-card-border">
          <span className="text-muted">獲得した脳活ポイント</span>
          <span className="font-bold text-accent-orange">＋{session.points}pt</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">今日の合計</span>
          <span className="font-bold text-foreground">{todayPoints}pt</span>
        </div>
      </section>

      <section className="rounded-2xl border border-card-border bg-card-bg p-5 shadow-sm text-center space-y-1.5">
        <p className="text-xs text-muted">いまの脳年齢</p>
        <p className="font-mincho">
          <span className="text-4xl font-bold text-accent-orange">{brainAge}</span>
          <span className="text-base text-accent-gold ml-1">歳</span>
        </p>
        <p className="text-xs text-foreground/75">{ageDiffMessage(brainAge, realAge)}</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRetry}
          className="py-3.5 rounded-full border border-accent-gold/50 text-accent-gold font-bold text-sm bg-card-bg active:scale-[0.98] transition-transform"
        >
          もう一度
        </button>
        {cleared && canGoNext ? (
          <button
            onClick={onNext}
            className="py-3.5 rounded-full bg-gradient-to-r from-accent-orange to-accent-gold text-white font-bold text-sm shadow-md active:scale-[0.98] transition-transform"
          >
            次のレベルへ
          </button>
        ) : (
          <button
            onClick={onList}
            className="py-3.5 rounded-full bg-gradient-to-r from-accent-orange to-accent-gold text-white font-bold text-sm shadow-md active:scale-[0.98] transition-transform"
          >
            ゲーム一覧へ
          </button>
        )}
      </div>

      {cleared && canGoNext && (
        <button
          onClick={onList}
          className="block w-full text-center text-xs text-muted hover:text-accent-orange"
        >
          ゲーム一覧へもどる
        </button>
      )}
    </div>
  );
}
