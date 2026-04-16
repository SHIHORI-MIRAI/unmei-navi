"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  loadProfile,
  loadProfiles,
  saveProfile,
  switchProfile,
  deleteProfile,
  exportData,
  importData,
  type UserProfile,
} from "@/lib/storage";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function ProfilePage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [form, setForm] = useState<UserProfile>({
    id: "",
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<"" | "success" | "error">("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshProfiles = useCallback(() => {
    setProfiles(loadProfiles());
  }, []);

  useEffect(() => {
    refreshProfiles();
    const profile = loadProfile();
    if (profile) {
      setForm(profile);
    }
  }, [refreshProfiles]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.birthDate) return;
    const toSave = { ...form, id: form.id || generateId() };
    saveProfile(toSave);
    setSaved(true);
    setIsEditing(false);
    refreshProfiles();
    setTimeout(() => router.push("/"), 1000);
  }

  function handleSwitch(profileId: string) {
    switchProfile(profileId);
    const profile = loadProfile();
    if (profile) setForm(profile);
    refreshProfiles();
    router.push("/");
  }

  function handleDelete(profileId: string) {
    deleteProfile(profileId);
    refreshProfiles();
    const profile = loadProfile();
    if (profile) {
      setForm(profile);
    } else {
      setForm({ id: "", name: "", birthDate: "", birthTime: "", birthPlace: "" });
    }
  }

  function handleAddNew() {
    setForm({ id: "", name: "", birthDate: "", birthTime: "", birthPlace: "" });
    setIsEditing(true);
    setSaved(false);
  }

  function handleEditProfile(profile: UserProfile) {
    setForm(profile);
    setIsEditing(true);
    setSaved(false);
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
        refreshProfiles();
        const profile = loadProfile();
        if (profile) setForm(profile);
        setTimeout(() => setImportStatus(""), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const activeProfile = loadProfile();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">✦</span>
        プロフィール設定
      </h2>

      {/* プロフィール一覧 */}
      {profiles.length > 0 && !isEditing && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
              <span>◈</span> 登録済みの人
            </h3>
            <button
              onClick={handleAddNew}
              className="text-xs bg-accent-orange text-white px-3 py-1.5 rounded-full hover:bg-accent-orange/90 transition-colors"
            >
              + 追加
            </button>
          </div>

          <div className="space-y-2">
            {profiles.map((p) => {
              const isActive = activeProfile?.id === p.id;
              return (
                <div
                  key={p.id}
                  className={`bg-card-bg border rounded-2xl p-4 shadow-sm flex items-center gap-3 ${
                    isActive
                      ? "border-accent-orange/50 bg-accent-orange/5"
                      : "border-card-border"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.name || "名前未設定"}
                      </p>
                      {isActive && (
                        <span className="text-[10px] bg-accent-orange/20 text-accent-orange px-1.5 py-0.5 rounded-full flex-shrink-0">
                          表示中
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      {p.birthDate.replace(/-/g, "/")}
                      {p.birthPlace ? ` / ${p.birthPlace}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => handleSwitch(p.id)}
                        className="text-xs bg-accent-orange/10 text-accent-orange px-2.5 py-1.5 rounded-lg hover:bg-accent-orange/20 transition-colors"
                      >
                        切替
                      </button>
                    )}
                    <button
                      onClick={() => handleEditProfile(p)}
                      className="text-xs text-muted px-2 py-1.5 hover:text-foreground transition-colors"
                    >
                      編集
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs text-muted px-2 py-1.5 hover:text-danger transition-colors"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 新規追加ボタン（プロフィールがない場合） */}
      {profiles.length === 0 && !isEditing && (
        <div className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm text-center space-y-3">
          <p className="text-sm text-muted">
            まずはプロフィールを設定して、占い結果を受け取りましょう
          </p>
          <button
            onClick={handleAddNew}
            className="bg-accent-orange text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-accent-orange/90 transition-colors"
          >
            プロフィールを設定する
          </button>
        </div>
      )}

      {/* 入力フォーム */}
      {(isEditing || profiles.length === 0) && (
        <>
          {profiles.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                {form.id ? "プロフィールを編集" : "新しい人を追加"}
              </p>
              <button
                onClick={() => {
                  setIsEditing(false);
                  const profile = loadProfile();
                  if (profile) setForm(profile);
                }}
                className="text-xs text-muted hover:text-foreground"
              >
                キャンセル
              </button>
            </div>
          )}

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
                四柱推命の時柱に影響します
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
            </div>

            {/* 保存ボタン */}
            <button
              type="submit"
              className="w-full py-3 bg-accent-orange text-white rounded-full font-medium hover:bg-accent-light transition-colors disabled:opacity-50"
              disabled={!form.birthDate}
            >
              {saved ? "✓ 保存しました！" : form.id ? "更新してホームへ" : "保存してホームへ"}
            </button>
          </form>
        </>
      )}

      {/* データ管理 */}
      <section className="border-t border-card-border pt-6 space-y-4">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> データ管理
        </h3>
        <p className="text-xs text-muted">
          全てのプロフィール・日記・ゴール・鑑定結果をJSONファイルでバックアップ・復元できます。
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
