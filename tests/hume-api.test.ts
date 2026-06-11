import { describe, it, expect } from "vitest";

describe("Hume API Key Validation", () => {
  it("should have HUME_API_KEY configured", () => {
    const key = process.env.HUME_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("should have HUME_SECRET_KEY configured", () => {
    const key = process.env.HUME_SECRET_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("should authenticate with Hume API", async () => {
    const apiKey = process.env.HUME_API_KEY!;
    const secretKey = process.env.HUME_SECRET_KEY!;
    const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");

    const response = await fetch("https://api.hume.ai/oauth2-cc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials",
    });

    // Accept 200 (valid) or 401 (invalid creds but API reachable)
    // We just need to confirm the keys are set and API is reachable
    expect([200, 201]).toContain(response.status);
  });
});
