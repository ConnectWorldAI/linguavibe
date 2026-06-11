import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Floating AI Chat Button on Home", () => {
  const filePath = path.join(__dirname, "../app/(tabs)/index.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("should have Messages as a FAB action", () => {
    expect(content).toContain("Messages");
    expect(content).toContain("chatbubbles");
    expect(content).toContain("/(tabs)/messages");
  });

  it("should have Songs as a FAB action", () => {
    expect(content).toContain("Songs");
    expect(content).toContain("musical-notes");
  });

  it("should have FAB animation logic", () => {
    expect(content).toContain("fabAnim");
    expect(content).toContain("toggleFab");
  });
});

describe("In-App Messaging Composition", () => {
  const filePath = path.join(__dirname, "../app/message-compose.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("should exist as a screen file", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("should have contact list with types", () => {
    expect(content).toContain("friend");
    expect(content).toContain("classmate");
    expect(content).toContain("instructor");
  });

  it("should have message sending functionality", () => {
    expect(content).toContain("sendMessage");
    expect(content).toContain("MESSAGES_KEY");
  });

  it("should have search and filter", () => {
    expect(content).toContain("searchQuery");
    expect(content).toContain("filterType");
  });

  it("should have online status indicators", () => {
    expect(content).toContain("onlineDot");
    expect(content).toContain("online");
  });

  it("should persist messages with AsyncStorage", () => {
    expect(content).toContain("AsyncStorage");
    expect(content).toContain("saveMessages");
    expect(content).toContain("loadMessages");
  });

  it("should have conversation view with bubbles", () => {
    expect(content).toContain("myMsg");
    expect(content).toContain("theirMsg");
    expect(content).toContain("msgBubble");
  });

  it("should have video call and mic buttons", () => {
    expect(content).toContain("videocam");
    expect(content).toContain("mic");
  });

  it("should simulate auto-reply", () => {
    expect(content).toContain("setTimeout");
    expect(content).toContain("reply");
  });
});

describe("Progress Dashboard", () => {
  const filePath = path.join(__dirname, "../app/progress-dashboard.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("should exist as a screen file", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("should have time range selector (week/month/year)", () => {
    expect(content).toContain("TimeRange");
    expect(content).toContain("week");
    expect(content).toContain("month");
    expect(content).toContain("year");
  });

  it("should have bar chart rendering", () => {
    expect(content).toContain("renderBarChart");
    expect(content).toContain("barFill");
    expect(content).toContain("barChart");
  });

  it("should have XP breakdown section", () => {
    expect(content).toContain("XP_BREAKDOWN");
    expect(content).toContain("Lessons");
    expect(content).toContain("Flashcards");
    expect(content).toContain("Pronunciation");
  });

  it("should have summary stats grid", () => {
    expect(content).toContain("totalHours");
    expect(content).toContain("totalLessons");
    expect(content).toContain("totalXP");
    expect(content).toContain("totalVocab");
  });

  it("should have streak card", () => {
    expect(content).toContain("currentStreak");
    expect(content).toContain("longestStreak");
  });

  it("should have achievements section", () => {
    expect(content).toContain("certificatesEarned");
    expect(content).toContain("coursesCompleted");
  });

  it("should have quick links to other screens", () => {
    expect(content).toContain("/streak-calendar");
    expect(content).toContain("/my-certificates");
    expect(content).toContain("/leaderboard");
  });
});

describe("Screen Registration", () => {
  const layoutPath = path.join(__dirname, "../app/_layout.tsx");
  const content = fs.readFileSync(layoutPath, "utf-8");

  it("should register message-compose screen", () => {
    expect(content).toContain("message-compose");
  });

  it("should register progress-dashboard screen", () => {
    expect(content).toContain("progress-dashboard");
  });
});
