import type { ExerciseId } from "./exercises";

/**
 * フィットネスのワークアウト履歴は localStorage 専用のキーで保存する。
 * 占いアプリ側 (unmei-navi-data) と独立させて、互いの破損リスクをゼロにする
 */
export interface WorkoutSession {
  id: string;
  exerciseId: ExerciseId;
  date: string; // YYYY-MM-DD
  startedAt: string; // ISO
  durationSec: number;
  totalNotes: number;
  hits: number;
  perfects: number;
  misses: number;
  maxCombo: number;
  score: number;
}

export interface FitnessData {
  sessions: WorkoutSession[];
  /** 今日の達成済み (YYYY-MM-DD) */
  clearedDates: string[];
}

const STORAGE_KEY = "unmei-navi-fitness";

function getDefault(): FitnessData {
  return { sessions: [], clearedDates: [] };
}

export function loadFitness(): FitnessData {
  if (typeof window === "undefined") return getDefault();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefault();
    const parsed = JSON.parse(raw) as Partial<FitnessData>;
    return {
      sessions: parsed.sessions ?? [],
      clearedDates: parsed.clearedDates ?? [],
    };
  } catch {
    return getDefault();
  }
}

function save(data: FitnessData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveSession(session: WorkoutSession): void {
  const data = loadFitness();
  data.sessions.push(session);
  if (!data.clearedDates.includes(session.date)) {
    data.clearedDates.push(session.date);
  }
  save(data);
}

export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function countConsecutiveDays(data: FitnessData): number {
  if (data.clearedDates.length === 0) return 0;
  const set = new Set(data.clearedDates);
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    if (!set.has(`${y}-${m}-${day}`)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function totalDays(data: FitnessData): number {
  return data.clearedDates.length;
}

export function sessionsByExercise(
  data: FitnessData,
  exerciseId: ExerciseId
): WorkoutSession[] {
  return data.sessions.filter((s) => s.exerciseId === exerciseId);
}
