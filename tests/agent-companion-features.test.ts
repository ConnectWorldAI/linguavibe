import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const agentContextPath = join(__dirname, "..", "lib", "agent-context.tsx");
const agentContextContent = readFileSync(agentContextPath, "utf-8");

describe("Wave Cloud Companion AI Features", () => {
  describe("Real AI chat backend wiring", () => {
    it("imports vanillaClient for tRPC calls", () => {
      expect(agentContextContent).toContain('import { vanillaClient } from "@/lib/trpc"');
    });

    it("calls waveCloudChat.chat.mutate for AI responses", () => {
      expect(agentContextContent).toContain("vanillaClient.waveCloudChat.chat.mutate");
    });

    it("passes conversationHistory to AI calls", () => {
      expect(agentContextContent).toContain("conversationHistory");
    });

    it("passes memoryContext to AI calls", () => {
      expect(agentContextContent).toContain("memoryContext: ctx.memoryContext");
    });

    it("passes personalityMode to AI calls", () => {
      expect(agentContextContent).toContain("personalityMode:");
    });

    it("passes studentName and studentMood", () => {
      expect(agentContextContent).toContain("studentName: ctx.studentName");
      expect(agentContextContent).toContain("studentMood: ctx.studentMood");
    });

    it("passes learning context (targetLanguage, learningLevel, daysSinceStart, currentStreak)", () => {
      expect(agentContextContent).toContain("targetLanguage: ctx.targetLanguage");
      expect(agentContextContent).toContain("learningLevel: ctx.learningLevel");
      expect(agentContextContent).toContain("daysSinceStart: ctx.daysSinceStart");
      expect(agentContextContent).toContain("currentStreak: ctx.currentStreak");
    });

    it("passes recentStruggles and recentWins", () => {
      expect(agentContextContent).toContain("recentStruggles: ctx.recentStruggles");
      expect(agentContextContent).toContain("recentWins: ctx.recentWins");
    });
  });

  describe("Memory recording", () => {
    it("records user messages via recordMessage", () => {
      expect(agentContextContent).toContain('m.recordMessage("user", text)');
    });

    it("records AI responses via recordMessage", () => {
      expect(agentContextContent).toContain('m.recordMessage("wave_cloud", responseText');
    });

    it("periodically extracts memories via extractMemories", () => {
      expect(agentContextContent).toContain("vanillaClient.waveCloudChat.extractMemories.mutate");
    });

    it("stores extracted goals via recordLifeGoal", () => {
      expect(agentContextContent).toContain("memory.recordLifeGoal(mem.content)");
    });

    it("stores extracted struggles via recordLifeChallenge", () => {
      expect(agentContextContent).toContain("memory.recordLifeChallenge(mem.content)");
    });

    it("stores extracted insights via recordCoachingInsight", () => {
      expect(agentContextContent).toContain("memory.recordCoachingInsight");
    });
  });

  describe("Companion quick actions in ACTION_MAP", () => {
    it("has motivate me action", () => {
      expect(agentContextContent).toContain('"motivate me"');
      expect(agentContextContent).toContain("companion_motivate");
    });

    it("has life advice action", () => {
      expect(agentContextContent).toContain('"life advice"');
      expect(agentContextContent).toContain("companion_advice");
    });

    it("has how am i doing action", () => {
      expect(agentContextContent).toContain('"how am i doing"');
      expect(agentContextContent).toContain("companion_progress");
    });

    it("has my tasks action", () => {
      expect(agentContextContent).toContain('"my tasks"');
      expect(agentContextContent).toContain("companion_tasks");
    });

    it("has wellbeing check-in action", () => {
      expect(agentContextContent).toContain('"check in"');
      expect(agentContextContent).toContain("companion_wellbeing");
    });

    it("has social skills / make friends action", () => {
      expect(agentContextContent).toContain('"how to make friends"');
      expect(agentContextContent).toContain("companion_social");
    });

    it("has call wave cloud action", () => {
      expect(agentContextContent).toContain('"call wave cloud"');
      expect(agentContextContent).toContain("companion_call");
    });
  });

  describe("Companion keyword mappings", () => {
    it("maps motivat keyword to motivate me", () => {
      expect(agentContextContent).toContain('motivat: "motivate me"');
    });

    it("maps advice keyword to life advice", () => {
      expect(agentContextContent).toContain('advice: "life advice"');
    });

    it("maps task keyword to my tasks", () => {
      expect(agentContextContent).toContain('task: "my tasks"');
    });

    it("maps wellbeing keyword to wellbeing check", () => {
      expect(agentContextContent).toContain('wellbeing: "wellbeing check"');
    });

    it("maps social keyword to how to make friends", () => {
      expect(agentContextContent).toContain('social: "how to make friends"');
    });

    it("maps influence keyword to how to make friends", () => {
      expect(agentContextContent).toContain('influence: "how to make friends"');
    });
  });

  describe("Companion action handlers", () => {
    it("has handleCompanionAction function", () => {
      expect(agentContextContent).toContain("handleCompanionAction");
    });

    it("uses motivator personality mode for motivation", () => {
      expect(agentContextContent).toContain('personalityMode: "motivator"');
    });

    it("uses life_advisor personality mode for advice", () => {
      expect(agentContextContent).toContain('personalityMode: "life_advisor"');
    });

    it("handles companion_progress with streak and wins info", () => {
      expect(agentContextContent).toContain("companion_progress");
      expect(agentContextContent).toContain("ctx.currentStreak");
      expect(agentContextContent).toContain("ctx.recentWins");
    });

    it("handles companion_tasks with getPendingTasks and getOverdueTasks", () => {
      expect(agentContextContent).toContain("memory.getPendingTasks()");
      expect(agentContextContent).toContain("memory.getOverdueTasks()");
    });

    it("handles companion_call by navigating to hume-call", () => {
      expect(agentContextContent).toContain('router.push({ pathname: "/hume-call", params: { mode: "cloudwave", persona: "cloudwave" } }');
    });
  });

  describe("Voice call button", () => {
    it("has a call button in the expanded header", () => {
      expect(agentContextContent).toContain("handleCallPress");
      expect(agentContextContent).toContain('name="call"');
    });

    it("navigates to hume-call on call button press", () => {
      // handleCallPress routes to hume-call
      expect(agentContextContent).toContain("handleCallPress");
    });

    it("has call button styled with success color", () => {
      expect(agentContextContent).toContain("callBtn");
      expect(agentContextContent).toContain("Colors.success");
    });
  });

  describe("Wellbeing check-in integration", () => {
    it("imports WellbeingCheckIn component", () => {
      expect(agentContextContent).toContain('import { WellbeingCheckIn } from "@/components/wellbeing-check-in"');
    });

    it("has showWellbeingCheckIn state", () => {
      expect(agentContextContent).toContain("showWellbeingCheckIn");
    });

    it("renders WellbeingCheckIn component in provider", () => {
      expect(agentContextContent).toContain("<WellbeingCheckIn");
      expect(agentContextContent).toContain("visible={agentState.showWellbeingCheckIn}");
    });

    it("has wellbeing complete handler that records data", () => {
      expect(agentContextContent).toContain("handleWellbeingComplete");
      expect(agentContextContent).toContain("memory.recordWellbeing(entry)");
    });

    it("has wellbeing dismiss handler", () => {
      expect(agentContextContent).toContain("handleWellbeingDismiss");
      expect(agentContextContent).toContain("outreach.recordCheckInDismissed()");
    });
  });

  describe("AI context builder", () => {
    it("builds AI context with student name, mood, memory, and learning data", () => {
      expect(agentContextContent).toContain("buildAIContext");
      expect(agentContextContent).toContain("studentName");
      expect(agentContextContent).toContain("studentMood");
      expect(agentContextContent).toContain("memoryContext");
      expect(agentContextContent).toContain("targetLanguage");
    });

    it("loads data from teacher-memory, learning-intelligence, and srs-gamification", () => {
      expect(agentContextContent).toContain("loadTeacherMemory");
      expect(agentContextContent).toContain("loadIntelligence");
      expect(agentContextContent).toContain("loadGamification");
    });

    it("maps teacher mood to waveCloudChat mood format", () => {
      expect(agentContextContent).toContain("MOOD_MAP");
      expect(agentContextContent).toContain('energized: "great"');
      expect(agentContextContent).toContain('stressed: "stressed"');
    });

    it("caches context and refreshes after AI calls", () => {
      expect(agentContextContent).toContain("cachedContextRef");
      expect(agentContextContent).toContain("buildAIContext().then");
    });
  });

  describe("Quick action buttons in expanded panel", () => {
    it("has Motivate Me quick action button", () => {
      expect(agentContextContent).toContain("Motivate Me");
    });

    it("has Life Advice quick action button", () => {
      expect(agentContextContent).toContain("Life Advice");
    });

    it("has My Progress quick action button", () => {
      expect(agentContextContent).toContain("My Progress");
    });

    it("has My Tasks quick action button", () => {
      expect(agentContextContent).toContain("My Tasks");
    });

    it("has Check In quick action button", () => {
      expect(agentContextContent).toContain("Check In");
    });

    it("has Social Skills quick action button", () => {
      expect(agentContextContent).toContain("Social Skills");
    });
  });

  describe("Input hint reflects companion identity", () => {
    it("shows therapist, coach, motivator, friend identity in input hint", () => {
      expect(agentContextContent).toContain("Therapist");
      expect(agentContextContent).toContain("Coach");
      expect(agentContextContent).toContain("Motivator");
      expect(agentContextContent).toContain("Friend");
      expect(agentContextContent).toContain("I remember everything");
    });
  });
});
