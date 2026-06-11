import { describe, it, expect } from "vitest";

describe("ElevenLabs API Key Validation", () => {
  it("should successfully call the ElevenLabs API with the provided key", async () => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.startsWith("sk_")).toBe(true);

    // Make a minimal API call to validate the key works - list available voices
    const response = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: {
        "xi-api-key": apiKey!,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.subscription).toBeDefined();
  });
});
