import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import AttachmentMenu from "./AttachmentMenu";

const MAX_LENGTH = 10000;
const MAX_IMAGE_BYTES = 2000000;
const PNG_B64_PREFIX = "iVBORw";
const JPEG_B64_PREFIX = "/9j/";

export function detectInputType(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (/(^|\s)(https?:\/\/|www\.)/i.test(trimmed)) return "url";
  if (/^[\d\s\-().+]{10,20}$/.test(trimmed)) return "phone_number";
  return "text";
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}

export function sniffImageKind(dataUrl) {
  const base64 = dataUrl.split(",")[1] ?? "";
  if (base64.startsWith(PNG_B64_PREFIX)) return "image/png";
  if (base64.startsWith(JPEG_B64_PREFIX)) return "image/jpeg";
  return null;
}

export function formatFileSize(bytes) {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) return "";
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function InputPanel({ onSubmit, loading }) {
  const { t, tEnum } = useLanguage();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [replacedNote, setReplacedNote] = useState(false);

  const hasContent = Boolean(text.trim()) || Boolean(image);
  const textType = detectInputType(text);

  function applyAttachment({ name, type, size, dataUrl }) {
    if (size > MAX_IMAGE_BYTES) {
      setImageError(t("input.error.oversize"));
      return;
    }
    if (type && !type.startsWith("image/")) {
      setImageError(t("input.unsupportedFile"));
      return;
    }
    const sniffed = sniffImageKind(dataUrl);
    if (!sniffed) {
      setImageError(t("input.invalidImage"));
      return;
    }
    if (type && type !== sniffed && !(type === "image/jpg" && sniffed === "image/jpeg")) {
      setImageError(t("input.invalidImage"));
      return;
    }
    setImageError(null);
    setImage((prev) => {
      if (prev) setReplacedNote(true);
      return { name, type: sniffed, size, dataUrl };
    });
  }

  async function handleFileSelected(file) {
    if (!file) return;
    let dataUrl = "";
    try {
      dataUrl = await readAsDataUrl(file);
    } catch {
      setImageError(t("input.error.read"));
      return;
    }
    if (!dataUrl.split(",")[1]) {
      setImageError(t("input.error.read"));
      return;
    }
    applyAttachment({
      name: file.name,
      type: file.type || sniffImageKind(dataUrl),
      size: file.size,
      dataUrl,
    });
  }

  function handleCameraCapture(result) {
    applyAttachment(result);
  }

  function removeAttachment() {
    setImage(null);
    setImageError(null);
    setReplacedNote(false);
  }

  async function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!hasContent || loading) return;
    onSubmit({ text, imageB64: image?.dataUrl ?? null });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"
    >
      <h2 className="font-semibold text-slate-800">{t("input.title")}</h2>
      <textarea
        className="mt-3 min-h-40 w-full resize-y rounded border border-slate-300 p-3 text-sm focus:border-slate-500 focus:outline-none"
        maxLength={MAX_LENGTH}
        placeholder={t("input.placeholder")}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>
          {t("input.counter", { count: text.length })} {t("input.privacy")}
        </span>
        {textType && (
          <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
            {t("input.detected", { type: tEnum("inputType", textType) })}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2" data-testid="attachment-bar">
        <AttachmentMenu
          onFileSelected={handleFileSelected}
          onCameraCapture={handleCameraCapture}
        />
        {image ? (
          <span
            className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
            data-testid="attachment-chip"
          >
            <span className="max-w-56 truncate font-medium text-slate-800" dir="ltr">
              {image.type === "image/png" ? "🖼️" : "📷"} {image.name}
            </span>
            <span dir="ltr">{image.type}</span>
            <span dir="ltr">{formatFileSize(image.size)}</span>
            <button
              type="button"
              onClick={removeAttachment}
              className="rounded border border-slate-300 px-2 py-0.5 font-medium text-slate-600 hover:bg-slate-100"
              aria-label={t("input.remove")}
            >
              ✕
            </button>
          </span>
        ) : (
          imageError && <p className="text-xs text-red-600">{imageError}</p>
        )}
      </div>

      {image && imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
      {replacedNote && (
        <p className="mt-1 text-xs text-amber-700">{t("attach.replaced")}</p>
      )}

      {!image && (
        <div
          data-testid="image-dropzone"
          className="mt-3 rounded border border-dashed border-slate-300 p-4 text-center"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <p className="text-sm text-slate-600">{t("input.dropzone")}</p>
        </div>
      )}

      <p className="mt-2 text-xs text-slate-500">{t("input.supported")}</p>

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={loading || !hasContent}
          className="flex-1 rounded bg-slate-900 py-2 font-semibold text-white disabled:opacity-50"
        >
          {loading ? t("input.analyzing") : t("input.analyze")}
        </button>
        <button
          type="button"
          onClick={() => {
            setText("");
            removeAttachment();
          }}
          disabled={!hasContent || loading}
          className="rounded border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          {t("input.clear")}
        </button>
      </div>
    </form>
  );
}
