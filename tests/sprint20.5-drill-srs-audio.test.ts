import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const readFile = (filePath: string) =>
  fs.readFileSync(path.join(__dirname, "..", filePath), "utf-8");

describe("Sprint 20.5 — Pronunciation Drill Route Params", () => {
  const drillSource = readFile("app/pronunciation-drill.tsx");

  it("imports useLocalSearchParams from expo-router", () => {
    expect(drillSource).toContain("useLocalSearchParams");
  });

  it("accepts phonemeId route param", () => {
    expect(drillSource).toContain("phonemeId?: string");
  });

  it("accepts phonemeName route param", () => {
    expect(drillSource).toContain("phonemeName?: string");
  });

  it("accepts phonemeSymbol route param", () => {
    expect(drillSource).toContain("phonemeSymbol?: string");
  });

  it("accepts language route param", () => {
    expect(drillSource).toContain("language?: string");
  });

  it("accepts examples route param (comma-separated)", () => {
    expect(drillSource).toContain("examples?: string");
  });

  it("accepts tip route param", () => {
    expect(drillSource).toContain("tip?: string");
  });

  it("accepts srsCardId route param for SRS auto-update", () => {
    expect(drillSource).toContain("srsCardId?: string");
  });

  it("detects targeted drill mode from params", () => {
    expect(drillSource).toContain("isTargetedDrill");
  });

  it("builds drill words from route params examples", () => {
    expect(drillSource).toContain("buildDrillWordsFromParams");
    expect(drillSource).toContain("params.examples.split");
  });

  it("shows targeted drill header with phoneme name", () => {
    expect(drillSource).toContain('} Drill`');
  });

  it("shows tip banner for targeted drills", () => {
    expect(drillSource).toContain("tipBanner");
    expect(drillSource).toContain("params.tip");
  });
});

describe("Sprint 20.5 — ElevenLabs Audio on Phoneme SRS Cards", () => {
  const srsReviewSource = readFile("app/srs-review.tsx");

  it("imports expo-speech for fallback TTS", () => {
    expect(srsReviewSource).toContain("expo-speech");
  });

  it("imports createAudioPlayer from expo-audio", () => {
    expect(srsReviewSource).toContain("createAudioPlayer");
  });

  it("imports trpc for ElevenLabs mutation", () => {
    expect(srsReviewSource).toContain("import { trpc }");
  });

  it("uses voiceExercise.generatePronunciation mutation", () => {
    expect(srsReviewSource).toContain("voiceExercise.generatePronunciation");
  });

  it("has playPhonemeAudio function", () => {
    expect(srsReviewSource).toContain("playPhonemeAudio");
  });

  it("has playAudioFromUrl helper", () => {
    expect(srsReviewSource).toContain("playAudioFromUrl");
  });

  it("has speakFallback for when ElevenLabs fails", () => {
    expect(srsReviewSource).toContain("speakFallback");
  });

  it("renders Listen button for phoneme cards", () => {
    expect(srsReviewSource).toContain("Listen");
    expect(srsReviewSource).toContain("listenBtn");
  });

  it("shows loading state while generating audio", () => {
    expect(srsReviewSource).toContain("isLoadingAudio");
    expect(srsReviewSource).toContain("Loading...");
  });

  it("shows playing state during playback", () => {
    expect(srsReviewSource).toContain("isPlayingAudio");
    expect(srsReviewSource).toContain("Playing...");
  });

  it("caches audio URLs to avoid repeated API calls", () => {
    expect(srsReviewSource).toContain("cachedAudioUrlsRef");
  });

  it("enables silent mode playback", () => {
    expect(srsReviewSource).toContain("setAudioModeAsync");
    expect(srsReviewSource).toContain("playsInSilentMode");
  });

  it("renders Practice Drill button for phoneme cards", () => {
    expect(srsReviewSource).toContain("Practice Drill");
    expect(srsReviewSource).toContain("drillBtn");
  });

  it("navigates to pronunciation-drill with params from SRS card", () => {
    expect(srsReviewSource).toContain("pronunciation-drill");
    expect(srsReviewSource).toContain("srsCardId: currentItem.id");
  });
});

describe("Sprint 20.5 — SRS Auto-Update on Drill Score > 70", () => {
  const drillSource = readFile("app/pronunciation-drill.tsx");

  it("defines SRS_GRADUATION_THRESHOLD constant at 70", () => {
    expect(drillSource).toContain("SRS_GRADUATION_THRESHOLD = 70");
  });

  it("imports reviewItem from SRS library", () => {
    expect(drillSource).toContain("import { reviewItem }");
    expect(drillSource).toContain("@/lib/srs");
  });

  it("has handleSRSAutoUpdate function", () => {
    expect(drillSource).toContain("handleSRSAutoUpdate");
  });

  it("rates as Easy (quality 5) when score >= 70", () => {
    expect(drillSource).toMatch(/score >= SRS_GRADUATION_THRESHOLD/);
    expect(drillSource).toContain("await reviewItem(params.srsCardId, 5)");
  });

  it("rates as Again (quality 1) when score < 40", () => {
    expect(drillSource).toContain("score < 40");
    expect(drillSource).toContain("await reviewItem(params.srsCardId, 1)");
  });

  it("tracks srsUpdated state to prevent duplicate updates", () => {
    expect(drillSource).toContain("srsUpdated");
    expect(drillSource).toContain("setSrsUpdated(true)");
  });

  it("shows SRS update indicator when interval extended", () => {
    expect(drillSource).toContain("SRS interval extended");
    expect(drillSource).toContain("srsUpdateBadge");
  });

  it("calls handleSRSAutoUpdate after pronunciation analysis", () => {
    expect(drillSource).toContain("await handleSRSAutoUpdate(score)");
  });

  it("only auto-updates when srsCardId param is present", () => {
    expect(drillSource).toContain("if (!params.srsCardId || srsUpdated) return");
  });

  it("resets srsUpdated on word navigation", () => {
    expect(drillSource).toContain("setSrsUpdated(false)");
  });
});
