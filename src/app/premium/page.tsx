"use client";

/**
 * /premium — 有料版メニュー。
 *
 * 運命ナビの有料商品を並べる「お店の棚」。いまは1つだけだが、
 * 商品が増えても PRODUCTS に足すだけで並ぶようにしてある。
 */

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/dict";
import { PRO_PRICE_LABEL, PRO_PAGE_COUNT } from "@/lib/divination";

interface Product {
  href: string;
  emoji: string;
  badge: string;
  title: Record<Lang, string>;
  price: Record<Lang, string>;
  unit: Record<Lang, string>;
  lead: Record<Lang, string>;
  points: Record<Lang, string[]>;
}

const PRODUCTS: Product[] = [
  {
    href: "/manual/pro",
    emoji: "📖",
    badge: "PREMIUM",
    title: {
      ja: "わたしの取扱説明書 PREMIUM",
      ko: "나만의 사용설명서 PREMIUM",
    },
    price: PRO_PRICE_LABEL,
    unit: {
      ja: `全${PRO_PAGE_COUNT}ページ・買い切り`,
      ko: `전 ${PRO_PAGE_COUNT}페이지·1회 결제`,
    },
    lead: {
      ja: "生年月日から5つの占術を統合して、あなただけの鑑定書を書き下ろします。印刷すればA4で約20ページの冊子になります。",
      ko: "생년월일로 다섯 가지 점술을 통합해 당신만을 위한 감정서를 새로 씁니다. 인쇄하면 A4로 약 20페이지의 책자가 됩니다.",
    },
    points: {
      ja: [
        "生まれ持った才能と、まだ使っていない才能",
        "力を発揮する条件／消耗するパターンと対処法",
        "人間関係・仕事・お金・恋愛・健康・学び方",
        "人生の大きなリズムと、これから3年の過ごし方",
      ],
      ko: [
        "타고난 재능과, 아직 쓰지 않은 재능",
        "힘을 발휘하는 조건／소모되는 패턴과 대처법",
        "인간관계·일·돈·연애·건강·배움의 방식",
        "인생의 큰 리듬과, 앞으로 3년을 보내는 법",
      ],
    },
  },
];

const L: Record<Lang, Record<string, string>> = {
  ja: {
    title: "有料版",
    lead: "運命ナビの有料メニューです。すべて買い切りで、購入後は同じブラウザから何度でも作り直せます。",
    detail: "詳しく見る",
    freeNote: "無料でお使いいただける機能はこちら",
    law: "特定商取引法に基づく表記",
    terms: "利用規約",
    disclaimer:
      "※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。医療・法律・投資の助言ではありません。",
  },
  ko: {
    title: "유료판",
    lead: "운명내비의 유료 메뉴입니다. 모두 1회 결제이며, 구매 후에는 같은 브라우저에서 몇 번이든 다시 만들 수 있습니다.",
    detail: "자세히 보기",
    freeNote: "무료로 쓸 수 있는 기능은 이쪽",
    law: "특정상거래법에 근거한 표기",
    terms: "이용약관",
    disclaimer:
      "※ 점술은 참고 정보입니다. 인생의 중요한 판단은 스스로의 책임으로 하세요. 의료·법률·투자 조언이 아닙니다.",
  },
};

export default function PremiumPage() {
  const { lang } = useI18n();
  const s = L[lang];

  return (
    <div className="space-y-4">
      <header className="text-center space-y-1.5 pt-1">
        <h2 className="text-xl font-bold text-accent-orange font-mincho">✨ {s.title}</h2>
        <p className="text-[12px] text-foreground/75 leading-relaxed px-2">{s.lead}</p>
      </header>

      {PRODUCTS.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          className="block bg-gradient-to-br from-accent-gold/15 via-card-bg to-accent-orange/10 border border-accent-gold/40 rounded-2xl p-4 shadow-sm space-y-3 transition-transform active:scale-[0.99]"
        >
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center text-2xl shadow-inner">
              {p.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[9px] tracking-[0.18em] font-bold text-accent-gold border border-accent-gold/50 rounded-full px-2 py-0.5">
                {p.badge}
              </span>
              <p className="font-mincho text-[15px] font-bold text-foreground mt-1 leading-snug">
                {p.title[lang]}
              </p>
              <p className="text-lg font-bold text-accent-orange mt-0.5">{p.price[lang]}</p>
              <p className="text-[10px] text-muted">{p.unit[lang]}</p>
            </div>
          </div>

          <p className="text-[12px] text-foreground/80 leading-relaxed">{p.lead[lang]}</p>

          <ul className="space-y-1">
            {p.points[lang].map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-foreground/85">
                <span className="text-accent-gold mt-0.5">◆</span>
                <span className="leading-relaxed">{pt}</span>
              </li>
            ))}
          </ul>

          <p className="text-center text-[13px] font-bold text-white bg-accent-orange rounded-xl py-2.5">
            {s.detail} →
          </p>
        </Link>
      ))}

      <p className="text-center text-[11px] text-muted/80 px-4 leading-relaxed pt-1">
        {s.disclaimer}
      </p>

      <p className="text-center text-[11px] space-x-2">
        <Link href="/law" className="underline text-accent-gold">
          {s.law}
        </Link>
        <span className="text-muted/50">|</span>
        <Link href="/terms" className="underline text-accent-gold">
          {s.terms}
        </Link>
        <span className="text-muted/50">|</span>
        <Link href="/" className="underline text-accent-gold">
          {s.freeNote}
        </Link>
      </p>
    </div>
  );
}
