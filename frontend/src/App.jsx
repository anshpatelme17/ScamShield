import { useRef, useState } from "react";

const MAX_LENGTH = 10000;
const MAX_IMAGE_BYTES = 2000000;

const VERDICT_STYLES = {
  highly_suspicious: "bg-red-600",
  suspicious: "bg-amber-500",
  no_strong_warning_signs_found: "bg-slate-500",
  unable_to_determine: "bg-slate-400",
};

const VERDICT_LABELS = {
  highly_suspicious: "HIGHLY SUSPICIOUS",
  suspicious: "SUSPICIOUS",
  no_strong_warning_signs_found: "NO STRONG WARNING SIGNS FOUND",
  unable_to_determine: "UNABLE TO DETERMINE",
};

function VerdictBadge({ verdict }) {
  return (
    <span
      className={`inline-block rounded px-3 py-1 text-sm font-bold text-white ${
        VERDICT_STYLES[verdict] ?? "bg-slate-400"
      }`}
    >
      {VERDICT_LABELS[verdict] ?? verdict}
    </span>
  );
}

function FindingCard({ finding }) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-800">{finding.title}</h3>
        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-mono text-slate-700">
          {finding.id}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="rounded bg-slate-100 px-2 py-0.5">{finding.category}</span>
        <span className="rounded bg-slate-100 px-2 py-0.5">{finding.status}</span>
        <span className="rounded bg-slate-100 px-2 py-0.5">{finding.source}</span>
        {finding.rule_id && (
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono">{finding.rule_id}</span>
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
          <span className="font-semibold uppercase text-xs">Do this:</span>{" "}
          {finding.recommended_action}
        </p>
      )}
    </div>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [imageB64, setImageB64] = useState(null);
  const [imageName, setImageName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  async function analyze(event) {
    event.preventDefault();
    if (!text.trim() && !imageB64) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = {};
      if (text.trim()) body.text = text;
      if (imageB64) body.image_b64 = imageB64;
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const bodyResult = await response.json();
      if (!response.ok) {
        setError(bodyResult?.detail ?? `Request failed with status ${response.status}`);
      } else {
        setResult(bodyResult);
      }
    } catch {
      setError(
        "Could not reach the analysis service. Make sure the backend is running on port 8765.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image is larger than the 2 MB limit; choose a smaller screenshot.");
      setImageB64(null);
      setImageName(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const base64 = dataUrl.split(",")[1] ?? "";
      if (!base64) {
        setError("Could not read the image file.");
        return;
      }
      setError(null);
      setImageB64(`data:image/png;base64,${base64}`);
      setImageName(file.name);
    };
    reader.onerror = () => setError("Could not read the image file.");
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageB64(null);
    setImageName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">ScamShield AI 2.0</h1>
        <p className="text-sm text-slate-600">
          Don't Just Detect the Scam. Investigate the Evidence.
        </p>
      </header>

      <form onSubmit={analyze} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <textarea
          className="min-h-40 w-full resize-y rounded border border-slate-300 p-3 text-sm focus:border-slate-500 focus:outline-none"
          maxLength={MAX_LENGTH}
          placeholder="Paste a suspicious SMS, WhatsApp message, email, or link. Nothing is sent anywhere else; analysis runs locally."
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">
          {text.length}/{MAX_LENGTH} characters. Your message is sent only to the local analysis
          service and is not stored or logged.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            id="qr-image-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
          <label
            htmlFor="qr-image-input"
            className="cursor-pointer rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Attach QR screenshot (PNG/JPEG, up to 2 MB)
          </label>
          {imageName && (
            <span className="flex items-center gap-2 rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
              <span className="max-w-48 truncate">{imageName}</span>
              <button
                type="button"
                onClick={clearImage}
                className="rounded px-1 text-slate-500 hover:bg-slate-200 hover:text-red-600"
              >
                Remove
              </button>
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || (!text.trim() && !imageB64)}
          className="mt-3 w-full rounded bg-slate-900 py-2 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {result && (
        <section className="mt-6 space-y-4">
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <VerdictBadge verdict={result.case_file.verdict} />
              <span className="font-mono text-xs text-slate-400">
                {result.case_file.case_id}
              </span>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">
              {result.explanation.headline}
            </h2>
            <p className="mt-1 text-sm text-slate-700">{result.explanation.summary}</p>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
              {result.case_file.verdict_reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <h3 className="font-semibold text-slate-800">Evidence findings</h3>
            {result.case_file.findings.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                No indicator matched any rule in the current rule set. This is not proof that the
                message is safe.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {result.case_file.findings.map((finding) => (
                  <FindingCard key={finding.id} finding={finding} />
                ))}
              </div>
            )}
          </div>

          {result.explanation.unverified.length > 0 && (
            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <h3 className="font-semibold text-slate-800">What could not be verified</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                {result.explanation.unverified.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <h3 className="font-semibold text-slate-800">Recommended next steps</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
              {result.explanation.actions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
            <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {result.explanation.reporting}
            </div>
          </div>

          <p className="text-xs text-slate-500">{result.case_file.disclaimer}</p>
        </section>
      )}
    </main>
  );
}
