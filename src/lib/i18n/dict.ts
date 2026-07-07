/**
 * 多言語辞書（UI文言）
 *
 * - `ja` を正（型の元）とし、`ko` は同じキーを必ず持つよう TypeScript で担保する。
 * - 値は文字列テンプレート。`{name}` のプレースホルダは `t(key, { name })` で置換する。
 * - 占術エンジンが生成する動的テキスト（今日のメッセージ本文など）は各エンジン側で
 *   言語対応する。ここにあるのは画面の「見出し・ラベル・ボタン」などの静的文言。
 */

export type Lang = "ja" | "ko";

/** 言語セレクターの選択肢（表示順） */
export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "ja", label: "日本語", short: "日" },
  { code: "ko", label: "한국어", short: "한" },
];

const ja = {
  // 共通
  "common.close": "閉じる",
  "common.cancel": "キャンセル",
  "common.save": "保存",
  "common.edit": "編集",
  "common.delete": "削除",
  "common.add": "追加",
  "common.new": "NEW",
  "common.calculating": "計算中...",
  "common.disclaimer":
    "※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。",

  // 言語
  "lang.label": "言語 / Language / 언어",

  // ナビ
  "nav.home": "ホーム",
  "nav.fortune": "運勢",
  "nav.goal": "目標",
  "nav.strength": "強み",
  "nav.diary": "日記",

  // ヘッダー
  "header.targets": "対象者",
  "header.settings": "設定",

  // ホーム（ウェルカム）
  "home.welcome.greeting": "ようこそ、運命ナビへ",
  "home.welcome.title":
    "まずはプロフィールを設定して、あなただけの占い結果を受け取りましょう",
  "home.welcome.cta": "プロフィールを設定する",
  "home.benefit.star": "あなただけの\n運勢をお届け",
  "home.benefit.moon": "毎日をより良く\nするヒントに",
  "home.benefit.book": "人生の選択に\n自信が持てる",
  "home.benefit.crystal": "未来を味方に\nつけましょう",

  // ホーム（ガイドバナー）
  "home.guide.title": "はじめての方へ",
  "home.guide.body":
    "個人で楽しむ使い方と、結婚相談所などの業務で使う方法を、ガイドにまとめました。",
  "home.guide.cta": "使い方ガイドを見る →",

  // ホーム（本体）
  "home.todayMessage": "今日のメッセージ",
  "home.todayCaution": "今日の注意点",
  "home.lucky.color": "ラッキーカラー",
  "home.lucky.number": "ラッキーナンバー",
  "home.lucky.direction": "吉方位",
  "home.lucky.moon": "月齢",
  "home.year.title": "今年のテーマ（数秘術）",
  "home.year.personalYear": "パーソナルイヤー",
  "home.seeDetails": "各占術の詳細を見る →",

  "home.astro.subtitle": "星が輝く土地を世界地図で・目的別ランキング",
  "home.life.title": "人生の棚卸し",
  "home.life.subtitle": "出来事を時系列に・星と運気を重ねて自分を知る",
  "home.manual.title": "わたしの取扱説明書",
  "home.manual.subtitle": "全占術を1つに・強み/充電法/取扱注意/他己紹介",

  "home.menu.yearly.title": "年運詳細",
  "home.menu.yearly.subtitle": "今年・来年の流れ",
  "home.menu.monthly.title": "月の運勢",
  "home.menu.monthly.subtitle": "毎月のテーマ",
  "home.menu.compat.title": "相性診断",
  "home.menu.compat.subtitle": "2人を選んで詳しく",
  "home.menu.matrix.title": "相性マトリックス",
  "home.menu.matrix.subtitle": "全員クロス・ランキング",
  "home.menu.oracle.title": "オラクルカード",
  "home.menu.oracle.subtitle": "今日のメッセージを1枚",

  "home.footer.guide": "使い方ガイド",
  "home.footer.terms": "利用規約",
  "home.footer.privacy": "プライバシーポリシー",

  // プロフィール
  "profile.title": "プロフィール設定",
  "profile.backup.recommendedWithDate":
    "バックアップ推奨：最後のエクスポートから{days}日経過",
  "profile.backup.notYet": "まだバックアップしていません",
  "profile.backup.doneDaysAgo": "バックアップ済み（{days}日前）",
  "profile.backup.storageNote":
    "データはこの端末のブラウザ内に保存されます。別の端末では見えません。ブラウザのデータが消えると失われます。定期的に下の「エクスポート」でバックアップしてください。",
  "profile.backup.counts":
    "現在の保存数：プロフィール{profiles}件・日記{diary}件・ゴール{goals}件・鑑定{readings}件",
  "profile.usage.label": "使用容量",
  "profile.usage.alert":
    "⚠ 容量がほぼ満杯です。新しい保存に失敗する可能性があります。エクスポート後に古い鑑定結果（画像つき）を削除してください。",
  "profile.usage.warn":
    "容量が80%を超えました。早めにエクスポートして、不要なデータの整理をおすすめします。",
  "profile.external.title": "別の画面でデータが更新されました",
  "profile.external.body":
    "別のタブやスマホでこのアプリを開いて編集した可能性があります。このまま保存すると、そちらの変更を上書きしてしまいます。一度ページを再読込して最新の状態を確認してください。",
  "profile.external.reload": "再読込する",
  "profile.external.later": "あとで",
  "profile.saveError.title": "保存できませんでした",
  "profile.saveError.quota":
    "保存に失敗しました。ブラウザの容量上限に達した可能性があります。下の「エクスポート」で現在のデータをバックアップしたあと、不要な鑑定結果（特に画像つき）を /readings から削除してから再度お試しください。",
  "profile.saveError.notVerified":
    "保存処理は完了しましたが、再読込したらデータが反映されていませんでした。プライベートブラウズ／シークレットモードを使っていないかご確認ください。今すぐ「エクスポート」でバックアップを取ることをおすすめします。",
  "profile.list.registered": "登録済みの人",
  "profile.list.add": "+ 追加",
  "profile.badge.self": "自分",
  "profile.badge.family": "家族",
  "profile.badge.client": "顧客",
  "profile.badge.student": "受講生",
  "profile.badge.showing": "表示中",
  "profile.name.unset": "名前未設定",
  "profile.btn.switch": "切替",
  "profile.empty.prompt":
    "まずはプロフィールを設定して、占い結果を受け取りましょう",
  "profile.empty.cta": "プロフィールを設定する",
  "profile.form.editing": "プロフィールを編集",
  "profile.form.addNew": "新しい人を追加",
  "profile.form.categoryLabel": "種別",
  "profile.form.categoryNote":
    "「受講生」「顧客」のいずれかを選ぶと 対象者一覧 に表示され、伴走アドバイスが見られます",
  "profile.form.genderLabel": "性別（相性マトリックスで使用、任意）",
  "profile.gender.female": "女性",
  "profile.gender.male": "男性",
  "profile.gender.other": "未設定",
  "profile.form.nameLabel": "お名前（ニックネームでもOK）",
  "profile.form.namePlaceholder": "例：はなこ",
  "profile.form.birthDateLabel": "生年月日",
  "profile.form.required": "*必須",
  "profile.form.birthTimeLabel": "出生時間（わかれば）",
  "profile.form.birthTimeNote":
    "四柱推命の時柱と、アストロマップ（星が輝く土地）の精度に影響します。母子手帳・出生届の控えに記載があることが多いです。わからない場合は空欄でOK（アストロマップの地図は非表示になります）。",
  "profile.form.birthPlaceLabel": "出生地（わかれば）",
  "profile.form.birthPlacePlaceholder": "例：東京都",
  "profile.form.studentMemoLabel": "受講生メモ",
  "profile.form.studentMemoPlaceholder":
    "例：1月入講、月3回個別セッション、ゴールは独立開業",
  "profile.form.studentMemoNote":
    "進捗・面談メモなど、伴走に必要な情報を残せます",
  "profile.form.saved": "✓ 保存しました！",
  "profile.form.update": "更新してホームへ",
  "profile.form.save": "保存してホームへ",
  "profile.delete.confirm":
    "「{name}」を削除しますか？\n\n※ 削除したデータは元に戻せません。念のため「エクスポート」でバックアップしてからの削除をおすすめします。",
  "profile.delete.fallbackName": "このプロフィール",
  "profile.data.title": "データ管理",
  "profile.data.desc":
    "全てのプロフィール・日記・ゴール・鑑定結果をJSONファイルでバックアップ・復元できます。",
  "profile.data.export": "エクスポート",
  "profile.data.import": "インポート",
  "profile.data.importSuccess": "データを復元しました",
  "profile.data.importError": "ファイルの読み込みに失敗しました",
  "profile.data.importNote":
    "インポートすると現在のデータは上書きされます。事前にエクスポートしておくことをおすすめします。",
  "profile.terms": "利用規約",
  "profile.privacy": "プライバシーポリシー",

  // アストロマップ
  "astro.brand": "アストロマップ",
  "astro.tagline": "あなたの星が輝く場所を、世界地図で。",
  "astro.intro":
    "出生データから10天体のライン（MC・IC・AC・DC）を世界地図に描き、「どの土地でどんな運が後押しされやすいか」を目的別に整理します。",
  "astro.loading": "読み込み中...",
  "astro.target": "対象",
  "astro.nameUnset": "（名称未設定）",
  "astro.birthDate": "生年月日",
  "astro.timeUnset": "（時刻未設定）",
  "astro.birthCountry": "生まれた国・地域",
  "astro.appliedOffset": "適用される時差（出生日基準）",
  "astro.birthTime": "出生時刻",
  "astro.confHigh": "信頼度 高 ✓",
  "astro.confTentative": "参考・仮の時刻",
  "astro.confNone": "時刻なし",
  "astro.resetToRegistered": "登録値に戻す（{time}）",
  "astro.sliderAria": "出生時刻スライダー",
  "astro.sliderNote":
    "スライダーを動かすと、時刻に合わせて地図の線が動きます（1時間で経度約15°＝東西に約1,400km）。正確な時刻ほど土地の判定が信頼できます。",
  "astro.stateExact":
    "登録された出生時刻で計算中です。地図・ランキングはこの時刻に基づく結果です。",
  "astro.stateTentative":
    "登録時刻（{time}）から変更中の「仮の時刻」で表示しています。「登録値に戻す」で元に戻せます。",
  "astro.stateNoneA":
    "出生時刻が未登録です。上の欄かスライダーで時刻を指定すると地図が出せますが、あくまで仮の時刻の参考表示です。分かる場合は",
  "astro.stateNoneLink": "プロフィールに登録",
  "astro.stateNoneB": "すると正確になります。",
  "astro.chooseGoal": "目的を選ぶ",
  "astro.tentativeMapNote":
    "仮の時刻（{time}）での表示です。土地の順位は目安としてご覧ください。",
  "astro.lineType": "ライン種別:",
  "astro.mapLegend":
    "実線=MC/AC、点線=IC、破線=DC。金色の輪はこの目的のおすすめ上位都市、オレンジの輪は選択中の都市です。地図上の都市をタップすると詳細が見られます。",
  "astro.rankingHeading": "におすすめの土地",
  "astro.searchPlaceholder": "都市名・国名で検索（例: 名古屋 / Lyon）",
  "astro.all": "全て",
  "astro.noMatch": "「{q}」に一致する都市が見つかりません。",
  "astro.noCityInRegion": "この地域の都市はデータにありません。",
  "astro.showMore": "さらに表示（残り{n}都市）",
  "astro.points": "点",
  "astro.disclaimer":
    "※ 西洋占星術（トロピカル）をベースにした簡易計算による参考値です。天体の性質分類（追い風／成長／刺激）は分かりやすさ優先の簡易的なもので、外惑星（天王星・海王星・冥王星）のラインは特に誤差が大きめです。占いは参考情報として、人生の重要な判断はご自身の責任で行ってください。",
  "astro.activeLinesTitle": "この土地で効いている天体ライン",
  "astro.lineName": "{planet}・{angle}線",
  "astro.gate.title": "出生時刻を登録すると地図が使えます",
  "astro.gate.body":
    "アストロマップの線（MC・IC・AC・DC）は、出生時刻が1時間ずれると地図上で約15度（赤道で約1,500km）も動きます。時刻が未設定のままだと土地の順位はほぼ意味をなさないため、正確さを守るために地図とランキングは非表示にしています。",
  "astro.gate.howTitle": "出生時刻の調べ方",
  "astro.gate.how1": "母子手帳・出生届の控えに記載されていることが多いです",
  "astro.gate.how2": "ご家族に「何時ごろ生まれたか」を聞いてみる",
  "astro.gate.how3":
    "だいたいの時間帯（朝・昼・夜など）でも、まずは目安として登録できます",
  "astro.gate.howNote":
    "※ どうしても分からない場合は、下の「星の配置」（時刻に左右されない情報）だけご覧いただけます。おおよその時刻で登録した場合、地図は目安としてお使いください。",
  "astro.gate.cta": "プロフィールで出生時刻を登録する →",
  "astro.gate.skyTitle": "時刻に依存しにくい「星の配置」",
  "astro.gate.skyNote":
    "地図は出せませんが、生年月日だけでも分かる10天体の星座配置です（土地とは無関係の、あなたの基本的な星の傾向）。",
  "astro.gate.skyFootnote":
    "※ 月は1日に約13度動くため、時刻未設定では星座がずれる場合があります。",

  // 振り返り日記
  "diary.title": "振り返り日記",
  "diary.help.title": "振り返り日記の使い方",
  "diary.help.step1":
    "その日の気分を5段階から選び、ひとことメモを書いて保存します。タグ（仕事・恋愛など）も付けられます。",
  "diary.help.step2": "日付を選べば、今日だけでなく過去の日の記録もできます。",
  "diary.help.step3":
    "保存すると、その日の運勢（数秘・マヤ暦・九星気学・月齢）も一緒に記録され、「気分と運気の関係」をあとから見返せます。",
  "diary.help.step4":
    "続けるほど、自分の調子の波と運気のパターンが見えてきます。まずは一言からでOKです。",
  "diary.mood.1": "低調",
  "diary.mood.2": "まあまあ",
  "diary.mood.3": "普通",
  "diary.mood.4": "良い",
  "diary.mood.5": "最高",
  "diary.tag.work": "仕事",
  "diary.tag.money": "お金",
  "diary.tag.relationship": "人間関係",
  "diary.tag.health": "健康",
  "diary.tag.learning": "学び",
  "diary.tag.insight": "気づき",
  "diary.tag.gratitude": "感謝",
  "diary.tag.challenge": "挑戦",
  "diary.writeToday": "+ 今日の振り返りを書く",
  "diary.addOtherDay": "+ 別の日の日記を追加",
  "diary.form.edit": "日記を編集",
  "diary.form.record": "振り返りを記録",
  "diary.form.dateLabel": "日付",
  "diary.form.moodLabel": "今日の気分",
  "diary.form.contentLabel": "今日の振り返り",
  "diary.form.contentPlaceholder": "今日あったこと、感じたこと、気づきなど...",
  "diary.form.tagsLabel": "タグ（任意）",
  "diary.form.update": "更新する",
  "diary.form.save": "保存する",
  "diary.count": "{n}件の記録",
  "diary.avgMood": "平均気分：",
  "diary.empty.title": "この月の記録はまだありません",
  "diary.empty.body": "日々の振り返りを記録して、運勢との関連を発見しましょう",
  "diary.thisDayFortune": "この日の運勢",
  "diary.label.personalDayFull": "数秘パーソナルデイ",
  "diary.label.personalDay": "パーソナルデイ",
  "diary.label.mayan": "マヤ暦",
  "diary.label.nineStar": "九星気学",
  "diary.label.moon": "月齢",
  "diary.card.closeFortune": "運勢を閉じる",
  "diary.card.openFortune": "この日の運勢と照らし合わせる",
  "diary.noFortuneData": "運勢データを取得できませんでした",
  "diary.moodVsFortune": "気分 × 運勢の照合",

  // 運勢グラフ
  "graph.title": "運勢グラフ",
  "graph.yearlyLink": "年運詳細",
  "graph.monthlyLink": "月運勢",
  "graph.help.title": "運勢グラフの見方",
  "graph.help.step1":
    "折れ線は占術ごとの運気の流れです。上にいくほど勢いがあり、下がる時期は充電・準備に向きます（“悪い”ではありません）。",
  "graph.help.step2":
    "★は今年の位置。過去から約10年先までの流れをひと目で確認できます。",
  "graph.help.step3":
    "気になる年（点）をタップすると、その年のテーマ・おすすめの過ごし方・注意点が下に表示されます。",
  "graph.help.step4": "上の「年運詳細／月運勢」リンクから、さらに細かい流れも見られます。",
  "graph.series.overall": "総合",
  "graph.series.numerology": "数秘術",
  "graph.series.mayan": "マヤ暦",
  "graph.series.ninestar": "九星気学",
  "graph.series.fourpillars": "四柱推命",
  "graph.seriesDesc.overall": "全体的な運勢の流れ",
  "graph.seriesDesc.numerology": "内面の力・才能・使命",
  "graph.seriesDesc.mayan": "本質的なエネルギーの流れ",
  "graph.seriesDesc.ninestar": "環境や人間関係の流れ",
  "graph.seriesDesc.fourpillars": "運命の土台・人生の基盤",
  "graph.tapHint": "タップで年を選択 / ★は今年",
  "graph.periodGuide": "{year}年の時期ガイド",
  "graph.thisYear": "今年",
  "graph.totalEnergy": "総合エネルギー",
  "graph.energy.high": "運気が高い年です。積極的にチャレンジしましょう！",
  "graph.energy.stable": "安定した運気の年。バランスよく過ごすと◎",
  "graph.energy.build": "力を蓄える年。準備と学びに集中しましょう",
  "graph.energy.charge": "充電の年。焦らず内面を充実させる時期です",
  "graph.mayanThemeSeal": "{year}年のテーマ紋章：{seal}（{keyword}）",
  "graph.mayanTone": "▸ 銀河の音「{tone}」- {keyword}",
  "graph.monthlyCta": "{year}年の月ごとの運勢を見る",
  "graph.monthlySub": "12ヶ月の流れ・今月のテーマをチェック",

  // ゴール＋ロードマップ
  "goal.title": "ゴール＋ロードマップ",
  "goal.help.title": "目標（ゴール）の使い方",
  "goal.help.step1":
    "「＋新しいゴールを設定する」を押し、叶えたいことをカテゴリ（仕事・お金・健康・人間関係など）から選んで登録します。",
  "goal.help.step2":
    "登録すると、今のあなたの運気と掛け合わせて「今やるべきこと」や「動き出すのにベストな時期」が自動で表示されます。",
  "goal.help.step3":
    "運気は春＝上昇／夏＝盛運／秋＝整理／冬＝充電の4つの季節で表示。低い時期も“悪い”ではなく、準備や見直しに向く時期として活かせます。",
  "goal.help.step4": "叶ったら丸をタップしてチェック。あとから達成を振り返れます。",
  "goal.newButton": "+ 新しいゴールを設定する",
  "goal.form.new": "新しいゴール",
  "goal.form.edit": "ゴールを編集",
  "goal.form.categoryLabel": "カテゴリ",
  "goal.form.goalLabel": "ゴール",
  "goal.form.goalPlaceholder": "達成したいこと",
  "goal.form.targetDateLabel": "目標日（任意）",
  "goal.form.memoLabel": "メモ（任意）",
  "goal.form.memoPlaceholder": "具体的なステップや動機など",
  "goal.form.save": "ゴールを保存",
  "goal.form.update": "更新する",
  "goal.cat.business": "ビジネス・仕事",
  "goal.cat.money": "お金・収入",
  "goal.cat.health": "健康・美容",
  "goal.cat.relationship": "人間関係",
  "goal.cat.learning": "学び・スキル",
  "goal.cat.lifestyle": "暮らし・環境",
  "goal.cat.spiritual": "内面・精神",
  "goal.cat.other": "その他",
  "goal.filter.active": "進行中",
  "goal.filter.completed": "達成",
  "goal.filter.all": "全て",
  "goal.empty.noActive": "進行中のゴールはありません",
  "goal.empty.noCompleted": "達成したゴールはありません",
  "goal.empty.title": "まだゴールがありません",
  "goal.empty.body": "運気の流れに合わせた目標設定で、最適なタイミングで行動しましょう",
  "goal.diag.title": "運気診断",
  "goal.diag.todayInline": "▸ 今やること：{action}",
  "goal.diag.seasonBadge": "運気の{season}",
  "goal.diag.energy": "エネルギー {n}/100",
  "goal.diag.todoTitle": "今の時期にやるべきこと",
  "goal.card.completedOn": "達成: {date}",
  "goal.card.overdue": "（{n}日超過）",
  "goal.card.today": "（今日!）",
  "goal.card.remain": "（残{n}日）",
};

export type DictKey = keyof typeof ja;

const ko: Record<DictKey, string> = {
  // 공통
  "common.close": "닫기",
  "common.cancel": "취소",
  "common.save": "저장",
  "common.edit": "편집",
  "common.delete": "삭제",
  "common.add": "추가",
  "common.new": "NEW",
  "common.calculating": "계산 중...",
  "common.disclaimer":
    "※ 점술은 참고 정보입니다. 인생의 중요한 판단은 본인의 책임으로 결정해 주세요.",

  // 언어
  "lang.label": "언어 / Language / 言語",

  // 내비게이션
  "nav.home": "홈",
  "nav.fortune": "운세",
  "nav.goal": "목표",
  "nav.strength": "강점",
  "nav.diary": "일기",

  // 헤더
  "header.targets": "대상자",
  "header.settings": "설정",

  // 홈(웰컴)
  "home.welcome.greeting": "운명 내비에 오신 것을 환영합니다",
  "home.welcome.title":
    "먼저 프로필을 설정하고, 당신만을 위한 점술 결과를 받아보세요",
  "home.welcome.cta": "프로필 설정하기",
  "home.benefit.star": "당신만을 위한\n운세를 전해요",
  "home.benefit.moon": "매일을 더 좋게\n만드는 힌트로",
  "home.benefit.book": "인생의 선택에\n자신감을",
  "home.benefit.crystal": "미래를 내 편으로\n만들어요",

  // 홈(가이드 배너)
  "home.guide.title": "처음 오신 분께",
  "home.guide.body":
    "개인적으로 즐기는 방법과, 결혼상담소 등 업무에서 활용하는 방법을 가이드로 정리했습니다.",
  "home.guide.cta": "사용법 가이드 보기 →",

  // 홈(본문)
  "home.todayMessage": "오늘의 메시지",
  "home.todayCaution": "오늘의 주의점",
  "home.lucky.color": "행운의 색",
  "home.lucky.number": "행운의 숫자",
  "home.lucky.direction": "길방위",
  "home.lucky.moon": "월령",
  "home.year.title": "올해의 테마 (수비학)",
  "home.year.personalYear": "퍼스널 이어",
  "home.seeDetails": "각 점술 상세 보기 →",

  "home.astro.subtitle": "별이 빛나는 땅을 세계지도로 · 목적별 랭킹",
  "home.life.title": "인생 되돌아보기",
  "home.life.subtitle": "사건을 시간순으로 · 별과 운기를 겹쳐 나를 알기",
  "home.manual.title": "나의 사용설명서",
  "home.manual.subtitle": "모든 점술을 하나로 · 강점/충전법/취급주의/타인소개",

  "home.menu.yearly.title": "연운 상세",
  "home.menu.yearly.subtitle": "올해·내년의 흐름",
  "home.menu.monthly.title": "이달의 운세",
  "home.menu.monthly.subtitle": "매월의 테마",
  "home.menu.compat.title": "궁합 진단",
  "home.menu.compat.subtitle": "두 사람을 골라 자세히",
  "home.menu.matrix.title": "궁합 매트릭스",
  "home.menu.matrix.subtitle": "전원 교차 · 랭킹",
  "home.menu.oracle.title": "오라클 카드",
  "home.menu.oracle.subtitle": "오늘의 메시지 한 장",

  "home.footer.guide": "사용법 가이드",
  "home.footer.terms": "이용약관",
  "home.footer.privacy": "개인정보 처리방침",

  // 프로필
  "profile.title": "프로필 설정",
  "profile.backup.recommendedWithDate":
    "백업 권장: 마지막 내보내기로부터 {days}일 경과",
  "profile.backup.notYet": "아직 백업하지 않았습니다",
  "profile.backup.doneDaysAgo": "백업 완료 ({days}일 전)",
  "profile.backup.storageNote":
    "데이터는 이 기기의 브라우저 안에 저장됩니다. 다른 기기에서는 보이지 않습니다. 브라우저 데이터가 삭제되면 사라집니다. 정기적으로 아래 「내보내기」로 백업해 주세요.",
  "profile.backup.counts":
    "현재 저장 수: 프로필 {profiles}건 · 일기 {diary}건 · 목표 {goals}건 · 감정 {readings}건",
  "profile.usage.label": "사용 용량",
  "profile.usage.alert":
    "⚠ 용량이 거의 가득 찼습니다. 새로운 저장에 실패할 수 있습니다. 내보내기 후 오래된 감정 결과(이미지 포함)를 삭제해 주세요.",
  "profile.usage.warn":
    "용량이 80%를 넘었습니다. 서둘러 내보내기하고 불필요한 데이터를 정리하시길 권장합니다.",
  "profile.external.title": "다른 화면에서 데이터가 갱신되었습니다",
  "profile.external.body":
    "다른 탭이나 스마트폰에서 이 앱을 열어 편집했을 가능성이 있습니다. 이대로 저장하면 그쪽 변경을 덮어쓰게 됩니다. 페이지를 한 번 새로고침하여 최신 상태를 확인해 주세요.",
  "profile.external.reload": "새로고침",
  "profile.external.later": "나중에",
  "profile.saveError.title": "저장하지 못했습니다",
  "profile.saveError.quota":
    "저장에 실패했습니다. 브라우저 용량 상한에 도달했을 수 있습니다. 아래 「내보내기」로 현재 데이터를 백업한 뒤, 불필요한 감정 결과(특히 이미지 포함)를 /readings 에서 삭제하고 다시 시도해 주세요.",
  "profile.saveError.notVerified":
    "저장 처리는 완료되었지만, 다시 불러오니 데이터가 반영되지 않았습니다. 프라이빗 브라우징/시크릿 모드를 사용하고 있지 않은지 확인해 주세요. 지금 바로 「내보내기」로 백업하시길 권장합니다.",
  "profile.list.registered": "등록된 사람",
  "profile.list.add": "+ 추가",
  "profile.badge.self": "본인",
  "profile.badge.family": "가족",
  "profile.badge.client": "고객",
  "profile.badge.student": "수강생",
  "profile.badge.showing": "표시 중",
  "profile.name.unset": "이름 미설정",
  "profile.btn.switch": "전환",
  "profile.empty.prompt":
    "먼저 프로필을 설정하고, 점술 결과를 받아보세요",
  "profile.empty.cta": "프로필 설정하기",
  "profile.form.editing": "프로필 편집",
  "profile.form.addNew": "새 사람 추가",
  "profile.form.categoryLabel": "분류",
  "profile.form.categoryNote":
    "「수강생」「고객」 중 하나를 선택하면 대상자 목록 에 표시되어 동행 조언을 볼 수 있습니다",
  "profile.form.genderLabel": "성별 (궁합 매트릭스에서 사용, 선택)",
  "profile.gender.female": "여성",
  "profile.gender.male": "남성",
  "profile.gender.other": "미설정",
  "profile.form.nameLabel": "이름 (닉네임도 OK)",
  "profile.form.namePlaceholder": "예: 하나코",
  "profile.form.birthDateLabel": "생년월일",
  "profile.form.required": "*필수",
  "profile.form.birthTimeLabel": "출생 시간 (알면)",
  "profile.form.birthTimeNote":
    "사주의 시주와, 아스트로맵(별이 빛나는 땅)의 정확도에 영향을 줍니다. 출생 관련 서류에 기재된 경우가 많습니다. 모를 경우 비워둬도 OK (아스트로맵 지도는 표시되지 않습니다).",
  "profile.form.birthPlaceLabel": "출생지 (알면)",
  "profile.form.birthPlacePlaceholder": "예: 서울",
  "profile.form.studentMemoLabel": "수강생 메모",
  "profile.form.studentMemoPlaceholder":
    "예: 1월 입학, 월 3회 개별 세션, 목표는 독립 창업",
  "profile.form.studentMemoNote":
    "진행 상황·면담 메모 등 동행에 필요한 정보를 남길 수 있습니다",
  "profile.form.saved": "✓ 저장했습니다!",
  "profile.form.update": "수정하고 홈으로",
  "profile.form.save": "저장하고 홈으로",
  "profile.delete.confirm":
    "「{name}」을(를) 삭제하시겠습니까?\n\n※ 삭제한 데이터는 되돌릴 수 없습니다. 만약을 위해 「내보내기」로 백업한 후 삭제하시길 권장합니다.",
  "profile.delete.fallbackName": "이 프로필",
  "profile.data.title": "데이터 관리",
  "profile.data.desc":
    "모든 프로필·일기·목표·감정 결과를 JSON 파일로 백업·복원할 수 있습니다.",
  "profile.data.export": "내보내기",
  "profile.data.import": "가져오기",
  "profile.data.importSuccess": "데이터를 복원했습니다",
  "profile.data.importError": "파일을 불러오지 못했습니다",
  "profile.data.importNote":
    "가져오기를 하면 현재 데이터는 덮어써집니다. 사전에 내보내기 해두시길 권장합니다.",
  "profile.terms": "이용약관",
  "profile.privacy": "개인정보 처리방침",

  // 아스트로맵
  "astro.brand": "아스트로맵",
  "astro.tagline": "당신의 별이 빛나는 곳을, 세계지도로.",
  "astro.intro":
    "출생 데이터로 10천체의 라인(MC·IC·AC·DC)을 세계지도에 그리고, 「어느 땅에서 어떤 운이 뒤에서 밀어주기 쉬운지」를 목적별로 정리합니다.",
  "astro.loading": "불러오는 중...",
  "astro.target": "대상",
  "astro.nameUnset": "(이름 미설정)",
  "astro.birthDate": "생년월일",
  "astro.timeUnset": "(시간 미설정)",
  "astro.birthCountry": "태어난 국가·지역",
  "astro.appliedOffset": "적용되는 시차(출생일 기준)",
  "astro.birthTime": "출생 시간",
  "astro.confHigh": "신뢰도 높음 ✓",
  "astro.confTentative": "참고·임시 시간",
  "astro.confNone": "시간 없음",
  "astro.resetToRegistered": "등록값으로 되돌리기({time})",
  "astro.sliderAria": "출생 시간 슬라이더",
  "astro.sliderNote":
    "슬라이더를 움직이면 시간에 맞춰 지도의 선이 움직입니다(1시간에 경도 약 15°＝동서로 약 1,400km). 정확한 시간일수록 땅의 판정을 신뢰할 수 있습니다.",
  "astro.stateExact":
    "등록된 출생 시간으로 계산 중입니다. 지도·랭킹은 이 시간을 기준으로 한 결과입니다.",
  "astro.stateTentative":
    "등록 시간({time})에서 변경 중인 「임시 시간」으로 표시하고 있습니다. 「등록값으로 되돌리기」로 되돌릴 수 있습니다.",
  "astro.stateNoneA":
    "출생 시간이 미등록입니다. 위 칸이나 슬라이더로 시간을 지정하면 지도를 낼 수 있지만, 어디까지나 임시 시간의 참고 표시입니다. 아는 경우에는 ",
  "astro.stateNoneLink": "프로필에 등록",
  "astro.stateNoneB": "하면 정확해집니다.",
  "astro.chooseGoal": "목적을 선택",
  "astro.tentativeMapNote":
    "임시 시간({time})으로 표시하고 있습니다. 땅의 순위는 참고로 봐 주세요.",
  "astro.lineType": "라인 종류:",
  "astro.mapLegend":
    "실선=MC/AC, 점선=IC, 파선=DC. 금색 원은 이 목적의 추천 상위 도시, 주황색 원은 선택 중인 도시입니다. 지도 위 도시를 탭하면 상세를 볼 수 있습니다.",
  "astro.rankingHeading": "에 추천하는 땅",
  "astro.searchPlaceholder": "도시명·국가명으로 검색(예: Seoul / Lyon)",
  "astro.all": "전체",
  "astro.noMatch": "「{q}」에 일치하는 도시를 찾을 수 없습니다.",
  "astro.noCityInRegion": "이 지역의 도시는 데이터에 없습니다.",
  "astro.showMore": "더 보기(남은 {n}개 도시)",
  "astro.points": "점",
  "astro.disclaimer":
    "※ 서양 점성술(트로피컬)을 기반으로 한 간이 계산에 의한 참고값입니다. 천체의 성질 분류(순풍/성장/자극)는 이해하기 쉬움을 우선한 간이적인 것이며, 외행성(천왕성·해왕성·명왕성)의 라인은 특히 오차가 큽니다. 점술은 참고 정보로서, 인생의 중요한 판단은 본인의 책임으로 결정해 주세요.",
  "astro.activeLinesTitle": "이 땅에서 작용하는 천체 라인",
  "astro.lineName": "{planet} {angle} 라인",
  "astro.gate.title": "출생 시간을 등록하면 지도를 사용할 수 있습니다",
  "astro.gate.body":
    "아스트로맵의 선(MC·IC·AC·DC)은 출생 시간이 1시간 어긋나면 지도상에서 약 15도(적도에서 약 1,500km)나 움직입니다. 시간이 미설정인 채로는 땅의 순위가 거의 의미가 없으므로, 정확성을 지키기 위해 지도와 랭킹은 숨기고 있습니다.",
  "astro.gate.howTitle": "출생 시간 찾는 법",
  "astro.gate.how1": "출생 관련 서류에 기재된 경우가 많습니다",
  "astro.gate.how2": "가족에게 「몇 시쯤 태어났는지」 물어보기",
  "astro.gate.how3":
    "대략적인 시간대(아침·낮·밤 등)라도 우선 참고로 등록할 수 있습니다",
  "astro.gate.howNote":
    "※ 도저히 알 수 없는 경우에는 아래의 「별의 배치」(시간에 좌우되지 않는 정보)만 보실 수 있습니다. 대략적인 시간으로 등록한 경우 지도는 참고로 사용해 주세요.",
  "astro.gate.cta": "프로필에서 출생 시간 등록하기 →",
  "astro.gate.skyTitle": "시간에 의존하지 않는 「별의 배치」",
  "astro.gate.skyNote":
    "지도는 낼 수 없지만, 생년월일만으로도 알 수 있는 10천체의 별자리 배치입니다(땅과는 무관한, 당신의 기본적인 별의 경향).",
  "astro.gate.skyFootnote":
    "※ 달은 하루에 약 13도 움직이므로, 시간 미설정에서는 별자리가 어긋날 수 있습니다.",

  // 되돌아보기 일기
  "diary.title": "되돌아보기 일기",
  "diary.help.title": "되돌아보기 일기 사용법",
  "diary.help.step1":
    "그날의 기분을 5단계에서 고르고, 한마디 메모를 적어 저장합니다. 태그(일·연애 등)도 붙일 수 있습니다.",
  "diary.help.step2": "날짜를 고르면 오늘뿐 아니라 지난 날의 기록도 남길 수 있습니다.",
  "diary.help.step3":
    "저장하면 그날의 운세(수비·마야력·구성기학·월령)도 함께 기록되어, 「기분과 운기의 관계」를 나중에 되돌아볼 수 있습니다.",
  "diary.help.step4":
    "계속할수록 자신의 컨디션의 파도와 운기의 패턴이 보입니다. 우선 한마디부터 OK입니다.",
  "diary.mood.1": "저조",
  "diary.mood.2": "그저 그럼",
  "diary.mood.3": "보통",
  "diary.mood.4": "좋음",
  "diary.mood.5": "최고",
  "diary.tag.work": "일",
  "diary.tag.money": "돈",
  "diary.tag.relationship": "인간관계",
  "diary.tag.health": "건강",
  "diary.tag.learning": "배움",
  "diary.tag.insight": "깨달음",
  "diary.tag.gratitude": "감사",
  "diary.tag.challenge": "도전",
  "diary.writeToday": "+ 오늘의 되돌아보기 쓰기",
  "diary.addOtherDay": "+ 다른 날의 일기 추가",
  "diary.form.edit": "일기 편집",
  "diary.form.record": "되돌아보기 기록",
  "diary.form.dateLabel": "날짜",
  "diary.form.moodLabel": "오늘의 기분",
  "diary.form.contentLabel": "오늘의 되돌아보기",
  "diary.form.contentPlaceholder": "오늘 있었던 일, 느낀 점, 깨달음 등...",
  "diary.form.tagsLabel": "태그(선택)",
  "diary.form.update": "수정하기",
  "diary.form.save": "저장하기",
  "diary.count": "{n}개의 기록",
  "diary.avgMood": "평균 기분: ",
  "diary.empty.title": "이달의 기록은 아직 없습니다",
  "diary.empty.body": "매일의 되돌아보기를 기록하고, 운세와의 관련을 발견해 보세요",
  "diary.thisDayFortune": "이날의 운세",
  "diary.label.personalDayFull": "수비 퍼스널데이",
  "diary.label.personalDay": "퍼스널데이",
  "diary.label.mayan": "마야력",
  "diary.label.nineStar": "구성기학",
  "diary.label.moon": "월령",
  "diary.card.closeFortune": "운세 닫기",
  "diary.card.openFortune": "이날의 운세와 대조해 보기",
  "diary.noFortuneData": "운세 데이터를 가져올 수 없었습니다",
  "diary.moodVsFortune": "기분 × 운세 대조",

  // 운세 그래프
  "graph.title": "운세 그래프",
  "graph.yearlyLink": "연운 상세",
  "graph.monthlyLink": "이달의 운세",
  "graph.help.title": "운세 그래프 보는 법",
  "graph.help.step1":
    "꺾은선은 점술별 운기의 흐름입니다. 위로 갈수록 기세가 있고, 내려가는 시기는 충전·준비에 적합합니다(“나쁨”이 아닙니다).",
  "graph.help.step2":
    "★는 올해의 위치. 과거부터 약 10년 뒤까지의 흐름을 한눈에 확인할 수 있습니다.",
  "graph.help.step3":
    "궁금한 해(점)를 탭하면 그 해의 테마·추천 지내는 법·주의점이 아래에 표시됩니다.",
  "graph.help.step4": "위의 「연운 상세／이달의 운세」 링크에서 더 세밀한 흐름도 볼 수 있습니다.",
  "graph.series.overall": "종합",
  "graph.series.numerology": "수비학",
  "graph.series.mayan": "마야력",
  "graph.series.ninestar": "구성기학",
  "graph.series.fourpillars": "사주",
  "graph.seriesDesc.overall": "전체적인 운세의 흐름",
  "graph.seriesDesc.numerology": "내면의 힘·재능·사명",
  "graph.seriesDesc.mayan": "본질적인 에너지의 흐름",
  "graph.seriesDesc.ninestar": "환경이나 인간관계의 흐름",
  "graph.seriesDesc.fourpillars": "운명의 토대·인생의 기반",
  "graph.tapHint": "탭하여 연도 선택 / ★는 올해",
  "graph.periodGuide": "{year}년의 시기 가이드",
  "graph.thisYear": "올해",
  "graph.totalEnergy": "종합 에너지",
  "graph.energy.high": "운기가 높은 해입니다. 적극적으로 도전해요!",
  "graph.energy.stable": "안정된 운기의 해. 균형 있게 보내면 ◎",
  "graph.energy.build": "힘을 비축하는 해. 준비와 배움에 집중해요",
  "graph.energy.charge": "충전의 해. 조급해하지 말고 내면을 충실히 하는 시기입니다",
  "graph.mayanThemeSeal": "{year}년의 테마 문장: {seal}({keyword})",
  "graph.mayanTone": "▸ 은하의 음 「{tone}」 - {keyword}",
  "graph.monthlyCta": "{year}년의 월별 운세 보기",
  "graph.monthlySub": "12개월의 흐름·이달의 테마 체크",

  // 목표 + 로드맵
  "goal.title": "목표 + 로드맵",
  "goal.help.title": "목표(골) 사용법",
  "goal.help.step1":
    "「＋새로운 목표 설정하기」를 눌러 이루고 싶은 것을 카테고리(일·돈·건강·인간관계 등)에서 골라 등록합니다.",
  "goal.help.step2":
    "등록하면 지금 당신의 운기와 결합하여 「지금 할 일」이나 「움직이기에 가장 좋은 시기」가 자동으로 표시됩니다.",
  "goal.help.step3":
    "운기는 봄＝상승／여름＝성운／가을＝정리／겨울＝충전의 4가지 계절로 표시. 낮은 시기도 “나쁨”이 아니라 준비나 재검토에 맞는 시기로 활용할 수 있습니다.",
  "goal.help.step4": "이뤄지면 동그라미를 탭해 체크. 나중에 달성을 되돌아볼 수 있습니다.",
  "goal.newButton": "+ 새로운 목표 설정하기",
  "goal.form.new": "새로운 목표",
  "goal.form.edit": "목표 편집",
  "goal.form.categoryLabel": "카테고리",
  "goal.form.goalLabel": "목표",
  "goal.form.goalPlaceholder": "달성하고 싶은 것",
  "goal.form.targetDateLabel": "목표일(선택)",
  "goal.form.memoLabel": "메모(선택)",
  "goal.form.memoPlaceholder": "구체적인 단계나 동기 등",
  "goal.form.save": "목표 저장",
  "goal.form.update": "수정하기",
  "goal.cat.business": "비즈니스·일",
  "goal.cat.money": "돈·수입",
  "goal.cat.health": "건강·미용",
  "goal.cat.relationship": "인간관계",
  "goal.cat.learning": "배움·스킬",
  "goal.cat.lifestyle": "생활·환경",
  "goal.cat.spiritual": "내면·정신",
  "goal.cat.other": "기타",
  "goal.filter.active": "진행 중",
  "goal.filter.completed": "달성",
  "goal.filter.all": "전체",
  "goal.empty.noActive": "진행 중인 목표가 없습니다",
  "goal.empty.noCompleted": "달성한 목표가 없습니다",
  "goal.empty.title": "아직 목표가 없습니다",
  "goal.empty.body": "운기의 흐름에 맞춘 목표 설정으로, 최적의 타이밍에 행동해요",
  "goal.diag.title": "운기 진단",
  "goal.diag.todayInline": "▸ 지금 할 일: {action}",
  "goal.diag.seasonBadge": "운기의 {season}",
  "goal.diag.energy": "에너지 {n}/100",
  "goal.diag.todoTitle": "지금 시기에 해야 할 일",
  "goal.card.completedOn": "달성: {date}",
  "goal.card.overdue": "({n}일 초과)",
  "goal.card.today": "(오늘!)",
  "goal.card.remain": "(남은 {n}일)",
};

export const dict: Record<Lang, Record<DictKey, string>> = { ja, ko };
