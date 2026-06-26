"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  drawTodayCard,
  drawRandomCard,
  getCardById,
  getCategoryInfo,
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

/** プロフィールの生年月日から salt を作り、人によって「今日の1枚」を変える */
function saltFromProfile(profile: UserProfile | null): number {
  if (!profile?.birthDate) return 0;
  return profile.birthDate
    .split("")
    .reduce((acc, ch) => acc + (ch >= "0" && ch <= "9" ? Number(ch) : 0), 0);
}

/**
 * カード表示。public/cards/NN.png があればその画像（完成カード）を表示し、
 * 無ければ絵文字ベースのカード（EmojiCardFace）にフォールバックする。
 */
function CardFace({ card }: { card: OracleCard }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = `/cards/${String(card.id).padStart(2, "0")}.png`;

  if (imgFailed) return <EmojiCardFace card={card} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${card.name}：${card.message}`}
      onError={() => setImgFailed(true)}
      className="animate-[fadeIn_0.5s_ease] w-full rounded-3xl shadow-md border border-card-border block"
    />
  );
}

/** 画像が無いカード用の、絵文字ベースの表示 */
function EmojiCardFace({ card }: { card: OracleCard }) {
  const cat = getCategoryInfo(card.category);
  const isRainbow = card.category === "common";
  const bg = isRainbow
    ? "linear-gradient(135deg, #f6d6e6 0%, #e6d6f2 30%, #d6e4f5 55%, #d8f0e2 80%, #faeccf 100%)"
    : `linear-gradient(160deg, ${cat.hex}26, ${cat.hex}0d)`;

  return (
    <div
      className="animate-[fadeIn_0.5s_ease] rounded-3xl p-6 shadow-md border border-card-border text-center space-y-4"
      style={{ background: bg }}
    >
      {/* カテゴリ（叡智）バッジ */}
      <div className="flex items-center justify-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
          style={{ background: `${cat.hex}22`, color: cat.hex }}
        >
          <span>{cat.emoji}</span>
          {cat.label}
        </span>
        <span className="text-muted/60 text-xs">No.{card.id}</span>
      </div>

      {/* モチーフ */}
      <div
        className="mx-auto w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-inner float-slow"
        style={{ background: isRainbow ? "#ffffff66" : `${cat.hex}1f` }}
      >
        {card.emoji}
      </div>

      <h2 className="font-mincho text-2xl font-bold text-foreground">
        {card.name}
      </h2>

      <p className="font-mincho text-foreground leading-relaxed px-2">
        {card.message}
      </p>

      <p className="text-[11px] text-muted/70">{cat.theme}</p>
    </div>
  );
}

export default function OraclePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draws, setDraws] = useState<OracleDraw[]>([]);
  const [drawn, setDrawn] = useState<OracleCard | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [mounted, setMounted] = useState(false);

  const salt = useMemo(() => saltFromProfile(profile), [profile]);
  const todayCard = useMemo(() => drawTodayCard(new Date(), salt), [salt]);

  useEffect(() => {
    const p = loadProfile();
    setProfile(p);
    setDraws(loadOracleDraws());
    setMounted(true);
  }, []);

  // 「今日の1枚」を1日1回だけ履歴に記録
  useEffect(() => {
    if (!mounted) return;
    const today = getTodayString();
    const already = draws.some((d) => d.date === today && d.mode === "today");
    if (!already) {
      const entry: OracleDraw = {
        id: makeId(),
        date: today,
        cardId: drawTodayCard(new Date(), salt).id,
        mode: "today",
        createdAt: new Date().toISOString(),
      };
      saveOracleDraw(entry);
      setDraws((prev) => [...prev, entry]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, salt]);

  function handleShuffle() {
    setShuffling(true);
    setDrawn(null);
    // めくる演出
    setTimeout(() => {
      const card = drawRandomCard();
      setDrawn(card);
      setShuffling(false);
      const entry: OracleDraw = {
        id: makeId(),
        date: getTodayString(),
        cardId: card.id,
        mode: "random",
        createdAt: new Date().toISOString(),
      };
      saveOracleDraw(entry);
      setDraws((prev) => [...prev, entry]);
    }, 600);
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
          5つの叡智から、今日のあなたに必要なメッセージを
        </p>
      </header>

      {/* 今日の1枚 */}
      <section className="animate-fade-up space-y-2" style={{ animationDelay: "0.05s" }}>
        <div className="flex items-center gap-2 text-accent-gold text-sm px-1">
          <span className="sparkle">☀</span>
          <span>今日の1枚</span>
          {profile && (
            <span className="text-muted text-xs ml-auto">
              {profile.name} さんへ
            </span>
          )}
        </div>
        <CardFace card={todayCard} />
      </section>

      {/* シャッフルして引く */}
      <section className="animate-fade-up space-y-3" style={{ animationDelay: "0.12s" }}>
        <div className="flex items-center gap-2 text-accent-orange text-sm px-1">
          <span className="sparkle">✨</span>
          <span>もう一枚、引いてみる</span>
        </div>

        {shuffling && (
          <div className="rounded-3xl p-10 border border-card-border bg-card-bg shadow-sm text-center">
            <div className="text-5xl animate-bounce">🃏</div>
            <p className="text-sm text-muted mt-3">シャッフル中...</p>
          </div>
        )}

        {!shuffling && drawn && <CardFace card={drawn} />}

        {!shuffling && !drawn && (
          <p className="text-center text-sm text-muted/70 py-2">
            気持ちを落ち着けて、下のボタンを押してください。
          </p>
        )}

        <button
          onClick={handleShuffle}
          disabled={shuffling}
          className="w-full bg-accent-orange text-white rounded-full px-5 py-3 font-medium shadow-sm hover:bg-accent-light transition-colors disabled:opacity-60"
        >
          {drawn ? "もう一度シャッフルして引く" : "シャッフルして1枚引く"}
        </button>
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
