/**
 * オラクルカード「運命ナビ オラクルカード 全36枚」
 *
 * 5つの叡智（九星気学・四柱推命・数秘術・マヤ暦・算命学）各7枚＋
 * すべての叡智からの祝福「共通カード」1枚＝計36枚。
 *
 * - 「今日の1枚」は日付＋プロフィールから決定的に選ばれる（同じ日は同じカード）。
 * - 「シャッフルして引く」は毎回ランダム。
 *
 * このカードは未来を決めつけるものではなく、可能性を広げるためのメッセージ。
 * 全カードを前向きな表現で統一している。
 */

export type OracleCategory =
  | "nine-star" // 九星気学
  | "four-pillars" // 四柱推命
  | "numerology" // 数秘術
  | "mayan" // マヤ暦
  | "sanmeigaku" // 算命学
  | "common"; // 共通カード

export interface OracleCategoryInfo {
  key: OracleCategory;
  label: string;
  theme: string;
  emoji: string;
  hex: string;
}

/** カテゴリ（叡智）ごとの定義。色はカード一覧のトーンに合わせている */
export const ORACLE_CATEGORIES: Record<OracleCategory, OracleCategoryInfo> = {
  "nine-star": { key: "nine-star", label: "九星気学", theme: "運命の流れを読み解く", emoji: "✦", hex: "#d4a843" },
  "four-pillars": { key: "four-pillars", label: "四柱推命", theme: "人生の設計図を読み解く", emoji: "❀", hex: "#9683c4" },
  numerology: { key: "numerology", label: "数秘術", theme: "数字が語るあなたの本質", emoji: "❉", hex: "#6f9fd8" },
  mayan: { key: "mayan", label: "マヤ暦", theme: "宇宙のリズムとつながる", emoji: "✺", hex: "#57b394" },
  sanmeigaku: { key: "sanmeigaku", label: "算命学", theme: "宿命と才能を見抜く", emoji: "❀", hex: "#dd83a6" },
  common: { key: "common", label: "共通カード", theme: "すべての叡智からの祝福", emoji: "✷", hex: "#b98ad0" },
};

export interface OracleCard {
  id: number;
  category: OracleCategory;
  name: string; // カード名
  message: string; // メッセージ
  emoji: string; // モチーフ絵文字
}

export const ORACLE_CARDS: OracleCard[] = [
  // ── 九星気学（運命の流れを読み解く）──
  { id: 1, category: "nine-star", name: "流れに乗る", emoji: "🌊",
    message: "タイミングは最適です。自然の流れに身を委ねましょう。" },
  { id: 2, category: "nine-star", name: "光を信じる", emoji: "☀️",
    message: "希望の光があなたを照らしています。前を向いて進みましょう。" },
  { id: 3, category: "nine-star", name: "整える", emoji: "🍃",
    message: "環境や心を整えることで、運気が動き出します。" },
  { id: 4, category: "nine-star", name: "出会い", emoji: "🌷",
    message: "素敵なご縁が近づいています。心を開いて受け取りましょう。" },
  { id: 5, category: "nine-star", name: "変化を楽しむ", emoji: "🦋",
    message: "変化は成長のチャンスです。新しい自分に出会えます。" },
  { id: 6, category: "nine-star", name: "手放し", emoji: "🌬️",
    message: "不要なものを手放すことで、新しい運が入ってきます。" },
  { id: 7, category: "nine-star", name: "豊かさの受け取り", emoji: "🏆",
    message: "受け取ることを許可しましょう。豊かさはあなたのものです。" },

  // ── 四柱推命（人生の設計図を読み解く）──
  { id: 8, category: "four-pillars", name: "自分を知る", emoji: "🪞",
    message: "本当の自分を知ることが、人生を変える第一歩です。" },
  { id: 9, category: "four-pillars", name: "使命を思い出す", emoji: "📖",
    message: "あなたには果たすべき使命があります。思い出しましょう。" },
  { id: 10, category: "four-pillars", name: "根を大切にする", emoji: "🌳",
    message: "あなたを支える家族やルーツに感謝の気持ちを伝えましょう。" },
  { id: 11, category: "four-pillars", name: "努力は実る", emoji: "🌠",
    message: "今の努力は必ず未来の実りとなって返ってきます。" },
  { id: 12, category: "four-pillars", name: "信頼する", emoji: "🧭",
    message: "人生の流れを信じて、安心して進みましょう。" },
  { id: 13, category: "four-pillars", name: "学びの時", emoji: "📚",
    message: "学びは、未来の自分への最高の贈り物です。" },
  { id: 14, category: "four-pillars", name: "タイミングを見る", emoji: "⏳",
    message: "焦らず、最適なタイミングを見極めることが成功の鍵です。" },

  // ── 数秘術（数字が語るあなたの本質）──
  { id: 15, category: "numerology", name: "自由を選ぶ", emoji: "🕊️",
    message: "自分の人生を自分で選ぶ勇気を持ちましょう。" },
  { id: 16, category: "numerology", name: "直感を信じる", emoji: "🌙",
    message: "あなたの直感は宇宙からのメッセージです。信じて行動を。" },
  { id: 17, category: "numerology", name: "表現する", emoji: "🪶",
    message: "あなたの言葉や表現が、誰かの心を動かします。" },
  { id: 18, category: "numerology", name: "自信を育てる", emoji: "🦁",
    message: "小さな成功体験があなたの自信を育てていきます。" },
  { id: 19, category: "numerology", name: "バランスをとる", emoji: "⚖️",
    message: "心・体・魂のバランスを大切に。調和が運を引き寄せます。" },
  { id: 20, category: "numerology", name: "行動する", emoji: "🏃",
    message: "思い立ったらすぐ行動。その一歩が道を開きます。" },
  { id: 21, category: "numerology", name: "可能性を信じる", emoji: "✨",
    message: "あなたには無限の可能性があります。信じて進みましょう。" },

  // ── マヤ暦（宇宙のリズムとつながる）──
  { id: 22, category: "mayan", name: "宇宙とつながる", emoji: "🌌",
    message: "宇宙はいつもあなたをサポートしています。" },
  { id: 23, category: "mayan", name: "感謝する", emoji: "💗",
    message: "感謝の気持ちはさらなる幸せを引き寄せます。" },
  { id: 24, category: "mayan", name: "浄化する", emoji: "💧",
    message: "心と体を浄化して、新しいエネルギーを受け取りましょう。" },
  { id: 25, category: "mayan", name: "リズムに乗る", emoji: "🌗",
    message: "宇宙のリズムに合わせることで、スムーズに進みます。" },
  { id: 26, category: "mayan", name: "夢を描く", emoji: "💫",
    message: "夢を明確に描くことで、現実が動き出します。" },
  { id: 27, category: "mayan", name: "許す", emoji: "🙏",
    message: "自分も相手も許すことで、心が自由になります。" },
  { id: 28, category: "mayan", name: "今を楽しむ", emoji: "🎈",
    message: "今この瞬間を楽しむことが、未来を豊かにします。" },

  // ── 算命学（宿命と才能を見抜く）──
  { id: 29, category: "sanmeigaku", name: "才能を活かす", emoji: "💎",
    message: "あなたの才能は誰かの役に立つためにあります。" },
  { id: 30, category: "sanmeigaku", name: "リーダーシップ", emoji: "👑",
    message: "あなたには人を導く力があります。自信を持って。" },
  { id: 31, category: "sanmeigaku", name: "直感と理性の調和", emoji: "☯️",
    message: "感情と理性のバランスが、正しい判断を導きます。" },
  { id: 32, category: "sanmeigaku", name: "努力を続ける", emoji: "🪜",
    message: "継続する力が大きな成功を生み出します。" },
  { id: 33, category: "sanmeigaku", name: "人間関係を大切に", emoji: "🤝",
    message: "信頼関係があなたの未来を広げます。" },
  { id: 34, category: "sanmeigaku", name: "境界線を引く", emoji: "🚪",
    message: "自分を守ることは相手を尊重すること。健全な距離を保ちましょう。" },
  { id: 35, category: "sanmeigaku", name: "未来を創る", emoji: "🔭",
    message: "あなたの選択が未来を創ります。主体性を大切に。" },

  // ── 共通カード（すべての叡智からの祝福）──
  { id: 36, category: "common", name: "すべてはうまくいっている", emoji: "🌈",
    message: "すべての叡智があなたを祝福しています。安心して、あなたの道を進みましょう。" },
];

/** 日付ベースのシード（lucky.ts と同じ簡易ハッシュ） */
function dateSeed(date: Date, salt: number = 0): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return ((y * 367 + m * 31 + d * 13 + salt) * 2654435761) >>> 0;
}

export function getCategoryInfo(category: OracleCategory): OracleCategoryInfo {
  return ORACLE_CATEGORIES[category];
}

export function getCardById(id: number): OracleCard | undefined {
  return ORACLE_CARDS.find((c) => c.id === id);
}

/**
 * 今日の1枚を返す。日付（＋プロフィール由来の salt）から決定的に選ぶため、
 * 同じ日・同じ人には常に同じカードが出る。
 */
export function drawTodayCard(date: Date, salt: number = 0): OracleCard {
  const seed = dateSeed(date, salt);
  return ORACLE_CARDS[seed % ORACLE_CARDS.length];
}

/** シャッフルしてランダムに1枚引く（毎回変わる） */
export function drawRandomCard(): OracleCard {
  const idx = Math.floor(Math.random() * ORACLE_CARDS.length);
  return ORACLE_CARDS[idx];
}
