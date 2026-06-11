import { describe, it, expect } from "vitest";

describe("Twilio credentials validation", () => {
  it("should have TWILIO_ACCOUNT_SID set and formatted correctly", () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    expect(sid).toBeDefined();
    expect(sid).toMatch(/^AC[a-f0-9]{32}$/);
  });

  it("should have TWILIO_AUTH_TOKEN set and formatted correctly", () => {
    const token = process.env.TWILIO_AUTH_TOKEN;
    expect(token).toBeDefined();
    expect(token).toMatch(/^[a-f0-9]{32}$/);
  });

  it("should authenticate with Twilio API", async () => {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const token = process.env.TWILIO_AUTH_TOKEN!;

    // Call Twilio's Account API to verify credentials
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}.json`,
      {
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.sid).toBe(sid);
    expect(data.status).toBe("active");
  });
});
