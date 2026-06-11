import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.resolve(__dirname, "../app");
const LAYOUT_PATH = path.join(APP_DIR, "_layout.tsx");

describe("Sprint 1 — Screen Files Exist", () => {
  const screens = [
    "quiz-test.tsx",
    "pen-pal.tsx",
    "streak-recovery.tsx",
    "study-buddy.tsx",
  ];

  screens.forEach((screen) => {
    it(`${screen} exists and has substantial content`, () => {
      const filePath = path.join(APP_DIR, screen);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content.length).toBeGreaterThan(5000);
      expect(content).toContain("export default function");
      expect(content).toContain("StyleSheet.create");
    });
  });
});

describe("Sprint 1 — Screens Registered in _layout.tsx", () => {
  const layoutContent = fs.readFileSync(LAYOUT_PATH, "utf-8");

  const registrations = ["quiz-test", "pen-pal", "streak-recovery", "study-buddy"];

  registrations.forEach((name) => {
    it(`${name} is registered as a Stack.Screen`, () => {
      expect(layoutContent).toContain(`name="${name}"`);
    });
  });
});

describe("Sprint 1 — Entry Points Wired", () => {
  it("Quiz-test is wired from Home tab (quiz hub)", () => {
    const homeContent = fs.readFileSync(path.join(APP_DIR, "(tabs)/index.tsx"), "utf-8");
    expect(homeContent).toContain("/quiz-test");
  });

  it("Quiz-test is wired from Teacher tab (Book Test)", () => {
    const teacherContent = fs.readFileSync(path.join(APP_DIR, "(tabs)/teacher.tsx"), "utf-8");
    expect(teacherContent).toContain("/quiz-test");
  });

  it("Pen-pal is wired from Messages tab", () => {
    const messagesContent = fs.readFileSync(path.join(APP_DIR, "(tabs)/messages.tsx"), "utf-8");
    expect(messagesContent).toContain("/pen-pal");
  });

  it("Pen-pal is wired from Home quick actions", () => {
    const homeContent = fs.readFileSync(path.join(APP_DIR, "(tabs)/index.tsx"), "utf-8");
    expect(homeContent).toContain("/pen-pal");
  });

  it("Streak-recovery is wired from Home streak card (when streak=0)", () => {
    const homeContent = fs.readFileSync(path.join(APP_DIR, "(tabs)/index.tsx"), "utf-8");
    expect(homeContent).toContain("/streak-recovery");
  });

  it("Study-buddy is wired from Social Hub", () => {
    const socialContent = fs.readFileSync(path.join(APP_DIR, "social-hub.tsx"), "utf-8");
    expect(socialContent).toContain("/study-buddy");
  });
});

describe("Sprint 1 — Screen Features", () => {
  it("Quiz-test has timed mode, question types, and grading", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "quiz-test.tsx"), "utf-8");
    expect(content).toContain("timer");
    expect(content).toContain("AsyncStorage");
    expect(content).toContain("Haptics");
  });

  it("Pen-pal has personas, corrections, and voice messages", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "pen-pal.tsx"), "utf-8");
    expect(content).toContain("Carlos");
    expect(content).toContain("Marie");
    expect(content).toContain("Kenji");
    expect(content).toContain("correction");
    expect(content).toContain("voice");
    expect(content).toContain("AsyncStorage");
  });

  it("Streak-recovery has challenge options and progress tracking", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "streak-recovery.tsx"), "utf-8");
    expect(content).toContain("challenge");
    expect(content).toContain("progress");
  });

  it("Study-buddy has compatibility scoring and buddy cards", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "study-buddy.tsx"), "utf-8");
    expect(content).toContain("match");
    expect(content).toContain("buddy");
  });
});
