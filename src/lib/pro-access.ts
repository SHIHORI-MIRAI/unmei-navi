/**
 * pro-access.ts — 有料版トリセツ（/manual/pro）の購入判定
 *
 * サーバー専用。購入が確認できたブラウザに HttpOnly cookie を発行し、
 * 生成API（/api/pro-manual）はその cookie を必須にする。
 * これがないと、購入していない人がAI生成を無料で回せてしまう（＝API費用が漏れる）。
 *
 * 署名鍵は PRO_SECRET。未設定なら ANTHROPIC_API_KEY で代用する
 * （AIキーが無ければそもそも生成できないので、実害のあるフォールバックにはならない）。
 */

import crypto from "crypto";

export const PRO_COOKIE = "unmei-pro";
const TTL_DAYS = 180;

function signingKey(): string | null {
  return process.env.PRO_SECRET || process.env.ANTHROPIC_API_KEY || null;
}

function sign(payload: string, key: string): string {
  return crypto.createHmac("sha256", key).update(payload).digest("base64url");
}

/** 購入済みトークンを発行する。有効期限つき。 */
export function issueProToken(source: string): string | null {
  const key = signingKey();
  if (!key) return null;
  const exp = Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${exp}.${source}`;
  return `${payload}.${sign(payload, key)}`;
}

/** cookie の値が正当な購入トークンか検証する。 */
export function verifyProToken(token: string | undefined): boolean {
  if (!token) return false;
  const key = signingKey();
  if (!key) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expStr, source, mac] = parts;

  const expected = sign(`${expStr}.${source}`, key);
  // タイミング攻撃を避けるため長さを揃えてから比較する
  if (mac.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return false;

  const exp = Number(expStr);
  return Number.isFinite(exp) && exp > Date.now();
}

export const PRO_COOKIE_MAX_AGE = TTL_DAYS * 24 * 60 * 60;

/** 環境変数に登録されたアンロックコード一覧（カンマ区切り） */
export function validUnlockCodes(): string[] {
  return (process.env.PRO_UNLOCK_CODES || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

// --- PayPal ---

function paypalBase(): string {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET);
}

/**
 * PayPalの注文IDを検証し、実際に決済が完了しているかをPayPalに問い合わせる。
 * ブラウザからの「払いました」という自己申告は信用しない。
 */
export async function verifyPaypalOrder(
  orderId: string,
  minAmountJpy: number
): Promise<{ ok: boolean; message?: string }> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    return { ok: false, message: "PayPalの設定が未完了です" };
  }

  const basic = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const tokenRes = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!tokenRes.ok) {
    return { ok: false, message: "PayPalの認証に失敗しました" };
  }
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) return { ok: false, message: "PayPalの認証に失敗しました" };

  const orderRes = await fetch(
    `${paypalBase()}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  if (!orderRes.ok) {
    return { ok: false, message: "お支払い情報が見つかりませんでした" };
  }

  const order = (await orderRes.json()) as {
    status?: string;
    purchase_units?: { amount?: { currency_code?: string; value?: string } }[];
  };

  if (order.status !== "COMPLETED") {
    return { ok: false, message: `お支払いがまだ完了していません（${order.status ?? "不明"}）` };
  }

  const amount = order.purchase_units?.[0]?.amount;
  const currency = amount?.currency_code;
  const value = Number(amount?.value ?? 0);

  // JPY以外での支払いは金額換算ができないため、通貨も含めて確認する
  if (currency !== "JPY" || !Number.isFinite(value) || value < minAmountJpy) {
    return { ok: false, message: "お支払い金額を確認できませんでした" };
  }

  return { ok: true };
}
