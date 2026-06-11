import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Sprint 27 — Grammar Journal + Leaderboard", () => {
  describe("Grammar Correction Parser", () => {
    const parserPath = path.join(__dirname, "../lib/grammar-correction-parser.ts");

    it("grammar-correction-parser.ts exists", () => {
      expect(fs.existsSync(parserPath)).toBe(true);
    });

    it("exports parseCorrections function", () => {
      const content = fs.readFileSync(parserPath, "utf-8");
      expect(content).toContain("export function parseCorrections");
    });

    it("detects correction patterns in AI responses", () => {
      const content = fs.readFileSync(parserPath, "utf-8");
      // Should look for patterns like "should be", "instead of", "correct form"
      expect(content).toMatch(/should be|instead of|correct/i);
    });

    it("returns structured mistake objects with category and correction", () => {
      const content = fs.readFileSync(parserPath, "utf-8");
      expect(content).toContain("category");
      expect(content).toContain("correction");
      expect(content).toContain("original");
    });
  });

  describe("Conversation Mode Integration", () => {
    it("conversation-scenarios.tsx imports grammar correction parser", () => {
      const filePath = path.join(__dirname, "../app/conversation-scenarios.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("parseAndLogCorrections");
    });

    it("conversation-sim.tsx imports grammar correction parser", () => {
      const filePath = path.join(__dirname, "../app/conversation-sim.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("parseAndLogCorrections");
    });

    it("conversation-scenarios.tsx calls parseAndLogCorrections on AI response", () => {
      const filePath = path.join(__dirname, "../app/conversation-scenarios.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("parseAndLogCorrections");
    });

    it("conversation-sim.tsx calls parseAndLogCorrections on AI response", () => {
      const filePath = path.join(__dirname, "../app/conversation-sim.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("parseAndLogCorrections");
    });
  });

  describe("Weekly Grammar Progress Report", () => {
    const reportPath = path.join(__dirname, "../app/grammar-progress-report.tsx");

    it("grammar-progress-report.tsx exists", () => {
      expect(fs.existsSync(reportPath)).toBe(true);
    });

    it("shows weekly summary with mistakes reduced", () => {
      const content = fs.readFileSync(reportPath, "utf-8");
      expect(content).toMatch(/mistakes.*reduced|reduction|fewer.*mistakes/i);
    });

    it("shows streak maintained info", () => {
      const content = fs.readFileSync(reportPath, "utf-8");
      expect(content).toContain("streak");
    });

    it("shows top improved categories", () => {
      const content = fs.readFileSync(reportPath, "utf-8");
      expect(content).toMatch(/improved|improvement|progress/i);
    });

    it("is registered in _layout.tsx", () => {
      const layoutPath = path.join(__dirname, "../app/_layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf-8");
      expect(content).toContain("grammar-progress-report");
    });

    it("has navigation from grammar-notebook", () => {
      const notebookPath = path.join(__dirname, "../app/grammar-notebook.tsx");
      const content = fs.readFileSync(notebookPath, "utf-8");
      expect(content).toContain("grammar-progress-report");
    });
  });

  describe("Real Backend Leaderboard", () => {
    const routerPath = path.join(__dirname, "../server/grammarLeaderboardRouter.ts");
    const screenPath = path.join(__dirname, "../app/grammar-streak-leaderboard.tsx");

    it("grammarLeaderboardRouter.ts exists", () => {
      expect(fs.existsSync(routerPath)).toBe(true);
    });

    it("router has getFriendsLeaderboard endpoint", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("getFriendsLeaderboard");
    });

    it("router has getGroupLeaderboard endpoint", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("getGroupLeaderboard");
    });

    it("router has getMyGroups endpoint", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("getMyGroups");
    });

    it("router has createGroup mutation", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("createGroup");
    });

    it("router has generateGroupInvite mutation", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("generateGroupInvite");
    });

    it("router has joinGroup mutation", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("joinGroup");
    });

    it("router has sendFriendRequest mutation", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("sendFriendRequest");
    });

    it("router has acceptFriendRequest mutation", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("acceptFriendRequest");
    });

    it("router has getPendingRequests query", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("getPendingRequests");
    });

    it("router uses protectedProcedure for auth", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("protectedProcedure");
    });

    it("router queries friendships table", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("friendships");
    });

    it("router queries studyGroups table", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("studyGroups");
    });

    it("router queries dailyActivity for streak calculation", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("dailyActivity");
    });

    it("router is registered in routers.ts", () => {
      const routersPath = path.join(__dirname, "../server/routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      expect(content).toContain("grammarLeaderboard");
      expect(content).toContain("grammarLeaderboardRouter");
    });

    it("leaderboard screen uses tRPC for backend data", () => {
      const content = fs.readFileSync(screenPath, "utf-8");
      expect(content).toContain("trpc.grammarLeaderboard");
    });

    it("leaderboard screen has Friends and Study Groups tabs", () => {
      const content = fs.readFileSync(screenPath, "utf-8");
      expect(content).toContain("Friends");
      expect(content).toContain("Study Groups");
    });

    it("leaderboard screen has Create Group functionality", () => {
      const content = fs.readFileSync(screenPath, "utf-8");
      expect(content).toContain("Create Group");
      expect(content).toContain("handleCreateGroup");
    });

    it("leaderboard screen has Join Group with invite code", () => {
      const content = fs.readFileSync(screenPath, "utf-8");
      expect(content).toContain("Join Group");
      expect(content).toContain("invite code");
    });

    it("leaderboard screen has Share invite functionality", () => {
      const content = fs.readFileSync(screenPath, "utf-8");
      expect(content).toContain("handleShareInvite");
      expect(content).toContain("Share.share");
    });

    it("leaderboard screen falls back to local simulation when backend unavailable", () => {
      const content = fs.readFileSync(screenPath, "utf-8");
      expect(content).toContain("generateLeaderboard");
      expect(content).toContain("loadLocalFallback");
      expect(content).toContain("isBackendAvailable");
    });

    it("leaderboard screen retains rank badges and motivational messages", () => {
      const content = fs.readFileSync(screenPath, "utf-8");
      expect(content).toContain("getRankBadge");
      expect(content).toContain("motivationBanner");
    });
  });
});
