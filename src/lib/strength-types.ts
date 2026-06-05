/**
 * 強みタイプ診断
 *
 * 「人生経験 → 強み → 人の役に立つ価値」のワークシートの締めくくりとして、
 * 7つの強みタイプに分類する。診断は2つの入力から算出する:
 *   1. 診断クイズ（8問・各回答が1タイプへ +2点）
 *   2. ワークシートSTEP6で選んだ「何度も繰り返してきたこと」（各 +1点）
 *
 * これにより、ワーク本文（自由記述）とつながった結果が出る。
 */

export type StrengthTypeId =
  | "educator"
  | "supporter"
  | "challenger"
  | "leader"
  | "healer"
  | "creator"
  | "producer";

export interface StrengthType {
  id: StrengthTypeId;
  name: string;
  emoji: string;
  catchphrase: string;
  description: string;
  strengths: string[];
  howToUse: string;
  whoToHelp: string;
  mission: string;
  color: string;
}

export const STRENGTH_TYPES: Record<StrengthTypeId, StrengthType> = {
  educator: {
    id: "educator",
    name: "教育者タイプ",
    emoji: "📚",
    catchphrase: "学びを届け、人の「わかった！」を生み出す人",
    description:
      "あなたは複雑なことをかみ砕いて伝え、人の成長を後押しすることに喜びを感じます。自分が乗り越えてきたことを「知恵」として整理し、次の人がラクに進める道をつくれる人です。",
    strengths: ["わかりやすく伝える力", "物事を体系化する力", "人の成長を信じる力"],
    howToUse:
      "あなたの経験を「ノウハウ」「ステップ」にまとめて発信しましょう。講座・コンテンツ・教材づくりであなたの価値が何倍にも広がります。",
    whoToHelp: "これから学びたい人、同じ壁の前で立ち止まっている人",
    mission: "知識と経験を分かち合い、人が自分の力で進めるように導くこと",
    color: "#e8820c",
  },
  supporter: {
    id: "supporter",
    name: "共感サポータータイプ",
    emoji: "🤝",
    catchphrase: "そばに寄り添い、心を支える人",
    description:
      "あなたは人の気持ちを敏感に察し、安心して話せる場をつくれます。アドバイスよりも「聴くこと」「受け止めること」で、相手の心を軽くできる人です。",
    strengths: ["共感力・傾聴力", "安心感を与える力", "人の良さを見つける力"],
    howToUse:
      "あなたの「寄り添う力」は伴走・カウンセリング・コミュニティ運営で輝きます。1対1で深く関わる場づくりが天職です。",
    whoToHelp: "一人で抱え込んでいる人、誰かに話を聞いてほしい人",
    mission: "人の心に寄り添い、「一人じゃない」と思える居場所をつくること",
    color: "#c4942a",
  },
  challenger: {
    id: "challenger",
    name: "挑戦者タイプ",
    emoji: "🔥",
    catchphrase: "行動で道を切り拓き、勇気を渡す人",
    description:
      "あなたは困難を乗り越えてきた経験そのものが財産です。まず動く・あきらめない姿勢が、止まっている人の背中を押します。あなたの挑戦は誰かの希望になります。",
    strengths: ["行動力・突破力", "逆境を乗り越える力", "人を勇気づける力"],
    howToUse:
      "あなたのストーリー（どう乗り越えたか）を語ることが最大の価値。挑戦を後押しするコーチングや体験談の発信が向いています。",
    whoToHelp: "一歩が踏み出せない人、過去のあなたと同じ壁にいる人",
    mission: "自分の挑戦を見せることで、人に「私にもできる」と勇気を渡すこと",
    color: "#c44a3f",
  },
  leader: {
    id: "leader",
    name: "リーダータイプ",
    emoji: "⭐",
    catchphrase: "人をまとめ、目指す場所へ導く人",
    description:
      "あなたは全体を見渡し、方向を決め、人を一つにまとめる力があります。決断と責任を引き受けられるので、自然と「この人についていきたい」と思われる存在です。",
    strengths: ["まとめる力・統率力", "決断力", "人を守る責任感"],
    howToUse:
      "チーム・コミュニティ・プロジェクトを率いる場であなたの力が発揮されます。ビジョンを掲げて人を巻き込みましょう。",
    whoToHelp: "方向に迷っているチームや人、安心して任せたい人",
    mission: "ビジョンを示し、人をまとめて目指す未来へ導くこと",
    color: "#b8860b",
  },
  healer: {
    id: "healer",
    name: "癒しタイプ",
    emoji: "🌿",
    catchphrase: "そこにいるだけで、人を和ませる人",
    description:
      "あなたは張り詰めた空気をやわらげ、人に安心と癒しを与えます。穏やかな存在感で、疲れた心が「ほっ」とできる場をつくれる人です。",
    strengths: ["人を癒す力", "場を和ませる力", "穏やかな包容力"],
    howToUse:
      "あなたの「整える・癒す」力は、リトリート・セラピー・空間づくりなど、心と体を回復させるサービスで活きます。",
    whoToHelp: "頑張りすぎて疲れている人、心を休めたい人",
    mission: "人の心と体をゆるめ、安心して回復できる時間を届けること",
    color: "#5b8c5a",
  },
  creator: {
    id: "creator",
    name: "クリエイタータイプ",
    emoji: "🎨",
    catchphrase: "0から1を生み出し、世界観で魅了する人",
    description:
      "あなたは独自の発想と感性で、新しいものを生み出せます。人と同じやり方より、自分らしい表現を大切にし、それが人の心を動かします。",
    strengths: ["独創性・発想力", "表現する力", "自分の世界観を持つ力"],
    howToUse:
      "あなたの感性を作品・コンテンツ・ブランドとして形にしましょう。「あなたにしか出せない世界観」が何よりの強みです。",
    whoToHelp: "ありきたりに飽きた人、自分らしさを表現したい人",
    mission: "自分にしか生み出せない表現で、人の感性と日常を豊かにすること",
    color: "#8b5cf6",
  },
  producer: {
    id: "producer",
    name: "プロデューサータイプ",
    emoji: "✨",
    catchphrase: "人と縁をつなぎ、価値を育てる人",
    description:
      "あなたは人と人、人とチャンスをつなぎ、それを形にして育てるのが得意です。全体を俯瞰して「組み合わせ」を作り、関わる人みんなを輝かせられる人です。",
    strengths: ["人をつなぐ力", "育てる・伸ばす力", "全体を俯瞰する力"],
    howToUse:
      "あなたは企画・プロデュース・コミュニティ設計で力を発揮します。主役を立てて成功させる「仕掛け人」の役割が天職です。",
    whoToHelp: "才能はあるが広め方がわからない人、つながりを求める人",
    mission: "人と縁をつなぎ、それぞれの価値が花開く仕組みを育てること",
    color: "#0ea5e9",
  },
};

export const STRENGTH_TYPE_ORDER: StrengthTypeId[] = [
  "educator",
  "supporter",
  "challenger",
  "leader",
  "healer",
  "creator",
  "producer",
];

/** ワークシートSTEP6の選択肢ラベル → タイプ。診断の加点に使う */
export const PATTERN_TYPE_MAP: Record<string, StrengthTypeId> = {
  支えてきた: "supporter",
  教えてきた: "educator",
  挑戦してきた: "challenger",
  乗り越えてきた: "challenger",
  癒してきた: "healer",
  まとめてきた: "leader",
  伝えてきた: "educator",
  育ててきた: "producer",
  守ってきた: "leader",
  つないできた: "producer",
};

export const PATTERN_OPTIONS = Object.keys(PATTERN_TYPE_MAP);

export interface DiagnosisQuestion {
  id: number;
  question: string;
  options: { label: string; type: StrengthTypeId }[];
}

/** 診断クイズ（8問）。各タイプが複数問にまたがって出るよう設計 */
export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    id: 0,
    question: "初対面の集まりで、あなたが自然とやっていることは？",
    options: [
      { label: "みんなに役立つ情報や知識を伝える", type: "educator" },
      { label: "一人ひとりの話を聞いて寄り添う", type: "supporter" },
      { label: "場を仕切って盛り上げ、まとめる", type: "leader" },
      { label: "新しい人にどんどん話しかける", type: "challenger" },
    ],
  },
  {
    id: 1,
    question: "友人が落ち込んでいるとき、あなたは？",
    options: [
      { label: "解決のヒントやコツを伝える", type: "educator" },
      { label: "とにかく話を聴いて共感する", type: "supporter" },
      { label: "そっと寄り添い、安心させる", type: "healer" },
      { label: "一緒に次の一歩を考え、背中を押す", type: "challenger" },
    ],
  },
  {
    id: 2,
    question: "あなたがいちばんワクワクする瞬間は？",
    options: [
      { label: "誰かが「わかった！」と笑顔になったとき", type: "educator" },
      { label: "0から新しい何かを生み出すとき", type: "creator" },
      { label: "人と人がつながって広がっていくとき", type: "producer" },
      { label: "困難を乗り越え、成長を実感したとき", type: "challenger" },
    ],
  },
  {
    id: 3,
    question: "周りからよく頼まれるのは？",
    options: [
      { label: "教えること・説明すること", type: "educator" },
      { label: "相談相手・話し相手になること", type: "supporter" },
      { label: "まとめ役・リーダー役", type: "leader" },
      { label: "企画やアイデア出し", type: "creator" },
    ],
  },
  {
    id: 4,
    question: "あなたが「当たり前にできること」は？",
    options: [
      { label: "物事をわかりやすく整理する", type: "educator" },
      { label: "人の気持ちを察して和ませる", type: "healer" },
      { label: "人と人をつなげる", type: "producer" },
      { label: "ぐいぐい行動して挑戦する", type: "challenger" },
    ],
  },
  {
    id: 5,
    question: "理想の働き方に近いのは？",
    options: [
      { label: "人を育て、成長させる", type: "producer" },
      { label: "場をまとめて引っ張る", type: "leader" },
      { label: "自分の世界観を表現する", type: "creator" },
      { label: "人を支え、縁の下の力持ちになる", type: "supporter" },
    ],
  },
  {
    id: 6,
    question: "あなたが大切にしている価値観は？",
    options: [
      { label: "学びと成長", type: "educator" },
      { label: "安心と癒し", type: "healer" },
      { label: "挑戦と変化", type: "challenger" },
      { label: "つながりと調和", type: "producer" },
    ],
  },
  {
    id: 7,
    question: "これからやってみたいことに近いのは？",
    options: [
      { label: "知識やノウハウを伝えること", type: "educator" },
      { label: "悩む人に寄り添い支えること", type: "supporter" },
      { label: "何かを創り、表現すること", type: "creator" },
      { label: "人を導き、まとめること", type: "leader" },
    ],
  },
];

export interface DiagnosisResult {
  primary: StrengthType;
  secondary: StrengthType | null;
  scores: { type: StrengthType; score: number }[];
}

/**
 * 診断クイズの回答（質問id → タイプ）と、STEP6で選んだパターンから強みタイプを算出。
 * クイズ各回答 +2、STEP6パターン各 +1。同点はSTRENGTH_TYPE_ORDERで安定化。
 */
export function diagnoseStrengthType(
  quizAnswers: Record<number, StrengthTypeId>,
  patterns: string[] = []
): DiagnosisResult | null {
  const scores: Record<StrengthTypeId, number> = {
    educator: 0,
    supporter: 0,
    challenger: 0,
    leader: 0,
    healer: 0,
    creator: 0,
    producer: 0,
  };

  let answered = 0;
  for (const v of Object.values(quizAnswers)) {
    if (v) {
      scores[v] += 2;
      answered++;
    }
  }
  for (const p of patterns) {
    const t = PATTERN_TYPE_MAP[p];
    if (t) scores[t] += 1;
  }

  // クイズ未回答かつパターンも無ければ診断不可
  const total = answered + patterns.length;
  if (total === 0) return null;

  const ranked = STRENGTH_TYPE_ORDER.map((id) => ({
    type: STRENGTH_TYPES[id],
    score: scores[id],
  })).sort((a, b) => b.score - a.score);

  const primary = ranked[0].type;
  const secondary = ranked[1].score > 0 ? ranked[1].type : null;

  return { primary, secondary, scores: ranked };
}
