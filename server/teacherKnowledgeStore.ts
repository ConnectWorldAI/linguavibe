/**
 * Shared Knowledge Base Store
 * 
 * Central store for AI teacher knowledge, shared between:
 * - teacherRouter (manual ingestion + AI teacher chat)
 * - autoIngestScheduler (automated daily ingestion)
 * 
 * In production, this would be backed by PostgreSQL.
 * For now, it's in-memory with the same interface.
 */

export interface KnowledgeEntry {
  id: string;
  url: string;
  title: string;
  transcript: string;
  language: string;
  dialect: string;
  platform: string;
  createdAt: string;
  status: "processing" | "ready" | "failed";
  error?: string;
  source?: "manual" | "auto"; // Whether admin added manually or auto-ingested
}

// Global knowledge base: { [language-dialect]: KnowledgeEntry[] }
const knowledgeBase: Map<string, KnowledgeEntry[]> = new Map();

function generateId(): string {
  return `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Add content to the knowledge base.
 * Used by both manual ingestion and auto-ingestion.
 */
export function addToKnowledgeBase(entry: {
  url: string;
  title: string;
  transcript: string;
  language: string;
  dialect: string;
  platform: string;
  source?: "manual" | "auto";
}): string {
  const dialectKey = `${entry.language.toLowerCase()}-${(entry.dialect || "standard").toLowerCase()}`;
  const id = generateId();

  const fullEntry: KnowledgeEntry = {
    id,
    url: entry.url,
    title: entry.title,
    transcript: entry.transcript,
    language: entry.language,
    dialect: entry.dialect || "Standard",
    platform: entry.platform,
    createdAt: new Date().toISOString(),
    status: "ready",
    source: entry.source || "auto",
  };

  if (!knowledgeBase.has(dialectKey)) {
    knowledgeBase.set(dialectKey, []);
  }
  knowledgeBase.get(dialectKey)!.push(fullEntry);

  console.log(`[KnowledgeBase] Added ${entry.source || "auto"} content: "${entry.title}" for ${entry.language} (${entry.dialect})`);

  return id;
}

/**
 * Get all knowledge entries for a specific language/dialect.
 */
export function getKnowledge(language: string, dialect?: string): KnowledgeEntry[] {
  const dialectKey = `${language.toLowerCase()}-${(dialect || "standard").toLowerCase()}`;
  return (knowledgeBase.get(dialectKey) || []).filter(e => e.status === "ready");
}

/**
 * Get knowledge for both the specific dialect AND the standard version of the language.
 */
export function getKnowledgeWithFallback(language: string, dialect?: string): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = [];

  // Get dialect-specific
  const dialectKey = `${language.toLowerCase()}-${(dialect || "standard").toLowerCase()}`;
  const dialectEntries = knowledgeBase.get(dialectKey) || [];
  entries.push(...dialectEntries.filter(e => e.status === "ready"));

  // Also get standard if different
  const standardKey = `${language.toLowerCase()}-standard`;
  if (dialectKey !== standardKey) {
    const standardEntries = knowledgeBase.get(standardKey) || [];
    entries.push(...standardEntries.filter(e => e.status === "ready"));
  }

  return entries;
}

/**
 * List all entries (with optional filters).
 */
export function listKnowledge(filters?: { language?: string; dialect?: string }): KnowledgeEntry[] {
  const results: KnowledgeEntry[] = [];

  Array.from(knowledgeBase.entries()).forEach(([_key, entries]) => {
    for (const entry of entries) {
      if (filters?.language && entry.language.toLowerCase() !== filters.language.toLowerCase()) continue;
      if (filters?.dialect && entry.dialect.toLowerCase() !== filters.dialect.toLowerCase()) continue;
      results.push(entry);
    }
  });

  return results;
}

/**
 * Delete an entry by ID.
 */
export function deleteKnowledge(id: string): boolean {
  for (const [_key, entries] of knowledgeBase.entries()) {
    const idx = entries.findIndex(e => e.id === id);
    if (idx !== -1) {
      entries.splice(idx, 1);
      return true;
    }
  }
  return false;
}

/**
 * Get stats about the knowledge base.
 */
export function getKnowledgeStats(): {
  totalEntries: number;
  languages: string[];
  dialects: string[];
  byLanguage: Record<string, number>;
} {
  const stats = {
    totalEntries: 0,
    languages: new Set<string>(),
    dialects: new Set<string>(),
    byLanguage: {} as Record<string, number>,
  };

  Array.from(knowledgeBase.entries()).forEach(([_key, entries]) => {
    const readyEntries = entries.filter(e => e.status === "ready");
    for (const entry of readyEntries) {
      stats.totalEntries++;
      stats.languages.add(entry.language);
      stats.dialects.add(entry.dialect);
      stats.byLanguage[entry.language] = (stats.byLanguage[entry.language] || 0) + 1;
    }
  });

  return {
    totalEntries: stats.totalEntries,
    languages: Array.from(stats.languages),
    dialects: Array.from(stats.dialects),
    byLanguage: stats.byLanguage,
  };
}
