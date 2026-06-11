import { useState, useCallback } from "react";
import { useUsage, type UsageCategory } from "@/lib/usage-context";
import type { PaywallFeature } from "@/components/paywall-modal";

/**
 * Maps usage categories to paywall feature types for the modal
 */
const CATEGORY_TO_FEATURE: Record<UsageCategory, PaywallFeature> = {
  talk: "cloudwave",
  video: "video_translation",
  song: "song_translation",
  teacher: "teacher",
  credits: "ai_chat",
};

/**
 * Maps usage categories to single-purchase prices
 */
const SINGLE_PRICES: Record<UsageCategory, string> = {
  talk: "$1.99",
  video: "$2.99",
  song: "$1.99",
  teacher: "$4.99",
  credits: "$0.99",
};

interface UsePaywallGateReturn {
  /** Whether the paywall modal should be shown */
  showPaywall: boolean;
  /** The feature to display in the paywall */
  paywallFeature: PaywallFeature;
  /** Single purchase price for this feature */
  singlePrice: string;
  /** Check if user can proceed; returns true if allowed, false if blocked (shows paywall) */
  checkAccess: (category: UsageCategory, customFeature?: PaywallFeature) => boolean;
  /** Dismiss the paywall modal */
  dismissPaywall: () => void;
}

/**
 * Hook to gate premium features behind usage limits.
 * Use this in any screen that needs to check free tier limits before performing an action.
 * 
 * Usage:
 * ```tsx
 * const { showPaywall, paywallFeature, singlePrice, checkAccess, dismissPaywall } = usePaywallGate();
 * 
 * const handleTranslate = () => {
 *   if (!checkAccess("credits", "translation")) return; // blocked
 *   // ... proceed with translation
 * };
 * 
 * return (
 *   <>
 *     ...
 *     <PaywallModal visible={showPaywall} feature={paywallFeature} singlePrice={singlePrice} onClose={dismissPaywall} />
 *   </>
 * );
 * ```
 */
export function usePaywallGate(): UsePaywallGateReturn {
  const { isLimitReached, incrementUsage } = useUsage();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<PaywallFeature>("translation");
  const [singlePrice, setSinglePrice] = useState("$0.99");

  const checkAccess = useCallback((category: UsageCategory, customFeature?: PaywallFeature): boolean => {
    if (isLimitReached(category)) {
      setPaywallFeature(customFeature || CATEGORY_TO_FEATURE[category]);
      setSinglePrice(SINGLE_PRICES[category]);
      setShowPaywall(true);
      return false;
    }
    // Increment usage
    incrementUsage(category, 1);
    return true;
  }, [isLimitReached, incrementUsage]);

  const dismissPaywall = useCallback(() => {
    setShowPaywall(false);
  }, []);

  return { showPaywall, paywallFeature, singlePrice, checkAccess, dismissPaywall };
}
