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
  markExported,
  getLastExportDate,
  getDataSummary,
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
    category: "self",
    note: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<"" | "success" | "error">("");
  const [lastExport, setLastExport] = useState<Date | null>(null);
  const [summary, setSummary] = useState({ profileCount: 0, diaryCount: 0, goalCount: 0, readingCount: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshProfiles = useCallback(() => {
    setProfiles(loadProfiles());
    setLastExport(getLastExportDate());
    setSummary(getDataSummary());
  }, []);

  useEffect(() => {
    refreshProfiles();
    const profile = loadProfile();
    if (profile) {
      setForm(profile);
    }
  }, [refreshProfiles]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
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
    const target = profiles.find((p) => p.id === profileId);
    const name = target?.name || "このプロフィール";
    const ok = window.confirm(
      `「${name}」を削除しますか？\n\n※ 削除したデータは元に戻せません。念のため「エクスポート」でバックアップしてからの削除をおすすめします。`
    );
    if (!ok) return;
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
    setForm({
      id: "",
      name: "",
      birthDate: "",
      birthTime: "",
      birthPlace: "",
      category: "self",
      note: "",
    });
    setIsEditing(true);
    setSaved(false);
  }

  function handleEditProfile(profile: UserProfile) {
    setForm({
      ...profile,
      category: profile.category ?? "self",
      note: profile.note ?? "",
    });
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
    markExported();
    setLastExport(new Date());
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

  const daysSinceExport = lastExport
    ? Math.floor((Date.now() - lastExport.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const needsBackup = daysSinceExport === null || daysSinceExport >= 7;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">✦</span>
        プロフィール設定
      </h2>

      {/* 保存状況バナー */}
      {profiles.length > 0 && (
        <section
          className={`rounded-2xl p-3 border shadow-sm ${
            needsBackup
              ? "bg-amber-50 border-amber-200"
              : "bg-emerald-50 border-emerald-200"
          }`}
        >
          <div className="flex items-start gap-2">
            <span className={needsBackup ? "text-amber-500" : "text-emerald-500"}>
              {needsBackup ? "⚠" : "✓"}
            </span>
            <div className="flex-1 text-xs leading-relaxed">
              <p className={`font-medium ${needsBackup ? "text-amber-700" : "text-emerald-700"}`}>
                {needsBackup
                  ? lastExport
                    ? `バックアップ推奨：最後のエクスポートから${daysSinceExport}日経過`
                    : "まだバックアップしていません"
                  : `バックアップ済み（${daysSinceExport}日前）`}
              </p>
              <p className="text-[11px] text-muted mt-1">
                データは<strong>この端末のブラウザ内</strong>に保存されます。
                別の端末では見えません。ブラウザのデータが消えると失われます。
                定期的に下の「エクスポート」でバックアップしてください。
              </p>
              <p className="text-[11px] text-muted mt-1">
                現在の保存数：プロフィール{summary.profileCount}件・日記{summary.diaryCount}件・ゴール{summary.goalCount}件・鑑定{summary.readingCount}件
              </p>
            </div>
          </div>
        </section>
      )}

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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.name || "名前未設定"}
                      </p>
                      {(() => {
                        const cat = p.category ?? "self";
                        const badge =
                          cat === "self"
                            ? { label: "自分", cls: "bg-accent-gold/15 text-accent-gold" }
                            : cat === "family"
                            ? { label: "家族", cls: "bg-emerald-100 text-emerald-700" }
                            : { label: "受講生", cls: "bg-sky-100 text-sky-700" };
                        return (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        );
                      })()}
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

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => handleSwitch(p.id)}
                        className="text-xs bg-accent-orange/10 text-accent-orange px-3 py-2 rounded-lg hover:bg-accent-orange/20 transition-colors"
                      >
                        切替
                      </button>
                    )}
                    <button
                      onClick={() => handleEditProfile(p)}
                      className="text-xs bg-background border border-card-border text-foreground px-3 py-2 rounded-lg hover:border-accent-orange/50 transition-colors"
                    >
                      編集
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        aria-label={`${p.name || "このプロフィール"}を削除`}
                        className="text-[11px] text-muted/70 border border-transparent hover:text-red-600 hover:border-red-200 hover:bg-red-50 px-2.5 py-2 rounded-lg transition-colors ml-1"
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
                  if (profile)
                    setForm({
                      ...profile,
                      category: profile.category ?? "self",
                      note: profile.note ?? "",
                    });
                }}
                className="text-xs text-muted hover:text-foreground"
              >
                キャンセル
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 種別 */}
            <div className="space-y-2">
              <label className="block text-sm text-accent-gold">
                種別
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "self", label: "自分" },
                    { value: "family", label: "家族" },
                    { value: "student", label: "受講生" },
                  ] as const
                ).map((opt) => {
                  const active = (form.category ?? "self") === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`text-center text-sm rounded-xl py-2.5 cursor-pointer border transition-colors ${
                        active
                          ? "bg-accent-orange text-white border-accent-orange"
                          : "bg-card-bg text-foreground border-card-border hover:border-accent-orange/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={opt.value}
                        checked={active}
                        onChange={handleChange}
                        className="hidden"
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted">
                「受講生」を選ぶと <a href="/students" className="text-accent-orange underline">受講生一覧</a> に表示されます
              </p>
            </div>

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

            {/* メモ（受講生用） */}
            {(form.category ?? "self") === "student" && (
              <div className="space-y-2">
                <label className="block text-sm text-accent-gold">
                  受講生メモ
                </label>
                <textarea
                  name="note"
                  value={form.note ?? ""}
                  onChange={handleChange}
                  rows={4}
                  placeholder="例：1月入講、月3回個別セッション、ゴールは独立開業"
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange transition-colors resize-y"
                />
                <p className="text-xs text-muted">
                  進捗・面談メモなど、伴走に必要な情報を残せます
                </p>
              </div>
            )}

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
