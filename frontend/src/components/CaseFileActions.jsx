import { useState } from "react";
import { copyCaseFile, downloadCaseFile } from "../lib/casefile";
import { useLanguage } from "../i18n/LanguageContext";

export default function CaseFileActions({ payload }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState(null);

  async function handleCopy() {
    try {
      const ok = await copyCaseFile(payload);
      if (ok === false) throw new Error("copy rejected");
      setStatus({ kind: "ok", text: t("casefile.copied") });
    } catch {
      setStatus({ kind: "error", text: t("casefile.copyFailed") });
    }
  }

  function handleDownload() {
    try {
      downloadCaseFile(payload);
      setStatus({ kind: "ok", text: t("casefile.downloaded") });
    } catch {
      setStatus({ kind: "error", text: t("casefile.copyFailed") });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        aria-label={t("casefile.copy")}
      >
        {t("casefile.copy")}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        aria-label={t("casefile.download")}
      >
        {t("casefile.download")}
      </button>
      {status && (
        <span
          role="status"
          className={`text-xs font-medium ${
            status.kind === "ok" ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {status.text}
        </span>
      )}
    </div>
  );
}
