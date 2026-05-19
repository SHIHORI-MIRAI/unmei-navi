"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getExercise, type ExerciseId } from "@/lib/fitness/exercises";
import {
  countConsecutiveDays,
  loadFitness,
  sessionsByExercise,
  totalDays,
  type FitnessData,
  type WorkoutSession,
} from "@/lib/fitness/storage";

export default function ResultClient() {
  const params = useSearchParams();
  const sessionId = params.get("session") ?? "";
  const exerciseId = (params.get("exercise") as ExerciseId | null) ?? "knee-up";
  const exercise = getExercise(exerciseId);

  const [data, setData] = useState<FitnessData | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    const d = loadFitness();
    setData(d);
    setSession(d.sessions.find((s) => s.id === sessionId) ?? null);
  }, [sessionId]);

  if (!exercise) {
    return (
      <div className="p-8 text-center">
        <p>メニューが見つかりませんでした。</p>
        <Link href="/fitness" className="underline text-sky-600">
          ホームに戻る
        </Link>
      </div>
    );
  }

  if (!session || !data) {
    return <div className="p-8 text-center">読み込み中…</div>;
  }

  const streak = countConsecutiveDays(data);
  const total = totalDays(data);
  const exerciseTotal = sessionsByExercise(data, exerciseId).length;
  const accuracy =
    session.totalNotes > 0
      ? Math.round((session.hits / session.totalNotes) * 100)
      : 0;
  const grade = gradeFrom(accuracy);

  // 達成済み日数で開放される希望メッセージ
  const unlocked = exercise.benefits.filter((b) => b.afterDays <= total);
  const next = exercise.benefits.find((b) => b.afterDays > total);
  const todaysMessage = unlocked[unlocked.length - 1] ?? exercise.benefits[0];

  return (
    <div className="flex-1 bg-gradient-to-b from-emerald-50 via-sky-50 to-white py-6 px-4">
      <div className="max-w-md mx-auto space-y-5">
        {/* 結果カード */}
        <section className="bg-gradient-to-br from-emerald-400 to-sky-500 text-white rounded-3xl p-6 shadow-xl text-center">
          <p className="text-sm opacity-90">{exercise.name} クリア！</p>
          <p className={`text-7xl font-black mt-2 ${grade.color}`}>
            {grade.label}
          </p>
          <p className="text-sm mt-2 opacity-90">
            命中率 {accuracy}% · スコア {session.score}
          </p>
        </section>

        {/* 統計 */}
        <section className="grid grid-cols-2 gap-3">
          <Stat label="パーフェクト" value={session.perfects} unit="回" highlight />
          <Stat label="最大コンボ" value={session.maxCombo} unit="連続" />
          <Stat label="連続日数" value={streak} unit="日" />
          <Stat label="このメニュー" value={exerciseTotal} unit="回目" />
        </section>

        {/* 今日の希望メッセージ */}
        <section className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
          <p className="text-xs text-emerald-700 font-semibold">
            🌱 {total}日目のあなたへ
          </p>
          <p className="text-lg font-bold text-slate-800 mt-1">
            {todaysMessage.title}
          </p>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {todaysMessage.body}
          </p>
          {next && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                次のマイルストーン：あと {next.afterDays - total} 日で
              </p>
              <p className="text-sm font-semibold text-sky-700 mt-0.5">
                「{next.title}」が解放されます
              </p>
            </div>
          )}
        </section>

        {/* 鍛えた筋肉 */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold mb-3">
            💪 今日効いた筋肉
          </p>
          <ul className="space-y-3">
            {exercise.muscles.map((m) => (
              <li
                key={m.name}
                className="flex items-start gap-3 bg-slate-50 rounded-xl p-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {m.effect}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <div className="space-y-3 pt-2">
          <Link
            href={`/fitness/play?exercise=${exerciseId}`}
            className="block text-center bg-gradient-to-r from-emerald-400 to-sky-400 text-slate-900 font-bold rounded-full py-4 shadow-lg active:scale-95 transition"
          >
            🔁 もう1セッション
          </Link>
          <Link
            href="/fitness"
            className="block text-center bg-white text-slate-700 font-semibold rounded-full py-3 border border-slate-200"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-3 border ${
        highlight
          ? "bg-amber-50 border-amber-200"
          : "bg-white border-slate-200"
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800 tabular-nums">
        {value}
        <span className="text-xs font-normal text-slate-500 ml-1">{unit}</span>
      </p>
    </div>
  );
}

function gradeFrom(accuracy: number): { label: string; color: string } {
  if (accuracy >= 95) return { label: "S", color: "text-amber-200" };
  if (accuracy >= 85) return { label: "A", color: "text-yellow-100" };
  if (accuracy >= 70) return { label: "B", color: "text-white" };
  if (accuracy >= 50) return { label: "C", color: "text-white/90" };
  return { label: "D", color: "text-white/80" };
}
