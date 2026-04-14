"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadProfile, saveProfile, type UserProfile } from "@/lib/storage";

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<UserProfile>({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const profile = loadProfile();
    if (profile) setForm(profile);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.birthDate) return;
    saveProfile(form);
    setSaved(true);
    setTimeout(() => router.push("/"), 1000);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">✦</span>
        プロフィール設定
      </h2>
      <p className="text-sm text-muted">
        生年月日を入力すると、各占術の結果が自動で計算されます。
        出生時間がわかるとより詳しい結果が出ます。
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 名前 */}
        <div className="space-y-2">
          <label className="block text-sm text-accent-gold">
            お名前（ニックネームでもOK）
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="例：はなこ"
            className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange transition-colors"
          />
        </div>

        {/* 生年月日 */}
        <div className="space-y-2">
          <label className="block text-sm text-accent-gold">
            生年月日 <span className="text-danger">*必須</span>
          </label>
          <input
            type="date"
            name="birthDate"
            value={form.birthDate}
            onChange={handleChange}
            required
            className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent-orange transition-colors"
          />
        </div>

        {/* 出生時間 */}
        <div className="space-y-2">
          <label className="block text-sm text-accent-gold">
            出生時間（わかれば）
          </label>
          <input
            type="time"
            name="birthTime"
            value={form.birthTime}
            onChange={handleChange}
            className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent-orange transition-colors"
          />
          <p className="text-xs text-muted">
            四柱推命の時柱や西洋占星術のアセンダントに影響します
          </p>
        </div>

        {/* 出生地 */}
        <div className="space-y-2">
          <label className="block text-sm text-accent-gold">
            出生地（わかれば）
          </label>
          <input
            type="text"
            name="birthPlace"
            value={form.birthPlace}
            onChange={handleChange}
            placeholder="例：東京都"
            className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange transition-colors"
          />
          <p className="text-xs text-muted">
            西洋占星術のハウスの計算に使用します
          </p>
        </div>

        {/* 保存ボタン */}
        <button
          type="submit"
          className="w-full py-3 bg-accent-orange text-white rounded-full font-medium hover:bg-accent-light transition-colors disabled:opacity-50"
          disabled={!form.birthDate}
        >
          {saved ? "✓ 保存しました！" : "保存してホームへ"}
        </button>
      </form>
    </div>
  );
}
