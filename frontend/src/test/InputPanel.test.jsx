import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import InputPanel, { detectInputType } from "../components/InputPanel";

const pngFile = (name = "qr.png") =>
  new File([new Uint8Array([137, 80, 78, 71])], name, { type: "image/png" });

const jpegFile = (name = "shot.jpg") =>
  new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], name, { type: "image/jpeg" });

describe("detectInputType", () => {
  it("classifies pasted URLs", () => {
    expect(detectInputType("check http://example.com now")).toBe("url");
    expect(detectInputType("www.bank.example")).toBe("url");
  });

  it("classifies phone-like input", () => {
    expect(detectInputType("+91 98765-43210")).toBe("phone_number");
    expect(detectInputType("98765 43210")).toBe("phone_number");
  });

  it("classifies plain text", () => {
    expect(detectInputType("urgent KYC notice")).toBe("text");
    expect(detectInputType("1930")).toBe("text");
  });
});

describe("InputPanel", () => {
  const noop = () => {};

  it("rejects an image over the 2 MB limit", () => {
    render(<InputPanel onSubmit={noop} loading={false} />);
    const bigFile = new File(["x".repeat(2_000_001)], "big.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("image-input"), { target: { files: [bigFile] } });
    expect(screen.getByText(/larger than the 2 MB limit/i)).toBeInTheDocument();
  });

  it("rejects unsupported file types such as audio or video", async () => {
    render(<InputPanel onSubmit={noop} loading={false} />);
    const audioFile = new File(["id3"], "voice.mp3", { type: "audio/mpeg" });
    fireEvent.change(screen.getByTestId("image-input"), { target: { files: [audioFile] } });
    expect(await screen.findByText(/file type.*not supported/i)).toBeInTheDocument();
  });

  it("rejects files that are not actually PNG or JPEG", async () => {
    render(<InputPanel onSubmit={noop} loading={false} />);
    const fakeFile = new File(["not-a-real-image"], "fake.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("image-input"), { target: { files: [fakeFile] } });
    expect(await screen.findByText(/not a valid PNG or JPEG image/i)).toBeInTheDocument();
  });

  it("accepts JPEG screenshots with the correct magic bytes", async () => {
    render(<InputPanel onSubmit={noop} loading={false} />);
    await userEvent.setup().upload(screen.getByTestId("image-input"), jpegFile());
    expect(await screen.findByAltText("Attached screenshot to analyze")).toBeInTheDocument();
    expect(screen.queryByText(/not a valid/i)).not.toBeInTheDocument();
  });

  it("has no tabs; submit starts disabled with title and dropzone visible", () => {
    render(<InputPanel onSubmit={noop} loading={false} />);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByText("Universal input")).toBeInTheDocument();
    expect(screen.getByText(/drop a PNG\/JPEG screenshot here, or use the button below/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /analyze/i })).toBeDisabled();
  });

  it("enables the submit button once text is entered and shows the detected type", async () => {
    const user = userEvent.setup();
    render(<InputPanel onSubmit={noop} loading={false} />);
    await user.type(screen.getByRole("textbox"), "Click http://prize-lottery.tk/claim to win");
    const button = screen.getByRole("button", { name: /analyze/i });
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(screen.getByText(/detected input.*link/i)).toBeInTheDocument();
  });

  it("shows the phone-number detected chip for phone input", async () => {
    const user = userEvent.setup();
    render(<InputPanel onSubmit={noop} loading={false} />);
    await user.type(screen.getByRole("textbox"), "+91 98765-43210");
    expect(screen.getByText(/detected input.*phone number/i)).toBeInTheDocument();
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

  it("shows a preview and remove action after a valid image is chosen", async () => {
    const user = userEvent.setup();
    render(<InputPanel onSubmit={noop} loading={false} />);
    await user.upload(screen.getByTestId("image-input"), pngFile());
    expect(await screen.findByAltText("Attached screenshot to analyze")).toBeInTheDocument();
    expect(screen.getByText("qr.png")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remove image/i }));
    expect(
      screen.getByText(/drop a PNG\/JPEG screenshot here, or use the button below/i),
    ).toBeInTheDocument();
  });

  it("submits the image as a data URL alongside pasted text without tabs", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<InputPanel onSubmit={onSubmit} loading={false} />);
    await user.type(screen.getByRole("textbox"), "is this QR safe?");
    await user.upload(screen.getByTestId("image-input"), pngFile());
    await screen.findByAltText("Attached screenshot to analyze");

    await user.click(screen.getByRole("button", { name: /analyze/i }));
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.text).toBe("is this QR safe?");
    expect(arg.imageB64).toMatch(/^data:image\/png;base64,/);
  });

  it("clear button resets text and image", async () => {
    const user = userEvent.setup();
    render(<InputPanel onSubmit={noop} loading={false} />);
    await user.type(screen.getByRole("textbox"), "hello");
    await user.upload(screen.getByTestId("image-input"), pngFile());
    await screen.findByAltText("Attached screenshot to analyze");
    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(screen.getByRole("button", { name: /analyze/i })).toBeDisabled();
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("shows the busy state while loading", () => {
    render(<InputPanel onSubmit={noop} loading />);
    expect(screen.getByRole("button", { name: /analyzing/i })).toBeDisabled();
  });
});


