"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  loadProfile,
  loadLifeEvents,
  saveLifeEvent,
  deleteLifeEvent,
  loadLifeReading,
  saveLifeReading,
  exportLifeEvents,
  importLifeEvents,
  type LifeEvent,
  type LifeReading,
  type UserProfile,
} from "@/lib/storage";
import {
  getLifePeriod,
  analyzeLifePatterns,
  buildYearCycle,
  buildCycleMatrix,
  buildLifeStory,
  CYCLE_LABELS,
  getPersonalYearMeaning,
  type LifePeriod,
} from "@/lib/divination";
// CYCLE_LABELS_KO は index から再エクスポートされていないため、モジュールから直接読み込む（参照のみ）
import { CYCLE_LABELS_KO } from "@/lib/divination/life-timeline";
import { useI18n } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/dict";
import UsageHelp from "@/components/UsageHelp";

/** カテゴリの値は保存される正の日本語表記。表示のみ翻訳する。 */
const CATEGORIES = [
  "転機", "仕事", "家族", "人間関係", "健康", "学び", "内的気づき", "その他",
];

const CATEGORY_LABELS: Record<Lang, Record<string, string>> = {
  ja: {
    転機: "転機", 仕事: "仕事", 家族: "家族", 人間関係: "人間関係",
    健康: "健康", 学び: "学び", 内的気づき: "内的気づき", その他: "その他",
  },
  ko: {
    転機: "전환점", 仕事: "일", 家族: "가족", 人間関係: "인간관계",
    健康: "건강", 学び: "배움", 内的気づき: "내적 깨달음", その他: "기타",
  },
};

/** value/emoji は言語非依存、ラベルは MAG_LABELS で翻訳 */
const MAGNITUDES: { value: number; emoji: string }[] = [
  { value: 1, emoji: "🔹" },
  { value: 2, emoji: "🔸" },
  { value: 3, emoji: "⭐" },
];

const MAG_LABELS: Record<Lang, Record<number, string>> = {
  ja: { 1: "小さな気づき", 2: "できごと", 3: "人生の節目" },
  ko: { 1: "작은 깨달음", 2: "사건", 3: "인생의 전환점" },
};

const EMOTIONS: { value: number; emoji: string }[] = [
  { value: 1, emoji: "🌧️" },
  { value: 2, emoji: "☁️" },
  { value: 3, emoji: "⛅" },
  { value: 4, emoji: "🌤️" },
  { value: 5, emoji: "☀️" },
];

const EMO_LABELS: Record<Lang, Record<number, string>> = {
  ja: { 1: "つらい", 2: "モヤモヤ", 3: "ふつう", 4: "良い", 5: "最高" },
  ko: { 1: "괴로움", 2: "답답함", 3: "보통", 4: "좋음", 5: "최고" },
};

/** 書き出しを助ける問い（ライフレビューは最初の一件が一番むずかしい） */
const STARTER_PROMPTS: { category: string; labels: Record<Lang, string> }[] = [
  { category: "転機", labels: { ja: "初めての大きな決断", ko: "처음으로 한 큰 결단" } },
  { category: "人間関係", labels: { ja: "転機になった出会い・別れ", ko: "전환점이 된 만남·이별" } },
  { category: "学び", labels: { ja: "夢中になったこと", ko: "푹 빠졌던 일" } },
  { category: "健康", labels: { ja: "乗り越えた困難", ko: "극복한 어려움" } },
  { category: "仕事", labels: { ja: "誇りに思う瞬間", ko: "자랑스러운 순간" } },
  { category: "内的気づき", labels: { ja: "価値観が変わった気づき", ko: "가치관이 바뀐 깨달음" } },
];

/** この画面固有の静的文言（二言語） */
const L: Record<Lang, Record<string, string>> = {
  ja: {
    title: "人生の棚卸し",
    desc: "人生の出来事を時系列に並べ、その時期の運気や星の節目を重ねて、自分の癖・課題・強みを見つめ直すページです。",
    helpTitle: "人生の棚卸しの使い方",
    addEvent: "＋ 出来事・気づきを追加",
    hint: "思い出すヒント：",
    formEdit: "出来事を編集",
    formRecord: "出来事を記録",
    yearField: "年（西暦）",
    monthField: "月（任意）",
    titleField: "出来事・気づき",
    titlePh: "例：転職を決意した / 大切な人と出会った",
    category: "カテゴリ",
    magnitude: "出来事の大きさ",
    emotion: "当時の気持ち（ありのままでOK）",
    learning: "そこで得た気づき・学び（任意・前向きに）",
    learningPh: "この経験から得たもの、今の自分につながっていること...",
    update: "更新する",
    save: "保存する",
    emptyTitle: "まだ出来事がありません",
    footnote:
      "※ 星の節目は年齢による目安です。占いは参考情報として、つらい記憶を無理に振り返る必要はありません。ご自身のペースでどうぞ。",
    pDataN: "数秘の年運",
    pNine: "九星の巡り",
    starOpen: "この時期の星・運気を見る",
    starClose: "星を閉じる",
    backupTitle: "保存とバックアップ",
    backupSave: "⬇ バックアップを保存",
    backupRestore: "⬆ 復元（付け足し）",
    storyTitle: "わたしの人生物語",
    copy: "コピー",
    copied: "コピーしました",
    secPatterns: "繰り返すテーマ",
    secStars: "星との重なり",
    secNow: "今、そしてこれから",
    storyFoot:
      "※ あなたの年表と星の巡りから自動で紡いだ物語です。出来事を追記すると更新されます。",
    cycleTitle: "あなたの9年サイクル",
    upcomingTitle: "これからのリズム",
    matrixTitle: "9年ごとの相似性マップ",
    scrollHint: "← 横にスクロールできます →",
    repeatFound: "位置ごとに見つかった「繰り返し」",
    now: "今",
    matrixFoot:
      "※ 数秘の9年周期に基づく“傾向”です。当てはまらない年を無理に意味づける必要はありません。人生を選び、行動して形にするのは、いつでもあなた自身です。",
    aiTitle: "AIで深く読み解く",
    aiDesc:
      "あなたの年表全体をAIが読み解き、繰り返すパターン・人生の課題・使命・強みを、あなただけの言葉で明確にします。",
    aiGenerating: "読み解いています…（30秒ほどかかります）",
    aiAgain: "もう一度読み解く",
    aiGo: "AIで深く読み解く",
    aiPreparing:
      "AI読み解きはまだ準備中です（現在はルールベースの読み解きをご利用いただけます）。",
    aiFail: "読み解きに失敗しました",
    aiCommError: "通信に失敗しました。時間をおいて試してください。",
    insightTitle: "あなたの人生に見える「芽」",
    insightFoot:
      "※ これはルールベースの「芽」です。AIによる深い読み解き（使命・強みの明確化）は近日公開予定です。",
  },
  ko: {
    title: "인생의 되돌아보기",
    desc: "인생의 사건을 시간순으로 나열하고, 그 시기의 운기나 별의 전환점을 겹쳐, 자신의 버릇·과제·강점을 다시 바라보는 페이지입니다.",
    helpTitle: "인생의 되돌아보기 사용법",
    addEvent: "＋ 사건·깨달음 추가",
    hint: "떠올리는 힌트: ",
    formEdit: "사건을 편집",
    formRecord: "사건을 기록",
    yearField: "연도(서기)",
    monthField: "월(선택)",
    titleField: "사건·깨달음",
    titlePh: "예: 이직을 결심했다 / 소중한 사람을 만났다",
    category: "카테고리",
    magnitude: "사건의 크기",
    emotion: "당시의 기분(있는 그대로 OK)",
    learning: "거기서 얻은 깨달음·배움(선택·긍정적으로)",
    learningPh: "이 경험에서 얻은 것, 지금의 나로 이어지는 것...",
    update: "업데이트",
    save: "저장",
    emptyTitle: "아직 사건이 없습니다",
    footnote:
      "※ 별의 전환점은 나이에 따른 대략적 기준입니다. 점술은 참고 정보로서, 괴로운 기억을 무리하게 되돌아볼 필요는 없습니다. 자신의 페이스로 하세요.",
    pDataN: "수비의 연운",
    pNine: "구성의 순환",
    starOpen: "이 시기의 별·운기 보기",
    starClose: "별 닫기",
    backupTitle: "저장과 백업",
    backupSave: "⬇ 백업 저장",
    backupRestore: "⬆ 복원(추가)",
    storyTitle: "나의 인생 이야기",
    copy: "복사",
    copied: "복사했습니다",
    secPatterns: "반복되는 테마",
    secStars: "별과의 겹침",
    secNow: "지금, 그리고 앞으로",
    storyFoot:
      "※ 당신의 연표와 별의 순환에서 자동으로 엮어낸 이야기입니다. 사건을 추가하면 갱신됩니다.",
    cycleTitle: "당신의 9년 사이클",
    upcomingTitle: "앞으로의 리듬",
    matrixTitle: "9년마다의 유사성 맵",
    scrollHint: "← 옆으로 스크롤할 수 있습니다 →",
    repeatFound: "위치별로 발견된 「반복」",
    now: "지금",
    matrixFoot:
      "※ 수비의 9년 주기에 근거한 “경향”입니다. 들어맞지 않는 해를 무리하게 의미 부여할 필요는 없습니다. 인생을 선택하고, 행동하여 형태로 만드는 것은, 언제나 당신 자신입니다.",
    aiTitle: "AI로 깊이 읽어내기",
    aiDesc:
      "당신의 연표 전체를 AI가 읽어내어, 반복되는 패턴·인생의 과제·사명·강점을, 당신만의 언어로 명확하게 합니다.",
    aiGenerating: "읽어내고 있습니다…(30초 정도 걸립니다)",
    aiAgain: "다시 읽어내기",
    aiGo: "AI로 깊이 읽어내기",
    aiPreparing:
      "AI 읽어내기는 아직 준비 중입니다(현재는 규칙 기반 읽어내기를 이용하실 수 있습니다).",
    aiFail: "읽어내기에 실패했습니다",
    aiCommError: "통신에 실패했습니다. 시간을 두고 다시 시도해 주세요.",
    insightTitle: "당신의 인생에 보이는 「싹」",
    insightFoot:
      "※ 이것은 규칙 기반의 「싹」입니다. AI에 의한 깊은 읽어내기(사명·강점의 명확화)는 곧 공개 예정입니다.",
  },
};

/** 使い方ステップ（JSX・二言語） */
const HELP_STEPS: Record<Lang, ReactNode[]> = {
  ja: [
    <>大きな出来事（転職・出会い・別れ・決断など）から、<strong>小さな気づき</strong>まで、思い出した順でOK。年（できれば月）と一言を記録します。</>,
    <>つらかった出来事も<strong>ありのまま</strong>で大丈夫。感情はそのまま、意味づけ（学び）は前向きに残せます。</>,
    <>保存すると、その時期の<strong>運気（数秘・九星）や星の節目（土星回帰など）</strong>が自動で重なります。</>,
    <>3件以上たまると、<strong>繰り返すテーマ＝人生の癖・課題の「芽」</strong>が見えてきます。</>,
  ],
  ko: [
    <>큰 사건(이직·만남·이별·결단 등)부터 <strong>작은 깨달음</strong>까지, 떠오른 순서대로 OK. 연도(가능하면 월)와 한마디를 기록합니다.</>,
    <>괴로웠던 사건도 <strong>있는 그대로</strong> 괜찮습니다. 감정은 그대로, 의미 부여(배움)는 긍정적으로 남길 수 있습니다.</>,
    <>저장하면 그 시기의 <strong>운기(수비·구성기학)나 별의 전환점(토성 회귀 등)</strong>이 자동으로 겹쳐집니다.</>,
    <>3건 이상 모이면 <strong>반복되는 테마＝인생의 버릇·과제의 「싹」</strong>이 보이기 시작합니다.</>,
  ],
};

/** バックアップ説明（JSX・二言語） */
const BACKUP_DESC: Record<Lang, ReactNode> = {
  ja: (
    <>
      入力した内容は<strong className="text-foreground/80">自動で保存</strong>され、
      いつでも追記できます（次に開いたときも残っています）。
      機種変更やブラウザの変更に備えて、ときどきバックアップを保存しておくと安心です。
    </>
  ),
  ko: (
    <>
      입력한 내용은<strong className="text-foreground/80">자동으로 저장</strong>되며,
      언제든 추가할 수 있습니다(다음에 열었을 때도 남아 있습니다).
      기기 변경이나 브라우저 변경에 대비해, 가끔 백업을 저장해 두면 안심입니다.
    </>
  ),
};

/** 相似性マップ説明（JSX・二言語） */
const MATRIX_DESC: Record<Lang, ReactNode> = {
  ja: (
    <>
      人生を9年周期で“積み重ねて”並べました。
      <strong className="text-foreground/80">縦（上から下）</strong>
      に見ると、同じ数の年に似たことが起きていないか——あなただけのリズムが見えてきます。
      記録の少ない年は、無理に意味づけしません。
    </>
  ),
  ko: (
    <>
      인생을 9년 주기로 “쌓아서” 나열했습니다.
      <strong className="text-foreground/80">세로(위에서 아래로)</strong>
      로 보면, 같은 수의 해에 비슷한 일이 일어나지 않았는지——당신만의 리듬이 보이기 시작합니다.
      기록이 적은 해는 무리하게 의미를 부여하지 않습니다.
    </>
  ),
};

/** AI読み解きの各セクション見出し（二言語） */
const AI_SECTIONS: {
  key: keyof LifeReading;
  labels: Record<Lang, string>;
  emoji: string;
}[] = [
  { key: "themes", labels: { ja: "繰り返すテーマ（人生の癖・課題）", ko: "반복되는 테마(인생의 버릇·과제)" }, emoji: "🔁" },
  { key: "timing", labels: { ja: "出来事と星の重なり", ko: "사건과 별의 겹침" }, emoji: "🪐" },
  { key: "strengths", labels: { ja: "あなたの強み", ko: "당신의 강점" }, emoji: "💪" },
  { key: "mission", labels: { ja: "今世の使命", ko: "이번 생의 사명" }, emoji: "🌟" },
  { key: "message", labels: { ja: "これからへのメッセージ", ko: "앞으로를 향한 메시지" }, emoji: "💌" },
];

/** 相似性マップの確信度ラベル（二言語） */
const CONF_LABELS: Record<Lang, Record<string, string>> = {
  ja: { clear: "くっきり", soft: "ゆるやか", thin: "手がかり少" },
  ko: { clear: "뚜렷함", soft: "완만함", thin: "단서 적음" },
};

/** 年代グループの見出しラベル */
function decadeLabel(decade: number, lang: Lang): string {
  if (decade === 0) return lang === "ko" ? "유년기(0~9세)" : "幼少期（0〜9歳）";
  return lang === "ko" ? `${decade}대` : `${decade}代`;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function LifePage() {
  const router = useRouter();
  const { t, lang } = useI18n();
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

  const formRef = useRef<HTMLDivElement>(null);

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

  // フォームを開いたら、その位置まで自動スクロール（下のカードで編集を押しても
  // フォームが画面外で開いて「編集できない」ように見える問題を防ぐ）
  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm, editingId]);

  const handleDelete = useCallback((id: string) => {
    deleteLifeEvent(id);
    setEvents(loadLifeEvents());
  }, []);

  const startWithPrompt = useCallback(
    (p: { category: string; labels: Record<Lang, string> }) => {
      setTitle(p.labels[lang]);
      setCategory(p.category);
      setShowForm(true);
    },
    [lang]
  );

  // 年→月の昇順（人生の物語＝時系列）
  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) => a.year - b.year || (a.month ?? 0) - (b.month ?? 0)
      ),
    [events]
  );

  const insight = useMemo(
    () => (profile ? analyzeLifePatterns(events, profile.birthDate, lang) : null),
    [events, profile, lang]
  );

  const birthYear = profile ? Number(profile.birthDate.split("-")[0]) : nowYear;

  // 年代（0代/10代/20代…）でグルーピング
  const groups = useMemo(() => {
    const by = new Map<number, LifeEvent[]>();
    for (const e of sorted) {
      const age = e.year - birthYear;
      const decade = Math.floor(Math.max(0, age) / 10) * 10;
      const arr = by.get(decade) ?? [];
      arr.push(e);
      by.set(decade, arr);
    }
    return [...by.entries()].sort((a, b) => a[0] - b[0]);
  }, [sorted, birthYear]);

  if (!profile) {
    return <p className="text-muted text-center py-10">{t("astro.loading")}</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">📜</span>
        {L[lang].title}
      </h2>
      <p className="text-xs text-muted leading-relaxed -mt-1">{L[lang].desc}</p>

      <UsageHelp
        storageKey="usage-help-life"
        title={L[lang].helpTitle}
        steps={HELP_STEPS[lang]}
      />

      {/* 追加ボタン＋思い出すヒント */}
      {!showForm && (
        <div className="space-y-2">
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-accent-orange text-white rounded-xl py-3 text-sm font-medium hover:bg-accent-orange/90 transition-colors"
          >
            {L[lang].addEvent}
          </button>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-muted">{L[lang].hint}</span>
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p.category + p.labels.ja}
                onClick={() => startWithPrompt(p)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-accent-gold/30 bg-accent-gold/5 text-foreground/70 hover:border-accent-gold hover:text-accent-orange transition-colors"
              >
                {p.labels[lang]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 入力フォーム */}
      {showForm && (
        <div
          ref={formRef}
          className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              {editingId ? L[lang].formEdit : L[lang].formRecord}
            </h3>
            <button onClick={resetForm} className="text-xs text-muted hover:text-foreground">
              {t("common.cancel")}
            </button>
          </div>

          {/* 年・月 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted block mb-1.5">{L[lang].yearField}</label>
              <input
                type="number"
                value={year}
                min={birthYear}
                max={nowYear}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-orange"
              />
              <p className="text-[10px] text-muted mt-1">
                {year
                  ? lang === "ko"
                    ? `${year - birthYear}세 무렵`
                    : `${year - birthYear}歳ごろ`
                  : ""}
              </p>
            </div>
            <div className="w-28">
              <label className="text-xs text-muted block mb-1.5">{L[lang].monthField}</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-orange"
              >
                <option value="">—</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {lang === "ko" ? `${m}월` : `${m}月`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* タイトル */}
          <div>
            <label className="text-xs text-muted block mb-1.5">{L[lang].titleField}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={L[lang].titlePh}
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange"
            />
          </div>

          {/* カテゴリ */}
          <div>
            <label className="text-xs text-muted block mb-1.5">{L[lang].category}</label>
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
                  {CATEGORY_LABELS[lang][c]}
                </button>
              ))}
            </div>
          </div>

          {/* 大きさ */}
          <div>
            <label className="text-xs text-muted block mb-1.5">{L[lang].magnitude}</label>
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
                  <span className="text-[10px] text-muted">{MAG_LABELS[lang][mg.value]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 当時の感情（ありのまま） */}
          <div>
            <label className="text-xs text-muted block mb-1.5">{L[lang].emotion}</label>
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
                  <span className="text-[10px] text-muted">{EMO_LABELS[lang][em.value]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 学び・気づき */}
          <div>
            <label className="text-xs text-muted block mb-1.5">{L[lang].learning}</label>
            <textarea
              value={learning}
              onChange={(e) => setLearning(e.target.value)}
              placeholder={L[lang].learningPh}
              rows={3}
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange resize-none"
            />
          </div>

          {/* その時期の星プレビュー */}
          {year >= birthYear && (
            <PeriodPanel period={getLifePeriod(profile.birthDate, year, lang)} compact />
          )}

          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full bg-accent-orange text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-orange/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {editingId ? L[lang].update : L[lang].save}
          </button>
        </div>
      )}

      {/* 保存とバックアップ */}
      <BackupCard onImported={() => setEvents(loadLifeEvents())} />

      {/* 気づきの芽（3件以上でパターン抽出） */}
      {insight && insight.eventCount > 0 && <InsightCard insight={insight} />}

      {/* あなたの9年サイクル（数秘×出来事） */}
      <YearCycleSection profile={profile} events={events} />

      {/* 9年ごとの相似性マップ（積み重ねマトリクス・縦読み） */}
      <CycleMatrixSection profile={profile} events={events} />

      {/* わたしの人生物語（出来事×星の巡り） */}
      <LifeStorySection profile={profile} events={events} />

      {/* タイムライン（年代グループ） */}
      {sorted.length > 0 ? (
        <div className="space-y-5">
          {groups.map(([decade, evs]) => (
            <div key={decade} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent-gold whitespace-nowrap">
                  {decadeLabel(decade, lang)}
                </span>
                <span className="flex-1 h-px bg-accent-gold/20" />
                <span className="text-[10px] text-muted">
                  {lang === "ko" ? `${evs.length}건` : `${evs.length}件`}
                </span>
              </div>
              {evs.map((e) => (
                <LifeEventCard
                  key={e.id}
                  event={e}
                  birthDate={profile.birthDate}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm text-center">
          <p className="text-sm text-muted mb-2">{L[lang].emptyTitle}</p>
          <p className="text-xs text-muted/70">
            {lang === "ko" ? (
              <>
                기억나는 큰 사건부터,<br />
                하나씩 적어 봅시다
              </>
            ) : (
              <>
                覚えている大きな出来事から、<br />
                ひとつずつ書き出してみましょう
              </>
            )}
          </p>
        </div>
      )}

      {/* AIで深く読み解く（Phase 2） */}
      <AiReadingSection profile={profile} events={events} />

      <p className="text-center text-xs text-muted/60 px-4 leading-relaxed">
        {L[lang].footnote}
      </p>
    </div>
  );
}

// --- サブコンポーネント ---

/** その時期の運気・星の節目パネル */
function PeriodPanel({ period, compact = false }: { period: LifePeriod; compact?: boolean }) {
  const { lang } = useI18n();
  return (
    <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-xl p-3 space-y-2">
      <p className="text-xs font-medium text-accent-gold flex items-center gap-1">
        <span>✦</span>{" "}
        {lang === "ko"
          ? `${period.age}세 무렵(${period.year}년)의 별과 운기`
          : `${period.age}歳ごろ（${period.year}年）の星と運気`}
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted">{L[lang].pDataN}</span>
          <p className="text-foreground/90 font-medium">
            {period.personalYear}：{period.personalYearTheme}
          </p>
        </div>
        <div>
          <span className="text-muted">{L[lang].pNine}</span>
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
  const { t, lang } = useI18n();
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
              <span className="text-[8px] text-muted">{lang === "ko" ? "세" : "歳"}</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm">{mag?.emoji}</span>
              <p className="text-sm font-bold text-foreground leading-tight">{event.title}</p>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] text-muted">
                {lang === "ko"
                  ? `${event.year}년${event.month ? `${event.month}월` : ""}`
                  : `${event.year}年${event.month ? `${event.month}月` : ""}`}
              </span>
              <span className="text-[10px] bg-accent-orange/10 text-accent-orange px-1.5 py-0.5 rounded-full">
                {CATEGORY_LABELS[lang][event.category] ?? event.category}
              </span>
              <span className="text-[11px]" title={em ? EMO_LABELS[lang][em.value] : ""}>
                {em?.emoji}
              </span>
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
                {t("common.edit")}
              </button>
              <button
                onClick={() => { onDelete(event.id); setShowMenu(false); }}
                className="block w-full text-left text-xs px-3 py-2 hover:bg-danger/5 text-danger"
              >
                {t("common.delete")}
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
          {showPeriod ? L[lang].starClose : L[lang].starOpen}
        </button>
        {showPeriod && (
          <div className="mt-2">
            <PeriodPanel period={getLifePeriod(birthDate, event.year, lang)} />
          </div>
        )}
      </div>
    </div>
  );
}

/** 保存とバックアップ（自動保存の安心表示＋書き出し/復元） */
function BackupCard({ onImported }: { onImported: () => void }) {
  const { lang } = useI18n();
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function download() {
    try {
      const blob = new Blob([exportLifeEvents()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `jinsei-tanaoroshi-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg(
        lang === "ko"
          ? "백업을 저장했습니다. 소중히 보관해 주세요."
          : "バックアップを保存しました。大切に保管してください。"
      );
    } catch {
      setMsg(lang === "ko" ? "저장에 실패했습니다." : "保存に失敗しました。");
    }
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importLifeEvents(String(reader.result));
      if (res.ok) {
        setMsg(
          lang === "ko"
            ? `백업에서 ${res.added}건을 복원했습니다.`
            : `バックアップから ${res.added}件 を復元しました。`
        );
        onImported();
      } else {
        setMsg(
          lang === "ko"
            ? "복원할 수 없었습니다. 파일을 확인해 주세요."
            : "復元できませんでした。ファイルをご確認ください。"
        );
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2.5">
      <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <span className="text-accent-gold">💾</span> {L[lang].backupTitle}
      </p>
      <p className="text-[11px] text-muted leading-relaxed">{BACKUP_DESC[lang]}</p>
      <div className="flex gap-2">
        <button
          onClick={download}
          className="flex-1 bg-accent-orange/10 text-accent-orange border border-accent-orange/30 rounded-xl py-2 text-xs font-medium hover:bg-accent-orange/15 transition-colors"
        >
          {L[lang].backupSave}
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 bg-white border border-card-border rounded-xl py-2 text-xs font-medium text-muted hover:border-accent-gold transition-colors"
        >
          {L[lang].backupRestore}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          className="hidden"
        />
      </div>
      {msg && (
        <p className="text-[11px] text-accent-gold bg-accent-gold/5 rounded-lg px-3 py-2 leading-relaxed">
          {msg}
        </p>
      )}
    </div>
  );
}

/** わたしの人生物語（出来事×星の巡りを流れる文章に紡ぐ）— ルールベース・API不要 */
function LifeStorySection({
  profile,
  events,
}: {
  profile: UserProfile;
  events: LifeEvent[];
}) {
  const { lang } = useI18n();
  const nowYear = new Date().getFullYear();
  const [copied, setCopied] = useState(false);

  const story = useMemo(
    () => buildLifeStory(profile.birthDate, events, nowYear, lang),
    [profile.birthDate, events, nowYear, lang]
  );

  if (events.length < 3) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(story.fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="bg-gradient-to-br from-card-bg via-card-bg to-accent-gold/5 border border-accent-gold/30 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <span className="text-accent-gold">📖</span> {L[lang].storyTitle}
        </h3>
        <button
          onClick={copy}
          className="flex-shrink-0 text-[11px] bg-white border border-card-border rounded-full px-3 py-1 text-muted hover:border-accent-gold transition-colors"
        >
          {copied ? L[lang].copied : L[lang].copy}
        </button>
      </div>

      <p className="font-mincho text-sm text-foreground/90 leading-relaxed">
        {story.intro}
      </p>

      {story.chapters.map((c, i) => (
        <div key={i} className="space-y-1">
          <p className="text-xs font-bold text-accent-orange">【{c.label}】</p>
          <p className="text-sm text-foreground/85 leading-relaxed">{c.text}</p>
        </div>
      ))}

      <div className="space-y-1 pt-2 border-t border-card-border">
        <p className="text-xs font-bold text-accent-gold">{L[lang].secPatterns}</p>
        <p className="text-sm text-foreground/85 leading-relaxed">{story.patterns}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-accent-gold">{L[lang].secStars}</p>
        <p className="text-sm text-foreground/85 leading-relaxed">{story.stars}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-accent-gold">{L[lang].secNow}</p>
        <p className="text-sm text-foreground/85 leading-relaxed">{story.now}</p>
      </div>

      <p className="text-[10px] text-muted/60 leading-relaxed">{L[lang].storyFoot}</p>
    </section>
  );
}

/** あなたの9年サイクル（数秘パーソナルイヤー × 出来事）— ルールベース・API不要 */
function YearCycleSection({
  profile,
  events,
}: {
  profile: UserProfile;
  events: LifeEvent[];
}) {
  const { lang } = useI18n();
  const nowYear = new Date().getFullYear();
  const CL = lang === "ko" ? CYCLE_LABELS_KO : CYCLE_LABELS;

  const cycle = useMemo(
    () => buildYearCycle(profile.birthDate, events, nowYear, lang),
    [profile.birthDate, events, nowYear, lang]
  );

  if (events.length < 3) return null;

  const cur = cycle.slots.find((s) => s.number === cycle.currentNumber);
  const curMeaning = getPersonalYearMeaning(cycle.currentNumber, lang);

  return (
    <section className="space-y-3">
      {/* 今年の位置＋あなたの型 */}
      <div className="bg-gradient-to-br from-accent-orange/10 via-card-bg to-accent-gold/5 border border-accent-orange/25 rounded-2xl p-4 shadow-sm space-y-3">
        <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <span className="text-accent-gold">🔄</span> {L[lang].cycleTitle}
        </p>

        <div className="bg-white/60 rounded-xl px-3.5 py-3 space-y-1">
          <p className="text-[11px] text-muted">
            {lang === "ko" ? `${nowYear}년·당신은 지금` : `${nowYear}年・あなたは今`}
          </p>
          <p className="text-base font-bold text-accent-orange">
            {lang === "ko"
              ? `${cycle.currentNumber} 「${cur?.label}」의 해`
              : `${cycle.currentNumber}「${cur?.label}」の年`}
            {cycle.currentRaw !== cycle.currentNumber && (
              <span className="text-xs text-muted font-normal ml-1">
                {lang === "ko" ? `(수비 ${cycle.currentRaw})` : `（数秘${cycle.currentRaw}）`}
              </span>
            )}
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed">
            {curMeaning.advice}
          </p>
        </div>

        {cur && cur.events.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-accent-gold font-medium">
              {lang === "ko"
                ? `과거 「${cur.label}」의 해에, 당신이 해온 일`
                : `過去の「${cur.label}」の年に、あなたがしてきたこと`}
            </p>
            {cur.events.map((ev, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-[12px] bg-white/60 rounded-lg px-3 py-1.5"
              >
                <span className="text-muted whitespace-nowrap font-medium">
                  {lang === "ko" ? `${ev.year}·${ev.age}세` : `${ev.year}・${ev.age}歳`}
                </span>
                <span className="text-foreground/85">{ev.title}</span>
              </div>
            ))}
            <p className="text-[11px] text-muted leading-relaxed pt-0.5">
              {lang === "ko"
                ? `이것이 「${cur.label}의 해」의 당신의 패턴입니다. 올해도 같은 흐름을 의식하면 흐름을 탈 수 있습니다.`
                : `これが「${cur.label}の年」のあなたの型です。今年も同じ流れを意識すると波に乗れます。`}
            </p>
          </div>
        )}
      </div>

      {/* これからのリズム */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <p className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>›</span> {L[lang].upcomingTitle}
        </p>
        <div className="space-y-1.5">
          {cycle.upcoming.map((u) => (
            <div key={u.year} className="flex items-center gap-2 text-[12px]">
              <span className="w-14 text-muted whitespace-nowrap">
                {lang === "ko" ? `${u.year}년` : `${u.year}年`}
              </span>
              <span className="font-bold text-foreground whitespace-nowrap">
                {u.number}「{CL[u.number].label}」
              </span>
              <span className="text-muted leading-tight">
                {CL[u.number].hint}
              </span>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}

/** 9年ごとの相似性マップ（サイクルを積み重ね、縦に読むと繰り返しが見える） */
function CycleMatrixSection({
  profile,
  events,
}: {
  profile: UserProfile;
  events: LifeEvent[];
}) {
  const { lang } = useI18n();
  const nowYear = new Date().getFullYear();

  const matrix = useMemo(
    () => buildCycleMatrix(profile.birthDate, events, nowYear, lang),
    [profile.birthDate, events, nowYear, lang]
  );

  if (events.length < 3) return null;

  const CONF: Record<string, { label: string; cls: string }> = {
    clear: { label: CONF_LABELS[lang].clear, cls: "bg-accent-orange text-white" },
    soft: { label: CONF_LABELS[lang].soft, cls: "bg-accent-gold/15 text-accent-gold" },
    thin: { label: CONF_LABELS[lang].thin, cls: "border border-card-border text-muted" },
  };
  const gridCols = { gridTemplateColumns: "4.2rem repeat(9, minmax(64px, 1fr))" };
  const futureRow = matrix.rows.find((r) => r.isFuture);
  const withEvents = matrix.columns.filter((c) => c.events.length > 0);

  return (
    <section className="space-y-3">
      <div className="bg-gradient-to-br from-accent-gold/10 via-card-bg to-accent-orange/5 border border-accent-gold/30 rounded-2xl p-4 shadow-sm space-y-2">
        <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <span className="text-accent-gold">🧭</span> {L[lang].matrixTitle}
        </p>
        <p className="text-[11px] text-muted leading-relaxed">{MATRIX_DESC[lang]}</p>
      </div>

      {/* マトリクス本体（横スクロール） */}
      <div className="overflow-x-auto rounded-2xl border border-card-border bg-card-bg shadow-sm">
        <div className="min-w-[640px]">
          {/* ヘッダー行 */}
          <div className="grid" style={gridCols}>
            <div className="sticky left-0 z-10 bg-card-bg border-b border-r border-card-border" />
            {matrix.columns.map((c) => (
              <div
                key={c.position}
                className="p-1.5 text-center border-b border-r border-card-border/50 bg-accent-gold/5"
              >
                <div className="text-base font-bold text-accent-orange font-mincho leading-none">
                  {c.position}
                </div>
                <div className="text-[9px] text-muted mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>
          {/* サイクル行 */}
          {matrix.rows.map((row) => (
            <div key={row.startYear} className="grid" style={gridCols}>
              <div
                className={`sticky left-0 z-10 p-1.5 border-b border-r border-card-border/50 flex flex-col justify-center ${
                  row.isFuture ? "bg-accent-gold/[0.04]" : "bg-card-bg"
                }`}
              >
                <div className="text-[11px] font-bold text-foreground font-mincho tabular-nums leading-tight">
                  {String(row.startYear).slice(2)}→{String(row.endYear).slice(2)}
                </div>
                <div className="text-[8px] text-muted">
                  {lang === "ko"
                    ? `${row.ageStart}~${row.ageEnd}세`
                    : `${row.ageStart}〜${row.ageEnd}歳`}
                </div>
              </div>
              {row.cells.map((cell) => (
                <div
                  key={cell.position}
                  className={`p-1.5 border-b border-r border-card-border/40 text-[10px] leading-tight ${
                    cell.isCurrent
                      ? "bg-accent-orange/15"
                      : cell.isFuture
                      ? "bg-accent-gold/[0.03] italic"
                      : ""
                  }`}
                >
                  <div
                    className={`font-mincho font-bold tabular-nums ${
                      cell.isCurrent ? "text-accent-orange" : "text-accent-gold"
                    }`}
                  >
                    {cell.year}
                    {cell.isCurrent && (
                      <span className="ml-1 text-[8px] bg-accent-orange text-white rounded-full px-1 py-0.5 not-italic align-middle">
                        {L[lang].now}
                      </span>
                    )}
                  </div>
                  {cell.events.length > 0 ? (
                    <div className="text-foreground/80 mt-0.5">
                      {cell.events[0].title.length > 9
                        ? cell.events[0].title.slice(0, 9) + "…"
                        : cell.events[0].title}
                      {cell.events.length > 1 && (
                        <span className="text-muted">＋{cell.events.length - 1}</span>
                      )}
                    </div>
                  ) : cell.isFuture ? (
                    <div className="text-muted/70 mt-0.5">
                      {matrix.columns[cell.position - 1].label}
                    </div>
                  ) : (
                    <div className="text-muted/30 mt-0.5">—</div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-muted/70 text-center">{L[lang].scrollHint}</p>

      {/* 位置ごとの深掘り（出来事のある列のみ） */}
      {withEvents.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-accent-gold font-medium">{L[lang].repeatFound}</p>
          {withEvents.map((c) => (
            <div key={c.position} className="bg-card-bg border border-card-border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-accent-orange font-mincho leading-none">
                  {c.position}
                </span>
                <span className="text-xs font-bold text-foreground">{c.label}</span>
                <span
                  className={`ml-auto text-[9px] px-2 py-0.5 rounded-full ${CONF[c.confidence].cls}`}
                >
                  {CONF[c.confidence].label}
                </span>
              </div>
              <ul className="space-y-0.5">
                {c.events.map((ev, i) => (
                  <li key={i} className="text-[11px] text-foreground/80 leading-relaxed">
                    <span className="text-accent-gold font-medium tabular-nums">{ev.year}</span>
                    {lang === "ko" ? `(${ev.age}세)` : `（${ev.age}歳）`}
                    {ev.title}
                  </li>
                ))}
              </ul>
              {c.confidence !== "thin" && (
                <p className="text-[10px] text-muted mt-1.5 leading-relaxed">
                  {lang === "ko"
                    ? `이 「${c.label}의 해」에, 당신은 반복해서 같은 성질의 일을 해온 것 같습니다.`
                    : `この「${c.label}の年」に、あなたは繰り返し同じ質のことをしてきたようです。`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 次の9年（未来サイクル・過去の同じ位置をヒントに） */}
      {futureRow && (
        <div className="bg-gradient-to-br from-accent-orange/10 via-card-bg to-accent-gold/5 border border-accent-orange/25 rounded-2xl p-4 shadow-sm space-y-2">
          <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <span className="text-accent-gold">✨</span>{" "}
            {lang === "ko"
              ? `다음 9년(${futureRow.startYear}~${futureRow.endYear})`
              : `次の9年（${futureRow.startYear}〜${futureRow.endYear}）`}
          </p>
          <p className="text-[11px] text-muted leading-relaxed">
            {lang === "ko"
              ? "다음 같은 위치에서는, 과거에 무엇을 해왔는지——그것이 힌트가 됩니다(단정이 아니라 경향)."
              : "次の同じ位置では、過去に何をしてきたか——それがヒントになります（断定ではなく傾向）。"}
          </p>
          <div className="space-y-1.5">
            {futureRow.cells.map((cell) => {
              const col = matrix.columns[cell.position - 1];
              return (
                <div key={cell.position} className="flex items-start gap-2 text-[11px]">
                  <span className="w-10 flex-shrink-0 font-bold text-accent-orange font-mincho tabular-nums">
                    {cell.year}
                  </span>
                  <div className="leading-tight">
                    <span className="font-bold text-foreground">
                      {cell.position}「{col.label}」
                    </span>
                    <span className="text-muted"> — {col.hint}</span>
                    {col.events.length > 0 && (
                      <div className="text-muted/80 mt-0.5">
                        {lang === "ko" ? "과거 이 위치: " : "過去のこの位置："}
                        {col.events.map((e) => e.year).join("・")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted/60 text-center leading-relaxed">
        {L[lang].matrixFoot}
      </p>
    </section>
  );
}

/** AIによる深い読み解き（サーバー経由でClaudeを呼ぶ） */
function AiReadingSection({
  profile,
  events,
}: {
  profile: UserProfile;
  events: LifeEvent[];
}) {
  const { lang } = useI18n();
  const [reading, setReading] = useState<LifeReading | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReading(loadLifeReading());
  }, []);

  const enough = events.length >= 3;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/life-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          birthDate: profile.birthDate,
          birthTime: profile.birthTime,
          events,
          lang,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(
          data.code === "no_key"
            ? L[lang].aiPreparing
            : data.message || L[lang].aiFail
        );
        return;
      }
      const r: LifeReading = {
        ...data.reading,
        generatedAt: new Date().toISOString(),
        eventCount: events.length,
      };
      saveLifeReading(r);
      setReading(r);
    } catch {
      setError(L[lang].aiCommError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="bg-gradient-to-br from-accent-gold/10 via-card-bg to-accent-orange/5 border border-accent-gold/30 rounded-2xl p-4 shadow-sm space-y-3">
        <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <span className="text-accent-gold">✦</span> {L[lang].aiTitle}
        </p>
        <p className="text-xs text-muted leading-relaxed">{L[lang].aiDesc}</p>
        {!enough ? (
          <p className="text-[11px] text-muted bg-white/50 rounded-lg px-3 py-2">
            {lang === "ko"
              ? `사건이 3건 이상 모이면 읽어낼 수 있습니다(현재 ${events.length}건).`
              : `出来事が3件以上たまると読み解けます（今 ${events.length}件）。`}
          </p>
        ) : (
          <button
            onClick={generate}
            disabled={loading}
            className="w-full bg-accent-orange text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-orange/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? L[lang].aiGenerating
              : reading
              ? L[lang].aiAgain
              : L[lang].aiGo}
          </button>
        )}
        {error && (
          <p className="text-[11px] text-danger bg-danger/5 rounded-lg px-3 py-2 leading-relaxed">
            {error}
          </p>
        )}
      </div>

      {reading && (
        <div className="space-y-2.5">
          {AI_SECTIONS.map((s) => (
            <div
              key={s.key}
              className="animate-fade-up bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-1.5"
            >
              <p className="text-sm font-bold text-accent-orange flex items-center gap-1.5">
                <span>{s.emoji}</span> {s.labels[lang]}
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {reading[s.key] as string}
              </p>
            </div>
          ))}
          <p className="text-[10px] text-muted/60 text-center leading-relaxed">
            {lang === "ko"
              ? ` AI에 의한 읽어내기(참고). ${new Date(
                  reading.generatedAt
                ).toLocaleDateString("ko-KR")} 시점·${reading.eventCount}건의 사건에서 생성.`
              : ` AIによる読み解き（参考）。${new Date(
                  reading.generatedAt
                ).toLocaleDateString("ja-JP")} 時点・${reading.eventCount}件の出来事から生成。`}
          </p>
        </div>
      )}
    </section>
  );
}

function InsightCard({ insight }: { insight: ReturnType<typeof analyzeLifePatterns> }) {
  const { lang } = useI18n();
  return (
    <div className="bg-gradient-to-br from-card-bg via-card-bg to-accent-gold/5 border border-accent-gold/30 rounded-2xl p-4 shadow-sm space-y-2.5">
      <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <span className="text-accent-gold">🌱</span> {L[lang].insightTitle}
      </p>
      {!insight.enough && (
        <p className="text-xs text-muted leading-relaxed">
          {lang === "ko"
            ? `앞으로 ${Math.max(
                0,
                3 - insight.eventCount
              )}건 정도 사건을 적어 나가면, 반복되는 테마(인생의 버릇·과제)가 보이기 시작합니다.`
            : `あと${Math.max(
                0,
                3 - insight.eventCount
              )}件ほど出来事を書き出すと、繰り返すテーマ（人生の癖・課題）が見えてきます。`}
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
          {L[lang].insightFoot}
        </p>
      )}
    </div>
  );
}
