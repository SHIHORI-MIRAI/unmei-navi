"use client";

/**
 * 瞬間記憶（記憶力）
 * 一瞬だけ表示される数字を覚えて入力する。全5問。
 */

import { useEffect, useRef, useState } from "react";
import Preparing from "./Preparing";
import RoundDots from "./RoundDots";
import { randInt, type GameProps } from "./types";

const ROUNDS = 5;
/** レベル別の桁数と表示時間(ms) */
const DIGITS = [4, 5, 6, 7, 8];
const SHOW_MS = [2000, 1900, 1700, 1500, 1300];

function makeNumber(digits: number): string {
  let s = String(randInt(1, 9));
  for (let i = 1; i < digits; i++) s += String(randInt(0, 9));
  return s;
}

export default function FlashNumber({ level, onFinish }: GameProps) {
  const lv = Math.min(Math.max(level, 1), DIGITS.length);
  const digits = DIGITS[lv - 1];
  const showMs = SHOW_MS[lv - 1];

  const [round, setRound] = useState(0);
  const [target, setTarget] = useState("");
  const [phase, setPhase] = useState<"show" | "input" | "result">("show");
  const [input, setInput] = useState("");
  const [correct, setCorrect] = useState(0);
  const [lastOk, setLastOk] = useState(false);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 出題の数字は乱数なのでレンダー中には作らず、マウント後に用意する
  useEffect(() => {
    setTarget(makeNumber(digits));
    startedAt.current = Date.now();
  }, [digits]);

  // 表示フェーズは一定時間で自動的に入力フェーズへ切り替わる
  useEffect(() => {
    if (phase !== "show" || !target) return;
    timer.current = setTimeout(() => setPhase("input"), showMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [phase, round, showMs, target]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function submit() {
    if (input.length === 0) return;
    const ok = input === target;
    const nextCorrect = correct + (ok ? 1 : 0);
    setLastOk(ok);
    setCorrect(nextCorrect);
    setPhase("result");

    timer.current = setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        onFinish({
          correct: nextCorrect,
          total: ROUNDS,
          timeMs: Date.now() - startedAt.current,
        });
        return;
      }
      setRound(round + 1);
      setTarget(makeNumber(digits));
      setInput("");
      setPhase("show");
    }, ok ? 700 : 1400);
  }

  if (!target) return <Preparing />;

  return (
    <div className="space-y-5">
      <RoundDots current={round} total={ROUNDS} />

      <div className="bg-card-bg border border-card-border rounded-3xl py-12 text-center shadow-sm min-h-[168px] flex flex-col items-center justify-center gap-2">
        {phase === "show" && (
          <>
            <p className="font-mono text-4xl font-bold tracking-[0.25em] text-foreground animate-fade-up">
              {target}
            </p>
            <p className="text-xs text-muted">覚えて！</p>
          </>
        )}
        {phase === "input" && (
          <>
            <p className="font-mono text-4xl font-bold tracking-[0.25em] text-accent-orange min-h-[3rem]">
              {input || "…"}
            </p>
            <p className="text-xs text-muted">{digits}桁を入力</p>
          </>
        )}
        {phase === "result" && (
          <>
            <p className={`text-5xl ${lastOk ? "text-accent-orange" : "text-danger"}`}>
              {lastOk ? "○" : "×"}
            </p>
            {!lastOk && (
              <p className="text-sm text-muted">
                正解は <span className="font-mono font-bold text-foreground">{target}</span>
              </p>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            disabled={phase !== "input" || input.length >= digits}
            onClick={() => setInput(input + n)}
            className="py-4 rounded-2xl border border-card-border bg-card-bg text-2xl font-bold shadow-sm active:scale-95 disabled:opacity-40 transition-transform"
          >
            {n}
          </button>
        ))}
        <button
          disabled={phase !== "input" || input.length === 0}
          onClick={() => setInput(input.slice(0, -1))}
          className="py-4 rounded-2xl border border-card-border bg-card-bg text-lg shadow-sm active:scale-95 disabled:opacity-40 transition-transform"
        >
          ⌫
        </button>
        <button
          disabled={phase !== "input" || input.length >= digits}
          onClick={() => setInput(input + "0")}
          className="py-4 rounded-2xl border border-card-border bg-card-bg text-2xl font-bold shadow-sm active:scale-95 disabled:opacity-40 transition-transform"
        >
          0
        </button>
        <button
          disabled={phase !== "input" || input.length === 0}
          onClick={submit}
          className="py-4 rounded-2xl bg-accent-orange text-white font-bold shadow-sm active:scale-95 disabled:opacity-40 transition-transform"
        >
          決定
        </button>
      </div>
    </div>
  );
}
