import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import HistoryPanel from "../components/HistoryPanel";
import {
  addHistoryEntry,
  buildHistoryEntry,
  clearHistory,
  loadHistory,
  removeHistoryEntry,
} from "../lib/history";
import payloads from "./fixtures";

const scamHistory = () => buildHistoryEntry(payloads.scam_url);
const benignHistory = () => buildHistoryEntry(payloads.benign);

describe("history lib", () => {
  beforeEach(() => localStorage.clear());

  it("returns an empty list when nothing is stored", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("adds entries newest-first and caps the list at 30", () => {
    let history = [];
    for (let i = 0; i < 35; i += 1) {
      history = addHistoryEntry({ ...scamHistory(), id: `case-${i}` });
    }
    expect(history).toHaveLength(30);
    expect(history[0].id).toBe("case-34");
    expect(history.at(-1).id).toBe("case-5");
    expect(loadHistory()).toHaveLength(30);
  });

  it("moves a re-analyzed case id to the front instead of duplicating it", () => {
    addHistoryEntry(scamHistory());
    addHistoryEntry(benignHistory());
    const history = addHistoryEntry(scamHistory());
    expect(history).toHaveLength(2);
    expect(history[0].id).toBe(scamHistory().id);
    expect(history.at(-1).id).toBe(benignHistory().id);
  });

  it("removes a single entry", () => {
    addHistoryEntry(scamHistory());
    removeHistoryEntry(scamHistory().id);
    expect(loadHistory()).toEqual([]);
  });

  it("clears all entries without throwing when storage is unavailable", () => {
    addHistoryEntry(scamHistory());
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error("quota");
    });
    expect(() => clearHistory()).not.toThrow();
    Storage.prototype.setItem = setItem;
    expect(loadHistory()).toEqual([scamHistory()]);
  });

  it("labels entries by input type key", () => {
    expect(scamHistory().label_key).toBe("history.entry.pasted");
    expect(
      buildHistoryEntry({
        case_file: { ...payloads.scam_url.case_file, input_type: "image" },
      }).label_key,
    ).toBe("history.entry.image");
    expect(
      buildHistoryEntry(
        { case_file: { ...payloads.scam_url.case_file, input_type: "phone_number" } },
      ).label_key,
    ).toBe("history.entry.phone");
  });

  it("survives corrupt storage", () => {
    localStorage.setItem("scamshield.history.v1", "{not json");
    expect(loadHistory()).toEqual([]);
  });
});

describe("HistoryPanel", () => {
  beforeEach(() => localStorage.clear());

  it("shows the empty-state privacy note", () => {
    render(<HistoryPanel entries={[]} onRestore={() => {}} onDelete={() => {}} onClear={() => {}} />);
    expect(screen.getByText(/stored only in this browser/i)).toBeInTheDocument();
  });

  it("renders saved cases with verdict badges and restore/delete controls", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(
      <HistoryPanel
        entries={[scamHistory()]}
        onRestore={onRestore}
        onDelete={() => {}}
        onClear={() => {}}
      />,
    );
    expect(screen.getByText("SUSPICIOUS")).toBeInTheDocument();
    expect(screen.getByText(/Message \/ link/)).toBeInTheDocument();
    await user.click(screen.getByText(/Message \/ link/));
    expect(onRestore).toHaveBeenCalledWith(scamHistory().id);
    expect(screen.getByText(/Delete/)).toBeInTheDocument();
  });

  it("deletes a single case and clears all", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onClear = vi.fn();
    render(
      <HistoryPanel
        entries={[scamHistory(), benignHistory()]}
        onRestore={() => {}}
        onDelete={onDelete}
        onClear={onClear}
      />,
    );
    await user.click(screen.getAllByText(/Delete/)[0]);
    expect(onDelete).toHaveBeenCalledTimes(1);
    await user.click(screen.getByText(/Clear all/));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("collapses and expands the case list", async () => {
    const user = userEvent.setup();
    render(
      <HistoryPanel
        entries={[scamHistory()]}
        onRestore={() => {}}
        onDelete={() => {}}
        onClear={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /Clear all/i })).toBeInTheDocument();
    expect(screen.getByText(/Message \/ link/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Case history/i }));
    expect(screen.queryByText(/Message \/ link/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Case history/i }));
    expect(screen.getByText(/Message \/ link/)).toBeInTheDocument();
  });
});
