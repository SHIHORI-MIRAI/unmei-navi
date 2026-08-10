import Link from "next/link";

export const metadata = {
  title: "特定商取引法に基づく表記 - 運命ナビ",
};

/**
 * 有料商品「わたしの取扱説明書 PREMIUM」の特定商取引法に基づく表記。
 *
 * ⚠️ 販売開始前に、下の【要記入】箇所（事業者名・所在地・電話番号・メールアドレス）を
 * 実際の内容に差し替えてください。この4項目は法律上の必須記載事項です。
 */

const TODO = "【要記入】";

export default function LawPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/manual/pro" className="text-xs text-muted hover:text-foreground">
          ← 商品ページへ戻る
        </Link>
      </div>

      <h1 className="text-xl font-bold text-accent-orange">特定商取引法に基づく表記</h1>

      <p className="text-xs text-muted">最終改定日: 2026年8月10日</p>

      <dl className="text-sm text-foreground/90 leading-relaxed divide-y divide-card-border border-y border-card-border">
        <Row label="販売事業者">{TODO}（例: 未来アカデミー）</Row>
        <Row label="運営責任者">岩田 しほり</Row>
        <Row label="所在地">
          {TODO}
          <span className="block text-xs text-muted mt-0.5">
            ※ ご請求があれば遅滞なく開示します、という記載のみで済ませることは
            現在の運用では認められていません。番地まで記載してください。
          </span>
        </Row>
        <Row label="電話番号">
          {TODO}
          <span className="block text-xs text-muted mt-0.5">
            ※ 受付時間を併記できます（例: 平日10:00〜17:00）。
          </span>
        </Row>
        <Row label="メールアドレス">{TODO}</Row>

        <Row label="商品名">わたしの取扱説明書 PREMIUM（全20ページ）</Row>
        <Row label="販売価格">3,300円（税込）</Row>
        <Row label="商品代金以外の必要料金">
          インターネット接続に必要な通信料はお客様のご負担となります。
        </Row>
        <Row label="お支払い方法">
          PayPal（クレジットカード・デビットカードを含む）
        </Row>
        <Row label="お支払い時期">お申し込み手続き時に即時決済されます。</Row>
        <Row label="商品の引渡時期">
          決済完了後、ただちに商品ページ上で作成いただけます。作成は数分で完了し、
          その場でご覧いただけます（デジタルコンテンツのため配送はありません）。
        </Row>
        <Row label="返品・キャンセルについて">
          商品の性質上、決済完了をもってサービスの提供が開始されるため、
          お客様のご都合による返品・キャンセル・返金はお受けできません。
          <span className="block mt-1">
            ただし、システム上の不具合により商品を作成できない場合は、
            上記メールアドレスまでご連絡ください。復旧または全額返金にて対応いたします。
          </span>
        </Row>
        <Row label="動作環境">
          最新版の Google Chrome / Safari / Microsoft Edge。
          作成した鑑定書はお客様のブラウザ内に保存されるため、
          ブラウザのデータを削除すると失われます。印刷またはPDF保存をおすすめします。
        </Row>
      </dl>

      <p className="text-xs text-muted leading-relaxed">
        ※ 本商品が提供する占術の結果は参考情報です。人生における重要な判断は
        お客様ご自身の責任で行ってください。本商品は医療・法律・投資に関する
        助言を行うものではありません。
      </p>

      <p className="text-xs pt-2 border-t border-card-border">
        <Link href="/terms" className="underline text-accent-gold">
          利用規約
        </Link>
        <span className="text-muted/50 mx-2">|</span>
        <Link href="/privacy" className="underline text-accent-gold">
          プライバシーポリシー
        </Link>
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 sm:flex sm:gap-4">
      <dt className="text-xs font-medium text-accent-gold sm:w-40 sm:flex-shrink-0 sm:pt-0.5">
        {label}
      </dt>
      <dd className="mt-1 sm:mt-0">{children}</dd>
    </div>
  );
}
