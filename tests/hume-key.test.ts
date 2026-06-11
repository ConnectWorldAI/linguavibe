import { describe, it, expect } from "vitest";

describe("Hume AI API Key Validation", () => {
  it("should authenticate with Hume AI API", async () => {
    const apiKey = process.env.HUME_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.length).toBeGreaterThan(10);

    // Test the Hume API by listing available models/configs
    const response = await fetch("https://api.hume.ai/v0/evi/configs", {
      method: "GET",
      headers: {
        "X-Hume-Api-Key": apiKey!,
      },
    });

    // 200 = valid key with configs, 401 = invalid key
    expect(response.status).not.toBe(401);
    expect([200, 404].includes(response.status) || response.ok).toBe(true);
  });

  it("should have Hume Secret Key set", () => {
    const secretKey = process.env.HUME_SECRET_KEY;
    expect(secretKey).toBeDefined();
    expect(secretKey!.length).toBeGreaterThan(10);
  });
});
