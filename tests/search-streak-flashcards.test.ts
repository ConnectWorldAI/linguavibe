import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "../app");

describe("Course Search and Filter", () => {
  const catalogPath = path.join(appDir, "course-catalog.tsx");
  const content = fs.readFileSync(catalogPath, "utf-8");

  it("has search bar with TextInput", () => {
    expect(content).toContain("TextInput");
    expect(content).toContain("Search courses");
    expect(content).toContain("onChangeText");
  });

  it("has duration filter", () => {
    expect(content).toContain("DURATIONS");
    expect(content).toContain("< 3 hrs");
    expect(content).toContain("3-5 hrs");
    expect(content).toContain("5+ hrs");
    expect(content).toContain("selectedDuration");
  });

  it("has sort options", () => {
    expect(content).toContain("Popular");
    expect(content).toContain("Top Rated");
    expect(content).toContain("Newest");
    expect(content).toContain("sortBy");
  });

  it("has clear filters button", () => {
    expect(content).toContain("clearAllFilters");
    expect(content).toContain("hasActiveFilters");
    expect(content).toContain("Clear");
  });

  it("has no results empty state", () => {
    expect(content).toContain("No courses found");
    expect(content).toContain("Try adjusting your search or filters");
    expect(content).toContain("Clear All Filters");
  });

  it("filters by duration correctly", () => {
    expect(content).toContain("parseDuration");
    expect(content).toContain("matchDuration");
  });
});

describe("Learning Streak Calendar", () => {
  const calendarPath = path.join(appDir, "streak-calendar.tsx");
  const content = fs.readFileSync(calendarPath, "utf-8");

  it("has StreakCalendarScreen component", () => {
    expect(content).toContain("StreakCalendarScreen");
  });

  it("has heat-map colors", () => {
    expect(content).toContain("HEAT_COLORS");
    expect(content).toContain("getIntensity");
  });

  it("has month navigation", () => {
    expect(content).toContain("goToPrevMonth");
    expect(content).toContain("goToNextMonth");
    expect(content).toContain("currentMonth");
  });

  it("has streak stats", () => {
    expect(content).toContain("calculateStreak");
    expect(content).toContain("Current Streak");
    expect(content).toContain("Longest Streak");
    expect(content).toContain("Active Days");
  });

  it("has day detail on tap", () => {
    expect(content).toContain("selectedDate");
    expect(content).toContain("minutes studied");
    expect(content).toContain("lessons completed");
    expect(content).toContain("flashcards reviewed");
  });

  it("has weekly bar chart", () => {
    expect(content).toContain("This Week");
    expect(content).toContain("weekBars");
    expect(content).toContain("barContainer");
  });

  it("has legend", () => {
    expect(content).toContain("Less");
    expect(content).toContain("More");
    expect(content).toContain("legendBox");
  });

  it("is accessible from Learn tab", () => {
    const teacherPath = path.join(appDir, "(tabs)/teacher.tsx");
    const teacherContent = fs.readFileSync(teacherPath, "utf-8");
    expect(teacherContent).toContain("/streak-calendar");
  });

  it("is registered in _layout.tsx", () => {
    const layout = fs.readFileSync(path.join(appDir, "_layout.tsx"), "utf-8");
    expect(layout).toContain("streak-calendar");
  });
});

describe("Flashcard Review Mode", () => {
  const flashcardPath = path.join(appDir, "flashcard-review.tsx");
  const content = fs.readFileSync(flashcardPath, "utf-8");

  it("has FlashcardReviewScreen component", () => {
    expect(content).toContain("FlashcardReviewScreen");
  });

  it("implements SM-2 algorithm", () => {
    expect(content).toContain("calculateNextReview");
    expect(content).toContain("difficulty");
    expect(content).toContain("interval");
    expect(content).toContain("repetitions");
  });

  it("has flip animation", () => {
    expect(content).toContain("flipProgress");
    expect(content).toContain("handleFlip");
    expect(content).toContain("Tap to reveal");
  });

  it("has rating buttons", () => {
    expect(content).toContain("Again");
    expect(content).toContain("Hard");
    expect(content).toContain("Good");
    expect(content).toContain("Easy");
    expect(content).toContain("handleRate");
  });

  it("has session stats tracking", () => {
    expect(content).toContain("sessionStats");
    expect(content).toContain("reviewed");
    expect(content).toContain("mastered");
  });

  it("has session complete screen", () => {
    expect(content).toContain("Session Complete");
    expect(content).toContain("Review Again");
    expect(content).toContain("isComplete");
  });

  it("persists deck state to AsyncStorage", () => {
    expect(content).toContain("STORAGE_KEY");
    expect(content).toContain("flashcard_deck");
    expect(content).toContain("AsyncStorage.setItem");
    expect(content).toContain("AsyncStorage.getItem");
  });

  it("has vocabulary cards with examples", () => {
    expect(content).toContain("INITIAL_CARDS");
    expect(content).toContain("¿Qué lo que?");
    expect(content).toContain("Vaina");
    expect(content).toContain("example");
  });

  it("is accessible from Learn tab", () => {
    const teacherPath = path.join(appDir, "(tabs)/teacher.tsx");
    const teacherContent = fs.readFileSync(teacherPath, "utf-8");
    expect(teacherContent).toContain("/flashcard-review");
    expect(teacherContent).toContain("Flashcards");
  });

  it("is registered in _layout.tsx", () => {
    const layout = fs.readFileSync(path.join(appDir, "_layout.tsx"), "utf-8");
    expect(layout).toContain("flashcard-review");
  });
});
