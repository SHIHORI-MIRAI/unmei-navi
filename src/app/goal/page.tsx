"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  loadProfile,
  loadGoals,
  saveGoal,
  deleteGoal,
  type GoalData,
  type UserProfile,
} from "@/lib/storage";
import {
  calcNumerology,
  calcNineStar,
} from "@/lib/divination";
import {
  getNineStarWave,
  getYearWave,
  calcPersonalYear,
} from "@/lib/divination";

const CATEGORIES = [
  { value: "business", label: "ビジネス・仕事", icon: "💼" },
  { value: "money", label: "お金・収入", icon: "💰" },
  { value: "health", label: "健康・美容", icon: "🌿" },
  { value: "relationship", label: "人間関係", icon: "💫" },
  { value: "learning", label: "学び・スキル", icon: "📚" },
  { value: "lifestyle", label: "暮らし・環境", icon: "🏠" },
  { value: "spiritual", label: "内面・精神", icon: "✦" },
  { value: "other", label: "その他", icon: "☽" },
] as const;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// --- 運気の季節を判定 ---
type FortuneSeason = "spring" | "summer" | "autumn" | "winter";

function getFortuneSeason(energy: number): FortuneSeason {
  if (energy >= 75) return "summer";  // 盛運期
  if (energy >= 55) return "spring";  // 上昇期
  if (energy >= 35) return "autumn";  // 下降期
  return "winter";                     // 低迷期
}

const SEASON_LABELS: Record<FortuneSeason, string> = {
  spring: "春（上昇期）",
  summer: "夏（盛運期）",
  autumn: "秋（収穫・整理期）",
  winter: "冬（充電期）",
};

const SEASON_COLORS: Record<FortuneSeason, string> = {
  spring: "#10b981",
  summer: "#f97316",
  autumn: "#eab308",
  winter: "#6b7280",
};

/** 今年〜3年後のエネルギー平均を算出 */
function calcYearEnergy(birthDate: string, year: number): number {
  const ns = getNineStarWave(birthDate, year);
  const py = calcPersonalYear(birthDate, year);
  const n = getYearWave(py);
  return Math.round((ns + n) / 2);
}

/** ゴールに対する運気診断を生成 */
interface GoalDiagnosis {
  season: FortuneSeason;
  seasonLabel: string;
  seasonColor: string;
  energy: number;
  verdict: string;         // 今動くべき？のメインメッセージ
  todayAction: string;     // 今の時期にやるべきこと
  bestYear: number | null; // 最適な年（今年でなければ）
  bestYearNote: string;    // 最適な年の説明
}

function diagnoseGoal(
  profile: UserProfile,
  category: string,
  targetDate: string
): GoalDiagnosis {
  try {
    return diagnoseGoalInner(profile, category, targetDate);
  } catch {
    return {
      season: "spring",
      seasonLabel: "判定中",
      seasonColor: "#9a8a7a",
      energy: 50,
      verdict: "運気情報の取得に問題がありました",
      todayAction: "目標に向かって一歩ずつ進みましょう",
      bestYear: null,
      bestYearNote: "",
    };
  }
}

function diagnoseGoalInner(
  profile: UserProfile,
  category: string,
  targetDate: string
): GoalDiagnosis {
  const today = new Date();
  const currentYear = today.getFullYear();
  const bd = profile.birthDate;

  // 今年のエネルギー
  const thisEnergy = calcYearEnergy(bd, currentYear);
  const season = getFortuneSeason(thisEnergy);

  // 今年〜3年後で最もエネルギーが高い年を探す
  let bestYear = currentYear;
  let bestEnergy = thisEnergy;
  const yearEnergies: { year: number; energy: number }[] = [];
  for (let y = currentYear; y <= currentYear + 3; y++) {
    const e = calcYearEnergy(bd, y);
    yearEnergies.push({ year: y, energy: e });
    if (e > bestEnergy) {
      bestEnergy = e;
      bestYear = y;
    }
  }

  // 数秘術のパーソナルイヤー
  const numerology = calcNumerology(bd, today);
  const py = numerology.personalYear;

  // 九星の位置
  const nineStar = calcNineStar(bd, currentYear);

  // --- メイン判定: 今動くべきか ---
  const verdict = (() => {
    if (season === "summer") {
      return "今は運気の夏！大きなゴールに向かって全力で動くベストタイミングです";
    }
    if (season === "spring") {
      if (bestYear === currentYear) {
        return "運気は上昇中。種をまくには良い時期です。積極的に動き始めましょう";
      }
      return `今は助走期間。${bestYear}年がピークなので、今のうちに準備を進めておくと◎`;
    }
    if (season === "autumn") {
      if (bestYear > currentYear) {
        return `今は収穫と整理の時期。大きな勝負は${bestYear}年まで待つのが賢明です`;
      }
      return "今は得たものを整理する時期。新しい挑戦より、今あるものを磨きましょう";
    }
    // winter
    if (bestYear > currentYear) {
      return `今は運気の冬。大きな行動より学びと準備に集中を。${bestYear}年に一気に動けます`;
    }
    return "今は充電期間。焦らず力を蓄えることが、次の飛躍への最短ルートです";
  })();

  // --- 今の時期にやるべきこと（カテゴリ×季節） ---
  const actionMap: Record<string, Record<FortuneSeason, string>> = {
    business: {
      summer: "新サービスのリリース・大きな契約・パートナーシップの締結に動きましょう",
      spring: "ビジネスプランの具体化・テストマーケティング・人脈づくりを始めて",
      autumn: "既存サービスの改善・顧客満足度の向上・経費の見直しに集中",
      winter: "市場リサーチ・スキルアップ・ビジネス書を読み込んで戦略を練る時期",
    },
    money: {
      summer: "投資・事業拡大・値上げなど、攻めの金銭行動を取るチャンス",
      spring: "収入の柱を増やす準備・副業の開始・投資の勉強を",
      autumn: "支出の見直し・不要なサブスクの解約・貯蓄習慣の確立を",
      winter: "お金の知識を深める時期。家計簿の見直しと長期的な資産計画を",
    },
    health: {
      summer: "新しいスポーツやダイエットプログラムに挑戦。体が応えてくれます",
      spring: "運動習慣を少しずつ始める。ウォーキングやストレッチから",
      autumn: "今の習慣を維持しつつ、食事の質を見直してみましょう",
      winter: "無理な運動は禁物。睡眠・休息の質を上げることが最優先",
    },
    relationship: {
      summer: "新しいコミュニティへの参加・イベント主催など積極的に人と関わって",
      spring: "気になる人にコンタクト・既存の関係を一歩深める行動を",
      autumn: "今の人間関係に感謝を伝える。整理すべき関係があれば手放す時期",
      winter: "少人数の深い交流を大切に。自分を理解してくれる人との時間を増やして",
    },
    learning: {
      summer: "資格試験・セミナー登壇・アウトプット重視の学びを",
      spring: "新しい分野の入門・オンライン講座の受講を始めましょう",
      autumn: "学んだことを実践に移す・ノートの整理・復習に集中",
      winter: "読書・動画学習などインプットに没頭。焦らず知識の土台を作る時期",
    },
    lifestyle: {
      summer: "引っ越し・リフォーム・大きな環境変化に最適な時期",
      spring: "小さな模様替え・断捨離・新しいルーティンを試してみて",
      autumn: "今の生活を見直し、本当に必要なものを厳選する時期",
      winter: "快適な空間づくりに集中。お気に入りの場所を整えましょう",
    },
    spiritual: {
      summer: "ワークショップ参加・新しい瞑想法の実践・発信活動を",
      spring: "毎日5分の瞑想や感謝日記を始めると大きな変化に繋がります",
      autumn: "過去を振り返り、学びを言語化する。手放すべきものを見極めて",
      winter: "深い内省の好機。一人の時間を大切にし、自分の本心と向き合って",
    },
    other: {
      summer: "積極的に行動すると良い結果に繋がる時期です",
      spring: "少しずつ動き始めましょう。小さな一歩が大きな変化を生みます",
      autumn: "今あるものを大切に。整理と見直しの時期です",
      winter: "焦らず準備を。この充電期間が次のステージへの鍵です",
    },
  };
  const todayAction = (actionMap[category] || actionMap.other)[season];

  // --- 最適年の補足 ---
  const bestYearNote = (() => {
    if (bestYear === currentYear) {
      return "今年が近年で最も運気が高い年。チャンスを逃さないで！";
    }
    const diff = bestYear - currentYear;
    const bestSeason = getFortuneSeason(bestEnergy);
    return `${diff}年後の${bestYear}年が${SEASON_LABELS[bestSeason]}のピーク（エネルギー${bestEnergy}）。それまでに土台を固めておくと一気に花開きます`;
  })();

  return {
    season,
    seasonLabel: SEASON_LABELS[season],
    seasonColor: SEASON_COLORS[season],
    energy: thisEnergy,
    verdict,
    todayAction,
    bestYear: bestYear !== currentYear ? bestYear : null,
    bestYearNote,
  };
}

export default function GoalPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");

  // フォーム状態
  const [category, setCategory] = useState("business");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.push("/profile");
      return;
    }
    setProfile(p);
    setGoals(loadGoals());
  }, [router]);

  const resetForm = useCallback(() => {
    setCategory("business");
    setDescription("");
    setTargetDate("");
    setMemo("");
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!description.trim()) return;

    const goal: GoalData = {
      id: editingId || generateId(),
      category,
      description: description.trim(),
      targetDate,
      status: "active",
      memo: memo.trim(),
      createdAt: editingId
        ? goals.find((g) => g.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    saveGoal(goal);
    setGoals(loadGoals());
    resetForm();
  }, [category, description, targetDate, memo, editingId, goals, resetForm]);

  const handleEdit = useCallback((goal: GoalData) => {
    setCategory(goal.category);
    setDescription(goal.description);
    setTargetDate(goal.targetDate);
    setMemo(goal.memo);
    setEditingId(goal.id);
    setShowForm(true);
  }, []);

  const handleToggleStatus = useCallback((goal: GoalData) => {
    const updated: GoalData = {
      ...goal,
      status: goal.status === "completed" ? "active" : "completed",
      completedAt: goal.status === "completed" ? undefined : new Date().toISOString(),
    };
    saveGoal(updated);
    setGoals(loadGoals());
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteGoal(id);
    setGoals(loadGoals());
  }, []);

  if (!profile) {
    return <p className="text-muted text-center py-10">読み込み中...</p>;
  }

  const filteredGoals = goals.filter((g) => {
    if (filter === "all") return true;
    const status = g.status || "active"; // 旧形式データ対応
    return status === filter;
  });

  const activeCount = goals.filter((g) => (g.status || "active") === "active").length;
  const completedCount = goals.filter((g) => g.status === "completed").length;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">☽</span>
        ゴール＋ロードマップ
      </h2>

      {/* 新規追加ボタン */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-accent-orange text-white rounded-xl py-3 text-sm font-medium hover:bg-accent-orange/90 transition-colors"
        >
          + 新しいゴールを設定する
        </button>
      )}

      {/* ゴール入力フォーム */}
      {showForm && (
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              {editingId ? "ゴールを編集" : "新しいゴール"}
            </h3>
            <button
              onClick={resetForm}
              className="text-xs text-muted hover:text-foreground"
            >
              キャンセル
            </button>
          </div>

          {/* カテゴリ選択 */}
          <div>
            <label className="text-xs text-muted block mb-1.5">カテゴリ</label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`text-xs py-2 px-2 rounded-lg border transition-colors text-left ${
                    category === c.value
                      ? "border-accent-orange bg-accent-orange/10 text-accent-orange"
                      : "border-card-border text-foreground/70 hover:border-accent-orange/50"
                  }`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* ゴール内容 */}
          <div>
            <label className="text-xs text-muted block mb-1.5">ゴール</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="達成したいこと"
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange"
            />
          </div>

          {/* 目標日 */}
          <div>
            <label className="text-xs text-muted block mb-1.5">目標日（任意）</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-orange"
            />
          </div>

          {/* メモ */}
          <div>
            <label className="text-xs text-muted block mb-1.5">メモ（任意）</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="具体的なステップや動機など"
              rows={2}
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange resize-none"
            />
          </div>

          {/* 運気アドバイスプレビュー */}
          {description.trim() && (
            <GoalAdvicePreview
              profile={profile}
              category={category}
              targetDate={targetDate}
            />
          )}

          {/* 保存 */}
          <button
            onClick={handleSave}
            disabled={!description.trim()}
            className="w-full bg-accent-orange text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-orange/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {editingId ? "更新する" : "ゴールを保存"}
          </button>
        </div>
      )}

      {/* フィルター */}
      {goals.length > 0 && (
        <div className="flex gap-2">
          <FilterTab
            label={`進行中 (${activeCount})`}
            active={filter === "active"}
            onClick={() => setFilter("active")}
          />
          <FilterTab
            label={`達成 (${completedCount})`}
            active={filter === "completed"}
            onClick={() => setFilter("completed")}
          />
          <FilterTab
            label="全て"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
        </div>
      )}

      {/* ゴール一覧 */}
      {filteredGoals.length > 0 ? (
        <div className="space-y-3">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              profile={profile}
              onEdit={handleEdit}
              onToggle={handleToggleStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : goals.length > 0 ? (
        <p className="text-sm text-muted text-center py-6">
          {filter === "active" ? "進行中のゴールはありません" : "達成したゴールはありません"}
        </p>
      ) : (
        <div className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm text-center">
          <p className="text-sm text-muted mb-2">まだゴールがありません</p>
          <p className="text-xs text-muted/70">
            運気の流れに合わせた目標設定で、<br />
            最適なタイミングで行動しましょう
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

function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
        active
          ? "bg-accent-orange/15 text-accent-orange border border-accent-orange/30"
          : "text-muted border border-card-border hover:border-accent-orange/30"
      }`}
    >
      {label}
    </button>
  );
}

function GoalAdvicePreview({
  profile,
  category,
  targetDate,
}: {
  profile: UserProfile;
  category: string;
  targetDate: string;
}) {
  const d = diagnoseGoal(profile, category, targetDate);

  return (
    <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-accent-gold flex items-center gap-1">
          <span>✦</span> 運気診断
        </p>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: d.seasonColor }}
        >
          {d.seasonLabel}
        </span>
      </div>
      <p className="text-sm text-foreground/90 font-medium">{d.verdict}</p>
      <p className="text-xs text-accent-gold">▸ 今やること：{d.todayAction}</p>
      {d.bestYear && (
        <p className="text-xs text-accent-orange">▸ {d.bestYearNote}</p>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  profile,
  onEdit,
  onToggle,
  onDelete,
}: {
  goal: GoalData;
  profile: UserProfile;
  onEdit: (goal: GoalData) => void;
  onToggle: (goal: GoalData) => void;
  onDelete: (id: string) => void;
}) {
  const [showAdvice, setShowAdvice] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const cat = CATEGORIES.find((c) => c.value === goal.category);
  const isCompleted = goal.status === "completed";

  const daysLeft = (() => {
    if (!goal.targetDate) return null;
    const diff = Math.ceil(
      (new Date(goal.targetDate + "T00:00:00").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  })();

  return (
    <div
      className={`bg-card-bg border rounded-2xl p-4 shadow-sm space-y-2 ${
        isCompleted ? "border-accent-gold/30 opacity-75" : "border-card-border"
      }`}
    >
      {/* ヘッダー */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(goal)}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            isCompleted
              ? "border-accent-gold bg-accent-gold text-white"
              : "border-muted/40 hover:border-accent-orange"
          }`}
        >
          {isCompleted && <span className="text-xs">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${
              isCompleted ? "line-through text-muted" : "text-foreground"
            }`}
          >
            {goal.description}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] bg-accent-orange/10 text-accent-orange px-1.5 py-0.5 rounded-full">
              {cat?.icon || "☽"} {cat?.label || goal.category}
            </span>
            {goal.targetDate && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  daysLeft !== null && daysLeft < 0
                    ? "bg-danger/10 text-danger"
                    : daysLeft !== null && daysLeft <= 30
                    ? "bg-accent-gold/10 text-accent-gold"
                    : "bg-card-border/50 text-muted"
                }`}
              >
                {goal.targetDate.replace(/-/g, "/")}
                {daysLeft !== null && !isCompleted && (
                  <span className="ml-1">
                    {daysLeft < 0
                      ? `(${Math.abs(daysLeft)}日超過)`
                      : daysLeft === 0
                      ? "(今日!)"
                      : `(残${daysLeft}日)`}
                  </span>
                )}
              </span>
            )}
            {isCompleted && goal.completedAt && (
              <span className="text-[10px] text-accent-gold">
                達成: {new Date(goal.completedAt).toLocaleDateString("ja-JP")}
              </span>
            )}
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
                onClick={() => { onEdit(goal); setShowMenu(false); }}
                className="block w-full text-left text-xs px-3 py-2 hover:bg-accent-orange/5 text-foreground/80"
              >
                編集
              </button>
              <button
                onClick={() => { onDelete(goal.id); setShowMenu(false); }}
                className="block w-full text-left text-xs px-3 py-2 hover:bg-danger/5 text-danger"
              >
                削除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* メモ */}
      {goal.memo && (
        <p className="text-xs text-muted/80 ml-8">{goal.memo}</p>
      )}

      {/* 運気診断（常時表示） */}
      {!isCompleted && (
        <GoalDiagnosisPanel profile={profile} category={goal.category} targetDate={goal.targetDate} />
      )}
    </div>
  );
}

function GoalDiagnosisPanel({
  profile,
  category,
  targetDate,
}: {
  profile: UserProfile;
  category: string;
  targetDate: string;
}) {
  const d = diagnoseGoal(profile, category, targetDate);

  return (
    <div className="bg-accent-orange/5 border border-accent-orange/15 rounded-xl p-3 space-y-2">
      {/* 季節バッジ + エネルギー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: d.seasonColor }}
          >
            運気の{d.seasonLabel}
          </span>
          <span className="text-xs text-muted">エネルギー {d.energy}/100</span>
        </div>
      </div>

      {/* メイン判定 */}
      <p className="text-sm text-foreground/90 font-medium leading-relaxed">
        {d.verdict}
      </p>

      {/* 今やるべきこと */}
      <div className="bg-white/50 rounded-lg p-2.5">
        <p className="text-[10px] text-accent-gold font-medium mb-1">今の時期にやるべきこと</p>
        <p className="text-xs text-foreground/80 leading-relaxed">{d.todayAction}</p>
      </div>

      {/* ベストタイミング */}
      <div className="flex items-start gap-1.5">
        <span className="text-accent-orange text-xs mt-0.5">▸</span>
        <p className="text-xs text-accent-orange leading-relaxed">{d.bestYearNote}</p>
      </div>
    </div>
  );
}
