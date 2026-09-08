/** ノボケアのゲーム共通インターフェース */

export interface GameResult {
  /** 正解数（記憶めくりはペア数） */
  correct: number;
  /** 出題数（記憶めくりはめくった回数＝手数） */
  total: number;
  timeMs: number;
}

export interface GameProps {
  level: number;
  onFinish: (result: GameResult) => void;
}

/** 配列をシャッフルした新しい配列を返す（Fisher-Yates） */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}
