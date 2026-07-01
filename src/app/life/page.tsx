"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  loadProfile,
  loadLifeEvents,
  saveLifeEvent,
  deleteLifeEvent,
  type LifeEvent,
  type UserProfile,
} from "@/lib/storage";
import {
  getLifePeriod,
  analyzeLifePatterns,
  type LifePeriod,
} from "@/lib/divination";
import UsageHelp from "@/components/UsageHelp";

const CATEGORIES = [
  "転機", "仕事", "家族", "人間関係", "健康", "学び", "内的気づき", "その他",
];

const MAGNITUDES = [
  { value: 1, label: "小さな気づき", emoji: "🔹" },
  { value: 2, label: "できごと", emoji: "🔸" },
  { value: 3, label: "人生の節目", emoji: "⭐" },
];

const EMOTIONS = [
  { value: 1, label: "つらい", emoji: "🌧️" },
  { value: 2, label: "モヤモヤ", emoji: "☁️" },
  { value: 3, label: "ふつう", emoji: "⛅" },
  { value: 4, label: "良い", emoji: "🌤️" },
  { value: 5, label: "最高", emoji: "☀️" },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function LifePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const nowYear = new Date().getFullYear();

  // フォーム状態
  const [year, setYear] = useState(nowYear);
  const [month, setMonth] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("転機");
  const [magnitude, setMagnitude] = useState(2);
  const [emotion, setEmotion] = useState(3);
  const [learning, setLearning] = useState("");

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.push("/profile");
      return;
    }
    setProfile(p);
    setEvents(loadLifeEvents());
  }, [router]);

  const resetForm = useCallback(() => {
    setYear(nowYear);
    setMonth("");
    setTitle("");
    setCategory("転機");
    setMagnitude(2);
    setEmotion(3);
    setLearning("");
    setEditingId(null);
    setShowForm(false);
  }, [nowYear]);

  const handleSave = useCallback(() => {
    if (!title.trim() || !year) return;
    const event: LifeEvent = {
      id: editingId || generateId(),
      year,
      month: month === "" ? undefined : Number(month),
      title: title.trim(),
      category,
      magnitude,
      emotion,
      learning: learning.trim(),
      createdAt: editingId
        ? events.find((e) => e.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: editingId ? new Date().toISOString() : undefined,
    };
    saveLifeEvent(event);
    setEvents(loadLifeEvents());
    resetForm();
  }, [year, month, title, category, magnitude, emotion, learning, editingId, events, resetForm]);

  const handleEdit = useCallback((e: LifeEvent) => {
    setYear(e.year);
    setMonth(e.month ?? "");
    setTitle(e.title);
    setCategory(e.category);
    setMagnitude(e.magnitude);
    setEmotion(e.emotion);
    setLearning(e.learning);
    setEditingId(e.id);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteLifeEvent(id);
    setEvents(loadLifeEvents());
  }, []);

  // 年→月の昇順（人生の物語＝時系列）
  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) => a.year - b.year || (a.month ?? 0) - (b.month ?? 0)
      ),
    [events]
  );

  const insight = useMemo(
    () => (profile ? analyzeLifePatterns(events, profile.birthDate) : null),
    [events, profile]
  );

  const birthYear = profile ? Number(profile.birthDate.split("-")[0]) : nowYear;

  if (!profile) {
    return <p className="text-muted text-center py-10">読み込み中...</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">📜</span>
        人生の棚卸し
      </h2>
      <p className="text-xs text-muted leading-relaxed -mt-1">
        人生の出来事を時系列に並べ、その時期の運気や星の節目を重ねて、
        自分の癖・課題・強みを見つめ直すページです。
      </p>

      <UsageHelp
        storageKey="usage-help-life"
        title="人生の棚卸しの使い方"
        steps={[
          <>大きな出来事（転職・出会い・別れ・決断など）から、<strong>小さな気づき</strong>まで、思い出した順でOK。年（できれば月）と一言を記録します。</>,
          <>つらかった出来事も<strong>ありのまま</strong>で大丈夫。感情はそのまま、意味づけ（学び）は前向きに残せます。</>,
          <>保存すると、その時期の<strong>運気（数秘・九星）や星の節目（土星回帰など）</strong>が自動で重なります。</>,
          <>3件以上たまると、<strong>繰り返すテーマ＝人生の癖・課題の「芽」</strong>が見えてきます。</>,
        ]}
      />

      {/* 追加ボタン */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-accent-orange text-white rounded-xl py-3 text-sm font-medium hover:bg-accent-orange/90 transition-colors"
        >
          + 出来事・気づきを追加
        </button>
      )}

      {/* 入力フォーム */}
      {showForm && (
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              {editingId ? "出来事を編集" : "出来事を記録"}
            </h3>
            <button onClick={resetForm} className="text-xs text-muted hover:text-foreground">
              キャンセル
            </button>
          </div>

          {/* 年・月 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted block mb-1.5">年（西暦）</label>
              <input
                type="number"
                value={year}
                min={birthYear}
                max={nowYear}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-orange"
              />
              <p className="text-[10px] text-muted mt-1">
                {year ? `${year - birthYear}歳ごろ` : ""}
              </p>
            </div>
            <div className="w-28">
              <label className="text-xs text-muted block mb-1.5">月（任意）</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-orange"
              >
                <option value="">—</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}月</option>
                ))}
              </select>
            </div>
          </div>

          {/* タイトル */}
          <div>
            <label className="text-xs text-muted block mb-1.5">出来事・気づき</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：転職を決意した / 大切な人と出会った"
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange"
            />
          </div>

          {/* カテゴリ */}
          <div>
            <label className="text-xs text-muted block mb-1.5">カテゴリ</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    category === c
                      ? "border-accent-orange bg-accent-orange/10 text-accent-orange"
                      : "border-card-border text-muted hover:border-accent-orange/50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 大きさ */}
          <div>
            <label className="text-xs text-muted block mb-1.5">出来事の大きさ</label>
            <div className="flex gap-2">
              {MAGNITUDES.map((mg) => (
                <button
                  key={mg.value}
                  onClick={() => setMagnitude(mg.value)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg border transition-colors ${
                    magnitude === mg.value
                      ? "border-accent-orange bg-accent-orange/10"
                      : "border-card-border hover:border-accent-orange/50"
                  }`}
                >
                  <span className="text-base">{mg.emoji}</span>
                  <span className="text-[10px] text-muted">{mg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 当時の感情（ありのまま） */}
          <div>
            <label className="text-xs text-muted block mb-1.5">当時の気持ち（ありのままでOK）</label>
            <div className="flex gap-2">
              {EMOTIONS.map((em) => (
                <button
                  key={em.value}
                  onClick={() => setEmotion(em.value)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg border transition-colors ${
                    emotion === em.value
                      ? "border-accent-orange bg-accent-orange/10"
                      : "border-card-border hover:border-accent-orange/50"
                  }`}
                >
                  <span className="text-lg">{em.emoji}</span>
                  <span className="text-[10px] text-muted">{em.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 学び・気づき */}
          <div>
            <label className="text-xs text-muted block mb-1.5">そこで得た気づき・学び（任意・前向きに）</label>
            <textarea
              value={learning}
              onChange={(e) => setLearning(e.target.value)}
              placeholder="この経験から得たもの、今の自分につながっていること..."
              rows={3}
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange resize-none"
            />
          </div>

          {/* その時期の星プレビュー */}
          {year >= birthYear && (
            <PeriodPanel period={getLifePeriod(profile.birthDate, year)} compact />
          )}

          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full bg-accent-orange text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-orange/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {editingId ? "更新する" : "保存する"}
          </button>
        </div>
      )}

      {/* 気づきの芽（3件以上でパターン抽出） */}
      {insight && insight.eventCount > 0 && (
        <InsightCard insight={insight} />
      )}

      {/* タイムライン */}
      {sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map((e) => (
            <LifeEventCard
              key={e.id}
              event={e}
              birthDate={profile.birthDate}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm text-center">
          <p className="text-sm text-muted mb-2">まだ出来事がありません</p>
          <p className="text-xs text-muted/70">
            覚えている大きな出来事から、<br />
            ひとつずつ書き出してみましょう
          </p>
        </div>
      )}

      {/* Phase 2 予告（有料・AI） */}
      <div className="bg-gradient-to-br from-accent-gold/10 via-card-bg to-accent-orange/5 border border-accent-gold/30 rounded-2xl p-4 shadow-sm space-y-2">
        <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <span className="text-accent-gold">✦</span> AIで深く読み解く（近日公開・準備中）
        </p>
        <p className="text-xs text-muted leading-relaxed">
          出来事がたまったら、AIがあなたの人生を通して読み解き、
          <strong>繰り返すパターン・人生の課題・使命・強み</strong>を、あなただけの言葉で明確にします。
          まずはこのページで、あなたの物語を書きためていきましょう。
        </p>
      </div>

      <p className="text-center text-xs text-muted/60 px-4 leading-relaxed">
        ※ 星の節目は年齢による目安です。占いは参考情報として、
        つらい記憶を無理に振り返る必要はありません。ご自身のペースでどうぞ。
      </p>
    </div>
  );
}

// --- サブコンポーネント ---

/** その時期の運気・星の節目パネル */
function PeriodPanel({ period, compact = false }: { period: LifePeriod; compact?: boolean }) {
  return (
    <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-xl p-3 space-y-2">
      <p className="text-xs font-medium text-accent-gold flex items-center gap-1">
        <span>✦</span> {period.age}歳ごろ（{period.year}年）の星と運気
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted">数秘の年運</span>
          <p className="text-foreground/90 font-medium">
            {period.personalYear}：{period.personalYearTheme}
          </p>
        </div>
        <div>
          <span className="text-muted">九星の巡り</span>
          <p className="text-foreground/90 font-medium">
            {period.nineStarDirection || "—"}
          </p>
        </div>
      </div>
      {!compact && (
        <p className="text-[11px] text-muted leading-relaxed">
          {period.personalYearAdvice}
        </p>
      )}
      {period.milestones.length > 0 && (
        <div className="space-y-1 pt-1">
          {period.milestones.map((m) => (
            <div
              key={m.key}
              className="flex items-start gap-1.5 text-[11px] bg-white/60 rounded-lg px-2.5 py-1.5"
            >
              <span className="text-sm leading-none mt-0.5">{m.emoji}</span>
              <p className="text-foreground/85 leading-relaxed">
                <span className="font-bold">{m.label}</span>：{m.theme}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LifeEventCard({
  event,
  birthDate,
  onEdit,
  onDelete,
}: {
  event: LifeEvent;
  birthDate: string;
  onEdit: (e: LifeEvent) => void;
  onDelete: (id: string) => void;
}) {
  const [showPeriod, setShowPeriod] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const birthYear = Number(birthDate.split("-")[0]);
  const age = event.year - birthYear;
  const mag = MAGNITUDES.find((m) => m.value === event.magnitude);
  const em = EMOTIONS.find((e) => e.value === event.emotion);

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          {/* 年齢バッジ */}
          <div className="flex-shrink-0 text-center">
            <div className="w-11 h-11 rounded-full bg-accent-gold/10 border border-accent-gold/30 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-accent-orange leading-none">{age}</span>
              <span className="text-[8px] text-muted">歳</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm">{mag?.emoji}</span>
              <p className="text-sm font-bold text-foreground leading-tight">{event.title}</p>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] text-muted">
                {event.year}年{event.month ? `${event.month}月` : ""}
              </span>
              <span className="text-[10px] bg-accent-orange/10 text-accent-orange px-1.5 py-0.5 rounded-full">
                {event.category}
              </span>
              <span className="text-[11px]" title={em?.label}>{em?.emoji}</span>
            </div>
          </div>
        </div>

        {/* メニュー */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-muted hover:text-foreground text-sm px-1"
          >
            ···
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 bg-card-bg border border-card-border rounded-lg shadow-lg z-10 min-w-[100px]">
              <button
                onClick={() => { onEdit(event); setShowMenu(false); }}
                className="block w-full text-left text-xs px-3 py-2 hover:bg-accent-orange/5 text-foreground/80"
              >
                編集
              </button>
              <button
                onClick={() => { onDelete(event.id); setShowMenu(false); }}
                className="block w-full text-left text-xs px-3 py-2 hover:bg-danger/5 text-danger"
              >
                削除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 学び */}
      {event.learning && (
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap pl-[54px]">
          {event.learning}
        </p>
      )}

      {/* その時期の星トグル */}
      <div className="pl-[54px]">
        <button
          onClick={() => setShowPeriod(!showPeriod)}
          className="text-[11px] text-muted hover:text-accent-gold flex items-center gap-1"
        >
          <span>{showPeriod ? "▾" : "▸"}</span>
          {showPeriod ? "星を閉じる" : "この時期の星・運気を見る"}
        </button>
        {showPeriod && (
          <div className="mt-2">
            <PeriodPanel period={getLifePeriod(birthDate, event.year)} />
          </div>
        )}
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: ReturnType<typeof analyzeLifePatterns> }) {
  return (
    <div className="bg-gradient-to-br from-card-bg via-card-bg to-accent-gold/5 border border-accent-gold/30 rounded-2xl p-4 shadow-sm space-y-2.5">
      <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <span className="text-accent-gold">🌱</span> あなたの人生に見える「芽」
      </p>
      {!insight.enough && (
        <p className="text-xs text-muted leading-relaxed">
          あと{Math.max(0, 3 - insight.eventCount)}件ほど出来事を書き出すと、
          繰り返すテーマ（人生の癖・課題）が見えてきます。
        </p>
      )}
      <ul className="space-y-1.5">
        {insight.tentative.map((t, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-foreground/85 leading-relaxed">
            <span className="text-accent-gold mt-0.5">✦</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
      {insight.enough && (
        <p className="text-[10px] text-muted/70 leading-relaxed pt-1">
          ※ これはルールベースの「芽」です。AIによる深い読み解き（使命・強みの明確化）は近日公開予定です。
        </p>
      )}
    </div>
  );
}
