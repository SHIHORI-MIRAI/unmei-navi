/**
 * ノボケア — 採点・脳年齢・今日の脳の使用量
 *
 * 方針:
 * - 「脳年齢」はあくまで遊びの指標。医学的な診断ではないので、低く出ても
 *   責める表現にはせず、ポジティブな言い回しで返す（運命ナビ全体の方針と同じ）。
 * - 1回の結果で数値が乱高下しないよう、直近の記録をならして算出する。
 */

import type { BrainSession } from "@/lib/storage";
import {
  BRAIN_GAMES,
  DOMAINS,
  MAX_LEVEL,
  getGame,
  parMsFor,
  type BrainDomain,
  type BrainGameId,
} from "./games";

/** ローカル時刻の YYYY-MM-DD（UTC変換だと日付がずれるので自前で組む） */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

// ===== 1プレイの採点 =====

export interface ScoreInput {
  correct: number;
  total: number;
  timeMs: number;
  parMs: number;
}

/**
 * 0〜100点。正確さ70点＋速さ30点。
 * 速さ点には正確さを掛ける（当てずっぽうで速く終えても伸びないように）。
 */
export function computeScore({ correct, total, timeMs, parMs }: ScoreInput): number {
  const accuracy = total > 0 ? clamp(correct / total, 0, 1) : 0;
  const speedRatio = timeMs > 0 ? clamp(parMs / timeMs, 0, 1) : 0;
  return Math.round(accuracy * 70 + speedRatio * accuracy * 30);
}

/** 星（0〜3）。星1つ以上で「クリア」＝次のレベルが開く */
export function starsFor(score: number): number {
  if (score >= 88) return 3;
  if (score >= 72) return 2;
  if (score >= 55) return 1;
  return 0;
}

/** 脳活ポイント。高いレベルほど1プレイの手ごたえが大きい */
export function pointsFor(score: number, level: number): number {
  return Math.round(score * (0.6 + 0.1 * clamp(level, 1, MAX_LEVEL)));
}

/** そのプレイの「脳パワー」(0-100)。レベル補正込み */
export function powerOf(session: BrainSession): number {
  return clamp(session.score * (0.78 + 0.055 * clamp(session.level, 1, MAX_LEVEL)), 0, 100);
}

/** 1日の脳活ポイントの目標値（だいたい2〜3プレイ分） */
export const DAILY_GOAL = 100;

// ===== 脳年齢 =====

export interface BrainAgeResult {
  /** 脳年齢（20〜80） */
  age: number;
  /** 総合の脳パワー 0-100 */
  power: number;
  /** 領域ごとのパワー（未プレイは null） */
  domainPower: Record<BrainDomain, number | null>;
  /** 算出に使ったプレイ数 */
  basisCount: number;
  /** 使った領域の数（0-5） */
  coverage: number;
}

const RECENT_DAYS = 21;

function domainOf(gameId: string): BrainDomain | null {
  return getGame(gameId)?.domain ?? null;
}

/** 算出対象のプレイを選ぶ。直近21日分、少なすぎるときは新しい順に10件 */
function basisSessions(sessions: BrainSession[], asOf: Date): BrainSession[] {
  const limit = new Date(asOf);
  limit.setDate(limit.getDate() - RECENT_DAYS);
  const asOfKey = dateKey(asOf);
  const upTo = sessions.filter((s) => s.date <= asOfKey);
  const recent = upTo.filter((s) => s.date >= dateKey(limit));
  if (recent.length >= 3) return recent;
  return upTo.slice(0, 10);
}

/**
 * 脳年齢を算出する。領域ごとに上位2件の平均を取り、その平均に
 * 「いくつの領域を使ったか」のボーナスを掛ける（＝満遍なく遊ぶほど若く出る）。
 */
export function calcBrainAge(
  sessions: BrainSession[],
  asOf: Date = new Date()
): BrainAgeResult {
  const basis = basisSessions(sessions, asOf);
  const domainPower = {} as Record<BrainDomain, number | null>;
  for (const d of DOMAINS) domainPower[d.id] = null;

  for (const d of DOMAINS) {
    const powers = basis
      .filter((s) => domainOf(s.gameId) === d.id)
      .map(powerOf)
      .sort((a, b) => b - a)
      .slice(0, 2);
    if (powers.length > 0) {
      domainPower[d.id] = Math.round(powers.reduce((a, b) => a + b, 0) / powers.length);
    }
  }

  const played = DOMAINS.map((d) => domainPower[d.id]).filter(
    (v): v is number => v !== null
  );
  const coverage = played.length;

  if (coverage === 0) {
    return { age: 0, power: 0, domainPower, basisCount: 0, coverage: 0 };
  }

  const mean = played.reduce((a, b) => a + b, 0) / played.length;
  let power = mean * (0.9 + 0.1 * (coverage / DOMAINS.length));

  // プレイ数が少ないうちは中央値(50)に寄せて、初回の一発勝負で極端な数字が出ないようにする
  if (basis.length < 3) {
    power = (power * basis.length + 50 * (3 - basis.length)) / 3;
  }
  power = clamp(power, 0, 100);

  return {
    age: clamp(Math.round(78 - power * 0.58), 20, 80),
    power: Math.round(power),
    domainPower,
    basisCount: basis.length,
    coverage,
  };
}

export interface BrainRank {
  label: string;
  emoji: string;
  comment: string;
}

export function brainRank(age: number): BrainRank {
  if (age <= 29)
    return {
      label: "きらめき脳",
      emoji: "✨",
      comment: "反応も判断もキレッキレ。今日のあなたの脳、絶好調です。",
    };
  if (age <= 39)
    return {
      label: "さえてる脳",
      emoji: "🌟",
      comment: "頭の中がクリアな状態。集中がいるお仕事はいまがチャンス。",
    };
  if (age <= 49)
    return {
      label: "ほぐれ脳",
      emoji: "🌤",
      comment: "いい感じにほぐれています。あと1ゲームで、もうひと伸びしそう。",
    };
  if (age <= 59)
    return {
      label: "ウォームアップ脳",
      emoji: "☕",
      comment: "エンジンがあたたまってきたところ。続けるほど数字は動きます。",
    };
  return {
    label: "これから伸びる脳",
    emoji: "🌱",
    comment: "いまが伸びしろの入口。毎日1ゲームで、数字はちゃんと変わります。",
  };
}

/** 実年齢（生年月日から）。未設定・不正値なら null */
export function realAgeFrom(birthDate: string, today: Date = new Date()): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (isNaN(b.getTime())) return null;
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}

/** 実年齢との差を、責めない言い回しで返す */
export function ageDiffMessage(brainAge: number, realAge: number | null): string {
  if (realAge === null) return "プロフィールに生年月日を登録すると、実年齢とくらべられます。";
  const diff = realAge - brainAge;
  if (diff >= 15) return `実年齢より ${diff}歳 若い脳！ 大成功です。`;
  if (diff >= 5) return `実年齢より ${diff}歳 若い脳。いい状態をキープできています。`;
  if (diff >= -4) return "実年齢とほぼ同じ。ここからが伸ばしどきです。";
  return `いまは実年齢より ${Math.abs(diff)}歳 上。続けるほど下がるので、まずは1日1ゲームから。`;
}

// ===== 今日の脳の使用量 =====

export interface DomainUsage {
  domain: BrainDomain;
  points: number;
  plays: number;
}

export interface DailySummary {
  date: string;
  points: number;
  goal: number;
  /** 目標に対する使用率（0-100で頭打ち） */
  usagePct: number;
  plays: number;
  timeMs: number;
  byDomain: DomainUsage[];
  /** 今日まだ触れていない領域 */
  unusedDomains: BrainDomain[];
  streak: number;
  headline: string;
  comment: string;
}

/** 連続プレイ日数。今日まだなら昨日までの連続数を返す */
export function calcStreak(sessions: BrainSession[], today: Date = new Date()): number {
  const days = new Set(sessions.map((s) => s.date));
  const cursor = new Date(today);
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function calcDailySummary(
  sessions: BrainSession[],
  today: Date = new Date()
): DailySummary {
  const key = dateKey(today);
  const todays = sessions.filter((s) => s.date === key);
  const points = todays.reduce((a, s) => a + s.points, 0);
  const timeMs = todays.reduce((a, s) => a + s.timeMs, 0);
  const usagePct = Math.min(100, Math.round((points / DAILY_GOAL) * 100));

  const byDomain: DomainUsage[] = DOMAINS.map((d) => {
    const rows = todays.filter((s) => domainOf(s.gameId) === d.id);
    return {
      domain: d.id,
      points: rows.reduce((a, s) => a + s.points, 0),
      plays: rows.length,
    };
  });
  const unusedDomains = byDomain.filter((d) => d.plays === 0).map((d) => d.domain);

  let headline: string;
  let comment: string;
  if (todays.length === 0) {
    headline = "今日の脳、まだお休み中";
    comment = "1ゲームは1〜2分。まずは軽いレベルからウォームアップしてみましょう。";
  } else if (usagePct < 40) {
    headline = "ウォームアップ完了！";
    comment = `今日は ${todays.length}ゲーム、${points}pt。エンジンがあたたまりました。あと1ゲームで“しっかり使った日”になります。`;
  } else if (usagePct < 70) {
    headline = "いい調子で使えています";
    comment = `今日は ${todays.length}ゲーム、${points}pt。頭の回転がなめらかになってきた頃です。`;
  } else if (usagePct < 100) {
    headline = "しっかり使った日";
    comment = `今日は ${todays.length}ゲーム、${points}pt。目標まであと少し、ラスト1ゲーム！`;
  } else {
    headline = "今日の目標クリア！";
    comment = `今日は ${todays.length}ゲーム、${points}pt。よく使いました。休憩と水分も、脳の大事なトレーニングです。`;
  }

  return {
    date: key,
    points,
    goal: DAILY_GOAL,
    usagePct,
    plays: todays.length,
    timeMs,
    byDomain,
    unusedDomains,
    streak: calcStreak(sessions, today),
    headline,
    comment,
  };
}

// ===== レベルの進み具合 =====

export interface LevelBest {
  level: number;
  bestScore: number;
  stars: number;
  plays: number;
}

export interface GameProgress {
  gameId: BrainGameId;
  levels: LevelBest[];
  /** 挑戦できる最大レベル（クリアで1つずつ開く） */
  unlockedLevel: number;
  stars: number;
}

export function calcProgress(sessions: BrainSession[]): Record<string, GameProgress> {
  const out: Record<string, GameProgress> = {};
  for (const game of BRAIN_GAMES) {
    const rows = sessions.filter((s) => s.gameId === game.id);
    const levels: LevelBest[] = [];
    for (let lv = 1; lv <= MAX_LEVEL; lv++) {
      const at = rows.filter((s) => s.level === lv);
      const bestScore = at.reduce((a, s) => Math.max(a, s.score), 0);
      levels.push({
        level: lv,
        bestScore,
        stars: at.reduce((a, s) => Math.max(a, s.stars), 0),
        plays: at.length,
      });
    }
    let unlocked = 1;
    for (let lv = 1; lv < MAX_LEVEL; lv++) {
      if (levels[lv - 1].stars >= 1) unlocked = lv + 1;
      else break;
    }
    out[game.id] = {
      gameId: game.id,
      levels,
      unlockedLevel: unlocked,
      stars: levels.reduce((a, l) => a + l.stars, 0),
    };
  }
  return out;
}

export function totalStars(progress: Record<string, GameProgress>): number {
  return Object.values(progress).reduce((a, p) => a + p.stars, 0);
}

export const MAX_TOTAL_STARS = BRAIN_GAMES.length * MAX_LEVEL * 3;

/** ゲーム終了時に保存用のセッションを組み立てる */
export function buildSession(
  gameId: BrainGameId,
  level: number,
  result: { correct: number; total: number; timeMs: number },
  now: Date = new Date()
): BrainSession {
  const game = getGame(gameId);
  const parMs = game ? parMsFor(game, level) : 60000;
  const score = computeScore({ ...result, parMs });
  return {
    id: `${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    date: dateKey(now),
    gameId,
    level,
    score,
    correct: result.correct,
    total: result.total,
    timeMs: result.timeMs,
    stars: starsFor(score),
    points: pointsFor(score, level),
    createdAt: now.toISOString(),
  };
}
