import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const screenPath = join(__dirname, "..", "app", "cloudwave-translator-setup.tsx");
const screenContent = readFileSync(screenPath, "utf-8");

const agentContextPath = join(__dirname, "..", "lib", "agent-context.tsx");
const agentContextContent = readFileSync(agentContextPath, "utf-8");

const translatorSetupPath = join(__dirname, "..", "app", "translator-setup.tsx");
const translatorSetupContent = readFileSync(translatorSetupPath, "utf-8");

describe("CloudWave Agent-Assisted Translator Setup", () => {
  describe("Screen structure", () => {
    it("exports a default component", () => {
      expect(screenContent).toContain("export default function CloudWaveTranslatorSetupScreen");
    });

    it("has agent step state machine", () => {
      expect(screenContent).toContain("type AgentStep");
      expect(screenContent).toContain('"greeting"');
      expect(screenContent).toContain('"permissions"');
      expect(screenContent).toContain('"configuring"');
      expect(screenContent).toContain('"complete"');
    });

    it("defines permissions that need to be granted", () => {
      expect(screenContent).toContain("PERMISSIONS");
      expect(screenContent).toContain("Settings Access");
      expect(screenContent).toContain("Default App Change");
      expect(screenContent).toContain("System Integration");
    });

    it("defines configuration steps", () => {
      expect(screenContent).toContain("CONFIG_STEPS");
      expect(screenContent).toContain("Opening iOS Settings");
      expect(screenContent).toContain("Finding Translation settings");
      expect(screenContent).toContain("Selecting ConnectWorld AI");
    });
  });

  describe("Agent-assisted UX", () => {
    it("has a greeting with typing animation", () => {
      expect(screenContent).toContain("typedText");
      expect(screenContent).toContain("I can set up ConnectWorld AI as your default iOS translator automatically");
    });

    it("shows grant permissions button", () => {
      expect(screenContent).toContain("Grant Access & Configure");
      expect(screenContent).toContain("handleGrantPermissions");
    });

    it("offers manual fallback option", () => {
      expect(screenContent).toContain("I'll do it manually instead");
      expect(screenContent).toContain("handleDoItManually");
    });

    it("shows real-time progress during configuration", () => {
      expect(screenContent).toContain("progressBarFill");
      expect(screenContent).toContain("configProgress");
      expect(screenContent).toContain("% complete");
    });

    it("displays agent messages during configuration", () => {
      expect(screenContent).toContain("messagesContainer");
      expect(screenContent).toContain("addMessage");
      expect(screenContent).toContain("Starting configuration");
    });

    it("shows completion state with features", () => {
      expect(screenContent).toContain("Configuration Complete");
      expect(screenContent).toContain("You're All Set");
      expect(screenContent).toContain("Try Translation Hub");
    });

    it("uses Alert for permission confirmation on iOS", () => {
      expect(screenContent).toContain("Alert.alert");
      expect(screenContent).toContain("Grant Access to CloudWave");
    });
  });

  describe("Analytics tracking", () => {
    it("tracks walkthrough start with agent source", () => {
      expect(screenContent).toContain('source: "cloudwave_agent"');
      expect(screenContent).toContain('mode: "agent_assisted"');
    });

    it("tracks step completions", () => {
      expect(screenContent).toContain("walkthrough_step_completed");
    });

    it("tracks completion", () => {
      expect(screenContent).toContain("walkthrough_completed");
    });
  });

  describe("CloudWave orb animations", () => {
    it("has pulse animation", () => {
      expect(screenContent).toContain("pulseAnim");
    });

    it("has glow animation that changes with step", () => {
      expect(screenContent).toContain("orbGlowAnim");
    });

    it("shows status dot when working", () => {
      expect(screenContent).toContain("orbStatusDot");
      expect(screenContent).toContain("statusDotInner");
    });
  });

  describe("Agent context integration", () => {
    it("has agent_translator_setup action in ACTION_MAP", () => {
      expect(agentContextContent).toContain("agent_translator_setup");
    });

    it("responds to 'set up translator' command", () => {
      expect(agentContextContent).toContain('"set up translator"');
      expect(agentContextContent).toContain('"set up my translator"');
      expect(agentContextContent).toContain('"configure translator"');
    });

    it("navigates to cloudwave-translator-setup screen", () => {
      expect(agentContextContent).toContain("/cloudwave-translator-setup");
    });

    it("has keyword mapping for setup/configure", () => {
      expect(agentContextContent).toContain('"set up": "set up translator"');
      expect(agentContextContent).toContain('"configure": "configure translator"');
    });

    it("provides proactive response for agent_translator_setup", () => {
      expect(agentContextContent).toContain("I can set up ConnectWorld AI as your default iOS translator automatically");
    });
  });

  describe("Translator-setup 'Let CloudWave do it' button", () => {
    it("has agent button on first step", () => {
      expect(translatorSetupContent).toContain("Let CloudWave do it for me");
    });

    it("only shows on first step (currentIndex === 0)", () => {
      expect(translatorSetupContent).toContain("currentIndex === 0 && (");
    });

    it("navigates to cloudwave-translator-setup", () => {
      expect(translatorSetupContent).toContain('router.replace("/cloudwave-translator-setup"');
    });

    it("tracks analytics when user chooses agent-assisted", () => {
      expect(translatorSetupContent).toContain('reason: "chose_agent_assisted"');
    });

    it("has styled agent button", () => {
      expect(translatorSetupContent).toContain("agentBtn");
      expect(translatorSetupContent).toContain("agentBtnText");
    });
  });

  describe("AsyncStorage flags", () => {
    it("marks translator setup as shown on completion", () => {
      expect(screenContent).toContain("@connectworld_translator_setup_shown");
    });

    it("sets agent-configured flag", () => {
      expect(screenContent).toContain("@connectworld_translator_agent_configured");
    });
  });
});
