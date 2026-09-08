"use client";

/**
 * 色まちがい（注意力・ストループ課題）
 * 「文字の色」または「書いてある文字」を、つられずに答える。
 */

import { useEffect, useRef, useState } from "react";
import Preparing from "./Preparing";
import RoundDots from "./RoundDots";
import { randInt, shuffle, type GameProps } from "./types";

const COLORS = [
  { name: "あか", hex: "#d93a3f" },
  { name: "あお", hex: "#2f6fd0" },
  { name: "みどり", hex: "#1e8a56" },
  { name: "きいろ", hex: "#c08a00" },
  { name: "むらさき", hex: "#7c4fd0" },
  { name: "オレンジ", hex: "#dd7208" },
];

/** レベル別の問題数 */
const ROUNDS = [12, 14, 16, 18, 20];

interface Question {
  /** 表示する文字（色名） */
  wordIdx: number;
  /** その文字を描くインクの色 */
  inkIdx: number;
  /** 聞かれるもの: インクの色 / 書かれている文字 */
  ask: "ink" | "word";
  choices: number[];
}

function buildQuestions(level: number): Question[] {
  const count = ROUNDS[Math.min(Math.max(level, 1), ROUNDS.length) - 1];
  // レベル3以上は「文字を答える」問題が混ざり、切り替えの負荷が上がる
  const mixWord = level >= 3;
  return Array.from({ length: count }, () => {
    const wordIdx = randInt(0, COLORS.length - 1);
    let inkIdx = randInt(0, COLORS.length - 1);
    // 8割はわざと文字と色を食い違わせる（そこが“まどわし”になる）
    if (inkIdx === wordIdx && Math.random() < 0.8) {
      inkIdx = (inkIdx + randInt(1, COLORS.length - 1)) % COLORS.length;
    }
    const ask: "ink" | "word" = mixWord && Math.random() < 0.35 ? "word" : "ink";
    const answer = ask === "ink" ? inkIdx : wordIdx;
    const pool = shuffle(
      COLORS.map((_, i) => i).filter((i) => i !== answer)
    ).slice(0, 3);
    return { wordIdx, inkIdx, ask, choices: shuffle([answer, ...pool]) };
  });
}

export default function ColorStroop({ level, onFinish }: GameProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [flash, setFlash] = useState<"ok" | "ng" | null>(null);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 出題は乱数を使うのでレンダー中には作らず、マウント後に組み立てる
  useEffect(() => {
    setQuestions(buildQuestions(level));
    startedAt.current = Date.now();
  }, [level]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const q = questions[index];

  function answer(choice: number) {
    if (flash || !q) return;
    const ok = choice === (q.ask === "ink" ? q.inkIdx : q.wordIdx);
    const nextCorrect = correct + (ok ? 1 : 0);
    if (ok) setCorrect(nextCorrect);
    setFlash(ok ? "ok" : "ng");

    timer.current = setTimeout(() => {
      setFlash(null);
      if (index + 1 >= questions.length) {
        onFinish({
          correct: nextCorrect,
          total: questions.length,
          timeMs: Date.now() - startedAt.current,
        });
      } else {
        setIndex(index + 1);
      }
    }, ok ? 260 : 620);
  }

  if (!q) return <Preparing />;

  return (
    <div className="space-y-5">
      <RoundDots current={index} total={questions.length} />

      <div className="text-center">
        <span
          className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
            q.ask === "ink"
              ? "bg-accent-orange/15 text-accent-orange"
              : "bg-accent-gold/20 text-accent-gold"
          }`}
        >
          {q.ask === "ink" ? "文字の「色」は？" : "書いてある「文字」は？"}
        </span>
      </div>

      <div className="relative bg-card-bg border border-card-border rounded-3xl py-12 text-center shadow-sm">
        <p
          className="text-5xl font-bold tracking-wider"
          style={{ color: COLORS[q.inkIdx].hex }}
        >
          {COLORS[q.wordIdx].name}
        </p>
        {flash && (
          <span
            className={`absolute inset-0 flex items-center justify-center text-7xl bg-card-bg/70 ${
              flash === "ok" ? "text-accent-orange" : "text-danger"
            }`}
          >
            {flash === "ok" ? "○" : "×"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {q.choices.map((c) => (
          <button
            key={c}
            onClick={() => answer(c)}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-card-border bg-card-bg text-lg font-bold text-foreground shadow-sm active:scale-[0.97] hover:border-accent-gold transition-transform"
          >
            <span
              className="w-4 h-4 rounded-full border border-black/10"
              style={{ backgroundColor: COLORS[c].hex }}
            />
            {COLORS[c].name}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted">
        {index + 1} / {questions.length}問目 ・ 正解 {correct}
      </p>
    </div>
  );
}
