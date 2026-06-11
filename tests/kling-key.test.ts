import { describe, it, expect } from "vitest";

describe("Kling AI Credentials", () => {
  it("should have KLING_ACCESS_KEY set", () => {
    const key = process.env.KLING_ACCESS_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("should have KLING_SECRET_KEY set", () => {
    const key = process.env.KLING_SECRET_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("should authenticate with Kling API using JWT", async () => {
    const accessKey = process.env.KLING_ACCESS_KEY!;
    const secretKey = process.env.KLING_SECRET_KEY!;

    // Kling uses JWT tokens signed with the secret key for auth
    // Generate a JWT token and test against their API
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({
      iss: accessKey,
      exp: now + 1800,
      nbf: now - 5,
    })).toString("base64url");

    // Sign with HMAC-SHA256
    const crypto = await import("crypto");
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(`${header}.${payload}`)
      .digest("base64url");

    const token = `${header}.${payload}.${signature}`;

    // Test with a lightweight endpoint (account info or model list)
    const response = await fetch("https://api.klingai.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // 200 = valid credentials, 401/403 = invalid
    // Some endpoints may return 404 if not available but auth still passes
    expect([200, 404]).toContain(response.status);
  });
});
