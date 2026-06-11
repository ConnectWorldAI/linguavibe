import { describe, it, expect } from "vitest";

describe("OpenAI API Key Validation", () => {
  it("should successfully call the OpenAI API with the provided key", async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.startsWith("sk-")).toBe(true);

    // Make a minimal API call to validate the key works
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  });
});
