"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  drawTodayCard,
  drawRandomCard,
  getCardById,
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

/** カード1枚の表示 */
function CardFace({ card }: { card: OracleCard }) {
  return (
    <div
      className="rounded-3xl p-6 shadow-md border border-card-border text-center space-y-4"
      style={{
        background: `linear-gradient(160deg, ${card.hex}26, ${card.hex}0d)`,
      }}
    >
      <div
        className="mx-auto w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-inner"
        style={{ background: `${card.hex}1f` }}
      >
        {card.emoji}
      </div>
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">{card.name}</h2>
        <p
          className="inline-block text-xs font-medium px-3 py-1 rounded-full"
          style={{ background: `${card.hex}22`, color: card.hex }}
        >
          {card.keyword}
        </p>
      </div>
      <p className="text-foreground font-medium leading-relaxed">
        {card.message}
      </p>
      <div className="bg-white/60 rounded-2xl p-3 text-sm text-foreground/80 leading-relaxed">
        <span className="text-accent-gold">✦ 今日の過ごし方</span>
        <br />
        {card.advice}
      </div>
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
  const todayCard = useMemo(
    () => drawTodayCard(new Date(), salt),
    [salt]
  );

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
    const already = draws.some(
      (d) => d.date === today && d.mode === "today"
    );
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
      <header className="text-center space-y-1 pt-2">
        <h1 className="text-xl font-bold text-foreground">
          🃏 オラクルカード
        </h1>
        <p className="text-xs text-muted">
          カードからのメッセージを受け取りましょう
        </p>
      </header>

      {/* 今日の1枚 */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-accent-gold text-sm px-1">
          <span>☀</span>
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
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-accent-orange text-sm px-1">
          <span>✨</span>
          <span>もう一枚、引いてみる</span>
        </div>

        {shuffling && (
          <div className="rounded-3xl p-10 border border-card-border bg-card-bg shadow-sm text-center">
            <div className="text-5xl animate-bounce">🃏</div>
            <p className="text-sm text-muted mt-3">シャッフル中...</p>
          </div>
        )}

        {!shuffling && drawn && (
          <div className="animate-[fadeIn_0.4s_ease]">
            <CardFace card={drawn} />
          </div>
        )}

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
                    <span className="text-muted text-xs ml-2">
                      {card.keyword}
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
      <p className="text-center text-xs text-muted/60 px-4">
        ※ 占いは参考情報です。心を軽くするヒントとしてお楽しみください。
      </p>

      <div className="text-center">
        <Link
          href="/"
          className="text-sm text-accent-orange hover:underline"
        >
          ← ホームに戻る
        </Link>
      </div>
    </div>
  );
}
