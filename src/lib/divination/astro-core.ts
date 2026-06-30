/**
 * astro-core.ts — 天体位置計算エンジン
 *
 * Paul Schlyter の "Computing planetary positions"（公開アルゴリズム）に基づく
 * 低精度（≒1分角）の地心天体位置計算。アストロカートグラフィー用に、各天体の
 * 地心・赤道座標（赤経 RA / 赤緯 Dec）と、出生時刻におけるグリニッジ恒星時を求める。
 *
 * 精度はアストロカートグラフィーのライン描画に十分（太陽・月・内惑星は数分角、
 * 外惑星は1〜2度程度）。占いの参考用途を前提とした実装。
 */

// --- 度数ベースの三角関数ヘルパー ---
const DEG = Math.PI / 180;
const sind = (d: number) => Math.sin(d * DEG);
const cosd = (d: number) => Math.cos(d * DEG);
const atan2d = (y: number, x: number) => Math.atan2(y, x) / DEG;
const asind = (x: number) => Math.asin(x) / DEG;

/** 0〜360度に正規化 */
export function rev(x: number): number {
  return x - Math.floor(x / 360) * 360;
}

/** -180〜180度に正規化 */
export function rev180(x: number): number {
  const r = rev(x);
  return r > 180 ? r - 360 : r;
}

export type Body =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";

export const BODIES: Body[] = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
];

export interface BodyPosition {
  body: Body;
  /** 黄経（地心・度） */
  eclLon: number;
  /** 黄緯（地心・度） */
  eclLat: number;
  /** 赤経（度, 0-360） */
  ra: number;
  /** 赤緯（度, -90..90） */
  dec: number;
  /** 地心距離（太陽・惑星=AU, 月=地球半径） */
  dist: number;
}

export interface SkyResult {
  /** 計算に用いた瞬間（UTC） */
  date: Date;
  /** 各天体の地心位置 */
  positions: Record<Body, BodyPosition>;
  /** グリニッジ平均恒星時（度, 0-360） */
  gmstDeg: number;
  /** 黄道傾斜角（度） */
  obliquity: number;
}

/**
 * Schlyter の通日 d を求める。基準は 1999-12-31 00:00 UT（epoch 2000.0）。
 * UT の端数も含める。
 */
function dayNumber(date: Date): number {
  const Y = date.getUTCFullYear();
  const M = date.getUTCMonth() + 1;
  const D = date.getUTCDate();
  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  const d =
    367 * Y -
    Math.trunc((7 * (Y + Math.trunc((M + 9) / 12))) / 4) +
    Math.trunc((275 * M) / 9) +
    D -
    730530;
  return d + ut / 24;
}

/** ケプラー方程式を解いて離心近点角 E（度）を返す */
function solveKepler(M: number, e: number): number {
  const Mr = rev(M);
  let E = Mr + (180 / Math.PI) * e * sind(Mr) * (1 + e * cosd(Mr));
  for (let i = 0; i < 6; i++) {
    const dE =
      (E - (180 / Math.PI) * e * sind(E) - Mr) / (1 - e * cosd(E));
    E -= dE;
    if (Math.abs(dE) < 1e-7) break;
  }
  return E;
}

interface Elements {
  N: number; // 昇交点黄経
  i: number; // 軌道傾斜
  w: number; // 近日点引数
  a: number; // 軌道長半径
  e: number; // 離心率
  M: number; // 平均近点角
}

/** 各天体の軌道要素を通日 d から計算（Schlyter の係数） */
function elementsOf(body: Body, d: number): Elements {
  switch (body) {
    case "sun":
      return {
        N: 0,
        i: 0,
        w: 282.9404 + 4.70935e-5 * d,
        a: 1.0,
        e: 0.016709 - 1.151e-9 * d,
        M: 356.047 + 0.9856002585 * d,
      };
    case "moon":
      return {
        N: 125.1228 - 0.0529538083 * d,
        i: 5.1454,
        w: 318.0634 + 0.1643573223 * d,
        a: 60.2666,
        e: 0.0549,
        M: 115.3654 + 13.0649929509 * d,
      };
    case "mercury":
      return {
        N: 48.3313 + 3.24587e-5 * d,
        i: 7.0047 + 5.0e-8 * d,
        w: 29.1241 + 1.01444e-5 * d,
        a: 0.387098,
        e: 0.205635 + 5.59e-10 * d,
        M: 168.6562 + 4.0923344368 * d,
      };
    case "venus":
      return {
        N: 76.6799 + 2.4659e-5 * d,
        i: 3.3946 + 2.75e-8 * d,
        w: 54.891 + 1.38374e-5 * d,
        a: 0.72333,
        e: 0.006773 - 1.302e-9 * d,
        M: 48.0052 + 1.6021302244 * d,
      };
    case "mars":
      return {
        N: 49.5574 + 2.11081e-5 * d,
        i: 1.8497 - 1.78e-8 * d,
        w: 286.5016 + 2.92961e-5 * d,
        a: 1.523688,
        e: 0.093405 + 2.516e-9 * d,
        M: 18.6021 + 0.5240207766 * d,
      };
    case "jupiter":
      return {
        N: 100.4542 + 2.76854e-5 * d,
        i: 1.303 - 1.557e-7 * d,
        w: 273.8777 + 1.64505e-5 * d,
        a: 5.20256,
        e: 0.048498 + 4.469e-9 * d,
        M: 19.895 + 0.0830853001 * d,
      };
    case "saturn":
      return {
        N: 113.6634 + 2.3898e-5 * d,
        i: 2.4886 - 1.081e-7 * d,
        w: 339.3939 + 2.97661e-5 * d,
        a: 9.55475,
        e: 0.055546 - 9.499e-9 * d,
        M: 316.967 + 0.0334442282 * d,
      };
    case "uranus":
      return {
        N: 74.0005 + 1.3978e-5 * d,
        i: 0.7733 + 1.9e-8 * d,
        w: 96.6612 + 3.0565e-5 * d,
        a: 19.18171 - 1.55e-8 * d,
        e: 0.047318 + 7.45e-9 * d,
        M: 142.5905 + 0.011725806 * d,
      };
    case "neptune":
      return {
        N: 131.7806 + 3.0173e-5 * d,
        i: 1.77 - 2.55e-7 * d,
        w: 272.8461 - 6.027e-6 * d,
        a: 30.05826 + 3.313e-8 * d,
        e: 0.008606 + 2.15e-9 * d,
        M: 260.2471 + 0.005995147 * d,
      };
    default:
      // 冥王星は専用式で扱うためここには来ない
      return { N: 0, i: 0, w: 0, a: 0, e: 0, M: 0 };
  }
}

interface Rect {
  x: number;
  y: number;
  z: number;
}

/** 軌道要素から（太陽中心 or 地心）黄道直交座標を求める */
function heliocentricRect(el: Elements): { rect: Rect; r: number } {
  const E = solveKepler(el.M, el.e);
  const xv = el.a * (cosd(E) - el.e);
  const yv = el.a * (Math.sqrt(1 - el.e * el.e) * sind(E));
  const v = atan2d(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const vw = v + el.w;
  const x = r * (cosd(el.N) * cosd(vw) - sind(el.N) * sind(vw) * cosd(el.i));
  const y = r * (sind(el.N) * cosd(vw) + cosd(el.N) * sind(vw) * cosd(el.i));
  const z = r * (sind(vw) * sind(el.i));
  return { rect: { x, y, z }, r };
}

/** 黄道直交座標 → 黄経・黄緯・距離 */
function rectToEcl(rect: Rect): { lon: number; lat: number; dist: number } {
  const dist = Math.sqrt(rect.x * rect.x + rect.y * rect.y + rect.z * rect.z);
  const lon = rev(atan2d(rect.y, rect.x));
  const lat = atan2d(rect.z, Math.sqrt(rect.x * rect.x + rect.y * rect.y));
  return { lon, lat, dist };
}

/** 黄道座標 → 赤道座標（RA/Dec, 度） */
function eclToEqu(
  lon: number,
  lat: number,
  dist: number,
  ecl: number
): { ra: number; dec: number } {
  const xg = dist * cosd(lon) * cosd(lat);
  const yg = dist * sind(lon) * cosd(lat);
  const zg = dist * sind(lat);
  const xe = xg;
  const ye = yg * cosd(ecl) - zg * sind(ecl);
  const ze = yg * sind(ecl) + zg * cosd(ecl);
  const ra = rev(atan2d(ye, xe));
  const dec = atan2d(ze, Math.sqrt(xe * xe + ye * ye));
  return { ra, dec };
}

/** 月の摂動補正を適用した黄経・黄緯・距離を返す */
function moonPerturbations(
  base: { lon: number; lat: number; dist: number },
  moonEl: Elements,
  sunEl: Elements
): { lon: number; lat: number; dist: number } {
  const Ms = sunEl.M; // 太陽の平均近点角
  const Mm = moonEl.M; // 月の平均近点角
  const Ls = rev(sunEl.M + sunEl.w); // 太陽の平均黄経
  const Lm = rev(moonEl.N + moonEl.w + moonEl.M); // 月の平均黄経
  const D = rev(Lm - Ls); // 平均離角
  const F = rev(Lm - moonEl.N); // 緯度引数

  const dLon =
    -1.274 * sind(Mm - 2 * D) +
    0.658 * sind(2 * D) -
    0.186 * sind(Ms) -
    0.059 * sind(2 * Mm - 2 * D) -
    0.057 * sind(Mm - 2 * D + Ms) +
    0.053 * sind(Mm + 2 * D) +
    0.046 * sind(2 * D - Ms) +
    0.041 * sind(Mm - Ms) -
    0.035 * sind(D) -
    0.031 * sind(Mm + Ms) -
    0.015 * sind(2 * F - 2 * D) +
    0.011 * sind(Mm - 4 * D);

  const dLat =
    -0.173 * sind(F - 2 * D) -
    0.055 * sind(Mm - F - 2 * D) -
    0.046 * sind(Mm + F - 2 * D) +
    0.033 * sind(F + 2 * D) +
    0.017 * sind(2 * Mm + F);

  const dDist = -0.58 * cosd(Mm - 2 * D) - 0.46 * cosd(2 * D);

  return {
    lon: base.lon + dLon,
    lat: base.lat + dLat,
    dist: base.dist + dDist,
  };
}

/** 冥王星の地心向け黄道座標（Schlyter の摂動式・太陽中心） */
function plutoHelio(d: number): { lon: number; lat: number; r: number } {
  const S = 50.03 + 0.033459652 * d;
  const P = 238.95 + 0.003968789 * d;

  const lon =
    238.9508 +
    0.00400703 * d -
    19.799 * sind(P) +
    19.848 * cosd(P) +
    0.897 * sind(2 * P) -
    4.956 * cosd(2 * P) +
    0.61 * sind(3 * P) +
    1.211 * cosd(3 * P) -
    0.341 * sind(4 * P) -
    0.19 * cosd(4 * P) +
    0.128 * sind(5 * P) -
    0.034 * cosd(5 * P) -
    0.038 * sind(6 * P) +
    0.031 * cosd(6 * P) +
    0.02 * sind(S - P) -
    0.01 * cosd(S - P);

  const lat =
    -3.9082 -
    5.453 * sind(P) -
    14.975 * cosd(P) +
    3.527 * sind(2 * P) +
    6.207 * cosd(2 * P) +
    2.155 * sind(3 * P) -
    2.477 * cosd(3 * P) +
    2.937 * sind(4 * P) +
    4.0 * cosd(4 * P);

  const r =
    40.72 +
    6.68 * sind(P) +
    6.9 * cosd(P) -
    1.18 * sind(2 * P) -
    0.03 * cosd(2 * P) +
    0.15 * sind(3 * P) -
    0.14 * cosd(3 * P);

  return { lon: rev(lon), lat, r };
}

/**
 * 指定UTC時刻における全天体の地心位置と恒星時を計算する。
 */
export function computeSky(date: Date): SkyResult {
  const d = dayNumber(date);
  const ecl = 23.4393 - 3.563e-7 * d;

  const sunEl = elementsOf("sun", d);
  // 太陽（地心黄道で lat=0）
  const sunE = solveKepler(sunEl.M, sunEl.e);
  const sunXv = sunEl.a * (cosd(sunE) - sunEl.e);
  const sunYv = sunEl.a * Math.sqrt(1 - sunEl.e * sunEl.e) * sind(sunE);
  const sunR = Math.sqrt(sunXv * sunXv + sunYv * sunYv);
  const sunTrue = atan2d(sunYv, sunXv);
  const sunLon = rev(sunTrue + sunEl.w);
  // 太陽の地心直交（黄道面）
  const sunRect: Rect = {
    x: sunR * cosd(sunLon),
    y: sunR * sind(sunLon),
    z: 0,
  };

  const positions = {} as Record<Body, BodyPosition>;

  for (const body of BODIES) {
    let eclLon: number;
    let eclLat: number;
    let dist: number;

    if (body === "sun") {
      eclLon = sunLon;
      eclLat = 0;
      dist = sunR;
    } else if (body === "moon") {
      const moonEl = elementsOf("moon", d);
      const { rect } = heliocentricRect(moonEl); // 月は地心軌道なので地心黄道
      const ecl0 = rectToEcl(rect);
      const corrected = moonPerturbations(ecl0, moonEl, sunEl);
      eclLon = rev(corrected.lon);
      eclLat = corrected.lat;
      dist = corrected.dist;
    } else if (body === "pluto") {
      const ph = plutoHelio(d);
      // 太陽中心 → 地心
      const xh = ph.r * cosd(ph.lon) * cosd(ph.lat);
      const yh = ph.r * sind(ph.lon) * cosd(ph.lat);
      const zh = ph.r * sind(ph.lat);
      const geo = rectToEcl({
        x: xh + sunRect.x,
        y: yh + sunRect.y,
        z: zh,
      });
      eclLon = geo.lon;
      eclLat = geo.lat;
      dist = geo.dist;
    } else {
      const el = elementsOf(body, d);
      const { rect } = heliocentricRect(el);
      const geo = rectToEcl({
        x: rect.x + sunRect.x,
        y: rect.y + sunRect.y,
        z: rect.z,
      });
      eclLon = geo.lon;
      eclLat = geo.lat;
      dist = geo.dist;
    }

    const { ra, dec } = eclToEqu(eclLon, eclLat, dist, ecl);
    positions[body] = {
      body,
      eclLon: rev(eclLon),
      eclLat,
      ra,
      dec,
      dist,
    };
  }

  // グリニッジ平均恒星時（度）
  const Ls = rev(sunEl.w + sunEl.M);
  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  const gmstDeg = rev(Ls + 180 + ut * 15);

  return { date, positions, gmstDeg, obliquity: ecl };
}

/** 地方恒星時から、ある天体が南中する地理経度（東経+, -180..180）を返す */
export function culminationLongitude(ra: number, gmstDeg: number): number {
  return rev180(ra - gmstDeg);
}

export { sind, cosd, atan2d, asind };
