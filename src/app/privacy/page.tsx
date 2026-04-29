import Link from "next/link";

export const metadata = {
  title: "プライバシーポリシー - 運命ナビ",
};

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-xs text-muted hover:text-foreground">
          ← ホームへ戻る
        </Link>
      </div>

      <h1 className="text-xl font-bold text-accent-orange">プライバシーポリシー</h1>

      <p className="text-xs text-muted">最終改定日: 2026年4月29日</p>

      <section className="space-y-4 text-sm text-foreground/90 leading-relaxed">
        <p>
          未来アカデミー（以下「運営者」）は、占術統合アプリ「運命ナビ」（以下「本アプリ」）における利用者のプライバシー保護を最重要視しています。本ポリシーでは、本アプリで取り扱う個人情報の方針について説明します。
        </p>

        <h2 className="text-base font-medium text-accent-gold pt-2">1. 取得する情報</h2>
        <p>本アプリでは、占術計算のために以下の情報を入力していただきます。</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>氏名（ニックネーム可）</li>
          <li>生年月日</li>
          <li>出生時間（任意）</li>
          <li>出生地（任意）</li>
          <li>性別（任意・相性マトリックスで使用）</li>
          <li>振り返り日記の内容（任意）</li>
          <li>ゴール・目標の内容（任意）</li>
          <li>鑑定結果メモ・画像（任意）</li>
          <li>受講生・顧客等のメモ（業務利用時、任意）</li>
        </ul>

        <h2 className="text-base font-medium text-accent-gold pt-2">2. データの保管場所</h2>
        <p className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">
          ⚠ 重要：本アプリで入力されたデータは、<strong>すべて利用者のブラウザのローカルストレージ内に保存</strong>されます。運営者のサーバーには送信・保存されません。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>同じ端末・同じブラウザでのみデータを参照できます。</li>
          <li>別の端末や別のブラウザでは、入力したデータは見えません。</li>
          <li>「エクスポート」機能でJSONファイルにバックアップし、別端末でインポートすることで移行できます。</li>
        </ul>

        <h2 className="text-base font-medium text-accent-gold pt-2">3. データの利用目的</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>占術計算と結果の表示</li>
          <li>運勢グラフ・相性診断・伴走アドバイス等の機能提供</li>
          <li>利用者本人による振り返り・記録の支援</li>
        </ul>

        <h2 className="text-base font-medium text-accent-gold pt-2">4. 第三者提供について</h2>
        <p>
          本アプリは、入力された個人情報を第三者に提供することはありません（運営者のサーバーに送信していないため、技術的にも提供は不可能です）。
        </p>

        <h2 className="text-base font-medium text-accent-gold pt-2">5. クッキーの使用</h2>
        <p>
          本アプリでは、簡易アクセス制限のためにクッキー（Cookie）を1種類使用する場合があります。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>名称: <code className="text-xs bg-card-bg px-1 rounded">unmei-unlock</code></li>
          <li>用途: 共通パスワードによるアクセス制限の認証情報を一時保存</li>
          <li>有効期限: 30日間</li>
          <li>属性: HttpOnly / Secure / SameSite=Lax</li>
        </ul>

        <h2 className="text-base font-medium text-accent-gold pt-2">6. データの削除</h2>
        <p>
          利用者は以下の方法でいつでもデータを削除できます。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>本アプリ内の「プロフィール削除」「日記削除」等の機能を使う</li>
          <li>ブラウザの設定から「サイトデータの削除」を実行する</li>
          <li>ブラウザのプライベートモードでアクセスする（利用終了時に自動削除）</li>
        </ul>

        <h2 className="text-base font-medium text-accent-gold pt-2">7. 業務利用時の追加事項</h2>
        <p className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs leading-relaxed">
          結婚相談所・コーチング・コンサルティング業務等で、利用者が顧客・受講生等の第三者の生年月日を本アプリに入力する場合は、利用者ご自身が個人情報取扱事業者として、第三者からの同意取得・適切な管理・削除義務など、関連法令上の責任を負うものとします。運営者は、利用者が入力した第三者の情報の取扱責任を負いません。
        </p>

        <h2 className="text-base font-medium text-accent-gold pt-2">8. 安全管理</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>本アプリはHTTPSによる暗号化通信を使用しています。</li>
          <li>ローカルストレージのデータは利用者の端末に保存されるため、端末のセキュリティ（OS・ブラウザのアップデート、画面ロック等）は利用者の管理範囲です。</li>
          <li>共用端末で利用する際は、シークレットモードでの利用、または利用後にデータをエクスポートして削除することを推奨します。</li>
        </ul>

        <h2 className="text-base font-medium text-accent-gold pt-2">9. 未成年者の利用</h2>
        <p>
          未成年者が本アプリを利用する場合、保護者の同意を得たうえでの利用をお願いいたします。
        </p>

        <h2 className="text-base font-medium text-accent-gold pt-2">10. 本ポリシーの変更</h2>
        <p>
          運営者は、必要と判断した場合、本ポリシーを変更することがあります。変更後のポリシーは、本ページに掲載した時点から効力を生じます。
        </p>

        <h2 className="text-base font-medium text-accent-gold pt-2">11. お問い合わせ</h2>
        <p>本ポリシーまたは個人情報の取扱いに関するお問い合わせは、以下までお願いいたします。</p>
        <p className="bg-card-bg border border-card-border rounded-xl p-3 text-xs">
          運営者: 未来アカデミー<br />
          連絡先: mamaeri0617@gmail.com
        </p>
      </section>

      <div className="pt-4 border-t border-card-border">
        <Link
          href="/terms"
          className="text-xs text-accent-orange underline hover:text-accent-light"
        >
          利用規約はこちら →
        </Link>
      </div>
    </div>
  );
}
