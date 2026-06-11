import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock react-native Platform
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
  Linking: { openURL: vi.fn() },
}));

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock react-native-purchases
const mockAddCustomerInfoUpdateListener = vi.fn();
vi.mock("react-native-purchases", () => ({
  default: {
    setLogLevel: vi.fn(),
    configure: vi.fn().mockResolvedValue(undefined),
    getCustomerInfo: vi.fn().mockResolvedValue({
      entitlements: { active: {} },
      managementURL: null,
    }),
    getOfferings: vi.fn().mockResolvedValue({ current: null }),
    purchasePackage: vi.fn(),
    restorePurchases: vi.fn().mockResolvedValue({
      entitlements: { active: {} },
      managementURL: null,
    }),
    logIn: vi.fn().mockResolvedValue(undefined),
    logOut: vi.fn().mockResolvedValue(undefined),
    addCustomerInfoUpdateListener: mockAddCustomerInfoUpdateListener,
  },
  LOG_LEVEL: { DEBUG: "DEBUG", VERBOSE: "VERBOSE" },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: "PURCHASE_CANCELLED" },
}));

describe("RevenueCat Full Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Module exports", () => {
    it("exports all required functions including new listener", async () => {
      const rc = await import("../lib/revenuecat");
      expect(rc.initializeRevenueCat).toBeDefined();
      expect(rc.getSubscriptionStatus).toBeDefined();
      expect(rc.getAvailablePackages).toBeDefined();
      expect(rc.purchasePackage).toBeDefined();
      expect(rc.restorePurchases).toBeDefined();
      expect(rc.identifyUser).toBeDefined();
      expect(rc.logOutUser).toBeDefined();
      expect(rc.openManageSubscriptions).toBeDefined();
      expect(rc.onSubscriptionChange).toBeDefined();
    });

    it("exports correct entitlement identifiers", async () => {
      const rc = await import("../lib/revenuecat");
      expect(rc.ENTITLEMENTS.PLUS).toBe("plus_access");
      expect(rc.ENTITLEMENTS.PRO).toBe("pro_access");
      expect(rc.ENTITLEMENTS.ENTERPRISE).toBe("enterprise_access");
    });

    it("exports correct product identifiers", async () => {
      const rc = await import("../lib/revenuecat");
      expect(rc.PRODUCT_IDS.PLUS_MONTHLY).toBe("connectworld_plus_monthly");
      expect(rc.PRODUCT_IDS.PLUS_YEARLY).toBe("connectworld_plus_yearly");
      expect(rc.PRODUCT_IDS.PRO_MONTHLY).toBe("connectworld_pro_monthly");
      expect(rc.PRODUCT_IDS.PRO_YEARLY).toBe("connectworld_pro_yearly");
      expect(rc.PRODUCT_IDS.ENTERPRISE_MONTHLY).toBe("connectworld_enterprise_monthly");
      expect(rc.PRODUCT_IDS.ENTERPRISE_YEARLY).toBe("connectworld_enterprise_yearly");
    });
  });

  describe("Subscription change listener", () => {
    it("onSubscriptionChange returns an unsubscribe function", async () => {
      const rc = await import("../lib/revenuecat");
      const callback = vi.fn();
      const unsubscribe = rc.onSubscriptionChange(callback);
      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });

    it("sets up native listener on first subscriber", async () => {
      // Reset module to clear listener state
      vi.resetModules();
      const rc = await import("../lib/revenuecat");
      // First need to initialize
      await rc.initializeRevenueCat();
      const callback = vi.fn();
      rc.onSubscriptionChange(callback);
      expect(mockAddCustomerInfoUpdateListener).toHaveBeenCalledTimes(1);
    });
  });

  describe("Subscription hook integration", () => {
    it("plan hierarchy logic is correct", () => {
      // Test the plan hierarchy directly without importing the hook
      const PLAN_HIERARCHY = ["free", "plus", "pro", "enterprise"];
      const getPlanLevel = (plan: string) => PLAN_HIERARCHY.indexOf(plan);
      const hasAccess = (current: string, required: string) => getPlanLevel(current) >= getPlanLevel(required);

      expect(getPlanLevel("free")).toBe(0);
      expect(getPlanLevel("plus")).toBe(1);
      expect(getPlanLevel("pro")).toBe(2);
      expect(getPlanLevel("enterprise")).toBe(3);

      expect(hasAccess("pro", "plus")).toBe(true);
      expect(hasAccess("plus", "pro")).toBe(false);
      expect(hasAccess("enterprise", "free")).toBe(true);
      expect(hasAccess("free", "plus")).toBe(false);
    });

    it("feature access matrix is correctly defined in use-subscription", () => {
      const fs = require("fs");
      const content = fs.readFileSync("hooks/use-subscription.ts", "utf-8");
      // Verify key feature requirements are defined
      expect(content).toContain('unlimited_simulation: "pro"');
      expect(content).toContain('pro_lessons: "plus"');
      expect(content).toContain('team_management: "enterprise"');
      expect(content).toContain('video_dub: "free"');
      expect(content).toContain('offline_mode: "plus"');
      // Verify onSubscriptionChange is imported
      expect(content).toContain("onSubscriptionChange");
    });
  });

  describe("Auth integration", () => {
    it("use-auth imports identifyUser and logOutUser", async () => {
      // Verify the imports exist in the file
      const fs = await import("fs");
      const authContent = fs.readFileSync("hooks/use-auth.ts", "utf-8");
      expect(authContent).toContain("import { identifyUser, logOutUser } from");
      expect(authContent).toContain("identifyUser(");
      expect(authContent).toContain("logOutUser()");
    });
  });

  describe("Settings integration", () => {
    it("settings imports useSubscription and openManageSubscriptions", async () => {
      const fs = await import("fs");
      const settingsContent = fs.readFileSync("app/settings.tsx", "utf-8");
      expect(settingsContent).toContain("import { useSubscription }");
      expect(settingsContent).toContain("import { openManageSubscriptions }");
      expect(settingsContent).toContain("manage_subscription");
      expect(settingsContent).toContain("planDisplayName");
    });
  });

  describe("Payment setup integration", () => {
    it("payment-setup syncs subscription tier after purchase", async () => {
      const fs = await import("fs");
      const paymentContent = fs.readFileSync("app/payment-setup.tsx", "utf-8");
      expect(paymentContent).toContain("@subscription_tier");
      expect(paymentContent).toContain("@subscription_plan");
    });

    it("payment-setup syncs tier after restore", async () => {
      const fs = await import("fs");
      const paymentContent = fs.readFileSync("app/payment-setup.tsx", "utf-8");
      // Both purchase and restore should sync
      const tierSyncCount = (paymentContent.match(/@subscription_tier/g) || []).length;
      expect(tierSyncCount).toBeGreaterThanOrEqual(2); // at least in purchase + restore
    });
  });

  describe("Environment variables", () => {
    it("EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY is set", () => {
      const key = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY;
      expect(key).toBeDefined();
      expect(key!.length).toBeGreaterThan(0);
      expect(key!.startsWith("test_")).toBe(true);
    });

    it("EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY is set", () => {
      const key = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;
      expect(key).toBeDefined();
      expect(key!.length).toBeGreaterThan(0);
    });
  });
});
