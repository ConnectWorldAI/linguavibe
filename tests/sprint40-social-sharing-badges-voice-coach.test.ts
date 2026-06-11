/**
 * Sprint 40 Tests — Social Challenge Sharing, Pronunciation Streak Badges, AI Voice Coach
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Social Challenge Sharing ───────────────────────────────────────

describe("Social Challenge Sharing Library", () => {
  const libPath = path.resolve("lib/social-challenge-sharing.ts");
  const content = fs.readFileSync(libPath, "utf-8");

  it("exports generateDeepLinks function", () => {
    expect(content).toContain("export function generateDeepLinks");
  });

  it("exports generateDuelInvitationMessage function", () => {
    expect(content).toContain("export function generateDuelInvitationMessage");
  });

  it("generates deep link URLs with app scheme", () => {
    expect(content).toContain("scheme");
    expect(content).toContain("url");
  });

  it("supports multiple sharing platforms (iMessage, WhatsApp)", () => {
    expect(content).toContain("iMessage");
    expect(content).toContain("WhatsApp");
  });

  it("includes share metadata (message, hashtags)", () => {
    expect(content).toContain("message");
    expect(content).toContain("hashtags");
  });

  it("generates deep link data with URL and scheme", () => {
    expect(content).toContain("DeepLinkData");
  });
});

describe("Deep Link Integration in Daily Challenge", () => {
  const screenPath = path.resolve("app/daily-duel-challenge.tsx");
  const content = fs.readFileSync(screenPath, "utf-8");

  it("imports social-challenge-sharing library", () => {
    expect(content).toContain("social-challenge-sharing");
  });

  it("uses generateDailyResultLink in share handler", () => {
    expect(content).toContain("generateDailyResultLink");
  });

  it("includes deep link URL in share message", () => {
    expect(content).toContain("deepLink.url");
  });
});

describe("Deep Link Integration in Duel Results", () => {
  const screenPath = path.resolve("app/pronunciation-duel-results.tsx");
  const content = fs.readFileSync(screenPath, "utf-8");

  it("imports social-challenge-sharing library", () => {
    expect(content).toContain("social-challenge-sharing");
  });

  it("uses generateDuelInviteLink in share handler", () => {
    expect(content).toContain("generateDuelInviteLink");
  });

  it("includes deep link URL in share message", () => {
    expect(content).toContain("deepLink.url");
  });
});

// ─── Pronunciation Streak Badges ────────────────────────────────────

describe("Pronunciation Streak Badges Library", () => {
  const libPath = path.resolve("lib/pronunciation-streak-badges.ts");
  const content = fs.readFileSync(libPath, "utf-8");

  it("exports BADGE_TIERS constant", () => {
    expect(content).toContain("export const BADGE_TIERS");
  });

  it("exports getTierForStreak function", () => {
    expect(content).toContain("export function getTierForStreak");
  });

  it("exports getNextTier function", () => {
    expect(content).toContain("export function getNextTier");
  });

  it("exports getBadgeProgress function", () => {
    expect(content).toContain("export async function getBadgeProgress");
  });

  it("includes Bronze, Silver, Gold, Diamond tiers", () => {
    expect(content).toContain("Bronze");
    expect(content).toContain("Silver");
    expect(content).toContain("Gold");
    expect(content).toContain("Diamond");
  });

  it("each tier has name, icon, color, and days", () => {
    expect(content).toContain("name");
    expect(content).toContain("icon");
    expect(content).toContain("color");
    expect(content).toContain("days");
  });

  it("exports BadgeTier type", () => {
    expect(content).toContain("BadgeTier");
  });
});

describe("Streak Badges on Profile Screen", () => {
  const screenPath = path.resolve("app/(tabs)/profile.tsx");
  const content = fs.readFileSync(screenPath, "utf-8");

  it("imports pronunciation-streak-badges library", () => {
    expect(content).toContain("pronunciation-streak-badges");
  });

  it("renders Pronunciation Badges section", () => {
    expect(content).toContain("Pronunciation Badges");
  });

  it("renders badge grid with BADGE_TIERS_LIST", () => {
    expect(content).toContain("BADGE_TIERS_LIST.map");
    expect(content).toContain("badgeGrid");
  });

  it("shows badge progress bar", () => {
    expect(content).toContain("badgeProgressBar");
    expect(content).toContain("badgeProgressFill");
  });

  it("uses getCurrentBadge to determine earned badges", () => {
    expect(content).toContain("getCurrentBadge");
  });

  it("shows progress to next badge", () => {
    expect(content).toContain("getNextBadge");
    expect(content).toContain("getBadgeProgressSync");
  });
});

// ─── AI Voice Coach Feedback ────────────────────────────────────────

describe("AI Voice Coach Library", () => {
  const libPath = path.resolve("lib/ai-voice-coach.ts");
  const content = fs.readFileSync(libPath, "utf-8");

  it("exports generateRoundFeedback function", () => {
    expect(content).toContain("export function generateRoundFeedback");
  });

  it("exports generateMatchFeedback function", () => {
    expect(content).toContain("export function generateMatchFeedback");
  });

  it("exports speakFeedback function", () => {
    expect(content).toContain("export async function speakFeedback");
  });

  it("exports speakCorrectPronunciation function", () => {
    expect(content).toContain("export async function speakCorrectPronunciation");
  });

  it("exports speakFullFeedback function", () => {
    expect(content).toContain("export async function speakFullFeedback");
  });

  it("exports stopCoachSpeech function", () => {
    expect(content).toContain("export async function stopCoachSpeech");
  });

  it("supports severity levels: perfect, good, needs_work, struggling", () => {
    expect(content).toContain("perfect");
    expect(content).toContain("good");
    expect(content).toContain("needs_work");
    expect(content).toContain("struggling");
  });

  it("has language-specific tips for all supported languages", () => {
    expect(content).toContain("spanish");
    expect(content).toContain("french");
    expect(content).toContain("portuguese");
    expect(content).toContain("japanese");
    expect(content).toContain("german");
    expect(content).toContain("korean");
    expect(content).toContain("mandarin");
  });

  it("uses expo-speech for TTS playback", () => {
    expect(content).toContain("expo-speech");
    expect(content).toContain("Speech.speak");
  });

  it("maps languages to voice codes", () => {
    expect(content).toContain("LANGUAGE_VOICE_MAP");
    expect(content).toContain("es-ES");
    expect(content).toContain("fr-FR");
    expect(content).toContain("ja-JP");
  });

  it("generates specific corrections based on transcript comparison", () => {
    expect(content).toContain("generateCorrection");
    expect(content).toContain("diffPos");
  });
});

describe("AI Voice Coach Integration in Duel Screen", () => {
  const screenPath = path.resolve("app/pronunciation-duel.tsx");
  const content = fs.readFileSync(screenPath, "utf-8");

  it("imports ai-voice-coach library", () => {
    expect(content).toContain("ai-voice-coach");
  });

  it("imports generateRoundFeedback and speakFullFeedback", () => {
    expect(content).toContain("generateRoundFeedback");
    expect(content).toContain("speakFullFeedback");
  });

  it("has coachFeedback state", () => {
    expect(content).toContain("coachFeedback");
    expect(content).toContain("setCoachFeedback");
  });

  it("has coachEnabled toggle state", () => {
    expect(content).toContain("coachEnabled");
    expect(content).toContain("setCoachEnabled");
  });

  it("renders AI Coach feedback box in round_result phase", () => {
    expect(content).toContain("AI Coach");
    expect(content).toContain("coachBox");
    expect(content).toContain("coachMessage");
  });

  it("shows tip for non-perfect scores", () => {
    expect(content).toContain("coachTip");
    expect(content).toContain('severity !== "perfect"');
  });

  it("has volume toggle to enable/disable coach speech", () => {
    expect(content).toContain("volume-high");
    expect(content).toContain("volume-mute");
    expect(content).toContain("stopCoachSpeech");
  });

  it("calls speakFullFeedback when coach is enabled", () => {
    expect(content).toContain("speakFullFeedback(feedback");
  });
});
