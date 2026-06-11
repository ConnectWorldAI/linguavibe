import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const root = join(__dirname, "..");

describe("PiP (Picture-in-Picture) Feature", () => {
  it("pip-context.tsx exports PipProvider and usePip", () => {
    const content = readFileSync(join(root, "lib/pip-context.tsx"), "utf-8");
    expect(content).toContain("export function PipProvider");
    expect(content).toContain("export function usePip");
    expect(content).toContain("PipOverlay");
    expect(content).toContain("PanResponder");
    expect(content).toContain("minimizeCall");
    expect(content).toContain("maximizeCall");
    expect(content).toContain("endPipCall");
  });

  it("root layout wraps app with PipProvider", () => {
    const content = readFileSync(join(root, "app/_layout.tsx"), "utf-8");
    expect(content).toContain("import { PipProvider }");
    expect(content).toContain("<PipProvider>");
    expect(content).toContain("</PipProvider>");
  });

  it("video-call screen has minimize button with PiP", () => {
    const content = readFileSync(join(root, "app/video-call.tsx"), "utf-8");
    expect(content).toContain("import { usePip }");
    expect(content).toContain("minimizeCall");
    expect(content).toContain("minimizeBtn");
    expect(content).toContain("chevron-down");
  });

  it("voice-call screen has minimize button with PiP", () => {
    const content = readFileSync(join(root, "app/voice-call.tsx"), "utf-8");
    expect(content).toContain("import { usePip }");
    expect(content).toContain("minimizeCall");
    expect(content).toContain("minimizeBtn");
    expect(content).toContain("chevron-down");
  });

  it("PiP overlay has draggable behavior and controls", () => {
    const content = readFileSync(join(root, "lib/pip-context.tsx"), "utf-8");
    // Draggable
    expect(content).toContain("panResponder");
    expect(content).toContain("onPanResponderMove");
    // Snap to edge
    expect(content).toContain("snapX");
    // Controls
    expect(content).toContain("endPipCall");
    expect(content).toContain("toggleMute");
    expect(content).toContain("maximizeCall");
    // Compact and expanded views
    expect(content).toContain("pipCompact");
    expect(content).toContain("pipExpanded");
    // Live indicator
    expect(content).toContain("LIVE");
    // Translation indicator
    expect(content).toContain("Live translation active");
  });
});
