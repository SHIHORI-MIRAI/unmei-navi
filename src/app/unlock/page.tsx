"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function UnlockForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get("from") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.message || "認証に失敗しました");
        setLoading(false);
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError("通信に失敗しました。時間をおいて再度お試しください。");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl text-accent-gold">☽ ✦</div>
          <h1 className="text-xl font-bold text-accent-orange">運命ナビ</h1>
          <p className="text-xs text-muted leading-relaxed">
            このアプリは限定公開です。<br />
            ご案内のパスワードを入力してください。
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card-bg border border-card-border rounded-2xl p-5 shadow-sm space-y-4"
        >
          <div className="space-y-2">
            <label className="block text-sm text-accent-gold">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent-orange transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-danger bg-red-50 border border-red-200 rounded-lg p-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-accent-orange text-white rounded-full font-medium hover:bg-accent-light transition-colors disabled:opacity-50"
          >
            {loading ? "確認中…" : "ロックを解除"}
          </button>

          <p className="text-[11px] text-muted/70 text-center leading-relaxed">
            ※ パスワードを30日間保存します。<br />
            共用PCでは「シークレットモード」での利用をおすすめします。
          </p>
        </form>
      </div>
    </div>
  );
}

export default function UnlockPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">読み込み中…</div>}>
      <UnlockForm />
    </Suspense>
  );
}
