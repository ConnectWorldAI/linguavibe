import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "../app");
const componentsDir = path.resolve(__dirname, "../components");

describe("Bookmarked Lessons", () => {
  const playerPath = path.join(appDir, "lesson-player.tsx");
  const playerContent = fs.readFileSync(playerPath, "utf-8");

  it("has bookmark toggle button in lesson player", () => {
    expect(playerContent).toContain("toggleBookmark");
    expect(playerContent).toContain("bookmarkBtn");
    expect(playerContent).toContain("bookmark-outline");
  });

  it("saves bookmark state to AsyncStorage", () => {
    expect(playerContent).toContain("lesson_bookmarked_");
    expect(playerContent).toContain("saved_lessons");
    expect(playerContent).toContain("AsyncStorage.setItem");
  });

  it("removes bookmark from AsyncStorage", () => {
    expect(playerContent).toContain("AsyncStorage.removeItem");
    expect(playerContent).toContain("filter");
  });

  it("has saved-lessons screen", () => {
    const savedPath = path.join(appDir, "saved-lessons.tsx");
    expect(fs.existsSync(savedPath)).toBe(true);
    const content = fs.readFileSync(savedPath, "utf-8");
    expect(content).toContain("SavedLessonsScreen");
    expect(content).toContain("saved_lessons");
  });

  it("saved-lessons has empty state", () => {
    const savedPath = path.join(appDir, "saved-lessons.tsx");
    const content = fs.readFileSync(savedPath, "utf-8");
    expect(content).toContain("No Saved Lessons");
    expect(content).toContain("Browse Courses");
  });

  it("saved-lessons navigates to lesson player", () => {
    const savedPath = path.join(appDir, "saved-lessons.tsx");
    const content = fs.readFileSync(savedPath, "utf-8");
    expect(content).toContain("/lesson-player");
    expect(content).toContain("handleNavigate");
  });

  it("saved-lessons has remove bookmark action", () => {
    const savedPath = path.join(appDir, "saved-lessons.tsx");
    const content = fs.readFileSync(savedPath, "utf-8");
    expect(content).toContain("handleRemoveBookmark");
    expect(content).toContain("close-circle");
  });

  it("profile links to saved-lessons", () => {
    const profilePath = path.join(appDir, "(tabs)/profile.tsx");
    const content = fs.readFileSync(profilePath, "utf-8");
    expect(content).toContain("/saved-lessons");
    expect(content).toContain("Saved Lessons");
  });
});

describe("Course Completion Confetti", () => {
  const confettiPath = path.join(componentsDir, "confetti-overlay.tsx");
  const content = fs.readFileSync(confettiPath, "utf-8");

  it("has ConfettiOverlay component", () => {
    expect(content).toContain("ConfettiOverlay");
    expect(content).toContain("visible");
    expect(content).toContain("courseName");
    expect(content).toContain("onDismiss");
  });

  it("generates confetti pieces with colors", () => {
    expect(content).toContain("CONFETTI_COLORS");
    expect(content).toContain("NUM_CONFETTI");
    expect(content).toContain("generateConfetti");
  });

  it("has animated confetti pieces", () => {
    expect(content).toContain("ConfettiPieceComponent");
    expect(content).toContain("translateY");
    expect(content).toContain("withTiming");
  });

  it("has celebration card with congratulations", () => {
    expect(content).toContain("Congratulations");
    expect(content).toContain("You completed");
    expect(content).toContain("certificate of completion");
  });

  it("has share achievement button", () => {
    expect(content).toContain("Share Achievement");
    expect(content).toContain("Share.share");
    expect(content).toContain("ConnectWorld AI");
  });

  it("has haptic feedback on celebration", () => {
    expect(content).toContain("Haptics.notificationAsync");
    expect(content).toContain("Haptics.impactAsync");
  });

  it("is integrated in course-detail", () => {
    const courseDetail = fs.readFileSync(path.join(appDir, "course-detail.tsx"), "utf-8");
    expect(courseDetail).toContain("ConfettiOverlay");
    expect(courseDetail).toContain("showConfetti");
    expect(courseDetail).toContain("course_celebrated_");
  });
});

describe("Instructor Bio Page", () => {
  const bioPath = path.join(appDir, "instructor-bio.tsx");
  const content = fs.readFileSync(bioPath, "utf-8");

  it("has InstructorBioScreen component", () => {
    expect(content).toContain("InstructorBioScreen");
  });

  it("shows instructor profile info", () => {
    expect(content).toContain("Prof. María García");
    expect(content).toContain("Senior Language Instructor");
    expect(content).toContain("Santo Domingo");
  });

  it("has stats grid", () => {
    expect(content).toContain("4500");
    expect(content).toContain("Students");
    expect(content).toContain("Courses");
    expect(content).toContain("Rating");
  });

  it("has credentials section", () => {
    expect(content).toContain("Credentials");
    expect(content).toContain("M.A. Applied Linguistics");
    expect(content).toContain("DELE C2 Certified");
  });

  it("has specializations", () => {
    expect(content).toContain("Specializations");
    expect(content).toContain("Business Spanish");
    expect(content).toContain("DELE Preparation");
  });

  it("lists instructor courses", () => {
    expect(content).toContain("Spanish B2 Professional Communication");
    expect(content).toContain("Business Spanish for IT Professionals");
    expect(content).toContain("Medical Spanish Essentials");
  });

  it("has student testimonials", () => {
    expect(content).toContain("Student Testimonials");
    expect(content).toContain("James K.");
    expect(content).toContain("Sarah L.");
  });

  it("navigates from course-detail instructor section", () => {
    const courseDetail = fs.readFileSync(path.join(appDir, "course-detail.tsx"), "utf-8");
    expect(courseDetail).toContain("/instructor-bio");
  });

  it("is registered in _layout.tsx", () => {
    const layout = fs.readFileSync(path.join(appDir, "_layout.tsx"), "utf-8");
    expect(layout).toContain("instructor-bio");
  });
});
