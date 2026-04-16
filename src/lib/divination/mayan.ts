/**
 * マヤ暦（Tzolkin）計算エンジン
 *
 * 生年月日からKIN番号、太陽の紋章、ウェイブスペル、銀河の音を算出する。
 * ツォルキン暦は260日周期（13の音 × 20の紋章）。
 */

/**
 * Dreamspell方式のKIN番号計算
 *
 * 基準: 2014年1月1日 = KIN 63
 * 52年 × 365日 = 18980 = 260 × 73 なので、52年周期で同一KINに戻る。
 * うるう年の2月29日は「0の日」として扱い、3月1日と同じKINになる。
 */

/** 各月1日の、1月1日からの日数オフセット（平年ベース） */
const MONTH_OFFSETS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/** 数学的な正の剰余（JSの % は負を返すことがあるため） */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** うるう年判定 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * グレゴリオ暦の日付からKIN番号(1-260)を計算
 *
 * うるう年の扱い: 2月29日は独自のKINを持ち、3月は+1補正する。
 * これにより3月31日と4月1日が同じKINになる（日本のマヤ暦主流派の計算方式）。
 */
export function calcKinNumber(birthDate: string): number {
  const date = new Date(birthDate + "T00:00:00");
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  const yearCycle = mod(year - 2014, 52);
  let dayOffset = MONTH_OFFSETS[month] + day;

  // うるう年の3月: 2月が29日あるためオフセットを+1補正
  if (isLeapYear(year) && month === 2) {
    dayOffset += 1;
  }

  const raw = mod(62 + yearCycle * 365 + dayOffset, 260);
  return raw === 0 ? 260 : raw;
}

/** 銀河の音(1-13): (KIN-1) % 13 + 1 */
export function calcGalacticTone(kin: number): number {
  return ((kin - 1) % 13) + 1;
}

/** 太陽の紋章のインデックス(0-19): (KIN-1) % 20 */
export function calcSolarSealIndex(kin: number): number {
  return (kin - 1) % 20;
}

/** ウェイブスペルの紋章インデックス: KINが属するウェイブスペルの最初のKINの紋章 */
export function calcWaveSpellIndex(kin: number): number {
  const tone = calcGalacticTone(kin);
  const firstKin = kin - tone + 1;
  return calcSolarSealIndex(firstKin > 0 ? firstKin : firstKin + 260);
}

// --- 20の太陽の紋章 ---
const solarSeals = [
  { name: "赤い竜", keyword: "誕生・育む・存在", color: "赤" },
  { name: "白い風", keyword: "伝える・呼吸・精神", color: "白" },
  { name: "青い夜", keyword: "夢見る・豊かさ・直感", color: "青" },
  { name: "黄色い種", keyword: "開花・目覚め・気づき", color: "黄" },
  { name: "赤い蛇", keyword: "本能・情熱・生命力", color: "赤" },
  { name: "白い世界の橋渡し", keyword: "つなぐ・死と再生・機会", color: "白" },
  { name: "青い手", keyword: "癒し・知る・遂行", color: "青" },
  { name: "黄色い星", keyword: "美・芸術・調和", color: "黄" },
  { name: "赤い月", keyword: "浄化・新しい流れ・水", color: "赤" },
  { name: "白い犬", keyword: "忠誠・ハート・愛", color: "白" },
  { name: "青い猿", keyword: "遊び・魔術・幻想", color: "青" },
  { name: "黄色い人", keyword: "自由意志・知恵・影響", color: "黄" },
  { name: "赤い空歩く人", keyword: "探求・空間・目覚め", color: "赤" },
  { name: "白い魔法使い", keyword: "魔法・永遠・受容", color: "白" },
  { name: "青い鷲", keyword: "ビジョン・創造・心眼", color: "青" },
  { name: "黄色い戦士", keyword: "挑戦・知性・大胆さ", color: "黄" },
  { name: "赤い地球", keyword: "シンクロ・舵取り・進化", color: "赤" },
  { name: "白い鏡", keyword: "映し出す・秩序・終わりなき", color: "白" },
  { name: "青い嵐", keyword: "変容・エネルギー・触発", color: "青" },
  { name: "黄色い太陽", keyword: "円満・太陽の力・生命", color: "黄" },
];

// --- 13の銀河の音 ---
const galacticTones = [
  { tone: 1, name: "磁気", keyword: "目的を引きつける", energy: "統合" },
  { tone: 2, name: "月", keyword: "挑戦を安定させる", energy: "極性" },
  { tone: 3, name: "電気", keyword: "奉仕を活性化する", energy: "つながり" },
  { tone: 4, name: "自己存在", keyword: "形を明確にする", energy: "定義" },
  { tone: 5, name: "倍音", keyword: "力を与える", energy: "輝き" },
  { tone: 6, name: "律動", keyword: "組織化する", energy: "平等" },
  { tone: 7, name: "共振", keyword: "調律する", energy: "調和" },
  { tone: 8, name: "銀河", keyword: "調和させる", energy: "誠実" },
  { tone: 9, name: "太陽", keyword: "脈動させる", energy: "意図" },
  { tone: 10, name: "惑星", keyword: "生み出す", energy: "顕現" },
  { tone: 11, name: "スペクトル", keyword: "解き放つ", energy: "解放" },
  { tone: 12, name: "水晶", keyword: "捧げる", energy: "協力" },
  { tone: 13, name: "宇宙", keyword: "超越する", energy: "存在" },
];

export interface MayanResult {
  kinNumber: number;
  solarSeal: { name: string; keyword: string; color: string };
  waveSpell: { name: string; keyword: string; color: string };
  galacticTone: { tone: number; name: string; keyword: string; energy: string };
}

export function calcMayan(birthDate: string): MayanResult {
  const kin = calcKinNumber(birthDate);
  const sealIdx = calcSolarSealIndex(kin);
  const wsIdx = calcWaveSpellIndex(kin);
  const tone = calcGalacticTone(kin);

  return {
    kinNumber: kin,
    solarSeal: solarSeals[sealIdx],
    waveSpell: solarSeals[wsIdx],
    galacticTone: galacticTones[tone - 1],
  };
}

/** 今日のKINから日のエネルギーを取得 */
export function calcTodayMayan(today: Date = new Date()): MayanResult {
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return calcMayan(dateStr);
}

/**
 * 指定年の誕生日のKINを計算（年間エネルギー）
 * マヤ暦は260日周期のため、毎年の誕生日で異なるKIN・紋章・音になる
 */
export function calcYearlyMayan(birthDate: string, year: number): MayanResult {
  const [, m, d] = birthDate.split("-");
  return calcMayan(`${year}-${m}-${d}`);
}

/** グラフ用: 銀河の音をエネルギー値に変換 */
const TONE_ENERGY: Record<number, number> = {
  1: 60,  // 磁気 - 新しい始まり
  2: 40,  // 月 - 挑戦と葛藤
  3: 55,  // 電気 - 奉仕・つながり
  4: 50,  // 自己存在 - 形を定める
  5: 70,  // 倍音 - 力を与える
  6: 65,  // 律動 - 組織化
  7: 75,  // 共振 - 調律・調和
  8: 70,  // 銀河 - 調和させる
  9: 80,  // 太陽 - 意図を脈動
  10: 85, // 惑星 - 顕現
  11: 60, // スペクトル - 解放（手放し）
  12: 75, // 水晶 - 協力
  13: 90, // 宇宙 - 超越
};

/** グラフ用: 指定年の誕生日KINからエネルギー値を返す */
export function getMayanYearWave(birthDate: string, year: number): number {
  const result = calcYearlyMayan(birthDate, year);
  return TONE_ENERGY[result.galacticTone.tone] ?? 50;
}

/** グラフ用: 指定年の誕生日KINの紋章名と音を返す */
export function getMayanYearLabel(birthDate: string, year: number): string {
  const result = calcYearlyMayan(birthDate, year);
  return `KIN${result.kinNumber} ${result.solarSeal.name}・音${result.galacticTone.tone}`;
}
