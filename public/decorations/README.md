# 水彩装飾イラストの置き場所

ここに下記ファイル名で画像を置くと、ホーム画面の各カードに水彩イラストが表示されます。
ファイルが無い場合は何も表示されません（レイアウトは崩れません）。

## 必要なファイル

| ファイル名 | 使われる場所 | 推奨サイズ | 内容のイメージ |
|---|---|---|---|
| `moon-stars.png` | 「はじめての方へ」カード右上 | 約 400×400px | 三日月＋星のきらめき |
| `moon.png` | 「今日のメッセージ」カード右上 | 約 360×360px | 満月／惑星（水彩） |
| `leaf.png` | 「今日のメッセージ」右下 | 約 300×300px | 植物・葉（水彩） |
| `leaf2.png` | 「今日の注意点」右下 | 約 360×360px | 植物・葉（水彩・淡め） |
| `sparkle.png` | 「ラッキー情報」右上 | 約 80×80px | 小さなきらめき（任意） |

## 仕様

- **形式**: PNG（背景透過）を推奨。SVG でも可。
- **背景**: 必ず透過にしてください（白背景だとカードが四角く見えてしまいます）。
- **色味**: アプリのテーマに合わせ **オレンジ／ゴールド／クリーム** 系の水彩で。
  （参考画像は紫系でしたが、本アプリはオレンジ基調です）
- **容量**: 1枚あたり 200KB 以下が目安（表示が軽くなります）。

## 画像生成AIで作る場合のプロンプト例（コピペ用）

> watercolor illustration of a crescent moon and tiny sparkling stars,
> soft warm orange and gold tones, cream/beige palette, delicate, elegant,
> transparent background, isolated, no text, hand-painted style

`crescent moon and stars` の部分を `full moon / planet`、`botanical leaves and branches` などに
置き換えると、各ファイル用のイラストが作れます。生成後、上の表のファイル名で保存してここに置いてください。
