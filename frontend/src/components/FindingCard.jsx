import { STATUS_STYLES, SOURCE_LABELS } from "../lib/verdict";

export default function FindingCard({ finding }) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-800">{finding.title}</h3>
        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-mono text-slate-700">
          {finding.id}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">{finding.category}</span>
        <span className={`rounded px-2 py-0.5 ${STATUS_STYLES[finding.status] ?? "bg-slate-100"}`}>
          {finding.status}
        </span>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
          {SOURCE_LABELS[finding.source] ?? finding.source}
        </span>
        {finding.rule_id && (
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-600">
            {finding.rule_id}
          </span>
        )}
      </div>
      {finding.evidence?.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold uppercase text-slate-500">Supporting evidence</h4>
          <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
            {finding.evidence.map((item, index) => (
              <li key={index} className="break-words font-mono text-xs">
                “{item}”
              </li>
            ))}
          </ul>
        </div>
      )}
      {finding.limitations && (
        <p className="mt-3 text-xs text-slate-500">
          <span className="font-semibold uppercase">Limitation:</span> {finding.limitations}
        </p>
      )}
      {finding.recommended_action && (
        <p className="mt-2 text-sm text-slate-800">
          <span className="text-xs font-semibold uppercase">Do this:</span>{" "}
          {finding.recommended_action}
        </p>
      )}
    </div>
  );
}
