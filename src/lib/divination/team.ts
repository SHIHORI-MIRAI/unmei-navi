/**
 * 家族・組織（チーム）分析エンジン
 *
 * 複数人の生年月日から「一人で見たときの本質」と「その集団の中での役回り」を
 * 分けて算出する。個人鑑定を人数分並べるのではなく、
 * **メンバー同士の相対関係（誰が何を持ち、何が足りないか）** を主役にするのが狙い。
 *
 * 主な観点：
 *  1. 五行バランス … 全員の四柱を合算し、集団として強い気／欠けている気を出す
 *  2. 役割（アーキタイプ）… 算命学の主星10種を「集団での持ち場」に翻訳する
 *  3. 足りない役割 … 五本能（守備・習得・攻撃・引力・伝達）のうち不在のものを検出し、
 *     人体星図の他の星（中央以外）で代わりに担える人を「代役候補」として提示する
 *  4. 関係マップ … 日主の五行で相生（支える）／相剋（刺激する）の向きを出し、
 *     既存の相性エンジンでペアごとの点数を添える
 *  5. 単体 vs 集団 … 同じ人でも「一人のとき」と「この集団の中」で見え方が変わることを明示する
 *
 * 表示テキストは ja / ko の二言語。計算のキーは常に日本語名で持ち、表示時のみ切り替える。
 */

import {
  calcFourPillars,
  type FourPillarsResult,
} from "./four-pillars";
import { calcSanmeigaku, type SanmeigakuResult } from "./sanmeigaku";
import { calcNineStar } from "./nine-star";
import { calcNumerology } from "./numerology";
import { calcMayan } from "./mayan";
import { calcCompatibility } from "./compatibility";
import {
  calcFiveElementBalance,
  FIVE_ELEMENTS,
  type FiveElement,
  type FiveElementBalance,
} from "./stems-branches";
import type { Lang } from "@/lib/i18n/dict";
import { elementName, mayanSealName, nineStarName } from "@/lib/i18n/fortune-terms";

/** 家族として見るか、組織（チーム）として見るか。同じ人でも役割の言葉が変わる */
export type TeamKind = "family" | "business";

/** 五本能（算命学）。集団の中で「どの力が揃っていて、どれが欠けているか」の単位 */
export type Instinct = "守備" | "習得" | "攻撃" | "引力" | "伝達";

export interface TeamMemberInput {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime?: string; // HH:MM（あれば時柱も五行に加える）
  /** 続柄・肩書き（父／母／長男／代表／営業 など。自由入力） */
  role?: string;
}

const ja = <T,>(j: T, k: T, lang: Lang): T => (lang === "ko" ? k : j);

// --- 五本能 ---

const STAR_INSTINCT: Record<string, Instinct> = {
  貫索星: "守備", 石門星: "守備",
  龍高星: "習得", 玉堂星: "習得",
  車騎星: "攻撃", 牽牛星: "攻撃",
  禄存星: "引力", 司禄星: "引力",
  鳳閣星: "伝達", 調舒星: "伝達",
};

export const INSTINCTS: Instinct[] = ["守備", "習得", "攻撃", "引力", "伝達"];

const INSTINCT_META: Record<
  Instinct,
  { ja: { label: string; power: string; lack: string }; ko: { label: string; power: string; lack: string } }
> = {
  守備: {
    ja: { label: "守る力", power: "決めたことを守り抜き、土台が崩れないようにする力", lack: "ブレない軸をつくる人" },
    ko: { label: "지키는 힘", power: "정한 것을 끝까지 지켜 토대가 무너지지 않게 하는 힘", lack: "흔들리지 않는 축을 만드는 사람" },
  },
  習得: {
    ja: { label: "学ぶ力", power: "調べ、考え、次の一手の道筋をつくる力", lack: "調べて道筋を立てる人" },
    ko: { label: "배우는 힘", power: "조사하고 생각해 다음 수의 길을 만드는 힘", lack: "조사해서 방향을 세우는 사람" },
  },
  攻撃: {
    ja: { label: "動く力", power: "先頭に立って動き出し、物事を前に進める力", lack: "最初に動き出す人" },
    ko: { label: "움직이는 힘", power: "앞장서서 움직이고 일을 진행시키는 힘", lack: "가장 먼저 움직이는 사람" },
  },
  引力: {
    ja: { label: "集める力", power: "人・お金・ご縁を引き寄せ、面倒を見て蓄える力", lack: "人とご縁を引き寄せる人" },
    ko: { label: "모으는 힘", power: "사람·돈·인연을 끌어당기고 챙기며 쌓는 힘", lack: "사람과 인연을 끌어당기는 사람" },
  },
  伝達: {
    ja: { label: "伝える力", power: "場の空気をつくり、思いを言葉や表現にして届ける力", lack: "場の空気をつくる人" },
    ko: { label: "전하는 힘", power: "분위기를 만들고 마음을 말과 표현으로 전하는 힘", lack: "분위기를 만드는 사람" },
  },
};

export function instinctLabel(i: Instinct, lang: Lang = "ja"): string {
  return lang === "ko" ? INSTINCT_META[i].ko.label : INSTINCT_META[i].ja.label;
}

// --- 役割アーキタイプ（算命学の主星10種 → 集団での持ち場）---

interface ArchetypeText {
  /** 家族として見たときの呼び名 */
  familyTitle: string;
  /** 組織として見たときの呼び名 */
  businessTitle: string;
  /** その人そのものの本質（集団に関係なく変わらない部分） */
  essence: string;
  /** 家族の中で発揮されるもの */
  familyGift: string;
  /** 組織の中で発揮されるもの */
  businessGift: string;
  /** 集団の中で気をつけたい面（ポジティブ表現で） */
  watch: string;
}

const ARCHETYPES: Record<string, { ja: ArchetypeText; ko: ArchetypeText }> = {
  貫索星: {
    ja: {
      familyTitle: "家のブレない軸",
      businessTitle: "軸を守る人",
      essence: "自分のペースと決めたことを最後まで守り抜く、芯の強い人",
      familyGift: "家の中の「これだけは変えない」を守り、みんなが安心して戻れる基準になります",
      businessGift: "方針がぶれそうなときに立ち返る基準になり、決めたやり方を続ける力を担います",
      watch: "一人で抱え込みやすいので、任せる相手を決めておくとさらに力が出ます",
    },
    ko: {
      familyTitle: "집안의 흔들리지 않는 축",
      businessTitle: "축을 지키는 사람",
      essence: "자기 페이스와 정한 것을 끝까지 지켜내는, 심지가 강한 사람",
      familyGift: "집안의 「이것만은 바꾸지 않는다」를 지켜, 모두가 안심하고 돌아올 기준이 됩니다",
      businessGift: "방침이 흔들릴 때 돌아갈 기준이 되고, 계속하는 힘을 담당합니다",
      watch: "혼자 떠안기 쉬우니 맡길 상대를 정해 두면 힘이 더 살아납니다",
    },
  },
  石門星: {
    ja: {
      familyTitle: "家族をつなぐ人",
      businessTitle: "チームをまとめる人",
      essence: "垣根をつくらず人と人を結び、輪の中心に自然と立つ人",
      familyGift: "家族の集まりや連絡の要になり、バラバラになりそうな時に自然と輪を戻します",
      businessGift: "部署や立場をまたいで人をつなぎ、チームの実質的なハブになります",
      watch: "みんなに気を配るぶん自分の予定が後回しになりやすいので、休む日を先に決めておくと安心です",
    },
    ko: {
      familyTitle: "가족을 잇는 사람",
      businessTitle: "팀을 하나로 모으는 사람",
      essence: "울타리를 만들지 않고 사람과 사람을 이어, 자연스럽게 중심에 서는 사람",
      familyGift: "가족 모임과 연락의 중심이 되어, 흩어질 것 같을 때 자연스럽게 다시 모읍니다",
      businessGift: "부서와 입장을 넘나들며 사람을 이어 팀의 실질적인 허브가 됩니다",
      watch: "모두를 챙기느라 자기 일정이 뒤로 밀리기 쉬우니, 쉬는 날을 먼저 정해 두면 좋아요",
    },
  },
  龍高星: {
    ja: {
      familyTitle: "世界を広げる人",
      businessTitle: "開拓・改革役",
      essence: "好奇心で外の世界とつながり、前例のない道を面白がって歩ける人",
      familyGift: "家の外の情報や新しい体験を持ち帰り、家族の視野を広げます",
      businessGift: "前例のない領域に先に踏み込み、やり方そのものを更新します",
      watch: "動きが速いぶん、決めた理由を言葉にして共有すると周りがついてきやすくなります",
    },
    ko: {
      familyTitle: "세계를 넓히는 사람",
      businessTitle: "개척·개혁 담당",
      essence: "호기심으로 바깥 세계와 이어지고, 전례 없는 길을 즐겁게 걸을 수 있는 사람",
      familyGift: "집 밖의 정보와 새로운 경험을 가져와 가족의 시야를 넓힙니다",
      businessGift: "전례 없는 영역에 먼저 발을 들여 방식 자체를 새롭게 합니다",
      watch: "움직임이 빠른 만큼, 결정한 이유를 말로 공유하면 주위가 따라오기 쉬워집니다",
    },
  },
  玉堂星: {
    ja: {
      familyTitle: "知恵を伝える人",
      businessTitle: "参謀・分析役",
      essence: "学んだことを整理して人に手渡せる、静かな知性の人",
      familyGift: "家族の相談役になり、迷ったときに筋道を立てて考えを整理してくれます",
      businessGift: "情報を集めて分析し、意思決定の材料を整える参謀の位置に立ちます",
      watch: "正しさが先に立つ場面では、結論より先に相手の気持ちを一言拾うと伝わり方が変わります",
    },
    ko: {
      familyTitle: "지혜를 전하는 사람",
      businessTitle: "참모·분석 담당",
      essence: "배운 것을 정리해 사람에게 건넬 수 있는, 조용한 지성의 사람",
      familyGift: "가족의 상담역이 되어, 헤맬 때 논리를 세워 생각을 정리해 줍니다",
      businessGift: "정보를 모아 분석하고 의사결정의 재료를 갖추는 참모 자리에 섭니다",
      watch: "옳음이 앞서는 장면에서는 결론보다 먼저 상대의 마음을 한마디 짚으면 전달이 달라집니다",
    },
  },
  車騎星: {
    ja: {
      familyTitle: "家を動かすエンジン",
      businessTitle: "推進役",
      essence: "考えるより先に体が動く、まっすぐで勢いのある人",
      familyGift: "「やろう」と言った瞬間に動き出し、家の中の停滞を吹き飛ばします",
      businessGift: "計画を実行に変えるスピードを担い、止まった案件を再び動かします",
      watch: "スピードが持ち味なので、周りが追いつく時間を少し取ると成果が定着します",
    },
    ko: {
      familyTitle: "집을 움직이는 엔진",
      businessTitle: "추진 담당",
      essence: "생각보다 몸이 먼저 움직이는, 곧고 기세 있는 사람",
      familyGift: "「하자」고 말한 순간 움직이기 시작해 집안의 정체를 날려 버립니다",
      businessGift: "계획을 실행으로 바꾸는 속도를 담당하고, 멈춘 안건을 다시 움직입니다",
      watch: "속도가 강점이니, 주위가 따라올 시간을 조금 두면 성과가 자리 잡습니다",
    },
  },
  牽牛星: {
    ja: {
      familyTitle: "責任を背負う人",
      businessTitle: "統率・責任者",
      essence: "筋を通すことを大切にし、任された役目をきちんと果たす人",
      familyGift: "家の対外的な顔になり、いざというときの判断と責任を引き受けます",
      businessGift: "役割と責任の線引きをはっきりさせ、組織としての体裁を整えます",
      watch: "きちんとしたいぶん力が入りやすいので、7割で回す日をつくると長く続きます",
    },
    ko: {
      familyTitle: "책임을 짊어지는 사람",
      businessTitle: "통솔·책임자",
      essence: "도리를 소중히 하고, 맡은 역할을 제대로 해내는 사람",
      familyGift: "집안의 대외적인 얼굴이 되어, 결정적인 순간의 판단과 책임을 맡습니다",
      businessGift: "역할과 책임의 선을 분명히 하여 조직의 틀을 갖춥니다",
      watch: "제대로 하고 싶은 만큼 힘이 들어가기 쉬우니, 70%로 굴리는 날을 만들면 오래갑니다",
    },
  },
  禄存星: {
    ja: {
      familyTitle: "家に福を呼ぶ人",
      businessTitle: "惹きつける人",
      essence: "情が深く世話好きで、人もご縁も自然と集まってくる人",
      familyGift: "分け与えることで家全体の豊かさを回し、来客やご縁を呼び込みます",
      businessGift: "人当たりの良さと面倒見でお客様・協力者を引き寄せる窓口になります",
      watch: "与える力が大きいので、受け取ることも同じくらい許すと循環が整います",
    },
    ko: {
      familyTitle: "집에 복을 부르는 사람",
      businessTitle: "끌어당기는 사람",
      essence: "정이 깊고 잘 챙기며, 사람도 인연도 자연스럽게 모이는 사람",
      familyGift: "나누어 줌으로써 집안 전체의 풍요를 돌게 하고, 손님과 인연을 불러들입니다",
      businessGift: "붙임성과 살뜰함으로 고객·협력자를 끌어당기는 창구가 됩니다",
      watch: "주는 힘이 큰 만큼, 받는 것도 그만큼 허락하면 순환이 정돈됩니다",
    },
  },
  司禄星: {
    ja: {
      familyTitle: "暮らしを積み上げる人",
      businessTitle: "積み上げ・管理役",
      essence: "派手さより継続。小さな積み重ねを財産に変えられる人",
      familyGift: "家計・健康・習慣といった日常の土台を、途切れさせずに積み上げます",
      businessGift: "数字・記録・仕組みを地道に整え、成果が流れ出ないよう受け皿をつくります",
      watch: "変化の場面では、守るものと手放すものを先に決めておくと動きやすくなります",
    },
    ko: {
      familyTitle: "생활을 쌓아 올리는 사람",
      businessTitle: "축적·관리 담당",
      essence: "화려함보다 지속. 작은 쌓임을 재산으로 바꿀 수 있는 사람",
      familyGift: "가계·건강·습관 같은 일상의 토대를 끊기지 않게 쌓아 올립니다",
      businessGift: "숫자·기록·구조를 꾸준히 정리해 성과가 새지 않도록 받침을 만듭니다",
      watch: "변화의 장면에서는 지킬 것과 놓을 것을 먼저 정해 두면 움직이기 쉬워집니다",
    },
  },
  鳳閣星: {
    ja: {
      familyTitle: "家の太陽・ムードメーカー",
      businessTitle: "場を和ませる人",
      essence: "自然体で楽しむ天才。いるだけで空気がやわらぐ人",
      familyGift: "張りつめた空気をほどき、家族が本音を言える余白をつくります",
      businessGift: "会議や現場の緊張をゆるめ、意見が出やすい場の温度をつくります",
      watch: "無理に場を持たせようとしなくても大丈夫。自然体でいるときが一番効いています",
    },
    ko: {
      familyTitle: "집안의 태양·분위기 메이커",
      businessTitle: "분위기를 풀어 주는 사람",
      essence: "자연스럽게 즐기는 천재. 있는 것만으로 공기가 부드러워지는 사람",
      familyGift: "팽팽한 공기를 풀어, 가족이 속마음을 말할 여백을 만듭니다",
      businessGift: "회의와 현장의 긴장을 늦춰, 의견이 나오기 쉬운 온도를 만듭니다",
      watch: "억지로 분위기를 띄우지 않아도 괜찮아요. 자연스러울 때가 가장 잘 통합니다",
    },
  },
  調舒星: {
    ja: {
      familyTitle: "感性のアンテナ",
      businessTitle: "感性・クリエイティブ役",
      essence: "誰よりも早く違和感に気づく、繊細で深い感受性の人",
      familyGift: "誰かの小さな変化に最初に気づき、言葉にならない気持ちを拾い上げます",
      businessGift: "細部の違和感と美意識で品質を守り、ゼロから表現を生み出します",
      watch: "感じ取る量が多いので、一人になれる時間を確保すると本来の力が戻ります",
    },
    ko: {
      familyTitle: "감성의 안테나",
      businessTitle: "감성·크리에이티브 담당",
      essence: "누구보다 먼저 위화감을 알아채는, 섬세하고 깊은 감수성의 사람",
      familyGift: "누군가의 작은 변화를 가장 먼저 알아채고, 말이 되지 않은 마음을 건져 올립니다",
      businessGift: "디테일의 위화감과 미의식으로 품질을 지키고, 무에서 표현을 만들어 냅니다",
      watch: "느끼는 양이 많으니, 혼자 있는 시간을 확보하면 본래의 힘이 돌아옵니다",
    },
  },
};

// --- 五行が集団にもたらすもの ---

const ELEMENT_ROLE: Record<FiveElement, { ja: { role: string; lack: string }; ko: { role: string; lack: string } }> = {
  木: {
    ja: { role: "伸びる力・新しく始める力", lack: "新しいことを始める勢いが出にくく、現状維持になりやすい" },
    ko: { role: "뻗어나가는 힘·새로 시작하는 힘", lack: "새로운 일을 시작하는 기세가 나기 어렵고 현상 유지가 되기 쉽습니다" },
  },
  火: {
    ja: { role: "情熱・発信・場を明るくする力", lack: "盛り上がりや発信が控えめになり、内向きになりやすい" },
    ko: { role: "열정·발신·분위기를 밝히는 힘", lack: "분위기나 발신이 조용해지고 안으로 향하기 쉽습니다" },
  },
  土: {
    ja: { role: "安定・受け止める力・まとめる力", lack: "受け止める土台が薄く、話が着地しにくい" },
    ko: { role: "안정·받아 주는 힘·정리하는 힘", lack: "받아 주는 토대가 얇아 이야기가 착지하기 어렵습니다" },
  },
  金: {
    ja: { role: "決める力・整える力・けじめ", lack: "決め切る・線を引く場面が先延ばしになりやすい" },
    ko: { role: "결정하는 힘·정돈하는 힘·매듭", lack: "결정하고 선을 긋는 장면이 미뤄지기 쉽습니다" },
  },
  水: {
    ja: { role: "考える力・流す力・柔軟さ", lack: "立ち止まって考える時間が減り、勢いで進みやすい" },
    ko: { role: "생각하는 힘·흘려보내는 힘·유연함", lack: "멈춰 서서 생각하는 시간이 줄고 기세로 나아가기 쉽습니다" },
  },
};

const GENERATES: Record<FiveElement, FiveElement> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const CONTROLS: Record<FiveElement, FiveElement> = { 木: "土", 火: "金", 土: "水", 金: "木", 水: "火" };

// --- 結果の型 ---

export interface MemberArchetype {
  starName: string; // 表示用（言語対応済み）
  starKey: string; // 日本語の主星名（ロジック用キー）
  title: string;
  essence: string;
  gift: string;
  watch: string;
  instinct: Instinct;
  instinctLabel: string;
}

export interface MemberAnalysis {
  id: string;
  name: string;
  role: string;
  birthDate: string;
  archetype: MemberArchetype;
  /** 算命学の総合エネルギー（3〜36）。集団内での「存在感の大きさ」の目安 */
  energy: number;
  energyLabel: string;
  energyRank: number; // 1 が最大
  elements: FiveElementBalance;
  mainElement: FiveElement;
  dayMaster: { stem: string; element: FiveElement; title: string };
  lifePath: number;
  lifePathTitle: string;
  honmeisei: { number: number; name: string; element: string };
  mayanSeal: string;
  /** 一人で見たときの本質 */
  soloView: string;
  /** この集団の中での役回り（相対評価） */
  teamView: string;
  /** この人がいることで集団がどうなるか */
  contribution: string;
  /** 集団の中で意識したい点 */
  watchInTeam: string;
  /** 「唯一の水」「エネルギー最大」などの相対バッジ */
  badges: string[];
  /** 自分が支える（相生で生じる）相手 */
  supports: string[];
  /** 自分を支えてくれる相手 */
  supportedBy: string[];
  /** 刺激し合う（相剋）相手 */
  sparksWith: string[];
  /** 主星以外（人体星図の他の位置）で持っている本能。足りない役割の代役判定に使う */
  subInstincts: Instinct[];
}

export interface ElementSlice {
  element: FiveElement;
  name: string;
  count: number;
  ratio: number; // 0-1
  role: string;
  /** その気を多く持っているメンバー名（多い順・最大2名） */
  holders: string[];
}

export type PairRelationKind = "generate" | "same" | "control" | "neutral";

export interface PairRelation {
  aId: string;
  bId: string;
  aName: string;
  bName: string;
  score: number;
  kind: PairRelationKind;
  /** 相生のとき、生じる側（支える側）の名前 */
  giver?: string;
  receiver?: string;
  label: string;
  comment: string;
}

export interface RoleGap {
  instinct: Instinct;
  label: string;
  /** 不在によって起きやすいこと */
  effect: string;
  /** 代わりに担える人の名前（人体星図に同じ本能の星を持つ人） */
  covers: string[];
  /** 代役がなぜ担えるのかの説明（全員に共通なので1文だけ持つ） */
  coverHow: string;
}

export interface TeamAnalysis {
  kind: TeamKind;
  kindLabel: string;
  memberCount: number;
  members: MemberAnalysis[];
  elements: ElementSlice[];
  strongest: FiveElement;
  weakest: FiveElement;
  elementComment: string;
  /** 五行の偏りの少なさ 0-100 */
  balanceScore: number;
  /** ペア相性の平均 0-100 */
  harmony: number;
  pairs: PairRelation[];
  /** 揃っている本能 */
  presentInstincts: Instinct[];
  /** 足りない本能と代役候補 */
  gaps: RoleGap[];
  typeTitle: string;
  typeComment: string;
  headline: string;
  advice: string[];
  /** 「一人で見たとき」と「集団で見たとき」の違いについての説明 */
  soloVsTeamNote: string;
}

// --- 内部計算 ---

interface Raw {
  input: TeamMemberInput;
  fp: FourPillarsResult;
  smJa: SanmeigakuResult;
  sm: SanmeigakuResult;
  lifePath: number;
  lifePathTitle: string;
  honmeisei: { number: number; name: string; element: string };
  mayanSeal: string;
  energy: number;
  elements: FiveElementBalance;
  mainElement: FiveElement;
  dayElement: FiveElement;
  starKey: string;
  instinct: Instinct;
  subInstincts: Instinct[];
}

function analyzeOne(m: TeamMemberInput, lang: Lang): Raw {
  const fp = calcFourPillars(m.birthDate, m.birthTime || undefined, lang);
  // ロジックのキーは常に日本語名。表示用は lang 版を別に取る
  const smJa = calcSanmeigaku(m.birthDate, "ja");
  const sm = lang === "ko" ? calcSanmeigaku(m.birthDate, "ko") : smJa;
  const num = calcNumerology(m.birthDate, new Date(), lang);
  const nine = calcNineStar(m.birthDate, new Date().getFullYear(), lang);
  const mayan = calcMayan(m.birthDate);

  // 五行は年柱・月柱・日柱の3柱（＝1人6枠）で数える。
  // 出生時刻の有無で枠数が変わると、集団の中での多い・少ないが公平に比べられなくなるため。
  const elements = calcFiveElementBalance([fp.yearPillar, fp.monthPillar, fp.dayPillar]);
  const mainElement = (FIVE_ELEMENTS as readonly FiveElement[]).reduce((best, el) =>
    elements[el] > elements[best] ? el : best
  );

  const starKey = smJa.mainStar.name;
  // 人体星図の中央以外の4星 → 主星にはないが「持っている」本能
  const others = [smJa.bodyChart.north, smJa.bodyChart.south, smJa.bodyChart.east, smJa.bodyChart.west];
  const instinct = STAR_INSTINCT[starKey] ?? "守備";
  const subInstincts = Array.from(
    new Set(others.map((s) => STAR_INSTINCT[s.name]).filter((i): i is Instinct => !!i && i !== instinct))
  );

  return {
    input: m,
    fp,
    smJa,
    sm,
    lifePath: num.lifePathNumber,
    lifePathTitle: num.lifePathMeaning.title,
    honmeisei: {
      number: nine.honmeisei.number,
      name: nineStarName(nine.honmeisei.name, lang),
      element: elementName(nine.honmeisei.element, lang),
    },
    mayanSeal: mayanSealName(mayan.solarSeal.name, lang),
    energy: smJa.totalEnergy,
    elements,
    mainElement,
    dayElement: fp.dayMaster.element,
    starKey,
    instinct,
    subInstincts,
  };
}

function energyLabel(energy: number, lang: Lang): string {
  if (energy >= 28) return ja("大きい（前に出て引っ張る量）", "큼 (앞에 나서서 이끄는 양)", lang);
  if (energy >= 21) return ja("やや大きい（動き続けられる量）", "다소 큼 (계속 움직일 수 있는 양)", lang);
  if (energy >= 14) return ja("中くらい（バランス型）", "보통 (밸런스형)", lang);
  return ja("控えめ（要所で効かせる量）", "차분함 (요소에서 발휘하는 양)", lang);
}

/** 集団の五行バランスを集計する */
function buildElements(raws: Raw[], lang: Lang): ElementSlice[] {
  const total: FiveElementBalance = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const r of raws) {
    for (const el of FIVE_ELEMENTS) total[el] += r.elements[el];
  }
  const sum = FIVE_ELEMENTS.reduce((a, el) => a + total[el], 0) || 1;

  return FIVE_ELEMENTS.map((el) => {
    const holders = raws
      .filter((r) => r.elements[el] > 0)
      .sort((a, b) => b.elements[el] - a.elements[el])
      .slice(0, 2)
      .map((r) => r.input.name);
    return {
      element: el,
      name: elementName(el, lang),
      count: total[el],
      ratio: total[el] / sum,
      role: lang === "ko" ? ELEMENT_ROLE[el].ko.role : ELEMENT_ROLE[el].ja.role,
      holders,
    };
  });
}

/** ペアの関係（日主の五行の向き＋既存の相性エンジンの点数） */
function buildPairs(raws: Raw[], kind: TeamKind, lang: Lang): PairRelation[] {
  const mode = kind === "family" ? "family" : "business";
  const pairs: PairRelation[] = [];

  for (let i = 0; i < raws.length; i++) {
    for (let j = i + 1; j < raws.length; j++) {
      const a = raws[i];
      const b = raws[j];
      const compat = calcCompatibility(a.input.birthDate, b.input.birthDate, mode, lang);
      const ea = a.dayElement;
      const eb = b.dayElement;
      const an = a.input.name;
      const bn = b.input.name;

      let kindRel: PairRelationKind = "neutral";
      let giver: string | undefined;
      let receiver: string | undefined;
      let label = "";
      let comment = "";

      if (ea === eb) {
        kindRel = "same";
        label = ja("同じ気（比和）", "같은 기운(비화)", lang);
        comment = ja(
          `${an}さんと${bn}さんは同じ${elementName(ea, lang)}の気。感覚が近く、説明しなくても通じ合いやすい二人です`,
          `${an}님과 ${bn}님은 같은 ${elementName(ea, lang)}의 기운. 감각이 가까워 설명하지 않아도 통하기 쉬운 두 사람입니다`,
          lang
        );
      } else if (GENERATES[ea] === eb) {
        kindRel = "generate";
        giver = an;
        receiver = bn;
        label = ja("支える関係（相生）", "지지하는 관계(상생)", lang);
        comment = ja(
          `${an}さんが${bn}さんを生かす向き。${an}さんが動くと${bn}さんの力が引き出されます`,
          `${an}님이 ${bn}님을 살리는 방향. ${an}님이 움직이면 ${bn}님의 힘이 끌어올려집니다`,
          lang
        );
      } else if (GENERATES[eb] === ea) {
        kindRel = "generate";
        giver = bn;
        receiver = an;
        label = ja("支える関係（相生）", "지지하는 관계(상생)", lang);
        comment = ja(
          `${bn}さんが${an}さんを生かす向き。${bn}さんが動くと${an}さんの力が引き出されます`,
          `${bn}님이 ${an}님을 살리는 방향. ${bn}님이 움직이면 ${an}님의 힘이 끌어올려집니다`,
          lang
        );
      } else if (CONTROLS[ea] === eb || CONTROLS[eb] === ea) {
        kindRel = "control";
        label = ja("刺激し合う関係（相剋）", "서로 자극하는 관계(상극)", lang);
        comment = ja(
          `${an}さんと${bn}さんは違う方向から物事を見る二人。役割を分けると、二人合わせて視野が一番広くなります`,
          `${an}님과 ${bn}님은 서로 다른 방향에서 사물을 보는 두 사람. 역할을 나누면 둘이 합쳐 시야가 가장 넓어집니다`,
          lang
        );
      } else {
        label = ja("自然体の関係", "자연스러운 관계", lang);
        comment = ja(
          `${an}さんと${bn}さんは無理のない距離感。近づきすぎず離れすぎず、ちょうどいい関係です`,
          `${an}님과 ${bn}님은 무리 없는 거리감. 너무 가깝지도 멀지도 않은 딱 좋은 관계입니다`,
          lang
        );
      }

      pairs.push({
        aId: a.input.id,
        bId: b.input.id,
        aName: an,
        bName: bn,
        score: compat.overall,
        kind: kindRel,
        giver,
        receiver,
        label,
        comment,
      });
    }
  }
  return pairs;
}

/** 足りない本能（役割）と、その代役候補を出す */
function buildGaps(raws: Raw[], lang: Lang): RoleGap[] {
  const present = new Set(raws.map((r) => r.instinct));
  const gaps: RoleGap[] = [];

  for (const inst of INSTINCTS) {
    if (present.has(inst)) continue;
    const meta = lang === "ko" ? INSTINCT_META[inst].ko : INSTINCT_META[inst].ja;
    const covers = raws
      .filter((r) => r.subInstincts.includes(inst))
      .map((r) => r.input.name);

    gaps.push({
      instinct: inst,
      label: meta.label,
      effect: ja(
        `「${meta.lack}」が手薄。${meta.power}が自然には出てこない場面があります`,
        `「${meta.lack}」이 부족합니다. ${meta.power}이 자연스럽게 나오지 않는 장면이 있어요`,
        lang
      ),
      covers,
      coverHow: ja(
        `人体星図の中に${inst}の星を持っているので、意識すれば「${meta.lack}」の役を担えます`,
        `인체성도 안에 ${inst}의 별을 지니고 있어, 의식하면 「${meta.lack}」 역할을 맡을 수 있어요`,
        lang
      ),
    });
  }
  return gaps;
}

/** 一人で見たときの本質（集団に依存しない部分） */
function buildSoloView(r: Raw, arche: ArchetypeText, lang: Lang): string {
  const dm = r.fp.dayMaster;
  return ja(
    `${arche.essence}。四柱推命の日主は${dm.stem}（${elementName(dm.element, lang)}）で「${dm.title}」、数秘のライフパスは${r.lifePath}「${r.lifePathTitle}」。命式全体では${elementName(r.mainElement, lang)}の気がいちばん多く、一人でいるときはその気質が素のまま出ます。`,
    `${arche.essence}. 사주의 일간은 ${dm.stem}(${elementName(dm.element, lang)})로 「${dm.title}」, 수비학 라이프패스는 ${r.lifePath} 「${r.lifePathTitle}」. 명식 전체로는 ${elementName(r.mainElement, lang)}의 기운이 가장 많아, 혼자 있을 때는 그 기질이 그대로 나옵니다.`,
    lang
  );
}

export function analyzeTeam(
  membersInput: TeamMemberInput[],
  kind: TeamKind = "family",
  lang: Lang = "ja"
): TeamAnalysis | null {
  const valid = membersInput.filter((m) => /^\d{4}-\d{2}-\d{2}$/.test(m.birthDate));
  if (valid.length < 2) return null;

  const raws = valid.map((m) => analyzeOne(m, lang));
  const kindLabel = kind === "family" ? ja("家族", "가족", lang) : ja("チーム", "팀", lang);

  const elements = buildElements(raws, lang);
  const pairs = buildPairs(raws, kind, lang);
  const gaps = buildGaps(raws, lang);
  const presentInstincts = INSTINCTS.filter((i) => raws.some((r) => r.instinct === i));

  // 五行の偏り: 各気の比率が理想(0.2)からどれだけ離れているか
  const deviation = elements.reduce((a, e) => a + Math.abs(e.ratio - 0.2), 0);
  const balanceScore = Math.max(20, Math.min(100, Math.round(100 - deviation * 110)));
  const harmony = pairs.length
    ? Math.round(pairs.reduce((a, p) => a + p.score, 0) / pairs.length)
    : 0;

  const sortedByCount = [...elements].sort((a, b) => b.count - a.count);
  const strongest = sortedByCount[0].element;
  const weakest = sortedByCount[sortedByCount.length - 1].element;
  const weakSlice = elements.find((e) => e.element === weakest)!;
  const strongSlice = elements.find((e) => e.element === strongest)!;
  const weakLack = lang === "ko" ? ELEMENT_ROLE[weakest].ko.lack : ELEMENT_ROLE[weakest].ja.lack;

  // 欠けている気を「いちばん多く持っている人」＝自然な担い手
  const weakCarrier = [...raws].sort((a, b) => b.elements[weakest] - a.elements[weakest])[0];
  const elementComment =
    weakSlice.count === 0
      ? ja(
          `この${kindLabel}には${weakSlice.name}の気がまったくありません。${weakLack}という形で出やすいので、${weakCarrier.input.name}さんが意識して担うと全体が回りやすくなります。いちばん強いのは${strongSlice.name}（${strongSlice.role}）です。`,
          `이 ${kindLabel}에는 ${weakSlice.name}의 기운이 전혀 없습니다. ${weakLack}. 그럴 때는 ${weakCarrier.input.name}님이 의식해서 맡으면 전체가 잘 돌아갑니다. 가장 강한 것은 ${strongSlice.name}(${strongSlice.role})입니다.`,
          lang
        )
      : ja(
          `いちばん強いのは${strongSlice.name}（${strongSlice.role}）、いちばん少ないのは${weakSlice.name}です。${weakLack}という面が出たときは、${weakSlice.name}を多く持つ${weakSlice.holders[0] ?? weakCarrier.input.name}さんの出番です。`,
          `가장 강한 것은 ${strongSlice.name}(${strongSlice.role}), 가장 적은 것은 ${weakSlice.name}입니다. ${weakLack}. 그런 면이 보일 때는 ${weakSlice.name}의 기운을 많이 지닌 ${weakSlice.holders[0] ?? weakCarrier.input.name}님의 차례입니다.`,
          lang
        );

  // エネルギー順位
  const energyOrder = [...raws].sort((a, b) => b.energy - a.energy);
  const rankOf = new Map(energyOrder.map((r, i) => [r.input.id, i + 1]));
  const topEnergy = energyOrder[0];
  const lowEnergy = energyOrder[energyOrder.length - 1];

  const members: MemberAnalysis[] = raws.map((r) => {
    const arche = lang === "ko" ? ARCHETYPES[r.starKey].ko : ARCHETYPES[r.starKey].ja;
    const title = kind === "family" ? arche.familyTitle : arche.businessTitle;
    const gift = kind === "family" ? arche.familyGift : arche.businessGift;

    // 相対バッジ
    const badges: string[] = [];
    const uniqueElements = FIVE_ELEMENTS.filter(
      (el) => r.elements[el] > 0 && raws.every((o) => o.input.id === r.input.id || o.elements[el] === 0)
    );
    for (const el of uniqueElements) {
      badges.push(
        ja(`唯一の${elementName(el, lang)}の気`, `유일한 ${elementName(el, lang)}의 기운`, lang)
      );
    }
    const sameInstinct = raws.filter((o) => o.instinct === r.instinct);
    if (sameInstinct.length === 1) {
      badges.push(
        ja(
          `${instinctLabel(r.instinct, lang)}を持つのは1人`,
          `${instinctLabel(r.instinct, lang)}을 지닌 건 한 명`,
          lang
        )
      );
    }
    if (r.energy === topEnergy.energy && raws.length >= 2) {
      badges.push(ja("エネルギー最大", "에너지 최대", lang));
    }
    if (r.energy === lowEnergy.energy && raws.length >= 3 && lowEnergy.energy < topEnergy.energy) {
      badges.push(ja("省エネで効かせる", "적은 에너지로 효과를 내는", lang));
    }

    // 相生・相剋の相手
    const supports: string[] = [];
    const supportedBy: string[] = [];
    const sparksWith: string[] = [];
    for (const p of pairs) {
      if (p.aId !== r.input.id && p.bId !== r.input.id) continue;
      const otherName = p.aId === r.input.id ? p.bName : p.aName;
      if (p.kind === "generate") {
        if (p.giver === r.input.name) supports.push(otherName);
        else supportedBy.push(otherName);
      } else if (p.kind === "control") {
        sparksWith.push(otherName);
      }
    }

    // この集団の中での役回り（相対評価の組み立て）
    const teamParts: string[] = [];
    if (r.energy === topEnergy.energy) {
      teamParts.push(
        ja(
          `この${kindLabel}の中でいちばんエネルギー量が大きく（${r.energy}）、放っておいても引っ張る側に回ります`,
          `이 ${kindLabel} 안에서 에너지 양이 가장 크며(${r.energy}), 두어도 이끄는 쪽으로 돌아갑니다`,
          lang
        )
      );
    } else if (r.energy === lowEnergy.energy && raws.length >= 3) {
      teamParts.push(
        ja(
          `エネルギー量は控えめ（${r.energy}）。前に立ち続けるより、ここぞの場面で効かせる立ち位置が合います`,
          `에너지 양은 차분한 편(${r.energy}). 계속 앞에 서기보다 결정적인 장면에서 발휘하는 자리가 맞습니다`,
          lang
        )
      );
    }
    if (uniqueElements.length > 0) {
      const els = uniqueElements.map((el) => elementName(el, lang)).join("・");
      teamParts.push(
        ja(
          `この中で${els}の気を持っているのはあなただけ。${ELEMENT_ROLE[uniqueElements[0]].ja.role}は、あなたにしか出せない持ち場です`,
          `이 안에서 ${els}의 기운을 지닌 사람은 당신뿐. ${ELEMENT_ROLE[uniqueElements[0]].ko.role}은 당신만이 낼 수 있는 자리입니다`,
          lang
        )
      );
    }
    if (sameInstinct.length === 1) {
      teamParts.push(
        ja(
          `${instinctLabel(r.instinct, lang)}を主星に持つのは、この中であなただけ。その役は自然とあなたに集まります`,
          `${instinctLabel(r.instinct, lang)}을 주성으로 지닌 사람은 이 안에서 당신뿐. 그 역할은 자연스럽게 당신에게 모입니다`,
          lang
        )
      );
    } else if (sameInstinct.length >= 2) {
      const peers = sameInstinct
        .filter((o) => o.input.id !== r.input.id)
        .map((o) => o.input.name)
        .join("・");
      teamParts.push(
        ja(
          `${peers}さんと同じ${instinctLabel(r.instinct, lang)}の持ち主。同じ役を取り合わないよう、担当を分けると二人とも活きます`,
          `${peers}님과 같은 ${instinctLabel(r.instinct, lang)}의 소유자. 같은 역할을 두고 겹치지 않게 담당을 나누면 둘 다 살아납니다`,
          lang
        )
      );
    }
    if (supports.length > 0) {
      teamParts.push(
        ja(
          `${supports.join("・")}さんを生かす側に回りやすい位置です`,
          `${supports.join("·")}님을 살리는 쪽으로 돌아가기 쉬운 자리입니다`,
          lang
        )
      );
    }
    if (supportedBy.length > 0) {
      teamParts.push(
        ja(
          `${supportedBy.join("・")}さんから力をもらえる位置。遠慮せず頼るほど回ります`,
          `${supportedBy.join("·")}님에게서 힘을 받을 수 있는 자리. 사양 말고 기댈수록 잘 돌아갑니다`,
          lang
        )
      );
    }
    if (teamParts.length === 0) {
      teamParts.push(
        ja(
          `どこかに偏らず、全体のバランスを取る位置にいます`,
          `어느 쪽에도 치우치지 않고 전체의 균형을 잡는 자리에 있습니다`,
          lang
        )
      );
    }

    const contribution = ja(
      `${r.input.name}さんがいることで、この${kindLabel}は「${title}」を手に入れます。${gift}`,
      `${r.input.name}님이 있음으로써 이 ${kindLabel}은 「${title}」의 역할을 얻습니다. ${gift}`,
      lang
    );

    return {
      id: r.input.id,
      name: r.input.name,
      role: r.input.role || "",
      birthDate: r.input.birthDate,
      archetype: {
        starName: r.sm.mainStar.name,
        starKey: r.starKey,
        title,
        essence: arche.essence,
        gift,
        watch: arche.watch,
        instinct: r.instinct,
        instinctLabel: instinctLabel(r.instinct, lang),
      },
      energy: r.energy,
      energyLabel: energyLabel(r.energy, lang),
      energyRank: rankOf.get(r.input.id) ?? 1,
      elements: r.elements,
      mainElement: r.mainElement,
      dayMaster: { stem: r.fp.dayMaster.stem, element: r.fp.dayMaster.element, title: r.fp.dayMaster.title },
      lifePath: r.lifePath,
      lifePathTitle: r.lifePathTitle,
      honmeisei: r.honmeisei,
      mayanSeal: r.mayanSeal,
      soloView: buildSoloView(r, arche, lang),
      teamView: lang === "ko" ? `${teamParts.join(". ")}.` : `${teamParts.join("。")}。`,
      contribution,
      watchInTeam: arche.watch,
      badges,
      supports,
      supportedBy,
      sparksWith,
      subInstincts: r.subInstincts,
    };
  });

  // チームタイプの5分類
  const controlCount = pairs.filter((p) => p.kind === "control").length;
  const generateCount = pairs.filter((p) => p.kind === "generate").length;
  let typeTitle: string;
  let typeComment: string;
  if (harmony >= 72 && balanceScore >= 68) {
    typeTitle = ja("安心の土台タイプ", "안심의 토대 타입", lang);
    typeComment = ja(
      `気の巡りも噛み合いも良く、そこにいるだけで整う${kindLabel}です。無理に役割を決めなくても自然に回るぶん、良さが当たり前になりやすいので、時々「助かっている」を言葉にすると強さが続きます。`,
      `기운의 흐름도 맞물림도 좋아, 있는 것만으로 정돈되는 ${kindLabel}입니다. 억지로 역할을 정하지 않아도 자연스럽게 돌아가는 만큼 좋은 점이 당연해지기 쉬우니, 가끔 「덕분이야」를 말로 표현하면 강점이 이어집니다.`,
      lang
    );
  } else if (generateCount > 0 && generateCount >= controlCount && harmony >= 62) {
    typeTitle = ja("支え合いタイプ", "서로 지지하는 타입", lang);
    typeComment = ja(
      `誰かが動くと誰かの力が引き出される、相生の向きが多い${kindLabel}です。「誰が誰を生かす向きか」を意識して順番を決めると、少ない力で大きく進みます。`,
      `누군가 움직이면 누군가의 힘이 끌어올려지는, 상생의 방향이 많은 ${kindLabel}입니다. 「누가 누구를 살리는 방향인지」를 의식해 순서를 정하면 적은 힘으로 크게 나아갑니다.`,
      lang
    );
  } else if (controlCount > generateCount) {
    typeTitle = ja("刺激し合う成長タイプ", "서로 자극하는 성장 타입", lang);
    typeComment = ja(
      `見ている方向が違う組み合わせが多い${kindLabel}。ぶつかるのは相性が悪いからではなく、担当が重なっているからです。役割を分けた瞬間、この${kindLabel}はいちばん視野が広いチームになります。`,
      `보는 방향이 다른 조합이 많은 ${kindLabel}. 부딪히는 건 궁합이 나빠서가 아니라 담당이 겹쳐 있기 때문입니다. 역할을 나누는 순간, 이 ${kindLabel}은 가장 시야가 넓은 팀이 됩니다.`,
      lang
    );
  } else if (balanceScore < 55) {
    typeTitle = ja("尖った個性タイプ", "뾰족한 개성 타입", lang);
    typeComment = ja(
      `気が特定の方向に集まっている${kindLabel}。得意分野では圧倒的に強い反面、抜けている気の担当を決めておくと安定します。`,
      `기운이 특정 방향에 모여 있는 ${kindLabel}. 잘하는 분야에서는 압도적으로 강한 반면, 빠져 있는 기운의 담당을 정해 두면 안정됩니다.`,
      lang
    );
  } else {
    typeTitle = ja("バランスタイプ", "밸런스 타입", lang);
    typeComment = ja(
      `突出も欠けも少なく、状況に合わせて形を変えられる${kindLabel}です。誰が主役かをその都度決められるのが強みなので、案件ごとに担当を回すとよく回ります。`,
      `튀는 부분도 빠진 부분도 적어, 상황에 맞춰 형태를 바꿀 수 있는 ${kindLabel}입니다. 그때그때 주인공을 정할 수 있는 것이 강점이니, 건마다 담당을 돌리면 잘 돌아갑니다.`,
      lang
    );
  }

  // 全体アドバイス
  const advice: string[] = [];
  if (gaps.length > 0) {
    const g = gaps[0];
    if (g.covers.length > 0) {
      advice.push(
        ja(
          `${g.label}を主星に持つ人がいません。${g.covers[0]}さんが人体星図の中にその星を持っているので、意識して引き受けると全体が回ります。`,
          `${g.label}을 주성으로 지닌 사람이 없습니다. ${g.covers[0]}님이 인체성도 안에 그 별을 지니고 있으니, 의식해서 맡으면 전체가 돌아갑니다.`,
          lang
        )
      );
    } else {
      advice.push(
        ja(
          `${g.label}が${kindLabel}の中に見当たりません。外部の人に頼る・仕組みで補う、と決めておくと消耗しません。`,
          `${g.label}이 ${kindLabel} 안에 보이지 않습니다. 외부에 기대거나 구조로 보완한다고 정해 두면 소모되지 않습니다.`,
          lang
        )
      );
    }
  } else {
    advice.push(
      ja(
        `守る・学ぶ・動く・集める・伝える の5つの力がすべて揃っています。担当を宣言し合えば、外部に頼らず完結できる${kindLabel}です。`,
        `지키기·배우기·움직이기·모으기·전하기 다섯 가지 힘이 모두 갖춰져 있습니다. 담당을 서로 선언하면 외부에 기대지 않고 완결할 수 있는 ${kindLabel}입니다.`,
        lang
      )
    );
  }
  advice.push(elementComment);
  if (topEnergy.energy - lowEnergy.energy >= 12) {
    advice.push(
      ja(
        `${topEnergy.input.name}さんと${lowEnergy.input.name}さんではエネルギー量が倍近く違います（${topEnergy.energy} と ${lowEnergy.energy}）。同じ量を求めず、ペース配分を分けるのが全員にとって楽です。`,
        `${topEnergy.input.name}님과 ${lowEnergy.input.name}님은 에너지 양이 두 배 가까이 차이납니다(${topEnergy.energy} 대 ${lowEnergy.energy}). 같은 양을 요구하지 말고 페이스 배분을 나누는 것이 모두에게 편합니다.`,
        lang
      )
    );
  }
  const hottest = [...pairs].sort((a, b) => a.score - b.score)[0];
  if (hottest && hottest.score < 60) {
    advice.push(
      ja(
        `${hottest.aName}さんと${hottest.bName}さんは見ている方向がいちばん違う組み合わせ。どちらが正しいかではなく「担当を分ける」で解くと、この${kindLabel}の幅がいちばん広がります。`,
        `${hottest.aName}님과 ${hottest.bName}님은 보는 방향이 가장 다른 조합. 누가 옳은가가 아니라 「담당을 나눈다」로 풀면 이 ${kindLabel}의 폭이 가장 넓어집니다.`,
        lang
      )
    );
  }

  const headline = ja(
    `${valid.length}人の${kindLabel}：${typeTitle}（気のバランス ${balanceScore} / 噛み合い ${harmony}）`,
    `${valid.length}명의 ${kindLabel}: ${typeTitle} (기운 밸런스 ${balanceScore} / 맞물림 ${harmony})`,
    lang
  );

  const soloVsTeamNote = ja(
    `同じ人でも「一人で見たときの本質」と「この${kindLabel}の中での役回り」は違って見えます。役回りは、他のメンバーが何を持っているかで決まる相対的なもの。メンバーが変われば、同じ人が別の役を担うことになります。`,
    `같은 사람이라도 「혼자 봤을 때의 본질」과 「이 ${kindLabel} 안에서의 역할」은 다르게 보입니다. 역할은 다른 구성원이 무엇을 지녔는지에 따라 정해지는 상대적인 것. 구성원이 바뀌면 같은 사람이 다른 역할을 맡게 됩니다.`,
    lang
  );

  return {
    kind,
    kindLabel,
    memberCount: valid.length,
    members,
    elements,
    strongest,
    weakest,
    elementComment,
    balanceScore,
    harmony,
    pairs,
    presentInstincts,
    gaps,
    typeTitle,
    typeComment,
    headline,
    advice,
    soloVsTeamNote,
  };
}
