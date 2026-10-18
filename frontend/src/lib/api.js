export async function analyzeApi({ text, imageB64 }) {
  const body = {};
  if (text && text.trim()) {
    body.text = text;
  }
  if (imageB64) {
    body.image_b64 = imageB64;
  }
  if (Object.keys(body).length === 0) {
    throw new Error("Nothing to analyze yet. Paste a message or attach a QR screenshot.");
  }

  let response;
  try {
    response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw errorWithKey(
      "Could not reach the analysis service. Make sure the backend is running on port 8765.",
      "errors.network"
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const detail = payload?.detail;
    if (detail) {
      throw new Error(detail);
    }
    throw errorWithKey(`Request failed with status ${response.status}`, "errors.status", {
      status: response.status,
    });
  }
  return payload;
}

function errorWithKey(message, key, params = undefined) {
  const error = new Error(message);
  error.key = key;
  if (params) {
    error.params = params;
  }
  return error;
}
