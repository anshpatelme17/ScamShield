import { useEffect, useRef, useState } from "react";
import { LANGUAGES } from "../i18n/translations";
import { useLanguage } from "../i18n/LanguageContext";

export default function LanguageSelect() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(lang);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointer, true);
    return () => document.removeEventListener("pointerdown", handlePointer, true);
  }, [open]);

  useEffect(() => {
    if (open) {
      setHighlight(lang);
    }
  }, [open, lang]);

  const moveHighlight = (delta) => {
    const index = LANGUAGES.findIndex((l) => l.code === highlight);
    const next = (index + delta + LANGUAGES.length) % LANGUAGES.length;
    setHighlight(LANGUAGES[next].code);
  };

  function handleButtonKeys(event) {
    if (!open) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHighlight(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setHighlight(LANGUAGES[0].code);
    } else if (event.key === "End") {
      event.preventDefault();
      setHighlight(LANGUAGES[LANGUAGES.length - 1].code);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setLang(highlight);
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "Escape") {
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  const current = LANGUAGES.find((l) => l.code === lang);
  const listId = "language-listbox";

  return (
    <div
      ref={rootRef}
      className="relative"
      id="language-select-root"
      onKeyUp={handleButtonKeys}
    >
      <button
        ref={buttonRef}
        type="button"
        id="language-select-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `language-option-${highlight}` : undefined}
        aria-label={t("ui.language")}
        className="flex max-w-56 cursor-pointer items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-100 focus:border-slate-500 focus:outline-none"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">🌐</span>
        <span>{current?.label ?? lang}</span>
        <span aria-hidden="true" className="text-xs text-slate-400">
          ▾
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("ui.language")}
          dir="ltr"
          aria-activedescendant={`language-option-${highlight}`}
          className="absolute right-0 top-full z-30 mt-1 max-h-72 w-64 overflow-y-auto rounded-md border border-slate-300 bg-white py-1 text-sm shadow-lg focus:outline-none"
        >
          {LANGUAGES.map((language) => {
            const active = language.code === highlight;
            const selected = language.code === lang;
            return (
              <li
                key={language.code}
                id={`language-option-${language.code}`}
                role="option"
                aria-selected={selected}
                onClick={(event) => {
                  setLang(language.code);
                  setOpen(false);
                  buttonRef.current?.focus();
                  event.preventDefault();
                  return true;
                }}
                className={`flex cursor-pointer items-center justify-between px-3 py-1.5 ${
                  active ? "bg-slate-100" : "hover:bg-slate-100"
                } ${selected ? "font-semibold text-slate-900" : ""}`}
                onMouseEnter={() => setHighlight(language.code)}
              >
                <span>{language.label}</span>
                {selected && (
                  <span aria-hidden="true" className="text-xs text-emerald-700">
                    ✓
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
