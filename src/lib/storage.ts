export interface UserProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM or ""
  birthPlace: string;
}

export interface DiaryEntry {
  date: string; // YYYY-MM-DD
  content: string;
  createdAt: string;
}

export interface GoalData {
  category: string;
  description: string;
  targetDate: string;
  createdAt: string;
}

export interface ManualReading {
  type: string; // "fourpillars" | "horoscope" | etc.
  label: string;
  data: Record<string, string>;
  imageBase64?: string;
  createdAt: string;
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
