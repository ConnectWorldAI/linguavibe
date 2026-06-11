import { describe, it, expect } from "vitest";

describe("Apify API Token Validation", () => {
  it("should successfully call the Apify API with the provided token", async () => {
    const token = process.env.APIFY_API_TOKEN;
    expect(token).toBeDefined();
    expect(token!.startsWith("apify_api_")).toBe(true);

    // Make a minimal API call to validate the token works - get user limits
    const response = await fetch(
      `https://api.apify.com/v2/users/me/limits?token=${token}`
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeDefined();
  });
});
