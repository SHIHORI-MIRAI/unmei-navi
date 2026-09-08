"use client";

/**
 * ことば並べかえ（ことば力）
 * バラバラの文字タイルをタップして、ヒントに合うことばを組み立てる。全5問。
 */

import { useEffect, useRef, useState } from "react";
import Preparing from "./Preparing";
import RoundDots from "./RoundDots";
import { LEVEL_WORD_LENGTH, wordsOfLength, type BrainWord } from "@/lib/brain/words";
import { shuffle, type GameProps } from "./types";

const ROUNDS = 5;

interface Tile {
  key: number;
  char: string;
}

function pickWords(level: number): BrainWord[] {
  const target = LEVEL_WORD_LENGTH[Math.min(Math.max(level, 1), LEVEL_WORD_LENGTH.length) - 1];
  // ねらいの文字数が足りなければ、前後の長さから補う
  let pool = wordsOfLength(target);
  for (let spread = 1; pool.length < ROUNDS && spread <= 3; spread++) {
    pool = [...pool, ...wordsOfLength(target - spread), ...wordsOfLength(target + spread)];
  }
  return shuffle(pool).slice(0, ROUNDS);
}

function makeTiles(word: string): Tile[] {
  const chars = word.split("").map((char, key) => ({ char, key }));
  let tiles = shuffle(chars);
  // 最初から答えが並んでいると出題にならないので並べ直す
  for (let i = 0; i < 5 && tiles.map((t) => t.char).join("") === word; i++) {
    tiles = shuffle(chars);
  }
  return tiles;
}

export default function WordBuild({ level, onFinish }: GameProps) {
  const [words, setWords] = useState<BrainWord[]>([]);
  const [round, setRound] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [correct, setCorrect] = useState(0);
  const [judge, setJudge] = useState<"ok" | "ng" | null>(null);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 出題語とタイルの並びは乱数なのでマウント後に用意する
  useEffect(() => {
    const picked = pickWords(level);
    setWords(picked);
    setTiles(makeTiles(picked[0].word));
    startedAt.current = Date.now();
  }, [level]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const current = words[round];

  /** すべて置かれた時点で答え合わせする */
  function judgeAnswer(filled: Tile[]) {
    if (!current) return;
    const answer = filled.map((t) => t.char).join("");
    const ok = answer === current.word;
    const nextCorrect = correct + (ok ? 1 : 0);
    if (ok) setCorrect(nextCorrect);
    setJudge(ok ? "ok" : "ng");

    timer.current = setTimeout(
      () => {
        if (round + 1 >= words.length) {
          onFinish({
            correct: nextCorrect,
            total: words.length,
            timeMs: Date.now() - startedAt.current,
          });
          return;
        }
        const nextWord = words[round + 1];
        setRound(round + 1);
        setTiles(makeTiles(nextWord.word));
        setPlaced([]);
        setJudge(null);
      },
      ok ? 800 : 1600
    );
  }

  function place(tile: Tile) {
    if (judge || !current) return;
    const filled = [...placed, tile];
    setTiles(tiles.filter((t) => t.key !== tile.key));
    setPlaced(filled);
    if (filled.length >= current.word.length) judgeAnswer(filled);
  }

  function unplace(tile: Tile) {
    if (judge) return;
    setPlaced(placed.filter((t) => t.key !== tile.key));
    setTiles([...tiles, tile]);
  }

  if (!current) return <Preparing />;

  return (
    <div className="space-y-5">
      <RoundDots current={round} total={words.length} />

      <div className="text-center">
        <span className="inline-block px-4 py-1.5 rounded-full text-sm bg-accent-gold/15 text-accent-gold">
          ヒント：{current.hint}（{current.word.length}文字）
        </span>
      </div>

      {/* 並べたことば */}
      <div className="bg-card-bg border border-card-border rounded-3xl p-5 shadow-sm min-h-[112px] flex flex-col items-center justify-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {Array.from({ length: current.word.length }, (_, i) => {
            const tile = placed[i];
            return tile ? (
              <button
                key={tile.key}
                onClick={() => unplace(tile)}
                className={`w-11 h-12 rounded-xl border text-xl font-bold shadow-sm transition-colors ${
                  judge === "ok"
                    ? "border-accent-orange bg-accent-orange/10 text-accent-orange"
                    : judge === "ng"
                      ? "border-danger bg-danger/10 text-danger"
                      : "border-accent-gold/60 bg-accent-gold/10 text-foreground"
                }`}
              >
                {tile.char}
              </button>
            ) : (
              <span
                key={`empty-${i}`}
                className="w-11 h-12 rounded-xl border border-dashed border-card-border"
              />
            );
          })}
        </div>
        {judge === "ng" && (
          <p className="text-xs text-muted">
            正解は <span className="font-bold text-foreground">{current.word}</span>
          </p>
        )}
      </div>

      {/* 残りの文字 */}
      <div className="flex flex-wrap items-center justify-center gap-2 min-h-[52px]">
        {tiles.map((t) => (
          <button
            key={t.key}
            onClick={() => place(t)}
            className="w-12 h-12 rounded-xl border border-card-border bg-card-bg text-xl font-bold shadow-sm active:scale-95 hover:border-accent-gold transition-transform"
          >
            {t.char}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted">
        文字をタップして並べます。置いた文字はもう一度タップで戻せます。
      </p>
    </div>
  );
}
