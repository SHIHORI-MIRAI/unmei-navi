/**
 * オラクルカード
 *
 * 44枚のポジティブなメッセージカード。タップで1枚引き、今日のテーマや
 * 背中を押すメッセージを受け取る。
 *
 * - 「今日の1枚」は日付＋プロフィールから決定的に選ばれる（同じ日は同じカード）。
 * - 「シャッフルして引く」は毎回ランダム。
 *
 * アプリ方針に沿い、全カードを前向きな表現で統一している
 * （「運気が低い＝悪い」ではなく過ごし方のヒントとして提示）。
 */

export interface OracleCard {
  id: number;
  name: string; // カード名
  keyword: string; // 一言キーワード
  message: string; // メインメッセージ
  advice: string; // 今日の過ごし方ヒント
  emoji: string; // モチーフ絵文字
  hex: string; // カードカラー
}

export const ORACLE_CARDS: OracleCard[] = [
  { id: 1, name: "夜明け", keyword: "新しい始まり", emoji: "🌅", hex: "#f5a623",
    message: "新しいサイクルの幕開けです。あなたの中で何かが静かに動き出しています。",
    advice: "小さくていいので、ずっと気になっていたことに一歩踏み出してみて。" },
  { id: 2, name: "満月", keyword: "実り・完成", emoji: "🌕", hex: "#d4a843",
    message: "積み重ねてきたものが、まるく満ちようとしています。受け取る準備を。",
    advice: "達成したことを数えて、自分をきちんと労ってあげましょう。" },
  { id: 3, name: "星", keyword: "希望・導き", emoji: "⭐", hex: "#c4942a",
    message: "迷っても大丈夫。あなたを導く光は、ちゃんと空にあります。",
    advice: "心が惹かれる方へ進んでOK。直感はあなたの味方です。" },
  { id: 4, name: "翼", keyword: "自由・飛躍", emoji: "🕊️", hex: "#3498db",
    message: "あなたを縛っていた重さが、軽くなろうとしています。もっと自由でいい。",
    advice: "「こうあるべき」を一つ手放すと、視界がふっと広がります。" },
  { id: 5, name: "種", keyword: "可能性", emoji: "🌱", hex: "#2ecc71",
    message: "今はまだ土の中。でも確かに芽吹こうとしている力があります。",
    advice: "結果を急がず、今日できる小さな水やりを大切に。" },
  { id: 6, name: "炎", keyword: "情熱・行動", emoji: "🔥", hex: "#e74c3c",
    message: "あなたの内側に、温かく力強い情熱が灯っています。",
    advice: "やりたいと感じたことを、後回しにせず今日やってみて。" },
  { id: 7, name: "泉", keyword: "癒し・浄化", emoji: "💧", hex: "#3498db",
    message: "心が静かに洗われていく時。疲れは、もう流していい段階です。",
    advice: "意識して休息を。水や緑のそばで深呼吸するのがおすすめ。" },
  { id: 8, name: "虹", keyword: "祝福・調和", emoji: "🌈", hex: "#9b59b6",
    message: "雨のあとに虹が架かるように、これまでの努力が彩りに変わります。",
    advice: "違いを楽しむ気持ちで人と関わると、思わぬ調和が生まれます。" },
  { id: 9, name: "鍵", keyword: "解決・転機", emoji: "🗝️", hex: "#c4942a",
    message: "閉じていた扉を開く鍵は、すでにあなたの手の中にあります。",
    advice: "ずっと避けていた一つに向き合うと、道が開けます。" },
  { id: 10, name: "山", keyword: "成長・忍耐", emoji: "⛰️", hex: "#7f8c8d",
    message: "一歩ずつ登ってきた道のりは、確かにあなたを高めています。",
    advice: "頂上ばかり見ず、今いる高さからの景色も味わって。" },
  { id: 11, name: "月の小道", keyword: "直感・内省", emoji: "🌙", hex: "#9b59b6",
    message: "答えは外ではなく、あなたの内側に静かに灯っています。",
    advice: "ひとりの時間をとって、心の声に耳を澄ませてみて。" },
  { id: 12, name: "太陽", keyword: "活力・自信", emoji: "☀️", hex: "#f5a623",
    message: "あなたの存在そのものが、まわりを明るく照らしています。",
    advice: "今日は堂々と。あなたの笑顔が誰かの力になります。" },
  { id: 13, name: "贈り物", keyword: "豊かさ・感謝", emoji: "🎁", hex: "#e91e8e",
    message: "思いがけない恵みが、そっと差し出されようとしています。",
    advice: "受け取り上手になって。素直な「ありがとう」が運を開きます。" },
  { id: 14, name: "羅針盤", keyword: "方向性", emoji: "🧭", hex: "#34495e",
    message: "進む方向に迷いはいりません。あなたの軸は、もう定まっています。",
    advice: "本当に大切にしたいことを一つ、紙に書き出してみて。" },
  { id: 15, name: "蝶", keyword: "変化・再生", emoji: "🦋", hex: "#9b59b6",
    message: "さなぎの時を経て、あなたは新しい姿へと羽ばたこうとしています。",
    advice: "変わることを恐れないで。過去の自分も大切な一部です。" },
  { id: 16, name: "灯台", keyword: "安心・指針", emoji: "🗼", hex: "#e67e22",
    message: "どんな夜でも、あなたを照らし導く光は消えていません。",
    advice: "不安な時こそ基本に立ち返ると、足元がしっかりします。" },
  { id: 17, name: "花ひらく", keyword: "開花・魅力", emoji: "🌸", hex: "#e91e8e",
    message: "あなたの魅力が、ちょうど見頃を迎えようとしています。",
    advice: "ありのままを見せて大丈夫。自然体が一番美しい時です。" },
  { id: 18, name: "橋", keyword: "つながり・縁", emoji: "🌉", hex: "#16a085",
    message: "人と人をつなぐ縁が、あなたのまわりで結ばれようとしています。",
    advice: "気になる人に、こちらから声をかけてみると良い日。" },
  { id: 19, name: "宝箱", keyword: "才能・発見", emoji: "💎", hex: "#c4942a",
    message: "あなたの中には、まだ気づいていない宝物が眠っています。",
    advice: "「当たり前にできること」こそ、あなただけの才能かも。" },
  { id: 20, name: "風", keyword: "変化の追い風", emoji: "🍃", hex: "#2ecc71",
    message: "心地よい追い風が吹いています。流れに乗っていい時です。",
    advice: "考えすぎず、軽やかに動くと物事がスムーズに運びます。" },
  { id: 21, name: "錨", keyword: "安定・地に足", emoji: "⚓", hex: "#34495e",
    message: "揺れる時も、あなたにはしっかりした拠り所があります。",
    advice: "今日は無理に動かず、地に足をつけて整える日に。" },
  { id: 22, name: "ともしび", keyword: "希望・小さな光", emoji: "🕯️", hex: "#f1c40f",
    message: "どんなに暗くても、あなたの中の小さな光は決して消えません。",
    advice: "完璧でなくていい。今日できた小さなことを認めてあげて。" },
  { id: 23, name: "両手", keyword: "受容・委ねる", emoji: "🤲", hex: "#e67e22",
    message: "握りしめていた力を緩めると、必要なものが流れ込んできます。",
    advice: "全部を抱え込まないで。人に頼ることも優しさです。" },
  { id: 24, name: "オーロラ", keyword: "奇跡・神秘", emoji: "🌌", hex: "#8e44ad",
    message: "日常の中に、思いがけない美しい瞬間が訪れようとしています。",
    advice: "いつもの景色を、新鮮な目で眺めてみて。発見があります。" },
  { id: 25, name: "羽根ペン", keyword: "表現・発信", emoji: "🪶", hex: "#2980b9",
    message: "あなたの言葉や表現が、誰かの心に届こうとしています。",
    advice: "思っていることを、素直に言葉にして伝えてみて。" },
  { id: 26, name: "果実", keyword: "収穫・報酬", emoji: "🍎", hex: "#e74c3c",
    message: "蒔いた種が実を結ぶ時。遠慮なく受け取っていい成果です。",
    advice: "頑張った自分へ、ちょっとしたご褒美を用意しましょう。" },
  { id: 27, name: "手をつなぐ", keyword: "協力・仲間", emoji: "🤝", hex: "#16a085",
    message: "ひとりで頑張らなくていい。支え合える仲間がそばにいます。",
    advice: "素直に「助けて」と言えると、関係がもっと深まります。" },
  { id: 28, name: "新芽の枝", keyword: "再スタート", emoji: "🌿", hex: "#2ecc71",
    message: "終わったと思ったところから、新しい命が芽吹いています。",
    advice: "過去の失敗も経験値。もう一度やり直して大丈夫。" },
  { id: 29, name: "金の杯", keyword: "満たされ・愛", emoji: "🏆", hex: "#d4a843",
    message: "あなたの心は、想像以上に豊かなもので満たされています。",
    advice: "すでに持っている幸せに目を向けると、もっと増えていきます。" },
  { id: 30, name: "流れ星", keyword: "願い・チャンス", emoji: "💫", hex: "#9b59b6",
    message: "今は願いを放つのに最適な時。チャンスが近づいています。",
    advice: "叶えたいことを具体的に言葉にすると、引き寄せが強まります。" },
  { id: 31, name: "羅生門の朝", keyword: "区切り・決断", emoji: "🚪", hex: "#34495e",
    message: "迷っていた選択に、すっきり区切りをつけられる時です。",
    advice: "どちらを選んでも正解。決めたあとに正解にしていけばOK。" },
  { id: 32, name: "雪解け", keyword: "緩和・許し", emoji: "❄️", hex: "#3498db",
    message: "凍りついていた心が、ゆっくりと溶け始めています。",
    advice: "自分にも相手にも、少しだけ優しく。許しは自由への鍵。" },
  { id: 33, name: "鳥の歌", keyword: "喜び・軽やかさ", emoji: "🐦", hex: "#f1c40f",
    message: "肩の力を抜いて。人生は、もっと楽しんでいいものです。",
    advice: "理由なんていらない。好きなことで今日を満たしましょう。" },
  { id: 34, name: "大地", keyword: "豊穣・育む", emoji: "🌾", hex: "#c0843a",
    message: "あなたの優しさが、まわりの人をしっかり育てています。",
    advice: "与えることに疲れたら、自分にも栄養を。順番でいい。" },
  { id: 35, name: "鏡", keyword: "自己受容", emoji: "🪞", hex: "#7f8c8d",
    message: "ありのままのあなたは、すでに十分すばらしい存在です。",
    advice: "今日は自分を責めない日に。よくやってる、と声をかけて。" },
  { id: 36, name: "船出", keyword: "挑戦・冒険", emoji: "⛵", hex: "#2980b9",
    message: "新しい海へ漕ぎ出す時。未知は、あなたを成長させます。",
    advice: "完璧な準備より、まず出航。風は進みながら掴めます。" },
  { id: 37, name: "宝の地図", keyword: "目標・道筋", emoji: "🗺️", hex: "#e67e22",
    message: "ゴールへの道筋が、少しずつ見え始めています。",
    advice: "大きな目標を、今日できる小さな一歩に分けてみて。" },
  { id: 38, name: "守りの光", keyword: "安心・加護", emoji: "🛡️", hex: "#c4942a",
    message: "あなたは見えない優しい力に、しっかり守られています。",
    advice: "心配しすぎないで。最善のタイミングで物事は進みます。" },
  { id: 39, name: "ハチミツ", keyword: "甘い実り・人気", emoji: "🍯", hex: "#f1c40f",
    message: "あなたの周りに、自然と人や良いものが集まってくる時。",
    advice: "笑顔と感謝を惜しまずに。ご縁がさらに甘く実ります。" },
  { id: 40, name: "二輪の花", keyword: "パートナーシップ", emoji: "🌷", hex: "#e91e8e",
    message: "支え合える関係が、あなたの人生を豊かに彩ります。",
    advice: "大切な人に、感謝の気持ちを言葉で伝えてみて。" },
  { id: 41, name: "静けさ", keyword: "休息・余白", emoji: "🤍", hex: "#95a5a6",
    message: "何もしない時間こそ、あなたを深く満たしてくれます。",
    advice: "予定を一つ手放して、ゆったりした余白をつくりましょう。" },
  { id: 42, name: "黄金の道", keyword: "幸運・追い風", emoji: "✨", hex: "#d4a843",
    message: "あなたの足元に、輝く幸運の道がのびています。",
    advice: "前向きな選択ほど吉。明るい方へ、自信を持って進んで。" },
  { id: 43, name: "暖炉", keyword: "安らぎ・家族", emoji: "🔥", hex: "#e67e22",
    message: "心が安らげる場所が、ちゃんとあなたを待っています。",
    advice: "頑張った日こそ、あたたかい場所と人を大切に。" },
  { id: 44, name: "無限", keyword: "可能性・循環", emoji: "♾️", hex: "#8e44ad",
    message: "あなたの可能性に、終わりはありません。何度でも始められます。",
    advice: "「もう遅い」はありません。今この瞬間がいつでも出発点。" },
];

/** 日付ベースのシード（lucky.ts と同じ簡易ハッシュ） */
function dateSeed(date: Date, salt: number = 0): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return ((y * 367 + m * 31 + d * 13 + salt) * 2654435761) >>> 0;
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
