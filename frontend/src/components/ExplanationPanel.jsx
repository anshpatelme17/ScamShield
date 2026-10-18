import { useLanguage } from "../i18n/LanguageContext";

export function UnverifiedList({ explanation }) {
  const { t } = useLanguage();
  if (explanation.unverified.length === 0) {
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
        {explanation.unverified.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ActionsCard({ explanation }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="font-semibold text-slate-800">{t("actions.title")}</h3>
      <ul className="mt-2 list-disc text-sm text-slate-700 ps-5">
        {explanation.actions.map((action, index) => (
          <li key={index}>{action}</li>
        ))}
      </ul>
      <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        {explanation.reporting}
      </div>
    </div>
  );
}

export default function ExplanationPanel({ explanation }) {
  return (
    <>
      {explanation.unverified.length > 0 && (
        <UnverifiedList explanation={explanation} />
      )}
      <ActionsCard explanation={explanation} />
    </>
  );
}
