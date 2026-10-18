import { copyCaseFile, downloadCaseFile } from "../lib/casefile";

export default function CaseFileActions({ payload }) {
  async function handleCopy() {
    try {
      await copyCaseFile(payload);
    } catch {
      return;
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Copy case JSON
      </button>
      <button
        type="button"
        onClick={() => downloadCaseFile(payload)}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Download case JSON
      </button>
    </div>
  );
}
