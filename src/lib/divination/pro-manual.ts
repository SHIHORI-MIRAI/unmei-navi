/**
 * pro-manual.ts — 有料版「わたしの取扱説明書 PREMIUM（全20ページ）」
 *
 * 無料版 self-manual.ts がルールベースの要約なのに対し、こちらは
 * 全占術の生データを1つの「鑑定資料（dossier）」にまとめ、AI（Claude）に
 * 20章ぶんの自然文を書かせるための土台を作る。
 *
 * このファイル自体は AI を呼ばない（サーバー/クライアント両方から import 可能）。
 * 実際の生成は /api/pro-manual が行う。
 */

import { calcNumerology } from "./numerology";
import { calcMayan } from "./mayan";
import { calcFourPillars } from "./four-pillars";
import { calcSanmeigaku } from "./sanmeigaku";
import { calcNineStar } from "./nine-star";
import { calcLuckyInfo } from "./lucky";
import { getLifePeriod } from "./life-timeline";
import { buildSelfManual } from "./self-manual";
import type { Lang } from "@/lib/i18n/dict";

// --- 価格・商品情報（LP・決済・画面表示で共有する単一の出典） ---

export const PRO_PRICE_JPY = 3300;
export const PRO_PRICE_LABEL: Record<Lang, string> = {
  ja: "3,300円（税込）",
  ko: "3,300엔 (세금 포함)",
};
export const PRO_PAGE_COUNT = 20;

// --- 章の定義 ---

export interface ProChapterSpec {
  no: number; // 1-20
  part: number; // 1-4（章のまとまり）
  /** 生成された章の見出し（AIはこれを書き換えない） */
  title: Record<Lang, string>;
  /** 販売ページ用。その章を読むと何が分かるかの一行説明 */
  blurb: Record<Lang, string>;
  /** AIに「この章で何を書くか」を伝える指示 */
  focus: string;
}

/**
 * 20ページ＝20章。1章あたり日本語で約900〜1,400字を想定。
 * part は生成バッチの単位でもある（1回のAPI呼び出しで5章ぶん生成）。
 */
export const PRO_CHAPTERS: ProChapterSpec[] = [
  // Part 1: あなたの基本設計
  {
    no: 1,
    part: 1,
    title: { ja: "はじめに — この説明書について", ko: "들어가며 — 이 설명서에 대하여" },
    blurb: {
      ja: "あなたを一言で表すとどんな人か。5つの占術に共通して現れる、あなたの芯。",
      ko: "당신을 한마디로 표현하면 어떤 사람인지. 다섯 점술에 공통으로 나타나는 당신의 중심.",
    },
    focus:
      "この取扱説明書が何であるか、どう読んでほしいかを案内する。そのうえで、全占術に共通して浮かび上がるこの人の核を、キャッチコピー的な一文＋その解説として提示する。占術用語の羅列ではなく、読んだ人が『これは私のことだ』と感じる導入にする。",
  },
  {
    no: 2,
    part: 1,
    title: { ja: "基本仕様 — あなたを構成する5つの星", ko: "기본 사양 — 당신을 구성하는 다섯 별" },
    blurb: {
      ja: "数秘・マヤ暦・四柱推命・算命学・九星気学が、それぞれあなたの何を示しているか。専門用語の意味つきで。",
      ko: "수비학·마야력·사주·산명학·구성기학이 각각 당신의 무엇을 나타내는지. 전문용어 설명과 함께.",
    },
    focus:
      "数秘術・マヤ暦・四柱推命・算命学・九星気学のそれぞれが、この人の何を表しているのかを1つずつ丁寧に解説する。各占術の結果（数字・星の名前）を必ず明示し、専門用語には短い注釈をつける。5つを並べたときに見えてくる一貫性にも触れる。",
  },
  {
    no: 3,
    part: 1,
    title: { ja: "生まれ持った才能", ko: "타고난 재능" },
    blurb: {
      ja: "複数の占術が重ねて示す強みを3〜5個。どんな場面で発揮されるかまで具体的に。",
      ko: "여러 점술이 겹쳐서 가리키는 강점 3~5가지. 어떤 상황에서 발휘되는지까지 구체적으로.",
    },
    focus:
      "複数の占術が重ねて示している強みを3〜5個に絞り、それぞれ『どの占術のどこから読み取れるか』『日常のどんな場面で発揮されるか』を具体的に書く。抽象的な美点の列挙にせず、行動レベルの描写にする。",
  },
  {
    no: 4,
    part: 1,
    title: { ja: "まだ使っていない才能", ko: "아직 쓰지 않은 재능" },
    blurb: {
      ja: "自分では気づきにくい資質と、それが目覚めるきっかけ。欠点ではなく伸びしろとして。",
      ko: "스스로는 알아차리기 어려운 자질과, 그것이 깨어나는 계기. 결점이 아니라 성장 여지로서.",
    },
    focus:
      "本人が自覚しにくい・まだ活かしきれていない資質を扱う。命式の中で目立たない要素、五行のバランスで少ない気、従星のエネルギー配置などから読み解き、『どうすれば目覚めるか』の入口まで書く。欠点として書かず、伸びしろとして描く。",
  },
  {
    no: 5,
    part: 1,
    title: { ja: "価値観と原動力", ko: "가치관과 원동력" },
    blurb: {
      ja: "何に喜びを感じ、何のために動く人なのか。「いちばん自分らしくなれる瞬間」の正体。",
      ko: "무엇에 기쁨을 느끼고 무엇을 위해 움직이는 사람인지. '가장 나다워지는 순간'의 정체.",
    },
    focus:
      "この人が何に喜びを感じ、何を大切にし、何のために動くのか。日主の性質・主星の本能・マヤ暦の紋章のキーワードから、動機の源泉を言語化する。『こういう時にいちばん自分らしくなれる』という形で書く。",
  },

  // Part 2: 動かし方
  {
    no: 6,
    part: 2,
    title: { ja: "力を発揮する条件", ko: "힘을 발휘하는 조건" },
    blurb: {
      ja: "どんな環境・役割・人といるとき本来の力が出るか。条件が揃わないとどう鈍るか。",
      ko: "어떤 환경·역할·사람과 있을 때 본래의 힘이 나오는지. 조건이 갖춰지지 않으면 어떻게 무뎌지는지.",
    },
    focus:
      "どんな環境・人間関係・役割・時間帯にいるとき本来の力が出るのか。逆に、条件が揃っていないとどう鈍るのか。チェックリスト的に読める具体性を持たせる。",
  },
  {
    no: 7,
    part: 2,
    title: { ja: "エネルギーが切れるとき", ko: "에너지가 떨어질 때" },
    blurb: {
      ja: "疲れやすい状況と、限界が近いときに出るサイン。早めに気づけるようになります。",
      ko: "지치기 쉬운 상황과, 한계가 가까울 때 나타나는 신호. 일찍 알아차릴 수 있게 됩니다.",
    },
    focus:
      "消耗のパターンを扱う。どんな状況で疲れやすいか、疲れたときに出やすいサイン（言動・思考のクセ）を描き、本人が早めに気づけるようにする。責める書き方をせず、『そういう構造だから仕方ない』という受け止めから入る。",
  },
  {
    no: 8,
    part: 2,
    title: { ja: "充電のしかた", ko: "충전하는 법" },
    blurb: {
      ja: "用神・ラッキーカラー・方位・月のリズムを使った、今日から試せる回復法。お金をかけない方法も。",
      ko: "용신·행운의 색·방위·달의 리듬을 활용한, 오늘부터 해볼 수 있는 회복법. 돈이 들지 않는 방법도.",
    },
    focus:
      "回復の方法を、五行の用神・ラッキーカラー/ナンバー/方位・月のリズムを根拠に、今日から試せる具体的行動として提案する。『高価なことをしなくても整う方法』を必ず含める。",
  },
  {
    no: 9,
    part: 2,
    title: { ja: "取扱注意 — してはいけないこと", ko: "취급 주의 — 하지 말아야 할 것" },
    blurb: {
      ja: "天中殺や五行の偏りから見た、あなたに特に負担が大きい選択。避けるだけでずいぶん楽になります。",
      ko: "천중살이나 오행의 치우침에서 본, 당신에게 특히 부담이 큰 선택. 피하기만 해도 훨씬 편해집니다.",
    },
    focus:
      "天中殺の意味、九星の注意点、五行の偏りなどから、この人にとって特に負担が大きい選択・避けたい行動を挙げる。恐怖を煽らず、『これを避けるだけでずいぶん楽になる』という実用的なトーンで。",
  },
  {
    no: 10,
    part: 2,
    title: { ja: "不調のときの対処法", ko: "컨디션이 나쁠 때의 대처법" },
    blurb: {
      ja: "「眠れない」「焦って空回りする」「何がしたいか分からない」など、症状ごとの処方箋。",
      ko: "'잠이 안 온다' '조급해서 헛돈다' '뭘 하고 싶은지 모르겠다' 등 증상별 처방전.",
    },
    focus:
      "「眠れない」「人と会いたくない」「焦って空回りする」「何がしたいのか分からない」といった具体的な不調ごとに、この人の性質に合った対処を処方箋の形で書く。症状→原因→対処、の順で。",
  },

  // Part 3: 人と社会の中で
  {
    no: 11,
    part: 3,
    title: { ja: "人間関係のトリセツ", ko: "인간관계 사용설명서" },
    blurb: {
      ja: "心地よい距離感、伝わりやすい言い方、誤解されやすい点。目上・同僚・目下・家族の相手別に。",
      ko: "편안한 거리감, 잘 전달되는 말투, 오해받기 쉬운 점. 윗사람·동료·아랫사람·가족 상대별로.",
    },
    focus:
      "この人が心地よい距離感、伝わりやすい伝え方、誤解されやすいポイント。算命学の人体星図（東＝社会・友人／西＝家庭・配偶者／北＝目上／南＝目下）を根拠に、相手の立場別に書く。",
  },
  {
    no: 12,
    part: 3,
    title: { ja: "相性の傾向", ko: "궁합의 경향" },
    blurb: {
      ja: "組むと伸びる人、意識的に工夫がいる人。相手を責めずに「こう接すればうまくいく」まで。",
      ko: "함께하면 성장하는 사람, 의식적으로 신경 써야 하는 사람. 상대를 탓하지 않고 '이렇게 대하면 잘 된다'까지.",
    },
    focus:
      "どんなタイプの人と組むと伸びるか、どんなタイプとは意識的に距離や工夫が必要か。五行の相生相剋・主星の本能の違いを根拠にする。特定の誰かを断罪する書き方は避け、『こう接すればうまくいく』まで書く。",
  },
  {
    no: 13,
    part: 3,
    title: { ja: "仕事とキャリアの活かし方", ko: "일과 커리어를 살리는 법" },
    blurb: {
      ja: "組織か独立か、企画か実務か、対人か制作か。実力が出る役割と、キャリアの積み上げ方。",
      ko: "조직인가 독립인가, 기획인가 실무인가, 대인인가 제작인가. 실력이 나오는 역할과 커리어를 쌓는 법.",
    },
    focus:
      "向いている働き方（組織か独立か、企画か実務か、対人か制作か）、実力が出る役割、キャリアの積み上げ方。通変星・主星・本命星から読み解き、具体的な職種例よりも『働き方の構造』を重視する。",
  },
  {
    no: 14,
    part: 3,
    title: { ja: "お金との付き合い方", ko: "돈과 지내는 법" },
    blurb: {
      ja: "お金が入ってくるパターン、出ていきやすいパターン、貯め方・使い方の相性。",
      ko: "돈이 들어오는 패턴, 나가기 쉬운 패턴, 모으는 법·쓰는 법의 궁합.",
    },
    focus:
      "お金が入ってくるパターン、出ていきやすいパターン、貯め方・使い方の相性。禄存星/司禄星の有無、五行の金の量などを根拠に。断定的な金運予言ではなく、傾向と対策として書く。",
  },
  {
    no: 15,
    part: 3,
    title: { ja: "恋愛とパートナーシップ", ko: "연애와 파트너십" },
    blurb: {
      ja: "惹かれる相手の傾向、恋愛での自分のクセ、長続きする関係の作り方。",
      ko: "끌리는 상대의 경향, 연애에서의 나의 버릇, 오래가는 관계를 만드는 법.",
    },
    focus:
      "惹かれる相手の傾向、恋愛での自分のクセ、長続きする関係の作り方。人体星図の西（配偶者）と調舒星・鳳閣星などの感性の星から読む。独身/既婚どちらの読者にも成立する書き方にする。",
  },

  // Part 4: 人生の流れ
  {
    no: 16,
    part: 4,
    title: { ja: "心と体のリズム", ko: "마음과 몸의 리듬" },
    blurb: {
      ja: "五行の偏りから見た、気をつけたい部位と整えたい習慣。体力の使い方の設計。",
      ko: "오행의 치우침에서 본, 신경 쓸 부위와 다듬고 싶은 습관. 체력을 쓰는 방식의 설계.",
    },
    focus:
      "五行の偏りから読み取れる、気をつけたい体の部位・整えたい生活習慣。従星のエネルギー総量から、体力の使い方の設計を提案する。医療的な診断や断定は絶対にせず、養生の知恵として書く。",
  },
  {
    no: 17,
    part: 4,
    title: { ja: "学び方と成長のしかた", ko: "배움과 성장의 방식" },
    blurb: {
      ja: "独学か師につくか、理論からか体験からか、短期集中か積み上げか。あなたに合う学び方。",
      ko: "독학인가 스승을 두는가, 이론부터인가 경험부터인가, 단기집중인가 축적인가. 당신에게 맞는 배움의 방식.",
    },
    focus:
      "この人に合った学習スタイル（独学か師につくか、理論からか体験からか、短期集中か積み上げか）。玉堂星・龍高星などの習得本能、数秘のライフパスから読み解く。",
  },
  {
    no: 18,
    part: 4,
    title: { ja: "人生の大きなリズム", ko: "인생의 큰 리듬" },
    blurb: {
      ja: "数秘の9年サイクルと四柱推命の大運（10年単位）を重ねた人生の波。これまでの節目の意味も分かります。",
      ko: "수비학의 9년 사이클과 사주의 대운(10년 단위)을 겹친 인생의 파도. 지금까지의 고비의 의미도 알 수 있습니다.",
    },
    focus:
      "数秘の9年サイクルと四柱推命の大運（10年単位）を重ねて、この人の人生がどんな波で進むのかを説明する。これまでの節目に思い当たる点があるはず、という形で過去も振り返れるようにする。",
  },
  {
    no: 19,
    part: 4,
    title: { ja: "これから3年の過ごし方", ko: "앞으로 3년을 보내는 법" },
    blurb: {
      ja: "作成した年から3年ぶん、それぞれの年のテーマ・動くべき時・力を溜める時。",
      ko: "작성한 해부터 3년치, 각 해의 테마·움직여야 할 때·힘을 모을 때.",
    },
    focus:
      "提供された「今後3年の運気データ」に基づき、各年のテーマ・向いていること・力を溜める時期を具体的に書く。運気が低い年も『悪い年』とせず、その時期にふさわしい過ごし方として前向きに描く。",
  },
  {
    no: 20,
    part: 4,
    title: { ja: "今世のテーマと、まわりへの一言", ko: "이번 생의 테마와, 주변에 전하는 말" },
    blurb: {
      ja: "全章をまとめた今世のテーマ。最後に、家族や同僚にそのまま渡せる自己紹介文つき。",
      ko: "전 장을 아우른 이번 생의 테마. 마지막에 가족이나 동료에게 그대로 건넬 수 있는 자기소개 글 포함.",
    },
    focus:
      "全章を踏まえ、この人が今世で取り組むテーマ・使命を言語化して締めくくる。最後に『まわりの人に渡せる自己紹介文』を200字程度で添える（家族や同僚に「私はこういう人です」と手渡せる文章）。読み終えたときに、自分を肯定できる余韻を残す。",
  },
];

/** 生成バッチ（1リクエストで生成する章のまとまり） */
export const PRO_PART_COUNT = 4;

export function chaptersOfPart(part: number): ProChapterSpec[] {
  return PRO_CHAPTERS.filter((c) => c.part === part);
}

export const PART_TITLES: Record<number, Record<Lang, string>> = {
  1: { ja: "第1部　あなたの基本設計", ko: "제1부　당신의 기본 설계" },
  2: { ja: "第2部　あなたの動かし方", ko: "제2부　당신을 움직이는 법" },
  3: { ja: "第3部　人と社会の中で", ko: "제3부　사람과 사회 속에서" },
  4: { ja: "第4部　人生の流れ", ko: "제4부　인생의 흐름" },
};

// --- 生成結果の型 ---

export interface ProManualChapter {
  no: number;
  /** AIが書いた本文（段落は \n\n 区切り） */
  body: string;
  /** その章の要点（3項目） */
  keyPoints: string[];
}

export interface ProManual {
  version: 1;
  generatedAt: string; // ISO
  lang: Lang;
  name: string;
  birthDate: string;
  birthTime: string;
  chapters: ProManualChapter[];
}

/** 章がすべて揃っているか */
export function isProManualComplete(m: ProManual | null): boolean {
  if (!m) return false;
  return PRO_CHAPTERS.every((c) => m.chapters.some((ch) => ch.no === c.no && ch.body.trim()));
}

// --- 鑑定資料（dossier）の組み立て ---

/**
 * 全占術の結果を、AIに渡す1本のプレーンテキストにまとめる。
 *
 * 方針: 計算は常に日本語（"ja"）で行い、日本語表記を「正」とする。
 * 出力言語は AI 側のシステムプロンプトで指定する。
 */
export function buildProDossier(
  birthDate: string,
  birthTime: string,
  name: string,
  today: Date = new Date()
): string {
  const time = birthTime || undefined;

  const num = calcNumerology(birthDate, today);
  const maya = calcMayan(birthDate);
  const four = calcFourPillars(birthDate, time);
  const san = calcSanmeigaku(birthDate);
  const nine = calcNineStar(birthDate, today.getFullYear());
  const lucky = calcLuckyInfo(today, num.lifePathNumber);
  const manual = buildSelfManual(birthDate, birthTime, today);

  const thisYear = today.getFullYear();
  const outlook = [0, 1, 2, 3].map((i) => {
    const p = getLifePeriod(birthDate, thisYear + i);
    const ms = p.milestones.map((m) => m.label).join("・") || "特筆すべき節目なし";
    return `  - ${p.year}年（${p.age}歳）｜数秘${p.personalYear}「${p.personalYearTheme}」／九星の巡り:${p.nineStarDirection || "－"}／エネルギー目安 ${p.energy}/100／星の節目:${ms}\n    その年の助言: ${p.personalYearAdvice}`;
  });

  const elems = four.fiveElements;
  const elemLine = (["木", "火", "土", "金", "水"] as const)
    .map((k) => `${k}${elems[k]}`)
    .join(" / ");

  const taiUn = four.taiUn
    .slice(0, 8)
    .map((t) => `  - ${t.startAge}歳〜: ${t.stem}${t.branch}（${t.element}）${t.theme}`)
    .join("\n");

  return `# 鑑定対象
氏名: ${name || "（未設定）"}
生年月日: ${birthDate}
出生時刻: ${birthTime || "未登録（四柱推命の時柱は算出せず、日付ベースで読む）"}
鑑定日: ${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日

# 数秘術（魂の設計図）
ライフパスナンバー: ${num.lifePathNumber}「${num.lifePathMeaning.title}」
  強み: ${num.lifePathMeaning.strength}
  テーマ: ${num.lifePathMeaning.theme}
誕生数: ${num.birthdayNumber}
今年のパーソナルイヤー: ${num.personalYear}
  テーマ: ${num.personalYearMeaning.theme}
  助言: ${num.personalYearMeaning.advice}
  注意: ${num.personalYearMeaning.caution}

# マヤ暦（今世の役割）
KIN: ${maya.kinNumber}
太陽の紋章: ${maya.solarSeal.name}（${maya.solarSeal.keyword}／${maya.solarSeal.color}）
ウェイブスペル（内なる願い）: ${maya.waveSpell.name}（${maya.waveSpell.keyword}）
銀河の音: 音${maya.galacticTone.tone}「${maya.galacticTone.name}」（${maya.galacticTone.keyword}／${maya.galacticTone.energy}）

# 四柱推命（本質と運気）
年柱: ${four.yearPillar.kanshi}　月柱: ${four.monthPillar.kanshi}　日柱: ${four.dayPillar.kanshi}　時柱: ${four.hourPillar?.kanshi ?? "（出生時刻未登録のため無し）"}
日主（本人を表す天干）: ${four.dayMaster.stem}（${four.dayMaster.element}）「${four.dayMaster.title}」
  性格: ${four.dayMaster.personality}
  強み: ${four.dayMaster.strength}
五行バランス: ${elemLine}
用神（補うと整う気）: ${four.favorableElement.element} — ${four.favorableElement.reason}
通変星: 年${four.tsuuhenStars.yearStar}／月${four.tsuuhenStars.monthStar}／時${four.tsuuhenStars.hourStar ?? "－"}
  通変星の意味: ${four.tsuuhenMeaning.keyword} — ${four.tsuuhenMeaning.personality}
大運（10年ごとの運気の流れ）:
${taiUn}

# 算命学（才能と宿命）
主星（中央＝本人）: ${san.mainStar.name}（${san.mainStar.reading}／${san.mainStar.keyword}）
  性格: ${san.mainStar.personality}
  強み: ${san.mainStar.strength}
人体星図:
  北（頭・目上/両親）: ${san.bodyChart.north.name}（${san.bodyChart.north.keyword}）
  東（左手・社会/友人）: ${san.bodyChart.east.name}（${san.bodyChart.east.keyword}）
  中央（本人）: ${san.bodyChart.center.name}（${san.bodyChart.center.keyword}）
  西（右手・家庭/配偶者）: ${san.bodyChart.west.name}（${san.bodyChart.west.keyword}）
  南（腹・目下/子供）: ${san.bodyChart.south.name}（${san.bodyChart.south.keyword}）
十二大従星（エネルギー配分・合計${san.totalEnergy}）:
  頭: ${san.subStars.head.name}（${san.subStars.head.stage}／エネルギー${san.subStars.head.energy}）${san.subStars.head.meaning}
  胸: ${san.subStars.chest.name}（${san.subStars.chest.stage}／エネルギー${san.subStars.chest.energy}）${san.subStars.chest.meaning}
  腹: ${san.subStars.belly.name}（${san.subStars.belly.stage}／エネルギー${san.subStars.belly.energy}）${san.subStars.belly.meaning}
天中殺: ${san.tenchu.name}
  テーマ: ${san.tenchu.theme}
  意味: ${san.tenchu.meaning}

# 九星気学（性格と方位）
本命星: ${nine.honmeisei.name}（${nine.honmeisei.element}）
  性格: ${nine.honmeisei.personality}
  強み: ${nine.honmeisei.strength}
月命星: ${nine.getsumeisei.name}（${nine.getsumeisei.element}）— ${nine.getsumeisei.personality}
今年の巡り: ${nine.yearPosition.direction}
  テーマ: ${nine.yearPosition.theme}
  助言: ${nine.yearPosition.advice}
  気をつけたいこと: ${nine.yearPosition.caution}
吉方位: ${nine.luckyDirections.join("・") || "－"}

# ラッキー情報（鑑定日時点）
カラー: ${lucky.color.name}／ナンバー: ${lucky.number}／方位: ${lucky.direction}／月齢: ${lucky.moonAge}（${lucky.moonPhase}）

# ルールベース版トリセツの要約（AIが深掘りするための下地。そのままコピーせず、必ず自分の言葉で展開すること）
キャッチフレーズ: ${manual.spec.catchphrase}
強み: ${manual.strengths.map((s) => `${s.source}=${s.text}`).join(" / ")}
力を発揮する条件: ${manual.usage.join(" / ")}
避けたいこと: ${manual.avoid.join(" / ")}
注意点: ${manual.cautions.join(" / ")}
不調の対処: ${manual.troubleshooting.map((t) => `${t.symptom}→${t.action}`).join(" / ")}
占術別の詳細:
${manual.details.map((d) => `  - ${d.source}（${d.label}）\n    人物像: ${d.trait.character}\n    仕事: ${d.trait.work}\n    人間関係: ${d.trait.relationship}\n    伸ばし方: ${d.trait.advice}`).join("\n")}

# 今後3年の運気データ
${outlook.join("\n")}
`;
}
