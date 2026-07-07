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

import type { Lang } from "@/lib/i18n/dict";

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

/** カテゴリ（叡智）ごとの韓国語ラベル・テーマ。emoji/hex/key は共通のまま */
const ORACLE_CATEGORIES_KO: Record<OracleCategory, { label: string; theme: string }> = {
  "nine-star": { label: "구성기학", theme: "운명의 흐름을 읽어내기" },
  "four-pillars": { label: "사주", theme: "인생의 설계도를 읽어내기" },
  numerology: { label: "수비학", theme: "숫자가 말하는 당신의 본질" },
  mayan: { label: "마야력", theme: "우주의 리듬과 이어지기" },
  sanmeigaku: { label: "산명학", theme: "숙명과 재능을 꿰뚫어보기" },
  common: { label: "공통 카드", theme: "모든 지혜로부터의 축복" },
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

/**
 * カードの韓国語版（name / message）。id をキーに日本語カードと1:1対応。
 * id・category・emoji は日本語版と共通なので持たない。
 */
const ORACLE_CARDS_KO: Record<number, { name: string; message: string }> = {
  // ── 九星気学（구성기학）──
  1: { name: "흐름에 올라타기",
    message: "타이밍은 최고예요. 자연의 흐름에 몸을 맡기고, 직감을 믿으며 나아가요." },
  2: { name: "빛을 믿기",
    message: "희망의 빛이 당신을 비추고 있어요. 지금은 작더라도 앞을 향해 나아가요." },
  3: { name: "가다듬기",
    message: "환경과 마음을 가다듬으면 운기가 움직이기 시작해요. 무리하지 말고, 지금 할 수 있는 것부터 조금씩 시작해요." },
  4: { name: "만남",
    message: "멋진 인연이 다가오고 있어요. 마음을 열고 받아들여요." },
  5: { name: "변화를 즐기기",
    message: "변화는 새로운 문을 여는 기회예요. 새로운 자신을 만날 수 있어요." },
  6: { name: "선택하기",
    message: "당신에게는 언제나 선택할 힘이 있어요. 마음이 기뻐하는 쪽을 선택해요." },
  7: { name: "믿기",
    message: "당신의 직감은 언제나 당신을 올바른 방향으로 이끌고 있어요. 자신을 믿고 나아가요." },

  // ── 四柱推命（사주）──
  8: { name: "나아가기",
    message: "한 걸음 내딛는 것이 미래를 바꿔가요. 작은 행동의 쌓임이 큰 성장을 만들어내요." },
  9: { name: "받아들이기",
    message: "당신에게는 모든 것을 받아들일 가치가 있어요. 마음을 열고 감사하며 받아들여요." },
  10: { name: "전하기",
    message: "당신의 말과 발신에는 가치가 있어요. 자신감을 갖고 당신의 마음을 전해요." },
  11: { name: "초점을 맞추기",
    message: "진정한 가치는 상대가 얻게 될 미래의 변화예요. 상대의 시점에서 「미래의 모습」을 전해요." },
  12: { name: "감사하기",
    message: "감사하는 마음은 당신의 마음을 채우고 행복을 끌어당겨요. 작은 것에도 「고맙습니다」를." },
  13: { name: "선택받는 존재가 되기",
    message: "당신이 빛남으로써 누군가의 인생이 움직이기 시작해요. 그것이 당신의 사명이에요." },
  14: { name: "믿고 행동하기",
    message: "믿는 것은 행동할 용기를 줘요. 작은 한 걸음의 쌓임이 큰 미래를 만들어요." },

  // ── 数秘術（수비학）──
  15: { name: "즐기면서 전진하기",
    message: "인생은 즐기기 위해 있는 것. 설레는 마음은 당신의 미래를 밝게 비춰요." },
  16: { name: "자신을 믿고 계속 앞으로 나아가기",
    message: "당신에게는 극복할 힘이 있어요. 꿈을 이룰 힘이 있어요. 행복해질 가치가 있어요." },
  17: { name: "자유를 선택하기",
    message: "자신의 인생을 스스로 선택할 용기를 가져요. 자유는 당신 안에 있어요." },
  18: { name: "새로운 시작을 받아들이기",
    message: "변화를 두려워 말고 새로운 한 걸음을 내디뎌요. 그 앞에는 당신만의 멋진 미래가 기다리고 있어요." },
  19: { name: "기회를 받아들이기",
    message: "기회는 언제나 당신 곁에 있어요. 그것을 알아차리고 받아들일 준비를 해요. 한 걸음 내딛는 용기가 미래를 바꿔요." },
  20: { name: "신뢰를 쌓고 미래를 키우기",
    message: "신뢰는 모든 것의 토대가 돼요. 하나하나의 쌓임이 풍요로운 미래를 만들어가요." },
  21: { name: "자신을 소중히 하고 주위도 행복하게 하기",
    message: "자신을 소중히 하는 것은 이기적인 것이 아니에요. 당신이 채워짐으로써 주위 사람도 행복해져요." },

  // ── マヤ暦（마야력）──
  22: { name: "감사를 잊지 않고 풍요를 받아들이기",
    message: "감사하는 마음은 행운을 끌어당기는 열쇠예요. 당연한 것에 「고맙습니다」라고 전함으로써 풍요가 가득 차가요." },
  23: { name: "변화를 즐기고 새로운 자신을 받아들이기",
    message: "변화는 당신의 성장의 신호예요. 변하는 것을 두려워 말고, 설레며 새로운 도전을 받아들여요." },
  24: { name: "자신의 페이스를 소중히 하고 조급해하지 않고 나아가기",
    message: "인생에는 저마다의 타이밍이 있어요. 자신의 페이스로 한 걸음 한 걸음 착실히 나아가는 것이 가장 빠른 길이에요." },
  25: { name: "자신을 믿고 직감을 믿으며 최고의 선택을 하기",
    message: "당신 안에는 이미 답이 있어요. 마음의 소리에 귀 기울여 최선의 선택을 해가요." },
  26: { name: "자신의 가치를 이해하고 그것을 최대한 살리기",
    message: "당신에게는 둘도 없는 가치가 있어요. 자신의 가치를 믿고 당당하게 살아가요." },
  27: { name: "자신의 사명을 떠올리고 열정을 갖고 행동하기",
    message: "당신에게는 당신만의 사명이 있어요. 열정을 갖고 행동함으로써 인생은 빛나요." },
  28: { name: "팀이나 동료와 협력하고 함께 성장하며 성공을 나누기",
    message: "혼자 할 수 있는 것에는 한계가 있어요. 신뢰할 수 있는 동료와 협력하고 함께 성장하며 성공을 나눠요." },

  // ── 算命学（산명학）──
  29: { name: "작은 쌓임을 소중히 하고 착실히 꿈을 이루기",
    message: "어떤 큰 꿈도 처음은 작은 한 걸음부터. 매일의 쌓임이 이윽고 큰 기적을 만들어내요." },
  30: { name: "리더십",
    message: "당신에게는 사람을 이끄는 힘이 있어요. 자신감을 갖고 그 역할을 다해요." },
  31: { name: "기회를 잡기",
    message: "기회는 준비된 사람에게 찾아와요. 지금이야말로 자신의 가능성을 믿고 새로운 한 걸음을 내디뎌요." },
  32: { name: "계속하기",
    message: "작은 노력의 쌓임이 큰 결과를 만들어내요. 믿고, 즐기면서, 자신의 페이스로 계속해가요." },
  33: { name: "감사하기",
    message: "감사하는 마음은 더 큰 풍요를 끌어당겨요. 작은 「고맙습니다」를 매일의 습관으로 만들어가요." },
  34: { name: "행동하기",
    message: "행동은 미래의 문을 여는 열쇠예요. 완벽하지 않아도 괜찮아요. 오늘 할 수 있는 것부터 시작해 이상의 미래를 만들어가요." },
  35: { name: "신뢰하기",
    message: "신뢰는 모든 성공의 토대예요. 신뢰를 키움으로써 사람과의 유대가 깊어지고 큰 힘이 생겨나요." },

  // ── 共通カード（공통 카드）──
  36: { name: "변화를 받아들이기",
    message: "변화는 새로운 가능성으로의 초대장이에요. 유연한 마음으로 흐름에 몸을 맡기면 인생은 더 풍요롭고 빛나는 것이 돼요." },
};

/** カードを表示言語に合わせて返す（id/category/emoji は不変、name/message のみ差し替え） */
function localizeCard(card: OracleCard, lang: Lang): OracleCard {
  if (lang === "ko") {
    const ko = ORACLE_CARDS_KO[card.id];
    if (ko) return { ...card, name: ko.name, message: ko.message };
  }
  return card;
}

/** 日付ベースのシード（lucky.ts と同じ簡易ハッシュ） */
function dateSeed(date: Date, salt: number = 0): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return ((y * 367 + m * 31 + d * 13 + salt) * 2654435761) >>> 0;
}

export function getCategoryInfo(category: OracleCategory, lang: Lang = "ja"): OracleCategoryInfo {
  const base = ORACLE_CATEGORIES[category];
  if (lang === "ko") {
    const ko = ORACLE_CATEGORIES_KO[category];
    return { ...base, label: ko.label, theme: ko.theme };
  }
  return base;
}

export function getCardById(id: number, lang: Lang = "ja"): OracleCard | undefined {
  const card = ORACLE_CARDS.find((c) => c.id === id);
  return card ? localizeCard(card, lang) : undefined;
}

/**
 * 今日の1枚を返す。日付（＋プロフィール由来の salt）から決定的に選ぶため、
 * 同じ日・同じ人には常に同じカードが出る。
 */
export function drawTodayCard(date: Date, salt: number = 0, lang: Lang = "ja"): OracleCard {
  const seed = dateSeed(date, salt);
  return localizeCard(ORACLE_CARDS[seed % ORACLE_CARDS.length], lang);
}

/** シャッフルしてランダムに1枚引く（毎回変わる） */
export function drawRandomCard(lang: Lang = "ja"): OracleCard {
  const idx = Math.floor(Math.random() * ORACLE_CARDS.length);
  return localizeCard(ORACLE_CARDS[idx], lang);
}
