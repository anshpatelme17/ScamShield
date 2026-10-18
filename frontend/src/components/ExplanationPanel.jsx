export default function ExplanationPanel({ explanation }) {
  return (
    <>
      {explanation.unverified.length > 0 && (
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h3 className="font-semibold text-slate-800">What could not be verified</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
            {explanation.unverified.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="font-semibold text-slate-800">Recommended next steps</h3>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
          {explanation.actions.map((action, index) => (
            <li key={index}>{action}</li>
          ))}
        </ul>
        <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {explanation.reporting}
        </div>
      </div>
    </>
  );
}
