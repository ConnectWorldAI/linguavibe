/**
 * Tests for: Try Exercise mini-lesson, Creator Directory, and Drag-to-Reorder Manage Pins
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ============================================================
// 1. Creator Exercise Screen Tests (file-based)
// ============================================================
describe("Creator Exercise Screen", () => {
  const filePath = path.resolve(__dirname, "../app/creator-exercise.tsx");
  let source: string;

  beforeEach(() => {
    source = fs.readFileSync(filePath, "utf-8");
  });

  it("exists as a valid screen file", () => {
    expect(source).toBeTruthy();
    expect(source.length).toBeGreaterThan(500);
  });

  it("imports useLocalSearchParams for creatorId param", () => {
    expect(source).toContain("useLocalSearchParams");
    expect(source).toContain("creatorId");
  });

  it("imports getAllSpotlightCreators from creator-spotlight", () => {
    expect(source).toContain("getAllSpotlightCreators");
    expect(source).toContain("creator-spotlight");
  });

  it("has interactive answer checking with normalizeAnswer", () => {
    expect(source).toContain("normalizeAnswer");
    expect(source).toContain("checkAnswer");
  });

  it("provides hint functionality", () => {
    expect(source).toContain("showHint");
    expect(source).toContain("hint_shown");
  });

  it("provides reveal answer after multiple attempts", () => {
    expect(source).toContain("revealAnswer");
    expect(source).toContain("attempts >= 2");
  });

  it("shows correct/incorrect feedback with haptics", () => {
    expect(source).toContain("NotificationFeedbackType.Success");
    expect(source).toContain("NotificationFeedbackType.Error");
  });

  it("has shake animation for incorrect answers", () => {
    expect(source).toContain("triggerShake");
    expect(source).toContain("shakeAnim");
  });

  it("tracks progress per exercise", () => {
    expect(source).toContain("ExerciseProgress");
    expect(source).toContain("state: ExerciseState");
  });

  it("has a results screen at the end", () => {
    expect(source).toContain("showResults");
    expect(source).toContain("Exercise Complete");
    expect(source).toContain("correctCount");
  });

  it("supports navigation between exercises (prev/next)", () => {
    expect(source).toContain("goToNext");
    expect(source).toContain("goToPrev");
  });

  it("supports try again (reset)", () => {
    expect(source).toContain("resetAll");
    expect(source).toContain("Try Again");
  });

  it("shows progress dots for each exercise", () => {
    expect(source).toContain("progressDots");
    expect(source).toContain("dotActive");
  });

  it("shows exercise type badge", () => {
    expect(source).toContain("typeBadge");
    expect(source).toContain("exerciseIcon");
  });

  it("has a text input for user answers", () => {
    expect(source).toContain("TextInput");
    expect(source).toContain("Type your answer");
  });

  it("supports multiple correct answers separated by /", () => {
    expect(source).toContain('.split("/")');
  });
});

// ============================================================
// 2. Creator Directory Screen Tests (file-based)
// ============================================================
describe("Creator Directory Screen", () => {
  const filePath = path.resolve(__dirname, "../app/creator-directory.tsx");
  let source: string;

  beforeEach(() => {
    source = fs.readFileSync(filePath, "utf-8");
  });

  it("exists as a valid screen file", () => {
    expect(source).toBeTruthy();
    expect(source.length).toBeGreaterThan(500);
  });

  it("imports getAllSpotlightCreators", () => {
    expect(source).toContain("getAllSpotlightCreators");
  });

  it("has language filter state", () => {
    expect(source).toContain("selectedLanguage");
    expect(source).toContain("setSelectedLanguage");
  });

  it("extracts unique languages from creators", () => {
    expect(source).toContain("new Set(allCreators.map");
    expect(source).toContain('"All"');
  });

  it("filters creators by selected language", () => {
    expect(source).toContain("filteredCreators");
    expect(source).toContain('c.language === selectedLanguage');
  });

  it("renders filter chips in a horizontal ScrollView", () => {
    expect(source).toContain("ScrollView");
    expect(source).toContain("horizontal");
    expect(source).toContain("filterChip");
  });

  it("renders creator cards with FlatList", () => {
    expect(source).toContain("FlatList");
    expect(source).toContain("renderCreatorCard");
  });

  it("shows creator name, handle, and followers", () => {
    expect(source).toContain("item.name");
    expect(source).toContain("item.handle");
    expect(source).toContain("item.followers");
  });

  it("shows teaching style", () => {
    expect(source).toContain("item.teachingStyle");
  });

  it("shows content highlights as chips", () => {
    expect(source).toContain("contentHighlights");
    expect(source).toContain("highlightChip");
  });

  it("has Try Exercise button navigating to creator-exercise", () => {
    expect(source).toContain("handleTryExercise");
    expect(source).toContain("/creator-exercise");
    expect(source).toContain("creatorId: creator.id");
  });

  it("has Visit Profile button with Linking.openURL", () => {
    expect(source).toContain("handleVisitProfile");
    expect(source).toContain("Linking.openURL");
  });

  it("has an empty state when no creators match", () => {
    expect(source).toContain("ListEmptyComponent");
    expect(source).toContain("No creators found");
  });

  it("uses haptics on filter press", () => {
    expect(source).toContain("handleFilterPress");
    expect(source).toContain("ImpactFeedbackStyle.Light");
  });

  it("shows language badge on each card", () => {
    expect(source).toContain("langBadge");
    expect(source).toContain("item.language");
  });
});

// ============================================================
// 3. Creator Spotlight Card - Try Exercise + See All wiring
// ============================================================
describe("Creator Spotlight Card - Try Exercise + See All", () => {
  const filePath = path.resolve(__dirname, "../components/creator-spotlight-card.tsx");
  let source: string;

  beforeEach(() => {
    source = fs.readFileSync(filePath, "utf-8");
  });

  it("imports useRouter from expo-router", () => {
    expect(source).toContain("useRouter");
    expect(source).toContain("expo-router");
  });

  it("has a Try Exercise button", () => {
    expect(source).toContain("Try Exercise");
    expect(source).toContain("/creator-exercise");
  });

  it("passes creatorId param to exercise screen", () => {
    expect(source).toContain("creatorId: creator.id");
  });

  it("has a See All link to creator-directory", () => {
    expect(source).toContain("See All");
    expect(source).toContain("/creator-directory");
  });

  it("has headerActions style for See All + dismiss", () => {
    expect(source).toContain("headerActions");
    expect(source).toContain("seeAllText");
  });
});

// ============================================================
// 4. Manage Pins - Gesture-based drag-to-reorder
// ============================================================
describe("Manage Pins - Drag-to-Reorder", () => {
  const filePath = path.resolve(__dirname, "../app/manage-pins.tsx");
  let source: string;

  beforeEach(() => {
    source = fs.readFileSync(filePath, "utf-8");
  });

  it("exists as a valid screen file", () => {
    expect(source).toBeTruthy();
    expect(source.length).toBeGreaterThan(500);
  });

  it("has drag state management (draggingIndex, dragTargetIndex)", () => {
    expect(source).toContain("draggingIndex");
    expect(source).toContain("dragTargetIndex");
  });

  it("uses Animated.Value for drag Y translation", () => {
    expect(source).toContain("Animated.Value");
    expect(source).toContain("dragY");
  });

  it("has handleDragStart with haptic feedback", () => {
    expect(source).toContain("handleDragStart");
    expect(source).toContain("ImpactFeedbackStyle.Medium");
  });

  it("has handleDragMove that calculates target index", () => {
    expect(source).toContain("handleDragMove");
    expect(source).toContain("Math.round(diff / rowHeight)");
  });

  it("has handleDragEnd that reorders and persists", () => {
    expect(source).toContain("handleDragEnd");
    expect(source).toContain("reorderPinnedFeatures");
  });

  it("uses LayoutAnimation for smooth transitions", () => {
    expect(source).toContain("LayoutAnimation");
    expect(source).toContain("LayoutAnimation.configureNext");
  });

  it("renders a drag handle with reorder icon", () => {
    expect(source).toContain("dragHandle");
    expect(source).toContain("reorder-three");
  });

  it("uses responder events for drag gestures", () => {
    expect(source).toContain("onStartShouldSetResponder");
    expect(source).toContain("onResponderGrant");
    expect(source).toContain("onResponderMove");
    expect(source).toContain("onResponderRelease");
  });

  it("disables scroll during drag", () => {
    expect(source).toContain("scrollEnabled={draggingIndex === null}");
  });

  it("shows elevated style for dragging item", () => {
    expect(source).toContain("isDragging");
    expect(source).toContain("elevation: 8");
    expect(source).toContain("shadowOpacity");
  });

  it("shows drop target indicator", () => {
    expect(source).toContain("isDropTarget");
    expect(source).toContain("borderTopWidth: 2");
  });

  it("still supports bulk select mode", () => {
    expect(source).toContain("isSelecting");
    expect(source).toContain("handleBulkUnpin");
    expect(source).toContain("toggleSelect");
  });

  it("provides haptic feedback when crossing target boundaries", () => {
    expect(source).toContain("target !== dragTargetIndex");
    expect(source).toContain("ImpactFeedbackStyle.Light");
  });

  it("shows updated hint text mentioning drag", () => {
    expect(source).toContain("Drag");
    expect(source).toContain("to reorder");
  });
});

// ============================================================
// 5. Creator Spotlight data module - getAllSpotlightCreators
// ============================================================
describe("Creator Spotlight data module", () => {
  const filePath = path.resolve(__dirname, "../lib/creator-spotlight.ts");
  let source: string;

  beforeEach(() => {
    source = fs.readFileSync(filePath, "utf-8");
  });

  it("exports getAllSpotlightCreators function", () => {
    expect(source).toContain("export function getAllSpotlightCreators");
  });

  it("exports SpotlightCreator interface with required fields", () => {
    expect(source).toContain("export interface SpotlightCreator");
    expect(source).toContain("language: string");
    expect(source).toContain("sampleExercises: SampleExercise[]");
    expect(source).toContain("contentHighlights: string[]");
  });

  it("exports SampleExercise interface with type, title, prompt, answer", () => {
    expect(source).toContain("export interface SampleExercise");
    expect(source).toContain("type:");
    expect(source).toContain("title: string");
    expect(source).toContain("prompt: string");
    expect(source).toContain("answer: string");
    expect(source).toContain("hint?: string");
  });

  it("has multiple creators in the roster", () => {
    // Check for at least 3 different creator IDs
    const idMatches = source.match(/id:\s*["']/g);
    expect(idMatches).toBeTruthy();
    expect(idMatches!.length).toBeGreaterThanOrEqual(3);
  });
});
