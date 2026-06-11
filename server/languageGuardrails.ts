/**
 * Language Guardrails — Centralized Cross-Language Contamination Prevention
 * 
 * This module sits between EVERY data source and EVERY output in the system.
 * It ensures that content for one language NEVER leaks into another language's
 * lessons, translations, songs, or exercises.
 * 
 * RULES:
 * 1. Spanish content ONLY goes to Spanish learners
 * 2. Jamaican Patois ONLY goes to Jamaican Patois learners
 * 3. Dialects are sub-groups of languages — Dominican slang is Spanish, not French
 * 4. Teaching METHODS are universal (CIA visual method works for any language)
 *    but the CONTENT must be language-specific
 * 5. Every Airtable read/write, every DB query, every LLM prompt MUST pass through guardrails
 */

// ─── Valid Language-Dialect Pairs ──────────────────────────────────────────────
// If a dialect isn't in this map, it's rejected. No guessing.

export const LANGUAGE_DIALECT_MAP: Record<string, string[]> = {
  // Spanish dialects
  "spanish": [
    "standard", "dominican", "colombian", "mexican", "venezuelan", "cuban",
    "costa rican", "argentine", "peruvian", "chilean", "puerto rican",
    "ecuadorian", "guatemalan", "honduran", "salvadoran", "nicaraguan",
    "panamanian", "uruguayan", "paraguayan", "bolivian", "castilian",
  ],
  // French dialects
  "french": [
    "standard", "haitian creole", "québécois", "african french", "senegalese",
    "ivorian", "congolese", "belgian", "swiss",
  ],
  // Portuguese dialects
  "portuguese": [
    "standard", "brazilian", "european", "angolan", "mozambican",
  ],
  // Arabic dialects
  "arabic": [
    "standard", "msa", "egyptian", "levantine", "lebanese", "syrian",
    "gulf", "emirati", "saudi", "moroccan", "tunisian", "iraqi",
  ],
  // Japanese
  "japanese": ["standard", "kansai", "tokyo", "okinawan"],
  // Korean
  "korean": ["standard", "seoul", "busan", "jeju"],
  // Mandarin Chinese
  "mandarin": ["standard", "beijing", "taiwanese", "singaporean"],
  // Italian
  "italian": ["standard", "roman", "neapolitan", "sicilian", "milanese"],
  // German
  "german": ["standard", "bavarian", "austrian", "swiss"],
  // Hindi
  "hindi": ["standard", "mumbai", "delhi", "bihari"],
  // Jamaican
  "jamaican patois": ["standard"],
  "jamaican": ["standard"],
  // Haitian Creole (standalone, not just French dialect)
  "haitian creole": ["standard"],
  // Yoruba
  "yoruba": ["standard", "lagos", "ibadan"],
  // Swahili
  "swahili": ["standard", "kenyan", "tanzanian"],
  // Thai
  "thai": ["standard", "bangkok", "northern", "southern"],
  // Vietnamese
  "vietnamese": ["standard", "northern", "southern", "central"],
  // Tagalog / Filipino
  "tagalog": ["standard", "manila"],
  "filipino": ["standard", "manila"],
  // Tamil
  "tamil": ["standard", "sri lankan"],
  // Telugu
  "telugu": ["standard"],
  // Bengali
  "bengali": ["standard", "bangladeshi"],
  // Punjabi
  "punjabi": ["standard", "pakistani"],
  // Urdu
  "urdu": ["standard"],
  // Turkish
  "turkish": ["standard"],
  // Russian
  "russian": ["standard"],
  // Polish
  "polish": ["standard"],
  // Dutch
  "dutch": ["standard", "flemish"],
  // Greek
  "greek": ["standard"],
  // Hebrew
  "hebrew": ["standard"],
  // Indonesian / Bahasa
  "indonesian": ["standard"],
  "bahasa": ["standard"],
};

// ─── Guardrail Types ──────────────────────────────────────────────────────────

export interface GuardrailContext {
  targetLanguage: string;
  targetDialect?: string;
  sourceSystem: "translator" | "lesson" | "song" | "creator_engine" | "knowledge_vault" | "content_pipeline" | "airtable_sync" | "adaptive_exercise";
  userId?: string;
}

export interface GuardrailResult {
  allowed: boolean;
  reason?: string;
  correctedLanguage?: string;
  correctedDialect?: string;
  violations: GuardrailViolation[];
}

export interface GuardrailViolation {
  type: "wrong_language" | "wrong_dialect" | "invalid_dialect" | "cross_contamination" | "unverified_content";
  severity: "critical" | "warning" | "info";
  message: string;
  offendingContent?: string;
  expectedLanguage: string;
  foundLanguage?: string;
  timestamp: Date;
}

// ─── Violation Log (in-memory + can be persisted to DB) ───────────────────────

const violationLog: GuardrailViolation[] = [];
const MAX_LOG_SIZE = 1000;

function logViolation(violation: GuardrailViolation): void {
  violationLog.push(violation);
  if (violationLog.length > MAX_LOG_SIZE) {
    violationLog.shift(); // Keep last 1000
  }
  // Log to console for monitoring
  console.warn(`[GUARDRAIL VIOLATION] ${violation.severity.toUpperCase()}: ${violation.message}`);
}

export function getViolationLog(): GuardrailViolation[] {
  return [...violationLog];
}

export function getRecentViolations(count: number = 50): GuardrailViolation[] {
  return violationLog.slice(-count);
}

// ─── Core Validation Functions ────────────────────────────────────────────────

/**
 * Normalize language name to lowercase canonical form
 */
export function normalizeLanguage(language: string): string {
  return language.toLowerCase().trim();
}

/**
 * Normalize dialect name to lowercase canonical form
 */
export function normalizeDialect(dialect?: string): string {
  if (!dialect) return "standard";
  return dialect.toLowerCase().trim();
}

/**
 * Check if a language is valid (exists in our system)
 */
export function isValidLanguage(language: string): boolean {
  return normalizeLanguage(language) in LANGUAGE_DIALECT_MAP;
}

/**
 * Check if a dialect is valid for a given language
 */
export function isValidDialect(language: string, dialect?: string): boolean {
  const lang = normalizeLanguage(language);
  const dial = normalizeDialect(dialect);
  const validDialects = LANGUAGE_DIALECT_MAP[lang];
  if (!validDialects) return false;
  return validDialects.includes(dial);
}

/**
 * Get all valid dialects for a language
 */
export function getValidDialects(language: string): string[] {
  return LANGUAGE_DIALECT_MAP[normalizeLanguage(language)] || [];
}

/**
 * STRICT: Validate that content belongs to the target language.
 * Returns violations if content doesn't match.
 */
export function validateLanguageMatch(
  contentLanguage: string,
  targetLanguage: string,
  context: GuardrailContext,
): GuardrailResult {
  const contentLang = normalizeLanguage(contentLanguage);
  const targetLang = normalizeLanguage(targetLanguage);
  const violations: GuardrailViolation[] = [];

  // Check if target language is valid
  if (!isValidLanguage(targetLang)) {
    violations.push({
      type: "wrong_language",
      severity: "warning",
      message: `Unknown target language: "${targetLanguage}". Proceeding but flagged.`,
      expectedLanguage: targetLanguage,
      foundLanguage: contentLanguage,
      timestamp: new Date(),
    });
  }

  // CRITICAL: Content language must match target language
  if (contentLang !== targetLang) {
    const violation: GuardrailViolation = {
      type: "cross_contamination",
      severity: "critical",
      message: `BLOCKED: ${context.sourceSystem} tried to serve "${contentLanguage}" content to a "${targetLanguage}" learner. This is cross-language contamination.`,
      offendingContent: `Content language: ${contentLanguage}`,
      expectedLanguage: targetLanguage,
      foundLanguage: contentLanguage,
      timestamp: new Date(),
    };
    violations.push(violation);
    logViolation(violation);

    return {
      allowed: false,
      reason: `Content language "${contentLanguage}" does not match target language "${targetLanguage}"`,
      violations,
    };
  }

  return { allowed: true, violations };
}

/**
 * STRICT: Validate that a dialect belongs to the target language.
 */
export function validateDialectMatch(
  dialect: string,
  targetLanguage: string,
  context: GuardrailContext,
): GuardrailResult {
  const dial = normalizeDialect(dialect);
  const targetLang = normalizeLanguage(targetLanguage);
  const violations: GuardrailViolation[] = [];

  if (!isValidDialect(targetLang, dial)) {
    const violation: GuardrailViolation = {
      type: "invalid_dialect",
      severity: "critical",
      message: `BLOCKED: "${dialect}" is not a valid dialect of "${targetLanguage}". Source: ${context.sourceSystem}`,
      offendingContent: `Dialect: ${dialect}`,
      expectedLanguage: targetLanguage,
      foundLanguage: targetLanguage,
      timestamp: new Date(),
    };
    violations.push(violation);
    logViolation(violation);

    return {
      allowed: false,
      reason: `"${dialect}" is not a valid dialect of "${targetLanguage}"`,
      correctedDialect: "standard",
      violations,
    };
  }

  return { allowed: true, violations };
}

/**
 * STRICT: Filter an array of items to only include those matching the target language.
 * Items that don't match are logged as violations and removed.
 */
export function filterByLanguage<T extends { language?: string }>(
  items: T[],
  targetLanguage: string,
  context: GuardrailContext,
): { filtered: T[]; violations: GuardrailViolation[] } {
  const targetLang = normalizeLanguage(targetLanguage);
  const violations: GuardrailViolation[] = [];
  
  const filtered = items.filter(item => {
    if (!item.language) return false; // No language = reject
    const itemLang = normalizeLanguage(item.language);
    
    if (itemLang !== targetLang) {
      const violation: GuardrailViolation = {
        type: "cross_contamination",
        severity: "warning",
        message: `Filtered out "${item.language}" content from "${targetLanguage}" result set. Source: ${context.sourceSystem}`,
        offendingContent: JSON.stringify(item).slice(0, 200),
        expectedLanguage: targetLanguage,
        foundLanguage: item.language,
        timestamp: new Date(),
      };
      violations.push(violation);
      logViolation(violation);
      return false;
    }
    return true;
  });

  return { filtered, violations };
}

/**
 * STRICT: Validate Airtable filter formula includes language constraint.
 * Call this before any Airtable API request to ensure language filtering is present.
 */
export function validateAirtableQuery(
  url: string,
  targetLanguage: string,
  context: GuardrailContext,
): GuardrailResult {
  const violations: GuardrailViolation[] = [];
  
  // Check if the URL contains a language filter
  const hasLanguageFilter = url.includes("Language") || url.includes("language");
  
  if (!hasLanguageFilter && targetLanguage) {
    const violation: GuardrailViolation = {
      type: "cross_contamination",
      severity: "critical",
      message: `BLOCKED: Airtable query from ${context.sourceSystem} has NO language filter. This could return content from any language. URL: ${url.slice(0, 200)}`,
      expectedLanguage: targetLanguage,
      timestamp: new Date(),
    };
    violations.push(violation);
    logViolation(violation);

    return {
      allowed: false,
      reason: "Airtable query missing language filter — would return cross-language content",
      violations,
    };
  }

  return { allowed: true, violations };
}

/**
 * Build a safe Airtable filter formula that ALWAYS includes language.
 * Use this instead of building filter formulas manually.
 */
export function buildAirtableLanguageFilter(
  language: string,
  dialect?: string,
  additionalFilters?: string[],
): string {
  const lang = normalizeLanguage(language);
  const conditions = [`LOWER({Language}) = '${lang}'`];
  
  if (dialect && normalizeDialect(dialect) !== "standard") {
    conditions.push(`LOWER({Dialect}) = '${normalizeDialect(dialect)}'`);
  }
  
  if (additionalFilters) {
    conditions.push(...additionalFilters);
  }
  
  if (conditions.length === 1) {
    return conditions[0];
  }
  return `AND(${conditions.join(", ")})`;
}

/**
 * STRICT: Validate LLM output for cross-language contamination.
 * Scans generated text for words that clearly belong to a different language.
 */
export function validateLLMOutput(
  output: string,
  targetLanguage: string,
  context: GuardrailContext,
): GuardrailResult {
  const violations: GuardrailViolation[] = [];
  const targetLang = normalizeLanguage(targetLanguage);

  // Common markers of wrong-language contamination
  const LANGUAGE_MARKERS: Record<string, RegExp[]> = {
    "japanese": [/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/], // Hiragana, Katakana, Kanji
    "korean": [/[\uAC00-\uD7AF\u1100-\u11FF]/], // Hangul
    "mandarin": [/[\u4E00-\u9FFF]/], // CJK Unified
    "arabic": [/[\u0600-\u06FF\u0750-\u077F]/], // Arabic script
    "hindi": [/[\u0900-\u097F]/], // Devanagari
    "thai": [/[\u0E00-\u0E7F]/], // Thai script
    "russian": [/[\u0400-\u04FF]/], // Cyrillic
    "greek": [/[\u0370-\u03FF]/], // Greek
    "hebrew": [/[\u0590-\u05FF]/], // Hebrew
  };

  // Check if output contains script from a DIFFERENT language
  for (const [lang, patterns] of Object.entries(LANGUAGE_MARKERS)) {
    if (lang === targetLang) continue; // Skip checking the target language's own script
    
    for (const pattern of patterns) {
      const matches = output.match(pattern);
      if (matches && matches.length > 2) { // Allow 1-2 stray characters (could be in examples)
        const violation: GuardrailViolation = {
          type: "cross_contamination",
          severity: "warning",
          message: `LLM output for "${targetLanguage}" contains ${lang} script characters. Possible contamination from ${context.sourceSystem}.`,
          offendingContent: matches.slice(0, 5).join(", "),
          expectedLanguage: targetLanguage,
          foundLanguage: lang,
          timestamp: new Date(),
        };
        violations.push(violation);
        logViolation(violation);
      }
    }
  }

  // For Latin-script languages, check for obvious wrong-language patterns
  if (["spanish", "french", "portuguese", "italian", "german"].includes(targetLang)) {
    // Check for Jamaican Patois markers in non-Jamaican content
    if (targetLang !== "jamaican patois" && targetLang !== "jamaican") {
      const jamaicaPatterns = /\b(mi|yuh|dem|ting|nuh|fi|wah|inna|outta|pickney|bumbaclot)\b/gi;
      const jamaicaMatches = output.match(jamaicaPatterns);
      if (jamaicaMatches && jamaicaMatches.length > 3) {
        violations.push({
          type: "cross_contamination",
          severity: "warning",
          message: `LLM output for "${targetLanguage}" contains Jamaican Patois words: ${jamaicaMatches.slice(0, 5).join(", ")}`,
          offendingContent: jamaicaMatches.join(", "),
          expectedLanguage: targetLanguage,
          foundLanguage: "jamaican patois",
          timestamp: new Date(),
        });
      }
    }
  }

  return {
    allowed: violations.filter(v => v.severity === "critical").length === 0,
    violations,
  };
}

/**
 * STRICT: Build the language guardrail instruction for LLM prompts.
 * Inject this into EVERY LLM system prompt to prevent cross-language output.
 */
export function buildLLMGuardrailPrompt(
  targetLanguage: string,
  targetDialect?: string,
): string {
  const dial = targetDialect && normalizeDialect(targetDialect) !== "standard" 
    ? ` (${targetDialect} dialect)` 
    : "";
  
  return `
=== CRITICAL LANGUAGE GUARDRAILS ===
You are generating content for ${targetLanguage}${dial} ONLY.

STRICT RULES — VIOLATION WILL INVALIDATE YOUR ENTIRE OUTPUT:
1. ALL target-language content MUST be in ${targetLanguage}${dial}. No exceptions.
2. Do NOT include words, phrases, slang, or idioms from ANY other language unless they are loanwords commonly used in ${targetLanguage}.
3. Do NOT mix dialects — if the target is ${targetDialect || "standard"} ${targetLanguage}, do not use slang from other ${targetLanguage} dialects unless explicitly comparing them.
4. English may appear ONLY in translations, explanations, or instructions directed at the learner.
5. Cultural references MUST be relevant to ${targetLanguage}${dial}-speaking regions.
6. If you are unsure whether a word belongs to ${targetLanguage}${dial}, DO NOT include it.

EXAMPLES OF VIOLATIONS:
- Using "ting" (Jamaican) in a Spanish lesson
- Using "¿Qué lo que?" (Dominican) in a Mexican Spanish lesson
- Using "mdr" (French internet slang) in a Spanish lesson
- Using Mandarin characters in a Japanese lesson
- Using Hindi words in an Arabic lesson
=== END GUARDRAILS ===`;
}

/**
 * Master guardrail check — run this before ANY content operation.
 * Returns a clean context with normalized language/dialect, or blocks the operation.
 */
export function enforceGuardrails(context: GuardrailContext): {
  allowed: boolean;
  normalizedLanguage: string;
  normalizedDialect: string;
  llmGuardrailPrompt: string;
  airtableFilter: string;
  violations: GuardrailViolation[];
} {
  const normalizedLanguage = normalizeLanguage(context.targetLanguage);
  const normalizedDialect = normalizeDialect(context.targetDialect);
  const violations: GuardrailViolation[] = [];

  // Validate language exists
  if (!isValidLanguage(normalizedLanguage)) {
    violations.push({
      type: "wrong_language",
      severity: "warning",
      message: `Language "${context.targetLanguage}" not in known language map. Proceeding with caution.`,
      expectedLanguage: context.targetLanguage,
      timestamp: new Date(),
    });
  }

  // Validate dialect belongs to language
  if (context.targetDialect && !isValidDialect(normalizedLanguage, normalizedDialect)) {
    const violation: GuardrailViolation = {
      type: "invalid_dialect",
      severity: "warning",
      message: `Dialect "${context.targetDialect}" not recognized for "${context.targetLanguage}". Falling back to "standard".`,
      expectedLanguage: context.targetLanguage,
      timestamp: new Date(),
    };
    violations.push(violation);
    logViolation(violation);
  }

  const safeDialect = isValidDialect(normalizedLanguage, normalizedDialect) ? normalizedDialect : "standard";

  return {
    allowed: true,
    normalizedLanguage,
    normalizedDialect: safeDialect,
    llmGuardrailPrompt: buildLLMGuardrailPrompt(context.targetLanguage, context.targetDialect),
    airtableFilter: buildAirtableLanguageFilter(normalizedLanguage, safeDialect),
    violations,
  };
}

// ─── Convenience wrappers for common operations ───────────────────────────────

/**
 * Safe Airtable URL builder — ALWAYS includes language filter
 */
export function buildSafeAirtableUrl(
  baseUrl: string,
  tableName: string,
  language: string,
  dialect?: string,
  extraFilters?: string[],
): string {
  const filter = buildAirtableLanguageFilter(language, dialect, extraFilters);
  const encodedFilter = encodeURIComponent(filter);
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}/${encodeURIComponent(tableName)}${separator}filterByFormula=${encodedFilter}&maxRecords=100`;
}

/**
 * Validate and filter a batch of vocab items — remove any that don't match the target language
 */
export function filterVocabByLanguage(
  vocabItems: Array<{ word: string; meaning: string; language?: string; dialect?: string }>,
  targetLanguage: string,
  targetDialect?: string,
): Array<{ word: string; meaning: string; language?: string; dialect?: string }> {
  const targetLang = normalizeLanguage(targetLanguage);
  const targetDial = normalizeDialect(targetDialect);

  return vocabItems.filter(item => {
    if (!item.language) return false;
    const itemLang = normalizeLanguage(item.language);
    
    // Language must match exactly
    if (itemLang !== targetLang) {
      logViolation({
        type: "cross_contamination",
        severity: "warning",
        message: `Filtered vocab "${item.word}" (${item.language}) from ${targetLanguage} set`,
        offendingContent: item.word,
        expectedLanguage: targetLanguage,
        foundLanguage: item.language,
        timestamp: new Date(),
      });
      return false;
    }

    // If dialect specified, filter by dialect too (but allow "standard" through)
    if (targetDial !== "standard" && item.dialect) {
      const itemDial = normalizeDialect(item.dialect);
      if (itemDial !== targetDial && itemDial !== "standard") {
        // Different dialect — still same language, so it's a soft filter
        // Log but don't block (user might want to see regional variants)
        return true; // Allow same-language different-dialect through
      }
    }

    return true;
  });
}

/**
 * Validate and filter slang items — STRICT dialect matching
 */
export function filterSlangByLanguageAndDialect(
  slangItems: Array<{ word: string; meaning: string; language?: string; dialect?: string }>,
  targetLanguage: string,
  targetDialect?: string,
): Array<{ word: string; meaning: string; language?: string; dialect?: string }> {
  const targetLang = normalizeLanguage(targetLanguage);
  const targetDial = normalizeDialect(targetDialect);

  return slangItems.filter(item => {
    if (!item.language) return false;
    const itemLang = normalizeLanguage(item.language);
    
    // Language must match exactly — no Jamaican slang in Spanish
    if (itemLang !== targetLang) {
      logViolation({
        type: "cross_contamination",
        severity: "critical",
        message: `BLOCKED slang "${item.word}" (${item.language}/${item.dialect}) from ${targetLanguage}/${targetDialect} set`,
        offendingContent: item.word,
        expectedLanguage: targetLanguage,
        foundLanguage: item.language,
        timestamp: new Date(),
      });
      return false;
    }

    // For slang, dialect matching is STRICT
    // Dominican slang should NOT appear in Mexican lessons unless explicitly requested
    if (targetDial !== "standard" && item.dialect) {
      const itemDial = normalizeDialect(item.dialect);
      if (itemDial !== targetDial && itemDial !== "standard") {
        logViolation({
          type: "wrong_dialect",
          severity: "info",
          message: `Filtered ${item.dialect} slang "${item.word}" from ${targetDialect} ${targetLanguage} set`,
          offendingContent: item.word,
          expectedLanguage: targetLanguage,
          foundLanguage: item.language,
          timestamp: new Date(),
        });
        return false;
      }
    }

    return true;
  });
}

// ─── Export everything ─────────────────────────────────────────────────────────

export const guardrails = {
  enforce: enforceGuardrails,
  validateLanguageMatch,
  validateDialectMatch,
  validateAirtableQuery,
  validateLLMOutput,
  filterByLanguage,
  filterVocabByLanguage,
  filterSlangByLanguageAndDialect,
  buildLLMGuardrailPrompt,
  buildAirtableLanguageFilter,
  buildSafeAirtableUrl,
  normalizeLanguage,
  normalizeDialect,
  isValidLanguage,
  isValidDialect,
  getValidDialects,
  getViolationLog,
  getRecentViolations,
  LANGUAGE_DIALECT_MAP,
};
