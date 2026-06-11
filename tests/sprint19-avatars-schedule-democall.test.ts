import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.join(__dirname, "..");

describe("Sprint 19 — Teacher Avatars, Daily Plan, Demo Call, Time Capsule", () => {
  // --- Teacher Avatar Fix ---
  describe("Teacher Avatar Fix", () => {
    it("teacher-registry.ts has all photoUrl values pointing to manuscdn.com", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "lib/teacher-registry.ts"), "utf-8");
      const photoUrls = content.match(/photoUrl:\s*["']([^"']+)["']/g) || [];
      expect(photoUrls.length).toBeGreaterThanOrEqual(30);
      // No old CloudFront URLs remain
      const oldUrls = photoUrls.filter(u => u.includes("cloudfront.net"));
      expect(oldUrls.length).toBe(0);
      // All use manuscdn.com
      const newUrls = photoUrls.filter(u => u.includes("files.manuscdn.com"));
      expect(newUrls.length).toBe(photoUrls.length);
    });

    it("teacher avatar URLs all point to manuscdn.com CDN (no local files needed)", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "lib/teacher-registry.ts"), "utf-8");
      const urls = content.match(/https:\/\/files\.manuscdn\.com[^"']+/g) || [];
      expect(urls.length).toBeGreaterThanOrEqual(30);
    });
  });

  // --- Daily Plan Widget ---
  describe("Daily Plan Widget", () => {
    it("daily-plan-widget.tsx component exists", () => {
      const filePath = path.join(APP_DIR, "components/daily-plan-widget.tsx");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("daily plan widget reads @learning_schedule from AsyncStorage", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "components/daily-plan-widget.tsx"), "utf-8");
      expect(content).toContain("@learning_schedule");
      expect(content).toContain("AsyncStorage");
    });

    it("daily plan widget generates personalized tasks based on minutes per day", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "components/daily-plan-widget.tsx"), "utf-8");
      expect(content).toContain("generateTasks");
      expect(content).toContain("minutesPerDay");
    });

    it("daily plan widget tracks completion with per-day key", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "components/daily-plan-widget.tsx"), "utf-8");
      expect(content).toContain("@daily_plan_");
      expect(content).toContain("markTaskComplete");
    });

    it("daily plan widget is imported and rendered on home screen", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "app/(tabs)/index.tsx"), "utf-8");
      expect(content).toContain("DailyPlanWidget");
      expect(content).toContain("daily-plan-widget");
    });

    it("daily plan widget shows progress bar and time label", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "components/daily-plan-widget.tsx"), "utf-8");
      expect(content).toContain("progressBar");
      expect(content).toContain("progressFill");
      expect(content).toContain("TIME_LABELS");
    });
  });

  // --- Guest/Demo Call ---
  describe("Guest/Demo Call Mode", () => {
    it("demo-call.tsx screen exists", () => {
      const filePath = path.join(APP_DIR, "app/demo-call.tsx");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("demo-call is registered in _layout.tsx", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "app/_layout.tsx"), "utf-8");
      expect(content).toContain("demo-call");
    });

    it("demo-call has 60-second timer", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "app/demo-call.tsx"), "utf-8");
      expect(content).toContain("DEMO_DURATION");
      expect(content).toContain("60");
      expect(content).toContain("timeRemaining");
    });

    it("demo-call has intro, connecting, active, and ended states", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "app/demo-call.tsx"), "utf-8");
      expect(content).toContain('"intro"');
      expect(content).toContain('"connecting"');
      expect(content).toContain('"active"');
      expect(content).toContain('"ended"');
    });

    it("demo-call shows live transcription and translation features", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "app/demo-call.tsx"), "utf-8");
      expect(content).toContain("translation");
      expect(content).toContain("transcription");
    });

    it("demo-call has sign-up CTA after call ends", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "app/demo-call.tsx"), "utf-8");
      expect(content).toContain("Sign Up Free");
      expect(content).toContain("/onboarding");
    });

    it("demo-call has mute and speaker controls", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "app/demo-call.tsx"), "utf-8");
      expect(content).toContain("isMuted");
      expect(content).toContain("isSpeakerOn");
      expect(content).toContain("endCall");
    });

    it("home screen has Try Free Call CTA linking to demo-call", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "app/(tabs)/index.tsx"), "utf-8");
      expect(content).toContain("demo-call");
      expect(content).toContain("Try a Free AI Call");
    });
  });

  // --- Time Capsule (already exists) ---
  describe("Time Capsule Feature", () => {
    it("time-capsule.tsx screen exists with Day 1/30/90/180/365 milestones", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "app/time-capsule.tsx"), "utf-8");
      expect(content).toContain("Day 1");
      expect(content).toContain("Day 30");
      expect(content).toContain("Day 90");
      expect(content).toContain("Day 365");
    });

    it("time-capsule uses expo-audio for recording", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "app/time-capsule.tsx"), "utf-8");
      expect(content).toContain("useAudioRecorder");
      expect(content).toContain("RecordingPresets");
    });

    it("time-capsule has milestone prompts for each recording day", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "app/time-capsule.tsx"), "utf-8");
      expect(content).toContain("MILESTONE_PROMPTS");
      expect(content).toContain("Introduce yourself");
    });

    it("time-capsule persists recordings to AsyncStorage", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "app/time-capsule.tsx"), "utf-8");
      expect(content).toContain("@time_capsule_recordings");
      expect(content).toContain("AsyncStorage");
    });

    it("time-capsule is registered in _layout.tsx", () => {
      const content = fs.readFileSync(path.join(APP_DIR, "app/_layout.tsx"), "utf-8");
      expect(content).toContain("time-capsule");
    });
  });
});
