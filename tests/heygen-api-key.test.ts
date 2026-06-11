import { describe, it, expect } from "vitest";

describe("HeyGen API Key Validation", () => {
  it("should have HEYGEN_API_KEY set", () => {
    const key = process.env.HEYGEN_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("should authenticate with HeyGen API", async () => {
    const key = process.env.HEYGEN_API_KEY;
    if (!key) {
      console.warn("HEYGEN_API_KEY not set, skipping live test");
      return;
    }

    const response = await fetch("https://api.heygen.com/v2/user/remaining_quota", {
      method: "GET",
      headers: {
        "X-Api-Key": key,
        "Accept": "application/json",
      },
    });

    // HeyGen returns 200 for valid keys, 401 for invalid
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
  });
});
