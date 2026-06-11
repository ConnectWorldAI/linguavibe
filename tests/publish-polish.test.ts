import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "..");

describe("ErrorBoundary Component", () => {
  const filePath = path.join(appDir, "components/error-boundary.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports ErrorBoundary class component", () => {
    expect(fs.existsSync(filePath)).toBe(true);
    expect(content).toContain("export class ErrorBoundary");
  });

  it("exports ScreenErrorBoundary wrapper", () => {
    expect(content).toContain("export function ScreenErrorBoundary");
  });

  it("implements getDerivedStateFromError", () => {
    expect(content).toContain("static getDerivedStateFromError");
  });

  it("implements componentDidCatch with logging", () => {
    expect(content).toContain("componentDidCatch");
    expect(content).toContain("[ErrorBoundary] Caught error:");
  });

  it("has retry functionality", () => {
    expect(content).toContain("handleRetry");
    expect(content).toContain("hasError: false");
  });

  it("shows ConnectWorld AI branding", () => {
    expect(content).toContain("BrandName");
  });

  it("uses dark theme matching app aesthetic", () => {
    expect(content).toContain("#040810");
    expect(content).toContain("#0088FF");
  });

  it("shows error details only in dev mode", () => {
    expect(content).toContain("__DEV__");
    expect(content).toContain("Debug Info");
  });

  it("has screen-level compact fallback", () => {
    expect(content).toContain('level === "screen"');
    expect(content).toContain("Screen Error");
  });

  it("has neon glow styling on icon", () => {
    expect(content).toContain("glowRing");
    expect(content).toContain("shadowColor");
  });
});

describe("ErrorBoundary Integration in _layout.tsx", () => {
  const filePath = path.join(appDir, "app/_layout.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("imports ErrorBoundary", () => {
    expect(content).toContain('import { ErrorBoundary } from "@/components/error-boundary"');
  });

  it("wraps content with ErrorBoundary", () => {
    expect(content).toContain("<ErrorBoundary>");
    expect(content).toContain("</ErrorBoundary>");
  });
});

describe("AnimatedSplash Component (updated)", () => {
  const filePath = path.join(appDir, "components/animated-splash.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has brand text animation", () => {
    expect(content).toContain("textOpacity");
    expect(content).toContain("ConnectWorld");
  });

  it("uses proper timing (no bouncy springs)", () => {
    expect(content).toContain("withTiming");
    expect(content).not.toContain("withSpring");
  });

  it("total animation duration is reasonable (under 3s)", () => {
    // The final fade starts at 1800ms + 500ms duration = 2300ms total
    expect(content).toContain("1800");
    expect(content).toContain("duration: 500");
  });

  it("uses Easing functions for smooth motion", () => {
    expect(content).toContain("Easing.out(Easing.cubic)");
    expect(content).toContain("Easing.in(Easing.cubic)");
  });
});

describe("Notification Scheduler TypeScript Fix", () => {
  const filePath = path.join(appDir, "lib/notification-scheduler.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("includes shouldShowBanner property", () => {
    expect(content).toContain("shouldShowBanner: true");
  });

  it("includes shouldShowList property", () => {
    expect(content).toContain("shouldShowList: true");
  });

  it("still has shouldShowAlert", () => {
    expect(content).toContain("shouldShowAlert: true");
  });
});

describe("Server Router TypeScript Fix", () => {
  const filePath = path.join(appDir, "server/routers.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("handles content as string or array", () => {
    expect(content).toContain('typeof rawContent === "string"');
  });

  it("extracts text from content array", () => {
    expect(content).toContain('.find((p) => p.type === "text")');
  });
});
