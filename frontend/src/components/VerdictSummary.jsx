import VerdictBadge from "./VerdictBadge";
import { useLanguage } from "../i18n/LanguageContext";
import {
  resolveReasonSentence,
  resolveVerdictTexts,
} from "../i18n/findings";

export default function VerdictSummary({ caseFile, explanation }) {
  const { t, tEnum, lang, dateLocale } = useLanguage();
  const texts = resolveVerdictTexts(caseFile.verdict, lang) ?? {
    headline: { text: explanation.headline, fallback: false },
    summary: { text: explanation.summary, fallback: false },
  };

  function formatTime(iso) {
    try {
      return new Date(iso).toLocaleString(dateLocale);
    } catch {
      return iso;
    }
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <VerdictBadge verdict={caseFile.verdict} />
        <span className="font-mono text-xs text-slate-400" dir="ltr">
          {caseFile.case_id} · {formatTime(caseFile.generated_at)}
        </span>
      </div>
      <h2 className="mt-3 text-lg font-semibold text-slate-900">
        {texts.headline?.text ?? explanation.headline}
      </h2>
      <p className="mt-1 text-sm text-slate-700">
        {texts.summary?.text ?? explanation.summary}
      </p>
      <ul className="mt-3 list-disc text-sm text-slate-600 ps-5">
        {(caseFile.verdict_reason_specs ?? []).length > 0
          ? caseFile.verdict_reason_specs.map((spec, index) => {
              const sentence = resolveReasonSentence(spec, lang);
              if (!sentence) {
                return (
                  <li key={index} dir="ltr">
                    {caseFile.verdict_reasons?.[index] ?? spec.key}
                  </li>
                );
              }
              return (
                <li key={index}>
                  {sentence.text}
                  {sentence.fallback && (
                    <span className="ms-1 text-xs text-slate-400">
                      {t(sentence.fallback)}
                    </span>
                  )}
                </li>
              );
            })
          : (caseFile.verdict_reasons ?? []).map((reason, index) => (
              <li key={index} dir={lang === "en" ? undefined : "ltr"}>
                {reason}
              </li>
            ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded bg-slate-100 px-2 py-0.5">
          {t("summary.type")} {tEnum("inputType", caseFile.input_type)}
        </span>
        <span className="rounded bg-slate-100 px-2 py-0.5">
          {t("summary.findings", { n: caseFile.findings.length })}
        </span>
        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono" dir="ltr">
          {t("summary.sha256")} {caseFile.input_sha256.slice(0, 12)}…
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-400">{t("notes.dynamicEnglish")}</p>
    </div>
  );
}
