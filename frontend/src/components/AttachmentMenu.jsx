import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

export function estimateBytesFromDataUrl(dataUrl) {
  const base64 = dataUrl.split(",")[1] ?? "";
  let length = base64.length;
  while (length > 0 && base64[length - 1] === "=") length -= 1;
  return Math.floor((length * 3) / 4);
}

function CameraCapture({ onCapture, onClose }) {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fallbackInputRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError(true);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setError(true);
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    onCapture({
      name: "camera-capture.png",
      type: "image/png",
      size: estimateBytesFromDataUrl(dataUrl),
      dataUrl,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-label={t("camera.title")}
      data-testid="camera-capture"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-4">
        <h3 className="font-semibold text-slate-800">{t("camera.title")}</h3>
        <p className="mt-1 text-xs text-slate-500">{t("camera.hint")}</p>
        {error ? (
          <>
            <p className="mt-3 text-sm text-red-600">{t("camera.error")}</p>
            <button
              type="button"
              onClick={() => fallbackInputRef.current?.click()}
              className="mt-3 rounded bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              {t("camera.fallback")}
            </button>
            <input
              ref={fallbackInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onCapture(null, file);
              }}
            />
          </>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="mt-3 w-full rounded border border-slate-200 bg-black"
              data-testid="camera-preview"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={capture}
                className="flex-1 rounded bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                {t("camera.capture")}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {t("camera.cancel")}
              </button>
            </div>
          </>
        )}
        {error && (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 block text-xs text-slate-500 hover:text-slate-800"
          >
            {t("camera.cancel")}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AttachmentMenu({ onFileSelected, onCameraCapture }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const photosInputRef = useRef(null);
  const filesInputRef = useRef(null);
  const firstItemRef = useRef(null);

  useLayoutEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointerDown(event) {
      if (
        !menuRef.current?.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  function choose(kind) {
    setOpen(false);
    if (kind === "camera") {
      setCameraOpen(true);
    } else if (kind === "photos") {
      photosInputRef.current?.click();
    } else {
      filesInputRef.current?.click();
    }
  }

  function handleCapture(result, fallbackFile) {
    setCameraOpen(false);
    if (fallbackFile) {
      onFileSelected(fallbackFile);
    } else if (result) {
      onCameraCapture(result);
    }
    buttonRef.current?.focus();
  }

  const itemClass =
    "flex w-full items-center rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none";

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen((value) => !value)}
        aria-label={t("attach.plus")}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="attach-plus"
        className="rounded-full border border-slate-300 px-2.5 py-0.5 text-lg leading-6 font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
      >
        +
      </button>
      {open && (
        <div className="relative" data-testid="attach-menu-wrap">
          <div
            ref={menuRef}
            role="menu"
            aria-label={t("attach.menu.aria")}
            data-testid="attach-menu"
            className="absolute z-30 mt-2 w-64 rounded-md border border-slate-200 bg-white p-1 shadow-lg"
          >
            <button
              ref={firstItemRef}
              type="button"
              role="menuitem"
              onClick={() => choose("camera")}
              className={itemClass}
            >
              📷 {t("attach.menu.camera")}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => choose("photos")}
              className={itemClass}
            >
              🖼️ {t("attach.menu.photos")}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => choose("files")}
              className={itemClass}
            >
              📁 {t("attach.menu.files")}
            </button>
          </div>
        </div>
      )}
      <input
        ref={photosInputRef}
        id="photo-input"
        data-testid="photo-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          setOpen(false);
          if (file) onFileSelected(file);
        }}
      />
      <input
        ref={filesInputRef}
        id="media-input"
        data-testid="media-input"
        type="file"
        accept="image/png,image/jpeg,audio/*,video/*,.pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          setOpen(false);
          if (file) onFileSelected(file);
        }}
      />
      {cameraOpen && (
        <CameraCapture onCapture={handleCapture} onClose={() => setCameraOpen(false)} />
      )}
    </>
  );
}
