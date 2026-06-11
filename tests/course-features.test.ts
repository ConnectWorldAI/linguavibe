import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "../app");

describe("Lesson Player", () => {
  const filePath = path.join(appDir, "lesson-player.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("lesson-player.tsx exists", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("has lesson content display", () => {
    expect(content).toContain("lesson");
  });

  it("has lesson notes with AsyncStorage persistence", () => {
    expect(content).toContain("lesson_notes_");
    expect(content).toContain("AsyncStorage");
    expect(content).toContain("TextInput");
  });

  it("has mark complete functionality", () => {
    expect(content).toContain("handleComplete");
    expect(content).toContain("lesson_completed_");
  });

  it("is registered in _layout.tsx", () => {
    const layout = fs.readFileSync(path.join(appDir, "_layout.tsx"), "utf-8");
    expect(layout).toContain('name="lesson-player"');
  });
});
