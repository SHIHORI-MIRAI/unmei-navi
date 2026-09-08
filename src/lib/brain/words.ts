/**
 * ことば並べかえ用の単語バンク
 *
 * - すべてひらがな。小さい文字（っ・ゃゅょ）は使わない。
 *   タイルに並べたとき読みづらく、答えが割れてしまうため。
 * - 文字数でレベル分けするので、各文字数に十分な数を用意する。
 */

export interface BrainWord {
  word: string;
  hint: string;
}

export const WORDS: BrainWord[] = [
  // 3文字
  { word: "さくら", hint: "春の花" },
  { word: "いちご", hint: "果物" },
  { word: "みかん", hint: "果物" },
  { word: "たまご", hint: "食べもの" },
  { word: "くるま", hint: "乗りもの" },
  { word: "うさぎ", hint: "動物" },
  { word: "きりん", hint: "動物" },
  { word: "さかな", hint: "生きもの" },
  { word: "ひかり", hint: "自然" },
  { word: "みどり", hint: "色" },
  { word: "こころ", hint: "気持ち" },
  { word: "つくえ", hint: "家具" },
  { word: "えほん", hint: "本" },
  { word: "たいこ", hint: "楽器" },
  { word: "ゆびわ", hint: "みにつけるもの" },

  // 4文字
  { word: "えんぴつ", hint: "文房具" },
  { word: "ひまわり", hint: "夏の花" },
  { word: "ひこうき", hint: "乗りもの" },
  { word: "ともだち", hint: "人" },
  { word: "てぶくろ", hint: "冬の小もの" },
  { word: "くだもの", hint: "食べもの" },
  { word: "みずうみ", hint: "自然" },
  { word: "あじさい", hint: "梅雨の花" },
  { word: "おりがみ", hint: "あそび" },
  { word: "ふうりん", hint: "夏の風物" },
  { word: "にじいろ", hint: "色" },
  { word: "ほしぞら", hint: "夜の空" },
  { word: "たけのこ", hint: "春の味" },
  { word: "あさがお", hint: "夏の花" },

  // 5文字
  { word: "かたつむり", hint: "生きもの" },
  { word: "さくらんぼ", hint: "果物" },
  { word: "ゆきだるま", hint: "冬のあそび" },
  { word: "こいのぼり", hint: "5月の風物" },
  { word: "たからもの", hint: "大切なもの" },
  { word: "ものがたり", hint: "本" },
  { word: "あまのがわ", hint: "夏の夜空" },
  { word: "くもりぞら", hint: "天気" },
  { word: "はるのかぜ", hint: "季節のことば" },

  // 6文字
  { word: "とうもろこし", hint: "野菜" },
  { word: "まほうつかい", hint: "物語の人" },
  { word: "はるのひざし", hint: "季節のことば" },
  { word: "かぜのたより", hint: "たよりのことば" },
  { word: "ゆうやけぞら", hint: "夕方の空" },
  { word: "つきよのうみ", hint: "夜の景色" },
  { word: "ほしのかけら", hint: "空のことば" },

  // 7文字
  { word: "つきよのうさぎ", hint: "物語のことば" },
  { word: "にじのかけはし", hint: "空のことば" },
  { word: "ふゆのあしおと", hint: "季節のことば" },
  { word: "あきのおとずれ", hint: "季節のことば" },
  { word: "はるかぜのおと", hint: "季節のことば" },
  { word: "やまのいただき", hint: "自然のことば" },
  { word: "みずたまもよう", hint: "もようの名前" },
];

/** レベル別のねらい文字数（該当がなければ近い長さで補う） */
export const LEVEL_WORD_LENGTH = [3, 4, 5, 6, 7];

export function wordsOfLength(len: number): BrainWord[] {
  return WORDS.filter((w) => w.word.length === len);
}
