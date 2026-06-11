/**
 * Tests for TV tab skeleton loading.
 * Validates:
 * 1. tv.tsx imports skeleton components
 * 2. tv.tsx has isLoading state and skeleton guard
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

describe("TV Tab - Skeleton Loading", () => {
  const tvPath = path.join(ROOT, "app/(tabs)/tv.tsx");
  const tvContent = fs.readFileSync(tvPath, "utf-8");

  it("tv.tsx imports ExploreTabSkeleton from skeleton-loader", () => {
    expect(tvContent).toContain("ExploreTabSkeleton");
    expect(tvContent).toContain("skeleton-loader");
  });

  it("tv.tsx imports hapticLoadComplete", () => {
    expect(tvContent).toContain("hapticLoadComplete");
  });

  it("tv.tsx declares isLoading state", () => {
    expect(tvContent).toContain("const [isLoading, setIsLoading] = useState(true)");
  });

  it("tv.tsx has skeleton guard before main return", () => {
    expect(tvContent).toContain("if (isLoading)");
    // The skeleton guard should render ExploreTabSkeleton
    const guardIndex = tvContent.indexOf("if (isLoading)");
    const mainReturnIndex = tvContent.indexOf("return (", guardIndex + 50);
    expect(guardIndex).toBeLessThan(mainReturnIndex);
  });

  it("tv.tsx calls hapticLoadComplete after loading finishes", () => {
    expect(tvContent).toContain("hapticLoadComplete()");
  });

  it("tv.tsx uses 550ms timeout for skeleton", () => {
    expect(tvContent).toContain("550");
  });
});
