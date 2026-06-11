import { describe, it, expect } from "vitest";

describe("Messages Tab", () => {
  it("messages screen file exists and has proper structure", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/(tabs)/messages.tsx", "utf-8");
    expect(content).toContain("export default function MessagesScreen");
    expect(content).toContain("CONVERSATIONS");
    expect(content).toContain("teacher");
    expect(content).toContain("person");
    expect(content).toContain("Find Language Partners");
  });

  it("icon-symbol has message.fill mapping", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("components/ui/icon-symbol.tsx", "utf-8");
    expect(content).toContain('"message.fill"');
    expect(content).toContain('"chat"');
  });

  it("tab layout registers messages tab (hidden, via floating button)", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/(tabs)/_layout.tsx", "utf-8");
    expect(content).toContain('name="messages"');
    expect(content).toContain('href: null'); // Hidden from tab bar, accessible via FAB
  });
});

describe("Explore Icons Colors", () => {
  it("home screen has distinct colors for explore items", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/(tabs)/index.tsx", "utf-8");
    // Check that explore items have different colors
    expect(content).toContain("#8B5CF6"); // Virtual World - purple
    expect(content).toContain("#F472B6"); // Time Capsule - pink
    expect(content).toContain("Colors.accent"); // Battle Mode - red
    expect(content).toContain("Colors.success"); // Watch & Learn - green
    expect(content).toContain("Colors.secondary"); // AI Pen Pal - blue
    expect(content).toContain("Colors.gold"); // Voice Filters - gold
    // Check that color-coded explore items are present
    expect(content).toContain("exploreIconWrap");
  });
});
