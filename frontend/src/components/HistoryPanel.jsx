import { useState } from "react";
import VerdictBadge from "./VerdictBadge";

function shortLabel(entry) {
  if (entry.label) return entry.label;
  const findingsTexts = entry.payload?.case_file?.findings ?? [];
  const firstEvidence = findingsTexts[0]?.evidence?.[0];
  return firstEvidence
    ? `…${String(firstEvidence).slice(0, 80)}…`
    : entry.input_type === "image"
      ? "QR screenshot"
      : "Pasted message";
}

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function HistoryPanel({ entries, onRestore, onDelete, onClear }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex items-center gap-2 font-semibold text-slate-800"
        >
          <span className={`text-xs transition-transform ${expanded ? "rotate-90" : ""}`}>▶</span>
          Case history
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {entries.length}
          </span>
        </button>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-slate-500 hover:text-red-600"
          >
            Clear all
          </button>
        )}
      </div>

      {expanded && (
        <>
          {entries.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              Analyzed cases appear here, stored only in this browser. Nothing is uploaded anywhere
              else.
            </p>
          ) : (
            <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded border border-slate-200 p-2 text-sm hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <VerdictBadge verdict={entry.verdict} size="sm" />
                    <span className="text-[10px] text-slate-400">{formatWhen(entry.at)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRestore(entry.id)}
                    className="mt-2 block w-full break-words text-left text-xs text-slate-600 hover:text-slate-900"
                  >
                    {shortLabel(entry)}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(entry.id)}
                    className="mt-1 text-[10px] uppercase text-slate-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </aside>
  );
}
