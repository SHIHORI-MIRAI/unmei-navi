export type ProfileCategory = "self" | "family" | "student";
export type Gender = "male" | "female" | "other";

export interface UserProfile {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM or ""
  birthPlace: string;
  category?: ProfileCategory; // 未設定は "self" として扱う
  gender?: Gender; // 結婚相談所など男女クロス相性で使用、任意
  note?: string; // 受講生メモ（進捗・面談メモなど）
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
  profiles: UserProfile[];
  activeProfileId: string;
  diary: DiaryEntry[];
  goals: GoalData[];
  manualReadings: ManualReading[];
}

const STORAGE_KEY = "unmei-navi-data";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getDefaultData(): AppData {
  return {
    profile: null,
    profiles: [],
    activeProfileId: "",
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
    const data = { ...getDefaultData(), ...JSON.parse(raw) };

    // 旧形式からの移行: profileがあるがprofilesが空の場合
    if (data.profile && data.profiles.length === 0) {
      const migrated: UserProfile = {
        ...data.profile,
        id: data.profile.id || generateId(),
      };
      data.profiles = [migrated];
      data.activeProfileId = migrated.id;
      data.profile = migrated;
    }

    return data;
  } catch {
    return getDefaultData();
  }
}

/** localStorage への書き込みは容量超過でサイレント失敗するため必ず try/catch する */
export function saveData(data: AppData): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("[storage] saveData failed:", e);
    return false;
  }
}

/** localStorage の使用容量を計測（単位: バイト）。ブラウザ実装上限は約5MB */
export function getStorageUsage(): { used: number; limit: number; ratio: number } {
  const limit = 5 * 1024 * 1024;
  if (typeof window === "undefined") return { used: 0, limit, ratio: 0 };
  let used = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key) ?? "";
    used += (key.length + value.length) * 2;
  }
  return { used, limit, ratio: used / limit };
}

// --- Profiles (複数プロフィール管理) ---

export function loadProfiles(): UserProfile[] {
  return loadData().profiles;
}

export function loadStudents(): UserProfile[] {
  return loadProfiles().filter((p) => p.category === "student");
}

export function getProfileCategory(p: UserProfile): ProfileCategory {
  return p.category ?? "self";
}

export function loadProfileById(id: string): UserProfile | null {
  return loadProfiles().find((p) => p.id === id) ?? null;
}

export function loadProfile(): UserProfile | null {
  const data = loadData();
  if (data.profiles.length === 0) return null;
  // activeProfileIdに一致するプロフィールを返す
  const active = data.profiles.find((p) => p.id === data.activeProfileId);
  return active || data.profiles[0];
}

export function getActiveProfileId(): string {
  return loadData().activeProfileId;
}

/**
 * 既存プロフィール編集時は activeProfileId を変更しない（家族の編集中にアクティブが切り替わる
 * 副作用を防ぐ）。新規追加時のみアクティブにする。
 */
export function saveProfile(profile: UserProfile): boolean {
  const data = loadData();
  if (!profile.id) {
    profile.id = generateId();
  }

  const idx = data.profiles.findIndex((p) => p.id === profile.id);
  const isNew = idx < 0;
  if (idx >= 0) {
    data.profiles[idx] = profile;
  } else {
    data.profiles.push(profile);
  }

  if (isNew || data.activeProfileId === profile.id || !data.activeProfileId) {
    data.activeProfileId = profile.id;
    data.profile = profile;
  }

  return saveData(data);
}

export function switchProfile(profileId: string): void {
  const data = loadData();
  const target = data.profiles.find((p) => p.id === profileId);
  if (target) {
    data.activeProfileId = profileId;
    data.profile = target;
    saveData(data);
  }
}

export function deleteProfile(profileId: string): void {
  const data = loadData();
  data.profiles = data.profiles.filter((p) => p.id !== profileId);
  // 削除したのがアクティブだった場合、先頭に切り替え
  if (data.activeProfileId === profileId) {
    if (data.profiles.length > 0) {
      data.activeProfileId = data.profiles[0].id;
      data.profile = data.profiles[0];
    } else {
      data.activeProfileId = "";
      data.profile = null;
    }
  }
  saveData(data);
}

// --- Goals ---

export function loadGoals(): GoalData[] {
  return loadData().goals.map((g) => ({
    ...g,
    id: g.id || generateId(),
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
    id: d.id || generateId(),
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
    id: r.id || generateId(),
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

const LAST_EXPORT_KEY = "unmei-navi-last-export";

export function markExported(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_EXPORT_KEY, new Date().toISOString());
}

export function getLastExportDate(): Date | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LAST_EXPORT_KEY);
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export function getDataSummary(): {
  profileCount: number;
  diaryCount: number;
  goalCount: number;
  readingCount: number;
} {
  const data = loadData();
  return {
    profileCount: data.profiles.length,
    diaryCount: data.diary.length,
    goalCount: data.goals.length,
    readingCount: data.manualReadings.length,
  };
}

export function exportData(): string {
  return JSON.stringify(loadData(), null, 2);
}

/**
 * インポートデータを検証して取り込む。型チェックが緩いと不正JSONで全件破壊される
 * ため、各フィールドが期待通りの型かを必ず確認する。
 */
export function importData(json: string): boolean {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    const obj = parsed as Record<string, unknown>;

    const profiles = Array.isArray(obj.profiles)
      ? (obj.profiles.filter(
          (p) =>
            p &&
            typeof p === "object" &&
            typeof (p as UserProfile).birthDate === "string"
        ) as UserProfile[])
      : [];
    const diary = Array.isArray(obj.diary)
      ? (obj.diary.filter(
          (d) => d && typeof d === "object" && typeof (d as DiaryEntry).date === "string"
        ) as DiaryEntry[])
      : [];
    const goals = Array.isArray(obj.goals)
      ? (obj.goals.filter((g) => g && typeof g === "object") as GoalData[])
      : [];
    const manualReadings = Array.isArray(obj.manualReadings)
      ? (obj.manualReadings.filter(
          (r) => r && typeof r === "object"
        ) as ManualReading[])
      : [];

    if (profiles.length === 0 && diary.length === 0 && goals.length === 0 && manualReadings.length === 0) {
      return false;
    }

    const activeProfileId =
      typeof obj.activeProfileId === "string" && profiles.some((p) => p.id === obj.activeProfileId)
        ? (obj.activeProfileId as string)
        : profiles[0]?.id ?? "";

    const next: AppData = {
      profile: profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null,
      profiles,
      activeProfileId,
      diary,
      goals,
      manualReadings,
    };
    return saveData(next);
  } catch {
    return false;
  }
}

/**
 * 書き込み直後に再ロードして件数が期待通りか検証する。
 * 容量逼迫やブラウザのストレージ無効化で「保存できたつもり」になる事故を検知。
 */
export function verifyWrite(expected: {
  profiles: number;
  diary: number;
  goals: number;
  readings: number;
}): boolean {
  if (typeof window === "undefined") return true;
  const actual = loadData();
  return (
    actual.profiles.length === expected.profiles &&
    actual.diary.length === expected.diary &&
    actual.goals.length === expected.goals &&
    actual.manualReadings.length === expected.readings
  );
}
