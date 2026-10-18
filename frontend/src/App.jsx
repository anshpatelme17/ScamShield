import { useEffect, useState } from "react";

import InputPanel from "./components/InputPanel";
import VerdictSummary from "./components/VerdictSummary";
import FindingsList from "./components/FindingsList";
import { ActionsCard, UnverifiedList } from "./components/ExplanationPanel";
import CaseFileActions from "./components/CaseFileActions";
import HistoryPanel from "./components/HistoryPanel";
import Skeletons from "./components/Skeletons";
import LanguageSelect from "./components/LanguageSelect";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";

import { analyzeApi } from "./lib/api";
import {
  addHistoryEntry,
  buildHistoryEntry,
  clearHistory,
  loadHistory,
  removeHistoryEntry,
} from "./lib/history";

export default function App() {
  return (
    <LanguageProvider>
      <Dashboard />
    </LanguageProvider>
  );
}

export function Dashboard() {
  const { t, isRtl } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  async function analyze({ text, imageB64 }) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = await analyzeApi({ text, imageB64 });
      setResult(payload);
      setHistory(addHistoryEntry(buildHistoryEntry(payload)));
    } catch (caught) {
      setError(
        caught?.key ? { key: caught.key, params: caught.params } : caught?.message ?? "Analysis failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function restore(id) {
    const entry = loadHistory().find((item) => item.id === id);
    if (entry?.payload) {
      setError(null);
      setResult(entry.payload);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const errorMessage =
    error === null
      ? null
      : typeof error === "string"
        ? error
        : t(error.key, error.params);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6" dir={isRtl ? "rtl" : "ltr"}>
      <Header />

      <section aria-label={`${t("tabs.message")} · ${t("history.title")}`} className="grid items-start gap-4 md:grid-cols-[65fr_35fr]">
        <InputPanel onSubmit={analyze} loading={loading} />
        <HistoryPanel
          entries={history}
          onRestore={restore}
          onDelete={(id) => setHistory(removeHistoryEntry(id))}
          onClear={() => setHistory(clearHistory())}
        />
      </section>

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      {loading && (
        <section className="mt-6">
          <Skeletons />
        </section>
      )}

      {result && !loading && (
        <>
          <section aria-label="Analysis summary" className="mt-6">
            <VerdictSummary caseFile={result.case_file} explanation={result.explanation} />
          </section>

          <section aria-label="Evidence findings" className="mt-6">
            <FindingsList findings={result.case_file.findings} />
          </section>

          <section aria-label="What could not be verified" className="mt-6">
            <UnverifiedList explanation={result.explanation} />
          </section>

          <section aria-label="Recommended actions" className="mt-6 space-y-4">
            <ActionsCard explanation={result.explanation} />
            <CaseFileActions payload={result} />
            <p className="text-xs text-slate-500">{t("case.disclaimer")}</p>
          </section>
        </>
      )}
    </main>
  );
}

function Header() {
  const { t } = useLanguage();
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-64">
        <h1 className="text-2xl font-bold text-slate-900">{t("app.title")}</h1>
        <p className="text-sm text-slate-600">{t("app.tagline")}</p>
      </div>
      <LanguageSelect />
    </header>
  );
}
