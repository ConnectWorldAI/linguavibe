/**
 * Tests for store review prompt after 7th lesson.
 * Validates:
 * 1. store-review.ts module exists with correct logic
 * 2. lesson-player.tsx wires in incrementLessonCount + maybeRequestStoreReview
 * 3. Threshold is set to 7
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

describe("Store Review - Rate This App After 7th Lesson", () => {
  const storeReviewPath = path.join(ROOT, "lib/store-review.ts");
  const storeReviewContent = fs.readFileSync(storeReviewPath, "utf-8");

  it("store-review.ts module exists", () => {
    expect(fs.existsSync(storeReviewPath)).toBe(true);
  });

  it("exports incrementLessonCount function", () => {
    expect(storeReviewContent).toContain("export async function incrementLessonCount");
  });

  it("exports getLessonCount function", () => {
    expect(storeReviewContent).toContain("export async function getLessonCount");
  });

  it("exports maybeRequestStoreReview function", () => {
    expect(storeReviewContent).toContain("export async function maybeRequestStoreReview");
  });

  it("uses REVIEW_THRESHOLD of 7", () => {
    expect(storeReviewContent).toContain("const REVIEW_THRESHOLD = 7");
  });

  it("checks if review was already shown via AsyncStorage", () => {
    expect(storeReviewContent).toContain("@store_review_shown");
    expect(storeReviewContent).toContain("alreadyShown");
  });

  it("tracks total lessons completed in AsyncStorage", () => {
    expect(storeReviewContent).toContain("@total_lessons_completed");
  });

  it("calls StoreReview.isAvailableAsync before requesting", () => {
    expect(storeReviewContent).toContain("isAvailableAsync");
    expect(storeReviewContent).toContain("requestReview");
  });

  it("guards against web platform", () => {
    expect(storeReviewContent).toContain("Platform.OS === \"web\"");
  });

  it("sets review shown flag after successful request", () => {
    expect(storeReviewContent).toContain("AsyncStorage.setItem(REVIEW_SHOWN_KEY, \"true\")");
  });

  // Verify wiring in lesson-player.tsx
  const lessonPlayerPath = path.join(ROOT, "app/lesson-player.tsx");
  const lessonPlayerContent = fs.readFileSync(lessonPlayerPath, "utf-8");

  it("lesson-player.tsx imports incrementLessonCount", () => {
    expect(lessonPlayerContent).toContain("incrementLessonCount");
  });

  it("lesson-player.tsx imports maybeRequestStoreReview", () => {
    expect(lessonPlayerContent).toContain("maybeRequestStoreReview");
  });

  it("lesson-player.tsx calls incrementLessonCount in handleComplete", () => {
    expect(lessonPlayerContent).toContain("await incrementLessonCount()");
  });

  it("lesson-player.tsx calls maybeRequestStoreReview in handleComplete", () => {
    expect(lessonPlayerContent).toContain("await maybeRequestStoreReview()");
  });
});
