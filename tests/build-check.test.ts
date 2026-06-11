import { describe, it, expect } from "vitest";
import { themeColors } from "../theme.config";

describe("Theme Configuration", () => {
  it("exports all required color tokens", () => {
    expect(themeColors).toBeDefined();
    expect(themeColors.primary).toHaveProperty("light");
    expect(themeColors.primary).toHaveProperty("dark");
    expect(themeColors.background).toHaveProperty("light");
    expect(themeColors.background).toHaveProperty("dark");
    expect(themeColors.surface).toBeDefined();
    expect(themeColors.foreground).toBeDefined();
    expect(themeColors.muted).toBeDefined();
    expect(themeColors.border).toBeDefined();
    expect(themeColors.success).toBeDefined();
    expect(themeColors.warning).toBeDefined();
    expect(themeColors.error).toBeDefined();
  });

  it("has dark mode colors matching ConnectWorld AI brand", () => {
    // Deep navy background
    expect(themeColors.background.dark).toBe("#040810");
    // Electric blue primary (neon blue from logo)
    expect(themeColors.primary.dark).toBe("#00AAFF");
  });
});

describe("Colors.ts (custom futuristic palette)", () => {
  it("exports Colors with all required properties", async () => {
    const { Colors } = await import("../constants/Colors");
    expect(Colors).toBeDefined();
    expect(Colors.primary).toBeDefined();
    expect(Colors.secondary).toBeDefined();
    expect(Colors.glow).toBeDefined();
    expect(Colors.gold).toBeDefined();
    expect(Colors.accent).toBeDefined();
    expect(Colors.textPrimary).toBeDefined();
    expect(Colors.textSecondary).toBeDefined();
    expect(Colors.surfaceCard).toBeDefined();
    expect(Colors.gradient).toBeDefined();
  });

  it("exports Spacing, BorderRadius, FontSize", async () => {
    const { Spacing, BorderRadius, FontSize } = await import("../constants/Colors");
    expect(Spacing).toBeDefined();
    expect(Spacing.md).toBeGreaterThan(0);
    expect(BorderRadius).toBeDefined();
    expect(BorderRadius.lg).toBeGreaterThan(0);
    expect(FontSize).toBeDefined();
    expect(FontSize.lg).toBeGreaterThan(0);
  });
});
