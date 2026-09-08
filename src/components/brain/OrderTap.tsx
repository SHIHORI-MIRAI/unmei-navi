"use client";

/**
 * 順番タッチ（スピード）
 * バラバラに並んだマスを、決まった順番にタップしていく。
 * レベル4以上は数字とひらがなが交互になり、切り替えの負荷が加わる。
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Preparing from "./Preparing";
import { shuffle, type GameProps } from "./types";

/** レベル別のマス数 */
const CELLS = [9, 12, 16, 20, 25];
const KANA = "あいうえおかきくけこさしすせそたちつてと".split("");

function buildLabels(level: number): string[] {
  const count = CELLS[Math.min(Math.max(level, 1), CELLS.length) - 1];
  if (level < 4) return Array.from({ length: count }, (_, i) => String(i + 1));
  // 1 → あ → 2 → い … と交互に並ぶ
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    labels.push(i % 2 === 0 ? String(i / 2 + 1) : KANA[(i - 1) / 2]);
  }
  return labels;
}

export default function OrderTap({ level, onFinish }: GameProps) {
  const labels = useMemo(() => buildLabels(level), [level]);
  const [cells, setCells] = useState<string[]>([]);
  const [next, setNext] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState<string | null>(null);
  const startedAt = useRef(0);

  // 並びは乱数なのでレンダー中には決めず、マウント後にシャッフルする
  useEffect(() => {
    setCells(shuffle(labels));
    startedAt.current = Date.now();
  }, [labels]);

  const cols = labels.length <= 9 ? 3 : labels.length <= 20 ? 4 : 5;

  function tap(label: string) {
    if (label === labels[next]) {
      const n = next + 1;
      setNext(n);
      if (n >= labels.length) {
        onFinish({
          correct: labels.length,
          total: labels.length + mistakes,
          // タップ操作の中でしか呼ばれないので、レンダーの純粋性は損なわない
          // eslint-disable-next-line react-hooks/purity
          timeMs: Date.now() - startedAt.current,
        });
      }
    } else {
      setMistakes((m) => m + 1);
      setShake(label);
      setTimeout(() => setShake(null), 300);
    }
  }

  const done = new Set(labels.slice(0, next));
  if (cells.length === 0) return <Preparing />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-4 text-sm">
        <span className="text-muted">
          つぎは <span className="text-accent-orange font-bold text-lg">{labels[next] ?? "🎉"}</span>
        </span>
        <span className="text-muted">
          ミス <span className="text-danger font-bold">{mistakes}</span>
        </span>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cells.map((label) => {
          const isDone = done.has(label);
          return (
            <button
              key={label}
              onClick={() => tap(label)}
              disabled={isDone}
              className={`aspect-square rounded-2xl border text-xl font-bold shadow-sm transition-all ${
                isDone
                  ? "border-card-border bg-card-border/40 text-muted/40"
                  : "border-card-border bg-card-bg text-foreground active:scale-95 hover:border-accent-gold"
              } ${shake === label ? "border-danger text-danger" : ""}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted">
        {next} / {labels.length} タッチ済み
      </p>
    </div>
  );
}
