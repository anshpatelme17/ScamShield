import { useLanguage } from "../i18n/LanguageContext";
import { resolveDefaultActions } from "../i18n/findings";

export function UnverifiedList({ explanation }) {
  const { t, lang } = useLanguage();
  const items = explanation.unverified;
  if (items.length === 0) {
    return (
      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="font-semibold text-slate-800">{t("unverified.title")}</h3>
        <p className="mt-2 text-sm text-slate-600">{t("unverified.empty")}</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="font-semibold text-slate-800">{t("unverified.title")}</h3>
      <ul className="mt-2 list-disc text-sm text-slate-600 ps-5">
        {items.map((item, index) => (
          <li key={index}>
            {item}
            {lang !== "en" && (
              <span className="ms-1 text-xs text-slate-400">{t("i18n.fallbackEnglish")}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ActionsCard({ explanation, verdict }) {
  const { t, lang } = useLanguage();
  const defaultAction = verdict ? resolveDefaultActions(verdict, lang) : null;
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="font-semibold text-slate-800">{t("actions.title")}</h3>
      {defaultAction && (
        <p className="mt-2 text-sm font-semibold text-slate-900">
          {defaultAction.text}
          {defaultAction.fallback && (
            <span className="ms-1 text-xs font-normal text-slate-400">
              {t(defaultAction.fallback)}
            </span>
          )}
        </p>
      )}
      <ul className="mt-2 list-disc text-sm text-slate-700 ps-5">
        {explanation.actions.map((action, index) => (
          <li key={index}>
            {action}
            {lang !== "en" && (
              <span className="ms-1 text-xs text-slate-400">{t("i18n.fallbackEnglish")}</span>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        {t("reporting.indiaGuidance")}
      </div>
    </div>
  );
}

export default function ExplanationPanel({ explanation, verdict }) {
  return (
    <>
      {explanation.unverified.length > 0 && (
        <UnverifiedList explanation={explanation} />
      )}
      <ActionsCard explanation={explanation} verdict={verdict} />
    </>
  );
}
