import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { resolve } from "path";

describe("New screens exist and are valid modules", () => {
  const screens = [
    "app/calendar.tsx",
    "app/video-call.tsx",
    "app/video-message.tsx",
    "app/studio.tsx",
  ];

  screens.forEach((screen) => {
    it(`${screen} exists`, () => {
      const filePath = resolve(__dirname, "..", screen);
      expect(existsSync(filePath)).toBe(true);
    });
  });

  it("root layout registers calendar route", async () => {
    const fs = await import("fs");
    const layoutContent = fs.readFileSync(
      resolve(__dirname, "..", "app/_layout.tsx"),
      "utf-8"
    );
    // Calendar is now a tab, not a stack screen
    const tabLayoutContent = fs.readFileSync(
      resolve(__dirname, "..", "app/(tabs)/_layout.tsx"),
      "utf-8"
    );
    expect(tabLayoutContent).toContain('"calendar"');
    expect(layoutContent).toContain('"video-call"');
    expect(layoutContent).toContain('"video-message"');
    expect(layoutContent).toContain('"studio"');
  });

  it("teacher tab contains calendar navigation", async () => {
    const fs = await import("fs");
    const teacherContent = fs.readFileSync(
      resolve(__dirname, "..", "app/(tabs)/teacher.tsx"),
      "utf-8"
    );
    expect(teacherContent).toContain("calendar");
    expect(teacherContent).toContain("video-call");
    expect(teacherContent).toContain("Calendar");
    expect(teacherContent).toContain("profileHeader");
  });
});
