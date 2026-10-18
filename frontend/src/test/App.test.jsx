import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "../App";
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

describe("App integration", () => {
  it("renders verdict, findings, explanation and case actions after analysis", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(fetchPayload(payloads.scam_url))
      .mockResolvedValueOnce(fetchPayload(payloads.scam_url));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    await user.type(screen.getByRole("textbox"), "You won a lottery, pay the fee now");
    await user.click(screen.getByRole("button", { name: /analyze/i }));

    await waitFor(() =>
      expect(screen.getAllByText("SUSPICIOUS").length).toBeGreaterThanOrEqual(2),
    );
    expect(screen.getByText("Evidence findings")).toBeInTheDocument();
    expect(screen.getByText("Recommended next steps")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy case json/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download case json/i })).toBeInTheDocument();
    expect(screen.getByText(/cybercrime\.gov\.in/)).toBeInTheDocument();
  });

  it("shows a busy skeleton and then the result", async () => {
    const user = userEvent.setup();
    let resolveFetch;
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = () => resolve(fetchPayload(payloads.benign));
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    await user.type(screen.getByRole("textbox"), "meeting at 6");
    await user.click(screen.getByRole("button", { name: /analyze/i }));
    expect(await screen.findByText(/Analyzing locally/i)).toBeInTheDocument();

    resolveFetch();
    expect(await screen.findAllByText("No strong warning signs found")).toHaveLength(1);
  });

  it("surfaces API errors to the user", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: "input exceeds the maximum length" }),
      }),
    );

    render(<App />);
    await user.type(screen.getByRole("textbox"), "too long input");
    await user.click(screen.getByRole("button", { name: /analyze/i }));

    expect(
      await screen.findByText("input exceeds the maximum length"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Evidence findings")).not.toBeInTheDocument();
  });

  it("restores a saved case from history after reload", async () => {
    const user = userEvent.setup();
    const { addHistoryEntry, buildHistoryEntry } = await import("../lib/history");
    addHistoryEntry(buildHistoryEntry(payloads.scam_url));

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    const chip = await screen.findByText(/Pasted message/);
    await user.click(chip);

    await waitFor(() =>
      expect(screen.getAllByText(payloads.scam_url.explanation.headline).length).toBeGreaterThan(0),
    );
    expect(screen.getAllByText("SUSPICIOUS").length).toBeGreaterThanOrEqual(2);
    expect(fetchMock.mock.calls).toHaveLength(0);
  });
  it("removes a deleted case from the history panel", async () => {
    const user = userEvent.setup();
    const { addHistoryEntry, buildHistoryEntry } = await import("../lib/history");
    addHistoryEntry(buildHistoryEntry(payloads.scam_url));

    vi.stubGlobal("fetch", vi.fn());
    render(<App />);
    await screen.findByText(/Pasted message/);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() =>
      expect(screen.getByText(/stored only in this browser/i)).toBeInTheDocument(),
    );
  });
});
