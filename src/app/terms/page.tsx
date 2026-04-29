import Link from "next/link";

export const metadata = {
  title: "利用規約 - 運命ナビ",
};

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-xs text-muted hover:text-foreground">
          ← ホームへ戻る
        </Link>
      </div>

      <h1 className="text-xl font-bold text-accent-orange">利用規約</h1>

      <p className="text-xs text-muted">
        最終改定日: 2026年4月29日
      </p>

      <section className="space-y-4 text-sm text-foreground/90 leading-relaxed">
        <p>
          本利用規約（以下「本規約」）は、未来アカデミー（以下「運営者」）が提供する占術統合アプリ「運命ナビ」（以下「本アプリ」）の利用条件を定めるものです。本アプリを利用するすべての方（以下「利用者」）は、本規約に同意したうえでご利用ください。
        </p>

        <h2 className="text-base font-medium text-accent-gold pt-2">第1条（適用範囲）</h2>
        <p>本規約は、本アプリの利用に関する運営者と利用者との間の一切の関係に適用されます。</p>

        <h2 className="text-base font-medium text-accent-gold pt-2">第2条（サービス内容）</h2>
        <p>
          本アプリは、数秘術・マヤ暦・九星気学・四柱推命・算命学などの占術を組み合わせて、利用者本人および利用者が登録した第三者（家族・受講生・顧客など）の運勢・性格・相性を表示する参考ツールです。
        </p>

        <h2 className="text-base font-medium text-accent-gold pt-2">第3条（占い結果の位置づけ）</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>本アプリの提供する占い結果はすべて<strong>参考情報</strong>であり、科学的根拠を保証するものではありません。</li>
          <li>医療・法律・投資・進路・結婚など、人生における重要な意思決定は、必ず利用者ご自身の判断と責任で行ってください。</li>
          <li>占い結果に基づいて発生したいかなる損害についても、運営者は責任を負いません。</li>
        </ul>

        <h2 className="text-base font-medium text-accent-gold pt-2">第4条（業務利用時の利用者責任）</h2>
        <p>
          結婚相談所・コーチング・コンサルティング業務など、利用者が第三者の生年月日等を入力して業務に利用する場合、利用者は以下の責任を負うものとします。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>第三者の個人情報（氏名・生年月日・出生地等）を入力する際は、本人から事前に同意を得ること。</li>
          <li>本アプリで得られた占い結果を顧客等に提示する際は、それが参考情報であることを明示すること。</li>
          <li>共用端末で本アプリを使用する場合は、第三者に画面が見られないよう配慮すること。</li>
          <li>本アプリ内に蓄積されたデータの管理（バックアップ・削除）は利用者の責任で行うこと。</li>
        </ul>

        <h2 className="text-base font-medium text-accent-gold pt-2">第5条（データの保管とリスク）</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>本アプリのデータは、原則として利用者のブラウザ内（ローカルストレージ）に保存されます。運営者のサーバーには保存されません。</li>
          <li>ブラウザのデータ削除・端末故障・ブラウザのプライベートモード・iOS Safariの長期未使用等により、データが失われる可能性があります。</li>
          <li>利用者は、本アプリの「エクスポート」機能を用いて定期的にバックアップを取ることを強く推奨します。</li>
          <li>データ消失について、運営者は一切の責任を負いません。</li>
        </ul>

        <h2 className="text-base font-medium text-accent-gold pt-2">第6条（禁止事項）</h2>
        <p>利用者は、本アプリの利用にあたり以下の行為を行ってはなりません。</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>法令または公序良俗に違反する行為</li>
          <li>第三者の同意を得ずにその個人情報を入力する行為</li>
          <li>本アプリの占い結果を、本人を装って第三者に有償で提供する行為</li>
          <li>本アプリのコード・デザイン・コンテンツを無断で複製・転載・販売する行為</li>
          <li>本アプリのシステムに不正アクセス・改変を加える行為</li>
          <li>その他、運営者が不適切と判断する行為</li>
        </ul>

        <h2 className="text-base font-medium text-accent-gold pt-2">第7条（知的財産権）</h2>
        <p>
          本アプリのソースコード・デザイン・占術解説文・アドバイステンプレート等の著作権は、運営者または正当な権利者に帰属します。利用者は私的利用の範囲を超えてこれらを利用することはできません。
        </p>

        <h2 className="text-base font-medium text-accent-gold pt-2">第8条（サービスの変更・中断・終了）</h2>
        <p>
          運営者は、利用者への事前通知なく、本アプリの内容を変更し、または提供を中断・終了することができるものとします。これによる利用者の損害について、運営者は責任を負いません。
        </p>

        <h2 className="text-base font-medium text-accent-gold pt-2">第9条（免責事項）</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>本アプリは現状有姿（as-is）で提供され、特定の目的への適合性・正確性・継続性を保証しません。</li>
          <li>占術エンジンの計算結果は流派や解釈によって異なる場合があります。</li>
          <li>運営者は、本アプリの利用または利用不能から生じた一切の損害について責任を負いません。</li>
        </ul>

        <h2 className="text-base font-medium text-accent-gold pt-2">第10条（規約の変更）</h2>
        <p>
          運営者は、必要と判断した場合、利用者への事前通知なく本規約を変更できるものとします。変更後の規約は、本ページに掲載した時点で効力を生じるものとします。
        </p>

        <h2 className="text-base font-medium text-accent-gold pt-2">第11条（準拠法・管轄裁判所）</h2>
        <p>
          本規約は日本法に準拠して解釈されます。本アプリに関して紛争が生じた場合、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
        </p>

        <h2 className="text-base font-medium text-accent-gold pt-2">第12条（お問い合わせ）</h2>
        <p>
          本規約および本アプリに関するお問い合わせは、以下の連絡先までお願いいたします。
        </p>
        <p className="bg-card-bg border border-card-border rounded-xl p-3 text-xs">
          運営者: 未来アカデミー<br />
          連絡先: mamaeri0617@gmail.com
        </p>
      </section>

      <div className="pt-4 border-t border-card-border">
        <Link
          href="/privacy"
          className="text-xs text-accent-orange underline hover:text-accent-light"
        >
          プライバシーポリシーはこちら →
        </Link>
      </div>
    </div>
  );
}
