/**
 * 数秘術（Numerology）計算エンジン
 *
 * 生年月日からライフパスナンバー、バースデーナンバー、
 * 個人年（パーソナルイヤー）などを算出する。
 */

import type { Lang } from "@/lib/i18n/dict";

/** 数字をマスターナンバー（11,22,33）を考慮しつつ一桁に還元 */
function reduceToSingle(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n)
      .split("")
      .reduce((sum, d) => sum + Number(d), 0);
  }
  return n;
}

/** ライフパスナンバー: 生年月日の全桁を合計して一桁に還元 */
export function calcLifePathNumber(birthDate: string): number {
  const digits = birthDate.replace(/-/g, "");
  const sum = digits.split("").reduce((s, d) => s + Number(d), 0);
  return reduceToSingle(sum);
}

/** バースデーナンバー: 生まれた日を一桁に還元 */
export function calcBirthdayNumber(birthDate: string): number {
  const day = parseInt(birthDate.split("-")[2], 10);
  return reduceToSingle(day);
}

/** パーソナルイヤーナンバー: 生まれの月日 + 対象年 */
export function calcPersonalYear(birthDate: string, year: number): number {
  const [, m, d] = birthDate.split("-");
  const sum =
    String(year)
      .split("")
      .reduce((s, c) => s + Number(c), 0) +
    m.split("").reduce((s, c) => s + Number(c), 0) +
    d.split("").reduce((s, c) => s + Number(c), 0);
  return reduceToSingle(sum);
}

/** パーソナルマンスナンバー */
export function calcPersonalMonth(
  birthDate: string,
  year: number,
  month: number
): number {
  const py = calcPersonalYear(birthDate, year);
  const sum = py + reduceToSingle(month);
  return reduceToSingle(sum);
}

/** パーソナルデイナンバー */
export function calcPersonalDay(
  birthDate: string,
  year: number,
  month: number,
  day: number
): number {
  const pm = calcPersonalMonth(birthDate, year, month);
  const sum = pm + reduceToSingle(day);
  return reduceToSingle(sum);
}

// --- 解釈テキスト ---

const lifePathMeanings: Record<number, { title: string; strength: string; theme: string }> = {
  1: { title: "リーダー", strength: "開拓力・独立心・決断力", theme: "自分の道を切り開く" },
  2: { title: "調和者", strength: "共感力・協調性・繊細さ", theme: "人との調和を通じて輝く" },
  3: { title: "表現者", strength: "創造力・コミュニケーション・楽観性", theme: "自己表現を通じて喜びを広げる" },
  4: { title: "建設者", strength: "堅実さ・忍耐力・組織力", theme: "着実に土台を築く" },
  5: { title: "冒険家", strength: "自由・適応力・好奇心", theme: "変化を通じて成長する" },
  6: { title: "奉仕者", strength: "愛情・責任感・美的センス", theme: "愛と調和で人を支える" },
  7: { title: "探求者", strength: "分析力・直感力・精神性", theme: "真理を探究する" },
  8: { title: "達成者", strength: "実行力・経営力・豊かさ", theme: "物質と精神の豊かさを実現する" },
  9: { title: "完成者", strength: "包容力・理想主義・博愛", theme: "広い視野で世界に貢献する" },
  11: { title: "インスピレーター", strength: "霊感・直感・啓示力", theme: "高い理想で人を導く" },
  22: { title: "マスタービルダー", strength: "大きなビジョン・実現力・影響力", theme: "壮大な夢を形にする" },
  33: { title: "マスターヒーラー", strength: "無条件の愛・癒し・慈悲", theme: "深い愛で人類に奉仕する" },
};

const personalYearMeanings: Record<number, { theme: string; advice: string; caution: string }> = {
  1: { theme: "始まりの年", advice: "新しいことを始めるベストタイミング。種をまく年です", caution: "焦りすぎず、一歩ずつ進みましょう" },
  2: { theme: "忍耐と協力の年", advice: "人間関係を大切にし、じっくり育てる年です", caution: "結果を急がず、信頼関係を築きましょう" },
  3: { theme: "表現と創造の年", advice: "自分を表現し、楽しむことで運が開けます", caution: "エネルギーの分散に注意。焦点を絞って" },
  4: { theme: "土台づくりの年", advice: "基盤を固め、計画的に行動すると◎", caution: "無理をしすぎないよう、健康管理も大切に" },
  5: { theme: "変化と自由の年", advice: "新しい体験・出会いに積極的に飛び込んで", caution: "衝動的な決断は控え、変化を楽しむ余裕を" },
  6: { theme: "愛と責任の年", advice: "家庭や大切な人との関係が深まる年です", caution: "自分を犠牲にしすぎないよう、自分も大切に" },
  7: { theme: "内省と学びの年", advice: "自分と向き合い、知識を深めると大きな成長に", caution: "孤立しすぎず、信頼できる人と繋がりを" },
  8: { theme: "実りと達成の年", advice: "これまでの努力が形になるとき。大きく動いて◎", caution: "お金の管理をしっかりと。投資は慎重に" },
  9: { theme: "完成と手放しの年", advice: "不要なものを手放し、次のサイクルに備えて", caution: "過去にしがみつかず、感謝して卒業しましょう" },
  11: { theme: "霊的成長の年", advice: "直感に従い、スピリチュアルな学びを深めて", caution: "地に足をつけて、夢と現実のバランスを" },
  22: { theme: "大きな実現の年", advice: "大きなビジョンを形にできるとき。仲間を集めて", caution: "一人で抱えすぎず、周りの力を借りましょう" },
  33: { theme: "奉仕と癒しの年", advice: "周囲への深い愛と奉仕が自分にも返ってくる年", caution: "自分自身のケアも忘れずに" },
};

export function getLifePathMeaning(num: number, lang: Lang = "ja") {
  const table = lang === "ko" ? lifePathMeaningsKo : lifePathMeanings;
  return table[num] || table[reduceToSingle(num)] || table[9];
}

export function getPersonalYearMeaning(num: number, lang: Lang = "ja") {
  const table = lang === "ko" ? personalYearMeaningsKo : personalYearMeanings;
  return table[num] || table[reduceToSingle(num)] || table[1];
}

const personalMonthMeanings: Record<number, { theme: string; advice: string; caution: string }> = {
  1: { theme: "スタートの月", advice: "新しい挑戦を始めるのに最適。小さな一歩でも踏み出して", caution: "勢いだけで突き進まず、方向性を決めてから動きましょう" },
  2: { theme: "協力と調整の月", advice: "人との対話・パートナーシップを大切に。縁が育つ時期", caution: "迷いが出やすい月。決断は焦らず、信頼できる人に相談を" },
  3: { theme: "表現と楽しさの月", advice: "創作・発信・交流を活発に。喜びが運を呼ぶ時期です", caution: "浪費・気の緩みに注意。楽しみながらも目的を忘れずに" },
  4: { theme: "整理と積み上げの月", advice: "コツコツ作業・環境整備に向く月。土台を固めましょう", caution: "頑張りすぎて疲れやすい時期。休息とペース配分を意識して" },
  5: { theme: "変化と動きの月", advice: "新しい体験・出会いに飛び込んで◎。行動量が運を広げます", caution: "衝動的な決断は控えめに。変化を楽しむ余裕を持って" },
  6: { theme: "家庭と愛情の月", advice: "身近な人との時間、居場所を整える時期。温かさが循環します", caution: "抱え込みすぎに注意。自分のケアも忘れずに" },
  7: { theme: "内省と学びの月", advice: "静かに自分と向き合う時期。読書・研究・振り返りが吉", caution: "孤立感が出やすい月。無理に動かず、一人時間を大切に" },
  8: { theme: "実り・前進の月", advice: "成果が出やすい月。勝負所には積極的に動きましょう", caution: "お金や責任の扱いは丁寧に。強引さは避けて" },
  9: { theme: "手放しと完成の月", advice: "不要なものを整理し、次サイクルへの準備を。感謝の月です", caution: "終わりに執着しないで。新しいものは来月以降に" },
  11: { theme: "直感が冴える月", advice: "ひらめき・気づきを大切に。精神的な学びが深まります", caution: "現実感を失わないよう、地に足をつけて" },
  22: { theme: "大きく形にする月", advice: "ビジョンを具体化するチャンス。仲間と共に進めて◎", caution: "一人で抱えず、周囲を巻き込みましょう" },
  33: { theme: "愛と奉仕の月", advice: "周囲を支えることが自分の幸せに返ってくる月", caution: "自己犠牲にならないよう、自分自身のケアも優先して" },
};

// --- 韓国語辞書（多言語対応） ---
const lifePathMeaningsKo: Record<number, { title: string; strength: string; theme: string }> = {
  1: { title: "리더", strength: "개척력·독립심·결단력", theme: "자신의 길을 개척한다" },
  2: { title: "조화자", strength: "공감력·협조성·섬세함", theme: "사람과의 조화를 통해 빛난다" },
  3: { title: "표현자", strength: "창조력·커뮤니케이션·낙관성", theme: "자기표현을 통해 기쁨을 넓힌다" },
  4: { title: "건설자", strength: "견실함·인내력·조직력", theme: "착실하게 토대를 쌓는다" },
  5: { title: "모험가", strength: "자유·적응력·호기심", theme: "변화를 통해 성장한다" },
  6: { title: "봉사자", strength: "애정·책임감·미적 감각", theme: "사랑과 조화로 사람을 지지한다" },
  7: { title: "탐구자", strength: "분석력·직관력·정신성", theme: "진리를 탐구한다" },
  8: { title: "성취자", strength: "실행력·경영력·풍요", theme: "물질과 정신의 풍요를 실현한다" },
  9: { title: "완성자", strength: "포용력·이상주의·박애", theme: "넓은 시야로 세상에 공헌한다" },
  11: { title: "인스피레이터", strength: "영감·직관·계시력", theme: "높은 이상으로 사람을 이끈다" },
  22: { title: "마스터 빌더", strength: "큰 비전·실현력·영향력", theme: "웅대한 꿈을 형태로 만든다" },
  33: { title: "마스터 힐러", strength: "무조건적 사랑·치유·자비", theme: "깊은 사랑으로 인류에 봉사한다" },
};

const personalYearMeaningsKo: Record<number, { theme: string; advice: string; caution: string }> = {
  1: { theme: "시작의 해", advice: "새로운 것을 시작하기에 최적의 타이밍. 씨앗을 뿌리는 해입니다", caution: "조급해하지 말고 한 걸음씩 나아가요" },
  2: { theme: "인내와 협력의 해", advice: "인간관계를 소중히 하고 천천히 키우는 해입니다", caution: "결과를 서두르지 말고 신뢰 관계를 쌓아요" },
  3: { theme: "표현과 창조의 해", advice: "자신을 표현하고 즐기면 운이 열립니다", caution: "에너지 분산에 주의. 초점을 좁혀서" },
  4: { theme: "토대 만들기의 해", advice: "기반을 다지고 계획적으로 행동하면 ◎", caution: "무리하지 않도록 건강 관리도 중요하게" },
  5: { theme: "변화와 자유의 해", advice: "새로운 경험·만남에 적극적으로 뛰어들어요", caution: "충동적인 결단은 자제하고 변화를 즐기는 여유를" },
  6: { theme: "사랑과 책임의 해", advice: "가정이나 소중한 사람과의 관계가 깊어지는 해입니다", caution: "자신을 너무 희생하지 말고 자신도 소중히" },
  7: { theme: "성찰과 배움의 해", advice: "자신과 마주하고 지식을 깊이면 큰 성장으로", caution: "고립되지 말고 신뢰할 수 있는 사람과 연결을" },
  8: { theme: "결실과 성취의 해", advice: "지금까지의 노력이 형태가 될 때. 크게 움직여도 ◎", caution: "돈 관리를 확실히. 투자는 신중하게" },
  9: { theme: "완성과 내려놓음의 해", advice: "불필요한 것을 내려놓고 다음 사이클을 준비해요", caution: "과거에 집착하지 말고 감사하며 졸업해요" },
  11: { theme: "영적 성장의 해", advice: "직관을 따르고 영적인 배움을 깊이면", caution: "현실에 발을 딛고 꿈과 현실의 균형을" },
  22: { theme: "큰 실현의 해", advice: "큰 비전을 형태로 만들 수 있을 때. 동료를 모아서", caution: "혼자 떠안지 말고 주위의 힘을 빌려요" },
  33: { theme: "봉사와 치유의 해", advice: "주위를 향한 깊은 사랑과 봉사가 자신에게도 돌아오는 해", caution: "자기 자신의 케어도 잊지 말고" },
};

const personalMonthMeaningsKo: Record<number, { theme: string; advice: string; caution: string }> = {
  1: { theme: "시작의 달", advice: "새로운 도전을 시작하기에 최적. 작은 한 걸음이라도 내디뎌요", caution: "기세만으로 돌진하지 말고 방향을 정한 뒤 움직여요" },
  2: { theme: "협력과 조정의 달", advice: "사람과의 대화·파트너십을 소중히. 인연이 자라는 시기", caution: "망설임이 생기기 쉬운 달. 결단은 서두르지 말고 신뢰할 수 있는 사람과 상담을" },
  3: { theme: "표현과 즐거움의 달", advice: "창작·발신·교류를 활발히. 기쁨이 운을 부르는 시기입니다", caution: "낭비·긴장 완화에 주의. 즐기면서도 목적을 잊지 말고" },
  4: { theme: "정리와 축적의 달", advice: "꾸준한 작업·환경 정비에 맞는 달. 토대를 다져요", caution: "너무 애써서 지치기 쉬운 시기. 휴식과 페이스 배분을 의식해서" },
  5: { theme: "변화와 움직임의 달", advice: "새로운 경험·만남에 뛰어들어 ◎. 행동량이 운을 넓힙니다", caution: "충동적인 결단은 자제. 변화를 즐기는 여유를 가지고" },
  6: { theme: "가정과 애정의 달", advice: "가까운 사람과의 시간, 자리를 정돈하는 시기. 따뜻함이 순환합니다", caution: "너무 떠안지 않도록 주의. 자신의 케어도 잊지 말고" },
  7: { theme: "성찰과 배움의 달", advice: "조용히 자신과 마주하는 시기. 독서·연구·되돌아보기가 길", caution: "고립감이 들기 쉬운 달. 무리하지 말고 혼자만의 시간을 소중히" },
  8: { theme: "결실·전진의 달", advice: "성과가 나기 쉬운 달. 승부처에는 적극적으로 움직여요", caution: "돈이나 책임은 정중하게. 강압적임은 피해서" },
  9: { theme: "내려놓음과 완성의 달", advice: "불필요한 것을 정리하고 다음 사이클을 준비를. 감사의 달입니다", caution: "끝에 집착하지 말고. 새로운 것은 다음 달 이후에" },
  11: { theme: "직관이 예리해지는 달", advice: "영감·깨달음을 소중히. 정신적인 배움이 깊어집니다", caution: "현실감을 잃지 않도록 발을 땅에 딛고" },
  22: { theme: "크게 형태로 만드는 달", advice: "비전을 구체화할 기회. 동료와 함께 진행해 ◎", caution: "혼자 떠안지 말고 주위를 끌어들여요" },
  33: { theme: "사랑과 봉사의 달", advice: "주위를 지지하는 것이 자신의 행복으로 돌아오는 달", caution: "자기희생이 되지 않도록 자기 자신의 케어도 우선해서" },
};

export function getPersonalMonthMeaning(num: number, lang: Lang = "ja") {
  const table = lang === "ko" ? personalMonthMeaningsKo : personalMonthMeanings;
  return table[num] || table[reduceToSingle(num)] || table[1];
}

/** 年運の波（グラフ用）: 1-9のサイクルで高低を返す */
export function getYearWave(personalYear: number): number {
  const waveMap: Record<number, number> = {
    1: 60, 2: 40, 3: 70, 4: 50, 5: 80, 6: 65, 7: 45, 8: 90, 9: 55,
    11: 85, 22: 95, 33: 75,
  };
  return waveMap[personalYear] ?? 50;
}

/** 月運の波（グラフ用） */
export function getPersonalMonthWave(personalMonth: number): number {
  const waveMap: Record<number, number> = {
    1: 60, 2: 40, 3: 70, 4: 50, 5: 80, 6: 65, 7: 45, 8: 90, 9: 55,
    11: 85, 22: 95, 33: 75,
  };
  return waveMap[personalMonth] ?? 50;
}

export interface NumerologyResult {
  lifePathNumber: number;
  lifePathMeaning: { title: string; strength: string; theme: string };
  birthdayNumber: number;
  personalYear: number;
  personalYearMeaning: { theme: string; advice: string; caution: string };
  personalMonth: number;
  personalDay: number;
}

export function calcNumerology(
  birthDate: string,
  today: Date = new Date(),
  lang: Lang = "ja"
): NumerologyResult {
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const lifePathNumber = calcLifePathNumber(birthDate);
  const personalYear = calcPersonalYear(birthDate, year);

  return {
    lifePathNumber,
    lifePathMeaning: getLifePathMeaning(lifePathNumber, lang),
    birthdayNumber: calcBirthdayNumber(birthDate),
    personalYear,
    personalYearMeaning: getPersonalYearMeaning(personalYear, lang),
    personalMonth: calcPersonalMonth(birthDate, year, month),
    personalDay: calcPersonalDay(birthDate, year, month, day),
  };
}
