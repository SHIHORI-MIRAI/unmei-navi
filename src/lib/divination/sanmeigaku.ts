/**
 * 算命学（Sanmeigaku）計算エンジン
 *
 * 日干支から主星・従星を算出し、人体星図・天中殺を判定する。
 * 四柱推命と同じ天干地支を使うが、解釈体系が異なる。
 */

import {
  calcDayPillar,
  calcYearPillar,
  calcMonthPillar,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  type StemBranch,
  type FiveElement,
} from "./stems-branches";

// --- 十大主星 ---

const MAIN_STARS = [
  { name: "貫索星", reading: "かんさくせい", element: "木陽", keyword: "自立・守り", personality: "自分の世界を大切にし、マイペースに生きるタイプ。信念を貫く力が強い", strength: "独立心・忍耐力・信念" },
  { name: "石門星", reading: "せきもんせい", element: "木陰", keyword: "社交・仲間", personality: "人と繋がる力が強く、チームをまとめるのが得意。社交的で面倒見がいい", strength: "協調性・社交性・仲介力" },
  { name: "鳳閣星", reading: "ほうかくせい", element: "火陽", keyword: "楽観・表現", personality: "楽観的で表現力豊か。食べること・楽しむことが好きで、人を和ませる天才", strength: "楽観性・表現力・おおらかさ" },
  { name: "調舒星", reading: "ちょうじょせい", element: "火陰", keyword: "感性・芸術", personality: "感受性が非常に繊細で、芸術的才能がある。孤独を愛し、深い精神世界を持つ", strength: "感性・芸術性・直感力" },
  { name: "禄存星", reading: "ろくぞんせい", element: "土陽", keyword: "魅力・財", personality: "人を惹きつける魅力があり、経済的な才能に恵まれる。世話好きで情が深い", strength: "人間的魅力・経済力・奉仕精神" },
  { name: "司禄星", reading: "しろくせい", element: "土陰", keyword: "蓄積・堅実", personality: "コツコツと積み重ねる力が強い。堅実で、家庭や組織を安定させる力がある", strength: "堅実さ・蓄財力・安定感" },
  { name: "車騎星", reading: "しゃきせい", element: "金陽", keyword: "行動・闘争", personality: "行動力と闘争心に溢れる。目標に向かって突き進む力が強く、スポーツマンタイプ", strength: "行動力・闘争心・スピード" },
  { name: "牽牛星", reading: "けんぎゅうせい", element: "金陰", keyword: "名誉・責任", personality: "名誉を重んじ、責任感が強い。品格があり、エリートタイプ", strength: "責任感・品格・組織力" },
  { name: "龍高星", reading: "りゅうこうせい", element: "水陽", keyword: "知恵・放浪", personality: "知的好奇心旺盛で、自由を愛する。旅や冒険が好きで、型にはまらない", strength: "知識欲・冒険心・改革力" },
  { name: "玉堂星", reading: "ぎょくどうせい", element: "水陰", keyword: "学問・母性", personality: "学ぶことが好きで、知識を人に伝える力がある。母性的な温かさを持つ", strength: "学問・教育力・母性" },
] as const;

type MainStar = (typeof MAIN_STARS)[number];

// --- 十二大従星 ---

const SUB_STARS = [
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

// --- 天中殺 ---

const TENCHU_GROUPS = [
  { name: "子丑天中殺", branches: ["子", "丑"], meaning: "初代運。親の力に頼らず、自力で人生を切り開く。北方の気が欠ける", theme: "自立して新しい道を切り開く力を持つ。家系を超えた生き方が吉" },
  { name: "寅卯天中殺", branches: ["寅", "卯"], meaning: "東方の気が欠ける。社会の枠組みの中で生きることに違和感を感じやすい", theme: "組織より個人で力を発揮。創造性と自由な発想が武器になる" },
  { name: "辰巳天中殺", branches: ["辰", "巳"], meaning: "家庭運に変化が出やすい。精神世界に強い関心を持つ傾向", theme: "精神的な成長を重視する生き方が吉。物質より心の豊かさを追求" },
  { name: "午未天中殺", branches: ["午", "未"], meaning: "末代運。家系や血縁のしがらみから自由になれる星", theme: "自分の力で道を切り開く。晩年に向けて運気が上昇する" },
  { name: "申酉天中殺", branches: ["申", "酉"], meaning: "西方の気が欠ける。結果やお金に執着しすぎると運が落ちる", theme: "過程を楽しむ生き方が吉。人のために動くと運が開ける" },
  { name: "戌亥天中殺", branches: ["戌", "亥"], meaning: "精神世界が強いが、現実と理想のギャップに苦しむことも", theme: "理想を追い求めつつ、足元も固める。バランスが鍵" },
] as const;

/**
 * 日干支から主星を算出（簡易版）
 * 日干の五行と陰陽から主星を決定
 */
function getMainStar(dayStem: string): MainStar {
  const stemIdx = HEAVENLY_STEMS.findIndex((s) => s.name === dayStem);
  return MAIN_STARS[stemIdx];
}

/**
 * 人体星図の中央星（自分の本質）は日干から
 * 北（頭）= 月干の通変星に対応する主星
 * 南（腹）= 年干の通変星に対応する主星
 * 東（左）= 月支の蔵干に対応する主星
 * 西（右）= 日支の蔵干に対応する主星
 *
 * 簡易版として日干・年干・月干から3つの主星を算出
 */
function calcBodyChart(
  dayStemIdx: number,
  yearStemIdx: number,
  monthStemIdx: number
): {
  center: MainStar;
  north: MainStar;
  south: MainStar;
} {
  // 中央 = 日干そのまま
  const center = MAIN_STARS[dayStemIdx];

  // 北 = 月干との関係から
  const northDiff = ((monthStemIdx - dayStemIdx) % 10 + 10) % 10;
  const north = MAIN_STARS[northDiff];

  // 南 = 年干との関係から
  const southDiff = ((yearStemIdx - dayStemIdx) % 10 + 10) % 10;
  const south = MAIN_STARS[southDiff];

  return { center, north, south };
}

/**
 * 天中殺の判定
 * 日柱の干支番号から算出
 */
function calcTenchu(dayPillar: StemBranch): (typeof TENCHU_GROUPS)[number] {
  const branchIdx = EARTHLY_BRANCHES.findIndex(
    (b) => b.name === dayPillar.branch.name
  );
  const stemIdx = HEAVENLY_STEMS.findIndex(
    (s) => s.name === dayPillar.stem.name
  );

  // 干支の組み合わせ番号
  const kanshiNum = (stemIdx * 6 + Math.floor(branchIdx / 2)) % 6;

  // 天中殺グループの判定（干支番号 % 6 で振り分け）
  // 干と支の差から天中殺を判定する簡易版
  const diff = ((branchIdx - stemIdx) % 12 + 12) % 12;
  const groupIdx = Math.floor(diff / 2) % 6;

  return TENCHU_GROUPS[groupIdx];
}

/**
 * 従星の算出（簡易版）
 * 日干支の干支番号から3つの従星を割り当て
 */
function calcSubStars(
  dayPillar: StemBranch,
  monthPillar: StemBranch,
  yearPillar: StemBranch
): {
  head: (typeof SUB_STARS)[number];
  chest: (typeof SUB_STARS)[number];
  belly: (typeof SUB_STARS)[number];
} {
  const dayBranchIdx = EARTHLY_BRANCHES.findIndex(
    (b) => b.name === dayPillar.branch.name
  );
  const monthBranchIdx = EARTHLY_BRANCHES.findIndex(
    (b) => b.name === monthPillar.branch.name
  );
  const yearBranchIdx = EARTHLY_BRANCHES.findIndex(
    (b) => b.name === yearPillar.branch.name
  );

  return {
    head: SUB_STARS[monthBranchIdx % 12],
    chest: SUB_STARS[dayBranchIdx % 12],
    belly: SUB_STARS[yearBranchIdx % 12],
  };
}

// --- メインの計算関数 ---

export interface SanmeigakuResult {
  mainStar: MainStar;
  bodyChart: {
    center: MainStar;
    north: MainStar;
    south: MainStar;
  };
  subStars: {
    head: (typeof SUB_STARS)[number];
    chest: (typeof SUB_STARS)[number];
    belly: (typeof SUB_STARS)[number];
  };
  totalEnergy: number;
  tenchu: (typeof TENCHU_GROUPS)[number];
  dayPillar: StemBranch;
}

export function calcSanmeigaku(birthDate: string): SanmeigakuResult {
  const [y, m, d] = birthDate.split("-").map(Number);

  const dayPillar = calcDayPillar(y, m, d);
  const monthPillar = calcMonthPillar(y, m, d);
  const yearPillar = calcYearPillar(y, m, d);

  const dayStemIdx = HEAVENLY_STEMS.findIndex(
    (s) => s.name === dayPillar.stem.name
  );
  const yearStemIdx = HEAVENLY_STEMS.findIndex(
    (s) => s.name === yearPillar.stem.name
  );
  const monthStemIdx = HEAVENLY_STEMS.findIndex(
    (s) => s.name === monthPillar.stem.name
  );

  const mainStar = getMainStar(dayPillar.stem.name);
  const bodyChart = calcBodyChart(dayStemIdx, yearStemIdx, monthStemIdx);
  const subStars = calcSubStars(dayPillar, monthPillar, yearPillar);
  const totalEnergy = subStars.head.energy + subStars.chest.energy + subStars.belly.energy;
  const tenchu = calcTenchu(dayPillar);

  return {
    mainStar,
    bodyChart,
    subStars,
    totalEnergy,
    tenchu,
    dayPillar,
  };
}
