"use client";

/**
 * 計算スプリント（計算力）
 * 全10問。式の答えを4択から選ぶ。レベルで式の難しさが変わる。
 */

import { useEffect, useRef, useState } from "react";
import Preparing from "./Preparing";
import RoundDots from "./RoundDots";
import { randInt, shuffle, type GameProps } from "./types";

const QUESTION_COUNT = 10;

interface Question {
  text: string;
  answer: number;
  choices: number[];
}

/** レベル別に式を組み立てる。答えは必ず0以上の整数にする */
function makeQuestion(level: number): { text: string; answer: number } {
  switch (level) {
    case 1: {
      if (Math.random() < 0.5) {
        const a = randInt(2, 9);
        const b = randInt(2, 9);
        return { text: `${a} + ${b}`, answer: a + b };
      }
      const a = randInt(5, 18);
      const b = randInt(1, a - 1);
      return { text: `${a} − ${b}`, answer: a - b };
    }
    case 2: {
      if (Math.random() < 0.5) {
        const a = randInt(11, 49);
        const b = randInt(11, 49);
        return { text: `${a} + ${b}`, answer: a + b };
      }
      const a = randInt(21, 89);
      const b = randInt(6, a - 5);
      return { text: `${a} − ${b}`, answer: a - b };
    }
    case 3: {
      if (Math.random() < 0.6) {
        const a = randInt(3, 9);
        const b = randInt(3, 9);
        return { text: `${a} × ${b}`, answer: a * b };
      }
      const a = randInt(25, 89);
      const b = randInt(11, 49);
      return { text: `${a} + ${b}`, answer: a + b };
    }
    case 4: {
      const r = Math.random();
      if (r < 0.4) {
        const a = randInt(11, 29);
        const b = randInt(3, 9);
        return { text: `${a} × ${b}`, answer: a * b };
      }
      if (r < 0.7) {
        const a = randInt(20, 60);
        const b = randInt(10, 30);
        const c = randInt(5, 20);
        return { text: `${a} + ${b} − ${c}`, answer: a + b - c };
      }
      const b = randInt(3, 9);
      const q = randInt(3, 12);
      return { text: `${b * q} ÷ ${b}`, answer: q };
    }
    default: {
      const r = Math.random();
      if (r < 0.35) {
        const a = randInt(12, 39);
        const b = randInt(11, 19);
        return { text: `${a} × ${b}`, answer: a * b };
      }
      if (r < 0.7) {
        const a = randInt(3, 9);
        const b = randInt(3, 9);
        const c = randInt(10, 40);
        return { text: `${a} × ${b} + ${c}`, answer: a * b + c };
      }
      const b = randInt(4, 12);
      const q = randInt(4, 15);
      const c = randInt(2, 15);
      return { text: `${b * q} ÷ ${b} + ${c}`, answer: q + c };
    }
  }
}

/** 正解の近くにダミーを3つ作る（重複・マイナスは避ける） */
function makeChoices(answer: number): number[] {
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < 4 && guard < 60) {
    guard++;
    const spread = Math.max(2, Math.round(Math.abs(answer) * 0.15));
    const delta = randInt(1, spread + 3) * (Math.random() < 0.5 ? -1 : 1);
    const v = answer + delta;
    if (v >= 0 && v !== answer) set.add(v);
  }
  while (set.size < 4) set.add(answer + set.size);
  return shuffle([...set]);
}

function buildQuestions(level: number): Question[] {
  return Array.from({ length: QUESTION_COUNT }, () => {
    const q = makeQuestion(level);
    return { ...q, choices: makeChoices(q.answer) };
  });
}

export default function CalcSprint({ level, onFinish }: GameProps) {
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

  function answer(value: number) {
    if (flash) return; // 判定表示中の連打を無視
    const isOk = value === questions[index].answer;
    setFlash(isOk ? "ok" : "ng");
    const nextCorrect = correct + (isOk ? 1 : 0);
    if (isOk) setCorrect(nextCorrect);

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
    }, isOk ? 320 : 700);
  }

  const q = questions[index];
  if (!q) return <Preparing />;

  return (
    <div className="space-y-5">
      <RoundDots current={index} total={questions.length} />

      <div className="relative bg-card-bg border border-card-border rounded-3xl py-10 text-center shadow-sm">
        <p className="font-mono text-4xl font-bold text-foreground tracking-wide">
          {q.text}
        </p>
        <p className="text-muted text-sm mt-2">= ?</p>
        {flash && (
          <span
            className={`absolute inset-0 flex items-center justify-center text-7xl ${
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
            className="py-5 rounded-2xl border border-card-border bg-card-bg text-2xl font-bold text-foreground shadow-sm transition-transform active:scale-[0.97] hover:border-accent-gold"
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted">
        {index + 1} / {questions.length}問目 ・ 正解 {correct}
      </p>
    </div>
  );
}
