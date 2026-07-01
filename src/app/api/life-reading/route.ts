import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  computeSky,
  signOf,
  PLANETS,
  getLifePeriod,
  calcNumerology,
} from "@/lib/divination";
import type { LifeEvent } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 120;

interface Body {
  name?: string;
  birthDate?: string;
  birthTime?: string;
  events?: LifeEvent[];
}

/** 5観点の読み解きを構造化出力で受け取る */
const READING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    themes: { type: "string", description: "人生に繰り返し現れるテーマ＝癖・課題" },
    timing: { type: "string", description: "出来事と星のタイミングの重なり" },
    strengths: { type: "string", description: "その人の強み" },
    mission: { type: "string", description: "今世の使命・人生のテーマ" },
    message: { type: "string", description: "これからへの前向きなメッセージ" },
  },
  required: ["themes", "timing", "strengths", "mission", "message"],
} as const;

const EMOTION_LABEL = ["", "つらい", "モヤモヤ", "ふつう", "良い", "最高"];
const MAG_LABEL = ["", "小さな気づき", "できごと", "人生の節目"];

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        code: "no_key",
        message:
          "AI読み解きはまだ有効化されていません（サーバーにAPIキーが未設定です）。",
      },
      { status: 200 }
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "リクエストが不正です" },
      { status: 400 }
    );
  }

  const { name, birthDate, birthTime, events } = body;
  if (!birthDate || !Array.isArray(events) || events.length < 3) {
    return NextResponse.json(
      { ok: false, message: "出来事が3件以上必要です" },
      { status: 400 }
    );
  }

  // 出生図の星座（時刻に依存しにくい配置。正午で概算した参考値）
  const sky = computeSky(new Date(`${birthDate}T12:00:00Z`));
  const natalSigns = PLANETS.map(
    (p) => `${p.name}=${signOf(sky.positions[p.body].eclLon)}`
  ).join("、");

  const num = calcNumerology(birthDate);

  // 出来事を時系列に、その時期の運気・星の節目つきで整形
  const sorted = [...events].sort(
    (a, b) => a.year - b.year || (a.month ?? 0) - (b.month ?? 0)
  );
  const timeline = sorted
    .map((e) => {
      const per = getLifePeriod(birthDate, e.year);
      const ms = per.milestones.map((m) => m.label).join("・") || "なし";
      return [
        `- ${e.year}年（${per.age}歳ごろ）｜${e.title}`,
        `  分類:${e.category}／大きさ:${MAG_LABEL[e.magnitude] ?? "-"}／当時の気持ち:${EMOTION_LABEL[e.emotion] ?? "-"}`,
        e.learning ? `  本人の学び:${e.learning}` : null,
        `  その時期→ 数秘${per.personalYear}「${per.personalYearTheme}」／九星:${per.nineStarDirection || "-"}／星の節目:${ms}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const system = `あなたは東洋（四柱推命・数秘術・九星気学）と西洋占星術に精通した、あたたかく誠実なライフ・ナビゲーターです。
相談者が書き出した「人生の出来事の年表」を読み解き、繰り返し現れるテーマ（人生の癖・課題）、強み、今世の使命を、占星術のタイミングと結びつけて言語化します。

大切な方針：
- つらい出来事は決して軽く扱わず、ありのまま受け止める。そのうえで、そこから育った意味・強みを前向きに描く。
- 断定的な運命論や不安を煽る表現は使わない。「傾向」「後押しされやすい」といった柔らかい表現で。
- 相談者本人の言葉（学び）を尊重し、引用しながら深める。
- 占いは参考情報であることを前提に、相談者が自分を肯定し前に進めるように書く。
- 日本語で、相談者に「あなた」と語りかけるように、具体的に書く。各項目はおよそ3〜6文。`;

  const userMsg = `【相談者】${name || "（名称未設定）"}／生年月日 ${birthDate}${
    birthTime ? ` ${birthTime}` : "（出生時刻は未登録）"
  }
【数秘のライフパス】${num.lifePathNumber}「${num.lifePathMeaning.title}」＝${num.lifePathMeaning.strength}
【出生時の星座配置（正午概算・参考）】${natalSigns}

【人生の年表】
${timeline}

この年表全体を通して読み解き、5つの観点（繰り返すテーマ＝癖・課題／出来事と星の重なり／強み／使命／これからへのメッセージ）で言語化してください。`;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: READING_SCHEMA },
      },
      system,
      messages: [{ role: "user", content: userMsg }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { ok: false, message: "この内容は読み解けませんでした。" },
        { status: 200 }
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { ok: false, message: "読み解きに失敗しました" },
        { status: 502 }
      );
    }

    let reading: unknown;
    try {
      reading = JSON.parse(textBlock.text);
    } catch {
      return NextResponse.json(
        { ok: false, message: "読み解き結果の解析に失敗しました" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, reading });
  } catch (e) {
    console.error("[life-reading] error:", e);
    const msg =
      e instanceof Anthropic.APIError
        ? `AIエラー（${e.status ?? "不明"}）。時間をおいて再度お試しください。`
        : "AI呼び出しに失敗しました。";
    return NextResponse.json({ ok: false, message: msg }, { status: 502 });
  }
}
