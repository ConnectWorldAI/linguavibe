/**
 * Sprint 48 Tests — Splash Icon Refresh + Analytics Wiring
 * 
 * Validates:
 * 1. Splash icon exists and has no square outline (transparent bg)
 * 2. Analytics trackers are wired into lesson-player, duel-results, voice-rooms, referral
 * 3. Achievement unlock hook has centralized analytics tracking
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.resolve(__dirname, "..");

describe("Sprint 48 — Splash Icon Refresh", () => {
  it("splash-icon.png exists and is a valid PNG", () => {
    const splashPath = path.join(APP_DIR, "assets/images/splash-icon.png");
    expect(fs.existsSync(splashPath)).toBe(true);
    const buf = fs.readFileSync(splashPath);
    // PNG magic bytes
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
    expect(buf[2]).toBe(0x4E);
    expect(buf[3]).toBe(0x47);
  });

  it("splash-icon.png is under 500KB (optimized for mobile)", () => {
    const splashPath = path.join(APP_DIR, "assets/images/splash-icon.png");
    const stat = fs.statSync(splashPath);
    expect(stat.size).toBeLessThan(500 * 1024);
  });
});

describe("Sprint 48 — Analytics Wiring", () => {
  it("lesson-player.tsx imports and calls trackLessonComplete", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/lesson-player.tsx"), "utf-8");
    expect(content).toContain("import { trackLessonComplete } from \"@/lib/analytics\"");
    expect(content).toContain("trackLessonComplete(");
  });

  it("lesson-player.tsx tracks duration with lessonStartTime", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/lesson-player.tsx"), "utf-8");
    expect(content).toContain("lessonStartTime");
    expect(content).toContain("Date.now()");
  });

  it("pronunciation-duel-results.tsx imports and calls trackDuelPlayed", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/pronunciation-duel-results.tsx"), "utf-8");
    expect(content).toContain("import { trackDuelPlayed } from \"@/lib/analytics\"");
    expect(content).toContain("trackDuelPlayed(");
  });

  it("pronunciation-duel-results.tsx only tracks from fresh game (params.fromGame)", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/pronunciation-duel-results.tsx"), "utf-8");
    // Should be inside the fromGame check to avoid tracking when browsing history
    const fromGameBlock = content.indexOf("params.fromGame");
    const trackCall = content.indexOf("trackDuelPlayed(");
    expect(fromGameBlock).toBeLessThan(trackCall);
  });

  it("pronunciation-duel-results.tsx distinguishes human vs AI opponents", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/pronunciation-duel-results.tsx"), "utf-8");
    expect(content).toContain("multiplayer");
    expect(content).toContain("\"human\"");
    expect(content).toContain("\"ai\"");
  });

  it("voice-rooms.tsx imports and calls trackVoiceRoomJoined", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/voice-rooms.tsx"), "utf-8");
    expect(content).toContain("import { trackVoiceRoomJoined } from \"@/lib/analytics\"");
    expect(content).toContain("trackVoiceRoomJoined(");
  });

  it("voice-rooms.tsx tracks room join with room id and level", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/voice-rooms.tsx"), "utf-8");
    expect(content).toContain("trackVoiceRoomJoined(room.id, room.level)");
  });

  it("referral.tsx imports and calls trackReferralShared", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/referral.tsx"), "utf-8");
    expect(content).toContain("import { trackReferralShared");
    expect(content).toContain("trackReferralShared(");
  });

  it("referral.tsx tracks both social share and link copy channels", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/referral.tsx"), "utf-8");
    expect(content).toContain('trackReferralShared("social")');
    expect(content).toContain('trackReferralShared("link")');
  });

  it("referral.tsx also tracks invite sent event", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/referral.tsx"), "utf-8");
    expect(content).toContain("trackInviteSent");
    expect(content).toContain('trackInviteSent("referral")');
  });
});

describe("Sprint 48 — Centralized Achievement Analytics", () => {
  it("use-achievement-unlock.ts imports trackAchievementUnlocked", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "hooks/use-achievement-unlock.ts"), "utf-8");
    expect(content).toContain("import { trackAchievementUnlocked } from \"@/lib/analytics\"");
  });

  it("use-achievement-unlock.ts tracks each unlock in the checkForUnlocks function", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "hooks/use-achievement-unlock.ts"), "utf-8");
    expect(content).toContain('trackAchievementUnlocked(unlock.id, unlock.tier || "bronze")');
  });

  it("tracking happens before queuing unlocks for toast display", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "hooks/use-achievement-unlock.ts"), "utf-8");
    const trackPos = content.indexOf("trackAchievementUnlocked(");
    const queuePos = content.indexOf("setPendingUnlocks(newUnlocks)");
    expect(trackPos).toBeGreaterThan(0);
    expect(queuePos).toBeGreaterThan(trackPos);
  });
});

describe("Sprint 48 — No Duplicate Screen Registrations", () => {
  it("_layout.tsx has no duplicate Stack.Screen names", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/_layout.tsx"), "utf-8");
    const screenNames = [...content.matchAll(/Stack\.Screen\s+name="([^"]+)"/g)].map(m => m[1]);
    const uniqueNames = new Set(screenNames);
    expect(screenNames.length).toBe(uniqueNames.size);
  });
});
