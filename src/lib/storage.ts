export interface UserProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM or ""
  birthPlace: string;
}

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mood: number; // 1-5 (1=低い, 5=最高)
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface GoalData {
  id: string;
  category: string;
  description: string;
  targetDate: string;
  status: "active" | "completed" | "paused";
  memo: string;
  createdAt: string;
  completedAt?: string;
}

export interface ManualReading {
  id: string;
  type: string; // "fourpillars" | "horoscope" | "sanmeigaku" | "other"
  label: string;
  data: Record<string, string>;
  memo: string;
  imageBase64?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppData {
  profile: UserProfile | null;
  diary: DiaryEntry[];
  goals: GoalData[];
  manualReadings: ManualReading[];
}

const STORAGE_KEY = "unmei-navi-data";

function getDefaultData(): AppData {
  return {
    profile: null,
    diary: [],
    goals: [],
    manualReadings: [],
  };
}

export function loadData(): AppData {
  if (typeof window === "undefined") return getDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    return { ...getDefaultData(), ...JSON.parse(raw) };
  } catch {
    return getDefaultData();
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadProfile(): UserProfile | null {
  return loadData().profile;
}

export function saveProfile(profile: UserProfile): void {
  const data = loadData();
  data.profile = profile;
  saveData(data);
}

// --- Goals ---

export function loadGoals(): GoalData[] {
  return loadData().goals.map((g) => ({
    ...g,
    id: g.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    status: g.status || "active",
    memo: g.memo || "",
  }));
}

export function saveGoal(goal: GoalData): void {
  const data = loadData();
  const idx = data.goals.findIndex((g) => g.id === goal.id);
  if (idx >= 0) {
    data.goals[idx] = goal;
  } else {
    data.goals.push(goal);
  }
  saveData(data);
}

export function deleteGoal(id: string): void {
  const data = loadData();
  data.goals = data.goals.filter((g) => g.id !== id);
  saveData(data);
}

// --- Diary ---

export function loadDiary(): DiaryEntry[] {
  return loadData().diary.map((d) => ({
    ...d,
    id: d.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    mood: d.mood || 3,
    tags: d.tags || [],
  }));
}

export function saveDiaryEntry(entry: DiaryEntry): void {
  const data = loadData();
  const idx = data.diary.findIndex((d) => d.id === entry.id);
  if (idx >= 0) {
    data.diary[idx] = entry;
  } else {
    data.diary.push(entry);
  }
  saveData(data);
}

export function deleteDiaryEntry(id: string): void {
  const data = loadData();
  data.diary = data.diary.filter((d) => d.id !== id);
  saveData(data);
}

// --- Manual Readings ---

export function loadReadings(): ManualReading[] {
  return loadData().manualReadings.map((r) => ({
    ...r,
    id: r.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    memo: r.memo || "",
  }));
}

export function saveReading(reading: ManualReading): void {
  const data = loadData();
  const idx = data.manualReadings.findIndex((r) => r.id === reading.id);
  if (idx >= 0) {
    data.manualReadings[idx] = reading;
  } else {
    data.manualReadings.push(reading);
  }
  saveData(data);
}

export function deleteReading(id: string): void {
  const data = loadData();
  data.manualReadings = data.manualReadings.filter((r) => r.id !== id);
  saveData(data);
}

export function exportData(): string {
  return JSON.stringify(loadData(), null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json) as AppData;
    if (!data || typeof data !== "object") return false;
    saveData({ ...getDefaultData(), ...data });
    return true;
  } catch {
    return false;
  }
}
