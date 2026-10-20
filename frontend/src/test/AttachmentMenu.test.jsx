import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AttachmentMenu, { estimateBytesFromDataUrl } from "../components/AttachmentMenu";
import { LanguageProvider } from "../i18n/LanguageContext";

const pngFile = (name = "qr.png") =>
  new File([new Uint8Array([137, 80, 78, 71])], name, { type: "image/png" });

const renderMenu = (props = {}) =>
  render(
    <LanguageProvider>
      <AttachmentMenu onFileSelected={vi.fn()} onCameraCapture={vi.fn()} {...props} />
    </LanguageProvider>,
  );

afterEach(() => {
  vi.restoreAllMocks();
  delete navigator.mediaDevices;
});

describe("estimateBytesFromDataUrl", () => {
  it("decodes base64 payload sizes", () => {
    expect(estimateBytesFromDataUrl("data:image/png;base64,iVBORw==")).toBe(4);
    expect(estimateBytesFromDataUrl("data:image/png;base64,iVBORw0KGgo=")).toBe(8);
    expect(estimateBytesFromDataUrl("data:text/plain;base64,")).toBe(0);
  });
});

describe("AttachmentMenu", () => {
  it("opens the menu, shows the three sources and closes on Escape with focus restored", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId("attach-plus"));

    const menu = screen.getByRole("menu", { name: /attachment options/i });
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Camera/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Photos/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Media \/ files/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add attachment/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId("attach-plus")).toHaveFocus();
    expect(screen.getByTestId("attach-plus")).toHaveAttribute("aria-expanded", "false");
  });

  it("closes when the pointer goes down outside the menu", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId("attach-plus"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("routes a photo pick through onFileSelected", async () => {
    const onFileSelected = vi.fn();
    const user = userEvent.setup();
    renderMenu({ onFileSelected });
    await user.click(screen.getByTestId("attach-plus"));
    await user.click(screen.getByRole("menuitem", { name: /Photos/ }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("photo-input"), {
      target: { files: [pngFile()] },
    });
    await waitFor(() => expect(onFileSelected).toHaveBeenCalledTimes(1));
    expect(onFileSelected.mock.calls[0][0].type).toBe("image/png");
  });

  it("rejects audio picked through Media / files at the input panel level", async () => {
    const onFileSelected = vi.fn();
    const user = userEvent.setup();
    renderMenu({ onFileSelected });
    await user.click(screen.getByTestId("attach-plus"));
    await user.click(screen.getByRole("menuitem", { name: /Media \/ files/ }));

    fireEvent.change(screen.getByTestId("media-input"), {
      target: { files: [new File(["id3"], "voice.mp3", { type: "audio/mpeg" })] },
    });
    expect(onFileSelected).toHaveBeenCalledTimes(1);
    expect(onFileSelected.mock.calls[0][0].type).toBe("audio/mpeg");
  });

  it("captures a camera photo into a PNG result and stops the stream", async () => {
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] };
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
      configurable: true,
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/png;base64,iVBORw0KGgo=",
    );
    const onCameraCapture = vi.fn();
    const user = userEvent.setup();
    renderMenu({ onCameraCapture });

    await user.click(screen.getByTestId("attach-plus"));
    await user.click(screen.getByRole("menuitem", { name: /Camera/ }));

    const dialog = await screen.findByTestId("camera-capture");
    await waitFor(() =>
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: "environment" },
        audio: false,
      }),
    );
    await act(async () => {});

    const video = dialog.querySelector("video");
    Object.defineProperty(video, "videoWidth", { value: 640 });
    Object.defineProperty(video, "videoHeight", { value: 480 });

    await user.click(screen.getByRole("button", { name: /Capture photo/i }));
    await waitFor(() => expect(onCameraCapture).toHaveBeenCalledTimes(1));
    const result = onCameraCapture.mock.calls[0][0];
    expect(result.name).toBe("camera-capture.png");
    expect(result.type).toBe("image/png");
    expect(result.size).toBe(8);
    expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
    await waitFor(() => expect(stop).toHaveBeenCalled());
  });

  it("falls back to a photo picker when the camera is unavailable", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: undefined,
      configurable: true,
    });
    const onFileSelected = vi.fn();
    const user = userEvent.setup();
    renderMenu({ onFileSelected });

    await user.click(screen.getByTestId("attach-plus"));
    await user.click(screen.getByRole("menuitem", { name: /Camera/ }));

    const dialog = await screen.findByTestId("camera-capture");
    expect(screen.getByText(/Camera is unavailable or permission was denied/i)).toBeInTheDocument();
    const input = dialog.querySelector("input");
    expect(input).toHaveAttribute("capture", "environment");

    fireEvent.change(input, { target: { files: [pngFile("fallback-shot.png")] } });
    await waitFor(() => expect(onFileSelected).toHaveBeenCalledTimes(1));
    expect(onFileSelected.mock.calls[0][0].name).toBe("fallback-shot.png");
  });
});
