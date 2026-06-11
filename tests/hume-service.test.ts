import { describe, it, expect, beforeAll } from "vitest";

const API_BASE = "http://127.0.0.1:3000/api/trpc";

let serverAvailable = false;

beforeAll(async () => {
  try {
    const res = await fetch(`${API_BASE}/hume.healthCheck`, {
      signal: AbortSignal.timeout(5000),
    });
    serverAvailable = res.ok;
  } catch {
    serverAvailable = false;
  }
});

describe("Hume AI Service", () => {
  it.skipIf(!serverAvailable)("should have health check endpoint responding", async () => {
    const res = await fetch(`${API_BASE}/hume.healthCheck`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    const result = data.result?.data?.json;
    expect(result).toBeDefined();
    expect(result.hasApiKey).toBe(true);
    expect(result.hasSecretKey).toBe(true);
  });

  it.skipIf(!serverAvailable)("should connect to Hume API successfully", async () => {
    const res = await fetch(`${API_BASE}/hume.healthCheck`);
    const data = await res.json();
    const result = data.result.data.json;
    expect(result.connected).toBe(true);
    expect(result.status).toBe(200);
  });

  it.skipIf(!serverAvailable)("should list available personas", async () => {
    const res = await fetch(`${API_BASE}/hume.listPersonas`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    const personas = data.result?.data?.json;
    expect(Array.isArray(personas)).toBe(true);
    expect(personas.length).toBeGreaterThan(10);
    
    // Check key personas exist
    const personaIds = personas.map((p: any) => p.id);
    expect(personaIds).toContain("cloudwave");
    expect(personaIds).toContain("ai_teacher_spanish");
    expect(personaIds).toContain("surprise_caller");
    expect(personaIds).toContain("pronunciation_coach");
    expect(personaIds).toContain("live_translator");
    expect(personaIds).toContain("virtual_classroom");
  });

  it.skipIf(!serverAvailable)("should have correct persona features", async () => {
    const res = await fetch(`${API_BASE}/hume.listPersonas`);
    const data = await res.json();
    const personas = data.result?.data?.json;
    
    const cloudwave = personas.find((p: any) => p.id === "cloudwave");
    expect(cloudwave.features.emotionDetection).toBe(true);
    expect(cloudwave.features.knowledgeInjection).toBe(true);
    
    const pronunciationCoach = personas.find((p: any) => p.id === "pronunciation_coach");
    expect(pronunciationCoach.features.pronunciationTracking).toBe(true);
    
    const liveTranslator = personas.find((p: any) => p.id === "live_translator");
    expect(liveTranslator.features.adaptiveResponse).toBe(false);
  });
});
