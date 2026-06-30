/**
 * world-cities.ts — 世界主要都市データ
 *
 * アストロカートグラフィーのリロケーション評価で使う世界各地の都市。
 * lat: 緯度（北+ / 南-）, lon: 経度（東+ / 西-）。
 */

export interface WorldCity {
  id: string;
  name: string; // 日本語表記
  enName: string;
  country: string; // 日本語の国・地域名
  flag: string; // 国旗絵文字
  lat: number;
  lon: number;
  region: WorldRegion;
}

export type WorldRegion =
  | "japan"
  | "east-asia"
  | "se-asia"
  | "south-asia"
  | "oceania"
  | "middle-east"
  | "europe"
  | "africa"
  | "north-america"
  | "latin-america";

export const REGION_LABEL: Record<WorldRegion, string> = {
  japan: "日本",
  "east-asia": "東アジア",
  "se-asia": "東南アジア",
  "south-asia": "南アジア",
  oceania: "オセアニア",
  "middle-east": "中東",
  europe: "ヨーロッパ",
  africa: "アフリカ",
  "north-america": "北米",
  "latin-america": "中南米",
};

export const WORLD_CITIES: WorldCity[] = [
  // --- 日本 ---
  { id: "tokyo", name: "東京", enName: "Tokyo", country: "日本", flag: "🇯🇵", lat: 35.68, lon: 139.69, region: "japan" },
  { id: "osaka", name: "大阪", enName: "Osaka", country: "日本", flag: "🇯🇵", lat: 34.69, lon: 135.5, region: "japan" },
  { id: "sapporo", name: "札幌", enName: "Sapporo", country: "日本", flag: "🇯🇵", lat: 43.06, lon: 141.35, region: "japan" },
  { id: "fukuoka", name: "福岡", enName: "Fukuoka", country: "日本", flag: "🇯🇵", lat: 33.59, lon: 130.4, region: "japan" },
  { id: "naha", name: "那覇", enName: "Naha", country: "日本", flag: "🇯🇵", lat: 26.21, lon: 127.68, region: "japan" },

  // --- 東アジア ---
  { id: "seoul", name: "ソウル", enName: "Seoul", country: "韓国", flag: "🇰🇷", lat: 37.57, lon: 126.98, region: "east-asia" },
  { id: "jeju", name: "済州島", enName: "Jeju", country: "韓国", flag: "🇰🇷", lat: 33.5, lon: 126.53, region: "east-asia" },
  { id: "busan", name: "釜山", enName: "Busan", country: "韓国", flag: "🇰🇷", lat: 35.18, lon: 129.08, region: "east-asia" },
  { id: "beijing", name: "北京", enName: "Beijing", country: "中国", flag: "🇨🇳", lat: 39.9, lon: 116.41, region: "east-asia" },
  { id: "shanghai", name: "上海", enName: "Shanghai", country: "中国", flag: "🇨🇳", lat: 31.23, lon: 121.47, region: "east-asia" },
  { id: "hongkong", name: "香港", enName: "Hong Kong", country: "中国", flag: "🇭🇰", lat: 22.32, lon: 114.17, region: "east-asia" },
  { id: "taipei", name: "台北", enName: "Taipei", country: "台湾", flag: "🇹🇼", lat: 25.03, lon: 121.57, region: "east-asia" },
  { id: "ulaanbaatar", name: "ウランバートル", enName: "Ulaanbaatar", country: "モンゴル", flag: "🇲🇳", lat: 47.89, lon: 106.91, region: "east-asia" },

  // --- 東南アジア ---
  { id: "singapore", name: "シンガポール", enName: "Singapore", country: "シンガポール", flag: "🇸🇬", lat: 1.35, lon: 103.82, region: "se-asia" },
  { id: "bangkok", name: "バンコク", enName: "Bangkok", country: "タイ", flag: "🇹🇭", lat: 13.76, lon: 100.5, region: "se-asia" },
  { id: "chiangmai", name: "チェンマイ", enName: "Chiang Mai", country: "タイ", flag: "🇹🇭", lat: 18.79, lon: 98.99, region: "se-asia" },
  { id: "bali", name: "バリ島", enName: "Bali", country: "インドネシア", flag: "🇮🇩", lat: -8.41, lon: 115.19, region: "se-asia" },
  { id: "jakarta", name: "ジャカルタ", enName: "Jakarta", country: "インドネシア", flag: "🇮🇩", lat: -6.21, lon: 106.85, region: "se-asia" },
  { id: "kualalumpur", name: "クアラルンプール", enName: "Kuala Lumpur", country: "マレーシア", flag: "🇲🇾", lat: 3.14, lon: 101.69, region: "se-asia" },
  { id: "manila", name: "マニラ", enName: "Manila", country: "フィリピン", flag: "🇵🇭", lat: 14.6, lon: 120.98, region: "se-asia" },
  { id: "cebu", name: "セブ", enName: "Cebu", country: "フィリピン", flag: "🇵🇭", lat: 10.32, lon: 123.9, region: "se-asia" },
  { id: "hanoi", name: "ハノイ", enName: "Hanoi", country: "ベトナム", flag: "🇻🇳", lat: 21.03, lon: 105.85, region: "se-asia" },
  { id: "hochiminh", name: "ホーチミン", enName: "Ho Chi Minh", country: "ベトナム", flag: "🇻🇳", lat: 10.82, lon: 106.63, region: "se-asia" },
  { id: "phnompenh", name: "プノンペン", enName: "Phnom Penh", country: "カンボジア", flag: "🇰🇭", lat: 11.56, lon: 104.92, region: "se-asia" },

  // --- 南アジア ---
  { id: "delhi", name: "デリー", enName: "Delhi", country: "インド", flag: "🇮🇳", lat: 28.61, lon: 77.21, region: "south-asia" },
  { id: "mumbai", name: "ムンバイ", enName: "Mumbai", country: "インド", flag: "🇮🇳", lat: 19.08, lon: 72.88, region: "south-asia" },
  { id: "bangalore", name: "バンガロール", enName: "Bangalore", country: "インド", flag: "🇮🇳", lat: 12.97, lon: 77.59, region: "south-asia" },
  { id: "colombo", name: "コロンボ", enName: "Colombo", country: "スリランカ", flag: "🇱🇰", lat: 6.93, lon: 79.86, region: "south-asia" },
  { id: "kathmandu", name: "カトマンズ", enName: "Kathmandu", country: "ネパール", flag: "🇳🇵", lat: 27.72, lon: 85.32, region: "south-asia" },
  { id: "dhaka", name: "ダッカ", enName: "Dhaka", country: "バングラデシュ", flag: "🇧🇩", lat: 23.81, lon: 90.41, region: "south-asia" },

  // --- オセアニア ---
  { id: "sydney", name: "シドニー", enName: "Sydney", country: "オーストラリア", flag: "🇦🇺", lat: -33.87, lon: 151.21, region: "oceania" },
  { id: "melbourne", name: "メルボルン", enName: "Melbourne", country: "オーストラリア", flag: "🇦🇺", lat: -37.81, lon: 144.96, region: "oceania" },
  { id: "brisbane", name: "ブリスベン", enName: "Brisbane", country: "オーストラリア", flag: "🇦🇺", lat: -27.47, lon: 153.03, region: "oceania" },
  { id: "perth", name: "パース", enName: "Perth", country: "オーストラリア", flag: "🇦🇺", lat: -31.95, lon: 115.86, region: "oceania" },
  { id: "goldcoast", name: "ゴールドコースト", enName: "Gold Coast", country: "オーストラリア", flag: "🇦🇺", lat: -28.0, lon: 153.43, region: "oceania" },
  { id: "auckland", name: "オークランド", enName: "Auckland", country: "ニュージーランド", flag: "🇳🇿", lat: -36.85, lon: 174.76, region: "oceania" },
  { id: "wellington", name: "ウェリントン", enName: "Wellington", country: "ニュージーランド", flag: "🇳🇿", lat: -41.29, lon: 174.78, region: "oceania" },
  { id: "honolulu", name: "ホノルル", enName: "Honolulu", country: "ハワイ", flag: "🇺🇸", lat: 21.31, lon: -157.86, region: "oceania" },
  { id: "nadi", name: "ナンディ", enName: "Nadi", country: "フィジー", flag: "🇫🇯", lat: -17.78, lon: 177.42, region: "oceania" },

  // --- 中東 ---
  { id: "dubai", name: "ドバイ", enName: "Dubai", country: "UAE", flag: "🇦🇪", lat: 25.2, lon: 55.27, region: "middle-east" },
  { id: "abudhabi", name: "アブダビ", enName: "Abu Dhabi", country: "UAE", flag: "🇦🇪", lat: 24.45, lon: 54.38, region: "middle-east" },
  { id: "doha", name: "ドーハ", enName: "Doha", country: "カタール", flag: "🇶🇦", lat: 25.29, lon: 51.53, region: "middle-east" },
  { id: "istanbul", name: "イスタンブール", enName: "Istanbul", country: "トルコ", flag: "🇹🇷", lat: 41.01, lon: 28.98, region: "middle-east" },
  { id: "telaviv", name: "テルアビブ", enName: "Tel Aviv", country: "イスラエル", flag: "🇮🇱", lat: 32.08, lon: 34.78, region: "middle-east" },
  { id: "jerusalem", name: "エルサレム", enName: "Jerusalem", country: "イスラエル", flag: "🇮🇱", lat: 31.77, lon: 35.21, region: "middle-east" },
  { id: "riyadh", name: "リヤド", enName: "Riyadh", country: "サウジアラビア", flag: "🇸🇦", lat: 24.71, lon: 46.68, region: "middle-east" },
  { id: "tehran", name: "テヘラン", enName: "Tehran", country: "イラン", flag: "🇮🇷", lat: 35.69, lon: 51.39, region: "middle-east" },

  // --- ヨーロッパ ---
  { id: "london", name: "ロンドン", enName: "London", country: "イギリス", flag: "🇬🇧", lat: 51.51, lon: -0.13, region: "europe" },
  { id: "paris", name: "パリ", enName: "Paris", country: "フランス", flag: "🇫🇷", lat: 48.86, lon: 2.35, region: "europe" },
  { id: "nice", name: "ニース", enName: "Nice", country: "フランス", flag: "🇫🇷", lat: 43.7, lon: 7.27, region: "europe" },
  { id: "berlin", name: "ベルリン", enName: "Berlin", country: "ドイツ", flag: "🇩🇪", lat: 52.52, lon: 13.41, region: "europe" },
  { id: "munich", name: "ミュンヘン", enName: "Munich", country: "ドイツ", flag: "🇩🇪", lat: 48.14, lon: 11.58, region: "europe" },
  { id: "amsterdam", name: "アムステルダム", enName: "Amsterdam", country: "オランダ", flag: "🇳🇱", lat: 52.37, lon: 4.9, region: "europe" },
  { id: "rome", name: "ローマ", enName: "Rome", country: "イタリア", flag: "🇮🇹", lat: 41.9, lon: 12.5, region: "europe" },
  { id: "milan", name: "ミラノ", enName: "Milan", country: "イタリア", flag: "🇮🇹", lat: 45.46, lon: 9.19, region: "europe" },
  { id: "barcelona", name: "バルセロナ", enName: "Barcelona", country: "スペイン", flag: "🇪🇸", lat: 41.39, lon: 2.17, region: "europe" },
  { id: "madrid", name: "マドリード", enName: "Madrid", country: "スペイン", flag: "🇪🇸", lat: 40.42, lon: -3.7, region: "europe" },
  { id: "lisbon", name: "リスボン", enName: "Lisbon", country: "ポルトガル", flag: "🇵🇹", lat: 38.72, lon: -9.14, region: "europe" },
  { id: "zurich", name: "チューリッヒ", enName: "Zurich", country: "スイス", flag: "🇨🇭", lat: 47.37, lon: 8.54, region: "europe" },
  { id: "vienna", name: "ウィーン", enName: "Vienna", country: "オーストリア", flag: "🇦🇹", lat: 48.21, lon: 16.37, region: "europe" },
  { id: "prague", name: "プラハ", enName: "Prague", country: "チェコ", flag: "🇨🇿", lat: 50.08, lon: 14.44, region: "europe" },
  { id: "copenhagen", name: "コペンハーゲン", enName: "Copenhagen", country: "デンマーク", flag: "🇩🇰", lat: 55.68, lon: 12.57, region: "europe" },
  { id: "stockholm", name: "ストックホルム", enName: "Stockholm", country: "スウェーデン", flag: "🇸🇪", lat: 59.33, lon: 18.07, region: "europe" },
  { id: "oslo", name: "オスロ", enName: "Oslo", country: "ノルウェー", flag: "🇳🇴", lat: 59.91, lon: 10.75, region: "europe" },
  { id: "helsinki", name: "ヘルシンキ", enName: "Helsinki", country: "フィンランド", flag: "🇫🇮", lat: 60.17, lon: 24.94, region: "europe" },
  { id: "dublin", name: "ダブリン", enName: "Dublin", country: "アイルランド", flag: "🇮🇪", lat: 53.35, lon: -6.26, region: "europe" },
  { id: "athens", name: "アテネ", enName: "Athens", country: "ギリシャ", flag: "🇬🇷", lat: 37.98, lon: 23.73, region: "europe" },
  { id: "moscow", name: "モスクワ", enName: "Moscow", country: "ロシア", flag: "🇷🇺", lat: 55.76, lon: 37.62, region: "europe" },
  { id: "reykjavik", name: "レイキャビク", enName: "Reykjavik", country: "アイスランド", flag: "🇮🇸", lat: 64.15, lon: -21.94, region: "europe" },

  // --- アフリカ ---
  { id: "cairo", name: "カイロ", enName: "Cairo", country: "エジプト", flag: "🇪🇬", lat: 30.04, lon: 31.24, region: "africa" },
  { id: "capetown", name: "ケープタウン", enName: "Cape Town", country: "南アフリカ", flag: "🇿🇦", lat: -33.92, lon: 18.42, region: "africa" },
  { id: "johannesburg", name: "ヨハネスブルグ", enName: "Johannesburg", country: "南アフリカ", flag: "🇿🇦", lat: -26.2, lon: 28.05, region: "africa" },
  { id: "nairobi", name: "ナイロビ", enName: "Nairobi", country: "ケニア", flag: "🇰🇪", lat: -1.29, lon: 36.82, region: "africa" },
  { id: "lagos", name: "ラゴス", enName: "Lagos", country: "ナイジェリア", flag: "🇳🇬", lat: 6.52, lon: 3.38, region: "africa" },
  { id: "casablanca", name: "カサブランカ", enName: "Casablanca", country: "モロッコ", flag: "🇲🇦", lat: 33.57, lon: -7.59, region: "africa" },
  { id: "marrakech", name: "マラケシュ", enName: "Marrakech", country: "モロッコ", flag: "🇲🇦", lat: 31.63, lon: -7.98, region: "africa" },
  { id: "addisababa", name: "アディスアベバ", enName: "Addis Ababa", country: "エチオピア", flag: "🇪🇹", lat: 9.03, lon: 38.74, region: "africa" },
  { id: "accra", name: "アクラ", enName: "Accra", country: "ガーナ", flag: "🇬🇭", lat: 5.6, lon: -0.19, region: "africa" },
  { id: "mauritius", name: "モーリシャス", enName: "Mauritius", country: "モーリシャス", flag: "🇲🇺", lat: -20.35, lon: 57.55, region: "africa" },

  // --- 北米 ---
  { id: "newyork", name: "ニューヨーク", enName: "New York", country: "アメリカ", flag: "🇺🇸", lat: 40.71, lon: -74.01, region: "north-america" },
  { id: "losangeles", name: "ロサンゼルス", enName: "Los Angeles", country: "アメリカ", flag: "🇺🇸", lat: 34.05, lon: -118.24, region: "north-america" },
  { id: "sanfrancisco", name: "サンフランシスコ", enName: "San Francisco", country: "アメリカ", flag: "🇺🇸", lat: 37.77, lon: -122.42, region: "north-america" },
  { id: "seattle", name: "シアトル", enName: "Seattle", country: "アメリカ", flag: "🇺🇸", lat: 47.61, lon: -122.33, region: "north-america" },
  { id: "chicago", name: "シカゴ", enName: "Chicago", country: "アメリカ", flag: "🇺🇸", lat: 41.88, lon: -87.63, region: "north-america" },
  { id: "lasvegas", name: "ラスベガス", enName: "Las Vegas", country: "アメリカ", flag: "🇺🇸", lat: 36.17, lon: -115.14, region: "north-america" },
  { id: "miami", name: "マイアミ", enName: "Miami", country: "アメリカ", flag: "🇺🇸", lat: 25.76, lon: -80.19, region: "north-america" },
  { id: "boston", name: "ボストン", enName: "Boston", country: "アメリカ", flag: "🇺🇸", lat: 42.36, lon: -71.06, region: "north-america" },
  { id: "washington", name: "ワシントンD.C.", enName: "Washington D.C.", country: "アメリカ", flag: "🇺🇸", lat: 38.91, lon: -77.04, region: "north-america" },
  { id: "austin", name: "オースティン", enName: "Austin", country: "アメリカ", flag: "🇺🇸", lat: 30.27, lon: -97.74, region: "north-america" },
  { id: "vancouver", name: "バンクーバー", enName: "Vancouver", country: "カナダ", flag: "🇨🇦", lat: 49.28, lon: -123.12, region: "north-america" },
  { id: "toronto", name: "トロント", enName: "Toronto", country: "カナダ", flag: "🇨🇦", lat: 43.65, lon: -79.38, region: "north-america" },
  { id: "montreal", name: "モントリオール", enName: "Montreal", country: "カナダ", flag: "🇨🇦", lat: 45.5, lon: -73.57, region: "north-america" },
  { id: "mexicocity", name: "メキシコシティ", enName: "Mexico City", country: "メキシコ", flag: "🇲🇽", lat: 19.43, lon: -99.13, region: "north-america" },
  { id: "cancun", name: "カンクン", enName: "Cancun", country: "メキシコ", flag: "🇲🇽", lat: 21.16, lon: -86.85, region: "north-america" },

  // --- 中南米 ---
  { id: "saopaulo", name: "サンパウロ", enName: "Sao Paulo", country: "ブラジル", flag: "🇧🇷", lat: -23.55, lon: -46.63, region: "latin-america" },
  { id: "riodejaneiro", name: "リオデジャネイロ", enName: "Rio de Janeiro", country: "ブラジル", flag: "🇧🇷", lat: -22.91, lon: -43.17, region: "latin-america" },
  { id: "buenosaires", name: "ブエノスアイレス", enName: "Buenos Aires", country: "アルゼンチン", flag: "🇦🇷", lat: -34.6, lon: -58.38, region: "latin-america" },
  { id: "santiago", name: "サンティアゴ", enName: "Santiago", country: "チリ", flag: "🇨🇱", lat: -33.45, lon: -70.67, region: "latin-america" },
  { id: "lima", name: "リマ", enName: "Lima", country: "ペルー", flag: "🇵🇪", lat: -12.05, lon: -77.04, region: "latin-america" },
  { id: "cusco", name: "クスコ", enName: "Cusco", country: "ペルー", flag: "🇵🇪", lat: -13.53, lon: -71.97, region: "latin-america" },
  { id: "bogota", name: "ボゴタ", enName: "Bogota", country: "コロンビア", flag: "🇨🇴", lat: 4.71, lon: -74.07, region: "latin-america" },
  { id: "quito", name: "キト", enName: "Quito", country: "エクアドル", flag: "🇪🇨", lat: -0.18, lon: -78.47, region: "latin-america" },
  { id: "havana", name: "ハバナ", enName: "Havana", country: "キューバ", flag: "🇨🇺", lat: 23.11, lon: -82.37, region: "latin-america" },
];

export function getCityById(id: string): WorldCity | undefined {
  return WORLD_CITIES.find((c) => c.id === id);
}
