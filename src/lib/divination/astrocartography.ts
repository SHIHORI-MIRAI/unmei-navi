/**
 * astrocartography.ts — アストロカートグラフィー / リロケーション計算
 *
 * 出生データから世界地図上の天体ライン（MC/IC/AC/DC）を生成し、
 * 世界各都市での「どの天体が強く働くか」を評価して、目的別に
 * ポジティブなランキング・スコア・星評価を提供する。
 */

import {
  computeSky,
  rev,
  rev180,
  type Body,
  type SkyResult,
} from "./astro-core";
import { WORLD_CITIES, type WorldCity } from "./world-cities";

const DEG = Math.PI / 180;
const sind = (d: number) => Math.sin(d * DEG);
const cosd = (d: number) => Math.cos(d * DEG);
const tand = (d: number) => Math.tan(d * DEG);
const acosd = (x: number) => Math.acos(Math.min(1, Math.max(-1, x))) / DEG;

// ===== 天体メタデータ =====

export type AngleType = "MC" | "IC" | "AC" | "DC";

/** 天体の性質トーン（追い風 / 成長・鍛錬 / 刺激・変化） */
export type PlanetTone = "flow" | "growth" | "awaken";

/** トーンごとの表示メタ（ラベル・色） */
export const TONE_META: Record<PlanetTone, { label: string; color: string }> = {
  flow: { label: "追い風の地", color: "#c4942a" },
  growth: { label: "成長・鍛錬の地", color: "#8a6d3b" },
  awaken: { label: "刺激・変化の地", color: "#5b6fb0" },
};

export interface PlanetMeta {
  body: Body;
  symbol: string;
  name: string; // 日本語名
  color: string; // 地図ライン色
  keyword: string; // 一言キーワード
  theme: string; // テーマ説明
  tone: PlanetTone; // 性質トーン
}

export const PLANETS: PlanetMeta[] = [
  { body: "sun", symbol: "☉", name: "太陽", color: "#e8820c", keyword: "自己実現", theme: "活力・主役・社会的な輝き", tone: "flow" },
  { body: "moon", symbol: "☽", name: "月", color: "#8a93c9", keyword: "居場所・家族", theme: "安心・家庭・心の拠り所", tone: "flow" },
  { body: "mercury", symbol: "☿", name: "水星", color: "#3aa3a0", keyword: "学び・発信", theme: "知性・コミュニケーション・情報", tone: "flow" },
  { body: "venus", symbol: "♀", name: "金星", color: "#e06aa3", keyword: "愛・美・人間関係", theme: "愛情・豊かさ・楽しみ", tone: "flow" },
  { body: "mars", symbol: "♂", name: "火星", color: "#d24b3f", keyword: "行動・挑戦", theme: "情熱・勇気・スピード", tone: "growth" },
  { body: "jupiter", symbol: "♃", name: "木星", color: "#c4942a", keyword: "発展・幸運", theme: "拡大・チャンス・海外・教育", tone: "flow" },
  { body: "saturn", symbol: "♄", name: "土星", color: "#6b6256", keyword: "基盤・責任", theme: "努力・継続・長期的成功", tone: "growth" },
  { body: "uranus", symbol: "♅", name: "天王星", color: "#4a9bd1", keyword: "革新・自由", theme: "変化・独立・ひらめき", tone: "awaken" },
  { body: "neptune", symbol: "♆", name: "海王星", color: "#5b8fd6", keyword: "芸術・癒し", theme: "感性・スピリチュアル・夢", tone: "awaken" },
  { body: "pluto", symbol: "♇", name: "冥王星", color: "#9b59b6", keyword: "変容・再生", theme: "深い変化・パワー・転機", tone: "growth" },
];

export const PLANET_META: Record<Body, PlanetMeta> = PLANETS.reduce(
  (acc, p) => {
    acc[p.body] = p;
    return acc;
  },
  {} as Record<Body, PlanetMeta>
);

export const ANGLE_LABEL: Record<AngleType, string> = {
  MC: "MC（天頂）",
  IC: "IC（天底）",
  AC: "AC（上昇）",
  DC: "DC（下降）",
};

/** 角（アングル）ごとの人生領域 */
export const ANGLE_THEME: Record<AngleType, string> = {
  MC: "仕事・社会的成功・人前での活躍",
  IC: "家庭・心の安らぎ・暮らしの土台",
  AC: "自分らしさ・第一印象・新しい挑戦",
  DC: "出会い・パートナーシップ・人間関係",
};

// ===== ライン生成 =====

export interface PlanetLines {
  body: Body;
  /** MC線の地理経度（東経+, -180..180） */
  mcLon: number;
  /** IC線の地理経度 */
  icLon: number;
  /** AC（上昇）線のポリライン: {lat, lon} の配列 */
  acLine: { lat: number; lon: number }[];
  /** DC（下降）線のポリライン */
  dcLine: { lat: number; lon: number }[];
  ra: number;
  dec: number;
}

export interface AstroChart {
  sky: SkyResult;
  lines: PlanetLines[];
}

/**
 * 出生データ（生年月日・時刻・タイムゾーン）から天体ラインを計算する。
 * @param birthDate "YYYY-MM-DD"
 * @param birthTime "HH:MM"（空なら正午12:00を仮定）
 * @param tzOffsetHours 出生地のUTCオフセット（日本=+9）
 */
export function calcAstroChart(
  birthDate: string,
  birthTime: string,
  tzOffsetHours: number
): AstroChart | null {
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return null;

  let hh = 12;
  let mm = 0;
  if (birthTime && /^\d{1,2}:\d{2}$/.test(birthTime)) {
    const [h, mi] = birthTime.split(":").map(Number);
    hh = h;
    mm = mi;
  }
  // 出生地ローカル時刻 → UTC
  const utcMs =
    Date.UTC(y, m - 1, d, hh, mm, 0) - tzOffsetHours * 3600 * 1000;
  const date = new Date(utcMs);

  const sky = computeSky(date);
  const lines: PlanetLines[] = PLANETS.map((p) => {
    const pos = sky.positions[p.body];
    return buildLines(p.body, pos.ra, pos.dec, sky.gmstDeg);
  });

  return { sky, lines };
}

/** AC/DC線の longitude を緯度 lat で直接求める（定義域外は null） */
function risingSettingLon(
  ra: number,
  dec: number,
  gmstDeg: number,
  lat: number
): { ac: number; dc: number } | null {
  const cosH = -tand(lat) * tand(dec);
  if (cosH < -1 || cosH > 1) return null; // その緯度では昇/沈まない（周極）
  const H = acosd(cosH);
  return {
    ac: rev180(ra - H - gmstDeg),
    dc: rev180(ra + H - gmstDeg),
  };
}

function buildLines(
  body: Body,
  ra: number,
  dec: number,
  gmstDeg: number
): PlanetLines {
  const mcLon = rev180(ra - gmstDeg);
  const icLon = rev180(ra - gmstDeg + 180);

  const acLine: { lat: number; lon: number }[] = [];
  const dcLine: { lat: number; lon: number }[] = [];
  for (let lat = -72; lat <= 72; lat += 1.5) {
    const r = risingSettingLon(ra, dec, gmstDeg, lat);
    if (!r) continue;
    acLine.push({ lat, lon: r.ac });
    dcLine.push({ lat, lon: r.dc });
  }

  return { body, mcLon, icLon, acLine, dcLine, ra, dec };
}

// ===== 都市評価 =====

/**
 * 都市とラインの「近さ」は地図上の経度差（度）で測る。
 * アストロカートグラフィーの慣例（オーブはマップ上の横方向で評価）に従い、
 * 大円距離だと高緯度でラインが収束して評価が偏るのを避ける。
 */
function lonGap(cityLon: number, lineLon: number): number {
  return Math.abs(rev180(cityLon - lineLon));
}

/** ライン影響のオーブ（度）。これより遠いと影響なしとみなす */
const ORB = 10;

/**
 * 距離 → 影響度（0..1, 線上=1）。
 * 線形ではなく二次で減衰させ、線の近く（〜2度≒220km）だけを強く出す。
 * Jim Lewis 系の「パワーゾーンは線から1〜2度」という体感に寄せた設計で、
 * これにより都市スコアの団子化（どこも高得点）を防ぐ。
 */
function strengthFromDist(dist: number): number {
  if (dist >= ORB) return 0;
  const t = 1 - dist / ORB;
  return t * t;
}

/** その緯度での経度1度あたりの東西距離（km） */
function kmPerDegLon(lat: number): number {
  return 111.32 * Math.max(0.08, cosd(lat));
}

/** 都市から見た線の方向を判定する */
function sideOf(cityLon: number, lineLon: number): LineSide {
  const d = rev180(cityLon - lineLon);
  if (Math.abs(d) < 0.05) return "on";
  // 都市が線の東側にある → 線は都市の西側にある
  return d > 0 ? "W" : "E";
}

/** 経度差・都市緯度・線経度から距離情報（AngleGeo）を作る */
function makeGeo(
  distDeg: number,
  cityLon: number,
  cityLat: number,
  lineLon: number
): AngleGeo {
  return {
    distDeg,
    distKm: distDeg * kmPerDegLon(cityLat),
    side: sideOf(cityLon, lineLon),
  };
}

const GEO_NONE: AngleGeo = { distDeg: Infinity, distKm: Infinity, side: "on" };

/** 都市から見た線の方向（東/西/ほぼ真上） */
export type LineSide = "E" | "W" | "on";

/** ある都市から、ある天体の1本の線までの地理的な位置関係 */
export interface AngleGeo {
  /** 経度差（度, ≥0） */
  distDeg: number;
  /** 実距離の近似（km, その緯度での東西距離） */
  distKm: number;
  /** 都市から見た線の方向 */
  side: LineSide;
}

/** ある都市での、ある天体の各アングル線への影響度（0..1） */
export interface PlanetCityStrength {
  body: Body;
  /** アングルごとの影響度 */
  byAngle: Record<AngleType, number>;
  /** アングルごとの距離・方向 */
  geoByAngle: Record<AngleType, AngleGeo>;
  /** 最も強いアングルとその値 */
  topAngle: AngleType;
  topStrength: number;
  /** 影響している最寄り線までの距離（度）。なければ Infinity */
  nearestDist: number;
}

function planetStrengthAtCity(
  pl: PlanetLines,
  city: WorldCity,
  gmstDeg: number
): PlanetCityStrength {
  // MC / IC（子午線）: 線経度との経度差
  const mcDist = lonGap(city.lon, pl.mcLon);
  const icDist = lonGap(city.lon, pl.icLon);

  // AC / DC: その緯度での線経度を直接計算
  let acDist = Infinity;
  let dcDist = Infinity;
  const rs = risingSettingLon(pl.ra, pl.dec, gmstDeg, city.lat);
  if (rs) {
    acDist = lonGap(city.lon, rs.ac);
    dcDist = lonGap(city.lon, rs.dc);
  }

  const byAngle: Record<AngleType, number> = {
    MC: strengthFromDist(mcDist),
    IC: strengthFromDist(icDist),
    AC: strengthFromDist(acDist),
    DC: strengthFromDist(dcDist),
  };

  const geoByAngle: Record<AngleType, AngleGeo> = {
    MC: makeGeo(mcDist, city.lon, city.lat, pl.mcLon),
    IC: makeGeo(icDist, city.lon, city.lat, pl.icLon),
    AC: rs ? makeGeo(acDist, city.lon, city.lat, rs.ac) : GEO_NONE,
    DC: rs ? makeGeo(dcDist, city.lon, city.lat, rs.dc) : GEO_NONE,
  };

  let topAngle: AngleType = "MC";
  let topStrength = byAngle.MC;
  (["IC", "AC", "DC"] as AngleType[]).forEach((a) => {
    if (byAngle[a] > topStrength) {
      topStrength = byAngle[a];
      topAngle = a;
    }
  });

  const nearestDist = Math.min(mcDist, icDist, acDist, dcDist);

  return { body: pl.body, byAngle, geoByAngle, topAngle, topStrength, nearestDist };
}

// ===== 目的別の重み =====

export interface Purpose {
  id: string;
  label: string;
  emoji: string;
  description: string;
  /** 天体ごとの重み（0..1） */
  planetWeights: Partial<Record<Body, number>>;
  /** アングルごとの重み（0..1） */
  angleWeights: Record<AngleType, number>;
}

export const PURPOSES: Purpose[] = [
  {
    id: "overall",
    label: "総合",
    emoji: "✦",
    description: "幸運・愛・活力をバランスよく後押しする土地",
    planetWeights: {
      jupiter: 1.0, venus: 0.9, sun: 0.9, moon: 0.7, mercury: 0.5,
      mars: 0.5, saturn: 0.5, uranus: 0.4, neptune: 0.4, pluto: 0.4,
    },
    angleWeights: { MC: 0.9, IC: 0.85, AC: 0.9, DC: 0.85 },
  },
  {
    id: "work",
    label: "仕事・キャリア",
    emoji: "💼",
    description: "社会的な活躍・成功・実力の発揮",
    planetWeights: { saturn: 1.0, sun: 0.9, jupiter: 0.8, mars: 0.7, mercury: 0.4, pluto: 0.4 },
    angleWeights: { MC: 1.0, AC: 0.7, DC: 0.4, IC: 0.3 },
  },
  {
    id: "money",
    label: "お金・豊かさ",
    emoji: "💰",
    description: "金運・拡大・経済的なチャンス",
    planetWeights: { jupiter: 1.0, venus: 0.8, sun: 0.5, pluto: 0.5, saturn: 0.4 },
    angleWeights: { MC: 0.9, IC: 0.6, AC: 0.6, DC: 0.5 },
  },
  {
    id: "family",
    label: "家族・居場所",
    emoji: "🏠",
    description: "安心できる暮らし・家庭・心の拠り所",
    planetWeights: { moon: 1.0, venus: 0.7, jupiter: 0.6, sun: 0.4 },
    angleWeights: { IC: 1.0, DC: 0.7, AC: 0.5, MC: 0.3 },
  },
  {
    id: "love",
    label: "恋愛・人間関係",
    emoji: "💕",
    description: "出会い・愛情・パートナーシップ",
    planetWeights: { venus: 1.0, moon: 0.8, jupiter: 0.6, mars: 0.5, sun: 0.4 },
    angleWeights: { DC: 1.0, AC: 0.7, IC: 0.6, MC: 0.4 },
  },
  {
    id: "express",
    label: "発信・表現",
    emoji: "📣",
    description: "情報発信・コミュニケーション・知名度",
    planetWeights: { mercury: 1.0, jupiter: 0.7, sun: 0.6, uranus: 0.6, venus: 0.4 },
    angleWeights: { MC: 0.9, AC: 0.9, DC: 0.5, IC: 0.3 },
  },
  {
    id: "learn",
    label: "学び・成長",
    emoji: "📚",
    description: "勉強・スキルアップ・視野の拡大",
    planetWeights: { mercury: 1.0, jupiter: 0.8, saturn: 0.5, sun: 0.4, uranus: 0.4 },
    angleWeights: { AC: 0.9, MC: 0.7, IC: 0.5, DC: 0.4 },
  },
  {
    id: "challenge",
    label: "挑戦・冒険",
    emoji: "🔥",
    description: "新しい一歩・行動力・自己変革",
    planetWeights: { mars: 1.0, sun: 0.8, jupiter: 0.7, uranus: 0.7, pluto: 0.5 },
    angleWeights: { AC: 1.0, MC: 0.8, DC: 0.5, IC: 0.3 },
  },
];

export const PURPOSE_MAP: Record<string, Purpose> = PURPOSES.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<string, Purpose>
);

// ===== 都市スコアリング =====

export interface ActiveLine {
  body: Body;
  angle: AngleType;
  strength: number; // 0..1
  /** 線までの実距離の近似（km） */
  distKm: number;
  /** 都市から見た線の方向 */
  side: LineSide;
}

/** オーブ内に線が無い都市でも示す「最寄りの線」 */
export interface NearestLine {
  body: Body;
  angle: AngleType;
  distDeg: number;
  distKm: number;
  side: LineSide;
}

export interface CityScore {
  city: WorldCity;
  /** 天体ごとの最大影響度（0..1） */
  planetStrength: Record<Body, number>;
  /** 天体ごとの星（0..5） */
  planetStars: Record<Body, number>;
  /** 選択中の目的でのスコア（0..100） */
  purposeScore: number;
  /** 目的スコアの星（1..5） */
  purposeStars: number;
  /** オーブ内で効いている線（強い順） */
  activeLines: ActiveLine[];
  /** オーブ外も含めた最寄りの線（無ければ null） */
  nearestLine: NearestLine | null;
  /** 全天体の詳細 */
  details: PlanetCityStrength[];
}

/** 天体影響度 → 星（0..5） */
function strengthToStars(s: number): number {
  if (s >= 0.8) return 5;
  if (s >= 0.6) return 4;
  if (s >= 0.4) return 3;
  if (s >= 0.2) return 2;
  if (s > 0) return 1;
  return 0;
}

/** 目的スコア(0..100) → 星(1..5) */
function scoreToStars(score: number): number {
  if (score >= 90) return 5;
  if (score >= 78) return 4;
  if (score >= 62) return 3;
  if (score >= 45) return 2;
  return 1;
}

/**
 * 1都市のスコアを、指定した目的について算出する。
 */
export function scoreCity(
  chart: AstroChart,
  city: WorldCity,
  purpose: Purpose
): CityScore {
  const details = chart.lines.map((pl) =>
    planetStrengthAtCity(pl, city, chart.sky.gmstDeg)
  );

  const planetStrength = {} as Record<Body, number>;
  const planetStars = {} as Record<Body, number>;
  const activeLines: ActiveLine[] = [];
  let nearestLine: NearestLine | null = null;

  let raw = 0;
  for (const det of details) {
    planetStrength[det.body] = det.topStrength;
    planetStars[det.body] = strengthToStars(det.topStrength);

    // 最寄りの線（オーブ外も含め、全天体・全アングルの最短距離）を追跡
    (Object.keys(det.geoByAngle) as AngleType[]).forEach((angle) => {
      const g = det.geoByAngle[angle];
      if (!isFinite(g.distKm)) return;
      if (!nearestLine || g.distKm < nearestLine.distKm) {
        nearestLine = {
          body: det.body,
          angle,
          distDeg: g.distDeg,
          distKm: g.distKm,
          side: g.side,
        };
      }
    });

    // アクティブな線を収集（弱すぎるものは除外）
    (Object.keys(det.byAngle) as AngleType[]).forEach((angle) => {
      const s = det.byAngle[angle];
      if (s >= 0.18) {
        const g = det.geoByAngle[angle];
        activeLines.push({
          body: det.body,
          angle,
          strength: s,
          distKm: g.distKm,
          side: g.side,
        });
      }
    });

    // 目的スコアへの寄与: 天体重み × （アングル重み×線影響度 の最大）
    const pw = purpose.planetWeights[det.body];
    if (pw) {
      let best = 0;
      (Object.keys(det.byAngle) as AngleType[]).forEach((angle) => {
        const v = purpose.angleWeights[angle] * det.byAngle[angle];
        if (v > best) best = v;
      });
      raw += pw * best;
    }
  }

  activeLines.sort((a, b) => b.strength - a.strength);

  // raw（おおむね 0〜3）を 0..100 に飽和マッピング（ポジティブ寄りの分布）
  const purposeScore = Math.round(99 * (1 - Math.exp(-raw * 0.95)));
  const purposeStars = scoreToStars(purposeScore);

  return {
    city,
    planetStrength,
    planetStars,
    purposeScore,
    purposeStars,
    activeLines,
    nearestLine,
    details,
  };
}

/**
 * 全都市を指定の目的でスコアリングし、高い順に並べて返す。
 */
export function rankCities(
  chart: AstroChart,
  purposeId: string,
  cities: WorldCity[] = WORLD_CITIES
): CityScore[] {
  const purpose = PURPOSE_MAP[purposeId] ?? PURPOSES[0];
  return cities
    .map((c) => scoreCity(chart, c, purpose))
    .sort((a, b) => b.purposeScore - a.purposeScore);
}

/** 線までの距離・方向を短い日本語ラベルにする（例: 「西へ約210km」） */
export function lineDistanceLabel(al: { distKm: number; side: LineSide }): string {
  if (al.side === "on" || !isFinite(al.distKm) || al.distKm < 20) {
    return "ほぼ真上";
  }
  const dir = al.side === "E" ? "東" : "西";
  const km =
    al.distKm >= 500
      ? Math.round(al.distKm / 50) * 50
      : Math.round(al.distKm / 10) * 10;
  return `${dir}へ約${km.toLocaleString()}km`;
}

/** 12星座名（黄経0度=牡羊座起点） */
export const ZODIAC_SIGNS = [
  "牡羊座", "牡牛座", "双子座", "蟹座", "獅子座", "乙女座",
  "天秤座", "蠍座", "射手座", "山羊座", "水瓶座", "魚座",
];

/** 黄経（度）→ 星座名 */
export function signOf(eclLon: number): string {
  return ZODIAC_SIGNS[Math.floor(rev(eclLon) / 30) % 12];
}

/**
 * アクティブな線について、天体のトーン（追い風/成長/刺激）に応じた
 * 正直かつ前向きな一言メッセージを生成する。
 */
export function lineMessage(body: Body, angle: AngleType): string {
  const p = PLANET_META[body];
  const head = `${p.symbol} ${p.name}の${angle}線：`;
  switch (p.tone) {
    case "growth":
      return `${head}${ANGLE_THEME[angle]}で試され、鍛えられる土地。向き合うほど${p.theme}が本物の力になります。`;
    case "awaken":
      return `${head}${ANGLE_THEME[angle]}に非日常の刺激が入る土地。${p.theme}が目を覚まし、予想外の変化も楽しめます。`;
    default:
      return `${head}${ANGLE_THEME[angle]}に追い風が届きやすい土地。${p.theme}が自然と引き出されます。`;
  }
}

/** 都市の総評コメント（最強の線＋トーン。線が無ければ最寄り線を案内） */
export function citySummary(score: CityScore): string {
  if (score.activeLines.length === 0) {
    if (score.nearestLine) {
      const n = score.nearestLine;
      const p = PLANET_META[n.body];
      const tone = TONE_META[p.tone];
      return `強く効く線は近くにありませんが、最寄りは${p.name}の${ANGLE_LABEL[n.angle]}（${lineDistanceLabel(n)}）。その方向に「${tone.label}」の気配が残ります。`;
    }
    return "強いラインは近くになく、穏やかでクセの少ない土地です。";
  }
  const top = score.activeLines[0];
  const p = PLANET_META[top.body];
  switch (p.tone) {
    case "growth":
      return `${p.name}（${p.keyword}）が${ANGLE_LABEL[top.angle]}で強く働く土地。${p.theme}に真剣に向き合うことで、大きく成長できます。`;
    case "awaken":
      return `${p.name}（${p.keyword}）が${ANGLE_LABEL[top.angle]}で刺激的に働く土地。${p.theme}が思いがけず開いていきます。`;
    default:
      return `${p.name}（${p.keyword}）が${ANGLE_LABEL[top.angle]}で輝く土地。${p.theme}を後押ししてくれます。`;
  }
}
