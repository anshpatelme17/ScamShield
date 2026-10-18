import FindingCard from "./FindingCard";

export default function FindingsList({ findings }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="font-semibold text-slate-800">Evidence findings</h3>
      {findings.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          No indicator matched any rule in the current rule set. This is not proof that the message
          is safe.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {findings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      )}
    </div>
  );
}
