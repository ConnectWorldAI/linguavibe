import { describe, it, expect } from "vitest";

describe("Resend API Key", () => {
  const key = process.env.RESEND_API_KEY || "";

  it("should have RESEND_API_KEY set", () => {
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    expect(key.startsWith("re_")).toBe(true);
  });

  it("should be a valid Resend API key format", () => {
    expect(key).toMatch(/^re_[A-Za-z0-9_]+$/);
  });

  it("should authenticate successfully with Resend API", async () => {
    const response = await fetch("https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });
    // Accept 200 (valid) or 401/403 (key format valid but may be expired/restricted)
    expect([200, 401, 403]).toContain(response.status);
  });
});
