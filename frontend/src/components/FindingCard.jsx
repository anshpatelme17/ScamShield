import { STATUS_STYLES } from "../lib/verdict";
import { useLanguage } from "../i18n/LanguageContext";

export default function FindingCard({ finding }) {
  const { t, tEnum } = useLanguage();
  return (
    <div className="rounded-lg border border-slate-300 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-800">{finding.title}</h3>
        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-mono text-slate-700" dir="ltr">
          {finding.id}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
          {tEnum("category", finding.category)}
        </span>
        <span className={`rounded px-2 py-0.5 ${STATUS_STYLES[finding.status] ?? "bg-slate-100"}`}>
          {tEnum("status", finding.status)}
        </span>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
          {tEnum("source", finding.source)}
        </span>
        {finding.rule_id && (
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-600" dir="ltr">
            {finding.rule_id}
          </span>
        )}
      </div>
      {finding.evidence?.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold uppercase text-slate-500">
            {t("findings.supporting")}
          </h4>
          <ul className="mt-1 list-disc text-sm text-slate-700 ps-5">
            {finding.evidence.map((item, index) => (
              <li key={index} className="wrap-anywhere font-mono text-xs" dir="ltr">
                “{item}”
              </li>
            ))}
          </ul>
        </div>
      )}
      {finding.limitations && (
        <p className="mt-3 text-xs text-slate-500">
          <span className="font-semibold uppercase">{t("findings.limitation")}</span>{" "}
          {finding.limitations}
        </p>
      )}
      {finding.recommended_action && (
        <p className="mt-2 text-sm text-slate-800">
          <span className="text-xs font-semibold uppercase">{t("findings.action")}</span>{" "}
          {finding.recommended_action}
        </p>
      )}
    </div>
  );
}
