"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  loadProfile,
  loadReadings,
  saveReading,
  deleteReading,
  type ManualReading,
} from "@/lib/storage";

const READING_TYPES = [
  {
    value: "fourpillars",
    label: "四柱推命",
    icon: "🏛️",
    fields: [
      { key: "yearPillar", label: "年柱" },
      { key: "monthPillar", label: "月柱" },
      { key: "dayPillar", label: "日柱" },
      { key: "hourPillar", label: "時柱" },
      { key: "dayMaster", label: "日主（日干）" },
      { key: "fiveElements", label: "五行バランス" },
      { key: "luckyElement", label: "用神（ラッキー五行）" },
      { key: "personality", label: "性格・特徴" },
    ],
  },
  {
    value: "sanmeigaku",
    label: "算命学",
    icon: "🌿",
    fields: [
      { key: "mainStar", label: "主星" },
      { key: "bodyChart", label: "人体星図" },
      { key: "tenchu", label: "天中殺" },
      { key: "personality", label: "性格・特徴" },
    ],
  },
  {
    value: "horoscope",
    label: "西洋占星術",
    icon: "♈",
    fields: [
      { key: "sunSign", label: "太陽星座" },
      { key: "moonSign", label: "月星座" },
      { key: "ascendant", label: "アセンダント（ASC）" },
      { key: "mc", label: "MC（天頂）" },
      { key: "aspects", label: "主要なアスペクト" },
      { key: "personality", label: "性格・特徴" },
    ],
  },
  {
    value: "other",
    label: "その他",
    icon: "☽",
    fields: [
      { key: "source", label: "占術名・鑑定元" },
      { key: "result", label: "鑑定結果" },
    ],
  },
] as const;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function ReadingsPage() {
  const router = useRouter();
  const [readings, setReadings] = useState<ManualReading[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // フォーム状態
  const [selectedType, setSelectedType] = useState("fourpillars");
  const [label, setLabel] = useState("");
  const [fieldData, setFieldData] = useState<Record<string, string>>({});
  const [memo, setMemo] = useState("");
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.push("/profile");
      return;
    }
    setReadings(loadReadings());
  }, [router]);

  const resetForm = useCallback(() => {
    setSelectedType("fourpillars");
    setLabel("");
    setFieldData({});
    setMemo("");
    setImageBase64(undefined);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleSave = useCallback(() => {
    const typeConfig = READING_TYPES.find((t) => t.value === selectedType);
    const autoLabel = label.trim() || typeConfig?.label || "鑑定結果";

    const reading: ManualReading = {
      id: editingId || generateId(),
      type: selectedType,
      label: autoLabel,
      data: fieldData,
      memo: memo.trim(),
      imageBase64,
      createdAt: editingId
        ? readings.find((r) => r.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: editingId ? new Date().toISOString() : undefined,
    };

    saveReading(reading);
    setReadings(loadReadings());
    resetForm();
  }, [selectedType, label, fieldData, memo, imageBase64, editingId, readings, resetForm]);

  const handleEdit = useCallback((reading: ManualReading) => {
    setSelectedType(reading.type);
    setLabel(reading.label);
    setFieldData(reading.data);
    setMemo(reading.memo);
    setImageBase64(reading.imageBase64);
    setEditingId(reading.id);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteReading(id);
    setReadings(loadReadings());
  }, []);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFieldData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const typeConfig = READING_TYPES.find((t) => t.value === selectedType);

  // 信頼度バッジ
  const trustBadge = (type: string) => {
    if (type === "other") return { label: "手動登録", color: "#a0917b" };
    return { label: "プロ鑑定", color: "#f97316" };
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">✦</span>
        鑑定結果登録
      </h2>

      <p className="text-xs text-muted">
        プロに鑑定してもらった結果や、他のサイトで調べた結果を登録できます。
        登録した情報は将来的に他の画面でも参照されます。
      </p>

      {/* 新規追加ボタン */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-accent-orange text-white rounded-xl py-3 text-sm font-medium hover:bg-accent-orange/90 transition-colors"
        >
          + 鑑定結果を登録する
        </button>
      )}

      {/* 入力フォーム */}
      {showForm && (
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              {editingId ? "鑑定結果を編集" : "新しい鑑定結果"}
            </h3>
            <button
              onClick={resetForm}
              className="text-xs text-muted hover:text-foreground"
            >
              キャンセル
            </button>
          </div>

          {/* 占術タイプ選択 */}
          <div>
            <label className="text-xs text-muted block mb-1.5">占術を選択</label>
            <div className="grid grid-cols-2 gap-1.5">
              {READING_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setSelectedType(t.value);
                    setFieldData({});
                  }}
                  className={`text-xs py-2 px-2 rounded-lg border transition-colors text-left ${
                    selectedType === t.value
                      ? "border-accent-orange bg-accent-orange/10 text-accent-orange"
                      : "border-card-border text-foreground/70 hover:border-accent-orange/50"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ラベル */}
          <div>
            <label className="text-xs text-muted block mb-1.5">
              タイトル（任意）
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`例：${typeConfig?.label || "鑑定結果"}の鑑定（○○先生）`}
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange"
            />
          </div>

          {/* 占術ごとのフィールド */}
          {typeConfig && (
            <div className="space-y-3">
              <label className="text-xs text-muted block">鑑定内容</label>
              {typeConfig.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-xs text-accent-gold block mb-1">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={fieldData[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={`${field.label}を入力`}
                    className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange"
                  />
                </div>
              ))}
            </div>
          )}

          {/* メモ */}
          <div>
            <label className="text-xs text-muted block mb-1.5">メモ（任意）</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="鑑定で言われたこと、気になったポイントなど"
              rows={3}
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-orange resize-none"
            />
          </div>

          {/* 画像アップロード */}
          <ImageUploader
            imageBase64={imageBase64}
            onImageChange={setImageBase64}
          />

          {/* 保存 */}
          <button
            onClick={handleSave}
            className="w-full bg-accent-orange text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-orange/90 transition-colors"
          >
            {editingId ? "更新する" : "保存する"}
          </button>
        </div>
      )}

      {/* 登録済み一覧 */}
      {readings.length > 0 ? (
        <div className="space-y-3">
          {readings
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((reading) => {
              const t = READING_TYPES.find((rt) => rt.value === reading.type);
              const badge = trustBadge(reading.type);
              return (
                <ReadingCard
                  key={reading.id}
                  reading={reading}
                  typeConfig={t}
                  badge={badge}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              );
            })}
        </div>
      ) : !showForm ? (
        <div className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm text-center">
          <p className="text-sm text-muted mb-2">まだ鑑定結果がありません</p>
          <p className="text-xs text-muted/70">
            四柱推命・算命学・西洋占星術など、<br />
            プロに鑑定してもらった結果を登録しておくと<br />
            総合的な分析に活用できます
          </p>
        </div>
      ) : null}

      <p className="text-center text-xs text-muted/60 px-4">
        ※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。
      </p>
    </div>
  );
}

// --- サブコンポーネント ---

function ImageUploader({
  imageBase64,
  onImageChange,
}: {
  imageBase64: string | undefined;
  onImageChange: (base64: string | undefined) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 5MB制限
      if (file.size > 5 * 1024 * 1024) {
        alert("画像は5MB以下にしてください");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        onImageChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onImageChange]
  );

  return (
    <div>
      <label className="text-xs text-muted block mb-1.5">
        鑑定書の画像（任意）
      </label>
      {imageBase64 ? (
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden border border-card-border">
            <img
              src={imageBase64}
              alt="鑑定書"
              className="w-full max-h-48 object-contain bg-background"
            />
          </div>
          <button
            onClick={() => onImageChange(undefined)}
            className="text-xs text-danger hover:text-danger/80"
          >
            画像を削除
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-card-border rounded-xl py-6 text-sm text-muted hover:border-accent-orange/50 hover:text-accent-orange/80 transition-colors"
        >
          タップして画像を選択
          <br />
          <span className="text-[10px]">命式表・ホロスコープなど（5MB以下）</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

function ReadingCard({
  reading,
  typeConfig,
  badge,
  onEdit,
  onDelete,
}: {
  reading: ManualReading;
  typeConfig: (typeof READING_TYPES)[number] | undefined;
  badge: { label: string; color: string };
  onEdit: (reading: ManualReading) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const filledFields = typeConfig?.fields.filter((f) => reading.data[f.key]) || [];

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeConfig?.icon || "☽"}</span>
          <div>
            <p className="text-sm font-medium text-foreground">{reading.label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: badge.color }}
              >
                {badge.label}
              </span>
              <span className="text-[10px] text-muted">
                {new Date(reading.createdAt).toLocaleDateString("ja-JP")}
              </span>
            </div>
          </div>
        </div>

        {/* メニュー */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-muted hover:text-foreground text-sm px-1"
          >
            ···
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 bg-card-bg border border-card-border rounded-lg shadow-lg z-10 min-w-[100px]">
              <button
                onClick={() => {
                  onEdit(reading);
                  setShowMenu(false);
                }}
                className="block w-full text-left text-xs px-3 py-2 hover:bg-accent-orange/5 text-foreground/80"
              >
                編集
              </button>
              <button
                onClick={() => {
                  onDelete(reading.id);
                  setShowMenu(false);
                }}
                className="block w-full text-left text-xs px-3 py-2 hover:bg-danger/5 text-danger"
              >
                削除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 概要（主要フィールド1〜2個） */}
      {filledFields.length > 0 && (
        <div className="text-xs space-y-1">
          {filledFields.slice(0, expanded ? filledFields.length : 2).map((f) => (
            <p key={f.key}>
              <span className="text-muted">{f.label}：</span>
              <span className="text-foreground/80">{reading.data[f.key]}</span>
            </p>
          ))}
        </div>
      )}

      {/* 展開トグル */}
      {filledFields.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] text-muted hover:text-accent-gold flex items-center gap-1"
        >
          <span>{expanded ? "▾" : "▸"}</span>
          {expanded ? "閉じる" : `他${filledFields.length - 2}件を表示`}
        </button>
      )}

      {/* メモ */}
      {reading.memo && (
        <p className="text-xs text-muted/80 bg-background/50 rounded-lg p-2">
          {reading.memo}
        </p>
      )}

      {/* 画像サムネイル */}
      {reading.imageBase64 && (
        <div className="rounded-xl overflow-hidden border border-card-border">
          <img
            src={reading.imageBase64}
            alt="鑑定書"
            className="w-full max-h-32 object-contain bg-background cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          />
        </div>
      )}
    </div>
  );
}
