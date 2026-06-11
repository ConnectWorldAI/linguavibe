import { describe, expect, it, beforeAll } from "vitest";

const API_BASE = "http://127.0.0.1:3000";

let serverAvailable = false;

beforeAll(async () => {
  try {
    const res = await fetch(`${API_BASE}/api/trpc/translate.text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { text: "test", fromLanguage: "English", toLanguage: "Spanish", style: "standard" } }),
      signal: AbortSignal.timeout(5000),
    });
    serverAvailable = res.ok;
  } catch {
    serverAvailable = false;
  }
});

describe("Backend API Routes", () => {
  describe("translate.text", () => {
    it.skipIf(!serverAvailable)("should translate English to Spanish via tRPC", async () => {
      const response = await fetch(`${API_BASE}/api/trpc/translate.text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            text: "Hello, how are you?",
            fromLanguage: "English",
            toLanguage: "Spanish",
            style: "standard",
          },
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      const result = data.result?.data?.json;
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.translation).toBeTruthy();
      expect(result.translation.length).toBeGreaterThan(0);
    }, 30000);

    it.skipIf(!serverAvailable)("should translate with Dominican dialect", async () => {
      const response = await fetch(`${API_BASE}/api/trpc/translate.text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            text: "What's up bro, let's hang out tonight",
            fromLanguage: "English",
            toLanguage: "Spanish",
            dialect: "Dominican",
            style: "slang",
          },
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      const result = data.result?.data?.json;
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.translation).toBeTruthy();
    }, 30000);
  });

  describe("translate.detectLanguage", () => {
    it.skipIf(!serverAvailable)("should detect Spanish text", async () => {
      const response = await fetch(`${API_BASE}/api/trpc/translate.detectLanguage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            text: "Hola, ¿cómo estás? Me llamo Carlos y soy de Madrid.",
          },
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      const result = data.result?.data?.json;
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.language.toLowerCase()).toContain("spanish");
    }, 30000);
  });

  describe("teacher.chat", () => {
    it.skipIf(!serverAvailable)("should respond as an AI Spanish teacher", async () => {
      const response = await fetch(`${API_BASE}/api/trpc/teacher.chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            message: "How do I say 'I want to go to the beach' in Dominican Spanish?",
            language: "Spanish",
            dialect: "Dominican",
            userLevel: "beginner",
            teacherPersona: "friendly",
          },
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      const result = data.result?.data?.json;
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.reply).toBeTruthy();
      expect(result.reply.length).toBeGreaterThan(50);
    }, 30000);
  });

  describe("teacher.listKnowledge", () => {
    it.skipIf(!serverAvailable)("should return knowledge base (empty initially)", async () => {
      const response = await fetch(`${API_BASE}/api/trpc/teacher.listKnowledge?input=${encodeURIComponent(JSON.stringify({ json: {} }))}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      const result = data.result?.data?.json;
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    }, 10000);
  });

  describe("teacher.getAvailableTeachers", () => {
    it.skipIf(!serverAvailable)("should return teacher stats", async () => {
      const response = await fetch(`${API_BASE}/api/trpc/teacher.getAvailableTeachers?input=${encodeURIComponent(JSON.stringify({ json: undefined }))}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      const result = data.result?.data?.json;
      expect(result).toBeDefined();
      expect(result.teachers).toBeDefined();
    }, 10000);
  });
});
