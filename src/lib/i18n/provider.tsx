"use client";

/**
 * 言語コンテキスト
 *
 * - 選択言語を localStorage(`unmei-lang`) に保存し、全画面で共有する。
 * - SSR との hydration mismatch を避けるため、初期値は必ず "ja"（サーバーと一致）とし、
 *   マウント後に localStorage から読み込んで切り替える。
 * - 言語変更時に <html lang> を更新し、他コンポーネントへ `unmei-lang-changed` を通知する。
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { dict, type DictKey, type Lang } from "./dict";

const STORAGE_KEY = "unmei-lang";

function isLang(v: unknown): v is Lang {
  return v === "ja" || v === "ko";
}

/** 保存済みの言語を取得（クライアント専用）。未設定・不正値なら "ja"。 */
export function getStoredLang(): Lang {
  if (typeof window === "undefined") return "ja";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return isLang(v) ? v : "ja";
}

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** 静的文言の翻訳。`{name}` は params で置換する。 */
  t: (key: DictKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function translate(
  lang: Lang,
  key: DictKey,
  params?: Record<string, string | number>
): string {
  let text = dict[lang][key] ?? dict.ja[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ja");

  // マウント後に保存済み言語を反映（hydration mismatch 回避のため初回は "ja"）
  useEffect(() => {
    const stored = getStoredLang();
    if (stored !== "ja") setLangState(stored);
    document.documentElement.lang = stored;
  }, []);

  // 別タブでの言語変更にも追従
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && isLang(e.newValue)) {
        setLangState(e.newValue);
        document.documentElement.lang = e.newValue;
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
    window.dispatchEvent(new Event("unmei-lang-changed"));
  }, []);

  const t = useCallback(
    (key: DictKey, params?: Record<string, string | number>) =>
      translate(lang, key, params),
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/** 画面から言語・翻訳関数を取得する。 */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Provider 外で呼ばれた場合のフォールバック（日本語固定）
    return {
      lang: "ja",
      setLang: () => {},
      t: (key, params) => translate("ja", key, params),
    };
  }
  return ctx;
}
