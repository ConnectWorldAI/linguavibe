import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

function readFile(path: string) {
  return readFileSync(join(ROOT, path), "utf-8");
}

describe("AI Agent Floating Bubble", () => {
  it("agent-context.tsx exists and exports AgentProvider", () => {
    const content = readFile("lib/agent-context.tsx");
    expect(content).toContain("export function AgentProvider");
    expect(content).toContain("export function useAgent");
  });

  it("has WaveformBars component with gold, blue, white colors", () => {
    const content = readFile("lib/agent-context.tsx");
    expect(content).toContain("WaveformBars");
    expect(content).toContain("Colors.gold");
    expect(content).toContain("Colors.secondary");
    expect(content).toContain("#FFFFFF");
    expect(content).toContain("BAR_COLORS");
  });

  it("has action mapping for navigation commands", () => {
    const content = readFile("lib/agent-context.tsx");
    expect(content).toContain("ACTION_MAP");
    expect(content).toContain("go to settings");
    expect(content).toContain("open messages");
    expect(content).toContain("find jobs");
    expect(content).toContain("schedule class");
    expect(content).toContain("start recording");
    expect(content).toContain("add reverb");
  });

  it("has collapsed bubble state with waveform", () => {
    const content = readFile("lib/agent-context.tsx");
    expect(content).toContain("bubbleContainer");
    expect(content).toContain("bubbleGlowRing");
    expect(content).toContain("modeDot");
  });

  it("has expanded chat panel with input area", () => {
    const content = readFile("lib/agent-context.tsx");
    expect(content).toContain("expandedOverlay");
    expect(content).toContain("TextInput");
    expect(content).toContain("micButton");
    expect(content).toContain("sendButton");
    expect(content).toContain("quickActions");
  });

  it("has draggable PanResponder for the bubble", () => {
    const content = readFile("lib/agent-context.tsx");
    expect(content).toContain("PanResponder.create");
    expect(content).toContain("onPanResponderMove");
    expect(content).toContain("onPanResponderRelease");
  });

  it("supports multiple agent modes (idle, listening, thinking, speaking)", () => {
    const content = readFile("lib/agent-context.tsx");
    expect(content).toContain('"idle"');
    expect(content).toContain('"listening"');
    expect(content).toContain('"thinking"');
    expect(content).toContain('"speaking"');
  });

  it("is wired into root layout", () => {
    const layout = readFile("app/_layout.tsx");
    expect(layout).toContain('import { AgentProvider } from "@/lib/agent-context"');
    expect(layout).toContain("<AgentProvider>");
    expect(layout).toContain("</AgentProvider>");
  });

  it("has fuzzy matching for commands", () => {
    const content = readFile("lib/agent-context.tsx");
    expect(content).toContain("findBestAction");
    expect(content).toContain("normalized.includes");
  });
});
