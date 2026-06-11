/**
 * Tests for Backend Wiring Sprint:
 * 1. AI Partners → LLM integration
 * 2. Speech Coach → Real audio recording + scoring
 * 3. Immersion Mode → Push notification scheduling
 */
import { describe, it, expect, vi } from "vitest";

// ─── AI Partners Router Tests ─────────────────────────────────────────────────

describe("AI Partners Backend Router", () => {
  it("should have character prompts for all 8 partners", async () => {
    const router = await import("../server/aiPartnersRouter");
    expect(router.aiPartnersRouter).toBeDefined();
    // The router should be a tRPC router with chat and extractMemory procedures
    expect(router.aiPartnersRouter._def).toBeDefined();
  });

  it("should define chat and extractMemory procedures", async () => {
    const router = await import("../server/aiPartnersRouter");
    const procedures = router.aiPartnersRouter._def.procedures;
    expect(procedures).toHaveProperty("chat");
    expect(procedures).toHaveProperty("extractMemory");
  });

  it("should have personality prompts for all character IDs", async () => {
    // Read the file to check character prompts exist
    const fs = await import("fs");
    const content = fs.readFileSync("server/aiPartnersRouter.ts", "utf-8");
    const expectedIds = [
      "prof_dubois",
      "lucas_surf",
      "yuki_vendor",
      "carmen_abuela",
      "hans_engineer",
      "amara_poet",
      "jin_gamer",
      "sofia_dancer",
    ];
    for (const id of expectedIds) {
      expect(content).toContain(id);
    }
  });
});

// ─── AI Partners Frontend Integration Tests ──────────────────────────────────

describe("AI Partners Frontend - tRPC Integration", () => {
  it("should import trpc in ai-partners.tsx", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/ai-partners.tsx", "utf-8");
    expect(content).toContain('import { trpc } from "@/lib/trpc"');
    expect(content).toContain("trpc.aiPartners.chat.useMutation");
    expect(content).toContain("trpc.aiPartners.extractMemory.useMutation");
  });

  it("should persist memory context to AsyncStorage", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/ai-partners.tsx", "utf-8");
    expect(content).toContain("@ai_partner_memory_");
    expect(content).toContain("AsyncStorage.setItem");
    expect(content).toContain("AsyncStorage.getItem");
  });

  it("should send conversation history and user level to backend", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/ai-partners.tsx", "utf-8");
    expect(content).toContain("conversationHistory");
    expect(content).toContain("userLevel: partner.difficulty");
    expect(content).toContain("sessionCount:");
    expect(content).toContain("memoryContext");
  });

  it("should extract memory every 10 messages", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/ai-partners.tsx", "utf-8");
    expect(content).toContain("history.length % 10 === 0");
  });
});

// ─── Speech Coach Real Recording Tests ───────────────────────────────────────

describe("Speech Coach - Real Audio Recording", () => {
  it("should import expo-audio recording utilities", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/speech-coach.tsx", "utf-8");
    expect(content).toContain("useAudioRecorder");
    expect(content).toContain("RecordingPresets");
    expect(content).toContain("requestRecordingPermissionsAsync");
    expect(content).toContain("setAudioModeAsync");
  });

  it("should import trpc for pronunciation scoring", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/speech-coach.tsx", "utf-8");
    expect(content).toContain('import { trpc } from "@/lib/trpc"');
    expect(content).toContain("trpc.pronunciationScoring.scorePronunciation.useMutation");
  });

  it("should have startRealRecording function", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/speech-coach.tsx", "utf-8");
    expect(content).toContain("const startRealRecording");
    expect(content).toContain("recorder.prepareToRecordAsync");
    expect(content).toContain("recorder.record()");
  });

  it("should have stopAndScore function that sends audio to server", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/speech-coach.tsx", "utf-8");
    expect(content).toContain("const stopAndScore");
    expect(content).toContain("scoreMutation.mutateAsync");
    expect(content).toContain("audioBase64: base64Audio");
    expect(content).toContain("targetPhrase: currentDrill.word");
  });

  it("should handle web fallback with MediaRecorder", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/speech-coach.tsx", "utf-8");
    expect(content).toContain("navigator.mediaDevices.getUserMedia");
    expect(content).toContain("new MediaRecorder");
  });

  it("should display AI feedback and problem sounds", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/speech-coach.tsx", "utf-8");
    expect(content).toContain("scoringFeedback");
    expect(content).toContain("problemSounds");
    expect(content).toContain("AI Feedback");
    expect(content).toContain("Problem sounds:");
  });

  it("should show scoring indicator while processing", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/speech-coach.tsx", "utf-8");
    expect(content).toContain("isScoring");
    expect(content).toContain("Analyzing pronunciation...");
  });

  it("should use Stop & Score button pattern", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/speech-coach.tsx", "utf-8");
    expect(content).toContain("Stop & Score");
    expect(content).toContain("isRecording ? stopAndScore : startRealRecording");
  });
});

// ─── Immersion Mode Push Notifications Tests ─────────────────────────────────

describe("Immersion Mode - Push Notification Scheduling", () => {
  it("should import expo-notifications", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/immersion-mode.tsx", "utf-8");
    expect(content).toContain('import * as Notifications from "expo-notifications"');
    expect(content).toContain('import { requestNotificationPermission } from "@/lib/notifications"');
  });

  it("should have scheduleImmersionNotifications function", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/immersion-mode.tsx", "utf-8");
    expect(content).toContain("async function scheduleImmersionNotifications");
    expect(content).toContain("Notifications.scheduleNotificationAsync");
    expect(content).toContain("Notifications.SchedulableTriggerInputTypes.DAILY");
  });

  it("should have cancelImmersionNotifications function", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/immersion-mode.tsx", "utf-8");
    expect(content).toContain("async function cancelImmersionNotifications");
    expect(content).toContain("cancelScheduledNotificationAsync");
  });

  it("should respect quiet hours when scheduling", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/immersion-mode.tsx", "utf-8");
    expect(content).toContain("quietHoursStart");
    expect(content).toContain("quietHoursEnd");
    expect(content).toContain("availableHours");
  });

  it("should request notification permission before enabling", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/immersion-mode.tsx", "utf-8");
    expect(content).toContain("requestNotificationPermission()");
    expect(content).toContain("Notifications Required");
  });

  it("should cancel notifications when immersion mode is disabled", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/immersion-mode.tsx", "utf-8");
    expect(content).toContain("cancelImmersionNotifications()");
  });

  it("should reschedule notifications when settings change", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/immersion-mode.tsx", "utf-8");
    // saveSettings should call scheduleImmersionNotifications
    expect(content).toContain("await scheduleImmersionNotifications(newSettings, categories)");
  });

  it("should use unique identifiers for immersion notifications", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/immersion-mode.tsx", "utf-8");
    expect(content).toContain("IMMERSION_NOTIFICATION_PREFIX");
    expect(content).toContain("identifier:");
  });

  it("should spread notifications across available hours", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/immersion-mode.tsx", "utf-8");
    expect(content).toContain("notificationsToSchedule");
    expect(content).toContain("interval");
    expect(content).toContain("dailyLimit");
  });
});

// ─── Router Registration Tests ───────────────────────────────────────────────

describe("Router Registration", () => {
  it("should register aiPartners router in appRouter", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/routers.ts", "utf-8");
    expect(content).toContain('import { aiPartnersRouter } from "./aiPartnersRouter"');
    expect(content).toContain("aiPartners: aiPartnersRouter");
  });
});
