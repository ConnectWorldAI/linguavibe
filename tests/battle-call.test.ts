import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "..");

describe("Vocabulary Battle Screen", () => {
  const filePath = path.join(appDir, "app/vocabulary-battle.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports default component", () => {
    expect(fs.existsSync(filePath)).toBe(true);
    expect(content).toContain("export default function VocabularyBattleScreen");
  });

  it("has battle states: lobby, countdown, playing, result", () => {
    expect(content).toContain('"lobby"');
    expect(content).toContain('"countdown"');
    expect(content).toContain('"playing"');
    expect(content).toContain('"result"');
  });

  it("has question bank with multiple dialects", () => {
    expect(content).toContain("Dominican");
    expect(content).toContain("Colombian");
    expect(content).toContain("Mexican");
    expect(content).toContain("Venezuelan");
  });

  it("has timer and scoring logic", () => {
    expect(content).toContain("ROUND_TIME");
    expect(content).toContain("TOTAL_ROUNDS");
    expect(content).toContain("playerScore");
    expect(content).toContain("opponentScore");
    expect(content).toContain("timeBonus");
    expect(content).toContain("streakBonus");
  });

  it("has multiple choice answer options", () => {
    expect(content).toContain("options");
    expect(content).toContain("correctIndex");
    expect(content).toContain("handleAnswer");
  });

  it("has result screen with stats", () => {
    expect(content).toContain("Victory!");
    expect(content).toContain("Defeat");
    expect(content).toContain("Play Again");
    expect(content).toContain("Accuracy");
    expect(content).toContain("Best Streak");
  });

  it("uses haptic feedback", () => {
    expect(content).toContain("Haptics.notificationAsync");
    expect(content).toContain('Platform.OS !== "web"');
  });
});

describe("Call Screen", () => {
  const filePath = path.join(appDir, "app/call-screen.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports default component", () => {
    expect(fs.existsSync(filePath)).toBe(true);
    expect(content).toContain("export default function CallScreen");
  });

  it("has call states: connecting, ringing, active, ended", () => {
    expect(content).toContain('"connecting"');
    expect(content).toContain('"ringing"');
    expect(content).toContain('"active"');
    expect(content).toContain('"ended"');
  });

  it("supports video and voice call types", () => {
    expect(content).toContain('"video"');
    expect(content).toContain('"voice"');
    expect(content).toContain("isVideoCall");
    expect(content).toContain("switchCallType");
  });

  it("has mute, camera, and speaker controls", () => {
    expect(content).toContain("toggleMute");
    expect(content).toContain("toggleCamera");
    expect(content).toContain("toggleSpeaker");
    expect(content).toContain("isMuted");
    expect(content).toContain("isCameraOff");
    expect(content).toContain("isSpeaker");
  });

  it("has call duration timer", () => {
    expect(content).toContain("formatDuration");
    expect(content).toContain("duration");
    expect(content).toContain("durationRef");
  });

  it("has end call functionality", () => {
    expect(content).toContain("endCall");
    expect(content).toContain("Call Ended");
    expect(content).toContain("endCallBtn");
  });

  it("uses keep-awake during call", () => {
    expect(content).toContain("useKeepAwake");
  });

  it("has encrypted badge indicator", () => {
    expect(content).toContain("Encrypted");
    expect(content).toContain("lock-closed");
  });

  it("has self-video PiP view", () => {
    expect(content).toContain("selfVideo");
    expect(content).toContain("remoteVideo");
  });
});

describe("Home Customization Wiring", () => {
  const filePath = path.join(appDir, "app/(tabs)/index.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has HOME_LAYOUT_KEY constant", () => {
    expect(content).toContain("HOME_LAYOUT_KEY");
    expect(content).toContain("@connectworld_home_layout");
  });

  it("has DEFAULT_CARD_ORDER with all card IDs", () => {
    expect(content).toContain("DEFAULT_CARD_ORDER");
    expect(content).toContain('"streak"');
    expect(content).toContain('"usage"');
    expect(content).toContain('"progress"');
    expect(content).toContain('"daily-goals"');
    expect(content).toContain('"weekly-digest"');
    expect(content).toContain('"milestones"');
    expect(content).toContain('"daily-challenge"');
    expect(content).toContain('"featured"');
    expect(content).toContain('"continue-learning"');
    expect(content).toContain('"upcoming-classes"');
    expect(content).toContain('"ai-tip"');
  });

  it("has cardOrder state and isCardVisible function", () => {
    expect(content).toContain("cardOrder");
    expect(content).toContain("isCardVisible");
    expect(content).toContain("hiddenCards");
  });

  it("uses useFocusEffect to load layout on mount", () => {
    expect(content).toContain("useFocusEffect");
    expect(content).toContain("HOME_LAYOUT_KEY");
  });

  it("renders cards dynamically with switch-case", () => {
    expect(content).toContain("cardOrder.map");
    expect(content).toContain('case "streak"');
    expect(content).toContain('case "usage"');
    expect(content).toContain('case "continue-learning"');
    expect(content).toContain('case "upcoming-classes"');
    expect(content).toContain('case "ai-tip"');
  });
});

describe("Screen Registration", () => {
  const layoutPath = path.join(appDir, "app/_layout.tsx");
  const layout = fs.readFileSync(layoutPath, "utf-8");

  it("vocabulary-battle is registered in root layout", () => {
    expect(layout).toContain('name="vocabulary-battle"');
  });

  it("call-screen is registered in root layout", () => {
    expect(layout).toContain('name="call-screen"');
  });
});
