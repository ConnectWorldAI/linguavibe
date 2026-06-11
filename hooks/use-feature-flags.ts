/**
 * React hook for accessing feature flags and experiment variants.
 * 
 * Usage:
 * ```tsx
 * const { isEnabled, getVariant, loading } = useFeatureFlags();
 * 
 * if (isEnabled("onboarding_skip_dialect_single")) {
 *   // Skip dialect picker for single-dialect languages
 * }
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import {
  initFeatureFlags,
  type FeatureFlag,
  trackExperiment,
} from "@/lib/feature-flags";

interface UseFeatureFlagsReturn {
  /** Whether flags are still loading */
  loading: boolean;
  /** Check if a flag is enabled */
  isEnabled: (key: string) => boolean;
  /** Get the variant for an experiment flag */
  getVariant: (key: string) => string | undefined;
  /** Get the full flag object */
  getFlag: (key: string) => FeatureFlag | undefined;
  /** Track an experiment event */
  track: (experiment: string, variant: string, event: string) => void;
  /** Reload flags from storage */
  reload: () => Promise<void>;
}

export function useFeatureFlags(): UseFeatureFlagsReturn {
  const [flags, setFlags] = useState<Map<string, FeatureFlag>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadFlags = useCallback(async () => {
    try {
      const resolved = await initFeatureFlags();
      setFlags(resolved);
    } catch {
      // Use empty map on failure
      setFlags(new Map());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const isEnabled = useCallback(
    (key: string): boolean => {
      return flags.get(key)?.enabled ?? false;
    },
    [flags]
  );

  const getVariant = useCallback(
    (key: string): string | undefined => {
      const flag = flags.get(key);
      if (!flag?.enabled) return undefined;
      return flag.variant;
    },
    [flags]
  );

  const getFlag = useCallback(
    (key: string): FeatureFlag | undefined => {
      return flags.get(key);
    },
    [flags]
  );

  const track = useCallback(
    (experiment: string, variant: string, event: string) => {
      trackExperiment(experiment, variant, event).catch(() => {});
    },
    []
  );

  const reload = useCallback(async () => {
    setLoading(true);
    await loadFlags();
  }, [loadFlags]);

  return { loading, isEnabled, getVariant, getFlag, track, reload };
}
