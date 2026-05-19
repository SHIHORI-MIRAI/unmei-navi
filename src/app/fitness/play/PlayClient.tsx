"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EXERCISES, getExercise, type ExerciseId } from "@/lib/fitness/exercises";
import { FitnessAudio } from "@/lib/fitness/audio";
import { saveSession, todayStr } from "@/lib/fitness/storage";

type Phase = "ready" | "countdown" | "playing" | "done";
type Judgment = "perfect" | "good" | "miss";

interface Note {
  id: number;
  lane: 0 | 1;
  hitAudioTime: number; // AudioContext 上の予定時刻
  spawnedAt: number; // performance.now() の値
  status: "pending" | "hit" | "missed";
  judgment?: Judgment;
}

const BPM = 100;
const BEAT_INTERVAL = 60 / BPM;
const TRAVEL_BEATS = 2; // 何拍ぶん前に画面に出すか
const TRAVEL_SEC = BEAT_INTERVAL * TRAVEL_BEATS;
const PERFECT_WINDOW = 0.09;
const GOOD_WINDOW = 0.2;
const SESSION_SEC = 90;

export default function PlayClient() {
  const params = useSearchParams();
  const router = useRouter();
  const initialId =
    (params.get("exercise") as ExerciseId | null) ?? EXERCISES[0].id;
  const exercise = getExercise(initialId) ?? EXERCISES[0];

  const [phase, setPhase] = useState<Phase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [perfects, setPerfects] = useState(0);
  const [misses, setMisses] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SESSION_SEC);
  const [lastJudgment, setLastJudgment] = useState<{
    text: string;
    color: string;
    key: number;
  } | null>(null);
  const [pulseLane, setPulseLane] = useState<0 | 1 | null>(null);

  const audioRef = useRef<FitnessAudio | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtAudio = useRef<number>(0);
  const startedAtIso = useRef<string>("");
  const nextNoteId = useRef(1);
  const notesRef = useRef<Note[]>([]);
  const finishedRef = useRef(false);

  // notes の参照を常に最新に保つ（rAF の中でも使える）
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // クリーンアップ：ページ離脱時に音を止める
  useEffect(() => {
    return () => {
      audioRef.current?.destroy();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  async function handleStart() {
    const audio = new FitnessAudio();
    await audio.ensureStarted();
    audioRef.current = audio;
    setPhase("countdown");
    let c = 3;
    setCountdown(c);
    const tick = window.setInterval(() => {
      c -= 1;
      if (c > 0) {
        setCountdown(c);
      } else {
        window.clearInterval(tick);
        startPlaying();
      }
    }, 700);
  }

  function startPlaying() {
    if (!audioRef.current) return;
    setPhase("playing");
    finishedRef.current = false;
    setTimeLeft(SESSION_SEC);
    setNotes([]);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHits(0);
    setPerfects(0);
    setMisses(0);
    setTotalNotes(0);
    nextNoteId.current = 1;

    startedAtIso.current = new Date().toISOString();
    audioRef.current.startBeat(BPM, (beatIndex, scheduledAudioTime) => {
      // 1 拍目の onBeat で startedAtAudio を確定する
      if (beatIndex === 0) {
        startedAtAudio.current = scheduledAudioTime;
      }
      // 残り時間を計算
      const elapsedAudio = scheduledAudioTime - startedAtAudio.current;
      if (elapsedAudio >= SESSION_SEC) {
        finishSession();
        return;
      }
      // この拍はノートのターゲット時刻になる
      const lane: 0 | 1 = (beatIndex % 2) as 0 | 1;
      const note: Note = {
        id: nextNoteId.current++,
        lane,
        hitAudioTime: scheduledAudioTime + TRAVEL_SEC,
        spawnedAt: performance.now(),
        status: "pending",
      };
      setNotes((prev) => [...prev, note]);
      setTotalNotes((n) => n + 1);
    });

    // 経過秒の表示用 rAF
    rafRef.current = requestAnimationFrame(loop);
  }

  function loop() {
    if (finishedRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    const now = audio.currentAudioTime();
    // 残り時間の計算（オーディオ基準）
    if (startedAtAudio.current > 0) {
      const remaining = Math.max(
        0,
        SESSION_SEC - (now - startedAtAudio.current)
      );
      setTimeLeft(remaining);
      if (remaining <= 0) {
        finishSession();
        return;
      }
    }

    // ミス判定と古いノートのクリーンアップを 1 パスで
    let newMisses = 0;
    let changed = false;
    const next = notesRef.current
      .map((n) => {
        if (n.status === "pending" && now > n.hitAudioTime + GOOD_WINDOW) {
          newMisses++;
          changed = true;
          return { ...n, status: "missed" as const, judgment: "miss" as const };
        }
        return n;
      })
      .filter((n) => {
        const keep = now < n.hitAudioTime + 0.6;
        if (!keep) changed = true;
        return keep;
      });

    if (changed) {
      notesRef.current = next; // 同フレーム内の二重判定を防ぐため同期更新
      setNotes(next);
    }
    if (newMisses > 0) {
      setMisses((m) => m + newMisses);
      setCombo(0);
      audio.playMiss();
      flash("MISS", "text-rose-400");
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  function handleLaneTap(lane: 0 | 1) {
    if (phase !== "playing") return;
    const audio = audioRef.current;
    if (!audio) return;
    const now = audio.currentAudioTime();
    if (startedAtAudio.current === 0) return;

    // 同じレーンの pending ノートのうち、now に最も近いものを探す
    let closestIdx = -1;
    let closestDelta = Infinity;
    notesRef.current.forEach((n, i) => {
      if (n.lane !== lane || n.status !== "pending") return;
      const delta = Math.abs(n.hitAudioTime - now);
      if (delta < closestDelta) {
        closestDelta = delta;
        closestIdx = i;
      }
    });

    setPulseLane(lane);
    window.setTimeout(() => setPulseLane(null), 120);

    if (closestIdx === -1 || closestDelta > GOOD_WINDOW) {
      // 空打ち：コンボだけ折る
      setCombo(0);
      audio.playMiss();
      flash("…", "text-slate-400");
      return;
    }

    const judgment: Judgment =
      closestDelta <= PERFECT_WINDOW ? "perfect" : "good";
    const next = [...notesRef.current];
    next[closestIdx] = { ...next[closestIdx], status: "hit", judgment };
    notesRef.current = next; // 次フレームのループで pending と誤認しないように
    setNotes(next);

    if (judgment === "perfect") {
      setScore((s) => s + 200);
      setPerfects((p) => p + 1);
      flash("PERFECT!", "text-amber-300");
    } else {
      setScore((s) => s + 100);
      flash("GOOD", "text-emerald-300");
    }
    setHits((h) => h + 1);
    setCombo((c) => {
      const nc = c + 1;
      setMaxCombo((mx) => Math.max(mx, nc));
      return nc;
    });
    audio.playCoin();
  }

  function flash(text: string, color: string) {
    setLastJudgment({ text, color, key: Date.now() });
  }

  function finishSession() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const audio = audioRef.current;
    audio?.stop();
    audio?.playFanfare();
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    // 状態をフリーズして保存
    const session = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      exerciseId: exercise.id,
      date: todayStr(),
      startedAt: startedAtIso.current,
      durationSec: SESSION_SEC,
      totalNotes: totalNotesRef(),
      hits: hitsRef(),
      perfects: perfectsRef(),
      misses: missesRef(),
      maxCombo: maxComboRef(),
      score: scoreRef(),
    };
    saveSession(session);
    // 少し見せてから結果へ
    window.setTimeout(() => {
      router.push(`/fitness/result?session=${session.id}&exercise=${exercise.id}`);
    }, 1500);
    setPhase("done");
  }

  // 最新値を取るために state を直接読む必要がある。useRef でミラーする
  const scoreR = useRef(0);
  const hitsR = useRef(0);
  const perfR = useRef(0);
  const missR = useRef(0);
  const totalR = useRef(0);
  const maxComboR = useRef(0);
  useEffect(() => { scoreR.current = score; }, [score]);
  useEffect(() => { hitsR.current = hits; }, [hits]);
  useEffect(() => { perfR.current = perfects; }, [perfects]);
  useEffect(() => { missR.current = misses; }, [misses]);
  useEffect(() => { totalR.current = totalNotes; }, [totalNotes]);
  useEffect(() => { maxComboR.current = maxCombo; }, [maxCombo]);
  function scoreRef() { return scoreR.current; }
  function hitsRef() { return hitsR.current; }
  function perfectsRef() { return perfR.current; }
  function missesRef() { return missR.current; }
  function totalNotesRef() { return totalR.current; }
  function maxComboRef() { return maxComboR.current; }

  const accuracy = useMemo(() => {
    if (totalNotes === 0) return 0;
    return Math.round((hits / totalNotes) * 100);
  }, [hits, totalNotes]);

  // ===== レンダリング =====
  if (phase === "ready") {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-900 via-indigo-900 to-slate-900 text-white">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="text-6xl">{exercise.emoji}</div>
          <h1 className="text-2xl font-bold">{exercise.name}</h1>
          <p className="text-sm opacity-80 leading-relaxed max-w-xs">
            {exercise.description}
          </p>
          <div className="bg-white/10 rounded-2xl p-4 max-w-xs text-left space-y-2">
            <p className="text-xs text-emerald-300 font-semibold">やり方</p>
            <p className="text-sm leading-relaxed">{exercise.motion}</p>
            <p className="text-xs text-emerald-300 font-semibold mt-2">時間</p>
            <p className="text-sm">{SESSION_SEC}秒の1セッション</p>
          </div>
          <button
            onClick={handleStart}
            className="w-full max-w-xs bg-gradient-to-r from-emerald-400 to-sky-400 text-slate-900 font-bold rounded-full py-4 text-lg shadow-xl hover:shadow-2xl active:scale-95 transition"
          >
            ▶ スタート
          </button>
          <Link href="/fitness" className="text-xs opacity-70 hover:opacity-100">
            ← メニューに戻る
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-900 to-indigo-900 text-white">
        <div className="text-[10rem] font-bold animate-pulse">{countdown}</div>
      </div>
    );
  }

  // playing / done
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden">
      {/* 上部 HUD */}
      <div className="flex justify-between items-center px-4 py-3 text-sm bg-black/30 backdrop-blur-sm">
        <div>
          <p className="text-xs opacity-70">スコア</p>
          <p className="font-bold text-xl tabular-nums">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-xs opacity-70">COMBO</p>
          <p className="font-bold text-xl text-amber-300 tabular-nums">
            {combo}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-70">残り</p>
          <p className="font-bold text-xl tabular-nums">
            {Math.ceil(timeLeft)}s
          </p>
        </div>
      </div>

      {/* ゲームフィールド */}
      <div className="flex-1 grid grid-cols-2 relative">
        {([0, 1] as const).map((lane) => (
          <button
            key={lane}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              handleLaneTap(lane);
            }}
            className={`relative h-full border-x border-white/10 transition-colors ${
              pulseLane === lane ? "bg-white/15" : "bg-transparent"
            }`}
            aria-label={`${exercise.laneLabels[lane]}をタップ`}
          >
            <span className="absolute top-3 left-1/2 -translate-x-1/2 text-xs opacity-60 pointer-events-none">
              {exercise.laneLabels[lane]}
            </span>
          </button>
        ))}

        {/* ヒットライン */}
        <div className="absolute left-0 right-0 bottom-20 h-16 border-y-2 border-white/30 bg-white/5 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-around">
            <div className="text-xs opacity-50">ここで TAP!</div>
            <div className="text-xs opacity-50">ここで TAP!</div>
          </div>
        </div>

        {/* ノーツ */}
        {notes.map((n) => (
          <NoteView key={n.id} note={n} laneLabel={exercise.laneLabels[n.lane]} />
        ))}

        {/* 判定テキスト */}
        {lastJudgment && (
          <div
            key={lastJudgment.key}
            className={`absolute top-1/3 left-0 right-0 text-center text-3xl font-bold pointer-events-none ${lastJudgment.color} animate-judgment`}
          >
            {lastJudgment.text}
          </div>
        )}

        {phase === "done" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-center pointer-events-none">
            <div>
              <p className="text-2xl font-bold">✨ おつかれさま！</p>
              <p className="text-sm opacity-80 mt-2">結果を集計しています…</p>
            </div>
          </div>
        )}
      </div>

      {/* 下部ステータスバー */}
      <div className="px-4 py-2 bg-black/30 text-xs flex justify-around">
        <span>
          ヒット <span className="text-emerald-300 font-bold">{hits}</span>
        </span>
        <span>
          パーフェクト{" "}
          <span className="text-amber-300 font-bold">{perfects}</span>
        </span>
        <span>
          ミス <span className="text-rose-300 font-bold">{misses}</span>
        </span>
        <span>
          命中率 <span className="font-bold">{accuracy}%</span>
        </span>
      </div>
    </div>
  );
}

function NoteView({ note, laneLabel }: { note: Note; laneLabel: string }) {
  // ノートは hitAudioTime に向かって落下する。位置は壁時計ベースで近似計算
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    function update() {
      // spawnedAt は performance.now()。経過秒 / TRAVEL_SEC が 1 で到達
      const elapsed = (performance.now() - note.spawnedAt) / 1000;
      setProgress(Math.min(1.2, elapsed / TRAVEL_SEC));
      if (note.status === "pending" && elapsed < TRAVEL_SEC + 0.6) {
        raf = requestAnimationFrame(update);
      }
    }
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [note.spawnedAt, note.status]);

  const topPct = 5 + progress * 80; // 5% から 85% (ヒットライン位置) まで
  const left = note.lane === 0 ? "calc(25% - 28px)" : "calc(75% - 28px)";

  if (note.status === "hit") {
    return (
      <div
        className="absolute w-14 h-14 rounded-full bg-amber-300 shadow-[0_0_30px_8px_rgba(252,211,77,0.7)] pointer-events-none animate-ping"
        style={{ top: `${topPct}%`, left }}
      />
    );
  }

  const colorClass =
    note.status === "missed"
      ? "bg-rose-500/40 border-rose-300"
      : note.lane === 0
      ? "bg-gradient-to-br from-sky-400 to-blue-500 border-sky-200"
      : "bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-200";

  return (
    <div
      className={`absolute w-14 h-14 rounded-full border-2 shadow-lg flex items-center justify-center text-[10px] text-white font-bold pointer-events-none ${colorClass}`}
      style={{ top: `${topPct}%`, left }}
    >
      {laneLabel.slice(0, 2)}
    </div>
  );
}
