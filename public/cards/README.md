# オラクルカードの絵柄画像の置き場所

ここに `01.png`〜`36.png` の名前で画像を置くと、その番号のカードに表示されます。
**置いてあるカードだけ画像になり、無いカードは自動で絵文字カードになります**（崩れません）。
アプリ側のコードを編集する必要はありません。フォルダに入れるだけです。

- ファイル名: `01.png`, `02.png` … `36.png`（2桁ゼロ埋め）
- 形式: PNG（または JPG を `.png` 名で。透過は不要）
- 推奨: 縦長（カード①は 1024×1536）。横幅 720px 程度に縮小すると軽くて綺麗です。
- 容量: 1枚 500KB 以下が目安

カード①（`01.png`）は見本として設定済みです。

---

## 文字（番号・カード名・メッセージ）について

カード①のように**文字まで画像に焼き込む**方法と、**絵だけ用意してアプリが文字を載せる**方法があります。
画像生成AIは日本語の文字が崩れやすいので、**「絵だけ生成 → 文字はアプリ側で表示」**が確実できれいです。
この方式にしたい場合は伝えてください（アプリにカード枠＋文字レイヤーを追加します）。

---

## 36枚ぶん 画像生成プロンプト（コピペ用）

各行の「シーン」を下の【共通スタイル】の前に入れて生成してください。

【共通スタイル】（末尾に付ける）
> soft watercolor illustration, warm golden-hour light, cream and gold color palette,
> delicate flowers, sparkling light particles, dreamy and ethereal, elegant ornate gold
> art-nouveau border frame, portrait orientation, highly detailed, no text

| # | カード名 | シーン（プロンプト先頭に入れる英語） |
|---|---|---|
| 01 | 流れに乗る | a shining river winding through misty golden mountains at sunrise, wildflowers |
| 02 | 光を信じる | radiant golden light beams bursting from the center, a warm sun, hopeful |
| 03 | 整える | a balanced stack of smooth zen stones, cherry blossoms, calm and serene |
| 04 | 出会い | a stone archway gate covered in blooming flowers, soft light beyond |
| 05 | 変化を楽しむ | delicate butterflies fluttering upward among flowers, transformation |
| 06 | 手放し | a dandelion releasing glowing seeds into the wind, letting go |
| 07 | 豊かさの受け取り | an ornate golden chalice overflowing with light, abundance |
| 08 | 自分を知る | an antique hand mirror reflecting a starry sky, self-discovery |
| 09 | 使命を思い出す | an open ancient book glowing with golden light, destiny |
| 10 | 根を大切にする | a majestic tree with deep glowing golden roots, family and roots |
| 11 | 努力は実る | a path of light climbing a mountain toward a bright star, effort rewarded |
| 12 | 信頼する | a golden compass glowing softly, trust and direction |
| 13 | 学びの時 | a lit candle beside a stack of old books, learning |
| 14 | タイミングを見る | an elegant hourglass with golden sand, timing |
| 15 | 自由を選ぶ | a white dove flying freely across a bright sky, freedom |
| 16 | 直感を信じる | a crescent moon over a tranquil river at night, intuition |
| 17 | 表現する | a feather quill pen and an inkwell, self-expression |
| 18 | 自信を育てる | a noble white lion sitting calmly, confidence |
| 19 | バランスをとる | a golden balance scale, harmony and balance |
| 20 | 行動する | a silhouette of a person running toward the dawn, taking action |
| 21 | 可能性を信じる | a brilliant shining star above mountain ranges, infinite possibility |
| 22 | 宇宙とつながる | a beautiful spiral galaxy in deep space, cosmic connection |
| 23 | 感謝する | a glowing heart surrounded by blooming flowers, gratitude |
| 24 | 浄化する | a clear waterfall in a lush green forest, purification |
| 25 | リズムに乗る | the phases of the moon in a starry sky, cosmic rhythm |
| 26 | 夢を描く | a person standing under a vast starry sky, dreaming |
| 27 | 許す | a gentle white dove with soft light, forgiveness |
| 28 | 今を楽しむ | colorful hot-air balloons floating in a bright sky, joy of now |
| 29 | 才能を活かす | a glowing lotus crystal gem, talent |
| 30 | リーダーシップ | a radiant golden crown, leadership |
| 31 | 直感と理性の調和 | two faces of sun and moon merged in harmony, balance of heart and mind |
| 32 | 努力を続ける | a staircase of light ascending, lined with flowers, perseverance |
| 33 | 人間関係を大切に | two hands holding a glowing heart, relationships |
| 34 | 境界線を引く | a flowering garden gate, healthy boundaries |
| 35 | 未来を創る | a person looking through a telescope at the stars, creating the future |
| 36 | すべてはうまくいっている | radiant rainbow light beaming from the center, blessing, everything is well |
