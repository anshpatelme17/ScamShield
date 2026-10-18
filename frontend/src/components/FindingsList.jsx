import FindingCard from "./FindingCard";
import { useLanguage } from "../i18n/LanguageContext";

export default function FindingsList({ findings }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="font-semibold text-slate-800">{t("findings.title")}</h3>
      {findings.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">{t("findings.empty")}</p>
      ) : (
        <div className="mt-3 grid items-start gap-4 md:grid-cols-2">
          {findings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      )}
    </div>
  );
}
