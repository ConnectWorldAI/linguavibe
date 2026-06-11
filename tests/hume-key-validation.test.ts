import { describe, it, expect } from "vitest";

describe("Hume API Key Validation", () => {
  it("HUME_API_KEY is set and non-empty", () => {
    const key = process.env.HUME_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(0);
  });

  it("HUME_SECRET_KEY is set and non-empty", () => {
    const key = process.env.HUME_SECRET_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(0);
  });

  it("HUME_API_KEY can authenticate with Hume API", async () => {
    const apiKey = process.env.HUME_API_KEY;
    if (!apiKey) {
      throw new Error("HUME_API_KEY not set");
    }
    // Call a lightweight Hume endpoint to validate the key
    const response = await fetch("https://api.hume.ai/v0/evi/configs", {
      method: "GET",
      headers: {
        "X-Hume-Api-Key": apiKey,
      },
    });
    // 200 = valid key, 401/403 = invalid key
    // We accept 200 or any non-auth-error as valid
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });
});
