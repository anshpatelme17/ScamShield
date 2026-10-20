import { useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

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

export function detectImageKind(file, dataUrl) {
  if (file.type && !file.type.startsWith("image/")) {
    return "unsupportedFile";
  }
  if (!file.type || file.type === "image/png" || file.type === "image/jpeg") {
    const base64 = dataUrl.split(",")[1] ?? "";
    if (base64.startsWith(PNG_B64_PREFIX)) return "png";
    if (file.type === "image/jpeg" || base64.startsWith(JPEG_B64_PREFIX)) return "jpeg";
    return "invalidImage";
  }
  return "unsupportedFile";
}

export default function InputPanel({ onSubmit, loading }) {
  const { t, tEnum } = useLanguage();
  const [text, setText] = useState("");
  const [imageB64, setImageB64] = useState(null);
  const [imageName, setImageName] = useState(null);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);

  const hasContent = Boolean(text.trim()) || Boolean(imageB64);
  const textType = detectInputType(text);

  async function handleImageSelection(file) {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(t("input.error.oversize"));
      return;
    }
    let dataUrlPixels = "";
    try {
      dataUrlPixels = await readAsDataUrl(file);
    } catch {
      setImageError(t("input.error.read"));
      return;
    }
    if (!dataUrlPixels.split(",")[1]) {
      setImageError(t("input.error.read"));
      return;
    }
    const kind = detectImageKind(file, dataUrlPixels);
    if (kind === "unsupportedFile") {
      setImageError(t("input.unsupportedFile"));
      return;
    }
    if (kind === "invalidImage") {
      setImageError(t("input.invalidImage"));
      return;
    }
    setImageError(null);
    setImageB64(`data:${kind === "png" ? "image/png" : "image/jpeg"};base64,${dataUrlPixels.split(",")[1]}`);
    setImageName(file.name);
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    handleImageSelection(file);
  }

  function clearImage() {
    setImageB64(null);
    setImageName(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) handleImageSelection(file);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!hasContent) return;
    onSubmit({ text, imageB64 });
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

      <div
        data-testid="image-dropzone"
        className="mt-3 rounded border border-dashed border-slate-300 p-4 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {imageB64 ? (
          <div className="flex flex-col items-center gap-2">
            <img
              src={imageB64}
              alt={t("input.imageAlt")}
              className="max-h-48 rounded border border-slate-200"
            />
            <span className="max-w-64 truncate text-xs text-slate-500" dir="ltr">
              {imageName}
            </span>
            <button
              type="button"
              onClick={clearImage}
              className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              {t("input.remove")}
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-600">{t("input.dropzone")}</p>
        )}
        <input
          ref={fileInputRef}
          id="image-input"
          data-testid="image-input"
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleImageChange}
        />
        <label
          htmlFor="image-input"
          className="mt-3 inline-block cursor-pointer rounded bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          {t("input.attach")}
        </label>
      </div>

      {imageError && <p className="mt-2 text-xs text-red-600">{imageError}</p>}

      {hasContent ? (
        <p className="mt-2 text-xs text-slate-500">{t("input.supported")}</p>
      ) : null}

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
            clearImage();
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
