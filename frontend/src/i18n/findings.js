import { DEFAULT_LANGUAGE, translations } from "./translations";

const FALLBACK_FLAG_KEY = "i18n.fallbackEnglish";

export const H_ALIAS_RE = /^IN-H-([A-Z]+)-001$/;

export function baseRuleId(ruleId) {
  const match = ruleId.match(H_ALIAS_RE);
  return match ? `IN-${match[1]}-001` : ruleId;
}

function hasKey(lang, key) {
  const dict = translations[lang];
  return !!dict && Object.prototype.hasOwnProperty.call(dict, key);
}

function resolveField(lang, key) {
  if (hasKey(lang, key)) return { text: translations[lang][key], fallback: false };
  if (hasKey(DEFAULT_LANGUAGE, key))
    return {
      text: translations[DEFAULT_LANGUAGE][key],
      fallback: lang === DEFAULT_LANGUAGE ? false : FALLBACK_FLAG_KEY,
    };
  return null;
}

function qrState(finding) {
  if (/no QR symbol/i.test(finding.title ?? "")) return "noSymbol";
  if (finding.status === "check_failed") return "failed";
  return "decoded";
}

function phoneVariant(finding) {
  return /not a valid/i.test(finding.title ?? "") ? "invalid" : "valid";
}

export function resolveFindingFields(finding, lang) {
  const ruleId = finding.rule_id;
  const resolved = (title, limitation, action) => ({
    title,
    limitation,
    action,
  });
  if (!ruleId) return null;
  const base = baseRuleId(ruleId);

  if (base === "IN-SECRET-001") {
    const variant = finding.category === "upi_pin_request" ? "pin" : "otp";
    return resolved(
      resolveField(lang, `rule.${base}.title.${variant}`),
      resolveField(lang, `rule.${base}.limitation`),
      resolveField(lang, `rule.${base}.action`),
    );
  }

  if (base === "IN-PHONE-FMT-001") {
    const variant = phoneVariant(finding);
    return resolved(
      resolveField(lang, `rule.${base}.title.${variant}`),
      resolveField(lang, `rule.${base}.limitation.${variant}`),
      resolveField(lang, `rule.${base}.action.${variant}`),
    );
  }

  if (base === "QR-IMG-001") {
    const variant = qrState(finding);
    return resolved(
      resolveField(lang, `rule.${base}.title.${variant}`),
      resolveField(lang, `rule.${base}.limitation.${variant}`),
      resolveField(lang, `rule.${base}.action`),
    );
  }

  return resolved(
    resolveField(lang, `rule.${base}.title`),
    resolveField(lang, `rule.${base}.limitation`),
    resolveField(lang, `rule.${base}.action`),
  );
}

export function reasonSpecParams(spec) {
  const args = (spec.args ?? []).map((a) => (typeof a === "string" ? a : String(a)));
  const params = {};
  if (args.length) params.ids = args.join(", ");
  if (spec.key === "verdictreason.urlAnomalies" || spec.key === "verdictreason.textSignals") {
    params.n = args.length;
  }
  return params;
}

export function resolveReasonSpec(spec, lang) {
  return resolveField(lang, spec.key);
}

export function resolveReasonSentence(spec, lang) {
  const base = resolveReasonSpec(spec, lang);
  if (!base) return null;
  const params = reasonSpecParams(spec);
  let text = base.text;
  for (const [name, value] of Object.entries(params)) {
    text = text.replaceAll(`{${name}}`, value);
  }
  return {
    text,
    fallback: base.fallback,
  };
}

export function resolveVerdictTexts(verdict, lang) {
  const headline = resolveField(lang, `verdictdesc.${verdict}.headline`);
  const summary = resolveField(lang, `verdictdesc.${verdict}.summary`);
  if (!headline && !summary) return null;
  return { headline, summary };
}

export function resolveDefaultActions(verdict, lang) {
  return resolveField(lang, `actions.default.${verdict}`);
}
