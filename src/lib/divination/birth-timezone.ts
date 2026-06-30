/**
 * birth-timezone.ts — 出生地のタイムゾーン解決
 *
 * アストロカートグラフィーの線は「生まれた瞬間（UTC）」だけで決まる。
 * 母子手帳などに残るのは現地時間なので、正しいUTCに直すには出生地の時差が要る。
 * このモジュールは、生まれた場所（IANAタイムゾーン）と生年月日から、
 * その瞬間の実際のUTCオフセット（時）を求める。ブラウザ/Node が内蔵する
 * IANAタイムゾーンDBを使うため、過去のサマータイム（例: 日本 1948〜1951年）も
 * 自動で反映される。
 */

export interface BirthLocation {
  id: string;
  /** 日本語表示名 */
  label: string;
  /** IANAタイムゾーンID */
  zone: string;
  /** Intl が使えない/ゾーン不明時のフォールバック標準オフセット（時） */
  fallback: number;
  /** 地域グループ（UIのまとまり用） */
  group: string;
}

/**
 * 出生地リスト。タイムゾーンが1国で複数ある国（米国・豪州など）は代表都市で分ける。
 * 時差の決定に必要な粒度のみ。日本を先頭（既定）に。
 */
export const BIRTH_LOCATIONS: BirthLocation[] = [
  // アジア
  { id: "jp", label: "日本", zone: "Asia/Tokyo", fallback: 9, group: "アジア" },
  { id: "kr", label: "韓国", zone: "Asia/Seoul", fallback: 9, group: "アジア" },
  { id: "cn", label: "中国（北京・上海）", zone: "Asia/Shanghai", fallback: 8, group: "アジア" },
  { id: "tw", label: "台湾", zone: "Asia/Taipei", fallback: 8, group: "アジア" },
  { id: "hk", label: "香港", zone: "Asia/Hong_Kong", fallback: 8, group: "アジア" },
  { id: "sg", label: "シンガポール", zone: "Asia/Singapore", fallback: 8, group: "アジア" },
  { id: "th", label: "タイ", zone: "Asia/Bangkok", fallback: 7, group: "アジア" },
  { id: "vn", label: "ベトナム", zone: "Asia/Ho_Chi_Minh", fallback: 7, group: "アジア" },
  { id: "ph", label: "フィリピン", zone: "Asia/Manila", fallback: 8, group: "アジア" },
  { id: "id", label: "インドネシア（ジャカルタ）", zone: "Asia/Jakarta", fallback: 7, group: "アジア" },
  { id: "in", label: "インド", zone: "Asia/Kolkata", fallback: 5.5, group: "アジア" },
  { id: "np", label: "ネパール", zone: "Asia/Kathmandu", fallback: 5.75, group: "アジア" },
  { id: "ae", label: "ドバイ・UAE", zone: "Asia/Dubai", fallback: 4, group: "アジア" },
  // ヨーロッパ
  { id: "gb", label: "イギリス", zone: "Europe/London", fallback: 0, group: "ヨーロッパ" },
  { id: "pt", label: "ポルトガル", zone: "Europe/Lisbon", fallback: 0, group: "ヨーロッパ" },
  { id: "eu", label: "中欧（独・仏・伊・西）", zone: "Europe/Paris", fallback: 1, group: "ヨーロッパ" },
  { id: "gr", label: "ギリシャ・東欧", zone: "Europe/Athens", fallback: 2, group: "ヨーロッパ" },
  { id: "tr", label: "トルコ", zone: "Europe/Istanbul", fallback: 3, group: "ヨーロッパ" },
  { id: "ru", label: "ロシア（モスクワ）", zone: "Europe/Moscow", fallback: 3, group: "ヨーロッパ" },
  // アメリカ
  { id: "us_e", label: "米国東部（ニューヨーク）", zone: "America/New_York", fallback: -5, group: "アメリカ" },
  { id: "us_c", label: "米国中部（シカゴ）", zone: "America/Chicago", fallback: -6, group: "アメリカ" },
  { id: "us_m", label: "米国山岳部（デンバー）", zone: "America/Denver", fallback: -7, group: "アメリカ" },
  { id: "us_w", label: "米国西部（ロサンゼルス）", zone: "America/Los_Angeles", fallback: -8, group: "アメリカ" },
  { id: "us_hi", label: "ハワイ", zone: "Pacific/Honolulu", fallback: -10, group: "アメリカ" },
  { id: "ca", label: "カナダ（トロント）", zone: "America/Toronto", fallback: -5, group: "アメリカ" },
  { id: "mx", label: "メキシコシティ", zone: "America/Mexico_City", fallback: -6, group: "アメリカ" },
  { id: "br", label: "ブラジル（サンパウロ）", zone: "America/Sao_Paulo", fallback: -3, group: "アメリカ" },
  { id: "ar", label: "アルゼンチン", zone: "America/Argentina/Buenos_Aires", fallback: -3, group: "アメリカ" },
  // オセアニア・その他
  { id: "au_e", label: "豪州東部（シドニー）", zone: "Australia/Sydney", fallback: 10, group: "オセアニア・その他" },
  { id: "au_w", label: "豪州西部（パース）", zone: "Australia/Perth", fallback: 8, group: "オセアニア・その他" },
  { id: "nz", label: "ニュージーランド", zone: "Pacific/Auckland", fallback: 12, group: "オセアニア・その他" },
  { id: "eg", label: "エジプト", zone: "Africa/Cairo", fallback: 2, group: "オセアニア・その他" },
  { id: "za", label: "南アフリカ", zone: "Africa/Johannesburg", fallback: 2, group: "オセアニア・その他" },
];

export const BIRTH_LOCATION_MAP: Record<string, BirthLocation> =
  BIRTH_LOCATIONS.reduce((acc, l) => {
    acc[l.id] = l;
    return acc;
  }, {} as Record<string, BirthLocation>);

/** UIのグループ順 */
export const LOCATION_GROUPS = [
  "アジア",
  "ヨーロッパ",
  "アメリカ",
  "オセアニア・その他",
] as const;

/**
 * 指定タイムゾーンの、ある瞬間（date=UTC）におけるUTCオフセット（分）を返す。
 * Intl の formatToParts でゾーンの現地時刻を読み、UTCとの差を取る。
 */
function zoneOffsetMinutes(zone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, number> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") map[p.type] = Number(p.value);
  }
  const asUTC = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    map.hour,
    map.minute,
    map.second
  );
  return Math.round((asUTC - date.getTime()) / 60000);
}

/**
 * 出生地ゾーンと出生日時から、その瞬間の実際のUTCオフセット（時）を求める。
 * 過去のサマータイムも IANA DB に基づき自動反映される。
 * Intl が使えない/ゾーン不明のときは fallback を返す。
 *
 * @param zone     IANAタイムゾーンID（例 "Asia/Tokyo"）
 * @param birthDate "YYYY-MM-DD"
 * @param birthTime "HH:MM"（空なら正午を仮定）
 * @param fallback Intl 失敗時の標準オフセット（時）
 */
export function offsetHoursForBirth(
  zone: string,
  birthDate: string,
  birthTime: string,
  fallback: number
): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return fallback;

  let hh = 12;
  let mm = 0;
  if (birthTime && /^\d{1,2}:\d{2}$/.test(birthTime)) {
    const [h, mi] = birthTime.split(":").map(Number);
    hh = h;
    mm = mi;
  }

  try {
    // 現地の壁時計時刻を一旦UTCとみなした瞬間
    const wallAsUTC = Date.UTC(y, m - 1, d, hh, mm, 0);
    // その付近のオフセットを求め、真のUTC瞬間で取り直す（DST境界の補正）
    let off = zoneOffsetMinutes(zone, new Date(wallAsUTC));
    off = zoneOffsetMinutes(zone, new Date(wallAsUTC - off * 60000));
    return off / 60;
  } catch {
    return fallback;
  }
}

/**
 * 自由入力の出生地テキストから、最も近い登録地を推測する（ベストエフォート）。
 * 見つからなければ日本を返す。
 */
export function guessLocationId(birthPlace: string | undefined): string {
  if (!birthPlace) return "jp";
  const t = birthPlace.toLowerCase();
  // 日本の地名・「日本」「県」「市」などは日本とみなす
  if (/日本|japan|県|府|都|北海道|東京|大阪|京都/.test(birthPlace)) return "jp";
  const hit = BIRTH_LOCATIONS.find((l) => {
    const key = l.label.replace(/（.*?）/g, "");
    return birthPlace.includes(key) || t.includes(l.zone.split("/")[1].toLowerCase());
  });
  return hit?.id ?? "jp";
}
