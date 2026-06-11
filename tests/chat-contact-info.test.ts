import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Chat Contact Info Screen", () => {
  const filePath = path.resolve(__dirname, "../app/chat-contact-info.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("should exist as a file", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("should export a default function component", () => {
    expect(content).toContain("export default function ChatContactInfoScreen");
  });

  it("should accept contactId, contactName, contactAvatar, contactType, contactLanguage params", () => {
    expect(content).toContain("contactId");
    expect(content).toContain("contactName");
    expect(content).toContain("contactAvatar");
    expect(content).toContain("contactType");
    expect(content).toContain("contactLanguage");
  });

  it("should have iMessage-style scrollable tabs (Info, Backgrounds, Photos, Links, Documents)", () => {
    expect(content).toContain('"info"');
    expect(content).toContain('"backgrounds"');
    expect(content).toContain('"photos"');
    expect(content).toContain('"links"');
    expect(content).toContain('"documents"');
  });

  it("should have quick action buttons (Audio, Video, Search)", () => {
    expect(content).toContain("Audio");
    expect(content).toContain("Video");
    expect(content).toContain("Search");
  });

  it("should have WhatsApp-style settings (Hide Alerts, Read Receipts, Shared, Focus Status)", () => {
    expect(content).toContain("Hide Alerts");
    expect(content).toContain("Send Read Receipts");
    expect(content).toContain("Show in Shared with You");
    expect(content).toContain("Share Focus Status");
  });

  it("should have media/storage/starred section", () => {
    expect(content).toContain("Media, links and docs");
    expect(content).toContain("Manage storage");
    expect(content).toContain("Starred");
  });

  it("should have notifications, chat theme, save to photos", () => {
    expect(content).toContain("Notifications");
    expect(content).toContain("Chat theme");
    expect(content).toContain("Save to Photos");
  });

  it("should have privacy/encryption settings", () => {
    expect(content).toContain("Disappearing messages");
    expect(content).toContain("Transcript language");
    expect(content).toContain("Lock chat");
    expect(content).toContain("Advanced chat privacy");
    expect(content).toContain("Encryption");
  });

  it("should have groups section", () => {
    expect(content).toContain("Create group with");
    expect(content).toContain("Add to group");
  });

  it("should have action buttons (Share, Favorites, Export, Clear, Block, Report)", () => {
    expect(content).toContain("Share contact");
    expect(content).toContain("Add to Favorites");
    expect(content).toContain("Export chat");
    expect(content).toContain("Clear chat");
    expect(content).toContain("Block");
    expect(content).toContain("Report");
  });

  it("should have iMessage footer with encryption notice", () => {
    expect(content).toContain("securely encrypted end-to-end");
    expect(content).toContain("Learn more");
  });

  it("should use ConnectWorld AI brand colors", () => {
    expect(content).toContain("Colors.primary");
    expect(content).toContain("Colors.secondary");
    expect(content).toContain("Colors.surfaceCard");
  });

  it("should have Contact Key Verification and Download Attachments", () => {
    expect(content).toContain("Turn On Contact Key Verification");
    expect(content).toContain("Download Attachments");
  });

  it("should have Automatically Translate toggle", () => {
    expect(content).toContain("Automatically Translate");
  });
});

describe("Chat Contact Info - Navigation Wiring", () => {
  const layoutPath = path.resolve(__dirname, "../app/_layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  it("should be registered in _layout.tsx", () => {
    expect(layoutContent).toContain('name="chat-contact-info"');
  });

  const messageComposePath = path.resolve(__dirname, "../app/message-compose.tsx");
  const messageComposeContent = fs.readFileSync(messageComposePath, "utf-8");

  it("should be navigable from message-compose header", () => {
    expect(messageComposeContent).toContain("chat-contact-info");
  });
});

describe("Teacher Profile - ElevenLabs Voice Samples", () => {
  const filePath = path.resolve(__dirname, "../app/teacher-profile.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("should have ElevenLabs TTS integration via trpc", () => {
    expect(content).toContain("trpc.translate.tts.useMutation");
  });

  it("should have HD Voice badge indicator", () => {
    expect(content).toContain("HD Voice");
  });

  it("should have voice sample phrases for playback", () => {
    expect(content).toContain("getSamplePhrases");
  });

  it("should have audio playback state management", () => {
    expect(content).toContain("playingPhraseIdx");
  });

  it("should use expo-audio for playback", () => {
    expect(content).toContain("expo-audio");
  });
});

describe("Messages Tab - Routing to message-compose", () => {
  const filePath = path.resolve(__dirname, "../app/(tabs)/messages.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("should navigate to message-compose with contact params", () => {
    expect(content).toContain('pathname: "/message-compose"');
    expect(content).toContain("contactName");
    expect(content).toContain("contactAvatar");
  });
});
