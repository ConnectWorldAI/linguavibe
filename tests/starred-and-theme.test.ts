import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

import {
  toggleStarredMessage,
  getStarredMessages,
  isMessageStarred,
  getChatTheme,
  setChatTheme,
  CHAT_THEMES,
  extractUrlsFromText,
  getDomainFromUrl,
  getTitleFromUrl,
  type StarredMessage,
  type ChatTheme,
} from "../lib/chat-media-store";

describe("Starred Messages", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("should star a message", async () => {
    const msg: StarredMessage = {
      id: "msg1",
      text: "Hello world",
      sender: "them",
      timestamp: Date.now(),
      contactName: "Maria",
      contactAvatar: "\u{1F1F2}\u{1F1FD}",
    };
    const result = await toggleStarredMessage("contact1", msg);
    expect(result).toBe(true);
  });

  it("should retrieve starred messages", async () => {
    const msg: StarredMessage = {
      id: "msg2",
      text: "Test message",
      sender: "me",
      timestamp: Date.now(),
      contactName: "James",
      contactAvatar: "\u{1F1FA}\u{1F1F8}",
    };
    await toggleStarredMessage("contact2", msg);
    const starred = await getStarredMessages("contact2");
    expect(starred.length).toBe(1);
    expect(starred[0].text).toBe("Test message");
  });

  it("should unstar a message on second toggle", async () => {
    const msg: StarredMessage = {
      id: "msg3",
      text: "Unstar me",
      sender: "them",
      timestamp: Date.now(),
      contactName: "Yuki",
      contactAvatar: "\u{1F1EF}\u{1F1F5}",
    };
    await toggleStarredMessage("contact3", msg);
    const result = await toggleStarredMessage("contact3", msg);
    expect(result).toBe(false);
    const starred = await getStarredMessages("contact3");
    expect(starred.length).toBe(0);
  });

  it("should check if a message is starred", async () => {
    const msg: StarredMessage = {
      id: "msg4",
      text: "Check me",
      sender: "me",
      timestamp: Date.now(),
      contactName: "Carlos",
      contactAvatar: "\u{1F1E9}\u{1F1F4}",
    };
    await toggleStarredMessage("contact4", msg);
    const isStarred = await isMessageStarred("contact4", "msg4");
    expect(isStarred).toBe(true);
    const notStarred = await isMessageStarred("contact4", "msg999");
    expect(notStarred).toBe(false);
  });
});

describe("Chat Theme", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("should return null for no theme set", async () => {
    const theme = await getChatTheme("contact1");
    expect(theme).toBeNull();
  });

  it("should save and retrieve a theme", async () => {
    const theme: ChatTheme = { type: "gradient", colors: ["#1a0533", "#0d1b2a"], name: "Purple Night" };
    await setChatTheme("contact1", theme);
    const retrieved = await getChatTheme("contact1");
    expect(retrieved).toEqual(theme);
  });

  it("should clear theme when set to null", async () => {
    const theme: ChatTheme = { type: "solid", colors: ["#0A1628"], name: "Default Dark" };
    await setChatTheme("contact1", theme);
    await setChatTheme("contact1", null);
    const retrieved = await getChatTheme("contact1");
    expect(retrieved).toBeNull();
  });

  it("should have preset themes available", () => {
    expect(CHAT_THEMES.length).toBeGreaterThan(5);
    expect(CHAT_THEMES[0].name).toBe("Default Dark");
  });
});

describe("URL Extraction", () => {
  it("should extract URLs from text", () => {
    const text = "Check out https://example.com and http://test.org/page";
    const urls = extractUrlsFromText(text);
    expect(urls.length).toBe(2);
    expect(urls[0]).toBe("https://example.com");
  });

  it("should return empty array for no URLs", () => {
    const urls = extractUrlsFromText("No links here");
    expect(urls.length).toBe(0);
  });

  it("should get domain from URL", () => {
    expect(getDomainFromUrl("https://www.example.com/path")).toBe("example.com");
    expect(getDomainFromUrl("https://sub.domain.org")).toBe("sub.domain.org");
  });

  it("should get title from URL", () => {
    const title = getTitleFromUrl("https://example.com/my-article-title");
    expect(title).toBe("my article title");
  });
});
