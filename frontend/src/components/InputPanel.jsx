import { useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

const MAX_LENGTH = 10000;
const MAX_IMAGE_BYTES = 2000000;

export default function InputPanel({ onSubmit, loading }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState("message");
  const [text, setText] = useState("");
  const [imageB64, setImageB64] = useState(null);
  const [imageName, setImageName] = useState(null);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);

  const hasContent = Boolean(text.trim()) || Boolean(imageB64);
  const tabs = [
    { id: "message", label: t("tabs.message") },
    { id: "qr", label: t("tabs.qr") },
  ];

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(t("input.error.oversize"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const base64 = dataUrl.split(",")[1] ?? "";
      if (!base64) {
        setImageError(t("input.error.read"));
        return;
      }
      setImageError(null);
      setImageB64(`data:${file.type || "image/png"};base64,${base64}`);
      setImageName(file.name);
    };
    reader.onerror = () => setImageError(t("input.error.read"));
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageB64(null);
    setImageName(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      <div className="flex gap-1 rounded-md bg-slate-100 p-1" role="tablist">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "message" ? (
        <>
          <textarea
            className="mt-3 min-h-40 w-full resize-y rounded border border-slate-300 p-3 text-sm focus:border-slate-500 focus:outline-none"
            maxLength={MAX_LENGTH}
            placeholder={t("input.placeholder")}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            {t("input.counter", { count: text.length })} {t("input.privacy")}
          </p>
        </>
      ) : (
        <div className="mt-3">
          <div
            className="rounded border border-dashed border-slate-300 p-4 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (event.dataTransfer.files?.length) {
                Object.defineProperty(event, "target", {
                  value: { files: event.dataTransfer.files, value: "" },
                  writable: true,
                });
                handleImageChange(event);
              }
            }}
          >
            {imageB64 ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={imageB64}
                  alt="QR screenshot to analyze"
                  className="max-h-48 rounded border border-slate-200"
                />
                <span className="max-w-64 truncate text-xs text-slate-500">{imageName}</span>
                <button
                  type="button"
                  onClick={clearImage}
                  className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  {t("input.qr.remove")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <p className="text-sm text-slate-600">{t("input.qr.drop")}</p>
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
                  className="cursor-pointer rounded bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
                >
                  {t("input.qr.choose")}
                </label>
              </div>
            )}
          </div>
          {imageError && <p className="mt-2 text-xs text-red-600">{imageError}</p>}
          <p className="mt-2 text-xs text-slate-500">{t("input.qr.note")}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !hasContent}
        className="mt-4 w-full rounded bg-slate-900 py-2 font-semibold text-white disabled:opacity-50"
      >
        {loading ? t("input.analyzing") : t("input.analyze")}
      </button>
    </form>
  );
}
