import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import VerdictBadge from "../components/VerdictBadge";
import FindingCard from "../components/FindingCard";
import FindingsList from "../components/FindingsList";
import VerdictSummary from "../components/VerdictSummary";
import ExplanationPanel from "../components/ExplanationPanel";
import CaseFileActions from "../components/CaseFileActions";
import payloads from "./fixtures";

const scam = payloads.scam_url;

describe("VerdictBadge", () => {
  it.each([
    ["highly_suspicious", "HIGHLY SUSPICIOUS"],
    ["suspicious", "SUSPICIOUS"],
    ["unable_to_determine", "UNABLE TO DETERMINE"],
    ["no_strong_warning_signs_found", "NO STRONG WARNING SIGNS FOUND"],
  ])("renders the label for %s", (verdict, label) => {
    render(<VerdictBadge verdict={verdict} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("marks suspicious verdicts with the amber style", () => {
    const { container } = render(<VerdictBadge verdict="suspicious" />);
    expect(container.firstChild).toHaveClass("bg-amber-500");
  });

  it("falls back to a neutral style for unknown verdicts", () => {
    const { container } = render(<VerdictBadge verdict="mystery" />);
    expect(container.firstChild).toHaveClass("bg-slate-400");
  });
});

describe("FindingCard", () => {
  const finding = scam.case_file.findings[0];

  it("renders title, id, status and metadata", () => {
    render(<FindingCard finding={finding} />);
    expect(screen.getByText(finding.title)).toBeInTheDocument();
    expect(screen.getByText(finding.id)).toBeInTheDocument();
    expect(screen.getByText("rule match")).toBeInTheDocument();
    expect(screen.getByText("local rule")).toBeInTheDocument();
    expect(screen.getByText(finding.rule_id)).toBeInTheDocument();
  });

  it("lists quoted evidence and the limitation note", () => {
    render(<FindingCard finding={finding} />);
    expect(
      screen.getByText(`“${finding.evidence[0]}”`),
    ).toBeInTheDocument();
    expect(screen.getByText(/Some TLDs are disproportionately used/)).toBeInTheDocument();
  });

  it("hides the evidence block when a finding has none", () => {
    render(
      <FindingCard finding={{ ...finding, evidence: [] }} />,
    );
    expect(screen.queryByText("Supporting evidence")).not.toBeInTheDocument();
  });
});

describe("FindingsList", () => {
  it("renders one card per finding", () => {
    render(<FindingsList findings={scam.case_file.findings} />);
    expect(screen.getByText("Evidence findings")).toBeInTheDocument();
    for (const finding of scam.case_file.findings) {
      expect(screen.getByText(finding.title)).toBeInTheDocument();
    }
  });

  it("shows the empty-state copy for a clean case", () => {
    render(<FindingsList findings={[]} />);
    expect(screen.getByText(/not proof that the message is safe/i)).toBeInTheDocument();
    expect(screen.queryByText("F-001")).not.toBeInTheDocument();
  });
});

describe("VerdictSummary", () => {
  it("shows badge, headline, summary, reasons and case id", () => {
    const { case_file } = scam;
    render(<VerdictSummary caseFile={case_file} explanation={scam.explanation} />);
    expect(screen.getByText("SUSPICIOUS")).toBeInTheDocument();
    expect(screen.getByText(scam.explanation.headline)).toBeInTheDocument();
    expect(screen.getByText(scam.explanation.summary)).toBeInTheDocument();
    for (const reason of case_file.verdict_reasons) {
      expect(screen.getByText(reason)).toBeInTheDocument();
    }
    expect(screen.getByText(new RegExp(case_file.case_id.slice(0, 12)))).toBeInTheDocument();
  });
});

describe("ExplanationPanel", () => {
  it("renders unverified items, actions and reporting advice", () => {
    render(<ExplanationPanel explanation={scam.explanation} />);
    expect(screen.getByText("What could not be verified")).toBeInTheDocument();
    expect(
      screen.getByText(scam.explanation.unverified[0]),
    ).toBeInTheDocument();
    expect(screen.getByText("Recommended next steps")).toBeInTheDocument();
    for (const action of scam.explanation.actions) {
      expect(screen.getByText(action)).toBeInTheDocument();
    }
    expect(screen.getByText(/cybercrime\.gov\.in/)).toBeInTheDocument();
  });

  it("omits the unverified section when nothing is unverified", () => {
    render(<ExplanationPanel explanation={payloads.benign.explanation} />);
    expect(screen.queryByText("What could not be verified")).not.toBeInTheDocument();
  });
});

describe("CaseFileActions", () => {
  it("copies the full case JSON to the clipboard", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue() },
      configurable: true,
    });
    try {
      render(<CaseFileActions payload={scam} />);
      await user.click(screen.getByRole("button", { name: /copy case json/i }));
      const written = navigator.clipboard.writeText.mock.calls[0][0];
      expect(JSON.parse(written)).toEqual(scam);
    } finally {
      delete navigator.clipboard;
    }
  });

  it("downloads the case as an anchor click", async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    const realCreate = document.createElement.bind(document);
    const revoke = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:case"),
      revokeObjectURL: revoke,
    });
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = realCreate(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: click });
      }
      return el;
    });

    render(<CaseFileActions payload={scam} />);
    await user.click(screen.getByRole("button", { name: /download case json/i }));

    expect(click).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith("blob:case");
  });
});
