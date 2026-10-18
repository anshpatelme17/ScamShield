import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import InputPanel from "../components/InputPanel";

const pngFile = (name = "qr.png") =>
  new File([new Uint8Array([137, 80, 78, 71])], name, { type: "image/png" });

describe("InputPanel", () => {
  const noop = () => {};

  it("rejects an image over the 2 MB limit", () => {
    render(<InputPanel onSubmit={noop} loading={false} />);
    fireEvent.click(screen.getByRole("tab", { name: /QR screenshot/i }));
    const bigFile = new File(["x".repeat(2_000_001)], "big.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText(/choose image/i), { target: { files: [bigFile] } });
    expect(screen.getByText(/larger than the 2 MB limit/i)).toBeInTheDocument();
  });

  it("starts on the message tab with the submit button disabled", () => {
    render(<InputPanel onSubmit={noop} loading={false} />);
    expect(screen.getByRole("tab", { name: /message or link/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: /QR screenshot/i })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByRole("button", { name: /analyze/i })).toBeDisabled();
  });

  it("enables the submit button once text is entered", async () => {
    const user = userEvent.setup();
    render(<InputPanel onSubmit={noop} loading={false} />);
    await user.type(
      screen.getByRole("textbox"),
      "Click http://prize-lottery.tk/claim to win",
    );
    const button = screen.getByRole("button", { name: /analyze/i });
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("shows the character counter", async () => {
    const user = userEvent.setup();
    render(<InputPanel onSubmit={noop} loading={false} />);
    await user.type(screen.getByRole("textbox"), "hello");
    expect(screen.getByText(/5\/10000 characters/)).toBeInTheDocument();
  });

  it("submits the typed message through onSubmit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<InputPanel onSubmit={onSubmit} loading={false} />);
    await user.type(screen.getByRole("textbox"), "urgent KYC notice");
    await user.click(screen.getByRole("button", { name: /analyze/i }));
    expect(onSubmit).toHaveBeenCalledWith({ text: "urgent KYC notice", imageB64: null });
  });

  it("switches to the QR tab and shows the file picker", async () => {
    const user = userEvent.setup();
    render(<InputPanel onSubmit={noop} loading={false} />);
    await user.click(screen.getByRole("tab", { name: /QR screenshot/i }));
    expect(screen.getByLabelText(/choose image/i)).toBeInTheDocument();
    expect(screen.getByText(/drop a screenshot here/i)).toBeInTheDocument();
  });

  it("shows a preview and remove action after a valid image is chosen", async () => {
    const user = userEvent.setup();
    render(<InputPanel onSubmit={noop} loading={false} />);
    await user.click(screen.getByRole("tab", { name: /QR screenshot/i }));
    await user.upload(screen.getByLabelText(/choose image/i), pngFile());
    expect(await screen.findByAltText("QR screenshot to analyze")).toBeInTheDocument();
    expect(screen.getByText("qr.png")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remove image/i }));
    expect(screen.getByLabelText(/choose image/i)).toBeInTheDocument();
  });

  it("submits the image as a data URL when both tabs are used", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<InputPanel onSubmit={onSubmit} loading={false} />);
    await user.type(screen.getByRole("textbox"), "is this QR safe?");
    await user.click(screen.getByRole("tab", { name: /QR screenshot/i }));
    await user.upload(screen.getByLabelText(/choose image/i), pngFile());
    await screen.findByAltText("QR screenshot to analyze");

    await user.click(screen.getByRole("button", { name: /analyze/i }));
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.text).toBe("is this QR safe?");
    expect(arg.imageB64).toMatch(/^data:image\/png;base64,/);
  });

  it("shows the busy state while loading", () => {
    render(<InputPanel onSubmit={noop} loading />);
    expect(screen.getByRole("button", { name: /analyzing/i })).toBeDisabled();
  });
});
