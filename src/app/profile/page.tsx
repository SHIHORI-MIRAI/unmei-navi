"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
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
  getStorageUsage,
  verifyWrite,
  type UserProfile,
} from "@/lib/storage";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useI18n();
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
  const [usage, setUsage] = useState({ used: 0, limit: 5 * 1024 * 1024, ratio: 0 });
  const [saveError, setSaveError] = useState<string>("");
  const [externalChange, setExternalChange] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshProfiles = useCallback(() => {
    setProfiles(loadProfiles());
    setLastExport(getLastExportDate());
    setSummary(getDataSummary());
    setUsage(getStorageUsage());
  }, []);

  useEffect(() => {
    refreshProfiles();
    const profile = loadProfile();
    if (profile) {
      setForm(profile);
    }
  }, [refreshProfiles]);

  // 別タブ・別ウィンドウで同じアプリが開かれてデータを書き換えた場合、
  // このタブで編集中の内容を上書きする事故を防ぐため検知して警告する。
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === "unmei-navi-data" && e.oldValue !== e.newValue) {
        setExternalChange(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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

    // 保存前の件数を控えて、保存後に再ロードして同じ／+1になっているか確認する。
    // setItem が成功しても容量逼迫やブラウザの特殊状態でデータが残らない事故を捕まえる。
    const beforeSummary = getDataSummary();
    const expectedProfiles = profiles.some((p) => p.id === toSave.id)
      ? beforeSummary.profileCount
      : beforeSummary.profileCount + 1;

    const ok = saveProfile(toSave);
    if (!ok) {
      setSaveError(t("profile.saveError.quota"));
      return;
    }

    const verified = verifyWrite({
      profiles: expectedProfiles,
      diary: beforeSummary.diaryCount,
      goals: beforeSummary.goalCount,
      readings: beforeSummary.readingCount,
    });
    if (!verified) {
      setSaveError(t("profile.saveError.notVerified"));
      return;
    }

    setSaveError("");
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
    const name = target?.name || t("profile.delete.fallbackName");
    const ok = window.confirm(t("profile.delete.confirm", { name }));
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
        {t("profile.title")}
      </h2>

      {/* 言語選択（はじめの設定） */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2.5">
        <label className="block text-sm text-accent-gold">{t("lang.label")}</label>
        <LanguageSwitcher variant="full" />
      </section>

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
                    ? t("profile.backup.recommendedWithDate", { days: daysSinceExport ?? 0 })
                    : t("profile.backup.notYet")
                  : t("profile.backup.doneDaysAgo", { days: daysSinceExport ?? 0 })}
              </p>
              <p className="text-[11px] text-muted mt-1">
                {t("profile.backup.storageNote")}
              </p>
              <p className="text-[11px] text-muted mt-1">
                {t("profile.backup.counts", {
                  profiles: summary.profileCount,
                  diary: summary.diaryCount,
                  goals: summary.goalCount,
                  readings: summary.readingCount,
                })}
              </p>
              {(() => {
                const pct = Math.round(usage.ratio * 100);
                const usedMB = (usage.used / 1024 / 1024).toFixed(2);
                const limitMB = (usage.limit / 1024 / 1024).toFixed(0);
                const isWarn = usage.ratio >= 0.8;
                const isAlert = usage.ratio >= 0.95;
                const barColor = isAlert
                  ? "bg-red-500"
                  : isWarn
                  ? "bg-amber-500"
                  : "bg-emerald-500";
                return (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span>{t("profile.usage.label")}</span>
                      <span className={isWarn ? "text-amber-700 font-medium" : ""}>
                        {usedMB} MB / {limitMB} MB（{pct}%）
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 bg-card-border rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} transition-all`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    {isAlert && (
                      <p className="text-[11px] text-red-600 mt-1 leading-relaxed">
                        {t("profile.usage.alert")}
                      </p>
                    )}
                    {!isAlert && isWarn && (
                      <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                        {t("profile.usage.warn")}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </section>
      )}

      {/* 他タブ変更通知 */}
      {externalChange && (
        <section className="bg-sky-50 border border-sky-200 rounded-2xl p-3 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-sky-500">ℹ</span>
            <div className="flex-1 text-xs leading-relaxed">
              <p className="font-medium text-sky-700">{t("profile.external.title")}</p>
              <p className="text-[11px] text-foreground/80 mt-1">
                {t("profile.external.body")}
              </p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => location.reload()}
                  className="text-[11px] bg-sky-600 text-white px-3 py-1 rounded-full hover:bg-sky-700 transition-colors"
                >
                  {t("profile.external.reload")}
                </button>
                <button
                  onClick={() => setExternalChange(false)}
                  className="text-[11px] text-sky-700 underline"
                >
                  {t("profile.external.later")}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 保存エラー */}
      {saveError && (
        <section className="bg-red-50 border border-red-200 rounded-2xl p-3 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-red-500">⚠</span>
            <div className="flex-1 text-xs leading-relaxed">
              <p className="font-medium text-red-700">{t("profile.saveError.title")}</p>
              <p className="text-[11px] text-foreground/80 mt-1">{saveError}</p>
              <button
                onClick={() => setSaveError("")}
                className="mt-2 text-[11px] text-red-700 underline"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* プロフィール一覧 */}
      {profiles.length > 0 && !isEditing && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
              <span>◈</span> {t("profile.list.registered")}
            </h3>
            <button
              onClick={handleAddNew}
              className="text-xs bg-accent-orange text-white px-3 py-1.5 rounded-full hover:bg-accent-orange/90 transition-colors"
            >
              {t("profile.list.add")}
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
                        {p.name || t("profile.name.unset")}
                      </p>
                      {(() => {
                        const cat = p.category ?? "self";
                        const badge =
                          cat === "self"
                            ? { label: t("profile.badge.self"), cls: "bg-accent-gold/15 text-accent-gold" }
                            : cat === "family"
                            ? { label: t("profile.badge.family"), cls: "bg-emerald-100 text-emerald-700" }
                            : cat === "client"
                            ? { label: t("profile.badge.client"), cls: "bg-rose-100 text-rose-700" }
                            : { label: t("profile.badge.student"), cls: "bg-sky-100 text-sky-700" };
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
                          {t("profile.badge.showing")}
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
                        {t("profile.btn.switch")}
                      </button>
                    )}
                    <button
                      onClick={() => handleEditProfile(p)}
                      className="text-xs bg-background border border-card-border text-foreground px-3 py-2 rounded-lg hover:border-accent-orange/50 transition-colors"
                    >
                      {t("common.edit")}
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        aria-label={`${p.name || t("profile.delete.fallbackName")} ${t("common.delete")}`}
                        className="text-[11px] text-muted/70 border border-transparent hover:text-red-600 hover:border-red-200 hover:bg-red-50 px-2.5 py-2 rounded-lg transition-colors ml-1"
                      >
                        {t("common.delete")}
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
            {t("profile.empty.prompt")}
          </p>
          <button
            onClick={handleAddNew}
            className="bg-accent-orange text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-accent-orange/90 transition-colors"
          >
            {t("profile.empty.cta")}
          </button>
        </div>
      )}

      {/* 入力フォーム */}
      {(isEditing || profiles.length === 0) && (
        <>
          {profiles.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                {form.id ? t("profile.form.editing") : t("profile.form.addNew")}
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
                {t("common.cancel")}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 種別 */}
            <div className="space-y-2">
              <label className="block text-sm text-accent-gold">
                {t("profile.form.categoryLabel")}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    { value: "self", labelKey: "profile.badge.self" },
                    { value: "family", labelKey: "profile.badge.family" },
                    { value: "student", labelKey: "profile.badge.student" },
                    { value: "client", labelKey: "profile.badge.client" },
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
                      {t(opt.labelKey)}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted">
                {t("profile.form.categoryNote")}
              </p>
            </div>

            {/* 性別（任意） */}
            <div className="space-y-2">
              <label className="block text-sm text-accent-gold">
                {t("profile.form.genderLabel")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "female", labelKey: "profile.gender.female" },
                    { value: "male", labelKey: "profile.gender.male" },
                    { value: "other", labelKey: "profile.gender.other" },
                  ] as const
                ).map((opt) => {
                  const current = form.gender ?? "other";
                  const active = current === opt.value;
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
                        name="gender"
                        value={opt.value}
                        checked={active}
                        onChange={handleChange}
                        className="hidden"
                      />
                      {t(opt.labelKey)}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 名前 */}
            <div className="space-y-2">
              <label className="block text-sm text-accent-gold">
                {t("profile.form.nameLabel")}
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={t("profile.form.namePlaceholder")}
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange transition-colors"
              />
            </div>

            {/* 生年月日 */}
            <div className="space-y-2">
              <label className="block text-sm text-accent-gold">
                {t("profile.form.birthDateLabel")} <span className="text-danger">{t("profile.form.required")}</span>
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
                {t("profile.form.birthTimeLabel")}
              </label>
              <input
                type="time"
                name="birthTime"
                value={form.birthTime}
                onChange={handleChange}
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent-orange transition-colors"
              />
              <p className="text-xs text-muted leading-relaxed">
                {t("profile.form.birthTimeNote")}
              </p>
            </div>

            {/* 出生地 */}
            <div className="space-y-2">
              <label className="block text-sm text-accent-gold">
                {t("profile.form.birthPlaceLabel")}
              </label>
              <input
                type="text"
                name="birthPlace"
                value={form.birthPlace}
                onChange={handleChange}
                placeholder={t("profile.form.birthPlacePlaceholder")}
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange transition-colors"
              />
            </div>

            {/* メモ（受講生用） */}
            {(form.category ?? "self") === "student" && (
              <div className="space-y-2">
                <label className="block text-sm text-accent-gold">
                  {t("profile.form.studentMemoLabel")}
                </label>
                <textarea
                  name="note"
                  value={form.note ?? ""}
                  onChange={handleChange}
                  rows={4}
                  placeholder={t("profile.form.studentMemoPlaceholder")}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange transition-colors resize-y"
                />
                <p className="text-xs text-muted">
                  {t("profile.form.studentMemoNote")}
                </p>
              </div>
            )}

            {/* 保存ボタン */}
            <button
              type="submit"
              className="w-full py-3 bg-accent-orange text-white rounded-full font-medium hover:bg-accent-light transition-colors disabled:opacity-50"
              disabled={!form.birthDate}
            >
              {saved ? t("profile.form.saved") : form.id ? t("profile.form.update") : t("profile.form.save")}
            </button>
          </form>
        </>
      )}

      {/* データ管理 */}
      <section className="border-t border-card-border pt-6 space-y-4">
        <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
          <span>◈</span> {t("profile.data.title")}
        </h3>
        <p className="text-xs text-muted">
          {t("profile.data.desc")}
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 py-2.5 bg-card-bg border border-card-border rounded-xl text-sm font-medium text-foreground hover:border-accent-orange/50 transition-colors"
          >
            {t("profile.data.export")}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 bg-card-bg border border-card-border rounded-xl text-sm font-medium text-foreground hover:border-accent-orange/50 transition-colors"
          >
            {t("profile.data.import")}
          </button>
        </div>

        {importStatus === "success" && (
          <p className="text-xs text-accent-gold text-center">
            {t("profile.data.importSuccess")}
          </p>
        )}
        {importStatus === "error" && (
          <p className="text-xs text-danger text-center">
            {t("profile.data.importError")}
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
          {t("profile.data.importNote")}
        </p>
      </section>

      {/* 規約類リンク */}
      <section className="pt-2 text-center text-xs space-x-3">
        <a
          href="/terms"
          className="text-muted underline hover:text-accent-orange"
        >
          {t("profile.terms")}
        </a>
        <span className="text-muted/40">/</span>
        <a
          href="/privacy"
          className="text-muted underline hover:text-accent-orange"
        >
          {t("profile.privacy")}
        </a>
      </section>
    </div>
  );
}
