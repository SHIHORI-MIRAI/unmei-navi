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
    message: "タイミングは最高です。自然の流れに身を委ね、直感を信じて進みましょう。" },
  { id: 2, category: "nine-star", name: "光を信じる", emoji: "☀️",
    message: "希望の光があなたを照らしています。今は小さくても、前を向いて進みましょう。" },
  { id: 3, category: "nine-star", name: "整える", emoji: "🍃",
    message: "環境や心を整えることで、運気が動き出します。無理をせず、今できることから少しずつ始めましょう。" },
  { id: 4, category: "nine-star", name: "出会い", emoji: "🌷",
    message: "素敵なご縁が近づいています。心を開いて、受け取りましょう。" },
  { id: 5, category: "nine-star", name: "変化を楽しむ", emoji: "🦋",
    message: "変化は、新しい扉を開くチャンスです。新しい自分に出会えます。" },
  { id: 6, category: "nine-star", name: "選択する", emoji: "🪧",
    message: "あなたには、いつも選ぶ力があります。心が喜ぶ方を選びましょう。" },
  { id: 7, category: "nine-star", name: "信じる", emoji: "🕊️",
    message: "あなたの直感は、いつもあなたを正しい方向へ導いています。自分を信じて進みましょう。" },

  // ── 四柱推命（人生の設計図を読み解く）──
  { id: 8, category: "four-pillars", name: "進む", emoji: "🌅",
    message: "一歩を踏み出すことが、未来を変えていきます。小さな行動の積み重ねが、大きな成長を生み出します。" },
  { id: 9, category: "four-pillars", name: "受け取る", emoji: "🎁",
    message: "あなたには、すべてを受け取る価値があります。心を開き、感謝して受け取りましょう。" },
  { id: 10, category: "four-pillars", name: "伝える", emoji: "📣",
    message: "あなたの言葉や発信には、価値があります。自信を持って、あなたの想いを届けましょう。" },
  { id: 11, category: "four-pillars", name: "焦点を当てる", emoji: "🎯",
    message: "本当の価値は、相手が得られる未来の変化です。相手の視点で「未来の姿」を伝えましょう。" },
  { id: 12, category: "four-pillars", name: "感謝する", emoji: "🙏",
    message: "感謝の気持ちは、あなたの心を満たし、幸せを引き寄せます。小さなことにも「ありがとう」を。" },
  { id: 13, category: "four-pillars", name: "選ばれる存在になる", emoji: "👑",
    message: "あなたが輝くことで、誰かの人生が動き出します。それが、あなたの使命です。" },
  { id: 14, category: "four-pillars", name: "信じて行動する", emoji: "🏮",
    message: "信じることは、行動する勇気をくれます。小さな一歩の積み重ねが、大きな未来を創ります。" },

  // ── 数秘術（数字が語るあなたの本質）──
  { id: 15, category: "numerology", name: "楽しみながら前進する", emoji: "🦋",
    message: "人生は、楽しむためにあるもの。ワクワクする心は、あなたの未来を明るく照らします。" },
  { id: 16, category: "numerology", name: "自分を信じて、前に進み続ける", emoji: "🌄",
    message: "あなたには、乗り越えられる力があります。夢を叶える力があります。幸せになる価値があります。" },
  { id: 17, category: "numerology", name: "自由を選ぶ", emoji: "🕊️",
    message: "自分の人生を、自分で選ぶ勇気を持ちましょう。自由は、あなたの中にあります。" },
  { id: 18, category: "numerology", name: "新しい始まりを受け入れる", emoji: "🌅",
    message: "変化を恐れず、新しい一歩を踏み出しましょう。その先には、あなただけの素晴らしい未来が待っています。" },
  { id: 19, category: "numerology", name: "チャンスを受け取る", emoji: "🚪",
    message: "チャンスは、いつもあなたのそばにあります。それに気づき、受け取る準備をしましょう。一歩踏み出す勇気が、未来を変えます。" },
  { id: 20, category: "numerology", name: "信頼を築き、未来を育てる", emoji: "🌇",
    message: "信頼は、すべての土台になります。一つひとつの積み重ねが、豊かな未来を創っていきます。" },
  { id: 21, category: "numerology", name: "自分を大切にし、周りも幸せにする", emoji: "💗",
    message: "自分を大切にすることは、わがままではありません。あなたが満たされることで、周りの人も幸せになります。" },

  // ── マヤ暦（宇宙のリズムとつながる）──
  { id: 22, category: "mayan", name: "感謝を忘れず、豊かさを受け取る", emoji: "🙏",
    message: "感謝の心は、幸運を引き寄せる鍵です。当たり前のことに「ありがとう」と伝えることで、豊かさが満ちていきます。" },
  { id: 23, category: "mayan", name: "変化を楽しみ、新しい自分を受け入れる", emoji: "🦋",
    message: "変化は、あなたの成長のサインです。変わることを恐れず、ワクワクしながら新しい挑戦を受け入れましょう。" },
  { id: 24, category: "mayan", name: "自分のペースを大切にし、焦らず進む", emoji: "🕊️",
    message: "人生には、それぞれのタイミングがあります。自分のペースで一歩一歩、着実に進むことが一番の近道です。" },
  { id: 25, category: "mayan", name: "自分を信じ、直感を信じて、最高の選択をする", emoji: "🌅",
    message: "あなたの中には、すでに答えがあります。心の声に耳を傾け、最善の選択をしていきましょう。" },
  { id: 26, category: "mayan", name: "自分の価値を理解し、それを最大限に活かす", emoji: "💎",
    message: "あなたには、かけがえのない価値があります。自分の価値を信じて、堂々と生きていきましょう。" },
  { id: 27, category: "mayan", name: "自分の使命を思い出し、情熱を持って行動する", emoji: "🔥",
    message: "あなたには、あなただけの使命があります。情熱を持って行動することで、人生は輝きます。" },
  { id: 28, category: "mayan", name: "チームや仲間と協力し、共に成長し、成功を分かち合う", emoji: "🤝",
    message: "一人でできることには限りがあります。信頼できる仲間と協力し、共に成長し、成功を分かち合いましょう。" },

  // ── 算命学（宿命と才能を見抜く）──
  { id: 29, category: "sanmeigaku", name: "小さな積み重ねを大切にし、着実に夢を形にする", emoji: "🌱",
    message: "どんな大きな夢も、最初は小さな一歩から。日々の積み重ねが、やがて大きな奇跡を生み出します。" },
  { id: 30, category: "sanmeigaku", name: "リーダーシップ", emoji: "👑",
    message: "あなたには人を導く力があります。自信を持って、その役割を果たしましょう。" },
  { id: 31, category: "sanmeigaku", name: "チャンスをつかむ", emoji: "🚪",
    message: "チャンスは、準備ができた人のところに訪れます。今こそ、自分の可能性を信じて、新しい一歩を踏み出しましょう。" },
  { id: 32, category: "sanmeigaku", name: "継続する", emoji: "🌙",
    message: "小さな努力の積み重ねが、大きな結果を生み出します。信じて、楽しみながら、あなたのペースで続けていきましょう。" },
  { id: 33, category: "sanmeigaku", name: "感謝する", emoji: "🙏",
    message: "感謝の気持ちは、さらなる豊かさを引き寄せます。小さな「ありがとう」を毎日の習慣にしていきましょう。" },
  { id: 34, category: "sanmeigaku", name: "行動する", emoji: "🚪",
    message: "行動は、未来の扉を開く鍵です。完璧でなくても大丈夫。今日できることから始めて、理想の未来を創っていきましょう。" },
  { id: 35, category: "sanmeigaku", name: "信頼する", emoji: "🤝",
    message: "信頼は、すべての成功の土台です。信頼を育てることで、人との絆が深まり、大きな力が生まれます。" },

  // ── 共通カード（すべての叡智からの祝福）──
  { id: 36, category: "common", name: "変化を受け入れる", emoji: "🦋",
    message: "変化は、新しい可能性への招待状です。柔軟な心で流れに身を任せると、人生はより豊かで輝かしいものになります。" },
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
