"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  loadProfiles,
  loadProfile,
  saveProfile,
  switchProfile,
  type UserProfile,
} from "@/lib/storage";
import {
  calcCompatibility,
  MODE_LABELS,
  type RelationMode,
} from "@/lib/divination/compatibility";

type PartnerSource = "profile" | "manual";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function CompatibilityPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [profileAId, setProfileAId] = useState<string>("");
  const [profileBId, setProfileBId] = useState<string>("");
  const [mode, setMode] = useState<RelationMode>("love");
  const [partnerSource, setPartnerSource] = useState<PartnerSource>("profile");
  const [manualName, setManualName] = useState<string>("");
  const [manualBirthDate, setManualBirthDate] = useState<string>("");
  const [savedMessage, setSavedMessage] = useState<string>("");

  useEffect(() => {
    const list = loadProfiles();
    if (list.length === 0) {
      router.push("/profile");
      return;
    }
    setProfiles(list);
    const active = loadProfile();
    setProfileAId(active?.id || list[0].id);
    // 最初のB候補（A以外、なければA自身）
    const otherId = list.find((p) => p.id !== (active?.id || list[0].id))?.id;
    if (otherId) {
      setProfileBId(otherId);
    } else {
      setPartnerSource("manual");
    }
  }, [router]);

  function handleSaveManualToProfiles() {
    if (!manualBirthDate || !manualName.trim()) {
      setSavedMessage("名前と生年月日を入力してください");
      return;
    }
    // 重複チェック（名前+生年月日）
    const exists = profiles.find(
      (p) => p.name === manualName.trim() && p.birthDate === manualBirthDate
    );
    if (exists) {
      setSavedMessage(`${manualName} さんは既に登録済みです`);
      setPartnerSource("profile");
      setProfileBId(exists.id);
      return;
    }
    const newProfile: UserProfile = {
      id: generateId(),
      name: manualName.trim(),
      birthDate: manualBirthDate,
      birthTime: "",
      birthPlace: "",
    };
    saveProfile(newProfile);
    // saveProfile は activeProfileId を変えてしまうため、自分のIDに戻す
    if (profileAId) {
      switchProfile(profileAId);
    }
    setProfiles(loadProfiles());
    setSavedMessage(`${newProfile.name} さんを登録しました`);
    setPartnerSource("profile");
    setProfileBId(newProfile.id);
    setManualName("");
    setManualBirthDate("");
  }

  const profileA = useMemo(
    () => profiles.find((p) => p.id === profileAId) || null,
    [profiles, profileAId]
  );
  const profileB = useMemo(() => {
    if (partnerSource === "profile") {
      return profiles.find((p) => p.id === profileBId) || null;
    }
    if (manualBirthDate) {
      return {
        id: "manual",
        name: manualName || "お相手",
        birthDate: manualBirthDate,
        birthTime: "",
        birthPlace: "",
      } as UserProfile;
    }
    return null;
  }, [partnerSource, profiles, profileBId, manualName, manualBirthDate]);

  const result = useMemo(() => {
    if (!profileA || !profileB) return null;
    if (profileA.id === profileB.id && partnerSource === "profile") return null;
    return calcCompatibility(profileA.birthDate, profileB.birthDate, mode);
  }, [profileA, profileB, mode, partnerSource]);

  if (profiles.length === 0) {
    return <p className="text-muted text-center py-10">読み込み中...</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">♡</span>
        相性診断
      </h2>

      {/* モード選択 */}
      <div className="grid grid-cols-3 gap-1.5">
        {(Object.keys(MODE_LABELS) as RelationMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`py-2 rounded-xl text-xs font-medium border transition-all ${
              mode === m
                ? "bg-accent-orange text-white border-accent-orange shadow-sm"
                : "bg-card-bg border-card-border text-muted hover:text-accent-orange"
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* 自分（A）の選択 */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <label className="text-xs font-medium text-muted">自分</label>
        <select
          value={profileAId}
          onChange={(e) => setProfileAId(e.target.value)}
          className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}（{p.birthDate}）
            </option>
          ))}
        </select>
      </div>

      {/* 相手（B）の選択 */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
        <label className="text-xs font-medium text-muted">相手を選ぶ</label>

        {/* 大きなタブ */}
        <div className="grid grid-cols-2 gap-1.5 bg-background rounded-xl p-1">
          <button
            onClick={() => setPartnerSource("profile")}
            className={`py-2 rounded-lg text-xs font-medium transition-all ${
              partnerSource === "profile"
                ? "bg-accent-orange text-white shadow-sm"
                : "text-muted hover:text-accent-orange"
            }`}
          >
            📋 登録済みから選ぶ
          </button>
          <button
            onClick={() => setPartnerSource("manual")}
            className={`py-2 rounded-lg text-xs font-medium transition-all ${
              partnerSource === "manual"
                ? "bg-accent-orange text-white shadow-sm"
                : "text-muted hover:text-accent-orange"
            }`}
          >
            ✎ 新しい人を入力
          </button>
        </div>

        {partnerSource === "profile" ? (
          <div className="space-y-2">
            <select
              value={profileBId}
              onChange={(e) => setProfileBId(e.target.value)}
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground"
            >
              <option value="">-- 選択してください --</option>
              {profiles
                .filter((p) => p.id !== profileAId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}（{p.birthDate}）
                  </option>
                ))}
            </select>
            <Link
              href="/profile"
              className="inline-block text-[11px] text-accent-gold hover:text-accent-orange"
            >
              + 新しい人をプロフィール登録する
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="お名前（必須なら保存可能）"
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={manualBirthDate}
              onChange={(e) => setManualBirthDate(e.target.value)}
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={handleSaveManualToProfiles}
              disabled={!manualName.trim() || !manualBirthDate}
              className="w-full py-2 bg-accent-gold/20 border border-accent-gold/40 text-accent-gold hover:bg-accent-gold/30 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium rounded-lg transition-colors"
            >
              ★ この人を「登録済み」に保存する（次回も使える）
            </button>
            {savedMessage && (
              <p className="text-[11px] text-accent-orange">{savedMessage}</p>
            )}
            <p className="text-[10px] text-muted/80 leading-relaxed">
              ※ 保存しない場合、この入力内容は画面を閉じると消えます
            </p>
          </div>
        )}
      </div>

      {!result && (
        <div className="bg-card-bg border border-dashed border-card-border rounded-2xl p-6 text-center">
          <p className="text-sm text-muted">相手の情報を選択・入力してください</p>
        </div>
      )}

      {result && profileA && profileB && (
        <div className="space-y-3">
          {/* 2人のサマリー */}
          <div className="flex items-center justify-center gap-2 bg-card-bg border border-card-border rounded-2xl p-3 shadow-sm">
            <div className="text-center flex-1">
              <div className="text-xs text-muted">自分</div>
              <div className="text-sm font-medium text-foreground truncate">{profileA.name}</div>
            </div>
            <div className="text-accent-orange text-xl">♡</div>
            <div className="text-center flex-1">
              <div className="text-xs text-muted">相手</div>
              <div className="text-sm font-medium text-foreground truncate">{profileB.name}</div>
            </div>
          </div>

          {/* 総合相性 */}
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                総合相性（{MODE_LABELS[mode]}）
              </span>
              <span className="text-3xl font-bold text-accent-orange">
                {result.overall}
                <span className="text-xs text-muted ml-0.5">/100</span>
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${result.overall}%`,
                  backgroundColor:
                    result.overall >= 75
                      ? "#f97316"
                      : result.overall >= 55
                      ? "#eab308"
                      : "#a0917b",
                }}
              />
            </div>
            <p className="text-sm text-foreground/80 mt-3">{result.advice}</p>
          </div>

          {/* 強みと注意 */}
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-2xl p-3">
              <p className="text-[10px] text-accent-orange font-bold">◈ この関係の強み</p>
              <p className="text-xs text-foreground/80 mt-1">{result.strength}</p>
            </div>
            <div className="bg-muted/10 border border-card-border rounded-2xl p-3">
              <p className="text-[10px] text-muted font-bold">◈ 意識したいポイント</p>
              <p className="text-xs text-foreground/80 mt-1">{result.caution}</p>
            </div>
          </div>

          {/* 占術別 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
              <span>◈</span> 占術別の相性
            </h3>
            <DimensionCard title="数秘術" color="#8b5cf6" data={result.numerology} />
            <DimensionCard title="マヤ暦" color="#e11d48" data={result.mayan} />
            <DimensionCard title="九星気学" color="#10b981" data={result.nineStar} />
            <DimensionCard title="四柱推命" color="#06b6d4" data={result.fourPillars} />
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted/60 px-4">
        ※ 占いは参考情報です。人間関係の判断はご自身の実感を大切にしてください。
      </p>
    </div>
  );
}

function DimensionCard({
  title,
  color,
  data,
}: {
  title: string;
  color: string;
  data: { score: number; label: string; detail: string };
}) {
  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>
          {data.score}
          <span className="text-xs text-muted">/100</span>
        </span>
      </div>
      <div className="w-full bg-background rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${data.score}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-muted">{data.label}</p>
      <p className="text-xs text-foreground/80">{data.detail}</p>
    </div>
  );
}
