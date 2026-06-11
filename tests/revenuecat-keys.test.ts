import { describe, it, expect } from "vitest";

describe("RevenueCat API Key Validation", () => {
  it("EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY is set", () => {
    const key = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    // RevenueCat public API keys typically start with "appl_" for Apple
    expect(typeof key).toBe("string");
  });

  it("EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY is set", () => {
    const key = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    // RevenueCat public API keys typically start with "goog_" for Google
    expect(typeof key).toBe("string");
  });
});
