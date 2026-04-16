/**
 * 今日のメッセージ・注意点を生成する
 *
 * 数秘術のパーソナルデイ、マヤ暦の今日のKIN、九星気学を
 * 組み合わせて、「推進」と「注意」の2軸でメッセージを生成する。
 */

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

/** マヤ暦の紋章カラーに基づく追加メッセージ */
const mayanColorBoost: Record<string, string> = {
  赤: "。情熱とエネルギーが後押ししてくれます",
  白: "。心を清らかに保つと良いことが起きそう",
  青: "。変容の力が味方してくれる日です",
  黄: "。明るさと知恵が光る一日になりそう",
};

export interface DailyMessage {
  message: string;
  caution: string;
  source: string;
}

export function generateDailyMessage(birthDate: string, today: Date = new Date()): DailyMessage {
  const numerology = calcNumerology(birthDate, today);
  const todayMayan = calcTodayMayan(today);
  const nineStar = calcNineStar(birthDate, today.getFullYear());

  const personalDay = numerology.personalDay;
  const base = dailyMessages[personalDay] || dailyMessages[1];

  // マヤ暦の色でメッセージを補強
  const colorBoost = mayanColorBoost[todayMayan.solarSeal.color] || "";

  // 九星気学の吉方位をメッセージに追加
  const directionHint =
    nineStar.luckyDirections.length > 0
      ? `。吉方位は${nineStar.luckyDirections[0]}方面`
      : "";

  return {
    message: base.message + colorBoost + directionHint,
    caution: base.caution,
    source: `数秘パーソナルデイ${personalDay}・${todayMayan.solarSeal.name}・${nineStar.honmeisei.name}`,
  };
}
