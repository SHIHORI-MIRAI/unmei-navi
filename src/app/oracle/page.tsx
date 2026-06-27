"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCardById,
  getCategoryInfo,
  ORACLE_CARDS,
  type OracleCard,
} from "@/lib/divination";
import {
  loadProfile,
  loadOracleDraws,
  saveOracleDraw,
  type UserProfile,
  type OracleDraw,
} from "@/lib/storage";

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * カード表示。public/cards/NN.jpg があれば完成カード画像をそのまま表示し、
 * 無ければアプリが枠・番号・名前・メッセージを描く FallbackCard を表示する。
 */
function CardFace({ card }: { card: OracleCard }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = `/cards/${String(card.id).padStart(2, "0")}.jpg`;

  if (!imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${card.name}：${card.message}`}
        onError={() => setImgFailed(true)}
        className="animate-[fadeIn_0.5s_ease] w-full rounded-[26px] shadow-md border border-card-border block mx-auto max-w-[20rem]"
      />
    );
  }

  return <FallbackCard card={card} />;
}

/**
 * 画像がまだ無いカード用。アプリ側でカード枠（番号・カード名・メッセージ・
 * モチーフ絵文字）を明朝体で描画する。
 */
function FallbackCard({ card }: { card: OracleCard }) {
  const cat = getCategoryInfo(card.category);
  const isRainbow = card.category === "common";
  const frameBg = isRainbow
    ? "linear-gradient(160deg, #fffaf3, #fdf4ea)"
    : `linear-gradient(160deg, ${cat.hex}12, #fffdf8)`;

  return (
    <div
      className="animate-[fadeIn_0.5s_ease] relative rounded-[26px] p-5 mx-auto max-w-[20rem]"
      style={{
        background: frameBg,
        border: `2px solid ${cat.hex}55`,
        boxShadow: `inset 0 0 0 1px ${cat.hex}22, 0 8px 24px rgba(120, 90, 30, 0.10)`,
      }}
    >
      {/* カテゴリ（叡智）バッジ */}
      <div className="flex items-center justify-center mb-2">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-0.5 rounded-full"
          style={{ background: `${cat.hex}1f`, color: cat.hex }}
        >
          <span>{cat.emoji}</span>
          {cat.label}
        </span>
      </div>

      {/* 番号バッジ */}
      <div
        className="mx-auto mb-2 w-12 h-12 rounded-full flex items-center justify-center font-mincho text-xl font-bold sparkle"
        style={{
          color: cat.hex,
          border: `2px solid ${cat.hex}66`,
          background: "#fffdf8",
        }}
      >
        {card.id}
      </div>

      {/* カード名 */}
      <h2 className="font-mincho text-2xl font-bold text-foreground text-center">
        {card.name}
      </h2>
      <div className="text-center text-accent-gold/70 text-sm mb-3">— ✦ —</div>

      {/* モチーフ */}
      <div
        className="w-full aspect-[4/3] rounded-2xl flex items-center justify-center text-6xl shadow-inner"
        style={{ background: `${cat.hex}1f` }}
      >
        <span className="float-slow">{card.emoji}</span>
      </div>

      {/* メッセージ */}
      <div
        className="mt-4 rounded-2xl px-4 py-3 text-center"
        style={{ background: "rgba(255,253,248,0.6)", border: `1px solid ${cat.hex}33` }}
      >
        <p className="font-mincho text-foreground leading-relaxed">
          {card.message}
        </p>
      </div>

      <p className="text-center text-[11px] text-muted/70 mt-3">{cat.theme}</p>
    </div>
  );
}

/**
 * 裏向きのカード（カードの背面）。画像を使わず、オレンジ×ゴールドの
 * 星・月モチーフを CSS で描く。シャッフル演出と選択用に使い回す。
 */
function CardBack({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative rounded-[18px] overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(150deg, #f5a623 0%, #e8820c 55%, #c4942a 100%)",
        border: "2px solid #fbe6c2",
        boxShadow: "0 6px 16px rgba(120, 80, 20, 0.22)",
      }}
    >
      {/* 内枠 */}
      <div
        className="absolute inset-[6px] rounded-[12px] flex items-center justify-center"
        style={{ border: "1px solid rgba(255,255,255,0.55)" }}
      >
        <span className="text-white/90 text-2xl sparkle">✦</span>
      </div>
      {/* 四隅の小さな星 */}
      <span className="absolute top-1.5 left-2 text-white/70 text-[10px]">✧</span>
      <span className="absolute bottom-1.5 right-2 text-white/70 text-[10px]">✧</span>
      <span className="absolute top-1.5 right-2 text-white/60 text-[9px]">·</span>
      <span className="absolute bottom-1.5 left-2 text-white/60 text-[9px]">·</span>
    </div>
  );
}

/** シャッフル中の演出：3枚の山札が左右に抜き差しされる */
function ShufflingDeck() {
  return (
    <div className="rounded-3xl py-12 border border-card-border bg-card-bg shadow-sm text-center">
      <div className="relative h-32 flex items-center justify-center">
        <CardBack className="absolute w-20 h-28 shuffle-left" />
        <CardBack className="absolute w-20 h-28" />
        <CardBack className="absolute w-20 h-28 shuffle-right" />
      </div>
      <p className="text-sm text-muted mt-2 sparkle">シャッフル中...</p>
    </div>
  );
}

const FAN_COUNT = 3; // 選んでもらうために並べる枚数

/** Fisher–Yates でシャッフルした山札を返す */
function shuffleDeck(): OracleCard[] {
  const arr = [...ORACLE_CARDS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function OraclePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draws, setDraws] = useState<OracleDraw[]>([]);
  const [drawn, setDrawn] = useState<OracleCard | null>(null);
  // phase: シャッフル中 → 選んでもらう → 結果表示
  const [phase, setPhase] = useState<"shuffling" | "choosing" | "revealed">(
    "shuffling"
  );
  const [deck, setDeck] = useState<OracleCard[]>([]);
  // シャッフル演出 → 選んでもらう状態へ
  function startShuffle() {
    setDrawn(null);
    setPhase("shuffling");
    setTimeout(() => {
      setDeck(shuffleDeck());
      setPhase("choosing");
    }, 5000);
  }

  useEffect(() => {
    setProfile(loadProfile());
    setDraws(loadOracleDraws());
    // 開いたらすぐ自動でシャッフルを始める
    startShuffle();
  }, []);

  // 扇の中から1枚をタップで選ぶ
  function handlePick(index: number) {
    const card = deck[index];
    if (!card) return;
    setDrawn(card);
    setPhase("revealed");
    const entry: OracleDraw = {
      id: makeId(),
      date: getTodayString(),
      cardId: card.id,
      mode: "random",
      createdAt: new Date().toISOString(),
    };
    saveOracleDraw(entry);
    setDraws((prev) => [...prev, entry]);
  }

  // 履歴（新しい順、最新10件）
  const history = [...draws]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  return (
    <div className="space-y-6 pb-4">
      <header className="animate-fade-up text-center space-y-1 pt-2">
        <h1 className="font-mincho text-xl font-bold text-foreground">
          🃏 オラクルカード
        </h1>
        <p className="text-xs text-muted">
          シャッフルして、今のあなたに必要な1枚を選びましょう
        </p>
      </header>

      {/* シャッフル → 好きな1枚を選ぶ */}
      <section className="animate-fade-up space-y-3" style={{ animationDelay: "0.05s" }}>
        {/* シャッフル中 */}
        {phase === "shuffling" && <ShufflingDeck />}

        {/* 選んでもらう（扇形に裏向きで並ぶ） */}
        {phase === "choosing" && (
          <div className="space-y-4">
            <p className="text-center font-mincho text-foreground">
              まずは、好きなカードを1枚選んでください
              {profile?.name && (
                <span className="block text-xs text-muted mt-1">
                  {profile.name} さんの直感を信じて ✦
                </span>
              )}
            </p>

            {/* 3枚から選ぶ */}
            <div className="flex items-center justify-center gap-3 sm:gap-5 py-4 select-none">
              {Array.from({ length: FAN_COUNT }).map((_, i) => {
                const angle = (i - (FAN_COUNT - 1) / 2) * 5; // ほんの少し扇形に
                return (
                  <button
                    key={i}
                    onClick={() => handlePick(i)}
                    aria-label={`${i + 1}枚目のカードを選ぶ`}
                    className="origin-bottom transition-transform duration-200 hover:-translate-y-3 focus:-translate-y-3 focus:outline-none animate-fan-in"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      animationDelay: `${i * 0.12}s`,
                    }}
                  >
                    <CardBack className="w-[92px] h-[140px]" />
                  </button>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted/70">
              ピンと来た1枚をタップ
            </p>
          </div>
        )}

        {/* 結果 */}
        {phase === "revealed" && drawn && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-accent-gold text-sm">
              <span className="sparkle">✦</span>
              <span>あなたが選んだカード</span>
            </div>
            <div className="animate-flip-in">
              <CardFace card={drawn} />
            </div>
            <button
              onClick={startShuffle}
              className="w-full bg-accent-orange text-white rounded-full px-5 py-3 font-medium shadow-sm hover:bg-accent-light transition-colors"
            >
              もう一度シャッフルして選ぶ
            </button>
          </div>
        )}
      </section>

      {/* 使い方 */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm">
        <p className="font-mincho text-accent-gold text-sm text-center mb-3">
          オラクルカードの使い方
        </p>
        <ol className="space-y-2 text-xs text-foreground/80">
          {[
            ["心を落ち着ける", "深呼吸をして、今の自分に意識を向けます。"],
            ["カードを引く", "直感で1枚を選びます。"],
            ["メッセージを読む", "カードのメッセージを心で受け取ります。"],
            ["行動のヒントにする", "今日の行動のヒントとして活かしましょう。"],
          ].map(([title, desc], i) => (
            <li key={i} className="flex gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-orange/15 text-accent-orange text-[11px] flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <span>
                <span className="font-medium text-foreground">{title}</span>
                <span className="text-muted">　{desc}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* 履歴 */}
      {history.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-accent-gold text-sm px-1">
            <span>📖</span>
            <span>これまでに引いたカード</span>
          </div>
          <div className="bg-card-bg border border-card-border rounded-2xl shadow-sm divide-y divide-card-border">
            {history.map((d) => {
              const card = getCardById(d.cardId);
              if (!card) return null;
              const cat = getCategoryInfo(card.category);
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="text-xl">{card.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-foreground font-medium">
                      {card.name}
                    </span>
                    <span
                      className="text-xs ml-2"
                      style={{ color: cat.hex }}
                    >
                      {cat.label}
                    </span>
                  </div>
                  <span className="text-muted/70 text-xs whitespace-nowrap">
                    {d.mode === "today" ? "今日の1枚 " : ""}
                    {d.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 免責 */}
      <p className="text-center text-xs text-muted/70 px-4 leading-relaxed">
        このカードは未来を決めつけるものではなく、あなたの可能性を広げるための
        メッセージです。自分の直感を信じて、自由に受け取ってください。
      </p>

      <div className="text-center">
        <Link href="/" className="text-sm text-accent-orange hover:underline">
          ← ホームに戻る
        </Link>
      </div>
    </div>
  );
}
