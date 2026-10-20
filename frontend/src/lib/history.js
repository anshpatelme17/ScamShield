const STORAGE_KEY = "scamshield.history.v1";
const MAX_ENTRIES = 30;

export function loadHistory() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(entries) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    return;
  }
}

export function addHistoryEntry(entry) {
  const entries = loadHistory().filter((item) => item.id !== entry.id);
  const next = [entry, ...entries].slice(0, MAX_ENTRIES);
  persist(next);
  return next;
}

export function removeHistoryEntry(id) {
  const next = loadHistory().filter((item) => item.id !== id);
  persist(next);
  return next;
}

export function clearHistory() {
  persist([]);
  return [];
}

export function buildHistoryEntry(payload) {
  const caseFile = payload.case_file;
  const labelKey =
    caseFile.input_type === "image"
      ? "history.entry.image"
      : caseFile.input_type === "phone_number"
        ? "history.entry.phone"
        : "history.entry.pasted";
  return {
    id: caseFile.case_id,
    at: caseFile.generated_at,
    verdict: caseFile.verdict,
    input_type: caseFile.input_type,
    label_key: labelKey,
    payload,
  };
}
