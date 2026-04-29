import { NextRequest, NextResponse } from "next/server";

/**
 * 簡易パスワード保護。
 * - Vercel環境変数 APP_PASSWORD が未設定なら認証不要（既存ユーザー・ローカル開発の互換）
 * - 設定済みなら、未認証アクセスは /unlock にリダイレクト
 *
 * cookie は HttpOnly + Secure + SameSite=Lax で保存し、JS からの読み取りは不可。
 * 業務用途の簡易制限想定。本格的な認証は Supabase Auth 移行後に置き換える。
 */
export function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const path = req.nextUrl.pathname;

  // 認証画面・APIエンドポイント・公開資産・規約類はスルー
  if (
    path === "/unlock" ||
    path === "/terms" ||
    path === "/privacy" ||
    path.startsWith("/api/unlock") ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.endsWith(".png") ||
    path.endsWith(".jpg") ||
    path.endsWith(".svg") ||
    path.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("unmei-unlock");
  if (cookie?.value === password) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.searchParams.set("from", path);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
