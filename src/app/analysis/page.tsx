export default function AnalysisPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">✦</span>
        強み・性格分析
      </h2>
      <section className="bg-card-bg border border-card-border rounded-2xl p-5">
        <p className="text-muted text-sm">
          各占術の結果を総合して、あなたの強みと性格をレイヤー別に表示します。
        </p>
        <p className="text-foreground/50 text-sm mt-4">
          ※ Step 6で実装予定
        </p>
      </section>
    </div>
  );
}
