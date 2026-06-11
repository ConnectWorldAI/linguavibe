import { describe, it, expect } from "vitest";

describe("HeyGen Agent API Key Validation", () => {
  it("should have HEYGEN_AGENT_API_KEY set", () => {
    const key = process.env.HEYGEN_AGENT_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });
});
