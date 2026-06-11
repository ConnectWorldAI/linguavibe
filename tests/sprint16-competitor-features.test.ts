import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "../app");
const hooksDir = path.resolve(__dirname, "../hooks");
const layoutPath = path.join(appDir, "_layout.tsx");

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}
function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// ─── 1. Voice Clone Translation ─────────────────────────────────────────────
describe("Sprint 16: Voice Clone Translation", () => {
  const screenPath = path.join(appDir, "voice-clone-translation.tsx");

  it("screen file exists", () => {
    expect(fileExists(screenPath)).toBe(true);
  });

  it("is registered in root layout", () => {
    const layout = readFile(layoutPath);
    expect(layout).toContain('"voice-clone-translation"');
  });

  it("exports a default function", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/export default function/);
  });

  it("has language selection", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/source.*lang|target.*lang|language/i);
  });

  it("has recording functionality", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/record|recording|sample/i);
  });

  it("has quality indicator", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/quality|match|percentage/i);
  });

  it("has premium indicator", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/premium|pro|upgrade/i);
  });

  it("uses AsyncStorage for persistence", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/AsyncStorage/);
  });
});

// ─── 2. Auto Language Detection ─────────────────────────────────────────────
describe("Sprint 16: Auto Language Detection", () => {
  const screenPath = path.join(appDir, "auto-language-detect.tsx");

  it("screen file exists", () => {
    expect(fileExists(screenPath)).toBe(true);
  });

  it("is registered in root layout", () => {
    const layout = readFile(layoutPath);
    expect(layout).toContain('"auto-language-detect"');
  });

  it("exports a default function", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/export default function/);
  });

  it("has confidence meter", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/confidence/i);
  });

  it("has formality detection", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/formal|informal|slang|register/i);
  });

  it("has detection history", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/history/i);
  });
});

// ─── 3. Video Call Captions ─────────────────────────────────────────────────
describe("Sprint 16: Video Call Captions", () => {
  const screenPath = path.join(appDir, "video-call-captions.tsx");

  it("screen file exists", () => {
    expect(fileExists(screenPath)).toBe(true);
  });

  it("is registered in root layout", () => {
    const layout = readFile(layoutPath);
    expect(layout).toContain('"video-call-captions"');
  });

  it("exports a default function", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/export default function/);
  });

  it("has enable/disable toggle", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/enable|toggle|switch/i);
  });

  it("has font size control", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/font.*size|size/i);
  });

  it("has dual language mode", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/dual|both.*lang|original.*translat/i);
  });
});

// ─── 4. Screen Overlay Translation ──────────────────────────────────────────
describe("Sprint 16: Screen Overlay Translation", () => {
  const screenPath = path.join(appDir, "screen-overlay-translate.tsx");

  it("screen file exists", () => {
    expect(fileExists(screenPath)).toBe(true);
  });

  it("is registered in root layout", () => {
    const layout = readFile(layoutPath);
    expect(layout).toContain('"screen-overlay-translate"');
  });

  it("exports a default function", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/export default function/);
  });

  it("has overlay/floating features", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/overlay|floating|bubble/i);
  });

  it("has OCR or text capture", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/OCR|capture|scan|text/i);
  });

  it("has translation history", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/history/i);
  });
});

// ─── 5. Offline Translation Packs ──────────────────────────────────────────
describe("Sprint 16: Offline Translation Packs", () => {
  const screenPath = path.join(appDir, "offline-translation-packs.tsx");

  it("screen file exists", () => {
    expect(fileExists(screenPath)).toBe(true);
  });

  it("is registered in root layout", () => {
    const layout = readFile(layoutPath);
    expect(layout).toContain('"offline-translation-packs"');
  });

  it("exports a default function", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/export default function/);
  });

  it("has download/delete functionality", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/download|delete|remove/i);
  });

  it("has storage indicator", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/storage|size|MB|GB/i);
  });

  it("has quality levels", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/basic|standard|full|quality/i);
  });

  it("uses AsyncStorage for persistence", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/AsyncStorage/);
  });
});

// ─── 6. Adaptive Vocabulary Reuse ───────────────────────────────────────────
describe("Sprint 16: Adaptive Vocabulary Reuse", () => {
  const screenPath = path.join(appDir, "adaptive-vocab-reuse.tsx");

  it("screen file exists", () => {
    expect(fileExists(screenPath)).toBe(true);
  });

  it("is registered in root layout", () => {
    const layout = readFile(layoutPath);
    expect(layout).toContain('"adaptive-vocab-reuse"');
  });

  it("exports a default function", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/export default function/);
  });

  it("has struggle/weakness tracking", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/struggle|weak|difficulty|score/i);
  });

  it("has mastery progress", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/mastery|progress/i);
  });

  it("has context weaving settings", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/context|conversation|flashcard|story|song/i);
  });

  it("integrates with SRS system", () => {
    const content = readFile(screenPath);
    expect(content).toMatch(/SRS|spaced.*repetition|interval/i);
  });
});

// ─── 7. Call Feature Fix ────────────────────────────────────────────────────
describe("Sprint 16: Hume Voice Hook Audio Pipeline", () => {
  const hookPath = path.join(hooksDir, "use-hume-voice.ts");

  it("hook file exists", () => {
    expect(fileExists(hookPath)).toBe(true);
  });

  it("has audio capture (MediaRecorder/getUserMedia)", () => {
    const content = readFile(hookPath);
    expect(content).toMatch(/MediaRecorder|getUserMedia|mediaRecorder/i);
  });

  it("has audio playback (AudioContext)", () => {
    const content = readFile(hookPath);
    expect(content).toMatch(/AudioContext|audioContext|decodeAudioData/i);
  });

  it("has WebSocket connection", () => {
    const content = readFile(hookPath);
    expect(content).toMatch(/WebSocket/);
  });

  it("exposes sendAudio function", () => {
    const content = readFile(hookPath);
    expect(content).toMatch(/sendAudio/);
  });

  it("handles mute state", () => {
    const content = readFile(hookPath);
    expect(content).toMatch(/isMuted|setMuted|muted/i);
  });
});

// ─── 8. Screen Registration ────────────────────────────────────────────────
describe("Sprint 16: Screen Registration", () => {
  it("all new Sprint 16 screens registered in _layout.tsx", () => {
    const layout = readFile(layoutPath);
    const requiredScreens = [
      "voice-clone-translation",
      "auto-language-detect",
      "video-call-captions",
      "screen-overlay-translate",
      "offline-translation-packs",
      "adaptive-vocab-reuse",
    ];
    for (const screen of requiredScreens) {
      expect(layout).toContain(`name="${screen}"`);
    }
  });

  it("previously unregistered screens now registered", () => {
    const layout = readFile(layoutPath);
    const fixedScreens = [
      "conversation-sim",
      "creator-dashboard",
      "dominican-slang-dictionary",
      "progress-report-card",
      "social-translate-browser",
      "teacher-profile",
      "tv-player",
    ];
    for (const screen of fixedScreens) {
      expect(layout).toContain(`name="${screen}"`);
    }
  });
});

// ─── 9. Navigation Wiring ──────────────────────────────────────────────────
describe("Sprint 16: Navigation Entry Points", () => {
  it("translate tab links to new features", () => {
    const content = readFile(path.join(appDir, "(tabs)", "translate.tsx"));
    expect(content).toContain("/voice-clone-translation");
    expect(content).toContain("/auto-language-detect");
    expect(content).toContain("/video-call-captions");
    expect(content).toContain("/screen-overlay-translate");
    expect(content).toContain("/offline-translation-packs");
  });

  it("learning path links to adaptive vocab", () => {
    const content = readFile(path.join(appDir, "personalized-learning-path.tsx"));
    expect(content).toContain("/adaptive-vocab-reuse");
  });

  it("calls tab links to video call captions", () => {
    const content = readFile(path.join(appDir, "(tabs)", "calls.tsx"));
    expect(content).toContain("/video-call-captions");
  });
});
