"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  loadWorksheet,
  saveWorksheet,
  deleteWorksheet,
  type WorksheetData,
} from "@/lib/storage";
import {
  DIAGNOSIS_QUESTIONS,
  PATTERN_OPTIONS,
  diagnoseStrengthType,
  type StrengthTypeId,
  type DiagnosisResult,
} from "@/lib/strength-types";

function emptyWorksheet(): WorksheetData {
  return {
    joyful: "",
    painful: "",
    turning: "",
    overcameEvent: "",
    overcameHow: "",
    overcameLearned: "",
    oftenSaid: "",
    consulted: "",
    natural: "",
    patterns: [],
    mostApplicable: "",
    expSentence: "",
    strengthSentence: "",
    whoToHelp: "",
    valueWho: "",
    valueWhat: "",
    valueFuture: "",
    quizAnswers: {},
    resultType: "",
    updatedAt: "",
  };
}

export default function WorksheetPage() {
  const [ws, setWs] = useState<WorksheetData>(emptyWorksheet);
  const [loaded, setLoaded] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // 初回ロード
  useEffect(() => {
    const saved = loadWorksheet();
    if (saved) {
      setWs({ ...emptyWorksheet(), ...saved });
      // 保存済みの診断結果があれば再表示
      const r = diagnoseStrengthType(
        saved.quizAnswers as Record<number, StrengthTypeId>,
        saved.patterns
      );
      if (saved.resultType && r) setResult(r);
    }
    setLoaded(true);
  }, []);

  // 自動保存（ロード後の変更のみ）
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      saveWorksheet({ ...ws, updatedAt: new Date().toISOString() });
      setSavedFlash(true);
      const f = setTimeout(() => setSavedFlash(false), 1200);
      return () => clearTimeout(f);
    }, 500);
    return () => clearTimeout(t);
  }, [ws, loaded]);

  function update<K extends keyof WorksheetData>(key: K, value: WorksheetData[K]) {
    setWs((prev) => ({ ...prev, [key]: value }));
  }

  function togglePattern(p: string) {
    setWs((prev) => {
      const has = prev.patterns.includes(p);
      const patterns = has
        ? prev.patterns.filter((x) => x !== p)
        : [...prev.patterns, p];
      // 「最も当てはまるもの」が外れたらクリア
      const mostApplicable =
        !has || prev.mostApplicable !== p ? prev.mostApplicable : "";
      return { ...prev, patterns, mostApplicable };
    });
  }

  function selectQuiz(qid: number, type: StrengthTypeId) {
    setWs((prev) => ({
      ...prev,
      quizAnswers: { ...prev.quizAnswers, [qid]: type },
    }));
  }

  function runDiagnosis() {
    const r = diagnoseStrengthType(
      ws.quizAnswers as Record<number, StrengthTypeId>,
      ws.patterns
    );
    setResult(r);
    if (r) {
      update("resultType", r.primary.id);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }

  function resetAll() {
    if (!confirm("入力した内容をすべて消去します。よろしいですか？")) return;
    deleteWorksheet();
    setWs(emptyWorksheet());
    setResult(null);
  }

  const answeredCount = Object.keys(ws.quizAnswers).length;
  const canDiagnose = answeredCount + ws.patterns.length > 0;

  if (!loaded) {
    return <p className="text-muted text-center py-10">読み込み中...</p>;
  }

  return (
    <div className="space-y-5">
      {/* タイトル */}
      <div className="text-center space-y-1">
        <p className="text-accent-gold text-sm">✦ あなたの人生経験が強みに変わる ✦</p>
        <h2 className="text-xl font-bold text-accent-orange">強み発見ワークシート</h2>
      </div>

      {/* はじめに */}
      <section className="bg-gradient-to-br from-accent-orange/10 to-accent-gold/10 border border-accent-orange/30 rounded-2xl p-5 shadow-sm space-y-2 no-print">
        <p className="text-sm font-medium text-accent-orange flex items-center gap-1.5">
          <span>📝</span> はじめに
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          楽しかった経験も、苦しかった経験も、そのすべてがあなただけの「強みの原石」です。
          このワークを通して、あなたの人生経験の中に眠る価値を見つけていきましょう。
        </p>
        <p className="text-xs text-muted">
          入力は自動で保存されます。最後に「強みタイプ診断」もできます。
        </p>
      </section>

      {/* STEP1 */}
      <StepCard step="1" title="これまでの人生を振り返る" subtitle="印象に残っている出来事を書き出してみましょう">
        <Field
          label="嬉しかった経験"
          placeholder="例）結婚した／子どもが生まれた／表彰された"
          value={ws.joyful}
          onChange={(v) => update("joyful", v)}
        />
        <Field
          label="苦しかった経験"
          placeholder="例）離婚／病気／人間関係の悩み／お金の苦労"
          value={ws.painful}
          onChange={(v) => update("painful", v)}
        />
        <Field
          label="人生の転機"
          placeholder="例）引っ越し／転職／起業／海外移住"
          value={ws.turning}
          onChange={(v) => update("turning", v)}
        />
      </StepCard>

      {/* STEP2 */}
      <StepCard step="2" title="あなたが乗り越えてきたこと" subtitle="苦しかった経験の中から一つ選びましょう">
        <Field
          label="その出来事は？"
          placeholder="乗り越えた出来事を書いてみましょう"
          value={ws.overcameEvent}
          onChange={(v) => update("overcameEvent", v)}
        />
        <Field
          label="どうやって乗り越えましたか？"
          placeholder="そのとき、何をして、どう向き合いましたか？"
          value={ws.overcameHow}
          onChange={(v) => update("overcameHow", v)}
        />
        <Field
          label="その経験から学んだことは？"
          placeholder="得たもの・気づいたこと"
          value={ws.overcameLearned}
          onChange={(v) => update("overcameLearned", v)}
        />
      </StepCard>

      {/* STEP3 */}
      <StepCard step="3" title="人からよく言われること" subtitle="周りの人から言われることを書き出してください">
        <Field
          label="よく言われること"
          placeholder="例）話しやすい／優しい／行動力がある／教えるのが上手"
          value={ws.oftenSaid}
          onChange={(v) => update("oftenSaid", v)}
        />
      </StepCard>

      {/* STEP4 */}
      <StepCard step="4" title="人から相談されること" subtitle="どんな相談を受けることが多いですか？">
        <Field
          label="よくされる相談"
          placeholder="例）子育て／夫婦関係／健康／仕事／SNS"
          value={ws.consulted}
          onChange={(v) => update("consulted", v)}
        />
      </StepCard>

      {/* STEP5 */}
      <StepCard
        step="5"
        title="当たり前にできること"
        subtitle="あなたにとって普通でも、他の人には難しいことがあります"
      >
        <Field
          label="自然とできること"
          placeholder="例）人の話を聞ける／整理整頓できる／継続できる／人を励ませる"
          value={ws.natural}
          onChange={(v) => update("natural", v)}
        />
      </StepCard>

      {/* STEP6 */}
      <StepCard
        step="6"
        title="強みを見つける"
        subtitle="STEP1〜5を見返して、何度も繰り返してきたことを選びましょう（複数可）"
      >
        <div className="grid grid-cols-2 gap-2">
          {PATTERN_OPTIONS.map((p) => {
            const checked = ws.patterns.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePattern(p)}
                className={`text-sm rounded-xl border px-3 py-2 text-left transition-colors ${
                  checked
                    ? "bg-accent-orange/10 border-accent-orange text-accent-orange font-medium"
                    : "bg-white border-card-border text-foreground/70 hover:border-accent-gold"
                }`}
              >
                <span className="mr-1">{checked ? "☑" : "☐"}</span>
                私は何度も{p}
              </button>
            );
          })}
        </div>

        {ws.patterns.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-accent-gold">
              最も当てはまるものは？
            </label>
            <div className="flex flex-wrap gap-2">
              {ws.patterns.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => update("mostApplicable", p)}
                  className={`text-xs rounded-full border px-3 py-1 transition-colors ${
                    ws.mostApplicable === p
                      ? "bg-accent-orange text-white border-accent-orange"
                      : "bg-white border-card-border text-foreground/70 hover:border-accent-gold"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </StepCard>

      {/* STEP7 */}
      <StepCard step="7" title="あなたの強みを言葉にする" subtitle="文章を完成させてください">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-sm text-foreground/80">私は</p>
            <Textarea
              placeholder="（どんな経験を通して…）"
              value={ws.expSentence}
              onChange={(v) => update("expSentence", v)}
            />
            <p className="text-sm text-foreground/80">という経験を通して、</p>
            <Textarea
              placeholder="（どんな強みを身につけた…）"
              value={ws.strengthSentence}
              onChange={(v) => update("strengthSentence", v)}
            />
            <p className="text-sm text-foreground/80">という強みを身につけました。</p>
          </div>
        </div>
      </StepCard>

      {/* STEP8 */}
      <StepCard
        step="8"
        title="誰の役に立てそうですか？"
        subtitle="過去の自分を思い出してください。どんな人を助けたいですか？"
      >
        <Field
          label="助けたい人"
          placeholder="かつてのあなたと同じことで悩んでいる人は…"
          value={ws.whoToHelp}
          onChange={(v) => update("whoToHelp", v)}
        />
      </StepCard>

      {/* STEP9 */}
      <StepCard step="9" title="あなたの人生経験を価値に変える" subtitle="最後の仕上げです">
        <div className="space-y-2">
          <InlineField
            prefix="私は"
            suffix="な人に"
            placeholder="どんな人"
            value={ws.valueWho}
            onChange={(v) => update("valueWho", v)}
          />
          <InlineField
            prefix=""
            suffix="を伝え"
            placeholder="何を"
            value={ws.valueWhat}
            onChange={(v) => update("valueWhat", v)}
          />
          <InlineField
            prefix=""
            suffix="な未来を提供したい"
            placeholder="どんな未来"
            value={ws.valueFuture}
            onChange={(v) => update("valueFuture", v)}
          />
        </div>
      </StepCard>

      {/* 強みタイプ診断 */}
      <section className="bg-card-bg border-2 border-accent-orange/40 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="text-center space-y-1">
          <p className="text-accent-gold text-xs">＼ 最後に ／</p>
          <h3 className="text-lg font-bold text-accent-orange">強みタイプ診断</h3>
          <p className="text-xs text-muted">
            8つの質問に答えて、あなたの強みタイプを見つけましょう
          </p>
        </div>

        <div className="space-y-4 no-print">
          {DIAGNOSIS_QUESTIONS.map((q) => (
            <div key={q.id} className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                <span className="text-accent-orange mr-1">Q{q.id + 1}.</span>
                {q.question}
              </p>
              <div className="grid gap-1.5">
                {q.options.map((opt) => {
                  const selected = ws.quizAnswers[q.id] === opt.type;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => selectQuiz(q.id, opt.type)}
                      className={`text-sm rounded-xl border px-3 py-2 text-left transition-colors ${
                        selected
                          ? "bg-accent-orange/10 border-accent-orange text-accent-orange font-medium"
                          : "bg-white border-card-border text-foreground/70 hover:border-accent-gold"
                      }`}
                    >
                      <span className="mr-1.5">{selected ? "●" : "○"}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 no-print">
          <span className="text-xs text-muted">
            回答 {answeredCount}/{DIAGNOSIS_QUESTIONS.length}
          </span>
          <button
            type="button"
            onClick={runDiagnosis}
            disabled={!canDiagnose}
            className="px-6 py-2.5 bg-accent-orange text-white rounded-full text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            診断する ✦
          </button>
        </div>
      </section>

      {/* 診断結果 */}
      {result && (
        <div ref={resultRef}>
          <ResultCard result={result} ws={ws} />
        </div>
      )}

      {/* 操作 */}
      <div className="flex items-center justify-between pt-2 no-print">
        <button
          type="button"
          onClick={resetAll}
          className="text-xs text-muted hover:text-danger transition-colors"
        >
          すべてリセット
        </button>
        <div className="flex items-center gap-3">
          {savedFlash && (
            <span className="text-xs text-accent-gold">✓ 保存しました</span>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs bg-card-bg border border-card-border text-accent-orange px-4 py-2 rounded-full hover:bg-accent-orange/5 transition-colors"
          >
            🖨 印刷／PDF保存
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-foreground/70 leading-relaxed px-4 pt-2">
        あなたの経験は無駄ではありません。
        <br />
        あなたが苦しかった経験は、今まさに同じことで悩んでいる誰かの希望になります。
        <br />
        <span className="text-accent-orange font-medium">人生経験は財産です。</span>
      </p>

      <div className="text-center no-print">
        <Link href="/analysis" className="text-xs text-accent-gold underline hover:text-accent-orange">
          占いから見たあなたの強み分析も見る →
        </Link>
      </div>
    </div>
  );
}

// --- サブコンポーネント ---

function StepCard({
  step,
  title,
  subtitle,
  children,
}: {
  step: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card-bg border border-card-border rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-accent-orange text-white text-sm font-bold flex items-center justify-center">
          {step}
        </span>
        <div className="pt-0.5">
          <h3 className="text-base font-bold text-foreground leading-tight">{title}</h3>
          <p className="text-xs text-muted mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-accent-gold">{label}</label>
      <Textarea placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  );
}

function Textarea({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      rows={2}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-card-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange/30 resize-y"
    />
  );
}

function InlineField({
  prefix,
  suffix,
  placeholder,
  value,
  onChange,
}: {
  prefix: string;
  suffix: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm text-foreground/80">
      {prefix && <span>{prefix}</span>}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-[120px] rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange/30"
      />
      <span>{suffix}</span>
    </div>
  );
}

function ResultCard({ result, ws }: { result: DiagnosisResult; ws: WorksheetData }) {
  const { primary, secondary, scores } = result;
  const maxScore = scores[0].score || 1;

  return (
    <section
      className="rounded-2xl p-5 shadow-md space-y-4 border-2"
      style={{ borderColor: primary.color, backgroundColor: "#fff" }}
    >
      <div className="text-center space-y-2">
        <p className="text-xs text-muted">あなたの強みタイプは…</p>
        <div className="text-5xl">{primary.emoji}</div>
        <h3 className="text-2xl font-bold" style={{ color: primary.color }}>
          {primary.name}
        </h3>
        <p className="text-sm text-foreground/80 font-medium">{primary.catchphrase}</p>
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed">{primary.description}</p>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-accent-gold">あなたの強み</p>
        <div className="flex flex-wrap gap-1.5">
          {primary.strengths.map((s) => (
            <span
              key={s}
              className="text-xs px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: primary.color }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <ResultRow label="活かし方" text={primary.howToUse} />
      <ResultRow label="役に立てる人" text={primary.whoToHelp} />
      <ResultRow label="あなたの使命" text={primary.mission} />

      {secondary && (
        <div className="border-t border-card-border pt-3">
          <p className="text-xs text-muted">
            <span className="mr-1">{secondary.emoji}</span>
            サブタイプは
            <span className="font-medium" style={{ color: secondary.color }}>
              「{secondary.name}」
            </span>
            。{secondary.catchphrase}という一面も持っています。
          </p>
        </div>
      )}

      {/* スコア内訳 */}
      <div className="border-t border-card-border pt-3 space-y-1.5">
        <p className="text-xs font-medium text-accent-gold">タイプ別スコア</p>
        {scores.map((s) => (
          <div key={s.type.id} className="flex items-center gap-2">
            <span className="text-xs text-foreground/70 w-28 flex-shrink-0">
              {s.type.emoji} {s.type.name}
            </span>
            <div className="flex-1 h-2 bg-card-border/40 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(s.score / maxScore) * 100}%`,
                  backgroundColor: s.type.color,
                }}
              />
            </div>
            <span className="text-[10px] text-muted w-5 text-right">{s.score}</span>
          </div>
        ))}
      </div>

      {/* ワークの強み文を添える */}
      {(ws.strengthSentence || ws.valueWho) && (
        <div className="border-t border-card-border pt-3 space-y-1">
          <p className="text-xs font-medium text-accent-gold">あなたが言葉にした強み</p>
          {ws.strengthSentence && (
            <p className="text-sm text-foreground/80">「{ws.strengthSentence}」</p>
          )}
          {(ws.valueWho || ws.valueWhat || ws.valueFuture) && (
            <p className="text-xs text-foreground/70">
              {ws.valueWho || "＿＿"}な人に {ws.valueWhat || "＿＿"}を伝え、
              {ws.valueFuture || "＿＿"}な未来を提供したい。
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function ResultRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-accent-orange font-medium whitespace-nowrap mt-0.5 w-20 flex-shrink-0">
        ▸ {label}
      </span>
      <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
    </div>
  );
}
