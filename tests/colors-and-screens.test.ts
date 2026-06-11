import { describe, it, expect } from "vitest";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

describe("Colors.ts exports", () => {
  it("should export Colors with all required properties", () => {
    expect(Colors.primary).toBe("#040810");
    expect(Colors.secondary).toBe("#00AAFF");
    expect(Colors.glow).toBe("#00CCFF");
    expect(Colors.glowBorder).toBe("rgba(0, 170, 255, 0.45)");
    expect(Colors.glowShadow).toBe("rgba(0, 170, 255, 0.55)");
    expect(Colors.glowSubtle).toBe("rgba(0, 204, 255, 0.10)");
    expect(Colors.gold).toBe("#FFB800");
    expect(Colors.accent).toBe("#FF2D2D");
    expect(Colors.success).toBe("#00FF88");
    expect(Colors.warning).toBe("#FFD600");
    expect(Colors.error).toBe("#FF4444");
    expect(Colors.textPrimary).toBe("#FFFFFF");
    expect(Colors.textSecondary).toBe("#7EB8E0");
    expect(Colors.textMuted).toBe("#3D5A7A");
    expect(Colors.textAccent).toBe("#00CCFF");
    expect(Colors.surfaceCard).toBe("#0A1628");
    expect(Colors.surfaceElevated).toBe("#0E1E38");
  });

  it("should export gradient colors", () => {
    expect(Colors.gradient).toBeDefined();
    expect(Colors.gradient.primary).toHaveLength(2);
    expect(Colors.gradient.blue).toHaveLength(2);
    expect(Colors.gradient.accent).toHaveLength(2);
    expect(Colors.gradient.gold).toHaveLength(2);
  });

  it("should export glow border colors for different accents", () => {
    expect(Colors.goldBorder).toBe("rgba(255, 184, 0, 0.45)");
    expect(Colors.redBorder).toBe("rgba(255, 45, 45, 0.35)");
    expect(Colors.greenBorder).toBe("rgba(0, 255, 136, 0.35)");
    expect(Colors.yellowBorder).toBe("rgba(255, 214, 0, 0.35)");
  });
});

describe("Spacing exports", () => {
  it("should export all spacing values", () => {
    expect(Spacing.xs).toBe(4);
    expect(Spacing.sm).toBe(8);
    expect(Spacing.md).toBe(14);
    expect(Spacing.lg).toBe(20);
    expect(Spacing.xl).toBe(28);
    expect(Spacing.xxl).toBe(40);
  });
});

describe("BorderRadius exports", () => {
  it("should export all border radius values", () => {
    expect(BorderRadius.sm).toBe(8);
    expect(BorderRadius.md).toBe(12);
    expect(BorderRadius.lg).toBe(16);
    expect(BorderRadius.xl).toBe(22);
    expect(BorderRadius.full).toBe(999);
  });
});

describe("FontSize exports", () => {
  it("should export all font size values", () => {
    expect(FontSize.xs).toBe(11);
    expect(FontSize.sm).toBe(13);
    expect(FontSize.md).toBe(15);
    expect(FontSize.lg).toBe(18);
    expect(FontSize.xl).toBe(24);
    expect(FontSize.xxl).toBe(32);
    expect(FontSize.hero).toBe(38);
  });
});
