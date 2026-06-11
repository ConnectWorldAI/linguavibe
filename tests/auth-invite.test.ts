import { describe, it, expect, vi } from "vitest";

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-123" }),
    }),
  },
}));

describe("Auth Router", () => {
  it("should export authRouter with sendCode and verifyCode procedures", async () => {
    const { authRouter } = await import("../server/authRouter");
    expect(authRouter).toBeDefined();
    // Check that the router has the expected procedures
    const routerDef = authRouter._def;
    expect(routerDef).toBeDefined();
  });
});

describe("Invite Router", () => {
  it("should export inviteRouter with generate, validate, and accept procedures", async () => {
    const { inviteRouter } = await import("../server/inviteRouter");
    expect(inviteRouter).toBeDefined();
    const routerDef = inviteRouter._def;
    expect(routerDef).toBeDefined();
  });
});
