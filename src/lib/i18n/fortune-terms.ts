/**
 * 占術用語の共通辞書（多言語）
 *
 * マヤ暦の紋章・色・方位・九星・五行など、複数の画面／エンジンで
 * 使い回す「固有名詞」の日本語→韓国語変換をここに集約する。
 * エンジンは日本語表記を正（キー）とし、表示時に各画面が変換する。
 */

import type { Lang } from "./dict";

/** マヤ暦・太陽の紋章（20） */
export const MAYAN_SEAL_KO: Record<string, string> = {
  赤い竜: "붉은 용", 白い風: "하얀 바람", 青い夜: "파란 밤", 黄色い種: "노란 씨앗",
  赤い蛇: "붉은 뱀", 白い世界の橋渡し: "하얀 세계의 다리", 青い手: "파란 손", 黄色い星: "노란 별",
  赤い月: "붉은 달", 白い犬: "하얀 개", 青い猿: "파란 원숭이", 黄色い人: "노란 사람",
  赤い空歩く人: "붉은 하늘을 걷는 사람", 白い魔法使い: "하얀 마법사", 青い鷲: "파란 독수리", 黄色い戦士: "노란 전사",
  赤い地球: "붉은 지구", 白い鏡: "하얀 거울", 青い嵐: "파란 폭풍", 黄色い太陽: "노란 태양",
};

/** 色名 */
export const COLOR_KO: Record<string, string> = {
  赤: "빨강", 白: "하양", 青: "파랑", 黄: "노랑", 緑: "초록",
  紫: "보라", オレンジ: "주황", ピンク: "분홍", 金: "금색", 黒: "검정",
};

/** 方位（八方位＋中央） */
export const DIRECTION_KO: Record<string, string> = {
  北: "북", 北東: "북동", 東: "동", 南東: "남동",
  南: "남", 南西: "남서", 西: "서", 北西: "북서", 中央: "중앙",
};

/** 九星の名称（9） */
export const NINE_STAR_KO: Record<string, string> = {
  一白水星: "일백수성", 二黒土星: "이흑토성", 三碧木星: "삼벽목성", 四緑木星: "사록목성",
  五黄土星: "오황토성", 六白金星: "육백금성", 七赤金星: "칠적금성", 八白土星: "팔백토성", 九紫火星: "구자화성",
};

/** 五行 */
export const ELEMENT_KO: Record<string, string> = {
  木: "목(木)", 火: "화(火)", 土: "토(土)", 金: "금(金)", 水: "수(水)",
};

/** マヤ暦・太陽の紋章キーワード（20） */
export const MAYAN_SEAL_KEYWORD_KO: Record<string, string> = {
  "誕生・育む・存在": "탄생·기름·존재",
  "伝える・呼吸・精神": "전달·호흡·정신",
  "夢見る・豊かさ・直感": "꿈꾸기·풍요·직관",
  "開花・目覚め・気づき": "개화·각성·깨달음",
  "本能・情熱・生命力": "본능·열정·생명력",
  "つなぐ・死と再生・機会": "잇기·죽음과 재생·기회",
  "癒し・知る・遂行": "치유·앎·수행",
  "美・芸術・調和": "미·예술·조화",
  "浄化・新しい流れ・水": "정화·새로운 흐름·물",
  "忠誠・ハート・愛": "충성·하트·사랑",
  "遊び・魔術・幻想": "놀이·마술·환상",
  "自由意志・知恵・影響": "자유의지·지혜·영향",
  "探求・空間・目覚め": "탐구·공간·각성",
  "魔法・永遠・受容": "마법·영원·수용",
  "ビジョン・創造・心眼": "비전·창조·심안",
  "挑戦・知性・大胆さ": "도전·지성·대담함",
  "シンクロ・舵取り・進化": "싱크로·방향키·진화",
  "映し出す・秩序・終わりなき": "비추기·질서·끝없음",
  "変容・エネルギー・触発": "변용·에너지·촉발",
  "円満・太陽の力・生命": "원만·태양의 힘·생명",
};

/** マヤ暦・銀河の音の名前（13） */
export const MAYAN_TONE_NAME_KO: Record<string, string> = {
  磁気: "자기", 月: "달", 電気: "전기", 自己存在: "자기존재", 倍音: "배음",
  律動: "율동", 共振: "공진", 銀河: "은하", 太陽: "태양", 惑星: "행성",
  スペクトル: "스펙트럼", 水晶: "수정", 宇宙: "우주",
};

/** マヤ暦・銀河の音のキーワード（13） */
export const MAYAN_TONE_KEYWORD_KO: Record<string, string> = {
  目的を引きつける: "목적을 끌어당긴다",
  挑戦を安定させる: "도전을 안정시킨다",
  奉仕を活性化する: "봉사를 활성화한다",
  形を明確にする: "형태를 명확히 한다",
  力を与える: "힘을 준다",
  組織化する: "조직화한다",
  調律する: "조율한다",
  調和させる: "조화시킨다",
  脈動させる: "맥동시킨다",
  生み出す: "만들어낸다",
  解き放つ: "풀어놓는다",
  捧げる: "바친다",
  超越する: "초월한다",
};

function tr(map: Record<string, string>, ja: string, lang: Lang): string {
  return lang === "ko" ? map[ja] ?? ja : ja;
}

export const mayanSealName = (ja: string, lang: Lang = "ja") => tr(MAYAN_SEAL_KO, ja, lang);
export const mayanSealKeyword = (ja: string, lang: Lang = "ja") => tr(MAYAN_SEAL_KEYWORD_KO, ja, lang);
export const mayanToneName = (ja: string, lang: Lang = "ja") => tr(MAYAN_TONE_NAME_KO, ja, lang);
export const mayanToneKeyword = (ja: string, lang: Lang = "ja") => tr(MAYAN_TONE_KEYWORD_KO, ja, lang);
export const colorName = (ja: string, lang: Lang = "ja") => tr(COLOR_KO, ja, lang);
export const directionName = (ja: string, lang: Lang = "ja") => tr(DIRECTION_KO, ja, lang);
export const nineStarName = (ja: string, lang: Lang = "ja") => tr(NINE_STAR_KO, ja, lang);
export const elementName = (ja: string, lang: Lang = "ja") => tr(ELEMENT_KO, ja, lang);
