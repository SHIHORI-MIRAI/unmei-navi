export default function DiaryPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">📖</span>
        振り返り日記
      </h2>
      <section className="bg-card-bg border border-card-border rounded-2xl p-5">
        <p className="text-muted text-sm">
          毎日の出来事をメモして、運勢と照らし合わせることができます。
        </p>
        <p className="text-foreground/50 text-sm mt-4">
          ※ Step 8で実装予定
        </p>
      </section>
    </div>
  );
}
