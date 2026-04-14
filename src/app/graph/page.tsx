export default function GraphPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">📊</span>
        運勢グラフ
      </h2>
      <section className="bg-card-bg border border-card-border rounded-2xl p-5">
        <p className="text-muted text-sm">
          占術ごとの運勢の波を折れ線グラフで表示します。過去から10年後までの流れが一目でわかります。
        </p>
        <p className="text-foreground/50 text-sm mt-4">
          ※ Step 5で実装予定
        </p>
      </section>
    </div>
  );
}
