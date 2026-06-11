/**
 * Tests for Sprint: Streak Freeze + Dialect Voice Selection + Dialect Challenge
 */
import { describe, it, expect } from "vitest";

// ─── Dialect Challenge Content Tests ────────────────────────────────────────

describe("Dialect Challenge", () => {
  it("should have offline-ready challenge phrases covering all 7 dialects", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/dialect-challenge.tsx", "utf-8");
    // Verify all 7 dialects have at least one phrase
    const dialects = ["Dominican", "Mexican", "Colombian", "Puerto Rican", "Venezuelan", "Cuban", "Argentine"];
    for (const d of dialects) {
      expect(content).toContain(`correctDialect: "${d}"`);
    }
  });

  it("should have challenge phrases with required fields", async () => {
    // Read the file content to verify structure
    const fs = await import("fs");
    const content = fs.readFileSync("app/dialect-challenge.tsx", "utf-8");

    // Verify all 7 dialects are represented
    expect(content).toContain('"Dominican"');
    expect(content).toContain('"Mexican"');
    expect(content).toContain('"Colombian"');
    expect(content).toContain('"Puerto Rican"');
    expect(content).toContain('"Venezuelan"');
    expect(content).toContain('"Cuban"');
    expect(content).toContain('"Argentine"');

    // Verify teaching moments exist (BilingueBlogs-inspired)
    expect(content).toContain("teachingMoment");
    expect(content).toContain("audioHint");

    // Verify categories
    expect(content).toContain('"slang"');
    expect(content).toContain('"greeting"');
    expect(content).toContain('"expression"');
    expect(content).toContain('"grammar"');
  });

  it("should have timed rounds with difficulty levels", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/dialect-challenge.tsx", "utf-8");

    // Verify time limits for each difficulty
    expect(content).toContain("easy: 20");
    expect(content).toContain("medium: 12");
    expect(content).toContain("hard: 7");
  });

  it("should include audio pronunciation via expo-speech", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/dialect-challenge.tsx", "utf-8");

    expect(content).toContain('import * as Speech from "expo-speech"');
    expect(content).toContain("Speech.speak");
    expect(content).toContain("speakPhrase");
  });

  it("should persist stats to AsyncStorage", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/dialect-challenge.tsx", "utf-8");

    expect(content).toContain("@dialect_challenge_stats");
    expect(content).toContain("AsyncStorage.setItem");
    expect(content).toContain("AsyncStorage.getItem");
  });

  it("should have BilingueBlogs-inspired teaching content", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/dialect-challenge.tsx", "utf-8");

    // Verify BilingueBlogs references
    expect(content).toContain("BilingueBlogs");
    expect(content).toContain("@bilingueblogs");

    // Verify cultural teaching moments
    expect(content).toContain("Swiss Army knife of Dominican Spanish");
    expect(content).toContain("Che Guevara got his nickname");
    expect(content).toContain("Afro-Cuban");
  });
});

// ─── Dialect Voice Selection Tests ──────────────────────────────────────────

describe("Dialect Voice Selection (Voice Clone Studio)", () => {
  it("should have dialect options for multiple languages", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/voice-clone-studio.tsx", "utf-8");

    // Verify DIALECT_OPTIONS object exists with multiple languages
    expect(content).toContain("DIALECT_OPTIONS");
    expect(content).toContain("Spanish:");
    expect(content).toContain("French:");
    expect(content).toContain("Portuguese:");
    expect(content).toContain("German:");
    expect(content).toContain("Italian:");
    expect(content).toContain("Japanese:");
    expect(content).toContain("Korean:");
  });

  it("should have 7 Spanish dialect options", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/voice-clone-studio.tsx", "utf-8");

    expect(content).toContain('"es-mx"');
    expect(content).toContain('"es-co"');
    expect(content).toContain('"es-do"');
    expect(content).toContain('"es-ar"');
    expect(content).toContain('"es-pr"');
    expect(content).toContain('"es-cu"');
    expect(content).toContain('"es-es"');
  });

  it("should pass dialect code to TTS preview", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/voice-clone-studio.tsx", "utf-8");

    // Verify dialect code is used in the TTS call
    expect(content).toContain("dialectCode");
    expect(content).toContain("selectedDialect");
    expect(content).toContain("language: dialectCode");
  });

  it("should clear preview cache when dialect changes", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/voice-clone-studio.tsx", "utf-8");

    expect(content).toContain("delete previewCacheRef.current[selectedSong.id]");
  });

  it("should render dialect chips with flag and label", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/voice-clone-studio.tsx", "utf-8");

    expect(content).toContain("dialectChip");
    expect(content).toContain("dialectFlag");
    expect(content).toContain("dialectLabel");
    expect(content).toContain("dialectInfoBanner");
  });
});

// ─── Streak Freeze Tests ────────────────────────────────────────────────────

describe("Streak Freeze (already implemented)", () => {
  it("should have streak-freeze lib with purchase logic", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/streak-freeze.ts", "utf-8");

    expect(content).toContain("purchaseStreakFreeze");
    expect(content).toContain("checkAndApplyStreakFreeze");
    expect(content).toContain("getStreakFreezeData");
  });

  it("should have streak-freeze-purchase screen", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/streak-freeze-purchase.tsx", "utf-8");

    expect(content).toContain("StreakFreeze");
    expect(content).toContain("purchase");
  });
});
