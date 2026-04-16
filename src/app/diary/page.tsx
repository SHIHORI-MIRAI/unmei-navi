"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  loadProfile,
  loadDiary,
  saveDiaryEntry,
  deleteDiaryEntry,
  type DiaryEntry,
  type UserProfile,
} from "@/lib/storage";
import {
  calcNumerology,
  calcTodayMayan,
  calcNineStar,
  calcLuckyInfo,
} from "@/lib/divination";

const MOOD_OPTIONS = [
  { value: 1, label: "低調", emoji: "🌧️" },
  { value: 2, label: "まあまあ", emoji: "☁️" },
  { value: 3, label: "普通", emoji: "⛅" },
  { value: 4, label: "良い", emoji: "🌤️" },
  { value: 5, label: "最高", emoji: "☀️" },
];

const TAG_PRESETS = [
  "仕事", "お金", "人間関係", "健康", "学び", "気づき", "感謝", "挑戦",
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[d.getDay()];
  return `${month}/${day}（${weekday}）`;
}

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** その日の運勢サマリーを生成 */
interface DayFortune {
  personalDay: number;
  personalDayMessage: string;
  mayanSeal: string;
  mayanColor: string;
  nineStarPosition: string;
  nineStarEnergy: number;
  luckyColor: string;
  moonPhase: string;
  moonEmoji: string;
}

function calcDayFortune(birthDate: string, date: Date): DayFortune | null {
  try {
    const num = calcNumerology(birthDate, date);
    const mayan = calcTodayMayan(date);
    const nine = calcNineStar(birthDate, date.getFullYear());
    const lucky = calcLuckyInfo(date, num.lifePathNumber);

    const dayMessages: Record<number, string> = {
      1: "始まりの日・新しい行動",
      2: "協力と調和の日",
      3: "創造力が輝く日",
      4: "地道な努力が実る日",
      5: "変化とチャンスの日",
      6: "愛と奉仕の日",
      7: "内省と学びの日",
      8: "パワーと達成の日",
      9: "完結と奉仕の日",
      11: "直感が冴える日",
      22: "大きなビジョンの日",
      33: "深い愛の日",
    };

    return {
      personalDay: num.personalDay,
      personalDayMessage: dayMessages[num.personalDay] || dayMessages[1],
      mayanSeal: mayan.solarSeal.name,
      mayanColor: mayan.solarSeal.color,
      nineStarPosition: nine.yearPosition?.direction || "",
      nineStarEnergy: nine.yearPosition?.energy || 50,
      luckyColor: lucky.color.name,
      moonPhase: lucky.moonPhase,
      moonEmoji: lucky.moonEmoji,
    };
  } catch {
    return null;
  }
}

export default function DiaryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // フォーム状態
  const [date, setDate] = useState(getTodayString());
  const [mood, setMood] = useState(3);
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 表示月フィルター
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.push("/profile");
      return;
    }
    setProfile(p);
    setEntries(loadDiary());
  }, [router]);

  const resetForm = useCallback(() => {
    setDate(getTodayString());
    setMood(3);
    setContent("");
    setSelectedTags([]);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!content.trim()) return;

    const entry: DiaryEntry = {
      id: editingId || generateId(),
      date,
      mood,
      content: content.trim(),
      tags: selectedTags,
      createdAt: editingId
        ? entries.find((e) => e.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: editingId ? new Date().toISOString() : undefined,
    };

    saveDiaryEntry(entry);
    setEntries(loadDiary());
    resetForm();
  }, [date, mood, content, selectedTags, editingId, entries, resetForm]);

  const handleEdit = useCallback((entry: DiaryEntry) => {
    setDate(entry.date);
    setMood(entry.mood);
    setContent(entry.content);
    setSelectedTags(entry.tags);
    setEditingId(entry.id);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteDiaryEntry(id);
    setEntries(loadDiary());
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  if (!profile) {
    return <p className="text-muted text-center py-10">読み込み中...</p>;
  }

  // 月でフィルター
  const filteredEntries = entries
    .filter((e) => e.date.startsWith(viewMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  // 今日の日記があるかチェック
  const todayEntry = entries.find((e) => e.date === getTodayString());

  // 月ナビゲーション
  const changeMonth = (delta: number) => {
    const [y, m] = viewMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setViewMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  // 月のムード平均
  const avgMood =
    filteredEntries.length > 0
      ? filteredEntries.reduce((sum, e) => sum + e.mood, 0) / filteredEntries.length
      : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">📖</span>
        振り返り日記
      </h2>

      {/* 今日書いていない場合のプロンプト */}
      {!todayEntry && !showForm && (
        <button
          onClick={() => {
            setDate(getTodayString());
            setShowForm(true);
          }}
          className="w-full bg-accent-orange text-white rounded-xl py-3 text-sm font-medium hover:bg-accent-orange/90 transition-colors"
        >
          + 今日の振り返りを書く
        </button>
      )}

      {/* 今日書いている場合は新規追加ボタン */}
      {todayEntry && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-card-bg border border-card-border rounded-xl py-3 text-sm font-medium text-accent-orange hover:bg-accent-orange/5 transition-colors"
        >
          + 別の日の日記を追加
        </button>
      )}

      {/* 入力フォーム */}
      {showForm && (
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              {editingId ? "日記を編集" : "振り返りを記録"}
            </h3>
            <button
              onClick={resetForm}
              className="text-xs text-muted hover:text-foreground"
            >
              キャンセル
            </button>
          </div>

          {/* 日付 */}
          <div>
            <label className="text-xs text-muted block mb-1.5">日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={getTodayString()}
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-orange"
            />
          </div>

          {/* 気分 */}
          <div>
            <label className="text-xs text-muted block mb-1.5">今日の気分</label>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg border transition-colors ${
                    mood === m.value
                      ? "border-accent-orange bg-accent-orange/10"
                      : "border-card-border hover:border-accent-orange/50"
                  }`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span className="text-[10px] text-muted">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 内容 */}
          <div>
            <label className="text-xs text-muted block mb-1.5">今日の振り返り</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="今日あったこと、感じたこと、気づきなど..."
              rows={4}
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange resize-none"
            />
          </div>

          {/* タグ */}
          <div>
            <label className="text-xs text-muted block mb-1.5">タグ（任意）</label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_PRESETS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedTags.includes(tag)
                      ? "border-accent-orange bg-accent-orange/10 text-accent-orange"
                      : "border-card-border text-muted hover:border-accent-orange/50"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* その日の運勢プレビュー */}
          {date && profile && (
            <FortunePreview
              birthDate={profile.birthDate}
              date={date}
            />
          )}

          {/* 保存 */}
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="w-full bg-accent-orange text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-orange/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {editingId ? "更新する" : "保存する"}
          </button>
        </div>
      )}

      {/* 月ナビゲーション + サマリー */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => changeMonth(-1)}
            className="text-muted hover:text-accent-orange text-sm px-2 py-1"
          >
            ←
          </button>
          <h3 className="text-sm font-medium text-foreground">
            {viewMonth.replace("-", "年")}月
          </h3>
          <button
            onClick={() => changeMonth(1)}
            className="text-muted hover:text-accent-orange text-sm px-2 py-1"
          >
            →
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-muted">
          <span>{filteredEntries.length}件の記録</span>
          {avgMood > 0 && (
            <span>
              平均気分：{MOOD_OPTIONS.find((m) => m.value === Math.round(avgMood))?.emoji || "⛅"}{" "}
              {avgMood.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* 日記一覧 */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <DiaryCard
              key={entry.id}
              entry={entry}
              profile={profile}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm text-center">
          <p className="text-sm text-muted mb-2">この月の記録はまだありません</p>
          <p className="text-xs text-muted/70">
            日々の振り返りを記録して、<br />
            運勢との関連を発見しましょう
          </p>
        </div>
      )}

      <p className="text-center text-xs text-muted/60 px-4">
        ※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。
      </p>
    </div>
  );
}

// --- サブコンポーネント ---

function FortunePreview({
  birthDate,
  date,
}: {
  birthDate: string;
  date: string;
}) {
  const fortune = calcDayFortune(birthDate, new Date(date + "T00:00:00"));
  if (!fortune) return null;

  return (
    <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-xl p-3 space-y-2">
      <p className="text-xs font-medium text-accent-gold flex items-center gap-1">
        <span>✦</span> この日の運勢
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted">数秘パーソナルデイ</span>
          <p className="text-foreground/90 font-medium">
            {fortune.personalDay}：{fortune.personalDayMessage}
          </p>
        </div>
        <div>
          <span className="text-muted">マヤ暦</span>
          <p className="text-foreground/90 font-medium">
            {fortune.mayanSeal}（{fortune.mayanColor}）
          </p>
        </div>
        <div>
          <span className="text-muted">九星気学</span>
          <p className="text-foreground/90 font-medium">
            {fortune.nineStarPosition}
          </p>
        </div>
        <div>
          <span className="text-muted">月齢</span>
          <p className="text-foreground/90 font-medium">
            {fortune.moonEmoji} {fortune.moonPhase}
          </p>
        </div>
      </div>
    </div>
  );
}

function DiaryCard({
  entry,
  profile,
  onEdit,
  onDelete,
}: {
  entry: DiaryEntry;
  profile: UserProfile;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [showFortune, setShowFortune] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const moodOption = MOOD_OPTIONS.find((m) => m.value === entry.mood);

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{moodOption?.emoji || "⛅"}</span>
          <div>
            <p className="text-sm font-medium text-foreground">
              {formatDate(entry.date)}
            </p>
            <p className="text-[10px] text-muted">{moodOption?.label || "普通"}</p>
          </div>
        </div>

        {/* メニュー */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-muted hover:text-foreground text-sm px-1"
          >
            ···
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 bg-card-bg border border-card-border rounded-lg shadow-lg z-10 min-w-[100px]">
              <button
                onClick={() => { onEdit(entry); setShowMenu(false); }}
                className="block w-full text-left text-xs px-3 py-2 hover:bg-accent-orange/5 text-foreground/80"
              >
                編集
              </button>
              <button
                onClick={() => { onDelete(entry.id); setShowMenu(false); }}
                className="block w-full text-left text-xs px-3 py-2 hover:bg-danger/5 text-danger"
              >
                削除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 内容 */}
      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
        {entry.content}
      </p>

      {/* タグ */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] bg-accent-orange/10 text-accent-orange px-1.5 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 運勢照合トグル */}
      <button
        onClick={() => setShowFortune(!showFortune)}
        className="text-[11px] text-muted hover:text-accent-gold flex items-center gap-1"
      >
        <span>{showFortune ? "▾" : "▸"}</span>
        {showFortune ? "運勢を閉じる" : "この日の運勢と照らし合わせる"}
      </button>

      {showFortune && (
        <FortuneComparison
          birthDate={profile.birthDate}
          date={entry.date}
          mood={entry.mood}
        />
      )}
    </div>
  );
}

function FortuneComparison({
  birthDate,
  date,
  mood,
}: {
  birthDate: string;
  date: string;
  mood: number;
}) {
  const fortune = calcDayFortune(birthDate, new Date(date + "T00:00:00"));
  if (!fortune) {
    return <p className="text-xs text-muted pl-3">運勢データを取得できませんでした</p>;
  }

  // 気分と運勢の照合コメント
  const comparison = (() => {
    const energy = fortune.nineStarEnergy;
    if (mood >= 4 && energy >= 60) {
      return "運勢も気分も好調！この流れに乗って行動すると大きな成果に繋がりそうです";
    }
    if (mood >= 4 && energy < 60) {
      return "運勢的には控えめな時期ですが、気分が良いのは素晴らしい。あなたの力で運気を引き上げています";
    }
    if (mood <= 2 && energy >= 60) {
      return "運勢は味方しているので、小さな一歩を踏み出してみて。思ったより上手くいくかもしれません";
    }
    if (mood <= 2 && energy < 60) {
      return "今は充電期間。焦らなくて大丈夫。この時期の休息が次の飛躍の土台になります";
    }
    return "バランスの取れた一日。日々の積み重ねが大きな変化を生みます";
  })();

  return (
    <div className="bg-accent-orange/5 border border-accent-orange/15 rounded-xl p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted">パーソナルデイ</span>
          <p className="text-foreground/90">
            {fortune.personalDay}：{fortune.personalDayMessage}
          </p>
        </div>
        <div>
          <span className="text-muted">マヤ暦</span>
          <p className="text-foreground/90">
            {fortune.mayanSeal}（{fortune.mayanColor}）
          </p>
        </div>
        <div>
          <span className="text-muted">九星気学</span>
          <p className="text-foreground/90">{fortune.nineStarPosition}</p>
        </div>
        <div>
          <span className="text-muted">月齢</span>
          <p className="text-foreground/90">
            {fortune.moonEmoji} {fortune.moonPhase}
          </p>
        </div>
      </div>

      {/* 照合コメント */}
      <div className="bg-white/50 rounded-lg p-2.5 mt-2">
        <p className="text-[10px] text-accent-gold font-medium mb-1">
          気分 × 運勢の照合
        </p>
        <p className="text-xs text-foreground/80 leading-relaxed">{comparison}</p>
      </div>
    </div>
  );
}
