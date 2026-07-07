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
import { useI18n } from "@/lib/i18n/provider";
import type { DictKey, Lang } from "@/lib/i18n/dict";
import { mayanSealName, colorName, directionName } from "@/lib/i18n/fortune-terms";
import UsageHelp from "@/components/UsageHelp";

/** 気分の選択肢（value/emoji は言語非依存、ラベルは辞書キー） */
const MOOD_OPTIONS: { value: number; emoji: string; key: DictKey }[] = [
  { value: 1, emoji: "🌧️", key: "diary.mood.1" },
  { value: 2, emoji: "☁️", key: "diary.mood.2" },
  { value: 3, emoji: "⛅", key: "diary.mood.3" },
  { value: 4, emoji: "🌤️", key: "diary.mood.4" },
  { value: 5, emoji: "☀️", key: "diary.mood.5" },
];

/** タグ（value は保存される正の日本語表記。表示のみ翻訳する） */
const TAG_PRESETS: { value: string; key: DictKey }[] = [
  { value: "仕事", key: "diary.tag.work" },
  { value: "お金", key: "diary.tag.money" },
  { value: "人間関係", key: "diary.tag.relationship" },
  { value: "健康", key: "diary.tag.health" },
  { value: "学び", key: "diary.tag.learning" },
  { value: "気づき", key: "diary.tag.insight" },
  { value: "感謝", key: "diary.tag.gratitude" },
  { value: "挑戦", key: "diary.tag.challenge" },
];

/** 数秘パーソナルデイの一言（多言語） */
const DAY_MESSAGES: Record<Lang, Record<number, string>> = {
  ja: {
    1: "始まりの日・新しい行動", 2: "協力と調和の日", 3: "創造力が輝く日",
    4: "地道な努力が実る日", 5: "変化とチャンスの日", 6: "愛と奉仕の日",
    7: "内省と学びの日", 8: "パワーと達成の日", 9: "完結と奉仕の日",
    11: "直感が冴える日", 22: "大きなビジョンの日", 33: "深い愛の日",
  },
  ko: {
    1: "시작의 날·새로운 행동", 2: "협력과 조화의 날", 3: "창의력이 빛나는 날",
    4: "꾸준한 노력이 결실을 맺는 날", 5: "변화와 기회의 날", 6: "사랑과 봉사의 날",
    7: "성찰과 배움의 날", 8: "파워와 성취의 날", 9: "완결과 봉사의 날",
    11: "직감이 예리해지는 날", 22: "큰 비전의 날", 33: "깊은 사랑의 날",
  },
};

/** 気分×運気エネルギーの照合コメント（多言語） */
function comparisonText(mood: number, energy: number, lang: Lang): string {
  const ko = lang === "ko";
  if (mood >= 4 && energy >= 60)
    return ko
      ? "운세도 기분도 호조! 이 흐름을 타고 행동하면 큰 성과로 이어질 것 같습니다"
      : "運勢も気分も好調！この流れに乗って行動すると大きな成果に繋がりそうです";
  if (mood >= 4 && energy < 60)
    return ko
      ? "운세적으로는 조용한 시기지만, 기분이 좋은 것은 멋진 일. 당신의 힘으로 운기를 끌어올리고 있습니다"
      : "運勢的には控えめな時期ですが、気分が良いのは素晴らしい。あなたの力で運気を引き上げています";
  if (mood <= 2 && energy >= 60)
    return ko
      ? "운세는 편이 되어주고 있으니, 작은 한 걸음을 내디뎌 보세요. 생각보다 잘될지도 모릅니다"
      : "運勢は味方しているので、小さな一歩を踏み出してみて。思ったより上手くいくかもしれません";
  if (mood <= 2 && energy < 60)
    return ko
      ? "지금은 충전 기간. 조급해하지 않아도 괜찮습니다. 이 시기의 휴식이 다음 도약의 토대가 됩니다"
      : "今は充電期間。焦らなくて大丈夫。この時期の休息が次の飛躍の土台になります";
  return ko
    ? "균형 잡힌 하루. 매일의 축적이 큰 변화를 만듭니다"
    : "バランスの取れた一日。日々の積み重ねが大きな変化を生みます";
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const WEEKDAYS: Record<Lang, string[]> = {
  ja: ["日", "月", "火", "水", "木", "金", "土"],
  ko: ["일", "월", "화", "수", "목", "금", "토"],
};

function formatDate(dateStr: string, lang: Lang): string {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = WEEKDAYS[lang][d.getDay()];
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

function calcDayFortune(birthDate: string, date: Date, lang: Lang): DayFortune | null {
  try {
    const num = calcNumerology(birthDate, date, lang);
    const mayan = calcTodayMayan(date);
    const nine = calcNineStar(birthDate, date.getFullYear());
    const lucky = calcLuckyInfo(date, num.lifePathNumber, lang);
    const messages = DAY_MESSAGES[lang];

    return {
      personalDay: num.personalDay,
      personalDayMessage: messages[num.personalDay] || messages[1],
      mayanSeal: mayanSealName(mayan.solarSeal.name, lang),
      mayanColor: colorName(mayan.solarSeal.color, lang),
      nineStarPosition: directionName(nine.yearPosition?.direction || "", lang),
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
  const { t, lang } = useI18n();
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
    return <p className="text-muted text-center py-10">{t("astro.loading")}</p>;
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

  const [vy, vm] = viewMonth.split("-").map(Number);
  const monthLabel = lang === "ko" ? `${vy}년 ${vm}월` : `${vy}年${vm}月`;

  // 月のムード平均
  const avgMood =
    filteredEntries.length > 0
      ? filteredEntries.reduce((sum, e) => sum + e.mood, 0) / filteredEntries.length
      : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">📖</span>
        {t("diary.title")}
      </h2>

      <UsageHelp
        storageKey="usage-help-diary"
        title={t("diary.help.title")}
        steps={[
          t("diary.help.step1"),
          t("diary.help.step2"),
          t("diary.help.step3"),
          t("diary.help.step4"),
        ]}
      />

      {/* 今日書いていない場合のプロンプト */}
      {!todayEntry && !showForm && (
        <button
          onClick={() => {
            setDate(getTodayString());
            setShowForm(true);
          }}
          className="w-full bg-accent-orange text-white rounded-xl py-3 text-sm font-medium hover:bg-accent-orange/90 transition-colors"
        >
          {t("diary.writeToday")}
        </button>
      )}

      {/* 今日書いている場合は新規追加ボタン */}
      {todayEntry && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-card-bg border border-card-border rounded-xl py-3 text-sm font-medium text-accent-orange hover:bg-accent-orange/5 transition-colors"
        >
          {t("diary.addOtherDay")}
        </button>
      )}

      {/* 入力フォーム */}
      {showForm && (
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              {editingId ? t("diary.form.edit") : t("diary.form.record")}
            </h3>
            <button
              onClick={resetForm}
              className="text-xs text-muted hover:text-foreground"
            >
              {t("common.cancel")}
            </button>
          </div>

          {/* 日付 */}
          <div>
            <label className="text-xs text-muted block mb-1.5">{t("diary.form.dateLabel")}</label>
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
            <label className="text-xs text-muted block mb-1.5">{t("diary.form.moodLabel")}</label>
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
                  <span className="text-[10px] text-muted">{t(m.key)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 内容 */}
          <div>
            <label className="text-xs text-muted block mb-1.5">{t("diary.form.contentLabel")}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("diary.form.contentPlaceholder")}
              rows={4}
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange resize-none"
            />
          </div>

          {/* タグ */}
          <div>
            <label className="text-xs text-muted block mb-1.5">{t("diary.form.tagsLabel")}</label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_PRESETS.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => toggleTag(tag.value)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedTags.includes(tag.value)
                      ? "border-accent-orange bg-accent-orange/10 text-accent-orange"
                      : "border-card-border text-muted hover:border-accent-orange/50"
                  }`}
                >
                  {t(tag.key)}
                </button>
              ))}
            </div>
          </div>

          {/* その日の運勢プレビュー */}
          {date && profile && (
            <FortunePreview birthDate={profile.birthDate} date={date} />
          )}

          {/* 保存 */}
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="w-full bg-accent-orange text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-orange/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {editingId ? t("diary.form.update") : t("diary.form.save")}
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
          <h3 className="text-sm font-medium text-foreground">{monthLabel}</h3>
          <button
            onClick={() => changeMonth(1)}
            className="text-muted hover:text-accent-orange text-sm px-2 py-1"
          >
            →
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-muted">
          <span>{t("diary.count", { n: filteredEntries.length })}</span>
          {avgMood > 0 && (
            <span>
              {t("diary.avgMood")}{MOOD_OPTIONS.find((m) => m.value === Math.round(avgMood))?.emoji || "⛅"}{" "}
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
          <p className="text-sm text-muted mb-2">{t("diary.empty.title")}</p>
          <p className="text-xs text-muted/70">{t("diary.empty.body")}</p>
        </div>
      )}

      <p className="text-center text-xs text-muted/60 px-4">
        {t("common.disclaimer")}
      </p>
    </div>
  );
}

// --- サブコンポーネント ---

function FortunePreview({ birthDate, date }: { birthDate: string; date: string }) {
  const { t, lang } = useI18n();
  const fortune = calcDayFortune(birthDate, new Date(date + "T00:00:00"), lang);
  if (!fortune) return null;

  return (
    <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-xl p-3 space-y-2">
      <p className="text-xs font-medium text-accent-gold flex items-center gap-1">
        <span>✦</span> {t("diary.thisDayFortune")}
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted">{t("diary.label.personalDayFull")}</span>
          <p className="text-foreground/90 font-medium">
            {fortune.personalDay}：{fortune.personalDayMessage}
          </p>
        </div>
        <div>
          <span className="text-muted">{t("diary.label.mayan")}</span>
          <p className="text-foreground/90 font-medium">
            {fortune.mayanSeal}（{fortune.mayanColor}）
          </p>
        </div>
        <div>
          <span className="text-muted">{t("diary.label.nineStar")}</span>
          <p className="text-foreground/90 font-medium">{fortune.nineStarPosition}</p>
        </div>
        <div>
          <span className="text-muted">{t("diary.label.moon")}</span>
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
  const { t, lang } = useI18n();
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
              {formatDate(entry.date, lang)}
            </p>
            <p className="text-[10px] text-muted">
              {moodOption ? t(moodOption.key) : t("diary.mood.3")}
            </p>
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
                {t("common.edit")}
              </button>
              <button
                onClick={() => { onDelete(entry.id); setShowMenu(false); }}
                className="block w-full text-left text-xs px-3 py-2 hover:bg-danger/5 text-danger"
              >
                {t("common.delete")}
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
          {entry.tags.map((tag) => {
            const preset = TAG_PRESETS.find((p) => p.value === tag);
            return (
              <span
                key={tag}
                className="text-[10px] bg-accent-orange/10 text-accent-orange px-1.5 py-0.5 rounded-full"
              >
                {preset ? t(preset.key) : tag}
              </span>
            );
          })}
        </div>
      )}

      {/* 運勢照合トグル */}
      <button
        onClick={() => setShowFortune(!showFortune)}
        className="text-[11px] text-muted hover:text-accent-gold flex items-center gap-1"
      >
        <span>{showFortune ? "▾" : "▸"}</span>
        {showFortune ? t("diary.card.closeFortune") : t("diary.card.openFortune")}
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
  const { t, lang } = useI18n();
  const fortune = calcDayFortune(birthDate, new Date(date + "T00:00:00"), lang);
  if (!fortune) {
    return <p className="text-xs text-muted pl-3">{t("diary.noFortuneData")}</p>;
  }

  const comparison = comparisonText(mood, fortune.nineStarEnergy, lang);

  return (
    <div className="bg-accent-orange/5 border border-accent-orange/15 rounded-xl p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted">{t("diary.label.personalDay")}</span>
          <p className="text-foreground/90">
            {fortune.personalDay}：{fortune.personalDayMessage}
          </p>
        </div>
        <div>
          <span className="text-muted">{t("diary.label.mayan")}</span>
          <p className="text-foreground/90">
            {fortune.mayanSeal}（{fortune.mayanColor}）
          </p>
        </div>
        <div>
          <span className="text-muted">{t("diary.label.nineStar")}</span>
          <p className="text-foreground/90">{fortune.nineStarPosition}</p>
        </div>
        <div>
          <span className="text-muted">{t("diary.label.moon")}</span>
          <p className="text-foreground/90">
            {fortune.moonEmoji} {fortune.moonPhase}
          </p>
        </div>
      </div>

      {/* 照合コメント */}
      <div className="bg-white/50 rounded-lg p-2.5 mt-2">
        <p className="text-[10px] text-accent-gold font-medium mb-1">
          {t("diary.moodVsFortune")}
        </p>
        <p className="text-xs text-foreground/80 leading-relaxed">{comparison}</p>
      </div>
    </div>
  );
}
