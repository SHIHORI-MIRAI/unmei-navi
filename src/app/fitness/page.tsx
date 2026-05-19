"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EXERCISES } from "@/lib/fitness/exercises";
import {
  countConsecutiveDays,
  loadFitness,
  todayStr,
  totalDays,
  type FitnessData,
} from "@/lib/fitness/storage";

export default function FitnessHome() {
  const [data, setData] = useState<FitnessData | null>(null);

  useEffect(() => {
    setData(loadFitness());
  }, []);

  const today = todayStr();
  const clearedToday = data?.clearedDates.includes(today) ?? false;
  const streak = data ? countConsecutiveDays(data) : 0;
  const total = data ? totalDays(data) : 0;

  return (
    <div className="bg-gradient-to-b from-sky-50 via-emerald-50 to-white flex-1 px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        <section
          className={`rounded-2xl p-5 shadow-md border ${
            clearedToday
              ? "bg-gradient-to-r from-emerald-400 to-teal-400 text-white border-transparent"
              : "bg-white border-emerald-100"
          }`}
        >
          {clearedToday ? (
            <>
              <p className="text-sm opacity-90">今日のクリア状況</p>
              <p className="text-2xl font-bold mt-1">✨ 今日のミッション達成！</p>
              <p className="text-sm mt-2 opacity-90">
                筋肉がほどけて、明日のあなたが軽く感じる準備中。
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-emerald-700">今日のチャレンジ</p>
              <p className="text-2xl font-bold mt-1 text-slate-800">
                3分から始めよう
              </p>
              <p className="text-sm mt-2 text-slate-600">
                好きなメニューを選んで、音楽に合わせて足を動かすだけ。
              </p>
            </>
          )}
          <div className="flex gap-4 mt-4">
            <div
              className={`flex-1 rounded-xl px-3 py-2 ${
                clearedToday ? "bg-white/20" : "bg-emerald-50"
              }`}
            >
              <p
                className={`text-xs ${
                  clearedToday ? "opacity-80" : "text-emerald-700"
                }`}
              >
                連続日数
              </p>
              <p className="text-xl font-bold">
                {streak}
                <span className="text-xs ml-1 font-normal">日</span>
              </p>
            </div>
            <div
              className={`flex-1 rounded-xl px-3 py-2 ${
                clearedToday ? "bg-white/20" : "bg-emerald-50"
              }`}
            >
              <p
                className={`text-xs ${
                  clearedToday ? "opacity-80" : "text-emerald-700"
                }`}
              >
                通算
              </p>
              <p className="text-xl font-bold">
                {total}
                <span className="text-xs ml-1 font-normal">日</span>
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            <span>🎵</span>メニューを選ぶ
          </h2>
          <div className="space-y-3">
            {EXERCISES.map((ex) => (
              <Link
                key={ex.id}
                href={`/fitness/play?exercise=${ex.id}`}
                className="block bg-white rounded-2xl p-4 border border-slate-200 hover:border-sky-400 hover:shadow-md transition active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl flex-shrink-0">{ex.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800">{ex.name}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {ex.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ex.muscles.map((m) => (
                        <span
                          key={m.name}
                          className="text-[10px] bg-sky-50 text-sky-700 rounded-full px-2 py-0.5 border border-sky-100"
                        >
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-sky-500 flex-shrink-0 self-center">▶</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-4 border border-slate-100">
          <p className="text-xs text-slate-500 leading-relaxed">
            💡 立てる場所と、軽くつかまれる椅子や壁の近くで始めてください。
            無理せず、痛みを感じたらすぐ休憩を。運動は健康のためのもので、
            体調や持病に応じて医師の指導も参考にしてください。
          </p>
        </section>
      </div>
    </div>
  );
}
