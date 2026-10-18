import VerdictBadge from "./VerdictBadge";

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function VerdictSummary({ caseFile, explanation }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <VerdictBadge verdict={caseFile.verdict} />
        <span className="font-mono text-xs text-slate-400">
          {caseFile.case_id} · {formatTime(caseFile.generated_at)}
        </span>
      </div>
      <h2 className="mt-3 text-lg font-semibold text-slate-900">{explanation.headline}</h2>
      <p className="mt-1 text-sm text-slate-700">{explanation.summary}</p>
      <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
        {caseFile.verdict_reasons.map((reason, index) => (
          <li key={index}>{reason}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded bg-slate-100 px-2 py-0.5">type: {caseFile.input_type}</span>
        <span className="rounded bg-slate-100 px-2 py-0.5">
          {caseFile.findings.length} finding(s)
        </span>
        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono">
          sha256: {caseFile.input_sha256.slice(0, 12)}…
        </span>
      </div>
    </div>
  );
}
