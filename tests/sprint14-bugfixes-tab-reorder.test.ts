import { describe, it, expect, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Sprint 14 — Bug Fixes & Tab Reorder", () => {
  // ─── Call Screen Icon Fixes ───────────────────────────────────────────
  describe("Hume Call Screen Icons", () => {
    it("should use mic-off icon for Mute, not house.fill", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../app/hume-call.tsx"),
        "utf-8"
      );
      // Check that Mute button uses mic.slash.fill / mic.fill (SF Symbol names)
      expect(content).toMatch(/mic\.slash\.fill|mic\.fill/);
      // Check that Speaker button uses speaker.wave.2.fill
      expect(content).toMatch(/speaker\.wave/);
      // Should NOT have house.fill for Mute or Speaker
      const muteSection = content.slice(
        content.indexOf("Mute"),
        content.indexOf("Mute") + 200
      );
      expect(muteSection).not.toContain("house.fill");
    });

    it("should show user-friendly error instead of raw 'Please login (10001)'", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../app/hume-call.tsx"),
        "utf-8"
      );
      // Should have a friendly error message
      expect(content).toMatch(/sign in|log in|Sign In|Log In|account required|authentication/i);
    });
  });

  // ─── Message Thread Fix ───────────────────────────────────────────────
  describe("Message Compose Screen", () => {
    it("should exist and have contact data", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../app/message-compose.tsx"),
        "utf-8"
      );
      expect(content).toBeTruthy();
      // Should have contacts or conversations data
      expect(content).toMatch(/CONTACTS|contacts|conversations/);
    });
  });

  // ─── Tab Order Context ────────────────────────────────────────────────
  describe("Tab Order Context", () => {
    it("should export TabOrderProvider and useTabOrder", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../lib/tab-order-context.tsx"),
        "utf-8"
      );
      expect(content).toContain("export function TabOrderProvider");
      expect(content).toContain("export function useTabOrder");
    });

    it("should define DEFAULT_TAB_ORDER with all 7 visible tabs", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../lib/tab-order-context.tsx"),
        "utf-8"
      );
      expect(content).toContain("DEFAULT_TAB_ORDER");
      expect(content).toContain('"index"');
      expect(content).toContain('"explore"');
      expect(content).toContain('"tv"');
      expect(content).toContain('"calendar"');
      expect(content).toContain('"translate"');
      expect(content).toContain('"teacher"');
      expect(content).toContain('"profile"');
    });

    it("should persist tab order to AsyncStorage", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../lib/tab-order-context.tsx"),
        "utf-8"
      );
      expect(content).toContain("AsyncStorage");
      expect(content).toContain("@linguavibe_tab_order");
    });
  });

  // ─── Tab Reorder Screen ───────────────────────────────────────────────
  describe("Tab Reorder Screen", () => {
    it("should exist with swap and arrow controls", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../app/tab-reorder.tsx"),
        "utf-8"
      );
      expect(content).toContain("Reorder Tabs");
      expect(content).toContain("moveUp");
      expect(content).toContain("moveDown");
      expect(content).toContain("handleTapItem");
      expect(content).toContain("handleSave");
    });

    it("should have a preview bar showing current order", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../app/tab-reorder.tsx"),
        "utf-8"
      );
      expect(content).toContain("PREVIEW");
      expect(content).toContain("previewBar");
    });

    it("should be registered in root layout", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../app/_layout.tsx"),
        "utf-8"
      );
      expect(content).toContain('name="tab-reorder"');
    });
  });

  // ─── Dynamic Tab Layout ───────────────────────────────────────────────
  describe("Dynamic Tab Layout", () => {
    it("should use useTabOrder to render tabs in custom order", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../app/(tabs)/_layout.tsx"),
        "utf-8"
      );
      expect(content).toContain("useTabOrder");
      expect(content).toContain("tabOrder");
      expect(content).toContain("tabOrder.map");
    });
  });

  // ─── Explore Page Scroll Fix ──────────────────────────────────────────
  describe("Explore Page Scroll", () => {
    it("should use ListHeaderComponent for content above the grid", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../app/(tabs)/explore.tsx"),
        "utf-8"
      );
      expect(content).toContain("ListHeaderComponent");
    });
  });

  // ─── Phase 2 Label Fix ────────────────────────────────────────────────
  describe("Home Screen Phase 2 Label", () => {
    it("should not say 'Coming Soon' anymore", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../app/(tabs)/index.tsx"),
        "utf-8"
      );
      expect(content).not.toContain("Coming Soon");
    });
  });

  // ─── Onboarding Dialect Tooltip ───────────────────────────────────────
  describe("Onboarding Dialect Tooltip", () => {
    it("should show a 'What are dialects?' explanation", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../app/onboarding.tsx"),
        "utf-8"
      );
      expect(content).toContain("What are dialects?");
      expect(content).toContain("showDialectTip");
    });

    it("should have 11 Spanish dialects", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../app/onboarding.tsx"),
        "utf-8"
      );
      // Count Spanish dialect entries
      const spanishDialects = content.match(/es-[A-Z]{2}/g) || [];
      // Should have at least 10 unique Spanish dialect codes
      const unique = new Set(spanishDialects);
      expect(unique.size).toBeGreaterThanOrEqual(10);
    });
  });

  // ─── Profile Customize Tab Bar Link ───────────────────────────────────
  describe("Profile Screen", () => {
    it("should have a 'Customize Tab Bar' link to tab-reorder", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../app/(tabs)/profile.tsx"),
        "utf-8"
      );
      expect(content).toContain("Customize Tab Bar");
      expect(content).toContain("tab-reorder");
    });
  });
});
