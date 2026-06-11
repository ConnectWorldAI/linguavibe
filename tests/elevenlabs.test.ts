import { describe, it, expect } from "vitest";

describe("ElevenLabs API Key Validation", () => {
  it("should authenticate with ElevenLabs API", async () => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    expect(apiKey).toBeTruthy();

    // Call the lightweight /v1/user endpoint to validate the key
    const response = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: {
        "xi-api-key": apiKey!,
      },
    });

    // 200 = valid key, 401 = invalid key
    expect(response.status).toBe(200);

    const data = await response.json();
    // Verify we get a user object back
    expect(data).toHaveProperty("subscription");
    console.log("ElevenLabs API key is valid. Plan:", data.subscription?.tier);
  });
});
