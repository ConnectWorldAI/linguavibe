import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Translate Screen - Voice Input & Share Features", () => {
  const translatePath = path.resolve(__dirname, "../app/(tabs)/translate.tsx");
  const translateContent = fs.readFileSync(translatePath, "utf-8");

  it("should import useSpeechToText hook", () => {
    expect(translateContent).toContain('import { useSpeechToText } from "@/hooks/use-speech-to-text"');
  });

  it("should import Share from react-native", () => {
    expect(translateContent).toContain("Share,");
    expect(translateContent).toContain('from "react-native"');
  });

  it("should have handleVoiceInput function", () => {
    expect(translateContent).toContain("const handleVoiceInput = async ()");
  });

  it("should have handleShare function", () => {
    expect(translateContent).toContain("const handleShare = async ()");
  });

  it("should use Share.share with message payload", () => {
    expect(translateContent).toContain("await Share.share({ message: shareText })");
  });

  it("should include ConnectWorld AI branding in share text", () => {
    expect(translateContent).toContain("Translated with ConnectWorld AI");
  });

  it("should have recording indicator UI", () => {
    // New Google Translate-style UI uses quickActionBtnActive for recording state
    expect(translateContent).toContain("isRecording");
    expect(translateContent).toContain("quickActionBtnActive");
  });

  it("should have active recording style", () => {
    expect(translateContent).toContain("quickActionBtnActive");
  });

  it("should wire mic button to handleVoiceInput", () => {
    expect(translateContent).toContain("onPress={handleVoiceInput}");
  });

  it("should wire share button to handleShare", () => {
    expect(translateContent).toContain("onPress={handleShare}");
  });

  it("should show stop icon when recording", () => {
    expect(translateContent).toContain('name={isRecording ? "stop" : "mic"}');
  });

  it("should disable mic button while processing voice", () => {
    expect(translateContent).toContain("disabled={isProcessingVoice}");
  });

  it("should have clipboard paste functionality on clipboard button", () => {
    expect(translateContent).toContain("Clipboard.getStringAsync()");
  });

  it("should include dialect info in share text when available", () => {
    // New UI includes dialect from detectedInfo in share text
    expect(translateContent).toContain("detectedInfo?.dialect");
    expect(translateContent).toContain("shareText");
  });

  it("should include cultural note in breakdown panel", () => {
    // Cultural note is now in the breakdown panel
    expect(translateContent).toContain("culturalNote");
    expect(translateContent).toContain("Cultural Context");
  });
});
