"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/dict";

type Tab = "personal" | "business";

/** この画面固有の二言語文言（dict.ts 編集禁止のためローカル定義） */
const L: Record<Lang, Record<string, string>> = {
  ja: {
    pageTitle: "使い方ガイド",
    intro:
      "運命ナビは、占術を組み合わせて運勢・性格・相性を見るアプリです。個人でセルフケアに使う方と、結婚相談所などのカウンセリング業務で使う方の両方に対応しています。",
    tabPersonal: "個人で使う",
    tabBusiness: "業務で使う",
    contactTitle: "お問い合わせ",
    contactBody:
      "うまく動かない・使い方がわからない・データが消えた等のご連絡は、下記までメールでお知らせください。",
    operatorLabel: "運営: 未来アカデミー",
    contactMail: "連絡先: mamaeri0617@gmail.com",

    // リンクラベル
    profileLink: "プロフィール設定",
    graphLink: "運勢グラフ",
    goalLink: "ゴール",
    diaryLink: "振り返り日記",
    termsLink: "利用規約",
    privacyLink: "プライバシーポリシー",
    studentsLink: "対象者一覧",
    matrixLink: "相性マトリックス",
    compatibilityLink: "相性診断",

    // 個人ガイド
    p1Title: "まずは自分のプロフィールを登録",
    p1After:
      "を開いて、生年月日・出生時間（わかれば）・出生地を入力します。出生時間がわからない場合は空欄でOK。",
    p2Title: "ホーム画面で今日の運勢を見る",
    p2Body:
      "ホームに戻ると、今日の数秘・マヤ暦・九星気学にもとづくメッセージとラッキー情報が表示されます。",
    p3Title: "運勢の流れをグラフで把握",
    p3After:
      "で、過去〜10年後までの4占術の流れを折れ線でチェック。気になる年をタップすると、その年のテーマと過ごし方ガイドが見られます。",
    p4Title: "ゴールと運気を組み合わせる",
    p4After:
      "で目標を設定すると、現在の運気と掛け合わせて「今やるべきこと」が表示されます。",
    p5Title: "日記で振り返る",
    p5After:
      "で気分とその日の出来事を記録。後から運勢の波と気分の関係を見返せます。",
    p6Title: "データを定期的にバックアップ",
    p6a: "データはこの端末のブラウザ内に保存されます。",
    p6Strong: "必ず1〜2週間に1回、プロフィール画面から「エクスポート」",
    p6c:
      "でJSONファイルを保存してください。容量が満杯になったり、ブラウザのデータが消えたりすると、入力した内容が失われます。",

    // 業務ガイド
    warnTitle: "⚠ ご利用前に必ずお読みください",
    warn1: "顧客の生年月日を入力する前に、本人から同意を得てください。",
    warn2:
      "占術結果はあくまで参考情報です。顧客にお伝えする際もそのように説明してください。",
    warn3: "共用PCでは画面が他の方に見られないようご注意ください。",
    warn4a: "詳しくは ",
    warn4mid: " と ",
    warn4end: " を必ずご確認ください。",

    b1Title: "まずカウンセラーご自身のプロフィールを登録",
    b1After:
      "で「種別＝自分」を選び、ご自身の生年月日を入力します。これで全機能が使える状態になります。",

    b2Title: "顧客のプロフィールを追加する",
    b2Before: "同じく ",
    b2After: " から「+ 追加」を押して、",
    b2li1a: "種別 → ",
    b2li1Strong: "「顧客」",
    b2li1c: "を選ぶ（バラ色のバッジで表示されます）",
    b2li2: "性別 → 男性／女性 を必ず設定（相性マトリックスで使います）",
    b2li3: "生年月日・出生時間（わかれば）・出生地を入力",
    b2AfterList:
      "会員番号や活動状況などのメモは、種別を選んだ後に表示される「メモ」欄に記入できます。",

    b3Title: "顧客の個別カードを見る",
    b3After:
      "を開いて、フィルタを「顧客」に切り替えると登録した顧客が並びます。カードをタップすると個別ページに進み、",
    b3li1: "主星・日主・本命星などの占術プロフィール",
    b3li2: "強みキーワード",
    b3li3: "今月のテーマと過ごし方ガイド",
    b3li4: "カウンセラー向け伴走アドバイス（天中殺年・パーソナルマンスを反映）",
    b3AfterList:
      "を確認できます。面談前にこのページを開くと、その方の特性をすぐ把握できます。",

    b4Title: "相性マトリックスでお見合い候補を絞り込む",
    b4After: "が結婚相談所業務の中心機能です。",
    b4li1: "関係モード → 「恋愛・パートナー」",
    b4li2: "表示パターン → 「女性 × 男性」",
    b4li3: "対象 → 「受講生／顧客」",
    b4After2:
      "を選ぶと、登録した女性会員 × 男性会員のクロス相性スコアが一覧化されます。",
    b4p3a: "上部の",
    b4p3Strong: "ランキングTOP10",
    b4p3c:
      "で、相性が高いペアから提案できます。各占術ごとの内訳スコアも見られるので、「数秘で価値観が合う」「四柱推命で日常性質が噛み合う」などの根拠を顧客にお伝えできます。",

    b5Title: "個別の詳しい相性を見る",
    b5Before: "特定の2人をじっくり見たいときは ",
    b5After:
      " ページへ。占術ごとの詳細・ペアごとに動的生成されたアドバイス・強み・注意点が表示されます。",

    b6Title: "データの管理（重要）",
    b6Body:
      "現在のバージョンでは、データはこの端末のブラウザ内のみに保存されます。下記を必ず守ってください。",
    b6li1Strong: "1〜2週間に1回",
    b6li1c:
      "、プロフィール画面の「エクスポート」を実行してJSONファイルを安全な場所（クラウドストレージ等）に保存",
    b6li2a: "プロフィール画面上部の",
    b6li2Strong: "容量バー",
    b6li2c: "を時々チェック。80%を超えたら不要な鑑定画像などを削除",
    b6li3:
      "共用PCを使う場合は、利用後に「ロックを解除」を再度求めるためログアウト操作（このアプリにはまだ専用ボタンはないので、ブラウザのCookie削除で代用）",
    b6Note:
      "※ 別端末でも同じデータを使いたい・複数のカウンセラーで共有したい場合は、Supabase連携版（開発予定）で対応します。",

    b7Title: "顧客への伝え方",
    b7Body: "占い結果を顧客にお伝えする際のおすすめの言い回し：",
    b7li1a: "「数秘とマヤ暦から見ると、お二人は",
    b7li1Strong: "価値観の方向性で響き合う",
    b7li1c: "関係なので…」",
    b7li2:
      "「四柱推命では日主が天干合になっていて、日常で自然体で過ごせる組み合わせです」",
    b7li3:
      "「ただし占いはあくまで参考情報なので、最終的にはお会いした感覚を大切にしてくださいね」",
    b7After:
      "占術の専門用語は深く説明しなくても大丈夫です。アプリ内のアドバイス文をそのまま読み上げるだけでも十分伝わります。",

    faqTitle: "よくあるご質問",
    q1: "Q. 別のPCでも同じデータを見られますか？",
    a1: "A. 現バージョンでは端末ごとに別データです。エクスポートしたJSONファイルを別端末でインポートすると引き継げます。Supabase版（開発予定）で複数端末対応します。",
    q2: "Q. 顧客にも直接アプリを使ってもらえますか？",
    a2: "A. 「顧客向けURL発行機能」を次のアップデートで予定しています。現在はカウンセラー側で見ていただく前提です。",
    q3: "Q. ロック解除のパスワードを忘れました",
    a3: "A. 運営者にメールでお問い合わせください（mamaeri0617@gmail.com）。",
    q4: "Q. データが消えてしまいました",
    a4: "A. プロフィール画面の容量バーが赤くなっていないか、エクスポートファイルが残っていないかご確認ください。エクスポートがあれば「インポート」で復旧できます。",
  },
  ko: {
    pageTitle: "사용법 가이드",
    intro:
      "운명 내비는 여러 점술을 조합해 운세·성격·궁합을 살펴보는 앱입니다. 개인적으로 셀프 케어에 사용하는 분과, 결혼정보회사 등 상담 업무에 사용하는 분 모두에게 대응합니다.",
    tabPersonal: "개인용으로 사용",
    tabBusiness: "업무용으로 사용",
    contactTitle: "문의하기",
    contactBody:
      "잘 작동하지 않거나, 사용법을 모르거나, 데이터가 사라진 경우 등은 아래 이메일로 알려주세요.",
    operatorLabel: "운영: 미라이 아카데미",
    contactMail: "연락처: mamaeri0617@gmail.com",

    // リンクラベル
    profileLink: "프로필 설정",
    graphLink: "운세 그래프",
    goalLink: "목표",
    diaryLink: "회고 일기",
    termsLink: "이용약관",
    privacyLink: "개인정보 처리방침",
    studentsLink: "대상자 목록",
    matrixLink: "궁합 매트릭스",
    compatibilityLink: "궁합 진단",

    // 個人ガイド
    p1Title: "먼저 자신의 프로필을 등록",
    p1After:
      "을 열어 생년월일·출생 시간(알면)·출생지를 입력합니다. 출생 시간을 모르면 비워 두어도 괜찮습니다.",
    p2Title: "홈 화면에서 오늘의 운세 보기",
    p2Body:
      "홈으로 돌아가면 오늘의 수비학·마야력·구성기학에 기반한 메시지와 행운 정보가 표시됩니다.",
    p3Title: "운세의 흐름을 그래프로 파악",
    p3After:
      "에서 과거부터 10년 후까지 4가지 점술의 흐름을 꺾은선으로 확인하세요. 궁금한 연도를 탭하면 그 해의 테마와 보내는 방법 가이드를 볼 수 있습니다.",
    p4Title: "목표와 운기를 조합하기",
    p4After:
      "에서 목표를 설정하면 현재 운기와 결합해 '지금 해야 할 일'이 표시됩니다.",
    p5Title: "일기로 되돌아보기",
    p5After:
      "에서 기분과 그날의 일을 기록하세요. 나중에 운세의 파동과 기분의 관계를 다시 볼 수 있습니다.",
    p6Title: "데이터를 정기적으로 백업",
    p6a: "데이터는 이 기기의 브라우저 안에 저장됩니다. ",
    p6Strong: "반드시 1~2주에 한 번, 프로필 화면에서 '내보내기'",
    p6c:
      "로 JSON 파일을 저장해 주세요. 용량이 가득 차거나 브라우저 데이터가 지워지면 입력한 내용이 사라집니다.",

    // 業務ガイド
    warnTitle: "⚠ 이용 전에 반드시 읽어주세요",
    warn1: "고객의 생년월일을 입력하기 전에 본인의 동의를 받아주세요.",
    warn2:
      "점술 결과는 어디까지나 참고 정보입니다. 고객에게 전달할 때도 그렇게 설명해 주세요.",
    warn3: "공용 PC에서는 화면이 다른 사람에게 보이지 않도록 주의해 주세요.",
    warn4a: "자세한 내용은 ",
    warn4mid: " 과 ",
    warn4end: " 을 반드시 확인해 주세요.",

    b1Title: "먼저 상담사 본인의 프로필을 등록",
    b1After:
      "에서 '종류=본인'을 선택하고 자신의 생년월일을 입력합니다. 이것으로 모든 기능을 사용할 수 있게 됩니다.",

    b2Title: "고객의 프로필 추가하기",
    b2Before: "마찬가지로 ",
    b2After: " 에서 '+ 추가'를 눌러,",
    b2li1a: "종류 → ",
    b2li1Strong: "'고객'",
    b2li1c: "을 선택(장미색 배지로 표시됩니다)",
    b2li2: "성별 → 남성/여성 을 반드시 설정(궁합 매트릭스에서 사용합니다)",
    b2li3: "생년월일·출생 시간(알면)·출생지를 입력",
    b2AfterList:
      "회원번호나 활동 상황 등의 메모는 종류를 선택한 후 표시되는 '메모' 칸에 기입할 수 있습니다.",

    b3Title: "고객의 개별 카드 보기",
    b3After:
      "을 열어 필터를 '고객'으로 전환하면 등록한 고객이 나열됩니다. 카드를 탭하면 개별 페이지로 이동하여,",
    b3li1: "주성·일주·본명성 등의 점술 프로필",
    b3li2: "강점 키워드",
    b3li3: "이번 달의 테마와 보내는 방법 가이드",
    b3li4: "상담사용 동행 조언(천중살 해·퍼스널 먼스를 반영)",
    b3AfterList:
      "를 확인할 수 있습니다. 면담 전에 이 페이지를 열면 그분의 특성을 바로 파악할 수 있습니다.",

    b4Title: "궁합 매트릭스로 맞선 후보 좁히기",
    b4After: "가 결혼정보회사 업무의 핵심 기능입니다.",
    b4li1: "관계 모드 → '연애·파트너'",
    b4li2: "표시 패턴 → '여성 × 남성'",
    b4li3: "대상 → '수강생/고객'",
    b4After2:
      "를 선택하면 등록한 여성 회원 × 남성 회원의 교차 궁합 점수가 목록으로 표시됩니다.",
    b4p3a: "상단의 ",
    b4p3Strong: "랭킹 TOP10",
    b4p3c:
      "에서 궁합이 높은 짝부터 제안할 수 있습니다. 각 점술별 세부 점수도 볼 수 있으므로 '수비학에서 가치관이 맞는다' '사주에서 일상 성향이 맞물린다' 등의 근거를 고객에게 전할 수 있습니다.",

    b5Title: "개별 상세 궁합 보기",
    b5Before: "특정 두 사람을 자세히 보고 싶을 때는 ",
    b5After:
      " 페이지로. 점술별 상세·짝마다 동적으로 생성된 조언·강점·주의점이 표시됩니다.",

    b6Title: "데이터 관리(중요)",
    b6Body:
      "현재 버전에서는 데이터가 이 기기의 브라우저 안에만 저장됩니다. 아래 사항을 반드시 지켜주세요.",
    b6li1Strong: "1~2주에 한 번",
    b6li1c:
      ", 프로필 화면의 '내보내기'를 실행해 JSON 파일을 안전한 곳(클라우드 스토리지 등)에 저장",
    b6li2a: "프로필 화면 상단의 ",
    b6li2Strong: "용량 바",
    b6li2c: "를 가끔 확인하세요. 80%를 넘으면 불필요한 감정 이미지 등을 삭제",
    b6li3:
      "공용 PC를 사용하는 경우, 이용 후 '잠금 해제'를 다시 요구하도록 로그아웃 조작(이 앱에는 아직 전용 버튼이 없으므로 브라우저 쿠키 삭제로 대체)",
    b6Note:
      "※ 다른 기기에서도 같은 데이터를 사용하고 싶거나 여러 상담사가 공유하고 싶은 경우에는 Supabase 연동 버전(개발 예정)에서 대응합니다.",

    b7Title: "고객에게 전달하는 방법",
    b7Body: "점술 결과를 고객에게 전달할 때 추천하는 표현:",
    b7li1a: "'수비학과 마야력으로 보면, 두 분은 ",
    b7li1Strong: "가치관의 방향성에서 서로 공명하는",
    b7li1c: " 관계이므로…'",
    b7li2:
      "'사주에서는 일간이 천간합을 이루고 있어, 일상에서 자연스럽게 지낼 수 있는 조합입니다'",
    b7li3:
      "'다만 점술은 어디까지나 참고 정보이므로, 최종적으로는 만나본 느낌을 소중히 여겨 주세요'",
    b7After:
      "점술 전문 용어는 깊이 설명하지 않아도 괜찮습니다. 앱 안의 조언 문구를 그대로 읽어드리는 것만으로도 충분히 전달됩니다.",

    faqTitle: "자주 묻는 질문",
    q1: "Q. 다른 PC에서도 같은 데이터를 볼 수 있나요?",
    a1: "A. 현재 버전에서는 기기마다 데이터가 별도입니다. 내보낸 JSON 파일을 다른 기기에서 가져오기 하면 이어받을 수 있습니다. Supabase 버전(개발 예정)에서 여러 기기를 지원합니다.",
    q2: "Q. 고객이 직접 앱을 사용하게 할 수 있나요?",
    a2: "A. '고객용 URL 발행 기능'을 다음 업데이트에서 예정하고 있습니다. 현재는 상담사 쪽에서 봐주시는 것을 전제로 합니다.",
    q3: "Q. 잠금 해제 비밀번호를 잊어버렸습니다",
    a3: "A. 운영자에게 이메일로 문의해 주세요(mamaeri0617@gmail.com).",
    q4: "Q. 데이터가 사라져 버렸습니다",
    a4: "A. 프로필 화면의 용량 바가 빨갛게 되어 있지 않은지, 내보내기 파일이 남아 있지 않은지 확인해 주세요. 내보내기가 있으면 '가져오기'로 복구할 수 있습니다.",
  },
};

export default function GuidePage() {
  const { lang } = useI18n();
  const [tab, setTab] = useState<Tab>("personal");
  const s = L[lang];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-accent-orange flex items-center gap-2">
        <span className="text-accent-gold">📖</span>
        {s.pageTitle}
      </h1>

      <p className="text-xs text-muted leading-relaxed">{s.intro}</p>

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
          {s.tabPersonal}
        </button>
        <button
          onClick={() => setTab("business")}
          className={`py-2.5 rounded-xl text-sm border transition-colors ${
            tab === "business"
              ? "bg-accent-orange text-white border-accent-orange"
              : "bg-card-bg text-foreground border-card-border hover:border-accent-orange/50"
          }`}
        >
          {s.tabBusiness}
        </button>
      </div>

      {tab === "personal" && <PersonalGuide lang={lang} />}
      {tab === "business" && <BusinessGuide lang={lang} />}

      <div className="pt-4 border-t border-card-border space-y-2 text-xs text-muted">
        <p className="font-medium text-foreground">{s.contactTitle}</p>
        <p>{s.contactBody}</p>
        <p className="bg-card-bg border border-card-border rounded-xl p-3">
          {s.operatorLabel}
          <br />
          {s.contactMail}
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

function PersonalGuide({ lang }: { lang: Lang }) {
  const s = L[lang];
  return (
    <div className="space-y-3">
      <Step num={1} title={s.p1Title}>
        <p>
          <Link href="/profile" className="text-accent-orange underline">
            {s.profileLink}
          </Link>
          {s.p1After}
        </p>
      </Step>
      <Step num={2} title={s.p2Title}>
        <p>{s.p2Body}</p>
      </Step>
      <Step num={3} title={s.p3Title}>
        <p>
          <Link href="/graph" className="text-accent-orange underline">
            {s.graphLink}
          </Link>
          {s.p3After}
        </p>
      </Step>
      <Step num={4} title={s.p4Title}>
        <p>
          <Link href="/goal" className="text-accent-orange underline">
            {s.goalLink}
          </Link>
          {s.p4After}
        </p>
      </Step>
      <Step num={5} title={s.p5Title}>
        <p>
          <Link href="/diary" className="text-accent-orange underline">
            {s.diaryLink}
          </Link>
          {s.p5After}
        </p>
      </Step>
      <Step num={6} title={s.p6Title}>
        <p>
          {s.p6a}
          <strong>{s.p6Strong}</strong>
          {s.p6c}
        </p>
      </Step>
    </div>
  );
}

function BusinessGuide({ lang }: { lang: Lang }) {
  const s = L[lang];
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-foreground/85 leading-relaxed">
        <p className="font-medium text-amber-700 mb-1">{s.warnTitle}</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>{s.warn1}</li>
          <li>{s.warn2}</li>
          <li>{s.warn3}</li>
          <li>
            {s.warn4a}
            <Link href="/terms" className="text-accent-orange underline">
              {s.termsLink}
            </Link>
            {s.warn4mid}
            <Link href="/privacy" className="text-accent-orange underline">
              {s.privacyLink}
            </Link>
            {s.warn4end}
          </li>
        </ul>
      </div>

      <Step num={1} title={s.b1Title}>
        <p>
          <Link href="/profile" className="text-accent-orange underline">
            {s.profileLink}
          </Link>
          {s.b1After}
        </p>
      </Step>

      <Step num={2} title={s.b2Title}>
        <p>
          {s.b2Before}
          <Link href="/profile" className="text-accent-orange underline">
            {s.profileLink}
          </Link>
          {s.b2After}
        </p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>
            {s.b2li1a}
            <strong>{s.b2li1Strong}</strong>
            {s.b2li1c}
          </li>
          <li>{s.b2li2}</li>
          <li>{s.b2li3}</li>
        </ul>
        <p>{s.b2AfterList}</p>
      </Step>

      <Step num={3} title={s.b3Title}>
        <p>
          <Link href="/students" className="text-accent-orange underline">
            {s.studentsLink}
          </Link>
          {s.b3After}
        </p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>{s.b3li1}</li>
          <li>{s.b3li2}</li>
          <li>{s.b3li3}</li>
          <li>{s.b3li4}</li>
        </ul>
        <p>{s.b3AfterList}</p>
      </Step>

      <Step num={4} title={s.b4Title}>
        <p>
          <Link href="/matrix" className="text-accent-orange underline">
            {s.matrixLink}
          </Link>
          {s.b4After}
        </p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>{s.b4li1}</li>
          <li>{s.b4li2}</li>
          <li>{s.b4li3}</li>
        </ul>
        <p>{s.b4After2}</p>
        <p>
          {s.b4p3a}
          <strong>{s.b4p3Strong}</strong>
          {s.b4p3c}
        </p>
      </Step>

      <Step num={5} title={s.b5Title}>
        <p>
          {s.b5Before}
          <Link href="/compatibility" className="text-accent-orange underline">
            {s.compatibilityLink}
          </Link>
          {s.b5After}
        </p>
      </Step>

      <Step num={6} title={s.b6Title}>
        <p>{s.b6Body}</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>
            <strong>{s.b6li1Strong}</strong>
            {s.b6li1c}
          </li>
          <li>
            {s.b6li2a}
            <strong>{s.b6li2Strong}</strong>
            {s.b6li2c}
          </li>
          <li>{s.b6li3}</li>
        </ul>
        <p className="mt-2 text-[11px] text-muted">{s.b6Note}</p>
      </Step>

      <Step num={7} title={s.b7Title}>
        <p>{s.b7Body}</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>
            {s.b7li1a}
            <strong>{s.b7li1Strong}</strong>
            {s.b7li1c}
          </li>
          <li>{s.b7li2}</li>
          <li>{s.b7li3}</li>
        </ul>
        <p className="mt-1">{s.b7After}</p>
      </Step>

      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 mt-4 space-y-2">
        <p className="text-sm font-medium text-sky-700">{s.faqTitle}</p>
        <div className="text-xs text-foreground/85 space-y-3">
          <div>
            <p className="font-medium">{s.q1}</p>
            <p className="text-muted mt-0.5">{s.a1}</p>
          </div>
          <div>
            <p className="font-medium">{s.q2}</p>
            <p className="text-muted mt-0.5">{s.a2}</p>
          </div>
          <div>
            <p className="font-medium">{s.q3}</p>
            <p className="text-muted mt-0.5">{s.a3}</p>
          </div>
          <div>
            <p className="font-medium">{s.q4}</p>
            <p className="text-muted mt-0.5">{s.a4}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
