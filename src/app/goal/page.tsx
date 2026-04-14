export default function GoalPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">🎯</span>
        ゴール＋ロードマップ
      </h2>
      <section className="bg-card-bg border border-card-border rounded-2xl p-5">
        <p className="text-muted text-sm">
          目標を設定して、運気の流れと連動したアドバイスを受け取れます。
        </p>
        <p className="text-foreground/50 text-sm mt-4">
          ※ Step 7で実装予定
        </p>
      </section>
    </div>
  );
}
