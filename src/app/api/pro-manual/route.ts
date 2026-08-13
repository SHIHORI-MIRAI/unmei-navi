import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  PRO_CHAPTERS,
  PRO_PART_COUNT,
  buildProDossier,
  chaptersOfPart,
} from "@/lib/divination/pro-manual";
import { PRO_COOKIE, verifyProToken } from "@/lib/pro-access";
import type { Lang } from "@/lib/i18n/dict";

export const runtime = "nodejs";
export const maxDuration = 300;

interface Body {
  part?: number; // 1..4
  name?: string;
  birthDate?: string;
  birthTime?: string;
  lang?: Lang;
  /** 既に生成済みの章の要点。重複した内容を書かせないために渡す */
  previousKeyPoints?: { no: number; points: string[] }[];
}

/** 章ごとの本文と要点を構造化出力で受け取る */
const CHAPTERS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    chapters: {
      type: "array",
      description: "指示された章番号ぶんの本文",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          no: { type: "integer", description: "章番号" },
          body: {
            type: "string",
            description: "章の本文。段落は空行（\\n\\n）で区切る。見出しや記号は入れない",
          },
          keyPoints: {
            type: "array",
            description: "その章の要点を3つ。各30字以内",
            items: { type: "string" },
          },
        },
        required: ["no", "body", "keyPoints"],
      },
    },
  },
  required: ["chapters"],
} as const;

const LANG_LABEL: Record<Lang, string> = {
  ja: "日本語",
  ko: "韓国語（한국어）",
};

export async function POST(req: NextRequest) {
  // 購入していないブラウザからのAI呼び出しを止める（API費用の流出を防ぐ）
  if (!verifyProToken(req.cookies.get(PRO_COOKIE)?.value)) {
    return NextResponse.json(
      { ok: false, code: "locked", message: "ご購入の確認ができませんでした。" },
      { status: 403 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        code: "no_key",
        message:
          "AIによる作成はまだ有効化されていません（サーバーにAPIキーが未設定です）。",
      },
      { status: 200 }
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "リクエストが不正です" }, { status: 400 });
  }

  const { name, birthDate, birthTime = "", previousKeyPoints = [] } = body;
  const lang: Lang = body.lang === "ko" ? "ko" : "ja";
  const part = Number(body.part);

  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json({ ok: false, message: "生年月日が必要です" }, { status: 400 });
  }
  if (!Number.isInteger(part) || part < 1 || part > PRO_PART_COUNT) {
    return NextResponse.json({ ok: false, message: "パート指定が不正です" }, { status: 400 });
  }

  const target = chaptersOfPart(part);
  const dossier = buildProDossier(birthDate, birthTime, name || "", new Date());

  const outline = PRO_CHAPTERS.map(
    (c) => `${c.no}. ${c.title.ja}${target.some((t) => t.no === c.no) ? "  ← 今回書く章" : ""}`
  ).join("\n");

  const assignments = target
    .map((c) => `## 第${c.no}章「${c.title.ja}」\n書く内容: ${c.focus}`)
    .join("\n\n");

  const written =
    previousKeyPoints.length > 0
      ? `\n\n【すでに書き終えた章の要点】\nここで扱った内容の繰り返しは避け、今回の章では別の角度から書いてください。\n${previousKeyPoints
          .map((p) => `- 第${p.no}章: ${p.points.join(" / ")}`)
          .join("\n")}`
      : "";

  const system = `あなたは東洋占術（四柱推命・算命学・九星気学）と数秘術・マヤ暦に精通した、あたたかく誠実な鑑定士です。
いま、ひとりのお客様のために「わたしの取扱説明書 PREMIUM（全20ページ）」という有料の鑑定書を書いています。

【この鑑定書の性格】
- お客様が実費を払って購入した、その人だけのための本です。読み終えたときに「買ってよかった」「自分のことが分かった」と感じられる密度と誠実さが必要です。
- 一般論や、誰にでも当てはまる占い雑誌のような文章は書かないこと。必ず提供された鑑定データ（命式・星・数字）を根拠として示しながら書きます。

【文体の指示】
- ${LANG_LABEL[lang]}で書く。お客様に「あなた」と語りかける、やわらかい敬体（です・ます）。
- 1章あたり1,000〜1,400字。段落は空行で区切り、3〜5段落にまとめる。
- 見出し・箇条書き記号・マークダウン記法は本文に入れない（本文はプレーンな文章のみ）。
- 専門用語（日主・通変星・天中殺・従星など）を使うときは、必ずその場で一言の説明を添える。用語を知らない人が読んでも分かるように。

【内容の方針】
- 断定的な運命論や、不安を煽る表現は使わない。「〜の傾向があります」「〜しやすいときです」といった柔らかい言い方をする。
- 運気が低い時期も「悪い時期」とは書かず、その時期にふさわしい過ごし方として前向きに描く。
- 弱点や課題は、そのまま裏返せば強みになるという形で必ず希望に接続する。
- 医療・法律・投資の助言や、健康状態の断定は絶対にしない。健康の章は「養生の知恵」として書く。
- 提供された「ルールベース版トリセツの要約」はあくまで下地です。そのまま引き写さず、必ず自分の言葉で深く展開してください。

【要点（keyPoints）】
各章につき3つ、その章のいちばん大事なことを30字以内で。本文の言い換えではなく、読者が手帳に書き写せる実用的な一文にすること。`;

  const userMsg = `${dossier}

# 全20章の構成
${outline}

# 今回あなたが書く章
${assignments}${written}

上記の鑑定データだけを根拠に、指定された章の本文を書いてください。データに無いこと（実際の家族構成、職業、既往歴など）は推測して断定しないでください。`;

  try {
    const client = new Anthropic({ apiKey });
    const stream = client.messages.stream({
      model: "claude-opus-5",
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      // effort はコストと文章の密度のつまみ。下げると安く速くなる
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: CHAPTERS_SCHEMA },
      },
      system,
      messages: [{ role: "user", content: userMsg }],
    });

    const response = await stream.finalMessage();

    // 1件あたりの原価を推測せず実測するためのログ。
    // claude-opus-5 は入力$5/百万トークン・出力$25/百万トークン（thinking も出力に含まれる）
    const u = response.usage;
    const costUsd =
      ((u.input_tokens + (u.cache_creation_input_tokens ?? 0)) * 5 +
        u.output_tokens * 25) /
      1_000_000;
    console.log(
      `[pro-manual] 第${part}部 完了 / 入力${u.input_tokens} 出力${u.output_tokens} トークン / 約$${costUsd.toFixed(3)}`
    );

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { ok: false, message: "この内容は鑑定書にできませんでした。" },
        { status: 200 }
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ ok: false, message: "作成に失敗しました" }, { status: 502 });
    }

    let parsed: { chapters?: { no: number; body: string; keyPoints: string[] }[] };
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return NextResponse.json(
        { ok: false, message: "結果の解析に失敗しました" },
        { status: 502 }
      );
    }

    // 指定した章だけを、章番号順に返す（余計な章が混ざっても弾く）
    const wanted = new Set(target.map((c) => c.no));
    const chapters = (parsed.chapters ?? [])
      .filter((c) => wanted.has(c.no) && typeof c.body === "string" && c.body.trim())
      .map((c) => ({
        no: c.no,
        body: c.body.trim(),
        keyPoints: Array.isArray(c.keyPoints) ? c.keyPoints.slice(0, 3) : [],
      }))
      .sort((a, b) => a.no - b.no);

    if (chapters.length === 0) {
      return NextResponse.json(
        { ok: false, message: "本文が生成されませんでした。もう一度お試しください。" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      chapters,
      usage: { inputTokens: u.input_tokens, outputTokens: u.output_tokens, costUsd },
    });
  } catch (e) {
    console.error("[pro-manual] error:", e);
    const msg =
      e instanceof Anthropic.RateLimitError
        ? "ただいま混み合っています。少し時間をおいてお試しください。"
        : e instanceof Anthropic.APIError
          ? `AIエラー（${e.status ?? "不明"}）。時間をおいて再度お試しください。`
          : "AI呼び出しに失敗しました。";
    return NextResponse.json({ ok: false, message: msg }, { status: 502 });
  }
}
