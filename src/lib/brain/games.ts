/**
 * ノボケア — 脳トレゲームの定義
 *
 * 「今日どれくらい脳を使ったか」を出すために、ゲームは必ず1つの
 * 脳の領域（計算・記憶・注意・スピード・ことば）に属させる。
 * 領域が偏っていれば「別の場所も使ってみよう」と案内できる。
 */

export type BrainDomain = "calc" | "memory" | "attention" | "speed" | "language";

export interface DomainDef {
  id: BrainDomain;
  name: string;
  emoji: string;
  /** バー・グラフ用の色（クリーム背景でコントラストが取れる濃さ） */
  color: string;
  description: string;
}

export const DOMAINS: DomainDef[] = [
  { id: "calc", name: "計算力", emoji: "🔢", color: "#e8820c", description: "数をすばやく扱う力" },
  { id: "memory", name: "記憶力", emoji: "🧩", color: "#7c5cd6", description: "覚えて、思い出す力" },
  { id: "attention", name: "注意力", emoji: "🎯", color: "#2f9e6e", description: "まどわされずに選ぶ力" },
  { id: "speed", name: "スピード", emoji: "⚡", color: "#c4942a", description: "見つけて反応する速さ" },
  { id: "language", name: "ことば力", emoji: "💬", color: "#d4568a", description: "ことばを組み立てる力" },
];

export function getDomain(id: BrainDomain): DomainDef {
  return DOMAINS.find((d) => d.id === id) ?? DOMAINS[0];
}

export type BrainGameId =
  | "calc-sprint"
  | "memory-flip"
  | "flash-number"
  | "color-stroop"
  | "order-tap"
  | "word-build";

export interface BrainGameDef {
  id: BrainGameId;
  name: string;
  emoji: string;
  domain: BrainDomain;
  /** 一言キャッチ（カード用） */
  catch: string;
  /** 遊び方（レベル選択画面で表示） */
  howTo: string;
  /** レベル別の目安タイム（秒）。速さの採点はこれを基準にする */
  parSec: number[];
  /** カード背景のグラデーション */
  bg: string;
}

export const MAX_LEVEL = 5;

/** レベルの雰囲気ラベル（1始まり） */
export const LEVEL_LABELS = [
  "はじめの一歩",
  "ウォームアップ",
  "だんだん本気",
  "脳が汗をかく",
  "達人チャレンジ",
];

export const BRAIN_GAMES: BrainGameDef[] = [
  {
    id: "calc-sprint",
    name: "計算スプリント",
    emoji: "🔢",
    domain: "calc",
    catch: "10問の計算を駆け抜ける",
    howTo: "出てきた式の答えを、4つの中からタップ。全10問、速さも点数になります。",
    parSec: [40, 45, 50, 58, 66],
    bg: "linear-gradient(135deg, rgba(232,130,12,0.16), rgba(255,255,255,0.6))",
  },
  {
    id: "memory-flip",
    name: "記憶めくり",
    emoji: "🧩",
    domain: "memory",
    catch: "同じ絵をペアで見つける",
    howTo: "カードをめくって同じ絵をそろえます。めくった回数が少ないほど高得点。",
    parSec: [25, 40, 60, 85, 115],
    bg: "linear-gradient(135deg, rgba(124,92,214,0.16), rgba(255,255,255,0.6))",
  },
  {
    id: "flash-number",
    name: "瞬間記憶",
    emoji: "⚡",
    domain: "memory",
    catch: "一瞬うつる数字を覚える",
    howTo: "数字がパッと出て、すぐ消えます。覚えた数字をそのまま入力。全5問。",
    parSec: [45, 50, 55, 62, 70],
    bg: "linear-gradient(135deg, rgba(91,143,214,0.16), rgba(255,255,255,0.6))",
  },
  {
    id: "color-stroop",
    name: "色まちがい",
    emoji: "🎯",
    domain: "attention",
    catch: "文字ではなく“色”を答える",
    howTo: "「あか」と書かれた青い文字…答えるのは指示された方だけ。つられずに選びます。",
    parSec: [34, 38, 44, 52, 60],
    bg: "linear-gradient(135deg, rgba(47,158,110,0.16), rgba(255,255,255,0.6))",
  },
  {
    id: "order-tap",
    name: "順番タッチ",
    emoji: "👆",
    domain: "speed",
    catch: "1から順に、最速でタッチ",
    howTo: "バラバラに並んだ数字を小さい順にタップ。レベル4からは数字とひらがなが交互になります。",
    parSec: [12, 18, 26, 38, 52],
    bg: "linear-gradient(135deg, rgba(196,148,42,0.18), rgba(255,255,255,0.6))",
  },
  {
    id: "word-build",
    name: "ことば並べかえ",
    emoji: "💬",
    domain: "language",
    catch: "バラバラの文字をことばに",
    howTo: "ヒントを手がかりに、文字をタップして正しいことばを組み立てます。全5問。",
    parSec: [50, 60, 70, 85, 100],
    bg: "linear-gradient(135deg, rgba(212,86,138,0.16), rgba(255,255,255,0.6))",
  },
];

export function getGame(id: string): BrainGameDef | null {
  return BRAIN_GAMES.find((g) => g.id === id) ?? null;
}

/** そのレベルの目安タイム（ミリ秒）。範囲外レベルでも落ちないようクランプする */
export function parMsFor(game: BrainGameDef, level: number): number {
  const idx = Math.min(Math.max(level, 1), MAX_LEVEL) - 1;
  return game.parSec[idx] * 1000;
}
