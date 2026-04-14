/**
 * マヤ暦（Tzolkin）計算エンジン
 *
 * 生年月日からKIN番号、太陽の紋章、ウェイブスペル、銀河の音を算出する。
 * ツォルキン暦は260日周期（13の音 × 20の紋章）。
 */

/** 基準日: 2001年1月1日 = KIN 57 */
const REFERENCE_DATE = new Date(2001, 0, 1);
const REFERENCE_KIN = 57;

/** グレゴリオ暦の日付からKIN番号(1-260)を計算 */
export function calcKinNumber(birthDate: string): number {
  const date = new Date(birthDate + "T00:00:00");
  const diffMs = date.getTime() - REFERENCE_DATE.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  let kin = ((REFERENCE_KIN - 1 + diffDays) % 260) + 1;
  if (kin <= 0) kin += 260;
  return kin;
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
