import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App, { Dashboard } from "../App";
import { LanguageProvider } from "../i18n/LanguageContext";
import { resolveLanguage, translate } from "../i18n/LanguageContext";
import { LANGUAGES, translations } from "../i18n/translations";
import { resolveFindingFields } from "../i18n/findings";
import payloads from "./fixtures";

const fetchPayload = (payload) => ({
  ok: true,
  status: 200,
  json: async () => payload,
});

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, "scrollTo").mockReturnValue();
});

async function openLanguageMenu(user) {
  await user.click(document.getElementById("language-select-button"));
  return screen.getByRole("listbox");
}

async function selectLanguage(user, matcher) {
  await user.click(document.getElementById("language-select-button"));
  await user.click(screen.getByRole("option", { name: matcher }));
  await waitFor(() => {
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
}

describe("i18n pure helpers", () => {
  it("falls back to English for an unknown saved language", () => {
    expect(resolveLanguage("klingon")).toBe("en");
    expect(resolveLanguage(null)).toBe("en");
    expect(resolveLanguage("hi")).toBe("hi");
  });

  it("interpolates parameters into translations", () => {
    expect(translate("hi", "input.counter", { count: 7 })).toBe("7/10000 अक्षर।");
    expect(translate("en", "input.counter", { count: 0 })).toBe("0/10000 characters.");
    expect(translate("en", "nonexistent.key")).toBe("nonexistent.key");
  });

  it("defines all 16 languages with the required flags", () => {
    expect(LANGUAGES).toHaveLength(16);
    for (const language of LANGUAGES) {
      expect(typeof language.label).toBe("string");
      expect(language.label.length).toBeGreaterThan(0);
      expect(["ltr", "rtl"]).toContain(language.dir);
      expect(typeof language.dateLocale).toBe("string");
    }
    expect(LANGUAGES.filter((x) => x.dir === "rtl").map((x) => x.code).sort()).toEqual([
      "ar",
      "ur",
    ]);
  });

  it("includes Odia in the language list", () => {
    const odia = LANGUAGES.find((x) => x.code === "or");
    expect(odia).toBeDefined();
    expect(odia.label).toContain("ଓଡ଼ିଆ");
    expect(odia.dir).toBe("ltr");
  });
});

describe("i18n language selection UI", () => {
  it("defaults to English", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "ScamShield AI 2.0" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste a suspicious SMS/)).toBeInTheDocument();
  });

  it("offers all 16 languages in the dropdown", async () => {
    const user = userEvent.setup();
    render(<App />);
    const listbox = await openLanguageMenu(user);
    expect(listbox).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(16);
    const labels = screen.getAllByRole("option").map((option) => option.textContent);
    expect(labels.some((text) => text.includes("हिन्दी"))).toBe(true);
    expect(labels.some((text) => text.includes("ଓଡ଼ିଆ"))).toBe(true);
    expect(labels.some((text) => text.includes("المعربية") || text.includes("العربية"))).toBe(true);
    expect(labels.some((text) => text.includes("English"))).toBe(true);
  });

  it("translates the header, tagline, input label and history heading after selecting Hindi", async () => {
    const user = userEvent.setup();
    render(<App />);
    await selectLanguage(user, /हिन्दी/);
    expect(
      await screen.findByText("केवल घोटाला पकड़ें नहीं, सबूत की जांच करें।"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/चिपकाएँ/)).toBeInTheDocument();
  });

  it("switches the results section headings to Bengali", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(fetchPayload(payloads.scam_url)),
    );
    render(<App />);
    await user.type(screen.getByRole("textbox"), "You won a lottery, pay the fee now");
    await user.click(screen.getByRole("button", { name: /analyze/i }));
    await screen.findAllByText("SUSPICIOUS");
    expect(screen.getByText("Evidence findings")).toBeInTheDocument();
    await selectLanguage(user, /বাংলা/);
    expect(await screen.findByText("সাক্ষ্যের ফলাফল")).toBeInTheDocument();
  });

  it("keeps the finding id stable across languages", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(fetchPayload(payloads.scam_url)),
    );
    render(<App />);
    await user.type(screen.getByRole("textbox"), "You won a lottery, pay the fee now");
    await user.click(screen.getByRole("button", { name: /analyze/i }));
    await screen.findAllByText("SUSPICIOUS");
    await selectLanguage(user, /বাংলা/);
    expect(await screen.findByText("সাক্ষ্যের ফলাফল")).toBeInTheDocument();
    expect(screen.getByText("F-001")).toBeInTheDocument();
  });

  it("persists the language choice to localStorage", async () => {
    const user = userEvent.setup();
    render(<App />);
    await selectLanguage(user, /ಕನ್ನಡ/);
    expect(localStorage.getItem("scamshield.language")).toBe("kn");
  });

  it("restores the persisted language on a fresh render", async () => {
    localStorage.setItem("scamshield.language", "fr");
    render(<App />);
    expect(await screen.findByText(/Ne vous contentez pas/)).toBeInTheDocument();
  });

  it("falls back to English when the persisted language is invalid", () => {
    localStorage.setItem("scamshield.language", "xx-invalid");
    render(<App />);
    expect(screen.getByText(/Investigate the Evidence/)).toBeInTheDocument();
  });

  it("sets the document direction for RTL languages and back to LTR", async () => {
    const user = userEvent.setup();
    render(<App />);
    await selectLanguage(user, /العربية/);
    await waitFor(() => {
      expect(screen.getByRole("main")).toHaveAttribute("dir", "rtl");
    });
    await selectLanguage(user, /English/);
    await waitFor(() => {
      expect(screen.getByRole("main")).toHaveAttribute("dir", "ltr");
    });
  });

  it("keeps user input and results when switching languages", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(fetchPayload(payloads.scam_url)),
    );
    render(<App />);
    const textbox = screen.getByRole("textbox");
    await user.type(textbox, "You won a lottery, pay the fee now");
    await user.click(screen.getByRole("button", { name: /analyze/i }));
    await screen.findAllByText("SUSPICIOUS");
    await selectLanguage(user, /Português/);
    expect(screen.getByRole("textbox")).toHaveValue("You won a lottery, pay the fee now");
    expect(screen.getAllByText("SUSPEITO").length).toBeGreaterThanOrEqual(2);
  });

  it("marks Urdu as RTL", async () => {
    const user = userEvent.setup();
    render(<App />);
    await selectLanguage(user, /اردو/);
    await waitFor(() => {
      expect(screen.getByRole("main")).toHaveAttribute("dir", "rtl");
    });
  });
});

describe("i18n provider behaviour", () => {
  it("renders the English baseline through the provider without stored preferences", () => {
    render(
      <LanguageProvider>
        <Dashboard />
      </LanguageProvider>,
    );
    expect(screen.getByText(/Investigate the Evidence/)).toBeInTheDocument();
  });
});

describe("i18n dynamic finding catalog policy", () => {
  const phoneFinding = payloads.phone_valid.case_file.findings[0];

  it("resolves rule text in a full-catalog language (Hindi)", () => {
    const resolved = resolveFindingFields(phoneFinding, "hi");
    expect(resolved.title.text).toBe("भारतीय मोबाइल नंबर मान्य (केवल प्रारूप)");
    expect(resolved.title.fallback).toBe(false);
    expect(resolved.limitation.fallback).toBe(false);
    expect(resolved.action.fallback).toBe(false);
  });

  it("falls back to English rule text with a marker in a statics-only language (Telugu)", () => {
    const resolved = resolveFindingFields(phoneFinding, "te");
    expect(resolved.title.text).toBe(
      "Indian mobile number validated (format only)",
    );
    expect(resolved.title.fallback).toBe("i18n.fallbackEnglish");
    expect(resolved.limitation.fallback).toBe("i18n.fallbackEnglish");
  });

  it("full dynamic catalogs exist only for en, hi and bn", () => {
    for (const [code, dict] of Object.entries(translations)) {
      const ruleKeys = Object.keys(dict).filter((key) => key.startsWith("rule."));
      if (code === "en" || code === "hi" || code === "bn") {
        expect(ruleKeys.length).toBeGreaterThan(0);
      } else {
        expect(ruleKeys).toHaveLength(0);
      }
    }
  });
});
