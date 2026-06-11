import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const FLAGS_PATH = path.resolve(__dirname, "../lib/feature-flags.ts");
const HOOK_PATH = path.resolve(__dirname, "../hooks/use-feature-flags.ts");

describe("Feature Flags Module", () => {
  const source = fs.readFileSync(FLAGS_PATH, "utf-8");

  it("exports initFeatureFlags function", () => {
    expect(source).toContain("export async function initFeatureFlags(");
  });

  it("exports isFeatureEnabled function", () => {
    expect(source).toContain("export async function isFeatureEnabled(");
  });

  it("exports getVariant function", () => {
    expect(source).toContain("export async function getVariant(");
  });

  it("exports overrideFlag function", () => {
    expect(source).toContain("export async function overrideFlag(");
  });

  it("exports resetFlags function", () => {
    expect(source).toContain("export async function resetFlags(");
  });

  it("exports trackExperiment function", () => {
    expect(source).toContain("export async function trackExperiment(");
  });

  it("exports getExperimentEvents function", () => {
    expect(source).toContain("export async function getExperimentEvents(");
  });

  it("exports clearExperimentEvents function", () => {
    expect(source).toContain("export async function clearExperimentEvents(");
  });

  it("defines FeatureFlag interface", () => {
    expect(source).toContain("export interface FeatureFlag");
    expect(source).toContain("key: string");
    expect(source).toContain("enabled: boolean");
    expect(source).toContain("variant?: string");
    expect(source).toContain("rolloutPercentage: number");
    expect(source).toContain("platforms:");
    expect(source).toContain("experiment?: string");
  });

  it("defines ExperimentEvent interface", () => {
    expect(source).toContain("export interface ExperimentEvent");
    expect(source).toContain("experiment: string");
    expect(source).toContain("variant: string");
    expect(source).toContain("event: string");
    expect(source).toContain("timestamp: string");
  });

  describe("Default Flags", () => {
    it("includes onboarding_skip_dialect_single flag", () => {
      expect(source).toContain('"onboarding_skip_dialect_single"');
    });

    it("includes onboarding_voice_preview flag", () => {
      expect(source).toContain('"onboarding_voice_preview"');
    });

    it("includes onboarding_quick_start flag", () => {
      expect(source).toContain('"onboarding_quick_start"');
    });

    it("includes onboarding_progress_bar flag", () => {
      expect(source).toContain('"onboarding_progress_bar"');
    });

    it("includes lesson_completion_celebration flag", () => {
      expect(source).toContain('"lesson_completion_celebration"');
    });

    it("includes streak_freeze_reminder flag", () => {
      expect(source).toContain('"streak_freeze_reminder"');
    });

    it("includes home_layout_cards flag", () => {
      expect(source).toContain('"home_layout_cards"');
    });

    it("groups onboarding flags under onboarding_flow_v2 experiment", () => {
      expect(source).toContain('experiment: "onboarding_flow_v2"');
    });
  });

  describe("User Bucketing", () => {
    it("uses stable bucket assignment via AsyncStorage", () => {
      expect(source).toContain("getUserBucket");
      expect(source).toContain("@feature_flags:bucket");
    });

    it("generates bucket between 0-99", () => {
      expect(source).toContain("Math.floor(Math.random() * 100)");
    });

    it("checks rollout percentage against bucket", () => {
      expect(source).toContain("bucket < flag.rolloutPercentage");
    });
  });

  describe("Platform Filtering", () => {
    it("checks platform eligibility", () => {
      expect(source).toContain("flag.platforms.includes(platform)");
    });

    it("disables flags for non-matching platforms", () => {
      expect(source).toContain("enabled: false");
    });
  });

  describe("Event Tracking", () => {
    it("stores events in AsyncStorage", () => {
      expect(source).toContain("@feature_flags:events");
    });

    it("limits stored events to 200", () => {
      expect(source).toContain("events.slice(-200)");
    });

    it("logs events in dev mode", () => {
      expect(source).toContain("__DEV__");
      expect(source).toContain("[FeatureFlags] Experiment event:");
    });
  });
});

describe("useFeatureFlags Hook", () => {
  const source = fs.readFileSync(HOOK_PATH, "utf-8");

  it("exports useFeatureFlags hook", () => {
    expect(source).toContain("export function useFeatureFlags()");
  });

  it("returns loading state", () => {
    expect(source).toContain("loading: boolean");
    expect(source).toContain("const [loading, setLoading] = useState(true)");
  });

  it("returns isEnabled function", () => {
    expect(source).toContain("isEnabled: (key: string) => boolean");
  });

  it("returns getVariant function", () => {
    expect(source).toContain("getVariant: (key: string) => string | undefined");
  });

  it("returns track function", () => {
    expect(source).toContain("track: (experiment: string, variant: string, event: string) => void");
  });

  it("returns reload function", () => {
    expect(source).toContain("reload: () => Promise<void>");
  });

  it("imports from feature-flags module", () => {
    expect(source).toContain("from \"@/lib/feature-flags\"");
  });

  it("uses useCallback for memoization", () => {
    expect(source).toContain("useCallback");
  });

  it("loads flags on mount via useEffect", () => {
    expect(source).toContain("useEffect");
    expect(source).toContain("loadFlags()");
  });
});
