import { describe, it, expect } from "vitest";

describe("ElevenLabs API Key Validation", () => {
  it("ELEVENLABS_API_KEY is set in environment", () => {
    const key = process.env.ELEVENLABS_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("ELEVENLABS_API_KEY authenticates with ElevenLabs API", async () => {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) {
      console.warn("ELEVENLABS_API_KEY not set, skipping live test");
      return;
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": key,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.voices).toBeDefined();
    expect(Array.isArray(data.voices)).toBe(true);
    console.log(`ElevenLabs: ${data.voices.length} voices available`);
  });

  it("can list available voice models", async () => {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) return;

    const response = await fetch("https://api.elevenlabs.io/v1/models", {
      headers: {
        "xi-api-key": key,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    console.log(`ElevenLabs: ${data.length} models available`);
  });
});
