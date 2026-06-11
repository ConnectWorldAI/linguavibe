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
  },
}));

// Mock react-native-purchases
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
  },
  LOG_LEVEL: { DEBUG: "DEBUG", VERBOSE: "VERBOSE" },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: "PURCHASE_CANCELLED" },
}));

describe("RevenueCat Service Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports all required functions", async () => {
    const rc = await import("../lib/revenuecat");
    expect(rc.initializeRevenueCat).toBeDefined();
    expect(rc.getSubscriptionStatus).toBeDefined();
    expect(rc.getAvailablePackages).toBeDefined();
    expect(rc.purchasePackage).toBeDefined();
    expect(rc.restorePurchases).toBeDefined();
    expect(rc.identifyUser).toBeDefined();
    expect(rc.logOutUser).toBeDefined();
    expect(rc.openManageSubscriptions).toBeDefined();
  });

  it("exports entitlement constants", async () => {
    const rc = await import("../lib/revenuecat");
    expect(rc.ENTITLEMENTS.PLUS).toBe("plus_access");
    expect(rc.ENTITLEMENTS.PRO).toBe("pro_access");
    expect(rc.ENTITLEMENTS.ENTERPRISE).toBe("enterprise_access");
  });

  it("exports product ID constants", async () => {
    const rc = await import("../lib/revenuecat");
    expect(rc.PRODUCT_IDS.PLUS_MONTHLY).toBe("connectworld_plus_monthly");
    expect(rc.PRODUCT_IDS.PLUS_YEARLY).toBe("connectworld_plus_yearly");
    expect(rc.PRODUCT_IDS.PRO_MONTHLY).toBe("connectworld_pro_monthly");
    expect(rc.PRODUCT_IDS.PRO_YEARLY).toBe("connectworld_pro_yearly");
    expect(rc.PRODUCT_IDS.ENTERPRISE_MONTHLY).toBe("connectworld_enterprise_monthly");
    expect(rc.PRODUCT_IDS.ENTERPRISE_YEARLY).toBe("connectworld_enterprise_yearly");
  });

  it("getAvailablePackages returns fallback packages when offerings unavailable", async () => {
    const rc = await import("../lib/revenuecat");
    await rc.initializeRevenueCat();
    const packages = await rc.getAvailablePackages();
    expect(packages.length).toBe(6);
    expect(packages[0].planId).toBe("plus");
    expect(packages[0].billingCycle).toBe("monthly");
    expect(packages[1].planId).toBe("plus");
    expect(packages[1].billingCycle).toBe("yearly");
  });

  it("getSubscriptionStatus returns free plan when no active entitlements", async () => {
    const rc = await import("../lib/revenuecat");
    await rc.initializeRevenueCat();
    const status = await rc.getSubscriptionStatus();
    expect(status.plan).toBe("free");
    expect(status.isActive).toBe(false);
  });

  it("restorePurchases returns subscription status", async () => {
    const rc = await import("../lib/revenuecat");
    await rc.initializeRevenueCat();
    const status = await rc.restorePurchases();
    expect(status.plan).toBe("free");
  });
});

describe("Payment Setup Screen", () => {
  it("payment-setup.tsx imports RevenueCat functions", async () => {
    // Verify the file can be parsed (import check)
    const fs = await import("fs");
    const content = fs.readFileSync("app/payment-setup.tsx", "utf-8");
    expect(content).toContain("from \"../lib/revenuecat\"");
    expect(content).toContain("getSubscriptionStatus");
    expect(content).toContain("getAvailablePackages");
    expect(content).toContain("purchasePackage");
    expect(content).toContain("restorePurchases");
    expect(content).toContain("openManageSubscriptions");
  });

  it("payment-setup.tsx has Restore Purchases button", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/payment-setup.tsx", "utf-8");
    expect(content).toContain("Restore Purchases");
  });

  it("payment-setup.tsx has legal subscription text", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/payment-setup.tsx", "utf-8");
    expect(content).toContain("Subscriptions auto-renew");
    expect(content).toContain("24 hours before the end");
  });

  it("payment-setup.tsx has manage subscription tab", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/payment-setup.tsx", "utf-8");
    expect(content).toContain("renderManage");
    expect(content).toContain("Manage Subscription");
  });
});

describe("use-subscription hook RevenueCat integration", () => {
  it("use-subscription imports getSubscriptionStatus from revenuecat", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("hooks/use-subscription.ts", "utf-8");
    expect(content).toContain("import { getSubscriptionStatus, onSubscriptionChange } from");
    expect(content).toContain("revenuecat");
  });

  it("use-subscription checks RevenueCat first before AsyncStorage", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("hooks/use-subscription.ts", "utf-8");
    expect(content).toContain("First try RevenueCat");
    expect(content).toContain("Fallback to local storage");
  });
});

describe("Root layout RevenueCat initialization", () => {
  it("_layout.tsx imports and calls initializeRevenueCat", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/_layout.tsx", "utf-8");
    expect(content).toContain("import { initializeRevenueCat }");
    expect(content).toContain("initializeRevenueCat()");
  });
});
