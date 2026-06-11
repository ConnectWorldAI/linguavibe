import { describe, it, expect } from "vitest";

describe("RevenueCat API Key", () => {
  it("should have REVENUECAT_API_KEY environment variable set", () => {
    const key = process.env.REVENUECAT_API_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    expect(key!.length).toBeGreaterThan(10);
  });

  it("should be a valid RevenueCat key format (starts with test_ or appl_ or goog_)", () => {
    const key = process.env.REVENUECAT_API_KEY!;
    const validPrefixes = ["test_", "appl_", "goog_", "strp_"];
    const hasValidPrefix = validPrefixes.some((prefix) => key.startsWith(prefix));
    expect(hasValidPrefix).toBe(true);
  });
});
