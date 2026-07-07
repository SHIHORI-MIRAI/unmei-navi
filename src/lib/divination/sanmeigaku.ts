/**
 * 算命学（Sanmeigaku）計算エンジン
 *
 * 日干支から十大主星・十二大従星を正確な対照表で算出。
 * 人体星図・天中殺を判定する。
 */

import {
  calcDayPillar,
  calcYearPillar,
  calcMonthPillar,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  type StemBranch,
} from "./stems-branches";
import type { Lang } from "@/lib/i18n/dict";

// --- 十大主星 ---

/**
 * 十大主星リスト（対照表の番号順 = 五本能順）
 * 1-2: 守備本能、3-4: 習得本能、5-6: 攻撃本能、7-8: 引力本能、9-10: 伝達本能
 */
const MAIN_STAR_LIST = [
  null, // 0は使わない（1始まり）
  { name: "貫索星", reading: "かんさくせい", keyword: "自立・守り", personality: "自分の世界を大切にし、マイペースに生きるタイプ。信念を貫く力が強い", strength: "独立心・忍耐力・信念" },
  { name: "石門星", reading: "せきもんせい", keyword: "社交・仲間", personality: "人と繋がる力が強く、チームをまとめるのが得意。社交的で面倒見がいい", strength: "協調性・社交性・仲介力" },
  { name: "龍高星", reading: "りゅうこうせい", keyword: "知恵・放浪", personality: "知的好奇心旺盛で、自由を愛する。旅や冒険が好きで、型にはまらない", strength: "知識欲・冒険心・改革力" },
  { name: "玉堂星", reading: "ぎょくどうせい", keyword: "学問・母性", personality: "学ぶことが好きで、知識を人に伝える力がある。母性的な温かさを持つ", strength: "学問・教育力・母性" },
  { name: "車騎星", reading: "しゃきせい", keyword: "行動・闘争", personality: "行動力と闘争心に溢れる。目標に向かって突き進む力が強く、スポーツマンタイプ", strength: "行動力・闘争心・スピード" },
  { name: "牽牛星", reading: "けんぎゅうせい", keyword: "名誉・責任", personality: "名誉を重んじ、責任感が強い。品格があり、エリートタイプ", strength: "責任感・品格・組織力" },
  { name: "禄存星", reading: "ろくぞんせい", keyword: "魅力・財", personality: "人を惹きつける魅力があり、経済的な才能に恵まれる。世話好きで情が深い", strength: "人間的魅力・経済力・奉仕精神" },
  { name: "司禄星", reading: "しろくせい", keyword: "蓄積・堅実", personality: "コツコツと積み重ねる力が強い。堅実で、家庭や組織を安定させる力がある", strength: "堅実さ・蓄財力・安定感" },
  { name: "鳳閣星", reading: "ほうかくせい", keyword: "楽観・表現", personality: "楽観的で表現力豊か。食べること・楽しむことが好きで、人を和ませる天才", strength: "楽観性・表現力・おおらかさ" },
  { name: "調舒星", reading: "ちょうじょせい", keyword: "感性・芸術", personality: "感受性が非常に繊細で、芸術的才能がある。孤独を愛し、深い精神世界を持つ", strength: "感性・芸術性・直感力" },
] as const;

type MainStar = NonNullable<(typeof MAIN_STAR_LIST)[number]>;

/**
 * 十大主星の対照表（算命学アカデミーオンラインの表に基づく）
 * MAIN_STAR_TABLE[日干index][相手干index] = 主星番号(1-10)
 *
 * 干のindex: 0=癸, 1=甲, 2=乙, 3=丙, 4=丁, 5=戊, 6=己, 7=庚, 8=辛, 9=壬
 * ただしHEAVENLY_STEMSの並びは 0=甲,1=乙,...,9=癸 なので変換が必要
 */
// テーブル内の干番号: 0=癸,1=甲,2=乙,3=丙,4=丁,5=戊,6=己,7=庚,8=辛,9=壬
const MAIN_STAR_TABLE: number[][] = [
  /* 癸(0) */ [1, 10, 9, 8, 7, 6, 5, 4, 3, 2],
  /* 甲(1) */ [4, 1, 2, 9, 10, 7, 8, 5, 6, 3],
  /* 乙(2) */ [3, 2, 1, 10, 9, 8, 7, 6, 5, 4],
  /* 丙(3) */ [6, 3, 4, 1, 2, 9, 10, 7, 8, 5],
  /* 丁(4) */ [5, 4, 3, 2, 1, 10, 9, 8, 7, 6],
  /* 戊(5) */ [8, 5, 6, 3, 4, 1, 2, 9, 10, 7],
  /* 己(6) */ [7, 6, 5, 4, 3, 2, 1, 10, 9, 8],
  /* 庚(7) */ [10, 7, 8, 5, 6, 3, 4, 1, 2, 9],
  /* 辛(8) */ [9, 8, 7, 6, 5, 4, 3, 2, 1, 10],
  /* 壬(9) */ [2, 9, 10, 7, 8, 5, 6, 3, 4, 1],
];

// HEAVENLY_STEMS index (0=甲...9=癸) → テーブル index (0=癸,1=甲...9=壬)
function stemToTableIdx(stemIdx: number): number {
  // 甲(0)→1, 乙(1)→2, ..., 壬(8)→9, 癸(9)→0
  return (stemIdx + 1) % 10;
}

function lookupMainStar(dayStemIdx: number, targetStemIdx: number): MainStar {
  const dayTbl = stemToTableIdx(dayStemIdx);
  const targetTbl = stemToTableIdx(targetStemIdx);
  const starNum = MAIN_STAR_TABLE[dayTbl][targetTbl];
  return MAIN_STAR_LIST[starNum]!;
}

// --- 十二大従星 ---

const SUB_STAR_LIST = [
  null, // 0は使わない（1始まり）
  { name: "天報星", energy: 3, stage: "胎児", meaning: "多才で変化を好む。何度も生まれ変わるように新しい人生を歩む" },
  { name: "天印星", energy: 6, stage: "赤ちゃん", meaning: "周囲に愛される天性の魅力。無邪気さと愛嬌がある" },
  { name: "天貴星", energy: 9, stage: "幼児", meaning: "品格があり、プライドが高い。美意識と向上心を持つ" },
  { name: "天恍星", energy: 7, stage: "少年少女", meaning: "夢見がちでロマンチスト。理想を追い求める冒険心がある" },
  { name: "天南星", energy: 10, stage: "青年", meaning: "エネルギッシュで闘争心が強い。改革者タイプ" },
  { name: "天禄星", energy: 11, stage: "壮年", meaning: "安定した実力者。堅実で信頼される社会人タイプ" },
  { name: "天将星", energy: 12, stage: "トップ", meaning: "最大のエネルギー。トップに立つ器で、カリスマ性がある" },
  { name: "天堂星", energy: 8, stage: "老人", meaning: "円熟した知恵を持つ。控えめだが存在感がある" },
  { name: "天胡星", energy: 4, stage: "入り口", meaning: "霊感・直感が鋭い。芸術的センスに優れる" },
  { name: "天極星", energy: 2, stage: "あの世", meaning: "純粋で無欲。精神性が高く、見えない世界と繋がる力がある" },
  { name: "天庫星", energy: 5, stage: "墓守", meaning: "先祖からの守りが強い。蓄える力と墓守の使命がある" },
  { name: "天馳星", energy: 1, stage: "出発", meaning: "最小のエネルギーだが、瞬発力とスピードに優れる。多忙な星" },
] as const;

type SubStar = NonNullable<(typeof SUB_STAR_LIST)[number]>;

/**
 * 十二大従星の対照表（算命学アカデミーオンラインの表に基づく）
 * SUB_STAR_TABLE[日干テーブルindex][地支テーブルindex] = 従星番号(1-12)
 *
 * 干のindex: 0=癸,1=甲,...,9=壬
 * 支のindex: 0=亥,1=子,2=丑,3=寅,4=卯,5=辰,6=巳,7=午,8=未,9=申,10=酉,11=戌
 */
const SUB_STAR_TABLE: number[][] = [
  /* 癸(0) */ [7, 6, 5, 4, 3, 2, 1, 12, 11, 10, 9, 8],
  /* 甲(1) */ [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2],
  /* 乙(2) */ [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 12, 11],
  /* 丙(3) */ [12, 1, 11, 3, 4, 5, 6, 7, 8, 9, 10, 2],
  /* 丁(4) */ [1, 12, 2, 10, 9, 8, 7, 6, 5, 4, 3, 11],
  /* 戊(5) */ [12, 1, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
  /* 己(6) */ [1, 12, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  /* 庚(7) */ [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8],
  /* 辛(8) */ [4, 3, 2, 1, 12, 11, 10, 9, 8, 7, 6, 5],
  /* 壬(9) */ [6, 7, 3, 4, 10, 9, 12, 1, 11, 2, 5, 8],
];

// EARTHLY_BRANCHES index (0=子,1=丑,...,11=亥) → テーブル index (0=亥,1=子,...,11=戌)
function branchToTableIdx(branchIdx: number): number {
  // 子(0)→1, 丑(1)→2, 寅(2)→3, ..., 戌(10)→11, 亥(11)→0
  return (branchIdx + 1) % 12;
}

function lookupSubStar(dayStemIdx: number, branchIdx: number): SubStar {
  const dayTbl = stemToTableIdx(dayStemIdx);
  const branchTbl = branchToTableIdx(branchIdx);
  const starNum = SUB_STAR_TABLE[dayTbl][branchTbl];
  return SUB_STAR_LIST[starNum]!;
}

// --- 天中殺 ---

const TENCHU_GROUPS = [
  { name: "戌亥天中殺", branches: ["戌", "亥"], meaning: "初代運。親の力に頼らず、自力で人生を切り開く。北西の気が欠ける", theme: "自立して新しい道を切り開く力を持つ。家系を超えた生き方が吉" },
  { name: "申酉天中殺", branches: ["申", "酉"], meaning: "西方の気が欠ける。結果やお金に執着しすぎると運が落ちる", theme: "過程を楽しむ生き方が吉。人のために動くと運が開ける" },
  { name: "午未天中殺", branches: ["午", "未"], meaning: "末代運。家系や血縁のしがらみから自由になれる星", theme: "自分の力で道を切り開く。晩年に向けて運気が上昇する" },
  { name: "辰巳天中殺", branches: ["辰", "巳"], meaning: "家庭運に変化が出やすい。精神世界に強い関心を持つ傾向", theme: "精神的な成長を重視する生き方が吉。物質より心の豊かさを追求" },
  { name: "寅卯天中殺", branches: ["寅", "卯"], meaning: "東方の気が欠ける。社会の枠組みの中で生きることに違和感を感じやすい", theme: "組織より個人で力を発揮。創造性と自由な発想が武器になる" },
  { name: "子丑天中殺", branches: ["子", "丑"], meaning: "北方の気が欠ける。初代運であり、親元を離れて自立すると運が開ける", theme: "自立心を活かし、新しい分野を開拓する力がある" },
] as const;

/**
 * 天中殺の判定
 * 六十干支の番号（0始まり）を10で割った商でグループ分け
 * 1-10番(0-9) → 戌亥天中殺
 * 11-20番(10-19) → 申酉天中殺
 * 21-30番(20-29) → 午未天中殺
 * 31-40番(30-39) → 辰巳天中殺
 * 41-50番(40-49) → 寅卯天中殺
 * 51-60番(50-59) → 子丑天中殺
 */
/**
 * 指定年が天中殺年かどうか判定
 * その人の天中殺に含まれる地支を持つ年が天中殺年
 */
export function checkTenchusatsuYear(
  birthDate: string,
  year: number,
  lang: Lang = "ja"
): { isTenchusatsu: boolean; group: string; yearBranch: string } {
  const [y, m, d] = birthDate.split("-").map(Number);
  const dayPillar = calcDayPillar(y, m, d);
  const group = calcTenchu(dayPillar);

  // 対象年の年柱（立春基準）
  const yearPillar = calcYearPillar(year, 6, 15);
  const yearBranch = yearPillar.branch.name;

  // 判定は日本語の branches / yearBranch で行い、表示名のみ言語対応する
  const groupName =
    lang === "ko" ? TENCHU_GROUPS_KO[group.name]?.name ?? group.name : group.name;

  return {
    isTenchusatsu: (group.branches as readonly string[]).includes(yearBranch),
    group: groupName,
    yearBranch,
  };
}

function calcTenchu(dayPillar: StemBranch): (typeof TENCHU_GROUPS)[number] {
  const stemIdx = HEAVENLY_STEMS.findIndex((s) => s.name === dayPillar.stem.name);
  const branchIdx = EARTHLY_BRANCHES.findIndex((b) => b.name === dayPillar.branch.name);

  // 六十干支の番号を算出（0始まり）
  // 干支の組み合わせ: 甲子=0, 乙丑=1, ..., 癸亥=59
  // stemIdx と branchIdx から60干支番号を逆算
  // kanshiNum where kanshiNum%10==stemIdx && kanshiNum%12==branchIdx
  // 公式: kanshiNum = (6 * stemIdx - 5 * branchIdx + 60) % 60
  // ※ 干は偶数番と偶数支、奇数番と奇数支のみ組み合わさる
  let kanshiNum = -1;
  for (let i = 0; i < 60; i++) {
    if (i % 10 === stemIdx && i % 12 === branchIdx) {
      kanshiNum = i;
      break;
    }
  }
  if (kanshiNum < 0) kanshiNum = 0;

  const groupIdx = Math.floor(kanshiNum / 10);
  return TENCHU_GROUPS[groupIdx];
}

// --- 蔵干（地支に内包される天干）---

/**
 * 地支の蔵干（主気のみ・簡易版）
 * 人体星図の東（左手）・西（右手）の星は蔵干から算出
 */
const ZOUKAN: Record<string, number> = {
  子: 9, // 癸
  丑: 5, // 己
  寅: 0, // 甲
  卯: 1, // 乙
  辰: 4, // 戊
  巳: 2, // 丙
  午: 4, // 丁→己(主気は丁だが算命学では己を使う場合もある。丁=3)
  // 午の蔵干主気は丁(3)
  未: 5, // 己
  申: 6, // 庚
  酉: 7, // 辛
  戌: 4, // 戊
  亥: 8, // 壬
};

// 算命学で人体星図に使用する蔵干（各地支の代表蔵干）
const ZOUKAN_MAIN: Record<string, number> = {
  子: 9, // 癸
  丑: 5, // 己
  寅: 0, // 甲
  卯: 1, // 乙
  辰: 4, // 戊
  巳: 2, // 丙
  午: 5, // 己（算命学では己を使用）
  未: 5, // 己
  申: 6, // 庚
  酉: 7, // 辛
  戌: 4, // 戊
  亥: 8, // 壬
};

// --- 韓国語辞書（多言語対応） ---
// 表示文字列のみ韓国語化する。星名は韓国漢字語読み。
// name は getSanmeigakuDetail など日本語をキーに使う処理があるため、
// 計算・キー参照は日本語版で行い、最終的な返却時にのみ韓国語へ差し替える。
// 数値(energy)・分岐用のデータ(branches)は日本語版のまま維持する。

// MAIN_STAR_LIST と同じ番号順（index0=null）
const MAIN_STAR_LIST_KO: ({ name: string; keyword: string; personality: string; strength: string } | null)[] = [
  null,
  { name: "관삭성", keyword: "자립·지킴", personality: "자신의 세계를 소중히 하며 마이페이스로 살아가는 타입. 신념을 관철하는 힘이 강해요", strength: "독립심·인내력·신념" },
  { name: "석문성", keyword: "사교·동료", personality: "사람과 이어지는 힘이 강하고 팀을 이끄는 데 능숙해요. 사교적이고 잘 챙겨줘요", strength: "협조성·사교성·중개력" },
  { name: "용고성", keyword: "지혜·방랑", personality: "지적 호기심이 왕성하고 자유를 사랑해요. 여행과 모험을 좋아하며 틀에 얽매이지 않아요", strength: "지식욕·모험심·개혁력" },
  { name: "옥당성", keyword: "학문·모성", personality: "배우는 것을 좋아하고 지식을 사람에게 전하는 힘이 있어요. 모성적인 따뜻함을 지녔어요", strength: "학문·교육력·모성" },
  { name: "차기성", keyword: "행동·투쟁", personality: "행동력과 투쟁심이 넘쳐요. 목표를 향해 돌진하는 힘이 강하고 스포츠맨 타입이에요", strength: "행동력·투쟁심·스피드" },
  { name: "견우성", keyword: "명예·책임", personality: "명예를 중시하고 책임감이 강해요. 품격이 있고 엘리트 타입이에요", strength: "책임감·품격·조직력" },
  { name: "녹존성", keyword: "매력·재물", personality: "사람을 끌어당기는 매력이 있고 경제적 재능을 타고났어요. 잘 챙겨주고 정이 깊어요", strength: "인간적 매력·경제력·봉사정신" },
  { name: "사록성", keyword: "축적·견실", personality: "차근차근 쌓아가는 힘이 강해요. 견실하고 가정이나 조직을 안정시키는 힘이 있어요", strength: "견실함·축재력·안정감" },
  { name: "봉각성", keyword: "낙관·표현", personality: "낙관적이고 표현력이 풍부해요. 먹는 것·즐기는 것을 좋아하며 사람을 편안하게 하는 천재예요", strength: "낙관성·표현력·너그러움" },
  { name: "조서성", keyword: "감성·예술", personality: "감수성이 매우 섬세하고 예술적 재능이 있어요. 고독을 사랑하며 깊은 정신세계를 지녔어요", strength: "감성·예술성·직관력" },
];

// SUB_STAR_LIST と同じ番号順（index0=null）。energy は日本語版から引き継ぐ
const SUB_STAR_LIST_KO: ({ name: string; stage: string; meaning: string } | null)[] = [
  null,
  { name: "천보성", stage: "태아", meaning: "다재다능하고 변화를 좋아해요. 몇 번이고 다시 태어나듯 새로운 인생을 걸어가요" },
  { name: "천인성", stage: "아기", meaning: "주위에 사랑받는 타고난 매력. 천진난만함과 애교가 있어요" },
  { name: "천귀성", stage: "유아", meaning: "품격이 있고 자존심이 높아요. 미의식과 향상심을 지녔어요" },
  { name: "천황성", stage: "소년소녀", meaning: "꿈이 많은 로맨티스트. 이상을 좇는 모험심이 있어요" },
  { name: "천남성", stage: "청년", meaning: "에너지 넘치고 투쟁심이 강해요. 개혁가 타입이에요" },
  { name: "천록성", stage: "장년", meaning: "안정된 실력자. 견실하고 신뢰받는 사회인 타입이에요" },
  { name: "천장성", stage: "정상", meaning: "최대의 에너지. 정상에 서는 그릇으로 카리스마가 있어요" },
  { name: "천당성", stage: "노인", meaning: "원숙한 지혜를 지녔어요. 겸손하지만 존재감이 있어요" },
  { name: "천호성", stage: "입구", meaning: "영감·직감이 예리해요. 예술적 센스가 뛰어나요" },
  { name: "천극성", stage: "저세상", meaning: "순수하고 무욕. 정신성이 높고 보이지 않는 세계와 이어지는 힘이 있어요" },
  { name: "천고성", stage: "묘지기", meaning: "조상의 보살핌이 강해요. 쌓는 힘과 묘를 지키는 사명이 있어요" },
  { name: "천치성", stage: "출발", meaning: "최소의 에너지지만 순발력과 스피드가 뛰어나요. 바쁜 별이에요" },
];

// TENCHU_GROUPS の日本語 name をキーに、表示文字列のみ韓国語化（branches は日本語版のまま）
const TENCHU_GROUPS_KO: Record<string, { name: string; meaning: string; theme: string }> = {
  "戌亥天中殺": { name: "술해천중살", meaning: "초대운. 부모의 힘에 기대지 않고 스스로 인생을 개척해요. 북서쪽 기운이 결여돼요", theme: "자립해 새로운 길을 개척하는 힘을 지녔어요. 가문을 넘어선 삶의 방식이 길해요" },
  "申酉天中殺": { name: "신유천중살", meaning: "서쪽 기운이 결여돼요. 결과나 돈에 지나치게 집착하면 운이 떨어져요", theme: "과정을 즐기는 삶이 길해요. 남을 위해 움직이면 운이 열려요" },
  "午未天中殺": { name: "오미천중살", meaning: "말대운. 가문이나 혈연의 얽매임에서 자유로워질 수 있는 별이에요", theme: "자신의 힘으로 길을 개척해요. 만년을 향해 운기가 상승해요" },
  "辰巳天中殺": { name: "진사천중살", meaning: "가정운에 변화가 생기기 쉬워요. 정신세계에 강한 관심을 갖는 경향이 있어요", theme: "정신적 성장을 중시하는 삶이 길해요. 물질보다 마음의 풍요를 추구해요" },
  "寅卯天中殺": { name: "인묘천중살", meaning: "동쪽 기운이 결여돼요. 사회의 틀 안에서 사는 것에 위화감을 느끼기 쉬워요", theme: "조직보다 개인으로 힘을 발휘해요. 창의성과 자유로운 발상이 무기가 돼요" },
  "子丑天中殺": { name: "자축천중살", meaning: "북쪽 기운이 결여돼요. 초대운이며 부모 곁을 떠나 자립하면 운이 열려요", theme: "자립심을 살려 새로운 분야를 개척하는 힘이 있어요" },
};

/** 十大主星を言語に応じてローカライズ（ja はそのまま） */
function localizeMainStar(star: MainStar, lang: Lang): MainStar {
  if (lang !== "ko") return star;
  const idx = MAIN_STAR_LIST.findIndex((s) => s?.name === star.name);
  const ko = idx >= 0 ? MAIN_STAR_LIST_KO[idx] : null;
  return ko ? ({ ...star, ...ko } as MainStar) : star;
}

/** 十二大従星を言語に応じてローカライズ（energy は共通） */
function localizeSubStar(star: SubStar, lang: Lang): SubStar {
  if (lang !== "ko") return star;
  const idx = SUB_STAR_LIST.findIndex((s) => s?.name === star.name);
  const ko = idx >= 0 ? SUB_STAR_LIST_KO[idx] : null;
  return ko ? ({ ...star, ...ko } as SubStar) : star;
}

/** 天中殺グループを言語に応じてローカライズ（branches は共通） */
function localizeTenchu(
  g: (typeof TENCHU_GROUPS)[number],
  lang: Lang
): (typeof TENCHU_GROUPS)[number] {
  if (lang !== "ko") return g;
  const ko = TENCHU_GROUPS_KO[g.name];
  return ko ? ({ ...g, ...ko } as (typeof TENCHU_GROUPS)[number]) : g;
}

// --- メインの計算関数 ---

export interface SanmeigakuResult {
  mainStar: MainStar;
  bodyChart: {
    center: MainStar;  // 中央（自分自身）
    north: MainStar;   // 北（頭）- 目上・両親
    south: MainStar;   // 南（腹）- 目下・子供
    east: MainStar;    // 東（左手）- 社会・友人
    west: MainStar;    // 西（右手）- 家庭・配偶者
  };
  subStars: {
    head: SubStar;   // 北（頭）
    chest: SubStar;  // 中央（胸）
    belly: SubStar;  // 南（腹）
  };
  totalEnergy: number;
  tenchu: (typeof TENCHU_GROUPS)[number];
  dayPillar: StemBranch;
}

export function calcSanmeigaku(
  birthDate: string,
  lang: Lang = "ja"
): SanmeigakuResult {
  const [y, m, d] = birthDate.split("-").map(Number);

  const dayPillar = calcDayPillar(y, m, d);
  const monthPillar = calcMonthPillar(y, m, d);
  const yearPillar = calcYearPillar(y, m, d);

  const dayStemIdx = HEAVENLY_STEMS.findIndex((s) => s.name === dayPillar.stem.name);
  const yearStemIdx = HEAVENLY_STEMS.findIndex((s) => s.name === yearPillar.stem.name);
  const monthStemIdx = HEAVENLY_STEMS.findIndex((s) => s.name === monthPillar.stem.name);

  // 蔵干インデックス
  const dayBranchZoukan = ZOUKAN_MAIN[dayPillar.branch.name] ?? 0;
  const yearBranchZoukan = ZOUKAN_MAIN[yearPillar.branch.name] ?? 0;

  // --- 十大主星（人体星図の5箇所）---
  // 北（頭）: 日干 vs 年干 → 目上・両親との関係
  const north = lookupMainStar(dayStemIdx, yearStemIdx);
  // 南（腹）: 日干 vs 月干 → 目下・子供との関係
  const south = lookupMainStar(dayStemIdx, monthStemIdx);
  // 中央（胸）: 日干 vs 月支の蔵干 → 自分自身の本質
  const monthBranchZoukan = ZOUKAN_MAIN[monthPillar.branch.name] ?? 0;
  const center = lookupMainStar(dayStemIdx, monthBranchZoukan);
  // 東（左手）: 日干 vs 年支の蔵干 → 兄弟・友人との関係
  const east = lookupMainStar(dayStemIdx, yearBranchZoukan);
  // 西（右手）: 日干 vs 日支の蔵干 → 配偶者・家庭との関係
  const west = lookupMainStar(dayStemIdx, dayBranchZoukan);

  // 主星 = 中央の星
  const mainStar = center;

  // --- 十二大従星（3箇所）---
  const dayBranchIdx = EARTHLY_BRANCHES.findIndex((b) => b.name === dayPillar.branch.name);
  const monthBranchIdx = EARTHLY_BRANCHES.findIndex((b) => b.name === monthPillar.branch.name);
  const yearBranchIdx = EARTHLY_BRANCHES.findIndex((b) => b.name === yearPillar.branch.name);

  // 頭（北）: 日干 vs 月支
  const head = lookupSubStar(dayStemIdx, monthBranchIdx);
  // 胸（中央）: 日干 vs 日支
  const chest = lookupSubStar(dayStemIdx, dayBranchIdx);
  // 腹（南）: 日干 vs 年支
  const belly = lookupSubStar(dayStemIdx, yearBranchIdx);

  const totalEnergy = head.energy + chest.energy + belly.energy;

  // --- 天中殺 ---
  const tenchu = calcTenchu(dayPillar);

  // 計算・キー参照は日本語版で完了済み。返却時に表示文字列のみ言語対応する
  return {
    mainStar: localizeMainStar(mainStar, lang),
    bodyChart: {
      center: localizeMainStar(center, lang),
      north: localizeMainStar(north, lang),
      south: localizeMainStar(south, lang),
      east: localizeMainStar(east, lang),
      west: localizeMainStar(west, lang),
    },
    subStars: {
      head: localizeSubStar(head, lang),
      chest: localizeSubStar(chest, lang),
      belly: localizeSubStar(belly, lang),
    },
    totalEnergy,
    tenchu: localizeTenchu(tenchu, lang),
    dayPillar,
  };
}
