import { NextRequest, NextResponse } from "next/server";
import {
  PRO_COOKIE,
  PRO_COOKIE_MAX_AGE,
  issueProToken,
  verifyProToken,
  validUnlockCodes,
  paypalConfigured,
  verifyPaypalOrder,
} from "@/lib/pro-access";
import { PRO_PRICE_JPY } from "@/lib/divination/pro-manual";

export const runtime = "nodejs";

interface Body {
  code?: string;
  paypalOrderId?: string;
}

/** 現在の購入状態と、利用できる決済手段をブラウザに伝える */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    unlocked: verifyProToken(req.cookies.get(PRO_COOKIE)?.value),
    paypal: paypalConfigured(),
    codeEnabled: validUnlockCodes().length > 0,
    aiReady: Boolean(process.env.ANTHROPIC_API_KEY),
    price: PRO_PRICE_JPY,
  });
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "リクエストが不正です" }, { status: 400 });
  }

  let source = "";

  if (body.paypalOrderId) {
    const result = await verifyPaypalOrder(body.paypalOrderId, PRO_PRICE_JPY);
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 200 });
    }
    source = "paypal";
  } else if (body.code) {
    const codes = validUnlockCodes();
    if (codes.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "コードでの解除はまだ有効化されていません（サーバーに PRO_UNLOCK_CODES が未設定です）。",
        },
        { status: 200 }
      );
    }
    const input = body.code.trim();
    if (!codes.some((c) => c === input)) {
      return NextResponse.json(
        { ok: false, message: "コードが違うようです。もう一度ご確認ください。" },
        { status: 200 }
      );
    }
    source = "code";
  } else {
    return NextResponse.json({ ok: false, message: "リクエストが不正です" }, { status: 400 });
  }

  const token = issueProToken(source);
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "サーバー側の準備が未完了です（PRO_SECRET または ANTHROPIC_API_KEY が未設定です）。",
      },
      { status: 200 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PRO_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PRO_COOKIE_MAX_AGE,
  });
  return res;
}
