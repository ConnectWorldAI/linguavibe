import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "..");

describe("Animated Splash Component", () => {
  const filePath = path.join(appDir, "components/animated-splash.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports AnimatedSplash component", () => {
    expect(fs.existsSync(filePath)).toBe(true);
    expect(content).toContain("export function AnimatedSplash");
  });

  it("accepts onFinish callback prop", () => {
    expect(content).toContain("onFinish: () => void");
    expect(content).toContain("runOnJS(onFinish)");
  });

  it("uses react-native-reanimated for animations", () => {
    expect(content).toContain("useSharedValue");
    expect(content).toContain("useAnimatedStyle");
    expect(content).toContain("withTiming");
    expect(content).toContain("withDelay");
    expect(content).toContain("withSequence");
  });

  it("has logo fade-in and scale-up animation", () => {
    expect(content).toContain("logoScale");
    expect(content).toContain("logoOpacity");
  });

  it("has neon glow ring pulse animation", () => {
    expect(content).toContain("glowOpacity");
    expect(content).toContain("glowScale");
    expect(content).toContain("glowRing");
    expect(content).toContain("glowRingOuter");
  });

  it("has container fade-out animation", () => {
    expect(content).toContain("containerOpacity");
    expect(content).toContain("withDelay");
  });

  it("loads the splash-logo.png image", () => {
    expect(content).toContain("splash-logo.png");
    expect(content).toContain("Image");
  });

  it("uses dark background matching app theme", () => {
    expect(content).toContain("#040810");
  });

  it("uses blue neon glow colors", () => {
    expect(content).toContain("0, 136, 255");
    expect(content).toContain("#0088FF");
  });
});

describe("Animated Splash Wiring in _layout.tsx", () => {
  const filePath = path.join(appDir, "app/_layout.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("imports AnimatedSplash component", () => {
    expect(content).toContain('import { AnimatedSplash } from "@/components/animated-splash"');
  });

  it("imports expo-splash-screen", () => {
    expect(content).toContain('import * as SplashScreen from "expo-splash-screen"');
  });

  it("calls preventAutoHideAsync at module level", () => {
    expect(content).toContain("SplashScreen.preventAutoHideAsync()");
  });

  it("calls hideAsync to dismiss native splash", () => {
    expect(content).toContain("SplashScreen.hideAsync()");
  });

  it("has showAnimatedSplash state", () => {
    expect(content).toContain("showAnimatedSplash");
    expect(content).toContain("setShowAnimatedSplash");
  });

  it("renders AnimatedSplash conditionally", () => {
    expect(content).toContain("<AnimatedSplash onFinish=");
    expect(content).toContain("setShowAnimatedSplash(false)");
  });
});

describe("Logo Assets", () => {
  it("splash-logo.png exists in assets", () => {
    const logoPath = path.join(appDir, "assets/images/splash-logo.png");
    expect(fs.existsSync(logoPath)).toBe(true);
  });

  it("icon.png exists in assets", () => {
    const iconPath = path.join(appDir, "assets/images/icon.png");
    expect(fs.existsSync(iconPath)).toBe(true);
  });

  it("splash-icon.png exists in assets", () => {
    const splashPath = path.join(appDir, "assets/images/splash-icon.png");
    expect(fs.existsSync(splashPath)).toBe(true);
  });

  it("android-icon-foreground.png exists in assets", () => {
    const androidPath = path.join(appDir, "assets/images/android-icon-foreground.png");
    expect(fs.existsSync(androidPath)).toBe(true);
  });

  it("favicon.png exists in assets", () => {
    const faviconPath = path.join(appDir, "assets/images/favicon.png");
    expect(fs.existsSync(faviconPath)).toBe(true);
  });
});
