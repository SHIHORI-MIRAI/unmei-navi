"use client";

/**
 * 記憶めくり（記憶力）
 * 同じ絵をペアでそろえる。手数（めくった回数）が少ないほど高得点。
 */

import { useEffect, useRef, useState } from "react";
import Preparing from "./Preparing";
import { shuffle, type GameProps } from "./types";

const EMOJIS = ["🍎", "🍋", "🍇", "🌸", "🐤", "🐧", "⭐", "🌙", "🍀", "🐳", "🎈", "🍩"];

/** レベル別のペア数 */
const PAIRS = [3, 4, 6, 8, 10];

interface Card {
  key: number;
  emoji: string;
  matched: boolean;
}

function buildCards(pairs: number): Card[] {
  const chosen = shuffle(EMOJIS).slice(0, pairs);
  const deck = shuffle([...chosen, ...chosen]);
  return deck.map((emoji, i) => ({ key: i, emoji, matched: false }));
}

export default function MemoryFlip({ level, onFinish }: GameProps) {
  const pairs = PAIRS[Math.min(Math.max(level, 1), PAIRS.length) - 1];
  const [cards, setCards] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 山札は乱数で並べるのでレンダー中には作らず、マウント後に配る
  useEffect(() => {
    setCards(buildCards(pairs));
    startedAt.current = Date.now();
  }, [pairs]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const cols = pairs <= 3 ? 3 : 4;

  function flip(key: number) {
    if (locked) return;
    const card = cards.find((c) => c.key === key);
    if (!card || card.matched || open.includes(key)) return;

    const nextOpen = [...open, key];
    setOpen(nextOpen);
    if (nextOpen.length < 2) return;

    const nextMoves = moves + 1;
    setMoves(nextMoves);
    setLocked(true);

    const [a, b] = nextOpen.map((k) => cards.find((c) => c.key === k)!);
    if (a.emoji === b.emoji) {
      timer.current = setTimeout(() => {
        const updated = cards.map((c) =>
          nextOpen.includes(c.key) ? { ...c, matched: true } : c
        );
        setCards(updated);
        setOpen([]);
        setLocked(false);
        if (updated.every((c) => c.matched)) {
          onFinish({
            correct: pairs,
            total: nextMoves,
            timeMs: Date.now() - startedAt.current,
          });
        }
      }, 420);
    } else {
      timer.current = setTimeout(() => {
        setOpen([]);
        setLocked(false);
      }, 780);
    }
  }

  const matched = cards.filter((c) => c.matched).length / 2;
  if (cards.length === 0) return <Preparing />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-4 text-sm">
        <span className="text-muted">
          そろった <span className="text-accent-orange font-bold">{matched}</span> / {pairs}
        </span>
        <span className="text-muted">
          手数 <span className="text-accent-gold font-bold">{moves}</span>
        </span>
      </div>

      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cards.map((c) => {
          const faceUp = c.matched || open.includes(c.key);
          return (
            <button
              key={c.key}
              onClick={() => flip(c.key)}
              disabled={faceUp}
              className={`aspect-square rounded-2xl border flex items-center justify-center text-3xl shadow-sm transition-all duration-200 ${
                c.matched
                  ? "border-accent-gold/50 bg-accent-gold/10 opacity-70"
                  : faceUp
                    ? "border-accent-orange/50 bg-card-bg"
                    : "border-card-border bg-gradient-to-br from-accent-gold/25 to-accent-orange/15 active:scale-95"
              }`}
            >
              {faceUp ? c.emoji : <span className="text-accent-gold/70 text-xl">✦</span>}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted">
        めくる回数が少ないほど高得点。じっくり位置を覚えましょう。
      </p>
    </div>
  );
}
