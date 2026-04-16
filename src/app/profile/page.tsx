"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadProfile, saveProfile, exportData, importData, type UserProfile } from "@/lib/storage";

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<UserProfile>({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
  const [saved, setSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<"" | "success" | "error">("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unmei-navi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const success = importData(reader.result as string);
      setImportStatus(success ? "success" : "error");
      if (success) {
        const profile = loadProfile();
        if (profile) setForm(profile);
        setTimeout(() => setImportStatus(""), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
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

      {/* データ管理 */}
      <section className="border-t border-card-border pt-6 space-y-4">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> データ管理
        </h3>
        <p className="text-xs text-muted">
          プロフィール・日記・ゴール・鑑定結果など全てのデータを
          JSONファイルでバックアップ・復元できます。
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 py-2.5 bg-card-bg border border-card-border rounded-xl text-sm font-medium text-foreground hover:border-accent-orange/50 transition-colors"
          >
            エクスポート
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 bg-card-bg border border-card-border rounded-xl text-sm font-medium text-foreground hover:border-accent-orange/50 transition-colors"
          >
            インポート
          </button>
        </div>

        {importStatus === "success" && (
          <p className="text-xs text-accent-gold text-center">
            データを復元しました
          </p>
        )}
        {importStatus === "error" && (
          <p className="text-xs text-danger text-center">
            ファイルの読み込みに失敗しました
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />

        <p className="text-[10px] text-muted/60">
          インポートすると現在のデータは上書きされます。事前にエクスポートしておくことをおすすめします。
        </p>
      </section>
    </div>
  );
}
