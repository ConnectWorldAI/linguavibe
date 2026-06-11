import { describe, it, expect } from "vitest";

describe("Apify API Token Validation", () => {
  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

  it("should have APIFY_API_TOKEN set", () => {
    expect(APIFY_API_TOKEN).toBeDefined();
    expect(APIFY_API_TOKEN!.length).toBeGreaterThan(10);
    expect(APIFY_API_TOKEN!.startsWith("apify_api_")).toBe(true);
  });

  it("should authenticate with Apify API", async () => {
    const response = await fetch(
      `https://api.apify.com/v2/users/me?token=${APIFY_API_TOKEN}`
    );
    expect(response.status).toBe(200);
    const data = await response.json() as { data?: { username?: string } };
    expect(data.data).toBeDefined();
    expect(data.data!.username).toBeDefined();
    console.log(`Apify account verified: ${data.data!.username}`);
  });
});
