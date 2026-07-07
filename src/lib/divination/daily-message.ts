/**
 * 今日のメッセージ・注意点を生成する
 *
 * 数秘術のパーソナルデイ、マヤ暦の今日のKIN、九星気学を
 * 組み合わせて、「推進」と「注意」の2軸でメッセージを生成する。
 *
 * 多言語対応: `lang` を渡すとメッセージ本文・注意点・出典を各言語で返す。
 * 未指定なら日本語（既存挙動を維持）。
 */

import type { Lang } from "@/lib/i18n/dict";
import { calcNumerology } from "./numerology";
import { calcTodayMayan } from "./mayan";
import { calcNineStar } from "./nine-star";

const dailyMessages: Record<number, { message: string; caution: string }> = {
  1: { message: "新しいことを始めるのに最適な日。直感に従って一歩踏み出して", caution: "周りの意見を聞く余裕も忘れずに" },
  2: { message: "人との繋がりが大切な日。協力や相談がスムーズに進みます", caution: "優柔不断になりやすいので、最後は自分で決めて" },
  3: { message: "創造力が高まる日。アイデアが湧いてくるのでメモを忘れずに", caution: "楽しいことに流されすぎないよう、優先順位を意識して" },
  4: { message: "地道な作業が実を結ぶ日。コツコツ進めることで大きな成果に", caution: "完璧を求めすぎると進まない。8割で進めてOK" },
  5: { message: "変化やサプライズがありそうな日。柔軟に対応すると◎", caution: "衝動的な買い物や約束は少し冷静に" },
  6: { message: "家族や大切な人との時間が充実する日。感謝を伝えて", caution: "他人のことばかりでなく、自分のケアも大切に" },
  7: { message: "内省と学びの日。読書や一人の時間が有意義に", caution: "考えすぎると動けなくなる。直感を信じて" },
  8: { message: "パワーと実行力が高まる日。大きな決断や交渉に◎", caution: "押しが強くなりがち。相手への配慮を忘れずに" },
  9: { message: "人のために動くと運気アップ。ボランティア精神で過ごして", caution: "感情的になりやすい日。冷静さを心がけて" },
  11: { message: "直感が冴え渡る特別な日。ひらめきを大切にして", caution: "理想が高くなりすぎるかも。地に足をつけて" },
  22: { message: "大きなビジョンを形にできる日。スケールの大きな行動を", caution: "一人で抱え込まず、チームで動きましょう" },
  33: { message: "深い愛と慈悲の日。周囲への奉仕が巡り巡って返ってきます", caution: "自己犠牲になりすぎないよう注意して" },
};

const dailyMessagesKo: Record<number, { message: string; caution: string }> = {
  1: { message: "새로운 일을 시작하기에 최적의 날. 직감에 따라 한 걸음 내디뎌요", caution: "주변의 의견을 들을 여유도 잊지 말고" },
  2: { message: "사람과의 연결이 소중한 날. 협력이나 상담이 순조롭게 진행됩니다", caution: "우유부단해지기 쉬우니 마지막은 스스로 결정해요" },
  3: { message: "창의력이 높아지는 날. 아이디어가 떠오르니 메모를 잊지 말고", caution: "즐거운 일에 너무 휩쓸리지 않도록 우선순위를 의식해서" },
  4: { message: "꾸준한 작업이 결실을 맺는 날. 차근차근 진행하면 큰 성과로", caution: "완벽을 너무 추구하면 진행되지 않아요. 80%로 진행해도 OK" },
  5: { message: "변화나 서프라이즈가 있을 것 같은 날. 유연하게 대응하면 ◎", caution: "충동적인 쇼핑이나 약속은 조금 냉정하게" },
  6: { message: "가족이나 소중한 사람과의 시간이 충실해지는 날. 감사를 전해요", caution: "타인만 생각하지 말고 자신의 케어도 소중히" },
  7: { message: "성찰과 배움의 날. 독서나 혼자만의 시간이 의미 있게", caution: "너무 생각하면 움직일 수 없어요. 직감을 믿고" },
  8: { message: "파워와 실행력이 높아지는 날. 큰 결단이나 협상에 ◎", caution: "밀어붙임이 강해지기 쉬워요. 상대에 대한 배려를 잊지 말고" },
  9: { message: "남을 위해 움직이면 운기 상승. 봉사 정신으로 보내요", caution: "감정적이 되기 쉬운 날. 냉정함을 유지해요" },
  11: { message: "직감이 예리해지는 특별한 날. 영감을 소중히 해요", caution: "이상이 너무 높아질 수 있어요. 현실에 발을 딛고" },
  22: { message: "큰 비전을 형태로 만들 수 있는 날. 스케일 큰 행동을", caution: "혼자 떠안지 말고 팀으로 움직여요" },
  33: { message: "깊은 사랑과 자비의 날. 주위를 향한 봉사가 돌고 돌아 돌아옵니다", caution: "자기희생이 너무 되지 않도록 주의해요" },
};

/** マヤ暦の紋章カラーに基づく追加メッセージ */
const mayanColorBoost: Record<string, string> = {
  赤: "。情熱とエネルギーが後押ししてくれます",
  白: "。心を清らかに保つと良いことが起きそう",
  青: "。変容の力が味方してくれる日です",
  黄: "。明るさと知恵が光る一日になりそう",
};

const mayanColorBoostKo: Record<string, string> = {
  赤: " 열정과 에너지가 뒤에서 밀어줍니다",
  白: " 마음을 맑게 유지하면 좋은 일이 생길 것 같아요",
  青: " 변용의 힘이 편이 되어주는 날입니다",
  黄: " 밝음과 지혜가 빛나는 하루가 될 것 같아요",
};

/** 方位・紋章・本命星の韓国語表記（エンジンは日本語を正としてキーに使う） */
const directionKo: Record<string, string> = {
  北: "북", 南: "남", 東: "동", 西: "서",
  北東: "북동", 北西: "북서", 南東: "남동", 南西: "남서", 中央: "중앙",
};

const mayanSealKo: Record<string, string> = {
  赤い竜: "붉은 용", 白い風: "하얀 바람", 青い夜: "파란 밤", 黄色い種: "노란 씨앗",
  赤い蛇: "붉은 뱀", 白い世界の橋渡し: "하얀 세계의 다리", 青い手: "파란 손", 黄色い星: "노란 별",
  赤い月: "붉은 달", 白い犬: "하얀 개", 青い猿: "파란 원숭이", 黄色い人: "노란 사람",
  赤い空歩く人: "붉은 하늘을 걷는 사람", 白い魔法使い: "하얀 마법사", 青い鷲: "파란 독수리", 黄色い戦士: "노란 전사",
  赤い地球: "붉은 지구", 白い鏡: "하얀 거울", 青い嵐: "파란 폭풍", 黄色い太陽: "노란 태양",
};

const nineStarKo: Record<string, string> = {
  一白水星: "일백수성", 二黒土星: "이흑토성", 三碧木星: "삼벽목성", 四緑木星: "사록목성",
  五黄土星: "오황토성", 六白金星: "육백금성", 七赤金星: "칠적금성", 八白土星: "팔백토성", 九紫火星: "구자화성",
};

export interface DailyMessage {
  message: string;
  caution: string;
  source: string;
}

export function generateDailyMessage(
  birthDate: string,
  today: Date = new Date(),
  lang: Lang = "ja"
): DailyMessage {
  const numerology = calcNumerology(birthDate, today, lang);
  const todayMayan = calcTodayMayan(today);
  const nineStar = calcNineStar(birthDate, today.getFullYear());

  const personalDay = numerology.personalDay;
  const isKo = lang === "ko";
  const table = isKo ? dailyMessagesKo : dailyMessages;
  const base = table[personalDay] || table[1];

  // マヤ暦の色でメッセージを補強
  const colorTable = isKo ? mayanColorBoostKo : mayanColorBoost;
  const colorBoost = colorTable[todayMayan.solarSeal.color] || "";

  // 九星気学の吉方位をメッセージに追加
  const luckyDir = nineStar.luckyDirections[0];
  let directionHint = "";
  if (luckyDir) {
    directionHint = isKo
      ? ` 길방위는 ${directionKo[luckyDir] ?? luckyDir} 방면`
      : `。吉方位は${luckyDir}方面`;
  }

  const sealName = isKo
    ? mayanSealKo[todayMayan.solarSeal.name] ?? todayMayan.solarSeal.name
    : todayMayan.solarSeal.name;
  const starName = isKo
    ? nineStarKo[nineStar.honmeisei.name] ?? nineStar.honmeisei.name
    : nineStar.honmeisei.name;
  const source = isKo
    ? `수비학 퍼스널데이 ${personalDay} · ${sealName} · ${starName}`
    : `数秘パーソナルデイ${personalDay}・${sealName}・${starName}`;

  return {
    message: base.message + colorBoost + directionHint,
    caution: base.caution,
    source,
  };
}
