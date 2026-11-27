/**
 * 西洋占星術（Western Astrology）計算エンジン
 *
 * 生年月日・時刻・出生地から、各天体の黄経を天文学的に計算し、
 * 星座（サイン）・エレメント・区分・アセンダントなどを算出する。
 *
 * 天体位置は Paul Schlyter の低精度軌道計算式に基づく。
 * 太陽・月・惑星の黄経を数分角〜1度程度の精度で求められ、
 * 星座の判定には十分な精度を持つ。
 *
 * 出生時刻は日本標準時（JST, UTC+9）として扱う。
 */

// ===== 角度ユーティリティ（度単位） =====
const RAD = Math.PI / 180;
const sind = (d: number) => Math.sin(d * RAD);
const cosd = (d: number) => Math.cos(d * RAD);
const tand = (d: number) => Math.tan(d * RAD);
const atan2d = (y: number, x: number) => Math.atan2(y, x) / RAD;
const asind = (x: number) => Math.asin(Math.max(-1, Math.min(1, x))) / RAD;
const acosd = (x: number) => Math.acos(Math.max(-1, Math.min(1, x))) / RAD;
/** 0〜360 に正規化 */
const rev = (x: number) => ((x % 360) + 360) % 360;

/**
 * Schlyter の day number を返す。
 * d = (ユリウス日 - 2451543.5)。基準は 1999-12-31 00:00 UT。
 * UTh は世界時の時刻（時, 小数・負値可）。
 */
function dayNumber(y: number, m: number, d: number, utHours: number): number {
  const dn =
    367 * y -
    Math.floor((7 * (y + Math.floor((m + 9) / 12))) / 4) +
    Math.floor((275 * m) / 9) +
    d -
    730530;
  return dn + utHours / 24;
}

/** 黄道傾斜角 */
function obliquity(d: number): number {
  return 23.4393 - 3.563e-7 * d;
}

interface BodyPos {
  lon: number; // 黄経 0-360
  r: number; // 距離（天文単位 / 太陽は地球-太陽距離）
}

/** 太陽の黄経と距離・平均黄経などを計算 */
function calcSun(d: number): BodyPos & { M: number; w: number; L: number } {
  const w = 282.9404 + 4.70935e-5 * d;
  const e = 0.016709 - 1.151e-9 * d;
  const M = rev(356.047 + 0.9856002585 * d);
  const E = M + e * (180 / Math.PI) * sind(M) * (1 + e * cosd(M));
  const xv = cosd(E) - e;
  const yv = Math.sqrt(1 - e * e) * sind(E);
  const v = atan2d(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  return { lon: rev(v + w), r, M, w, L: rev(M + w) };
}

/** 月の黄経（主要摂動項を含む） */
function calcMoon(d: number, sun: { M: number; w: number; L: number }): number {
  const N = 125.1228 - 0.0529538083 * d;
  const i = 5.1454;
  const w = 318.0634 + 0.1643573223 * d;
  const a = 60.2666;
  const e = 0.0549;
  const M = rev(115.3654 + 13.0649929509 * d);
  let E = M + e * (180 / Math.PI) * sind(M) * (1 + e * cosd(M));
  for (let k = 0; k < 3; k++) {
    E = E - (E - e * (180 / Math.PI) * sind(E) - M) / (1 - e * cosd(E));
  }
  const xv = a * (cosd(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * sind(E);
  const v = atan2d(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const xeclip = r * (cosd(N) * cosd(v + w) - sind(N) * sind(v + w) * cosd(i));
  const yeclip = r * (sind(N) * cosd(v + w) + cosd(N) * sind(v + w) * cosd(i));
  const lon = atan2d(yeclip, xeclip);

  // 摂動
  const Ms = sun.M;
  const Mm = M;
  const Ls = sun.L;
  const Lm = rev(N + w + M);
  const Dm = rev(Lm - Ls); // 平均離角
  const F = rev(Lm - N); // 緯度引数
  const dlon =
    -1.274 * sind(Mm - 2 * Dm) +
    0.658 * sind(2 * Dm) +
    -0.186 * sind(Ms) +
    -0.059 * sind(2 * Mm - 2 * Dm) +
    -0.057 * sind(Mm - 2 * Dm + Ms) +
    0.053 * sind(Mm + 2 * Dm) +
    0.046 * sind(2 * Dm - Ms) +
    0.041 * sind(Mm - Ms) +
    -0.035 * sind(Dm) +
    -0.031 * sind(Mm + Ms) +
    -0.015 * sind(2 * F - 2 * Dm) +
    0.011 * sind(Mm - 4 * Dm);
  return rev(lon + dlon);
}

// 惑星の軌道要素 [定数, 日毎変化]
const PLANET_ELEMENTS: Record<
  string,
  { N: [number, number]; i: [number, number]; w: [number, number]; a: number; e: [number, number]; M: [number, number] }
> = {
  mercury: { N: [48.3313, 3.24587e-5], i: [7.0047, 5.0e-8], w: [29.1241, 1.01444e-5], a: 0.387098, e: [0.205635, 5.59e-10], M: [168.6562, 4.0923344368] },
  venus: { N: [76.6799, 2.4659e-5], i: [3.3946, 2.75e-8], w: [54.891, 1.38374e-5], a: 0.72333, e: [0.006773, -1.302e-9], M: [48.0052, 1.6021302244] },
  mars: { N: [49.5574, 2.11081e-5], i: [1.8497, -1.78e-8], w: [286.5016, 2.92961e-5], a: 1.523688, e: [0.093405, 2.516e-9], M: [18.6021, 0.5240207766] },
  jupiter: { N: [100.4542, 2.76854e-5], i: [1.303, -1.557e-7], w: [273.8777, 1.64505e-5], a: 5.20256, e: [0.048498, 4.469e-9], M: [19.895, 0.0830853001] },
  saturn: { N: [113.6634, 2.3898e-5], i: [2.4886, -1.081e-7], w: [339.3939, 2.97661e-5], a: 9.55475, e: [0.055546, -9.499e-9], M: [316.967, 0.0334442282] },
  uranus: { N: [74.0005, 1.3978e-5], i: [0.7733, 1.9e-8], w: [96.6612, 3.0565e-5], a: 19.18171, e: [0.047318, 7.45e-9], M: [142.5905, 0.011725806] },
  neptune: { N: [131.7806, 3.0173e-5], i: [1.77, -2.55e-7], w: [272.8461, -6.027e-6], a: 30.05826, e: [0.008606, 2.15e-9], M: [260.2471, 0.005995147] },
};

/**
 * 冥王星の地心黄経（Schlyter の特別式。1800〜2050年に有効）。
 * 他の惑星のようなケプラー要素では精度が出ないため専用式を用いる。
 */
function calcPluto(d: number, sun: BodyPos): number {
  const S = rev(50.03 + 0.033459652 * d);
  const P = rev(238.95 + 0.003968789 * d);
  const lonecl =
    238.9508 + 0.00400703 * d -
    19.799 * sind(P) + 19.848 * cosd(P) +
    0.897 * sind(2 * P) - 4.956 * cosd(2 * P) +
    0.61 * sind(3 * P) + 1.211 * cosd(3 * P) -
    0.341 * sind(4 * P) - 0.19 * cosd(4 * P) +
    0.128 * sind(5 * P) - 0.034 * cosd(5 * P) -
    0.038 * sind(6 * P) + 0.031 * cosd(6 * P) +
    0.02 * sind(S - P) - 0.01 * cosd(S - P);
  const latecl =
    -3.9082 -
    5.453 * sind(P) - 14.975 * cosd(P) +
    3.527 * sind(2 * P) + 6.96 * cosd(2 * P) -
    2.981 * sind(3 * P) + 0.657 * cosd(3 * P) +
    2.647 * sind(4 * P) - 0.052 * cosd(4 * P) -
    1.398 * sind(5 * P) - 0.014 * cosd(5 * P) +
    1.095 * sind(6 * P) + 0.009 * cosd(6 * P);
  const r =
    40.72 + 6.68 * sind(P) + 6.9 * cosd(P) -
    1.18 * sind(2 * P) - 0.03 * cosd(2 * P) +
    0.15 * sind(3 * P) - 0.14 * cosd(3 * P);
  const xh = r * cosd(lonecl) * cosd(latecl);
  const yh = r * sind(lonecl) * cosd(latecl);
  const xs = sun.r * cosd(sun.lon);
  const ys = sun.r * sind(sun.lon);
  return rev(atan2d(yh + ys, xh + xs));
}

/** 任意の天体（太陽・月・各惑星）の地心黄経を返す */
function bodyLongitude(key: string, d: number): number {
  const sun = calcSun(d);
  if (key === "sun") return sun.lon;
  if (key === "moon") return calcMoon(d, sun);
  if (key === "pluto") return calcPluto(d, sun);
  return calcPlanet(key, d, sun);
}

/**
 * 天体の運行方向を判定（±5日の窓で安定化）。
 * 動きがごく小さいときは「留（stationary）」とみなす。
 */
function motionState(key: string, d: number): { retrograde: boolean; stationary: boolean } {
  if (key === "sun" || key === "moon") return { retrograde: false, stationary: false };
  const l0 = bodyLongitude(key, d - 5);
  const l1 = bodyLongitude(key, d + 5);
  let diff = l1 - l0;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  // 10日で動く度数。外惑星は「留」付近で非常に小さくなる
  const stationary = Math.abs(diff) < 0.15;
  return { retrograde: diff < 0, stationary };
}

/** 惑星の地心黄経を計算 */
function calcPlanet(key: string, d: number, sun: BodyPos): number {
  const el = PLANET_ELEMENTS[key];
  const N = el.N[0] + el.N[1] * d;
  const i = el.i[0] + el.i[1] * d;
  const w = el.w[0] + el.w[1] * d;
  const a = el.a;
  const e = el.e[0] + el.e[1] * d;
  const M = rev(el.M[0] + el.M[1] * d);
  let E = M + e * (180 / Math.PI) * sind(M) * (1 + e * cosd(M));
  for (let k = 0; k < 5; k++) {
    E = E - (E - e * (180 / Math.PI) * sind(E) - M) / (1 - e * cosd(E));
  }
  const xv = a * (cosd(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * sind(E);
  const v = atan2d(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  // 日心黄道直交座標
  const xh = r * (cosd(N) * cosd(v + w) - sind(N) * sind(v + w) * cosd(i));
  const yh = r * (sind(N) * cosd(v + w) + cosd(N) * sind(v + w) * cosd(i));
  // 太陽（＝地球）の直交座標を加えて地心座標へ
  const xs = sun.r * cosd(sun.lon);
  const ys = sun.r * sind(sun.lon);
  const xg = xh + xs;
  const yg = yh + ys;
  return rev(atan2d(yg, xg));
}

/**
 * アセンダント（上昇宮）とMC（中天）の黄経を計算
 * @param lonDeg 観測地の経度（東経プラス）
 * @param latDeg 観測地の緯度（北緯プラス）
 */
function calcAscMc(
  d: number,
  utHours: number,
  lonDeg: number,
  latDeg: number,
  sun: { L: number }
): { asc: number; mc: number; ramc: number; obl: number } {
  const obl = obliquity(d);
  const gmst0 = rev(sun.L + 180) / 15; // 0h UT の恒星時（時）
  const lst = gmst0 + utHours + lonDeg / 15; // 地方恒星時（時）
  const ramc = rev(lst * 15); // 中天の赤経（度）
  const asc = rev(
    atan2d(cosd(ramc), -(sind(ramc) * cosd(obl) + tand(latDeg) * sind(obl)))
  );
  const mc = rev(atan2d(sind(ramc), cosd(ramc) * cosd(obl)));
  return { asc, mc, ramc, obl };
}

// ===== ハウス方式 =====

export type HouseSystem = "placidus" | "wholesign" | "solar";

export const HOUSE_SYSTEM_LABEL: Record<HouseSystem, string> = {
  placidus: "プラシーダス",
  wholesign: "ホールサイン",
  solar: "ソーラーサイン",
};

/** 赤経（黄道上の点）→黄経 */
function raToEclipticLon(ra: number, obl: number): number {
  return rev(atan2d(sind(ra), cosd(ra) * cosd(obl)));
}

/**
 * プラシーダス・ハウスの12カスプ黄経を計算する。
 * 半昼弧・半夜弧を三分割する標準的な反復法。
 * 指示書のテストデータ（ASC乙女12.9°／MC双子11.0°等）と一致を確認済み。
 * @returns 12要素の配列（index0=第1ハウス 〜 index11=第12ハウス）
 */
function calcPlacidusCusps(ramc: number, latDeg: number, obl: number, asc: number, mc: number): number[] {
  const cusps = new Array<number>(12);
  cusps[0] = asc; // 1H
  cusps[9] = mc; // 10H
  cusps[3] = rev(mc + 180); // 4H
  cusps[6] = rev(asc + 180); // 7H

  // 中間カスプ（11,12,2,3）を反復で求める
  function intermediate(house: 11 | 12 | 2 | 3): number {
    let ra: number;
    const below = house === 2 || house === 3;
    if (house === 11) ra = ramc + 30;
    else if (house === 12) ra = ramc + 60;
    else if (house === 2) ra = ramc + 120;
    else ra = ramc + 150;
    ra = rev(ra);
    for (let i = 0; i < 60; i++) {
      const lon = raToEclipticLon(ra, obl);
      const decl = asind(sind(obl) * sind(lon));
      const sdArg = Math.max(-1, Math.min(1, -tand(latDeg) * tand(decl)));
      const sd = acosd(sdArg); // 半昼弧（度）
      let newRA: number;
      if (!below) {
        newRA = ramc + (house === 11 ? 1 / 3 : 2 / 3) * sd;
      } else {
        // 半夜弧側（ASC→IC）。SN=180-SD
        newRA = house === 2 ? ramc + 60 + (2 / 3) * sd : ramc + 120 + (1 / 3) * sd;
      }
      newRA = rev(newRA);
      if (Math.abs(newRA - ra) < 1e-7) {
        ra = newRA;
        break;
      }
      ra = newRA;
    }
    return raToEclipticLon(ra, obl);
  }

  cusps[10] = intermediate(11); // 11H
  cusps[11] = intermediate(12); // 12H
  cusps[1] = intermediate(2); // 2H
  cusps[2] = intermediate(3); // 3H
  cusps[4] = rev(cusps[10] + 180); // 5H = 11H+180
  cusps[5] = rev(cusps[11] + 180); // 6H = 12H+180
  cusps[7] = rev(cusps[1] + 180); // 8H = 2H+180
  cusps[8] = rev(cusps[2] + 180); // 9H = 3H+180
  return cusps;
}

/** ホールサイン／ソーラーサインのカスプ（refSignIndexの星座の0°を第1ハウス頭とする） */
function signCusps(refSignIndex: number): number[] {
  const cusps = new Array<number>(12);
  for (let i = 0; i < 12; i++) cusps[i] = rev((refSignIndex + i) * 30);
  return cusps;
}

/** 黄経がどのハウスにあるか（1-12）。カスプ配列はindex0=第1ハウス */
function houseOfLongitude(lon: number, cusps: number[]): number {
  const L = rev(lon);
  for (let i = 0; i < 12; i++) {
    const a = cusps[i];
    const b = cusps[(i + 1) % 12];
    const span = rev(b - a);
    const off = rev(L - a);
    if (off < span) return i + 1;
  }
  return 12;
}

// ===== サイン（星座）の定義 =====

export type AstroElement = "火" | "地" | "風" | "水";
export type AstroModality = "活動" | "不動" | "柔軟";

export interface AstroSign {
  index: number; // 0=牡羊 ... 11=魚
  name: string;
  symbol: string;
  element: AstroElement;
  modality: AstroModality;
  ruler: string;
  keyword: string;
  personality: string;
  strength: string;
  dateRange: string;
  /** 天体がこのサインにあるときのエネルギーの出方 */
  expression: string;
}

export const SIGNS: AstroSign[] = [
  {
    index: 0, name: "牡羊座", symbol: "♈", element: "火", modality: "活動", ruler: "火星",
    keyword: "情熱・開拓", dateRange: "3/21〜4/19", expression: "まっすぐで勢いのある形で",
    personality: "純粋でエネルギッシュ。思い立ったらすぐ動く開拓者で、どんな場面でも先陣を切る勇気がある",
    strength: "行動力・決断力・リーダーシップ",
  },
  {
    index: 1, name: "牡牛座", symbol: "♉", element: "地", modality: "不動", ruler: "金星",
    keyword: "安定・五感", dateRange: "4/20〜5/20", expression: "じっくりと安定した形で",
    personality: "おだやかでマイペース。五感が豊かで美しいもの・心地よいものを愛し、一度決めたことを粘り強くやり遂げる",
    strength: "忍耐力・堅実さ・美的センス",
  },
  {
    index: 2, name: "双子座", symbol: "♊", element: "風", modality: "柔軟", ruler: "水星",
    keyword: "知性・好奇心", dateRange: "5/21〜6/21", expression: "軽やかで知的な形で",
    personality: "好奇心旺盛で頭の回転が速い。情報収集とおしゃべりが得意で、場の空気を軽やかにする才能がある",
    strength: "コミュニケーション力・適応力・情報感度",
  },
  {
    index: 3, name: "蟹座", symbol: "♋", element: "水", modality: "活動", ruler: "月",
    keyword: "共感・家庭", dateRange: "6/22〜7/22", expression: "あたたかく情緒的な形で",
    personality: "情に厚く面倒見がよい。身近な人を守り育てる母性を持ち、安心できる居場所をつくる力に長ける",
    strength: "共感力・包容力・育成力",
  },
  {
    index: 4, name: "獅子座", symbol: "♌", element: "火", modality: "不動", ruler: "太陽",
    keyword: "自己表現・創造", dateRange: "7/23〜8/22", expression: "華やかで堂々とした形で",
    personality: "明るく堂々として存在感がある。表現することが大好きで、人を楽しませ惹きつけるカリスマ性を持つ",
    strength: "カリスマ性・創造力・リーダーシップ",
  },
  {
    index: 5, name: "乙女座", symbol: "♍", element: "地", modality: "柔軟", ruler: "水星",
    keyword: "分析・奉仕", dateRange: "8/23〜9/22", expression: "丁寧で実務的な形で",
    personality: "几帳面で気配り上手。細部に気づく観察眼と実務能力があり、人の役に立つことに喜びを感じる",
    strength: "分析力・緻密さ・実務能力",
  },
  {
    index: 6, name: "天秤座", symbol: "♎", element: "風", modality: "活動", ruler: "金星",
    keyword: "調和・美", dateRange: "9/23〜10/23", expression: "バランスよく洗練された形で",
    personality: "洗練されたセンスと公平さを持つ。人と人をつなぎ、場を調和させる社交の達人で、美意識が高い",
    strength: "バランス感覚・社交性・美的センス",
  },
  {
    index: 7, name: "蠍座", symbol: "♏", element: "水", modality: "不動", ruler: "冥王星（火星）",
    keyword: "探究・情熱", dateRange: "10/24〜11/22", expression: "深く情熱的な形で",
    personality: "内に秘めた情熱と強い意志を持つ。物事を深く探究し、一度信じた人・ことにはとことん向き合う",
    strength: "集中力・洞察力・再生力",
  },
  {
    index: 8, name: "射手座", symbol: "♐", element: "火", modality: "柔軟", ruler: "木星",
    keyword: "自由・探求", dateRange: "11/23〜12/21", expression: "自由で前向きな形で",
    personality: "自由と冒険を愛する楽天家。高い理想を掲げ、未知の世界へ飛び込む行動力と視野の広さを持つ",
    strength: "行動力・楽観性・向上心",
  },
  {
    index: 9, name: "山羊座", symbol: "♑", element: "地", modality: "活動", ruler: "土星",
    keyword: "達成・責任", dateRange: "12/22〜1/19", expression: "着実で責任感のある形で",
    personality: "まじめで忍耐強く、目標に向かって着実に積み上げる。責任感が強く、社会的な信頼を得やすい努力家",
    strength: "責任感・忍耐力・目標達成力",
  },
  {
    index: 10, name: "水瓶座", symbol: "♒", element: "風", modality: "不動", ruler: "天王星（土星）",
    keyword: "独創・自由", dateRange: "1/20〜2/18", expression: "独創的で自由な形で",
    personality: "独自の価値観を持つ自由人。既成概念にとらわれず、公平で先進的な発想で未来を見据える",
    strength: "独創性・客観性・博愛精神",
  },
  {
    index: 11, name: "魚座", symbol: "♓", element: "水", modality: "柔軟", ruler: "海王星（木星）",
    keyword: "感受性・慈愛", dateRange: "2/19〜3/20", expression: "繊細で思いやりのある形で",
    personality: "やさしく感受性が豊か。境界のない慈愛と豊かな想像力を持ち、人の痛みに寄り添える癒しの存在",
    strength: "共感力・想像力・献身性",
  },
];

function signFromLongitude(lon: number): { sign: AstroSign; degree: number } {
  const L = rev(lon);
  const idx = Math.floor(L / 30) % 12;
  return { sign: SIGNS[idx], degree: L % 30 };
}

// ===== 天体（プラネット）の定義 =====

interface PlanetInfo {
  key: string;
  name: string;
  symbol: string;
  role: string; // 役割の説明
  theme: string; // 一語テーマ
}

const PLANET_INFO: PlanetInfo[] = [
  { key: "sun", name: "太陽", symbol: "☉", role: "人生の目的と本質を表す「太陽」", theme: "生き方の軸" },
  { key: "moon", name: "月", symbol: "☽", role: "感情と無意識、安心の源を表す「月」", theme: "素の感情" },
  { key: "mercury", name: "水星", symbol: "☿", role: "知性・言葉・コミュニケーションを司る「水星」", theme: "考え方と伝え方" },
  { key: "venus", name: "金星", symbol: "♀", role: "愛・美・楽しみ・才能を司る「金星」", theme: "愛し方と楽しみ" },
  { key: "mars", name: "火星", symbol: "♂", role: "情熱・行動力・意欲を司る「火星」", theme: "やる気の出し方" },
  { key: "jupiter", name: "木星", symbol: "♃", role: "幸運・成長・発展を司る「木星」", theme: "成長と幸運の鍵" },
  { key: "saturn", name: "土星", symbol: "♄", role: "努力・責任・人生の課題を司る「土星」", theme: "成熟のテーマ" },
];

const PLANET_INFO_MAP: Record<string, PlanetInfo> = Object.fromEntries(
  PLANET_INFO.map((p) => [p.key, p])
);

function interpretPlanetInSign(info: PlanetInfo, sign: AstroSign): string {
  return `${info.role}が、${sign.expression}表れます。「${sign.keyword}」の資質があなたの${info.theme}に彩りを添えるでしょう。`;
}

// ===== 出生地 → 緯度経度 =====
// 都道府県（県庁所在地付近）と主要都市の座標。birthPlace の部分一致で判定する。
const LOCATIONS: { key: string; lat: number; lon: number }[] = [
  { key: "北海道", lat: 43.06, lon: 141.35 }, { key: "札幌", lat: 43.06, lon: 141.35 },
  { key: "青森", lat: 40.82, lon: 140.74 }, { key: "岩手", lat: 39.7, lon: 141.15 }, { key: "盛岡", lat: 39.7, lon: 141.15 },
  { key: "宮城", lat: 38.27, lon: 140.87 }, { key: "仙台", lat: 38.27, lon: 140.87 },
  { key: "秋田", lat: 39.72, lon: 140.1 }, { key: "山形", lat: 38.24, lon: 140.36 },
  { key: "福島", lat: 37.75, lon: 140.47 }, { key: "茨城", lat: 36.34, lon: 140.45 }, { key: "水戸", lat: 36.34, lon: 140.45 },
  { key: "栃木", lat: 36.57, lon: 139.88 }, { key: "宇都宮", lat: 36.57, lon: 139.88 },
  { key: "群馬", lat: 36.39, lon: 139.06 }, { key: "前橋", lat: 36.39, lon: 139.06 },
  { key: "埼玉", lat: 35.86, lon: 139.65 }, { key: "さいたま", lat: 35.86, lon: 139.65 },
  { key: "千葉", lat: 35.6, lon: 140.12 },
  { key: "東京", lat: 35.69, lon: 139.69 }, { key: "神奈川", lat: 35.45, lon: 139.64 }, { key: "横浜", lat: 35.45, lon: 139.64 }, { key: "川崎", lat: 35.53, lon: 139.7 },
  { key: "新潟", lat: 37.9, lon: 139.02 }, { key: "富山", lat: 36.7, lon: 137.21 },
  { key: "石川", lat: 36.59, lon: 136.63 }, { key: "金沢", lat: 36.59, lon: 136.63 },
  { key: "福井", lat: 36.07, lon: 136.22 }, { key: "山梨", lat: 35.66, lon: 138.57 }, { key: "甲府", lat: 35.66, lon: 138.57 },
  { key: "長野", lat: 36.65, lon: 138.18 }, { key: "岐阜", lat: 35.39, lon: 136.72 },
  { key: "静岡", lat: 34.98, lon: 138.38 }, { key: "浜松", lat: 34.71, lon: 137.73 },
  { key: "愛知", lat: 35.18, lon: 136.91 }, { key: "名古屋", lat: 35.18, lon: 136.91 },
  { key: "三重", lat: 34.73, lon: 136.51 }, { key: "津", lat: 34.73, lon: 136.51 },
  { key: "滋賀", lat: 35.0, lon: 135.87 }, { key: "大津", lat: 35.0, lon: 135.87 },
  { key: "京都", lat: 35.02, lon: 135.76 },
  { key: "大阪", lat: 34.69, lon: 135.52 }, { key: "兵庫", lat: 34.69, lon: 135.18 }, { key: "神戸", lat: 34.69, lon: 135.18 },
  { key: "奈良", lat: 34.69, lon: 135.83 }, { key: "和歌山", lat: 34.23, lon: 135.17 },
  { key: "鳥取", lat: 35.5, lon: 134.24 }, { key: "安来", lat: 35.43, lon: 133.25 }, { key: "出雲", lat: 35.37, lon: 132.75 }, { key: "島根", lat: 35.47, lon: 133.05 }, { key: "松江", lat: 35.47, lon: 133.05 },
  { key: "岡山", lat: 34.66, lon: 133.93 }, { key: "広島", lat: 34.4, lon: 132.46 },
  { key: "山口", lat: 34.19, lon: 131.47 }, { key: "徳島", lat: 34.07, lon: 134.56 },
  { key: "香川", lat: 34.34, lon: 134.04 }, { key: "高松", lat: 34.34, lon: 134.04 },
  { key: "愛媛", lat: 33.84, lon: 132.77 }, { key: "松山", lat: 33.84, lon: 132.77 },
  { key: "高知", lat: 33.56, lon: 133.53 },
  { key: "福岡", lat: 33.61, lon: 130.42 }, { key: "北九州", lat: 33.88, lon: 130.88 },
  { key: "佐賀", lat: 33.25, lon: 130.3 }, { key: "長崎", lat: 32.74, lon: 129.87 },
  { key: "熊本", lat: 32.79, lon: 130.74 }, { key: "大分", lat: 33.24, lon: 131.61 },
  { key: "宮崎", lat: 31.91, lon: 131.42 }, { key: "鹿児島", lat: 31.56, lon: 130.56 },
  { key: "沖縄", lat: 26.21, lon: 127.68 }, { key: "那覇", lat: 26.21, lon: 127.68 },
];

const DEFAULT_LOCATION = { lat: 35.69, lon: 139.69 }; // 東京

function resolveLocation(
  birthPlace?: string
): { lat: number; lon: number; matched: boolean } {
  if (birthPlace) {
    const found = LOCATIONS.find((l) => birthPlace.includes(l.key));
    if (found) return { lat: found.lat, lon: found.lon, matched: true };
  }
  return { ...DEFAULT_LOCATION, matched: false };
}

// ===== エレメント・区分の解説 =====

const ELEMENT_DESC: Record<AstroElement, string> = {
  火: "情熱・直感・行動のエネルギーが豊か。やる気と勢いで道を切り開く、エネルギッシュなタイプです",
  地: "現実的で堅実。五感と実務を大切にし、地に足をつけて物事を着実に形にしていく力があります",
  風: "知的で社交的。情報・言葉・人とのつながりを通じて輝く、軽やかでフットワークの良いタイプです",
  水: "感受性と共感力が豊か。感情・直感・深い結びつきを大切にする、情緒ゆたかなタイプです",
};

const MODALITY_DESC: Record<AstroModality, string> = {
  活動: "物事を始める力・リードする力に優れています",
  不動: "一度決めたことを続ける力・安定させる力に優れています",
  柔軟: "変化に対応する力・調整する力に優れています",
};

/** ドラゴンヘッド（北交点）が各サインにあるとき＝今世で育てていく方向（サインindex順） */
const NODE_NORTH_GROWTH: string[] = [
  "人に合わせすぎず、自分の意志で一歩を踏み出す勇気と自立を育てていく方向",
  "焦りを手放し、自分のペースで地に足をつけ、安定と豊かさを築いていく方向",
  "身近な対話・学び・好奇心を通じて、軽やかに知識とつながりを広げていく方向",
  "心を開いて感情を大切にし、安心できる絆と居場所を育てていく方向",
  "人目を気にせず自分を表現し、創造する喜びと自信を育てていく方向",
  "理想を日々の実務へ落とし込み、丁寧に人の役に立つ力を磨いていく方向",
  "一人で抱えず、人と協力し、調和とパートナーシップを育てていく方向",
  "表面的な安定を手放し、深い絆と本質的な変容へ飛び込んでいく方向",
  "細部にとらわれず、大きな視野と信念を持って未知を探求していく方向",
  "感情に流されず、責任を引き受け、社会で確かな実績を築いていく方向",
  "個人的な承認を超えて、仲間や社会の理想・未来に貢献していく方向",
  "理屈を手放し、直感・慈愛・目に見えない世界への信頼を育てていく方向",
];

/** ドラゴンテイル（南交点）が各サインにあるとき＝生まれ持った得意・慣れた性質（出しすぎ注意）（サインindex順） */
const NODE_SOUTH_INNATE: string[] = [
  "自分の力で突き進む行動力と独立心（ただし独断・せっかちに偏りやすい）",
  "安定を守る粘り強さと堅実さ（ただし変化を避け、現状維持に偏りやすい）",
  "情報収集の速さと器用さ（ただし浅く広く・優柔不断に偏りやすい）",
  "身近な人を守る情の深さ（ただし甘えや感情的な依存に偏りやすい）",
  "存在感と表現力・華やかさ（ただし自己中心・承認欲求に偏りやすい）",
  "分析力ときめ細やかな気配り（ただし完璧主義・心配性に偏りやすい）",
  "協調性と社交のうまさ（ただし他人軸・優柔不断に偏りやすい）",
  "深く関わる情熱と洞察力（ただし執着・抱え込みに偏りやすい）",
  "自由な発想と楽観性（ただし無責任・飽きっぽさに偏りやすい）",
  "責任感と目標達成力（ただし抱え込み・地位へのこだわりに偏りやすい）",
  "客観性と独自の視点（ただし距離をとりすぎ・孤立に偏りやすい）",
  "豊かな共感力と受容力（ただし現実逃避・流されやすさに偏りやすい）",
];

// ===== 公開型 =====

export interface AstroPlanetResult {
  key: string;
  name: string;
  symbol: string;
  sign: AstroSign;
  degree: number; // サイン内の度数 0-30
  longitude: number; // 黄経 0-360
  retrograde: boolean;
  interpretation: string;
  house?: number; // 1-12（ハウス計算後に付与）
}

export interface AstroHouseBody {
  key: string;
  name: string;
  symbol: string;
  signName: string;
  degree: number; // サイン内度数
  retrograde: boolean;
}

export interface AstroHouseInfo {
  house: number; // 1-12
  label: string; // 人生領域ラベル
  hitokoto: string; // 一言
  theme: string;
  cuspSignName: string; // カスプ（ハウスの入口）のサイン
  cuspDegree: number; // カスプのサイン内度数
  bodies: AstroHouseBody[]; // このハウスにある天体
}

export interface ChartHighlight {
  kind: "stellium" | "firstHouse" | "conjunction" | "angle";
  title: string; // 配置の事実
  body: string; // 5部構成の解説
}

export interface AstroHouseConcentration {
  mode: HouseSystem;
  note: string;
  houses: AstroHouseInfo[]; // 12ハウス（天体のないハウスも含む）
  topHouses: number[]; // 最も星が集中しているハウス番号（同数なら複数）
  topCount: number; // その集中数
  isStellium: boolean; // 3つ以上の集中（ステリウム）
  emptyHouses: number[]; // 天体のないハウス
  summary: string; // 解説文
}

/** ハウス解析・ハイライト計算に使う天体データ */
interface NatalBody {
  key: string;
  name: string;
  symbol: string;
  longitude: number;
  sign: AstroSign;
  degree: number;
  retrograde: boolean;
}

export interface AstroPoint {
  sign: AstroSign;
  degree: number;
  longitude: number;
}

export interface AstroNodePoint {
  sign: AstroSign;
  degree: number;
  longitude: number;
  house?: number;
}

export interface NodeReading {
  northSign: string; // ドラゴンヘッドのサイン
  southSign: string; // ドラゴンテイルのサイン
  /** 今世で向かっていく成長の方向（ドラゴンヘッドのサインより） */
  growth: string;
  /** 生まれ持った得意・慣れ親しんだ性質（ドラゴンテイルのサインより） */
  innate: string;
  /** ドラゴンヘッドが入るハウス（人生領域）での成長の舞台 */
  houseDirection: string | null;
  summary: string;
}

export interface AstrologyResult {
  sun: AstroPlanetResult;
  moon: AstroPlanetResult;
  ascendant: AstroPoint | null;
  mc: AstroPoint | null;
  /** 水星・金星・火星・木星・土星 */
  planets: AstroPlanetResult[];
  elementBalance: Record<AstroElement, number>;
  modalityBalance: Record<AstroModality, number>;
  dominantElement: { element: AstroElement; description: string };
  dominantModality: { modality: AstroModality; description: string };
  /** 使用したハウス方式 */
  houseSystem: HouseSystem;
  houseSystemLabel: string;
  houseSystemNote: string;
  /** 12ハウスのカスプ黄経（index0=第1ハウス）。方式に関わらず提供 */
  cuspLongitudes: number[];
  /** ハウス（人生の領域）分析：どのハウスに星が集中しているか */
  houseConcentration: AstroHouseConcentration;
  /** 強調すべき配置（集中ポイント）。最大3つ */
  highlights: ChartHighlight[];
  /** ドラゴンヘッド（北交点）＝今世で向かう成長の方向 */
  northNode: AstroNodePoint;
  /** ドラゴンテイル（南交点）＝生まれ持った性質・手放すテーマ */
  southNode: AstroNodePoint;
  nodeReading: NodeReading;
  birthTimeKnown: boolean;
  /** アセンダント計算に用いた出生地の注記（デフォルト値を使った場合のみ） */
  locationNote: string | null;
}

/** 12ハウスを組み立て、各ハウスに天体を配置する（カスプ方式） */
function buildHouses(bodies: NatalBody[], cusps: number[]): AstroHouseInfo[] {
  const houses: AstroHouseInfo[] = HOUSE_AREA.map((h, i) => {
    const c = signFromLongitude(cusps[i]);
    return {
      house: i + 1,
      label: h.label,
      hitokoto: h.hitokoto,
      theme: h.theme,
      cuspSignName: c.sign.name,
      cuspDegree: c.degree,
      bodies: [],
    };
  });
  for (const b of bodies) {
    const hn = houseOfLongitude(b.longitude, cusps);
    houses[hn - 1].bodies.push({
      key: b.key,
      name: b.name,
      symbol: b.symbol,
      signName: b.sign.name,
      degree: b.degree,
      retrograde: b.retrograde,
    });
  }
  return houses;
}

function buildHouseConcentration(
  houses: AstroHouseInfo[],
  mode: HouseSystem,
  note: string
): AstroHouseConcentration {
  const topCount = Math.max(...houses.map((h) => h.bodies.length));
  const topHouses = houses.filter((h) => h.bodies.length === topCount).map((h) => h.house);
  const emptyHouses = houses.filter((h) => h.bodies.length === 0).map((h) => h.house);
  const isStellium = topCount >= 3;

  const topList = topHouses
    .map((hn) => `第${hn}ハウス（${houses[hn - 1].label}）`)
    .join("・");

  let summary: string;
  if (isStellium && topHouses.length === 1) {
    const h = houses[topHouses[0] - 1];
    const names = h.bodies.map((b) => b.name).join("・");
    summary = `${topList}に${topCount}つの星（${names}）が集中する「ステリウム」です。人生の力の入れどころ・才能の源がこの領域にあり、${h.hitokoto}が、あなたにとって特に大きなテーマになります。`;
  } else if (isStellium) {
    summary = `${topList}にそれぞれ${topCount}つの星が集中しています。これらの領域が、あなたの人生で特にエネルギーの注がれるテーマです。`;
  } else if (topCount === 2) {
    summary = `目立った一極集中はなく、${topList}などに星がゆるやかに集まりつつ、全体にバランスよく広がっています。多方面に関心と才能が広がるタイプです。`;
  } else {
    summary = `星が12のハウスに広く分散しています。人生の様々な領域にまんべんなく関心と経験が広がる、オールラウンドなタイプです。`;
  }

  return { mode, note, houses, topHouses, topCount, isStellium, emptyHouses, summary };
}

/** 天体の組み合わせから、強み・課題の短い表現を作る */
function combinedGift(keys: string[]): string {
  const gifts = keys.map((k) => PLANET_HL[k]?.gift).filter(Boolean);
  return gifts.slice(0, 2).join("と");
}
function combinedIssue(keys: string[]): string {
  const issues = keys.map((k) => PLANET_HL[k]?.issue).filter(Boolean);
  return issues[0] || "力の入れすぎ";
}

/**
 * 強調すべき配置（集中ポイント）を検出する。
 * 1. ステリウム（同ハウスに3天体以上）
 * 2. 1ハウスの天体
 * 3. 重なり（合・同ハウスで8°以内）
 * 4. アングル（ASC/MC/DSC/IC）から5°以内
 * 優先順にならべ、最大3つを返す。
 */
function buildHighlights(
  bodies: NatalBody[],
  houses: AstroHouseInfo[],
  angles: { name: string; lon: number }[]
): ChartHighlight[] {
  const result: ChartHighlight[] = [];
  const bodyHouse = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    for (const b of houses[i].bodies) bodyHouse.set(b.key, i + 1);
  }

  // 1. ステリウム
  for (const h of houses) {
    if (h.bodies.length >= 3) {
      const keys = h.bodies.map((b) => b.key);
      result.push({
        kind: "stellium",
        title: `${h.house}ハウスに${h.bodies.length}つの星が集中`,
        body:
          `${h.house}ハウス（${h.hitokoto}）に、${h.bodies.map((b) => b.name).join("・")}の${h.bodies.length}つが集まっています。` +
          `人生のエネルギーが自然とこの分野に注がれ、${combinedGift(keys)}が強みになりやすい配置です。` +
          `一方で${combinedIssue(keys)}も出やすいので、${HOUSE_HINT[h.house - 1]}。`,
      });
    }
  }

  // 2. 1ハウスの天体
  const firstHouseBodies = houses[0].bodies;
  if (firstHouseBodies.length > 0 && firstHouseBodies.length < 3) {
    const keys = firstHouseBodies.map((b) => b.key);
    result.push({
      kind: "firstHouse",
      title: `あなたの“看板”に${firstHouseBodies.map((b) => b.name).join("・")}`,
      body:
        `1ハウス（自分自身・看板）は、どう見られ、どう立つかの場所です。${firstHouseBodies.map((b) => PLANET_HL[b.key]?.work).filter(Boolean).join("・")}が、あなたの第一印象やあり方そのものに表れます。` +
        `${combinedGift(keys)}が自然な魅力になり、${combinedIssue(keys)}には少し気をつけると、看板がもっと輝きます。`,
    });
  }

  // 3. 重なり（合）
  for (const h of houses) {
    if (h.bodies.length < 2) continue;
    for (let i = 0; i < h.bodies.length; i++) {
      for (let j = i + 1; j < h.bodies.length; j++) {
        const a = h.bodies[i];
        const b = h.bodies[j];
        const la = SIGNS.findIndex((s) => s.name === a.signName) * 30 + a.degree;
        const lb = SIGNS.findIndex((s) => s.name === b.signName) * 30 + b.degree;
        let diff = Math.abs(rev(la) - rev(lb));
        if (diff > 180) diff = 360 - diff;
        if (diff <= 8) {
          result.push({
            kind: "conjunction",
            title: `${a.name}と${b.name}が重なっている`,
            body:
              `${h.label}の場所で、${PLANET_HL[a.key]?.work}と${PLANET_HL[b.key]?.work}が溶け合っています（角度差${diff.toFixed(0)}°）。` +
              `${PLANET_HL[a.key]?.gift}と${PLANET_HL[b.key]?.gift}を同時に発揮できる、またとない組み合わせです。` +
              `ただし${PLANET_HL[a.key]?.issue}には気をつけて、${HOUSE_HINT[h.house - 1]}。`,
          });
        }
      }
    }
  }

  // 4. アングル付近の天体
  for (const b of bodies) {
    for (const ang of angles) {
      let diff = Math.abs(rev(b.longitude) - rev(ang.lon));
      if (diff > 180) diff = 360 - diff;
      if (diff <= 5) {
        result.push({
          kind: "angle",
          title: `${ang.name}の近くに${b.name}`,
          body:
            `人生の節目を示す${ang.name}の近くに${b.name}があります（${diff.toFixed(0)}°）。` +
            `${PLANET_HL[b.key]?.work}が、あなたの生き方の表舞台に強く表れます。` +
            `${PLANET_HL[b.key]?.gift}を活かし、${PLANET_HL[b.key]?.issue}はほどほどに。`,
        });
        break;
      }
    }
  }

  // 優先順（ステリウム→1ハウス→合→アングル）で最大3つ
  const order = { stellium: 0, firstHouse: 1, conjunction: 2, angle: 3 };
  result.sort((a, b) => order[a.kind] - order[b.kind]);
  return result.slice(0, 3);
}

/** 生年月日・時刻からその瞬間の day number（UT換算）を返す */
function birthDayNumber(
  birthDate: string,
  birthTime?: string,
  defaultHourJst = 12
): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  let localHours = defaultHourJst;
  if (birthTime) {
    const [hh, mm] = birthTime.split(":").map(Number);
    if (!isNaN(hh)) localHours = hh + (isNaN(mm) ? 0 : mm) / 60;
  }
  const utHours = localHours - 9; // JST → UT
  return dayNumber(y, m, d, utHours);
}

function buildPlanetResult(key: string, d: number, sun: BodyPos): AstroPlanetResult {
  const info = PLANET_INFO_MAP[key];
  const lon =
    key === "sun" ? sun.lon : calcPlanet(key, d, sun);
  // 逆行判定（翌日との黄経差）
  let retrograde = false;
  if (key !== "sun" && key !== "moon") {
    const sunNext = calcSun(d + 1);
    const lonNext = calcPlanet(key, d + 1, sunNext);
    let diff = lonNext - lon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    retrograde = diff < 0;
  }
  const { sign, degree } = signFromLongitude(lon);
  return {
    key,
    name: info.name,
    symbol: info.symbol,
    sign,
    degree,
    longitude: lon,
    retrograde,
    interpretation: interpretPlanetInSign(info, sign),
  };
}

/** 天体の逆行判定（±1日） */
function natalRetrograde(key: string, d: number): boolean {
  if (key === "sun" || key === "moon") return false;
  const l0 = bodyLongitude(key, d - 1);
  const l1 = bodyLongitude(key, d + 1);
  let diff = l1 - l0;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

export interface AstrologyOptions {
  houseSystem?: HouseSystem;
  lat?: number;
  lng?: number;
}

/**
 * 西洋占星術のネイタル（出生図）を計算する。
 */
export function calcAstrology(
  birthDate: string,
  birthTime?: string,
  birthPlace?: string,
  opts: AstrologyOptions = {}
): AstrologyResult {
  const birthTimeKnown = !!birthTime && /\d/.test(birthTime);
  const d = birthDayNumber(birthDate, birthTime);
  const sun = calcSun(d);

  // 太陽
  const sunResult: AstroPlanetResult = {
    key: "sun",
    name: "太陽",
    symbol: "☉",
    ...(() => {
      const { sign, degree } = signFromLongitude(sun.lon);
      return {
        sign,
        degree,
        longitude: sun.lon,
        retrograde: false,
        interpretation: interpretPlanetInSign(PLANET_INFO_MAP.sun, sign),
      };
    })(),
  };

  // 月
  const moonLon = calcMoon(d, sun);
  const moonSign = signFromLongitude(moonLon);
  const moonResult: AstroPlanetResult = {
    key: "moon",
    name: "月",
    symbol: "☽",
    sign: moonSign.sign,
    degree: moonSign.degree,
    longitude: moonLon,
    retrograde: false,
    interpretation: interpretPlanetInSign(PLANET_INFO_MAP.moon, moonSign.sign),
  };

  // 惑星
  const planets = ["mercury", "venus", "mars", "jupiter", "saturn"].map((k) =>
    buildPlanetResult(k, d, sun)
  );

  // アセンダント・MC
  let ascendant: AstroPoint | null = null;
  let mc: AstroPoint | null = null;
  let locationNote: string | null = null;
  let ramc = 0;
  let oblAtBirth = obliquity(d);
  if (birthTimeKnown) {
    // 緯度経度: プロフィールの明示値を優先、なければ出生地テーブル
    const hasExplicit = typeof opts.lat === "number" && typeof opts.lng === "number";
    const loc = hasExplicit
      ? { lat: opts.lat as number, lon: opts.lng as number, matched: true }
      : resolveLocation(birthPlace);
    const utHours = birthDayNumberToUtHours(birthDate, birthTime);
    const asc_mc = calcAscMc(d, utHours, loc.lon, loc.lat, sun);
    ramc = asc_mc.ramc;
    oblAtBirth = asc_mc.obl;
    const ascSign = signFromLongitude(asc_mc.asc);
    const mcSign = signFromLongitude(asc_mc.mc);
    ascendant = { sign: ascSign.sign, degree: ascSign.degree, longitude: asc_mc.asc };
    mc = { sign: mcSign.sign, degree: mcSign.degree, longitude: asc_mc.mc };
    if (!loc.matched) {
      locationNote = "出生地を特定できなかったため、東京を基準に計算しています。正確なハウス・アセンダントには出生地（または緯度経度）の登録が必要です。";
    }
  }

  // エレメント・区分バランス（太陽・月・水星・金星・火星・木星・土星 ＋ アセンダント）
  const elementBalance: Record<AstroElement, number> = { 火: 0, 地: 0, 風: 0, 水: 0 };
  const modalityBalance: Record<AstroModality, number> = { 活動: 0, 不動: 0, 柔軟: 0 };
  const all = [sunResult, moonResult, ...planets];
  for (const p of all) {
    elementBalance[p.sign.element]++;
    modalityBalance[p.sign.modality]++;
  }
  if (ascendant) {
    elementBalance[ascendant.sign.element]++;
    modalityBalance[ascendant.sign.modality]++;
  }

  const dominantElKey = (Object.keys(elementBalance) as AstroElement[]).reduce(
    (a, b) => (elementBalance[b] > elementBalance[a] ? b : a)
  );
  const dominantModKey = (Object.keys(modalityBalance) as AstroModality[]).reduce(
    (a, b) => (modalityBalance[b] > modalityBalance[a] ? b : a)
  );

  // ハウス方式の決定
  let houseSystem: HouseSystem;
  if (!birthTimeKnown) houseSystem = "solar";
  else houseSystem = opts.houseSystem === "wholesign" ? "wholesign" : "placidus";

  // カスプ（12ハウスの入口）
  let cuspLongitudes: number[];
  if (houseSystem === "placidus" && ascendant && mc) {
    const lat = typeof opts.lat === "number" ? opts.lat : resolveLocation(birthPlace).lat;
    cuspLongitudes = calcPlacidusCusps(ramc, lat, oblAtBirth, ascendant.longitude, mc.longitude);
  } else if (houseSystem === "wholesign" && ascendant) {
    cuspLongitudes = signCusps(ascendant.sign.index);
  } else {
    cuspLongitudes = signCusps(sunResult.sign.index);
  }

  const houseSystemNote =
    houseSystem === "placidus"
      ? "ハウス方式：プラシーダス（出生時刻・出生地から算出）"
      : houseSystem === "wholesign"
      ? "ハウス方式：ホールサイン（アセンダントの星座を1ハウス）"
      : "出生時刻が不明のため、太陽星座を1ハウスとして読んでいます（ソーラーサイン）";

  // ハウス分析用の10天体
  const uranusLon = calcPlanet("uranus", d, sun);
  const neptuneLon = calcPlanet("neptune", d, sun);
  const plutoLon = calcPluto(d, sun);
  const toNatal = (p: AstroPlanetResult): NatalBody => ({
    key: p.key, name: p.name, symbol: p.symbol,
    longitude: p.longitude, sign: p.sign, degree: p.degree, retrograde: p.retrograde,
  });
  const outerNatal = (key: string, lon: number): NatalBody => {
    const s = signFromLongitude(lon);
    return {
      key, name: OUTER_INFO[key].name, symbol: OUTER_INFO[key].symbol,
      longitude: lon, sign: s.sign, degree: s.degree, retrograde: natalRetrograde(key, d),
    };
  };
  const natalBodies: NatalBody[] = [
    toNatal(sunResult), toNatal(moonResult), ...planets.map(toNatal),
    outerNatal("uranus", uranusLon), outerNatal("neptune", neptuneLon), outerNatal("pluto", plutoLon),
  ];

  const houses = buildHouses(natalBodies, cuspLongitudes);
  const houseConcentration = buildHouseConcentration(houses, houseSystem, houseSystemNote);

  // 集中ポイント（ハイライト）
  const angles: { name: string; lon: number }[] = [];
  if (birthTimeKnown && ascendant && mc) {
    angles.push({ name: "アセンダント", lon: ascendant.longitude });
    angles.push({ name: "MC（天頂）", lon: mc.longitude });
    angles.push({ name: "ディセンダント", lon: rev(ascendant.longitude + 180) });
    angles.push({ name: "IC（天底）", lon: rev(mc.longitude + 180) });
  }
  const highlights = buildHighlights(natalBodies, houses, angles);

  // ドラゴンヘッド（月の昇交点＝平均交点）とドラゴンテイル（反対側）
  const nnLon = rev(125.1228 - 0.0529538083 * d);
  const snLon = rev(nnLon + 180);
  const nn = signFromLongitude(nnLon);
  const sn = signFromLongitude(snLon);
  const nnHouse = houseOfLongitude(nnLon, cuspLongitudes);
  const snHouse = houseOfLongitude(snLon, cuspLongitudes);
  const northNode: AstroNodePoint = { sign: nn.sign, degree: nn.degree, longitude: nnLon, house: nnHouse };
  const southNode: AstroNodePoint = { sign: sn.sign, degree: sn.degree, longitude: snLon, house: snHouse };

  // 表示用天体（太陽・月・水星〜土星）にハウス番号を付与
  const assignHouse = (p: AstroPlanetResult): AstroPlanetResult => ({
    ...p,
    house: houseOfLongitude(p.longitude, cuspLongitudes),
  });

  const nnHouseArea = HOUSE_AREA[nnHouse - 1];
  const nodeReading: NodeReading = {
    northSign: nn.sign.name,
    southSign: sn.sign.name,
    growth: NODE_NORTH_GROWTH[nn.sign.index],
    innate: NODE_SOUTH_INNATE[sn.sign.index],
    houseDirection: birthTimeKnown
      ? `その成長は主に「第${nnHouse}ハウス・${nnHouseArea.label}」——${nnHouseArea.hitokoto}の場で経験されていきます。`
      : null,
    summary:
      `あなたのドラゴンテイル（生まれ持った性質）は${sn.sign.name}——${NODE_SOUTH_INNATE[sn.sign.index]}。` +
      `そこを土台にしながら、今世は反対側のドラゴンヘッド＝${nn.sign.name}の方向、すなわち${NODE_NORTH_GROWTH[nn.sign.index]}へと成長していくのが魂のテーマです。`,
  };

  return {
    sun: assignHouse(sunResult),
    moon: assignHouse(moonResult),
    ascendant,
    mc,
    planets: planets.map(assignHouse),
    elementBalance,
    modalityBalance,
    dominantElement: { element: dominantElKey, description: ELEMENT_DESC[dominantElKey] },
    dominantModality: { modality: dominantModKey, description: MODALITY_DESC[dominantModKey] },
    houseSystem,
    houseSystemLabel: HOUSE_SYSTEM_LABEL[houseSystem],
    houseSystemNote,
    cuspLongitudes,
    houseConcentration,
    highlights,
    northNode,
    southNode,
    nodeReading,
    birthTimeKnown,
    locationNote,
  };
}

function birthDayNumberToUtHours(birthDate: string, birthTime?: string): number {
  let localHours = 12;
  if (birthTime) {
    const [hh, mm] = birthTime.split(":").map(Number);
    if (!isNaN(hh)) localHours = hh + (isNaN(mm) ? 0 : mm) / 60;
  }
  return localHours - 9;
}

// ===== グラフ用の運気波 =====

/**
 * 年運エネルギー（グラフ用）
 * トランジットの木星・土星とネイタル太陽の角度から算出。
 * 木星（約12年周期）が主、土星（約29年周期）が副で、滑らかに変動する。
 */
export function getAstrologyYearWave(birthDate: string, year: number): number {
  const natalSun = calcSun(birthDayNumber(birthDate)).lon;
  const dMid = dayNumber(year, 7, 1, 3); // 年の中間（JST正午相当）
  const sunMid = calcSun(dMid);
  const jup = calcPlanet("jupiter", dMid, sunMid);
  const sat = calcPlanet("saturn", dMid, sunMid);

  // 木星: 合で最大・衝で最小（拡大と過剰のリズム）
  const jupScore = 60 + 20 * cosd(rev(jup - natalSun));
  // 土星: 合で課題が増える→低め、衝・トラインで安定→高め
  const satScore = 55 - 12 * cosd(rev(sat - natalSun));

  const score = Math.round(0.6 * jupScore + 0.4 * satScore);
  return Math.max(15, Math.min(95, score));
}

export interface AstrologyYearInfo {
  wave: number;
  jupiterSign: string;
  theme: string;
  advice: string;
}

/** 年運の時期ガイド情報 */
export function getAstrologyYearInfo(birthDate: string, year: number): AstrologyYearInfo {
  const wave = getAstrologyYearWave(birthDate, year);
  const dMid = dayNumber(year, 7, 1, 3);
  const sunMid = calcSun(dMid);
  const jup = calcPlanet("jupiter", dMid, sunMid);
  const jupiterSign = signFromLongitude(jup).sign.name;

  let theme: string;
  let advice: string;
  if (wave >= 70) {
    theme = "拡大・発展のチャンスが巡る時期";
    advice = "新しい挑戦・学び・出会いが実を結びやすいとき。前向きに動くと大きく広がります";
  } else if (wave >= 55) {
    theme = "安定して力を蓄える時期";
    advice = "日々の積み重ねが未来の土台に。マイペースに整えながら進めましょう";
  } else {
    theme = "見直し・成熟の時期";
    advice = "立ち止まって足元を固めるとき。丁寧に整えることが次の飛躍につながります";
  }
  return { wave, jupiterSign, theme, advice };
}

/**
 * 月運エネルギー（グラフ用）
 * トランジット太陽とネイタル太陽の角度から算出。
 * 誕生月（ソーラーリターン）付近で最大になる12ヶ月周期。
 */
export function getAstrologyMonthWave(
  birthDate: string,
  year: number,
  month: number
): number {
  const natalSun = calcSun(birthDayNumber(birthDate)).lon;
  const dMid = dayNumber(year, month, 15, 3);
  const transSun = calcSun(dMid).lon;
  const score = Math.round(55 + 25 * cosd(rev(transSun - natalSun)));
  return Math.max(20, Math.min(95, score));
}

/** その月にトランジット太陽が位置するサイン名（月運表示用） */
export function getAstrologyMonthSign(year: number, month: number): string {
  const dMid = dayNumber(year, month, 15, 3);
  return signFromLongitude(calcSun(dMid).lon).sign.name;
}

// ===== トランジット（運行中の星）から「今のあなた」を読む =====

interface OuterPlanetInfo {
  key: string;
  name: string;
  symbol: string;
}

const OUTER_INFO: Record<string, OuterPlanetInfo> = {
  uranus: { key: "uranus", name: "天王星", symbol: "♅" },
  neptune: { key: "neptune", name: "海王星", symbol: "♆" },
  pluto: { key: "pluto", name: "冥王星", symbol: "♇" },
};

function planetDisplay(key: string): OuterPlanetInfo {
  return (
    OUTER_INFO[key] ||
    (() => {
      const p = PLANET_INFO_MAP[key];
      return { key, name: p.name, symbol: p.symbol };
    })()
  );
}

/** 各トランジット天体の性質・テーマ */
const TRANSIT_NATURE: Record<
  string,
  { nature: string; gift: string; timescale: string; reviewing: string }
> = {
  jupiter: {
    nature: "拡大と幸運の星",
    gift: "この領域に恵みとチャンスを広げ、視野を大きく開いていく",
    timescale: "約1年",
    reviewing: "広げてきたものを一度ととのえ、本当に育てたい方向を見直す",
  },
  saturn: {
    nature: "成熟と責任の星",
    gift: "この領域を時間をかけて築き直し、確かな土台と実力を育てていく",
    timescale: "約2年半",
    reviewing: "積み上げてきたものを点検し、無理のない形へと組み直す",
  },
  uranus: {
    nature: "変革と自由の星",
    gift: "この領域に新しい風を吹き込み、古い枠組みから自由にしていく",
    timescale: "約7年",
    reviewing: "急がず、変化の兆しを静かに見きわめる",
  },
  neptune: {
    nature: "夢と感性の星",
    gift: "この領域の境界をやわらかく溶かし、直感・理想・癒しを深めていく",
    timescale: "約14年",
    reviewing: "理想と現実のあいだを行き来しながら、本当に大切な感覚を確かめる",
  },
  pluto: {
    nature: "変容の星（破壊と再生）",
    gift: "この領域を根底から作り替え、生涯に一度の深い変容をもたらす",
    timescale: "約20年",
    reviewing: "表に見える変化の奥で、新しい力を静かに育てる",
  },
};

/** ハウス（人生領域）。label=領域名, hitokoto=一言, theme=詳しい説明（文章生成用） */
const HOUSE_AREA: { label: string; hitokoto: string; theme: string }[] = [
  { label: "自分自身・看板", hitokoto: "どう見られ、どう立つか", theme: "あなた自身のあり方、心身、人生の第一歩" },
  { label: "自分で稼ぐお金・才能", hitokoto: "自分の力で生む収入と価値観", theme: "収入・才能・自分の価値をどう認めるか" },
  { label: "言葉・発信・学び", hitokoto: "伝える、教える、身近な人", theme: "身近な学び・言葉・発信、兄弟や近所との関わり" },
  { label: "家・家族・根っこ", hitokoto: "帰る場所、心の土台", theme: "住まい・家族・ルーツ、心が安心できる土台" },
  { label: "創造・表現・楽しみ", hitokoto: "生み出す、子ども、恋", theme: "創造・表現・恋・遊び、心から楽しめること" },
  { label: "仕事の実務・健康", hitokoto: "日々の働き方、体調、チーム", theme: "日々の仕事・健康・役割、暮らしを支える習慣" },
  { label: "パートナー・契約", hitokoto: "一対一の関係、契約相手", theme: "パートナーシップ・一対一の関係・契約" },
  { label: "深い絆と変容・共有資源", hitokoto: "託されるお金、継続収益、引き継ぐもの", theme: "深い絆・受け継ぐもの・人から託される資源、変容" },
  { label: "海外・探求・発信", hitokoto: "高い学び、出版、遠くへ広げる", theme: "遠くの世界・学問・探求・発信、視野を広げること" },
  { label: "社会的な立場と使命", hitokoto: "肩書き、仕事の頂点", theme: "社会的な立場・キャリア・使命・人生の到達点" },
  { label: "仲間・コミュニティ・未来", hitokoto: "共同体、同志、理想", theme: "仲間・コミュニティ・理想、これから目指す未来" },
  { label: "内なる世界と癒し", hitokoto: "舞台裏、準備、休息", theme: "内面・無意識・癒し・舞台裏で整える時間" },
];

/** 集中ポイントカードの各天体の短い説明（働き・強み・癖） */
const PLANET_HL: Record<string, { work: string; gift: string; issue: string }> = {
  sun: { work: "人生の軸", gift: "ぶれない存在感", issue: "力みすぎ" },
  moon: { work: "感情と安心", gift: "こまやかな共感力", issue: "気分の波" },
  mercury: { work: "考えと言葉", gift: "伝える・学ぶ力", issue: "考えすぎ" },
  venus: { work: "愛と楽しみ・美", gift: "人を惹きつける魅力", issue: "甘さ・流されやすさ" },
  mars: { work: "情熱と行動", gift: "ものごとを前に進める推進力", issue: "急ぎすぎ・短気" },
  jupiter: { work: "広げる・育てる力", gift: "おおらかさとチャンスを呼ぶ力", issue: "広げすぎ・楽観しすぎ" },
  saturn: { work: "固める・責任の力", gift: "信頼される堅実さ", issue: "抱え込み・自分に厳しすぎ" },
  uranus: { work: "変化と独自性", gift: "ひらめきと自由な発想", issue: "落ち着かなさ" },
  neptune: { work: "夢と感性", gift: "豊かな想像力と共感", issue: "あいまいさ・流されやすさ" },
  pluto: { work: "深さと変容", gift: "ずば抜けた集中力と再生力", issue: "こだわりすぎ・抱え込み" },
};

/** ハウスごとの活かし方ヒント（1行） */
const HOUSE_HINT: string[] = [
  "自分の看板をもっと信じて、前に出てみましょう",
  "「自分の力で生み出せる」感覚を大切に育てていきましょう",
  "伝える・学ぶ場に身を置くと力が花ひらきます",
  "安心できる土台を整えることが、すべての追い風になります",
  "「楽しい」を我慢せず表現に変えていきましょう",
  "日々の整えと体のケアが、大きな成果につながります",
  "信頼できる相手と組むことで、力が何倍にもなります",
  "任せる・預かる形を味方にすると、価値が大きく育ちます",
  "学びや発信で、世界を広げていきましょう",
  "責任を引き受けるほど、社会での居場所が確かになります",
  "同じ理想を持つ仲間とつながることが力になります",
  "ひとりで整える時間が、次の飛躍の準備になります",
];

export interface TransitPlanetReading {
  key: string;
  name: string;
  symbol: string;
  sign: AstroSign;
  degree: number;
  retrograde: boolean;
  stationary: boolean;
  house: number; // 1-12
  houseLabel: string;
  /** この天体がいまネイタルに結ぶ主要アスペクト（あれば） */
  natalAspect: { point: string; aspect: string } | null;
  title: string;
  body: string;
}

export interface TransitHouseFocus {
  byHouse: { house: number; label: string; planets: string[] }[]; // 星の多い順
  topHouses: number[]; // 最も集中しているハウス番号
  topCount: number;
  summary: string;
}

export interface TransitReading {
  /** ハウス方式（出生図と同じ） */
  referenceMode: HouseSystem;
  referenceNote: string;
  /** いまの季節（トランジット太陽のサイン） */
  seasonSign: AstroSign;
  moonPhase: { name: string; emoji: string; illumination: number };
  intro: string;
  transits: TransitPlanetReading[];
  /** いま運行中の星が集中している＝活性化している人生領域 */
  houseFocus: TransitHouseFocus;
  retrogradeSummary: string;
  closing: string;
}

function moonPhaseInfo(elongation: number): { name: string; emoji: string; illumination: number } {
  const e = rev(elongation);
  const illumination = Math.round(((1 - cosd(e)) / 2) * 100);
  const phases: { max: number; name: string; emoji: string }[] = [
    { max: 22.5, name: "新月", emoji: "🌑" },
    { max: 67.5, name: "三日月（上弦前）", emoji: "🌒" },
    { max: 112.5, name: "上弦の月", emoji: "🌓" },
    { max: 157.5, name: "十三夜（満ちゆく月）", emoji: "🌔" },
    { max: 202.5, name: "満月", emoji: "🌕" },
    { max: 247.5, name: "寝待月（欠けゆく月）", emoji: "🌖" },
    { max: 292.5, name: "下弦の月", emoji: "🌗" },
    { max: 337.5, name: "有明月（欠けゆく月）", emoji: "🌘" },
  ];
  const p = phases.find((ph) => e < ph.max) || { name: "新月", emoji: "🌑" };
  return { name: p.name, emoji: p.emoji, illumination };
}

/** トランジット天体がネイタルの主要点に結ぶアスペクトを判定 */
function findNatalAspect(
  transitLon: number,
  natalPoints: { point: string; lon: number }[]
): { point: string; aspect: string } | null {
  const aspects: { angle: number; orb: number; name: string }[] = [
    { angle: 0, orb: 6, name: "重なり（合）" },
    { angle: 60, orb: 4, name: "調和（セクスタイル）" },
    { angle: 90, orb: 5, name: "成長をうながす角度（スクエア）" },
    { angle: 120, orb: 5, name: "追い風の角度（トライン）" },
    { angle: 180, orb: 6, name: "向かい合い（オポジション）" },
  ];
  let best: { point: string; aspect: string; diff: number } | null = null;
  for (const np of natalPoints) {
    let sep = Math.abs(rev(transitLon) - rev(np.lon));
    if (sep > 180) sep = 360 - sep;
    for (const a of aspects) {
      const diff = Math.abs(sep - a.angle);
      if (diff <= a.orb && (!best || diff < best.diff)) {
        best = { point: np.point, aspect: a.name, diff };
      }
    }
  }
  return best ? { point: best.point, aspect: best.aspect } : null;
}

function buildTransitBody(t: {
  info: OuterPlanetInfo;
  nature: { nature: string; gift: string; timescale: string; reviewing: string };
  sign: AstroSign;
  house: { label: string; theme: string };
  retrograde: boolean;
  stationary: boolean;
  natalAspect: { point: string; aspect: string } | null;
}): string {
  const { info, nature, sign, house, retrograde, stationary, natalAspect } = t;
  const parts: string[] = [];

  parts.push(
    `${nature.nature}・${info.name}が、いま${sign.name}を運行しています。あなたにとってこれは「${house.label}」——${house.theme}に光が当たる時期です。`
  );
  parts.push(
    `${info.name}は${nature.timescale}ずつかけてこの領域を巡り、${nature.gift}星。${sign.name}の「${sign.keyword}」の質をまといながら、${sign.expression}そのテーマを進めていきます。`
  );

  if (stationary) {
    parts.push(
      `いま${info.name}は「留（りゅう）」——運行の向きを変える節目にあります。人生のこのテーマがとくに意識に上りやすく、立ち止まって見つめ直すのにふさわしいときです。`
    );
  } else if (retrograde) {
    parts.push(
      `いまは逆行中。外へ広げるより、${nature.reviewing}のに向いた時期です。すでに動き始めていたことを、もう一度ていねいに確かめてみましょう。`
    );
  }

  if (natalAspect) {
    parts.push(
      `そしてこの星は、あなたが生まれ持った${natalAspect.point}と${natalAspect.aspect}を結んでいます。このテーマがいま、あなた個人の人生に直接ひびく、節目の時期に差しかかっているサインです。`
    );
  }

  return parts.join("");
}

/**
 * トランジット（運行中の星）から「今のあなた」を読み解く。
 */
export function calcTransitReading(
  birthDate: string,
  birthTime: string | undefined,
  birthPlace: string | undefined,
  today: Date = new Date(),
  opts: AstrologyOptions = {}
): TransitReading {
  const natal = calcAstrology(birthDate, birthTime, birthPlace, opts);

  // ハウスは出生図と同じ方式（同じカスプ）で判定する
  const cusps = natal.cuspLongitudes;
  const referenceMode: HouseSystem = natal.houseSystem;
  const referenceNote = natal.houseSystemNote;

  // ネイタルの主要点（アスペクト判定用）
  const natalPoints: { point: string; lon: number }[] = [
    { point: "太陽", lon: natal.sun.longitude },
    { point: "月", lon: natal.moon.longitude },
  ];
  if (natal.ascendant) {
    natalPoints.push({ point: "アセンダント", lon: natal.ascendant.longitude });
  }

  // 今日の day number（JST正午相当）
  const dToday = dayNumber(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
    3
  );

  const seasonSign = signFromLongitude(bodyLongitude("sun", dToday)).sign;
  const moonElong = rev(bodyLongitude("moon", dToday) - bodyLongitude("sun", dToday));
  const moonPhase = moonPhaseInfo(moonElong);

  // トランジットの遅い星（木星〜冥王星）
  const slowKeys = ["pluto", "neptune", "uranus", "saturn", "jupiter"];
  const transits: TransitPlanetReading[] = slowKeys.map((key) => {
    const lon = bodyLongitude(key, dToday);
    const { sign, degree } = signFromLongitude(lon);
    const motion = motionState(key, dToday);
    const house = houseOfLongitude(lon, cusps);
    const houseData = HOUSE_AREA[house - 1];
    const info = planetDisplay(key);
    const nature = TRANSIT_NATURE[key];
    const natalAspect = findNatalAspect(lon, natalPoints);
    const body = buildTransitBody({
      info,
      nature,
      sign,
      house: houseData,
      retrograde: motion.retrograde,
      stationary: motion.stationary,
      natalAspect,
    });
    return {
      key,
      name: info.name,
      symbol: info.symbol,
      sign,
      degree,
      retrograde: motion.retrograde,
      stationary: motion.stationary,
      house,
      houseLabel: houseData.label,
      natalAspect,
      title: `${info.symbol} ${info.name} in ${sign.name} ｜ ${houseData.label}`,
      body,
    };
  });

  // いま活性化しているハウス（運行中の星の集中）
  const houseMap = new Map<number, { label: string; planets: string[] }>();
  for (const t of transits) {
    if (!houseMap.has(t.house)) houseMap.set(t.house, { label: t.houseLabel, planets: [] });
    houseMap.get(t.house)!.planets.push(t.name);
  }
  const byHouse = [...houseMap.entries()]
    .map(([house, v]) => ({ house, label: v.label, planets: v.planets }))
    .sort((a, b) => b.planets.length - a.planets.length || a.house - b.house);
  const focusTopCount = byHouse[0]?.planets.length ?? 0;
  const focusTopHouses = byHouse.filter((h) => h.planets.length === focusTopCount).map((h) => h.house);
  let focusSummary: string;
  if (focusTopCount >= 2) {
    const list = focusTopHouses
      .map((hn) => {
        const h = byHouse.find((x) => x.house === hn)!;
        return `第${hn}ハウス（${h.label}）`;
      })
      .join("・");
    focusSummary =
      `いま、運行中の重い星が${list}に重なっています。この領域こそ、今のあなたにとって人生の最前線——大きく動き、育て直されていくテーマです。意識的に向き合うほど、星の後押しを受け取りやすくなります。`;
  } else {
    focusSummary =
      "いま運行中の重い星は、いくつかの人生領域に分かれて働きかけています。一点集中というより、複数のテーマが少しずつ動いていく時期です。";
  }
  const houseFocus: TransitHouseFocus = {
    byHouse,
    topHouses: focusTopHouses,
    topCount: focusTopCount,
    summary: focusSummary,
  };

  // イントロ
  const intro =
    `いまは${seasonSign.name}の季節。空では${moonPhase.emoji} ${moonPhase.name}（輝き約${moonPhase.illumination}%）が巡っています。` +
    `あなたの生まれた瞬間の星（太陽星座：${natal.sun.sign.name}／月星座：${natal.moon.sign.name}` +
    (natal.ascendant ? `／アセンダント：${natal.ascendant.sign.name}` : "") +
    `）を土台に、いま空を運行している星たちが、あなたの人生のどの領域に働きかけているのかを読み解きます。`;

  // 逆行サマリー
  const retroPlanets = transits.filter((t) => t.retrograde && !t.stationary);
  const stationPlanets = transits.filter((t) => t.stationary);
  const retroParts: string[] = [];
  if (stationPlanets.length > 0) {
    retroParts.push(
      `いま${stationPlanets.map((t) => t.name).join("・")}は「留」——運行の向きを変える節目にあり、関わるテーマがとくに動きやすいときです。`
    );
  }
  if (retroPlanets.length > 0) {
    retroParts.push(
      `${retroPlanets.map((t) => t.name).join("・")}は逆行中。外へ進めるより、これまでを振り返り、内側で整えるのに向いた時期です。`
    );
  }
  if (retroParts.length === 0) {
    retroParts.push("いま遅い星はおおむね順行中。テーマは着実に前へと進んでいます。");
  }
  const retrogradeSummary = retroParts.join("");

  // 結び
  const closing =
    "星は「こうなる」と決めつけるものではなく、いまあなたがどんな季節の中にいるのかを映す地図です。" +
    "壊れる音は大きく聞こえ、育つ音はなかなか聞こえません。けれど、揺らぎのその奥では、次のあなたを支える力が静かに育っています。" +
    "焦らず、いまの自分に正直に。この季節の流れを、あなたらしく歩んでいきましょう。";

  return {
    referenceMode,
    referenceNote,
    seasonSign,
    moonPhase,
    intro,
    transits,
    houseFocus,
    retrogradeSummary,
    closing,
  };
}
