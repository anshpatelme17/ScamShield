import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  translations,
} from "./translations";

export function resolveLanguage(saved) {
  return saved && Object.prototype.hasOwnProperty.call(translations, saved)
    ? saved
    : DEFAULT_LANGUAGE;
}

const INTERP_RE = /\{(\w+)\}/g;

export function lookup(lang, key) {
  const dict = translations[lang];
  if (dict && Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
  const en = translations[DEFAULT_LANGUAGE];
  if (en && Object.prototype.hasOwnProperty.call(en, key)) return en[key];
  return null;
}

export function translate(lang, key, params) {
  const fallback = lookup(lang, key);
  let text = fallback ?? key;
  if (params) {
    text = text.replace(INTERP_RE, (m, name) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : m
    );
  }
  return text;
}

function readSavedLanguage() {
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveLanguage(code) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // storage unavailable (e.g. jsdom restrictions): selection stays for the session only
  }
}

const META_BY_CODE = Object.fromEntries(LANGUAGES.map((l) => [l.code, l]));

const DEFAULT_CONTEXT_VALUE = {
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  t: (key, params) => translate(DEFAULT_LANGUAGE, key, params),
  tEnum: (prefix, value) =>
    lookup(DEFAULT_LANGUAGE, `${prefix}.${value}`) ?? value,
  meta: META_BY_CODE[DEFAULT_LANGUAGE],
  isRtl: false,
  dateLocale: META_BY_CODE[DEFAULT_LANGUAGE].dateLocale,
};

const LanguageContext = createContext(DEFAULT_CONTEXT_VALUE);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => resolveLanguage(readSavedLanguage()));

  const setLang = useCallback((code) => {
    const valid = resolveLanguage(code);
    setLangState(valid);
    saveLanguage(valid);
  }, []);

  const value = useMemo(() => {
    const meta = META_BY_CODE[lang] || META_BY_CODE[DEFAULT_LANGUAGE];
    return {
      lang,
      setLang,
      t: (key, params) => translate(lang, key, params),
      tEnum: (prefix, value) => lookup(lang, `${prefix}.${value}`) ?? value,
      meta,
      isRtl: meta.dir === "rtl",
      dateLocale: meta.dateLocale,
    };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
