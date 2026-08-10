"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { loadProfile, loadProManual, saveProManual, type StoredProManual } from "@/lib/storage";
import {
  PRO_CHAPTERS,
  PRO_PART_COUNT,
  PRO_PRICE_LABEL,
  PART_TITLES,
  chaptersOfPart,
} from "@/lib/divination";
import { useI18n } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/dict";

/** この画面固有の二言語文言（dict.ts は編集禁止のためローカルで持つ） */
const L: Record<Lang, Record<string, string>> = {
  ja: {
    badge: "PREMIUM",
    title: "わたしの取扱説明書",
    lead: "あなたの生年月日から、5つの占術を統合した全20ページの鑑定書を、あなただけのためにお作りします。",
    freeNote: "無料版のトリセツはこちら",
    volumeNote: "全20章／1章あたり1,000〜1,400字。印刷するとA4で約20ページの冊子になります。",
    whatTitle: "この鑑定書に書かれていること",
    whatLead: "全20章。あなたの命式・星・数字を根拠にしながら、ひとつずつ言葉にしていきます。",
    // メリット
    meritTitle: "この鑑定書があると、こう変わります",
    merit1t: "強みが「人に説明できる言葉」になる",
    merit1d:
      "「なんとなく得意」だったことに根拠と名前がつきます。自己紹介・面談・プロフィール文にそのまま使えます。",
    merit2t: "できないことを、自分のせいにしなくなる",
    merit2d:
      "苦手なことには理由があります。「怠けているから」ではなく「そういう作りだから」と分かると、対処に頭を使えるようになります。",
    merit3t: "がんばりどきと、休みどきが分かる",
    merit3d:
      "9年サイクルと10年ごとの大運から、勝負に出ていい年・力を溜める年が見えます。空回りする時期に無理をしなくて済みます。",
    merit4t: "人に渡せる",
    merit4d:
      "家族・パートナー・職場の人に読んでもらえば、あなたへの接し方が変わります。最終章には、そのまま渡せる自己紹介文がついています。",
    merit5t: "迷ったときの、自分専用の基準ができる",
    merit5d:
      "印刷して手元に置けます。決めきれないとき、疲れたときに開く「自分の説明書」になります。",
    // 無料版との違い
    diffTitle: "無料版とのちがい",
    diffColFree: "無料版",
    diffColPro: "PREMIUM",
    diffRow1: "分量",
    diffFree1: "9章・要点のまとめ",
    diffPro1: "20章・A4で約20ページ",
    diffRow2: "書き方",
    diffFree2: "項目の箇条書き",
    diffPro2: "命式を根拠にした読み物",
    diffRow3: "扱う範囲",
    diffFree3: "性質・充電・注意点",
    diffPro3: "＋仕事・お金・恋愛・健康・学び方・これから3年",
    diffRow4: "作り方",
    diffFree4: "自動計算",
    diffPro4: "あなたの命式をAIが読み解いて執筆",
    diffRow5: "使い方",
    diffFree5: "画面で確認",
    diffPro5: "印刷・PDFで手元に。人にも渡せる",
    // サンプル
    sampleTitle: "文章のサンプル",
    sampleNote:
      "例：日主が丙（太陽）・主星が調舒星の方の「第3章 生まれ持った才能」より。実際の文章は、あなたの命式に合わせて書き下ろされます。",
    sampleBody:
      "あなたの強みは、ひとことでいえば「感じ取る力」と「照らす力」が同じ人の中に同居していることです。四柱推命であなたを表す日主は丙、太陽をあらわす天干です。その場にいるだけで空気が明るくなり、人が自然と集まってきます。一方、算命学の中央にある調舒星は、繊細な感受性と芸術性の星。人が言葉にしない気持ちの揺れを、あなたは先に感じ取ってしまいます。\n\nこの2つは一見すると正反対に見えますが、組み合わさると強力です。ただ明るいだけの人には、傷ついている人の本音は届きません。あなたは、相手の痛みを感じ取ったうえで、それでも前を向ける明るさを差し出せる。これは訓練で身につくものではなく、生まれ持った配置です。",
    sampleFoot: "※ サンプルは一例です。実際の内容は生年月日によって大きく変わります。",
    forTitle: "こんな方に",
    for1: "自分の強みを、人に説明できる言葉にしたい方",
    for2: "がんばっているのに空回りする感覚がある方",
    for3: "これからの3年をどう過ごすか決めたい方",
    for4: "家族やチームに「私の取扱説明書」を渡したい方",
    howTitle: "お受け取りまでの流れ",
    how1: "お支払い",
    how1d: "決済が完了すると、このページで作成できるようになります。",
    how2: "生年月日を確認",
    how2d: "登録済みのプロフィールをそのまま使えます。出生時刻があるとより精密になります。",
    how3: "作成ボタンを押す",
    how3d: "3〜5分ほどで全20ページが仕上がります。ページを閉じずにお待ちください。",
    how4: "印刷・PDF保存",
    how4d: "作成後はいつでも読み返せます。印刷ボタンからPDFとして保存できます。",
    priceLabel: "全20ページ・買い切り",
    buyTitle: "お申し込み",
    payPaypal: "PayPalでお支払い（カードもOK）",
    payPaypalNote:
      "PayPalアカウントをお持ちでない方も、そのままクレジットカード／デビットカードでお支払いいただけます。",
    codeTitle: "アンロックコードをお持ちの方",
    codeNote: "お支払い後にお渡ししたコードを入力してください。",
    codePlaceholder: "コードを入力",
    codeSubmit: "解除する",
    payPrep:
      "ただいまお申し込み方法を準備中です。LINEからお問い合わせください。",
    faqTitle: "よくあるご質問",
    q1: "出生時刻が分からなくても作れますか？",
    a1: "作れます。時刻がない場合は日付ベースで読み解きます。時刻があると四柱推命の時柱が加わり、より精密になります。",
    q2: "作り直しはできますか？",
    a2: "できます。一度お支払いいただければ、同じブラウザから何度でも作り直せます（内容は毎回少しずつ変わります）。",
    q3: "データはどこに保存されますか？",
    a3: "作成した鑑定書はあなたのブラウザ内にのみ保存されます。ブラウザのデータを消すと消えますので、印刷またはPDF保存をおすすめします。",
    q4: "当たりますか？",
    a4: "占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。この鑑定書は、あなたが自分を知り、選ぶための材料としてお使いください。",
    // 作成画面
    ready: "作成の準備ができました",
    profileTitle: "鑑定に使う情報",
    nameLabel: "お名前（任意）",
    birthDateLabel: "生年月日",
    birthTimeLabel: "出生時刻（任意・分かれば精度が上がります）",
    noProfile: "生年月日を入力してください。",
    generate: "全20ページを作成する",
    regenerate: "作り直す",
    generating: "作成中",
    generatingNote: "ページを閉じずにお待ちください。3〜5分ほどかかります。",
    partOf: "／全{n}部",
    aiNotReady:
      "AIによる作成はまだ準備中です（サーバーにAPIキーが未設定です）。設定が完了するまでお待ちください。",
    print: "🖨 印刷 / PDF保存",
    toc: "目次",
    generatedAt: "作成日",
    keyPoints: "この章の要点",
    chapterLabel: "第{n}章",
    retry: "もう一度試す",
    savedWarn:
      "※ ブラウザの保存容量が足りず、保存できませんでした。このまま印刷／PDF保存をおすすめします。",
    disclaimer:
      "※ 占いは参考情報です。人生の重要な判断はご自身の責任で行ってください。この鑑定書は医療・法律・投資の助言ではありません。",
    lawTitle: "特定商取引法に基づく表記",
    termsTitle: "利用規約",
    backToManual: "無料版のトリセツへ",
  },
  ko: {
    badge: "PREMIUM",
    title: "나만의 사용설명서",
    lead: "생년월일을 바탕으로 다섯 가지 점술을 통합한 전 20페이지의 감정서를, 당신만을 위해 만들어 드립니다.",
    freeNote: "무료판 사용설명서는 이쪽",
    volumeNote:
      "전 20장／한 장당 1,000~1,400자. 인쇄하면 A4로 약 20페이지의 책자가 됩니다.",
    whatTitle: "이 감정서에 담기는 것",
    whatLead: "전 20장. 당신의 명식·별·숫자를 근거로 하나씩 언어로 풀어냅니다.",
    // 메리트
    meritTitle: "이 감정서가 있으면, 이렇게 달라집니다",
    merit1t: "강점이 '남에게 설명할 수 있는 말'이 됩니다",
    merit1d:
      "'왠지 잘하는 것'이었던 일에 근거와 이름이 붙습니다. 자기소개·면담·프로필 글에 그대로 쓸 수 있어요.",
    merit2t: "못하는 것을 자기 탓으로 돌리지 않게 됩니다",
    merit2d:
      "서툰 일에는 이유가 있습니다. '게을러서'가 아니라 '그렇게 만들어져서'라고 알면, 대처에 머리를 쓸 수 있게 됩니다.",
    merit3t: "힘낼 때와 쉴 때를 알 수 있습니다",
    merit3d:
      "9년 사이클과 10년 단위 대운에서, 승부를 걸어도 되는 해와 힘을 모을 해가 보입니다. 헛도는 시기에 무리하지 않아도 됩니다.",
    merit4t: "남에게 건넬 수 있습니다",
    merit4d:
      "가족·파트너·직장 사람이 읽으면 당신을 대하는 방식이 달라집니다. 마지막 장에는 그대로 건넬 수 있는 자기소개 글이 있습니다.",
    merit5t: "헤맬 때 돌아갈 나만의 기준이 생깁니다",
    merit5d:
      "인쇄해서 곁에 둘 수 있습니다. 결정하지 못할 때, 지쳤을 때 펼치는 '나의 설명서'가 됩니다.",
    // 무료판과의 차이
    diffTitle: "무료판과의 차이",
    diffColFree: "무료판",
    diffColPro: "PREMIUM",
    diffRow1: "분량",
    diffFree1: "9장·요점 정리",
    diffPro1: "20장·A4로 약 20페이지",
    diffRow2: "서술 방식",
    diffFree2: "항목 나열",
    diffPro2: "명식을 근거로 한 읽을거리",
    diffRow3: "다루는 범위",
    diffFree3: "성질·충전·주의점",
    diffPro3: "＋일·돈·연애·건강·배움·앞으로 3년",
    diffRow4: "만드는 방식",
    diffFree4: "자동 계산",
    diffPro4: "당신의 명식을 AI가 읽어 집필",
    diffRow5: "사용법",
    diffFree5: "화면에서 확인",
    diffPro5: "인쇄·PDF로 곁에. 남에게도 건넬 수 있음",
    // 샘플
    sampleTitle: "문장 샘플",
    sampleNote:
      "예: 일간이 병(태양)·주성이 조서성인 분의 「제3장 타고난 재능」에서. 실제 문장은 당신의 명식에 맞춰 새로 쓰여집니다.",
    sampleBody:
      "당신의 강점은 한마디로 '느끼는 힘'과 '비추는 힘'이 한 사람 안에 함께 있다는 것입니다. 사주에서 당신을 나타내는 일간은 병(丙), 태양을 뜻하는 천간입니다. 그 자리에 있는 것만으로 공기가 밝아지고, 사람이 자연스럽게 모여듭니다. 한편 산명학의 중앙에 있는 조서성은 섬세한 감수성과 예술성의 별. 사람들이 말로 하지 않는 마음의 흔들림을 당신은 먼저 느껴 버립니다.\n\n이 둘은 언뜻 정반대로 보이지만, 합쳐지면 강력합니다. 그저 밝기만 한 사람에게는 상처 입은 사람의 속마음이 닿지 않습니다. 당신은 상대의 아픔을 느낀 뒤에도, 그럼에도 앞을 볼 수 있는 밝음을 건넬 수 있습니다. 이는 훈련으로 익히는 것이 아니라 타고난 배치입니다.",
    sampleFoot: "※ 샘플은 하나의 예입니다. 실제 내용은 생년월일에 따라 크게 달라집니다.",
    forTitle: "이런 분께",
    for1: "자신의 강점을 남에게 설명할 수 있는 말로 만들고 싶은 분",
    for2: "열심히 하는데도 헛도는 느낌이 있는 분",
    for3: "앞으로 3년을 어떻게 보낼지 정하고 싶은 분",
    for4: "가족이나 팀에게 '나의 사용설명서'를 건네고 싶은 분",
    howTitle: "받으시기까지의 흐름",
    how1: "결제",
    how1d: "결제가 완료되면 이 페이지에서 만들 수 있게 됩니다.",
    how2: "생년월일 확인",
    how2d: "등록된 프로필을 그대로 쓸 수 있습니다. 출생시각이 있으면 더 정밀해집니다.",
    how3: "작성 버튼 누르기",
    how3d: "3~5분 정도면 전 20페이지가 완성됩니다. 페이지를 닫지 말고 기다려 주세요.",
    how4: "인쇄·PDF 저장",
    how4d: "작성 후에는 언제든 다시 읽을 수 있습니다. 인쇄 버튼에서 PDF로 저장할 수 있습니다.",
    priceLabel: "전 20페이지·1회 결제",
    buyTitle: "신청하기",
    payPaypal: "PayPal로 결제 (카드도 가능)",
    payPaypalNote:
      "PayPal 계정이 없으셔도 그대로 신용카드／체크카드로 결제하실 수 있습니다.",
    codeTitle: "언락 코드를 가지고 계신 분",
    codeNote: "결제 후 전달해 드린 코드를 입력해 주세요.",
    codePlaceholder: "코드 입력",
    codeSubmit: "해제하기",
    payPrep: "지금 신청 방법을 준비 중입니다. LINE으로 문의해 주세요.",
    faqTitle: "자주 묻는 질문",
    q1: "출생시각을 몰라도 만들 수 있나요?",
    a1: "만들 수 있습니다. 시각이 없으면 날짜 기준으로 읽어냅니다. 시각이 있으면 사주의 시주가 더해져 더 정밀해집니다.",
    q2: "다시 만들 수 있나요?",
    a2: "가능합니다. 한 번 결제하시면 같은 브라우저에서 몇 번이든 다시 만들 수 있습니다(내용은 매번 조금씩 달라집니다).",
    q3: "데이터는 어디에 저장되나요?",
    a3: "작성한 감정서는 당신의 브라우저 안에만 저장됩니다. 브라우저 데이터를 지우면 사라지니 인쇄 또는 PDF 저장을 권해 드립니다.",
    q4: "잘 맞나요?",
    a4: "점술은 참고 정보입니다. 인생의 중요한 판단은 스스로의 책임으로 하세요. 이 감정서는 당신이 자신을 알고 선택하기 위한 재료로 사용해 주세요.",
    ready: "작성 준비가 되었습니다",
    profileTitle: "감정에 사용할 정보",
    nameLabel: "이름 (선택)",
    birthDateLabel: "생년월일",
    birthTimeLabel: "출생시각 (선택·알면 정확도가 올라갑니다)",
    noProfile: "생년월일을 입력해 주세요.",
    generate: "전 20페이지 작성하기",
    regenerate: "다시 만들기",
    generating: "작성 중",
    generatingNote: "페이지를 닫지 말고 기다려 주세요. 3~5분 정도 걸립니다.",
    partOf: "／전 {n}부",
    aiNotReady:
      "AI 작성은 아직 준비 중입니다(서버에 API 키가 설정되지 않았습니다). 설정이 끝날 때까지 기다려 주세요.",
    print: "🖨 인쇄 / PDF 저장",
    toc: "목차",
    generatedAt: "작성일",
    keyPoints: "이 장의 요점",
    chapterLabel: "제{n}장",
    retry: "다시 시도",
    savedWarn:
      "※ 브라우저 저장 용량이 부족해 저장하지 못했습니다. 이대로 인쇄／PDF 저장을 권해 드립니다.",
    disclaimer:
      "※ 점술은 참고 정보입니다. 인생의 중요한 판단은 스스로의 책임으로 하세요. 이 감정서는 의료·법률·투자 조언이 아닙니다.",
    lawTitle: "특정상거래법에 근거한 표기",
    termsTitle: "이용약관",
    backToManual: "무료판 사용설명서로",
  },
};

interface UnlockStatus {
  unlocked: boolean;
  paypal: boolean;
  codeEnabled: boolean;
  aiReady: boolean;
}

type PaypalButtons = (config: unknown) => { render: (sel: string) => void };
declare global {
  interface Window {
    paypal?: { Buttons: PaypalButtons };
  }
}

export default function ProManualPage() {
  const { lang } = useI18n();
  const s = L[lang];

  const [status, setStatus] = useState<UnlockStatus | null>(null);
  const [manual, setManual] = useState<StoredProManual | null>(null);

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0); // 完了したパート数
  const [error, setError] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  useEffect(() => {
    const p = loadProfile();
    if (p) {
      setName(p.name || "");
      setBirthDate(p.birthDate || "");
      setBirthTime(p.birthTime || "");
    }
    setManual(loadProManual());

    fetch("/api/pro-unlock")
      .then((r) => r.json())
      .then((d: UnlockStatus) => setStatus(d))
      .catch(() =>
        setStatus({ unlocked: false, paypal: false, codeEnabled: false, aiReady: false })
      );
  }, []);

  // --- 生成 ---
  const generate = useCallback(async () => {
    if (!birthDate) return;
    setBusy(true);
    setError("");
    setSaveFailed(false);
    setProgress(0);

    const collected: { no: number; body: string; keyPoints: string[] }[] = [];

    try {
      for (let part = 1; part <= PRO_PART_COUNT; part++) {
        const res = await fetch("/api/pro-manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            part,
            name,
            birthDate,
            birthTime,
            lang,
            previousKeyPoints: collected.map((c) => ({ no: c.no, points: c.keyPoints })),
          }),
        });
        const data = await res.json();
        if (!data.ok) {
          setError(data.message || "作成に失敗しました");
          setBusy(false);
          return;
        }
        collected.push(...data.chapters);
        setProgress(part);
      }

      const built: StoredProManual = {
        version: 1,
        generatedAt: new Date().toISOString(),
        lang,
        name,
        birthDate,
        birthTime,
        chapters: collected.sort((a, b) => a.no - b.no),
      };
      setManual(built);
      if (!saveProManual(built)) setSaveFailed(true);
    } catch {
      setError("通信に失敗しました。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }, [birthDate, birthTime, name, lang]);

  const submitCode = useCallback(async () => {
    setCodeError("");
    const res = await fetch("/api/pro-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (data.ok) {
      setStatus((prev) => (prev ? { ...prev, unlocked: true } : prev));
      setCode("");
    } else {
      setCodeError(data.message || "解除できませんでした");
    }
  }, [code]);

  const onPaypalApproved = useCallback(async (orderId: string) => {
    const res = await fetch("/api/pro-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paypalOrderId: orderId }),
    });
    const data = await res.json();
    if (data.ok) {
      setStatus((prev) => (prev ? { ...prev, unlocked: true } : prev));
    } else {
      setCodeError(data.message || "お支払いの確認ができませんでした");
    }
  }, []);

  if (!status) {
    return <p className="text-center text-sm text-muted py-16">…</p>;
  }

  if (!status.unlocked) {
    return (
      <SalesView
        s={s}
        lang={lang}
        status={status}
        code={code}
        setCode={setCode}
        codeError={codeError}
        submitCode={submitCode}
        onPaypalApproved={onPaypalApproved}
      />
    );
  }

  if (manual) {
    return (
      <ManualView
        s={s}
        lang={lang}
        manual={manual}
        saveFailed={saveFailed}
        busy={busy}
        progress={progress}
        error={error}
        onRegenerate={generate}
      />
    );
  }

  return (
    <GenerateView
      s={s}
      lang={lang}
      aiReady={status.aiReady}
      name={name}
      setName={setName}
      birthDate={birthDate}
      setBirthDate={setBirthDate}
      birthTime={birthTime}
      setBirthTime={setBirthTime}
      busy={busy}
      progress={progress}
      error={error}
      onGenerate={generate}
    />
  );
}

// --- 販売画面（未購入） ---

function SalesView({
  s,
  lang,
  status,
  code,
  setCode,
  codeError,
  submitCode,
  onPaypalApproved,
}: {
  s: Record<string, string>;
  lang: Lang;
  status: UnlockStatus;
  code: string;
  setCode: (v: string) => void;
  codeError: string;
  submitCode: () => void;
  onPaypalApproved: (orderId: string) => void;
}) {
  return (
    <div className="space-y-5">
      {/* ヒーロー */}
      <section className="bg-gradient-to-br from-accent-gold/15 via-card-bg to-accent-orange/10 border border-accent-gold/40 rounded-2xl p-5 shadow-sm text-center space-y-2.5">
        <span className="inline-block text-[10px] tracking-[0.2em] font-bold text-accent-gold border border-accent-gold/50 rounded-full px-3 py-1">
          {s.badge}
        </span>
        <h2 className="text-2xl font-bold text-accent-orange font-mincho leading-snug">
          {s.title}
        </h2>
        <p className="text-[13px] text-foreground/85 leading-relaxed px-1">{s.lead}</p>
        <p className="text-3xl font-bold text-foreground pt-1">{PRO_PRICE_LABEL[lang]}</p>
        <p className="text-[11px] text-muted">{s.priceLabel}</p>
        <p className="text-[11px] text-muted/80 leading-relaxed pt-1 border-t border-accent-gold/20">
          {s.volumeNote}
        </p>
      </section>

      {/* こんな方に */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <h3 className="text-sm font-bold text-foreground">🌿 {s.forTitle}</h3>
        <ul className="space-y-1.5">
          {[s.for1, s.for2, s.for3, s.for4].map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-foreground/85">
              <span className="text-accent-gold mt-0.5">✓</span>
              <span className="leading-relaxed">{t}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* こう変わります（メリット） */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-foreground">✨ {s.meritTitle}</h3>
        {[
          [s.merit1t, s.merit1d],
          [s.merit2t, s.merit2d],
          [s.merit3t, s.merit3d],
          [s.merit4t, s.merit4d],
          [s.merit5t, s.merit5d],
        ].map(([t, d], i) => (
          <div key={i} className="flex gap-2.5">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-gold/15 text-accent-gold text-[11px] font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <div>
              <p className="text-[13px] font-bold text-foreground leading-snug">{t}</p>
              <p className="text-[12px] text-foreground/75 leading-relaxed mt-0.5">{d}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 中身（全20章・各章で何が読めるか） */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3.5">
        <div>
          <h3 className="text-sm font-bold text-foreground">📖 {s.whatTitle}</h3>
          <p className="text-[11px] text-muted mt-0.5">{s.whatLead}</p>
        </div>
        {[1, 2, 3, 4].map((part) => (
          <div key={part} className="space-y-2">
            <p className="text-[11px] font-bold text-accent-gold border-b border-accent-gold/20 pb-1">
              {PART_TITLES[part][lang]}
            </p>
            {chaptersOfPart(part).map((c) => (
              <div key={c.no} className="flex gap-2">
                <span className="text-[11px] text-accent-gold/70 tabular-nums w-5 flex-shrink-0 pt-0.5">
                  {String(c.no).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-[12.5px] font-medium text-foreground leading-snug">
                    {c.title[lang]}
                  </p>
                  <p className="text-[11.5px] text-foreground/65 leading-relaxed mt-0.5">
                    {c.blurb[lang]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* 文章のサンプル */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <h3 className="text-sm font-bold text-foreground">✒️ {s.sampleTitle}</h3>
        <p className="text-[11px] text-muted leading-relaxed">{s.sampleNote}</p>
        <div className="bg-white/70 border-l-2 border-accent-gold/50 rounded-r-lg px-3.5 py-3 space-y-2.5">
          {s.sampleBody.split("\n\n").map((para, i) => (
            <p key={i} className="text-[12.5px] text-foreground/85 leading-[1.9]">
              {para}
            </p>
          ))}
        </div>
        <p className="text-[10px] text-muted/70">{s.sampleFoot}</p>
      </section>

      {/* 無料版とのちがい */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
        <h3 className="text-sm font-bold text-foreground">⚖️ {s.diffTitle}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px] border-collapse">
            <thead>
              <tr className="text-left">
                <th className="w-16 pb-1.5" />
                <th className="pb-1.5 font-medium text-muted">{s.diffColFree}</th>
                <th className="pb-1.5 font-bold text-accent-orange">{s.diffColPro}</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {[
                [s.diffRow1, s.diffFree1, s.diffPro1],
                [s.diffRow2, s.diffFree2, s.diffPro2],
                [s.diffRow3, s.diffFree3, s.diffPro3],
                [s.diffRow4, s.diffFree4, s.diffPro4],
                [s.diffRow5, s.diffFree5, s.diffPro5],
              ].map(([label, free, pro], i) => (
                <tr key={i} className="border-t border-card-border">
                  <th className="py-2 pr-2 text-left font-medium text-accent-gold whitespace-nowrap">
                    {label}
                  </th>
                  <td className="py-2 pr-2 text-foreground/60 leading-snug">{free}</td>
                  <td className="py-2 text-foreground/90 leading-snug">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 流れ */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2.5">
        <h3 className="text-sm font-bold text-foreground">🗺 {s.howTitle}</h3>
        {[
          [s.how1, s.how1d],
          [s.how2, s.how2d],
          [s.how3, s.how3d],
          [s.how4, s.how4d],
        ].map(([t, d], i) => (
          <div key={i} className="flex gap-2.5">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-orange/15 text-accent-orange text-[11px] font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <div>
              <p className="text-[13px] font-medium text-foreground">{t}</p>
              <p className="text-[12px] text-foreground/70 leading-relaxed">{d}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 申し込み */}
      <section
        id="buy"
        className="bg-gradient-to-br from-accent-orange/10 via-card-bg to-accent-gold/5 border border-accent-orange/30 rounded-2xl p-4 shadow-sm space-y-3"
      >
        <h3 className="text-sm font-bold text-foreground text-center">{s.buyTitle}</h3>
        <p className="text-center text-2xl font-bold text-accent-orange">
          {PRO_PRICE_LABEL[lang]}
        </p>

        {status.paypal ? (
          <div className="space-y-1.5">
            <PaypalButton onApproved={onPaypalApproved} />
            <p className="text-[11px] text-muted leading-relaxed">{s.payPaypalNote}</p>
          </div>
        ) : (
          !status.codeEnabled && (
            <p className="text-[12px] text-foreground/80 bg-white/70 rounded-xl px-3 py-2.5 leading-relaxed">
              {s.payPrep}
            </p>
          )
        )}

        {status.codeEnabled && (
          <div className="pt-2 border-t border-card-border space-y-1.5">
            <p className="text-[12px] font-medium text-foreground">{s.codeTitle}</p>
            <p className="text-[11px] text-muted">{s.codeNote}</p>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={s.codePlaceholder}
                className="flex-1 min-w-0 bg-white border border-card-border rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={submitCode}
                disabled={!code.trim()}
                className="flex-shrink-0 bg-accent-orange text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-40"
              >
                {s.codeSubmit}
              </button>
            </div>
          </div>
        )}

        {codeError && <p className="text-[12px] text-danger">{codeError}</p>}
      </section>

      {/* FAQ */}
      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2.5">
        <h3 className="text-sm font-bold text-foreground">💬 {s.faqTitle}</h3>
        {[
          [s.q1, s.a1],
          [s.q2, s.a2],
          [s.q3, s.a3],
          [s.q4, s.a4],
        ].map(([q, a], i) => (
          <div key={i} className="bg-white/60 rounded-lg px-3 py-2.5">
            <p className="text-[12px] font-bold text-foreground flex items-start gap-1.5">
              <span className="text-accent-orange">Q.</span> {q}
            </p>
            <p className="text-[12px] text-foreground/80 leading-relaxed mt-1 flex items-start gap-1.5">
              <span className="text-accent-gold font-bold">A.</span> {a}
            </p>
          </div>
        ))}
      </section>

      <p className="text-center text-[11px] text-muted/80 px-4 leading-relaxed">{s.disclaimer}</p>

      <p className="text-center text-[11px]">
        <Link href="/manual" className="underline text-accent-gold">
          {s.freeNote}
        </Link>
        <span className="text-muted/50 mx-2">|</span>
        <Link href="/law" className="underline text-accent-gold">
          {s.lawTitle}
        </Link>
        <span className="text-muted/50 mx-2">|</span>
        <Link href="/terms" className="underline text-accent-gold">
          {s.termsTitle}
        </Link>
      </p>
    </div>
  );
}

/** PayPalスマートボタン。SDKはこの画面を開いたときだけ読み込む */
function PaypalButton({ onApproved }: { onApproved: (orderId: string) => void }) {
  const containerId = "paypal-button-container";
  const rendered = useRef(false);
  // onApproved の再生成でボタンを描画し直さないよう、最新版をrefで参照する
  const approvedRef = useRef(onApproved);
  useEffect(() => {
    approvedRef.current = onApproved;
  }, [onApproved]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId || rendered.current) return;

    const render = () => {
      if (rendered.current || !window.paypal) return;
      rendered.current = true;
      window.paypal
        .Buttons({
          style: { layout: "vertical", shape: "pill", label: "pay" },
          createOrder: (_data: unknown, actions: {
            order: { create: (o: unknown) => Promise<string> };
          }) =>
            actions.order.create({
              // JPY は小数を持たないため整数の文字列で渡す
              purchase_units: [{ amount: { value: "3300", currency_code: "JPY" } }],
            }),
          onApprove: async (
            data: { orderID: string },
            actions: { order: { capture: () => Promise<unknown> } }
          ) => {
            await actions.order.capture();
            approvedRef.current(data.orderID);
          },
        })
        .render(`#${containerId}`);
    };

    if (window.paypal) {
      render();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=JPY&intent=capture`;
    script.async = true;
    script.onload = render;
    document.body.appendChild(script);
  }, []);

  return <div id={containerId} />;
}

// --- 作成画面（購入済み・未作成） ---

function GenerateView({
  s,
  lang,
  aiReady,
  name,
  setName,
  birthDate,
  setBirthDate,
  birthTime,
  setBirthTime,
  busy,
  progress,
  error,
  onGenerate,
}: {
  s: Record<string, string>;
  lang: Lang;
  aiReady: boolean;
  name: string;
  setName: (v: string) => void;
  birthDate: string;
  setBirthDate: (v: string) => void;
  birthTime: string;
  setBirthTime: (v: string) => void;
  busy: boolean;
  progress: number;
  error: string;
  onGenerate: () => void;
}) {
  return (
    <div className="space-y-4">
      <section className="bg-gradient-to-br from-accent-gold/15 via-card-bg to-accent-orange/10 border border-accent-gold/40 rounded-2xl p-5 shadow-sm text-center space-y-1.5">
        <span className="inline-block text-[10px] tracking-[0.2em] font-bold text-accent-gold border border-accent-gold/50 rounded-full px-3 py-1">
          {s.badge}
        </span>
        <h2 className="text-xl font-bold text-accent-orange font-mincho">{s.ready}</h2>
        <p className="text-[12px] text-foreground/80">{s.lead}</p>
      </section>

      <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-foreground">{s.profileTitle}</h3>
        <Field label={s.nameLabel}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-card-border rounded-lg px-3 py-2 text-sm"
          />
        </Field>
        <Field label={s.birthDateLabel}>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full bg-white border border-card-border rounded-lg px-3 py-2 text-sm"
          />
        </Field>
        <Field label={s.birthTimeLabel}>
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="w-full bg-white border border-card-border rounded-lg px-3 py-2 text-sm"
          />
        </Field>
      </section>

      {!aiReady && (
        <p className="text-[12px] text-foreground/80 bg-danger/5 border border-danger/20 rounded-xl px-3 py-2.5 leading-relaxed">
          {s.aiNotReady}
        </p>
      )}

      <GenerateButton
        s={s}
        lang={lang}
        busy={busy}
        progress={progress}
        disabled={!birthDate || !aiReady}
        label={s.generate}
        onClick={onGenerate}
      />

      {!birthDate && <p className="text-center text-[12px] text-muted">{s.noProfile}</p>}
      {error && (
        <p className="text-center text-[12px] text-danger leading-relaxed px-4">{error}</p>
      )}
    </div>
  );
}

function GenerateButton({
  s,
  lang,
  busy,
  progress,
  disabled,
  label,
  onClick,
}: {
  s: Record<string, string>;
  lang: Lang;
  busy: boolean;
  progress: number;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  if (busy) {
    return (
      <div className="bg-card-bg border border-accent-gold/40 rounded-2xl p-4 text-center space-y-2">
        <p className="text-sm font-bold text-accent-orange">
          {s.generating} {progress}
          {s.partOf.replace("{n}", String(PRO_PART_COUNT))}
        </p>
        <div className="h-2 bg-accent-gold/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-orange transition-all duration-500"
            style={{ width: `${(progress / PRO_PART_COUNT) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-muted leading-relaxed">{s.generatingNote}</p>
        <p className="text-[11px] text-muted/70">
          {lang === "ko"
            ? `${PART_TITLES[Math.min(progress + 1, PRO_PART_COUNT)].ko} 집필 중…`
            : `${PART_TITLES[Math.min(progress + 1, PRO_PART_COUNT)].ja} を執筆中…`}
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-accent-orange text-white text-base font-bold rounded-2xl py-4 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] text-muted">{label}</span>
      {children}
    </label>
  );
}

// --- 鑑定書の表示（購入済み・作成済み） ---

function ManualView({
  s,
  lang,
  manual,
  saveFailed,
  busy,
  progress,
  error,
  onRegenerate,
}: {
  s: Record<string, string>;
  lang: Lang;
  manual: StoredProManual;
  saveFailed: boolean;
  busy: boolean;
  progress: number;
  error: string;
  onRegenerate: () => void;
}) {
  const byNo = useMemo(
    () => new Map(manual.chapters.map((c) => [c.no, c])),
    [manual.chapters]
  );
  const generated = new Date(manual.generatedAt);

  return (
    <div className="space-y-4">
      {/* 表紙 */}
      <section className="pro-chapter bg-gradient-to-br from-accent-gold/15 via-card-bg to-accent-orange/10 border border-accent-gold/40 rounded-2xl p-6 shadow-sm text-center space-y-2">
        <span className="inline-block text-[10px] tracking-[0.2em] font-bold text-accent-gold border border-accent-gold/50 rounded-full px-3 py-1">
          {s.badge}
        </span>
        <h2 className="text-2xl font-bold text-accent-orange font-mincho leading-snug">
          {s.title}
        </h2>
        {manual.name && (
          <p className="text-base text-foreground font-mincho">{manual.name}</p>
        )}
        <p className="text-[11px] text-muted">
          {manual.birthDate}
          {manual.birthTime && ` ${manual.birthTime}`}
        </p>
        <p className="text-[11px] text-muted/70">
          {s.generatedAt}: {generated.toLocaleDateString(lang === "ko" ? "ko-KR" : "ja-JP")}
        </p>
      </section>

      <div className="flex justify-end gap-2 no-print">
        <button
          onClick={() => window.print()}
          className="text-xs bg-white border border-card-border rounded-full px-3 py-1.5 text-muted hover:border-accent-gold transition-colors"
        >
          {s.print}
        </button>
      </div>

      {saveFailed && (
        <p className="text-[11px] text-danger leading-relaxed no-print">{s.savedWarn}</p>
      )}

      {/* 目次 */}
      <nav className="bg-card-bg border border-card-border rounded-2xl p-3.5 shadow-sm space-y-2">
        <p className="text-xs font-bold text-accent-gold flex items-center gap-1.5">
          <span>≡</span> {s.toc}
        </p>
        {[1, 2, 3, 4].map((part) => (
          <div key={part}>
            <p className="text-[11px] font-bold text-foreground/70 mt-1.5">
              {PART_TITLES[part][lang]}
            </p>
            {chaptersOfPart(part).map((c) => (
              <a
                key={c.no}
                href={`#pro-${c.no}`}
                className="text-[12px] text-foreground/80 hover:text-accent-orange py-0.5 flex items-center gap-2"
              >
                <span className="text-accent-gold font-bold tabular-nums w-5">
                  {String(c.no).padStart(2, "0")}
                </span>
                {c.title[lang]}
              </a>
            ))}
          </div>
        ))}
      </nav>

      {/* 本文 */}
      {PRO_CHAPTERS.map((spec) => {
        const ch = byNo.get(spec.no);
        if (!ch) return null;
        return (
          <section
            key={spec.no}
            id={`pro-${spec.no}`}
            className="pro-chapter scroll-mt-4 bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3"
          >
            <header className="space-y-0.5">
              <p className="text-[10px] tracking-widest text-accent-gold font-bold">
                {s.chapterLabel.replace("{n}", String(spec.no))}
              </p>
              <h3 className="text-base font-bold text-foreground font-mincho leading-snug">
                {spec.title[lang]}
              </h3>
            </header>

            <div className="space-y-2.5">
              {ch.body.split(/\n{2,}/).map((para, i) => (
                <p key={i} className="text-[13px] text-foreground/90 leading-[1.9]">
                  {para.trim()}
                </p>
              ))}
            </div>

            {ch.keyPoints.length > 0 && (
              <div className="bg-accent-gold/8 border border-accent-gold/25 rounded-xl px-3 py-2.5 space-y-1">
                <p className="text-[10px] font-bold text-accent-gold">{s.keyPoints}</p>
                {ch.keyPoints.map((k, i) => (
                  <p
                    key={i}
                    className="text-[12px] text-foreground/85 leading-relaxed flex items-start gap-1.5"
                  >
                    <span className="text-accent-gold">◆</span>
                    {k}
                  </p>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <p className="text-center text-[11px] text-muted/80 px-4 leading-relaxed">{s.disclaimer}</p>

      <div className="no-print space-y-2 pt-2">
        <GenerateButton
          s={s}
          lang={lang}
          busy={busy}
          progress={progress}
          disabled={false}
          label={s.regenerate}
          onClick={onRegenerate}
        />
        {error && (
          <p className="text-center text-[12px] text-danger leading-relaxed px-4">{error}</p>
        )}
        <p className="text-center text-[11px]">
          <Link href="/manual" className="underline text-accent-gold">
            {s.backToManual}
          </Link>
        </p>
      </div>
    </div>
  );
}
