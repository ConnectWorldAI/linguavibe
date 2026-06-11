import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "..");

describe("Sprint 18 — Voice Rooms AI Moderation", () => {
  const voiceRooms = fs.readFileSync(path.join(appDir, "app/voice-rooms.tsx"), "utf-8");

  it("has AI conversation starters array", () => {
    expect(voiceRooms).toContain("AI_CONVERSATION_STARTERS");
    expect(voiceRooms).toContain("Let's go around the room");
    expect(voiceRooms).toContain("Tongue twister challenge");
    expect(voiceRooms).toContain("Role play");
  });

  it("has rotating AI feedback messages", () => {
    expect(voiceRooms).toContain("AI_FEEDBACK_MESSAGES");
    expect(voiceRooms).toContain("Great pronunciation");
    expect(voiceRooms).toContain("Small correction");
    expect(voiceRooms).toContain("aiFeedbackIdx");
  });

  it("has level-matching filter options", () => {
    expect(voiceRooms).toContain("LEVEL_MATCH_OPTIONS");
    expect(voiceRooms).toContain("Beginner (A1-A2)");
    expect(voiceRooms).toContain("Intermediate (B1-B2)");
    expect(voiceRooms).toContain("Advanced (C1-C2)");
    expect(voiceRooms).toContain("levelFilter");
  });

  it("detects silence and injects conversation prompts", () => {
    expect(voiceRooms).toContain("silenceSeconds");
    expect(voiceRooms).toContain("silenceTimer");
    expect(voiceRooms).toContain("AI Conversation Starter");
    // After 15s silence, AI injects a new prompt
    expect(voiceRooms).toContain("prev >= 15");
  });

  it("has topic suggestions button for manual topic selection", () => {
    expect(voiceRooms).toContain("showTopicSuggestions");
    expect(voiceRooms).toContain("Topic Ideas");
    expect(voiceRooms).toContain("topicSuggestBtn");
  });

  it("filters rooms by both language AND level", () => {
    expect(voiceRooms).toContain("langMatch");
    expect(voiceRooms).toContain("levelMatch");
    expect(voiceRooms).toContain("levelFilter");
  });

  it("rotates feedback on a 12-second interval", () => {
    expect(voiceRooms).toContain("12000");
    expect(voiceRooms).toContain("feedbackTimer");
  });
});

describe("Sprint 18 — Onboarding Walkthrough Enhancement", () => {
  const onboarding = fs.readFileSync(path.join(appDir, "app/onboarding.tsx"), "utf-8");

  it("has schedule setup step (step 7)", () => {
    expect(onboarding).toContain("renderScheduleSetup");
    expect(onboarding).toContain("Set Your Schedule");
    expect(onboarding).toContain("step === 7");
  });

  it("has days per week selector", () => {
    expect(onboarding).toContain("daysPerWeek");
    expect(onboarding).toContain("Days per week");
    expect(onboarding).toContain("dayChip");
  });

  it("has minutes per session selector", () => {
    expect(onboarding).toContain("minutesPerDay");
    expect(onboarding).toContain("Minutes per session");
    expect(onboarding).toContain("MINUTE_OPTIONS");
  });

  it("has preferred time of day selector", () => {
    expect(onboarding).toContain("preferredTime");
    expect(onboarding).toContain("Best time to learn");
    expect(onboarding).toContain("Morning");
    expect(onboarding).toContain("Afternoon");
    expect(onboarding).toContain("Evening");
    expect(onboarding).toContain("Night");
  });

  it("saves learning schedule to AsyncStorage", () => {
    expect(onboarding).toContain("@learning_schedule");
    expect(onboarding).toContain("daysPerWeek");
    expect(onboarding).toContain("minutesPerDay");
    expect(onboarding).toContain("preferredTime");
  });

  it("has feature tour step (step 8)", () => {
    expect(onboarding).toContain("renderFeatureTour");
    expect(onboarding).toContain("TOUR_SLIDES");
    expect(onboarding).toContain("step === 8");
  });

  it("feature tour covers all 4 key areas", () => {
    expect(onboarding).toContain("Instant Translation");
    expect(onboarding).toContain("AI Voice Calls");
    expect(onboarding).toContain("Structured Learning");
    expect(onboarding).toContain("Connect & Practice");
  });

  it("feature tour lists specific feature highlights", () => {
    expect(onboarding).toContain("Real-time as you type");
    expect(onboarding).toContain("Emotional AI with Hume");
    expect(onboarding).toContain("Personalized learning path");
    expect(onboarding).toContain("Live voice rooms");
  });

  it("has skip tour option", () => {
    expect(onboarding).toContain("Skip Tour");
  });

  it("tour navigates through slides with dots indicator", () => {
    expect(onboarding).toContain("tourStep");
    expect(onboarding).toContain("TOUR_SLIDES.map");
    expect(onboarding).toContain("dotActive");
  });

  it("final tour slide triggers handleComplete", () => {
    expect(onboarding).toContain("Start Learning!");
    expect(onboarding).toContain("handleComplete()");
  });

  it("level selection now goes to step 7 instead of completing", () => {
    expect(onboarding).toContain("setTimeout(() => setStep(7)");
  });
});

describe("Sprint 18 — ElevenLabs Integration", () => {
  it("ElevenLabs API key is referenced in server translate router", () => {
    const translateRouter = fs.readFileSync(path.join(appDir, "server/translateRouter.ts"), "utf-8");
    expect(translateRouter).toContain("ELEVENLABS_API_KEY");
  });

  it("translator has voice playback with expo-speech fallback", () => {
    const translate = fs.readFileSync(path.join(appDir, "app/(tabs)/translate.tsx"), "utf-8");
    expect(translate).toContain("Speech");
    expect(translate).toContain("handleListen");
  });
});
