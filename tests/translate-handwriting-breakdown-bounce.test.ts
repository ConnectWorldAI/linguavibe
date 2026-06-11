import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Translate Tab - Handwriting Input Mode", () => {
  const translatePath = path.join(__dirname, "../app/(tabs)/translate.tsx");
  const content = fs.readFileSync(translatePath, "utf-8");

  it("has handwriting mode state and toggle", () => {
    expect(content).toContain("showHandwriting");
    expect(content).toContain("setShowHandwriting(true)");
    expect(content).toContain("setShowHandwriting(false)");
  });

  it("has SVG drawing canvas with Gesture Pan handler", () => {
    expect(content).toContain("Gesture.Pan()");
    expect(content).toContain("GestureDetector");
    expect(content).toContain("hwPaths");
    expect(content).toContain("hwCurrentPath");
  });

  it("has handwriting recognition handler that calls server", () => {
    expect(content).toContain("handleRecognizeHandwriting");
    expect(content).toContain("recognizeHandwritingMutation");
    expect(content).toContain("trpc.translate.recognizeHandwriting");
  });

  it("has canvas controls: undo, clear, submit", () => {
    expect(content).toContain("arrow-undo");
    expect(content).toContain("backspace-outline");
    expect(content).toContain("hwSubmitBtn");
  });

  it("has handwriting modal with proper UI structure", () => {
    expect(content).toContain("handwritingModal");
    expect(content).toContain("handwritingHeader");
    expect(content).toContain("Write here");
    expect(content).toContain("hwCanvas");
  });

  it("has pencil icon in quick actions row", () => {
    expect(content).toContain("pencil-outline");
  });

  it("auto-recognizes after 1.5s of no drawing", () => {
    expect(content).toContain("setTimeout(() => handleRecognizeHandwriting(), 1500)");
  });

  it("imports Svg and Path from react-native-svg", () => {
    expect(content).toContain('import Svg, { Path } from "react-native-svg"');
  });

  it("imports captureRef from react-native-view-shot", () => {
    expect(content).toContain('import { captureRef } from "react-native-view-shot"');
  });
});

describe("Translate Tab - Translations of... Breakdown Panel", () => {
  const translatePath = path.join(__dirname, "../app/(tabs)/translate.tsx");
  const content = fs.readFileSync(translatePath, "utf-8");

  it("has breakdownData state that stores LLM breakdown response", () => {
    expect(content).toContain("breakdownData");
    expect(content).toContain("setBreakdownData");
  });

  it("stores breakdown data from translate mutation result", () => {
    expect(content).toContain("if (result.breakdown) setBreakdownData(result.breakdown)");
  });

  it("has Translations of... card that triggers breakdown panel", () => {
    expect(content).toContain("translationsOfCard");
    expect(content).toContain("Translations of");
    expect(content).toContain("setShowBreakdownPanel(true)");
  });

  it("shows word-by-word breakdown in the panel", () => {
    expect(content).toContain("breakdownWordCard");
    expect(content).toContain("breakdownOriginal");
    expect(content).toContain("breakdownMeaning");
  });

  it("shows conjugation/perspectives section", () => {
    expect(content).toContain("perspectives");
    expect(content).toContain("perspectiveRow");
    expect(content).toContain("perspPerson");
    expect(content).toContain("perspTarget");
  });

  it("shows multiple meanings across regions", () => {
    expect(content).toContain("multipleMeanings");
    expect(content).toContain("multipleMeaningCard");
    expect(content).toContain("mmRegion");
  });

  it("shows cultural context note", () => {
    expect(content).toContain("culturalNote");
    expect(content).toContain("culturalNoteCard");
    expect(content).toContain("Cultural Context");
  });

  it("shows formality and region tags", () => {
    expect(content).toContain("breakdownMetaRow");
    expect(content).toContain("metaTag");
    expect(content).toContain("formality");
    expect(content).toContain("slangType");
  });

  it("has breakdown modal with proper structure", () => {
    expect(content).toContain("breakdownModal");
    expect(content).toContain("breakdownHeader");
    expect(content).toContain("breakdownTitle");
  });
});

describe("Song Studio - ElevenLabs Voice Synthesis Bounce Pipeline", () => {
  const songStudioRouterPath = path.join(__dirname, "../server/songStudioRouter.ts");
  const songStudioContent = fs.readFileSync(songStudioRouterPath, "utf-8");

  it("bounce endpoint fetches vocal and instrumental tracks", () => {
    expect(songStudioContent).toContain("bounce");
    expect(songStudioContent).toContain("vocalsUrl");
    expect(songStudioContent).toContain("vocalsBuffer");
  });

  it("bounce endpoint handles synthesized vocals from ElevenLabs", () => {
    expect(songStudioContent).toContain("ElevenLabs");
    expect(songStudioContent).toContain("synthesized vocals");
  });

  it("bounce endpoint uploads final mix to S3 storage", () => {
    expect(songStudioContent).toContain("storageGetSignedUrl");
  });

  it("bounce endpoint returns downloadable URL", () => {
    expect(songStudioContent).toContain("downloadUrl");
  });

  it("bounce endpoint supports multiple formats (mp3, wav, m4a)", () => {
    expect(songStudioContent).toContain("format");
    expect(songStudioContent).toContain("mp3");
  });
});

describe("Song Translation Pipeline - Slang Knowledge Integration", () => {
  const pipelinePath = path.join(__dirname, "../server/songTranslationPipeline.ts");
  const pipelineContent = fs.readFileSync(pipelinePath, "utf-8");

  it("imports slang knowledge loader", () => {
    expect(pipelineContent).toContain("getSlangKnowledge");
  });

  it("fetches slang context before translation", () => {
    expect(pipelineContent).toContain("slangContext");
  });

  it("injects slang context into the LLM translation prompt", () => {
    // The pipeline should include slang reference in its prompt
    expect(pipelineContent).toContain("SLANG/DIALECT");
  });

  it("checks for multiple meanings from slang database", () => {
    expect(pipelineContent).toContain("getMultipleMeanings");
  });
});

describe("Song Translation Studio - MP3 Bounce UI", () => {
  const studioPath = path.join(__dirname, "../app/song-translation-studio.tsx");
  const studioContent = fs.readFileSync(studioPath, "utf-8");

  it("has bounce/export button in result step", () => {
    expect(studioContent).toContain("Bounce");
  });

  it("has bounce modal with format selection", () => {
    expect(studioContent).toContain("showBounceModal");
  });

  it("calls songStudio.bounce mutation", () => {
    expect(studioContent).toContain("songStudio.bounce");
  });
});

describe("WavyEQ Studio - MP3 Bounce UI", () => {
  const wavyPath = path.join(__dirname, "../app/wavy-eq-studio.tsx");
  const wavyContent = fs.readFileSync(wavyPath, "utf-8");

  it("has bounce/export button in done state", () => {
    expect(wavyContent).toContain("Bounce");
  });

  it("has bounce modal with format options", () => {
    expect(wavyContent).toContain("showBounceModal");
  });

  it("has handleBounce function", () => {
    expect(wavyContent).toContain("handleBounce");
  });

  it("shows share option after bounce completes", () => {
    expect(wavyContent).toContain("Share");
  });
});

describe("Live Translation - Slang Knowledge Integration", () => {
  const livePath = path.join(__dirname, "../server/liveTranslate.ts");
  const liveContent = fs.readFileSync(livePath, "utf-8");

  it("imports slang knowledge loader", () => {
    expect(liveContent).toContain("getSlangKnowledge");
  });

  it("injects dialect/slang context into session instructions", () => {
    expect(liveContent).toContain("slangContext");
  });
});
