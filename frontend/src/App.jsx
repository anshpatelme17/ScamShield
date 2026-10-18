import { useEffect, useState } from "react";

import InputPanel from "./components/InputPanel";
import VerdictSummary from "./components/VerdictSummary";
import FindingsList from "./components/FindingsList";
import ExplanationPanel from "./components/ExplanationPanel";
import CaseFileActions from "./components/CaseFileActions";
import HistoryPanel from "./components/HistoryPanel";
import Skeletons from "./components/Skeletons";

import { analyzeApi } from "./lib/api";
import {
  addHistoryEntry,
  buildHistoryEntry,
  clearHistory,
  loadHistory,
  removeHistoryEntry,
} from "./lib/history";

export default function App() {
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
      setError(caught?.message ?? "Analysis failed.");
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

  if (!result && !loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Header />
        <InputPanel onSubmit={analyze} loading={loading} />
        {error && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}
        <div className="mt-6">
          <HistoryPanel
            entries={history}
            onRestore={restore}
            onDelete={(id) => setHistory(removeHistoryEntry(id))}
            onClear={() => setHistory(clearHistory())}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Header />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <InputPanel onSubmit={analyze} loading={loading} />
          {error && (
            <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}
          {loading && <Skeletons />}
          {result && !loading && (
            <section className="mt-6 space-y-4">
              <VerdictSummary caseFile={result.case_file} explanation={result.explanation} />
              <FindingsList findings={result.case_file.findings} />
              <ExplanationPanel explanation={result.explanation} />
              <CaseFileActions payload={result} />
              <p className="text-xs text-slate-500">{result.case_file.disclaimer}</p>
            </section>
          )}
        </div>
        <div className="space-y-6">
          <HistoryPanel
            entries={history}
            onRestore={restore}
            onDelete={(id) => setHistory(removeHistoryEntry(id))}
            onClear={() => setHistory(clearHistory())}
          />
        </div>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900">ScamShield AI 2.0</h1>
      <p className="text-sm text-slate-600">
        Don&apos;t Just Detect the Scam. Investigate the Evidence.
      </p>
    </header>
  );
}
