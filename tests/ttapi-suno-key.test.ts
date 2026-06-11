import { describe, it, expect } from "vitest";

describe("TTAPI Suno API Key Validation", () => {
  it("should authenticate with the TTAPI gateway", { timeout: 30000 }, async () => {
    const apiKey = process.env.TTAPI_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");

    // Test with a lightweight request to check auth
    const response = await fetch("https://api.ttapi.io/suno/v1/music", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "TT-API-KEY": apiKey!,
      },
      body: JSON.stringify({
        custom: false,
        instrumental: true,
        mv: "chirp-v5",
        tags: "test, ambient, short",
      }),
    });

    // A valid key should return 200 (SUCCESS) or a quota-related error
    // An invalid key returns 401 or 403
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);

    const data = await response.json();
    // Valid responses have status SUCCESS or a known error (not auth failure)
    if (response.status === 200) {
      expect(data.status).toBe("SUCCESS");
      expect(data.data?.jobId).toBeDefined();
    }
  });
});
