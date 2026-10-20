// Catalog audit: static-key parity + dynamic rule coverage; run from frontend/.
import { pathToFileURL } from "node:url";
import path from "node:path";

const files = {
  hi: "./src/i18n/locales/hi.js",
  bn: "./src/i18n/locales/bn.js",
  te: "./src/i18n/locales/te.js",
  mr: "./src/i18n/locales/mr.js",
  ta: "./src/i18n/locales/ta.js",
  gu: "./src/i18n/locales/gu.js",
  kn: "./src/i18n/locales/kn.js",
  ml: "./src/i18n/locales/ml.js",
  pa: "./src/i18n/locales/pa.js",
  ur: "./src/i18n/locales/ur.js",
  or: "./src/i18n/locales/or.js",
  es: "./src/i18n/locales/es.js",
  fr: "./src/i18n/locales/fr.js",
  ar: "./src/i18n/locales/ar.js",
  pt: "./src/i18n/locales/pt.js",
};

const root = process.cwd();
const enMod = await import(pathToFileURL(path.join(root, "src/i18n/locales/en.js")).href);
const en = enMod.default;

let failures = 0;
for (const [code, rel] of Object.entries(files)) {
  try {
    const dict = (await import(pathToFileURL(path.join(root, rel)).href)).default;
    const keys = Object.keys(dict);
    const missing = Object.keys(en).filter((key) => {
      if (key.startsWith("rule.")) return false;
      return !(key in dict);
    });
    const ruleKeys = keys.filter((k) => k.startsWith("rule.")).length;
    const malformed = Object.entries(dict).filter(
      ([k, v]) => typeof v !== "string" || v.trim().length < 3,
    );
    console.log(
      `${code}: ${keys.length} keys; staticMissing=${missing.length}; ruleKeys=${ruleKeys}; malformed=${malformed.length}`,
    );
    if (missing.length || malformed.length) {
      failures++;
      if (missing.length) console.log(`   missing: ${missing.slice(0, 6).join(", ")}`);
      if (malformed.length) console.log(`   malformed: ${malformed.slice(0, 5).map(([k]) => k).join(", ")}`);
    }
  } catch (error) {
    failures++;
    console.log(`${code}: LOAD ERROR: ${error.message}`);
  }
}
console.log(failures ? "AUDIT FAILED" : "AUDIT OK");
