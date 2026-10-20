import en from "./locales/en";
import hi from "./locales/hi";
import bn from "./locales/bn";
import te from "./locales/te";
import mr from "./locales/mr";
import ta from "./locales/ta";
import gu from "./locales/gu";
import kn from "./locales/kn";
import ml from "./locales/ml";
import pa from "./locales/pa";
import ur from "./locales/ur";
import or from "./locales/or";
import es from "./locales/es";
import fr from "./locales/fr";
import ar from "./locales/ar";
import pt from "./locales/pt";

export const LANGUAGES = [
  { code: "en", label: "English", dir: "ltr", dateLocale: "en" },
  { code: "hi", label: "हिन्दी — Hindi", dir: "ltr", dateLocale: "hi" },
  { code: "bn", label: "বাংলা — Bengali", dir: "ltr", dateLocale: "bn" },
  { code: "te", label: "తెలుగు — Telugu", dir: "ltr", dateLocale: "te" },
  { code: "mr", label: "मराठी — Marathi", dir: "ltr", dateLocale: "mr" },
  { code: "ta", label: "தமிழ் — Tamil", dir: "ltr", dateLocale: "ta" },
  { code: "gu", label: "ગુજરાતી — Gujarati", dir: "ltr", dateLocale: "gu" },
  { code: "kn", label: "ಕನ್ನಡ — Kannada", dir: "ltr", dateLocale: "kn" },
  { code: "ml", label: "മലയാളം — Malayalam", dir: "ltr", dateLocale: "ml" },
  { code: "pa", label: "ਪੰਜਾਬੀ — Punjabi", dir: "ltr", dateLocale: "pa" },
  { code: "ur", label: "اردو — Urdu", dir: "rtl", dateLocale: "ur" },
  { code: "or", label: "ଓଡ଼ିଆ — Odia", dir: "ltr", dateLocale: "or" },
  { code: "es", label: "Español — Spanish", dir: "ltr", dateLocale: "es" },
  { code: "fr", label: "Français — French", dir: "ltr", dateLocale: "fr" },
  { code: "ar", label: "العربية — Arabic", dir: "rtl", dateLocale: "ar" },
  { code: "pt", label: "Português — Portuguese", dir: "ltr", dateLocale: "pt" },
];

export const translations = {
  en, hi, bn, te, mr, ta, gu, kn, ml, pa, ur, or, es, fr, ar, pt,
};

export const DEFAULT_LANGUAGE = "en";
export const LANGUAGE_STORAGE_KEY = "scamshield.language";
