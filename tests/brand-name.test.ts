import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("BrandName Component", () => {
  const componentPath = path.resolve(__dirname, "../components/brand-name.tsx");
  const content = fs.readFileSync(componentPath, "utf-8");

  it("exports BrandName component", () => {
    expect(content).toContain("export function BrandName(");
  });

  it("exports BrandLockup component", () => {
    expect(content).toContain("export function BrandLockup(");
  });

  it("exports BrandNameInline component", () => {
    expect(content).toContain("export function BrandNameInline(");
  });

  it("uses DancingScript-Regular font for sm/md/lg sizes", () => {
    expect(content).toContain("DancingScript-Regular");
  });

  it("uses DancingScript-Bold font for xl size", () => {
    expect(content).toContain("DancingScript-Bold");
  });

  it("has glow support with textShadow for web", () => {
    expect(content).toContain("textShadow");
    expect(content).toContain("textShadowColor");
    expect(content).toContain("textShadowRadius");
  });

  it("includes the correct tagline text", () => {
    expect(content).toContain("Learn And Hear The World Your Way!");
  });

  it("references the app icon for lockup", () => {
    expect(content).toContain("assets/images/icon.png");
  });
});

describe("Font files exist", () => {
  const fontsDir = path.resolve(__dirname, "../assets/fonts");

  it("DancingScript-Regular.otf exists", () => {
    expect(fs.existsSync(path.join(fontsDir, "DancingScript-Regular.otf"))).toBe(true);
  });

  it("DancingScript-Bold.ttf exists", () => {
    expect(fs.existsSync(path.join(fontsDir, "DancingScript-Bold.ttf"))).toBe(true);
  });
});

describe("BrandName glow prop is applied across screens", () => {
  const screens = [
    { name: "home", path: "../app/(tabs)/index.tsx" },
    { name: "login", path: "../app/login.tsx" },
    { name: "onboarding", path: "../app/onboarding.tsx" },
    { name: "signup", path: "../app/signup.tsx" },
    { name: "agent-context", path: "../lib/agent-context.tsx" },
  ];

  screens.forEach(({ name, path: filePath }) => {
    it(`${name} screen uses glow prop`, () => {
      const content = fs.readFileSync(path.resolve(__dirname, filePath), "utf-8");
      expect(content).toContain("glow");
    });
  });
});
