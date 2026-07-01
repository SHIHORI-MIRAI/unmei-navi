export type ProfileCategory = "self" | "family" | "student" | "client";
export type Gender = "male" | "female" | "other";

/** 種別ごとの表示ラベル。結婚相談所など業務利用時の文脈にあわせて使う */
export const CATEGORY_LABEL: Record<ProfileCategory, string> = {
  self: "自分",
  family: "家族",
  student: "受講生",
  client: "顧客",
};

export function getProfileCategoryLabel(p: UserProfile): string {
  return CATEGORY_LABEL[p.category ?? "self"];
}

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

/** 人生の棚卸し：出来事1件（人生の年表用） */
export interface LifeEvent {
  id: string;
  year: number; // 出来事の年（必須）
  month?: number; // 月（任意 1-12）
  title: string;
  category: string; // 転機/仕事/家族/人間関係/健康/学び/内的気づき/その他
  magnitude: number; // 1=小さな気づき, 2=中くらい, 3=人生の節目
  emotion: number; // 当時の感情 1-5（ありのまま）
  learning: string; // そこで得た気づき・学び
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

export interface OracleDraw {
  id: string;
  date: string; // YYYY-MM-DD
  cardId: number; // OracleCard.id
  mode: "today" | "random"; // 今日の1枚 / シャッフル引き
  createdAt: string;
}

export interface AppData {
  profile: UserProfile | null;
  profiles: UserProfile[];
  activeProfileId: string;
  diary: DiaryEntry[];
  goals: GoalData[];
  manualReadings: ManualReading[];
  oracleDraws: OracleDraw[];
  lifeEvents: LifeEvent[];
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
    oracleDraws: [],
    lifeEvents: [],
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

export function loadClients(): UserProfile[] {
  return loadProfiles().filter((p) => p.category === "client");
}

/** 受講生・顧客など、管理対象として登録された人を返す */
export function loadManaged(): UserProfile[] {
  return loadProfiles().filter(
    (p) => p.category === "student" || p.category === "client"
  );
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

// --- Oracle Draws ---

export function loadOracleDraws(): OracleDraw[] {
  return loadData().oracleDraws.map((o) => ({
    ...o,
    id: o.id || generateId(),
    mode: o.mode || "random",
  }));
}

export function saveOracleDraw(draw: OracleDraw): void {
  const data = loadData();
  const idx = data.oracleDraws.findIndex((o) => o.id === draw.id);
  if (idx >= 0) {
    data.oracleDraws[idx] = draw;
  } else {
    data.oracleDraws.push(draw);
  }
  saveData(data);
}

export function deleteOracleDraw(id: string): void {
  const data = loadData();
  data.oracleDraws = data.oracleDraws.filter((o) => o.id !== id);
  saveData(data);
}

// --- Life Events (人生の棚卸し) ---

export function loadLifeEvents(): LifeEvent[] {
  return loadData().lifeEvents.map((e) => ({
    ...e,
    id: e.id || generateId(),
    magnitude: e.magnitude || 2,
    emotion: e.emotion || 3,
    learning: e.learning || "",
  }));
}

export function saveLifeEvent(event: LifeEvent): void {
  const data = loadData();
  const idx = data.lifeEvents.findIndex((e) => e.id === event.id);
  if (idx >= 0) {
    data.lifeEvents[idx] = event;
  } else {
    data.lifeEvents.push(event);
  }
  saveData(data);
}

export function deleteLifeEvent(id: string): void {
  const data = loadData();
  data.lifeEvents = data.lifeEvents.filter((e) => e.id !== id);
  saveData(data);
}

// --- Life Reading (AIによる人生の読み解き。別キー保存・バックアップ対象外＝再生成可能) ---

export interface LifeReading {
  themes: string; // 繰り返すテーマ・癖・課題
  timing: string; // 出来事と星の重なり
  strengths: string; // 強み
  mission: string; // 使命
  message: string; // これからへのメッセージ
  generatedAt: string;
  eventCount: number;
}

const LIFE_READING_KEY = "unmei-life-reading";

export function loadLifeReading(): LifeReading | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LIFE_READING_KEY);
    return raw ? (JSON.parse(raw) as LifeReading) : null;
  } catch {
    return null;
  }
}

export function saveLifeReading(r: LifeReading): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LIFE_READING_KEY, JSON.stringify(r));
  } catch (e) {
    console.error("[storage] saveLifeReading failed:", e);
  }
}

export function clearLifeReading(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LIFE_READING_KEY);
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
  oracleCount: number;
  lifeEventCount: number;
} {
  const data = loadData();
  return {
    profileCount: data.profiles.length,
    diaryCount: data.diary.length,
    goalCount: data.goals.length,
    readingCount: data.manualReadings.length,
    oracleCount: data.oracleDraws.length,
    lifeEventCount: data.lifeEvents.length,
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
    const oracleDraws = Array.isArray(obj.oracleDraws)
      ? (obj.oracleDraws.filter(
          (o) =>
            o &&
            typeof o === "object" &&
            typeof (o as OracleDraw).cardId === "number"
        ) as OracleDraw[])
      : [];
    const lifeEvents = Array.isArray(obj.lifeEvents)
      ? (obj.lifeEvents.filter(
          (e) =>
            e &&
            typeof e === "object" &&
            typeof (e as LifeEvent).year === "number"
        ) as LifeEvent[])
      : [];

    if (
      profiles.length === 0 &&
      diary.length === 0 &&
      goals.length === 0 &&
      manualReadings.length === 0 &&
      oracleDraws.length === 0 &&
      lifeEvents.length === 0
    ) {
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
      oracleDraws,
      lifeEvents,
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
