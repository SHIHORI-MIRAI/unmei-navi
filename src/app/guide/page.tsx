"use client";

import Link from "next/link";
import { useState } from "react";

type Tab = "personal" | "business";

export default function GuidePage() {
  const [tab, setTab] = useState<Tab>("personal");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">📖</span>
        使い方ガイド
      </h1>

      <p className="text-xs text-muted leading-relaxed">
        運命ナビは、占術を組み合わせて運勢・性格・相性を見るアプリです。
        個人でセルフケアに使う方と、結婚相談所などのカウンセリング業務で使う方の両方に対応しています。
      </p>

      {/* タブ */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setTab("personal")}
          className={`py-2.5 rounded-xl text-sm border transition-colors ${
            tab === "personal"
              ? "bg-accent-orange text-white border-accent-orange"
              : "bg-card-bg text-foreground border-card-border hover:border-accent-orange/50"
          }`}
        >
          個人で使う
        </button>
        <button
          onClick={() => setTab("business")}
          className={`py-2.5 rounded-xl text-sm border transition-colors ${
            tab === "business"
              ? "bg-accent-orange text-white border-accent-orange"
              : "bg-card-bg text-foreground border-card-border hover:border-accent-orange/50"
          }`}
        >
          業務で使う
        </button>
      </div>

      {tab === "personal" && <PersonalGuide />}
      {tab === "business" && <BusinessGuide />}

      <div className="pt-4 border-t border-card-border space-y-2 text-xs text-muted">
        <p className="font-medium text-foreground">お問い合わせ</p>
        <p>
          うまく動かない・使い方がわからない・データが消えた等のご連絡は、
          下記までメールでお知らせください。
        </p>
        <p className="bg-card-bg border border-card-border rounded-xl p-3">
          運営: 未来アカデミー<br />
          連絡先: mamaeri0617@gmail.com
        </p>
      </div>
    </div>
  );
}

function Step({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
      <div className="flex items-center gap-2">
        <span className="bg-accent-orange text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
          {num}
        </span>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
      </div>
      <div className="text-xs text-foreground/85 leading-relaxed pl-8 space-y-1">
        {children}
      </div>
    </div>
  );
}

function PersonalGuide() {
  return (
    <div className="space-y-3">
      <Step num={1} title="まずは自分のプロフィールを登録">
        <p>
          <Link href="/profile" className="text-accent-orange underline">
            プロフィール設定
          </Link>
          を開いて、生年月日・出生時間（わかれば）・出生地を入力します。出生時間がわからない場合は空欄でOK。
        </p>
      </Step>
      <Step num={2} title="ホーム画面で今日の運勢を見る">
        <p>
          ホームに戻ると、今日の数秘・マヤ暦・九星気学にもとづくメッセージとラッキー情報が表示されます。
        </p>
      </Step>
      <Step num={3} title="運勢の流れをグラフで把握">
        <p>
          <Link href="/graph" className="text-accent-orange underline">
            運勢グラフ
          </Link>
          で、過去〜10年後までの4占術の流れを折れ線でチェック。気になる年をタップすると、その年のテーマと過ごし方ガイドが見られます。
        </p>
      </Step>
      <Step num={4} title="ゴールと運気を組み合わせる">
        <p>
          <Link href="/goal" className="text-accent-orange underline">
            ゴール
          </Link>
          で目標を設定すると、現在の運気と掛け合わせて「今やるべきこと」が表示されます。
        </p>
      </Step>
      <Step num={5} title="日記で振り返る">
        <p>
          <Link href="/diary" className="text-accent-orange underline">
            振り返り日記
          </Link>
          で気分とその日の出来事を記録。後から運勢の波と気分の関係を見返せます。
        </p>
      </Step>
      <Step num={6} title="データを定期的にバックアップ">
        <p>
          データはこの端末のブラウザ内に保存されます。<strong>必ず1〜2週間に1回、プロフィール画面から「エクスポート」</strong>でJSONファイルを保存してください。容量が満杯になったり、ブラウザのデータが消えたりすると、入力した内容が失われます。
        </p>
      </Step>
    </div>
  );
}

function BusinessGuide() {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-foreground/85 leading-relaxed">
        <p className="font-medium text-amber-700 mb-1">⚠ ご利用前に必ずお読みください</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>顧客の生年月日を入力する前に、本人から同意を得てください。</li>
          <li>占術結果はあくまで参考情報です。顧客にお伝えする際もそのように説明してください。</li>
          <li>共用PCでは画面が他の方に見られないようご注意ください。</li>
          <li>
            詳しくは{" "}
            <Link href="/terms" className="text-accent-orange underline">
              利用規約
            </Link>
            と{" "}
            <Link href="/privacy" className="text-accent-orange underline">
              プライバシーポリシー
            </Link>
            を必ずご確認ください。
          </li>
        </ul>
      </div>

      <Step num={1} title="まずカウンセラーご自身のプロフィールを登録">
        <p>
          <Link href="/profile" className="text-accent-orange underline">
            プロフィール設定
          </Link>
          で「種別＝自分」を選び、ご自身の生年月日を入力します。これで全機能が使える状態になります。
        </p>
      </Step>

      <Step num={2} title="顧客のプロフィールを追加する">
        <p>同じく <Link href="/profile" className="text-accent-orange underline">プロフィール設定</Link> から「+ 追加」を押して、</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>種別 → <strong>「顧客」</strong>を選ぶ（バラ色のバッジで表示されます）</li>
          <li>性別 → 男性／女性 を必ず設定（相性マトリックスで使います）</li>
          <li>生年月日・出生時間（わかれば）・出生地を入力</li>
        </ul>
        <p>会員番号や活動状況などのメモは、種別を選んだ後に表示される「メモ」欄に記入できます。</p>
      </Step>

      <Step num={3} title="顧客の個別カードを見る">
        <p>
          <Link href="/students" className="text-accent-orange underline">
            対象者一覧
          </Link>
          を開いて、フィルタを「顧客」に切り替えると登録した顧客が並びます。カードをタップすると個別ページに進み、
        </p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>主星・日主・本命星などの占術プロフィール</li>
          <li>強みキーワード</li>
          <li>今月のテーマと過ごし方ガイド</li>
          <li>カウンセラー向け伴走アドバイス（天中殺年・パーソナルマンスを反映）</li>
        </ul>
        <p>を確認できます。面談前にこのページを開くと、その方の特性をすぐ把握できます。</p>
      </Step>

      <Step num={4} title="相性マトリックスでお見合い候補を絞り込む">
        <p>
          <Link href="/matrix" className="text-accent-orange underline">
            相性マトリックス
          </Link>
          が結婚相談所業務の中心機能です。
        </p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>関係モード → 「恋愛・パートナー」</li>
          <li>表示パターン → 「女性 × 男性」</li>
          <li>対象 → 「受講生／顧客」</li>
        </ul>
        <p>
          を選ぶと、登録した女性会員 × 男性会員のクロス相性スコアが一覧化されます。
        </p>
        <p>
          上部の<strong>ランキングTOP10</strong>で、相性が高いペアから提案できます。各占術ごとの内訳スコアも見られるので、「数秘で価値観が合う」「四柱推命で日常性質が噛み合う」などの根拠を顧客にお伝えできます。
        </p>
      </Step>

      <Step num={5} title="個別の詳しい相性を見る">
        <p>
          特定の2人をじっくり見たいときは{" "}
          <Link href="/compatibility" className="text-accent-orange underline">
            相性診断
          </Link>
          ページへ。占術ごとの詳細・ペアごとに動的生成されたアドバイス・強み・注意点が表示されます。
        </p>
      </Step>

      <Step num={6} title="データの管理（重要）">
        <p>
          現在のバージョンでは、データはこの端末のブラウザ内のみに保存されます。下記を必ず守ってください。
        </p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>
            <strong>1〜2週間に1回</strong>、プロフィール画面の「エクスポート」を実行してJSONファイルを安全な場所（クラウドストレージ等）に保存
          </li>
          <li>
            プロフィール画面上部の<strong>容量バー</strong>を時々チェック。80%を超えたら不要な鑑定画像などを削除
          </li>
          <li>共用PCを使う場合は、利用後に「ロックを解除」を再度求めるためログアウト操作（このアプリにはまだ専用ボタンはないので、ブラウザのCookie削除で代用）</li>
        </ul>
        <p className="mt-2 text-[11px] text-muted">
          ※ 別端末でも同じデータを使いたい・複数のカウンセラーで共有したい場合は、Supabase連携版（開発予定）で対応します。
        </p>
      </Step>

      <Step num={7} title="顧客への伝え方">
        <p>占い結果を顧客にお伝えする際のおすすめの言い回し：</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>「数秘とマヤ暦から見ると、お二人は<strong>価値観の方向性で響き合う</strong>関係なので…」</li>
          <li>「四柱推命では日主が天干合になっていて、日常で自然体で過ごせる組み合わせです」</li>
          <li>「ただし占いはあくまで参考情報なので、最終的にはお会いした感覚を大切にしてくださいね」</li>
        </ul>
        <p className="mt-1">占術の専門用語は深く説明しなくても大丈夫です。アプリ内のアドバイス文をそのまま読み上げるだけでも十分伝わります。</p>
      </Step>

      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 mt-4 space-y-2">
        <p className="text-sm font-medium text-sky-700">よくあるご質問</p>
        <div className="text-xs text-foreground/85 space-y-3">
          <div>
            <p className="font-medium">Q. 別のPCでも同じデータを見られますか？</p>
            <p className="text-muted mt-0.5">A. 現バージョンでは端末ごとに別データです。エクスポートしたJSONファイルを別端末でインポートすると引き継げます。Supabase版（開発予定）で複数端末対応します。</p>
          </div>
          <div>
            <p className="font-medium">Q. 顧客にも直接アプリを使ってもらえますか？</p>
            <p className="text-muted mt-0.5">A. 「顧客向けURL発行機能」を次のアップデートで予定しています。現在はカウンセラー側で見ていただく前提です。</p>
          </div>
          <div>
            <p className="font-medium">Q. ロック解除のパスワードを忘れました</p>
            <p className="text-muted mt-0.5">A. 運営者にメールでお問い合わせください（mamaeri0617@gmail.com）。</p>
          </div>
          <div>
            <p className="font-medium">Q. データが消えてしまいました</p>
            <p className="text-muted mt-0.5">A. プロフィール画面の容量バーが赤くなっていないか、エクスポートファイルが残っていないかご確認ください。エクスポートがあれば「インポート」で復旧できます。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
