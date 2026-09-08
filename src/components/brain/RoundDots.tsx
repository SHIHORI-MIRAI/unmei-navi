"use client";

/** 何問目かを示す小さなドット列。全ゲーム共通の進捗表示 */
export default function RoundDots({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < current
              ? "w-5 bg-accent-orange"
              : i === current
                ? "w-5 bg-accent-gold/60"
                : "w-1.5 bg-card-border"
          }`}
        />
      ))}
    </div>
  );
}
