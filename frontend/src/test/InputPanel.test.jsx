import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import InputPanel, { detectInputType, formatFileSize } from "../components/InputPanel";
import { LanguageProvider } from "../i18n/LanguageContext";

const pngFile = (name = "qr.png") =>
  new File([new Uint8Array([137, 80, 78, 71])], name, { type: "image/png" });

const jpegFile = (name = "shot.jpg") =>
  new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], name, { type: "image/jpeg" });

function renderPanel(props = {}) {
  render(
    <LanguageProvider>
      <InputPanel {...props} />
    </LanguageProvider>,
  );
  return props;
}

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

describe("formatFileSize", () => {
  it("formats bytes compactly", () => {
    expect(formatFileSize(4)).toBe("4 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(2_500_000)).toBe("2.5 MB");
  });
});

describe("InputPanel", () => {
  const noop = () => {};

  function setup(props = {}) {
    const onSubmit = vi.fn();
    renderPanel({ onSubmit, loading: false, ...props });
    return { onSubmit };
  }

  it("rejects an image over the 2 MB limit", async () => {
    setup();
    const bigFile = new File(["x".repeat(2_000_001)], "big.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("media-input"), { target: { files: [bigFile] } });
    expect(await screen.findByText(/larger than the 2 MB limit/i)).toBeInTheDocument();
  });

  it("rejects unsupported file types such as audio or video", async () => {
    setup();
    const audioFile = new File(["id3"], "voice.mp3", { type: "audio/mpeg" });
    fireEvent.change(screen.getByTestId("media-input"), { target: { files: [audioFile] } });
    expect(await screen.findByText(/file type.*not supported/i)).toBeInTheDocument();
  });

  it("rejects files that are not actually PNG or JPEG", async () => {
    setup();
    const fakeFile = new File(["not-a-real-image"], "fake.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [fakeFile] } });
    expect(await screen.findByText(/not a valid PNG or JPEG image/i)).toBeInTheDocument();
  });

  it("rejects type/byte mismatches such as a text file named .png", async () => {
    setup();
    const mislabeled = new File([new Uint8Array([137, 80, 78, 71])], "viewer.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(screen.getByTestId("media-input"), { target: { files: [mislabeled] } });
    expect(await screen.findByText(/file type.*not supported/i)).toBeInTheDocument();
  });

  it("accepts JPEG with correct magic bytes and shows the chip metadata", async () => {
    const user = userEvent.setup();
    setup();
    await user.upload(screen.getByTestId("photo-input"), jpegFile());
    expect(await screen.findByText(/shot\.jpg/)).toBeInTheDocument();
    expect(screen.getByText(/image\/jpeg/)).toBeInTheDocument();
  });

  it("has no tabs; submit starts disabled with title, dropzone and plus button visible", () => {
    setup();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByText("Universal input")).toBeInTheDocument();
    expect(screen.getByTestId("image-dropzone")).toBeInTheDocument();
    expect(screen.getByTestId("attach-plus")).toHaveAttribute("aria-label", "Add attachment");
    expect(screen.getByRole("button", { name: /analyze/i })).toBeDisabled();
  });

  it("enables the submit button once text is entered and shows the detected type", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByRole("textbox"), "Click http://prize-lottery.tk/claim to win");
    const button = screen.getByRole("button", { name: /analyze/i });
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(screen.getByText(/detected input.*link/i)).toBeInTheDocument();
  });

  it("shows the phone-number detected chip for phone input", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByRole("textbox"), "+91 98765-43210");
    expect(screen.getByText(/detected input.*phone number/i)).toBeInTheDocument();
  });

  it("shows the character counter", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByRole("textbox"), "hello");
    expect(screen.getByText(/5\/10000 characters/)).toBeInTheDocument();
  });

  it("submits the typed message through onSubmit", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.type(screen.getByRole("textbox"), "urgent KYC notice");
    await user.click(screen.getByRole("button", { name: /analyze/i }));
    expect(onSubmit).toHaveBeenCalledWith({ text: "urgent KYC notice", imageB64: null });
  });

  it("submits the image as a data URL alongside pasted text without tabs", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.type(screen.getByRole("textbox"), "is this QR safe?");
    await user.upload(screen.getByTestId("photo-input"), pngFile());
    await screen.findByText(/qr\.png/);

    await user.click(screen.getByRole("button", { name: /analyze/i }));
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.text).toBe("is this QR safe?");
    expect(arg.imageB64).toMatch(/^data:image\/png;base64,/);
  });

  it("shows size, type and remove action in the attachment chip", async () => {
    const user = userEvent.setup();
    setup();
    await user.upload(screen.getByTestId("photo-input"), jpegFile("evidence.jpg"));
    const chip = await screen.findByTestId("attachment-chip");
    expect(chip).toHaveTextContent("evidence.jpg");
    expect(chip).toHaveTextContent("image/jpeg");
    expect(chip).toHaveTextContent("4 B");

    await user.click(screen.getByRole("button", { name: /remove image/i }));
    expect(screen.queryByTestId("attachment-chip")).not.toBeInTheDocument();
    expect(screen.getByTestId("image-dropzone")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /analyze/i })).toBeDisabled();
  });

  it("notifies when a second attachment replaces the first", async () => {
    const user = userEvent.setup();
    setup();
    await user.upload(screen.getByTestId("photo-input"), pngFile());
    await screen.findByText(/qr\.png/);
    await user.upload(screen.getByTestId("media-input"), jpegFile("second.jpg"));

    expect(await screen.findByText(/second\.jpg/)).toBeInTheDocument();
    expect(
      screen.getByText(/Previous attachment replaced: one file per analysis\./i),
    ).toBeInTheDocument();
    expect(screen.queryByText("qr.png")).not.toBeInTheDocument();
  });

  it("accepts files through the drag-and-drop zone", async () => {
    setup();
    const dropzone = screen.getByTestId("image-dropzone");
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [pngFile("dropped.png")] },
    });
    expect(await screen.findByText(/dropped\.png/)).toBeInTheDocument();
  });

  it("clear button resets text and image", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByRole("textbox"), "hello");
    await user.upload(screen.getByTestId("photo-input"), pngFile());
    await screen.findByText(/qr\.png/);
    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(screen.getByRole("button", { name: /analyze/i })).toBeDisabled();
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.queryByTestId("attachment-chip")).not.toBeInTheDocument();
  });

  it("shows the busy state while loading", () => {
    renderPanel({ onSubmit: noop, loading: true });
    expect(screen.getByRole("button", { name: /analyzing/i })).toBeDisabled();
  });
});
