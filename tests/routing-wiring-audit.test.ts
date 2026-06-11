import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.join(__dirname, "..", "app");

// Get all .tsx files in app/ (excluding _layout, +not-found, etc.)
function getRouteFiles(): string[] {
  const files: string[] = [];
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".tsx") && !entry.name.startsWith("+")) {
        files.push(fullPath);
      }
    }
  }
  walk(APP_DIR);
  return files;
}

// Extract all router.push/replace route strings from a file
function extractRouteReferences(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const routes: string[] = [];
  // Match router.push("/path" or router.replace("/path"
  const regex = /router\.(push|replace)\("(\/[^"]+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    routes.push(match[2]);
  }
  return routes;
}

// Check if a route file exists
function routeFileExists(routePath: string): boolean {
  // Strip query params and leading slash
  const cleaned = routePath.split("?")[0].replace(/^\//,  "");
  // Handle (tabs) routes
  if (cleaned.startsWith("(tabs)/")) {
    return fs.existsSync(path.join(APP_DIR, cleaned + ".tsx"));
  }
  // Handle (tabs) as a route itself
  if (cleaned === "(tabs)") {
    return fs.existsSync(path.join(APP_DIR, "(tabs)", "index.tsx"));
  }
  return fs.existsSync(path.join(APP_DIR, cleaned + ".tsx"));
}

describe("Routing & Wiring Audit", () => {
  describe("All referenced routes have corresponding files", () => {
    const routeFiles = getRouteFiles();
    const allReferences: { source: string; route: string }[] = [];

    for (const file of routeFiles) {
      const routes = extractRouteReferences(file);
      for (const route of routes) {
        allReferences.push({ source: file, route });
      }
    }

    // Get unique routes
    const uniqueRoutes = [...new Set(allReferences.map((r) => r.route))];

    for (const route of uniqueRoutes) {
      it(`Route "${route}" has a corresponding file`, () => {
        expect(routeFileExists(route)).toBe(true);
      });
    }
  });

  describe("Onboarding screen structure", () => {
    const onboardingPath = path.join(APP_DIR, "onboarding.tsx");
    const content = fs.readFileSync(onboardingPath, "utf-8");

    it("has backButton style defined", () => {
      expect(content).toContain("backButton:");
    });

    it("has back buttons for language selection steps", () => {
      // The renderLanguageSelection function should have a back button
      expect(content).toContain('style={styles.backButton}');
    });

    it("has back buttons in onboarding steps", () => {
      // Onboarding uses backButton style for step navigation
      expect(content).toContain("styles.backButton");
    });

    it("FlatList has keyExtractor for language lists", () => {
      expect(content).toContain("keyExtractor");
    });
  });

  describe("Stack screen registration", () => {
    const layoutPath = path.join(APP_DIR, "_layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");

    const requiredScreens = [
      "onboarding",
      "signup",
      "login",
      "choose-teacher",
      "permissions-setup",
      "level-assessment",
      "cloudwave-guide",
      "teacher-lesson-planner",
      "teacher-dashboard",
      "teacher-assessment",
    ];

    for (const screen of requiredScreens) {
      it(`"${screen}" is registered in Stack`, () => {
        expect(layoutContent).toContain(`name="${screen}"`);
      });
    }
  });

  describe("Teacher tab has no dead buttons", () => {
    const teacherPath = path.join(APP_DIR, "(tabs)", "teacher.tsx");
    const content = fs.readFileSync(teacherPath, "utf-8");

    it("notification bell has onPress handler", () => {
      const notifSection = content.substring(
        content.indexOf("Notifications"),
        content.indexOf("Achievements Row")
      );
      expect(notifSection).toContain("onPress");
    });

    it("all TouchableOpacity elements in command center have onPress", () => {
      const commandSection = content.substring(
        content.indexOf("COMMAND CENTER"),
        content.indexOf("COMMAND CENTER") + 500
      );
      // Count TouchableOpacity and onPress in the section
      const touchables = (commandSection.match(/TouchableOpacity/g) || []).length;
      const onPresses = (commandSection.match(/onPress/g) || []).length;
      expect(onPresses).toBeGreaterThanOrEqual(touchables - 1); // Allow closing tags
    });
  });

  describe("Signup flow bypasses email verification", () => {
    const signupPath = path.join(APP_DIR, "signup.tsx");
    const content = fs.readFileSync(signupPath, "utf-8");

    it("signup routes to username step after info (bypassing verify)", () => {
      // The code should set step to "username" directly after info
      expect(content).toContain('setStep("username")');
    });

    it("signup completes with route to onboarding", () => {
      expect(content).toContain('router.replace("/onboarding")');
    });
  });
});
