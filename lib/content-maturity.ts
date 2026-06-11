/**
 * Content Maturity & Age-Based Filtering System
 * 
 * Two tiers:
 * - Teen (13-17): Mild slang, no hard cursing, no explicit/sexual content
 * - Adult (18+): Full access — cursing, explicit slang, street language, everything
 * 
 * Minimum age to use ConnectWorld AI: 13 (COPPA compliant — no under-13 users)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ContentMaturity = 'clean' | 'mild' | 'explicit';
export type AgeTier = 'teen' | 'adult';

export interface UserAgeProfile {
  birthday: string; // ISO date string (YYYY-MM-DD)
  ageTier: AgeTier;
  cleanModeEnabled: boolean; // Manual override — any user can opt into filtered content
}

// ─── Age Calculation ─────────────────────────────────────────────────────────

/**
 * Calculate age from birthday string.
 */
export function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Determine age tier from birthday.
 * Returns null if under 13 (not allowed to use the app).
 */
export function getAgeTier(birthday: string): AgeTier | null {
  const age = calculateAge(birthday);
  if (age < 13) return null; // Not allowed
  if (age < 18) return 'teen';
  return 'adult';
}

/**
 * Check if user meets minimum age requirement (13+).
 */
export function meetsMinimumAge(birthday: string): boolean {
  return calculateAge(birthday) >= 13;
}

// ─── Content Filtering ───────────────────────────────────────────────────────

/**
 * Determine what content maturity levels a user can access.
 * 
 * Teen (13-17): clean + mild only
 * Adult (18+): clean + mild + explicit (unless Clean Mode is on)
 * Clean Mode override: clean + mild only (regardless of age)
 */
export function getAllowedMaturityLevels(profile: UserAgeProfile): ContentMaturity[] {
  // If user manually enabled Clean Mode, filter explicit regardless of age
  if (profile.cleanModeEnabled) {
    return ['clean', 'mild'];
  }

  switch (profile.ageTier) {
    case 'teen':
      return ['clean', 'mild'];
    case 'adult':
      return ['clean', 'mild', 'explicit'];
    default:
      return ['clean'];
  }
}

/**
 * Check if a specific content item is allowed for the user.
 */
export function isContentAllowed(maturity: ContentMaturity, profile: UserAgeProfile): boolean {
  const allowed = getAllowedMaturityLevels(profile);
  return allowed.includes(maturity);
}

/**
 * Filter an array of items by maturity level.
 * Items must have a `maturity` field.
 */
export function filterByMaturity<T extends { maturity: ContentMaturity }>(
  items: T[],
  profile: UserAgeProfile
): T[] {
  const allowed = getAllowedMaturityLevels(profile);
  return items.filter(item => allowed.includes(item.maturity));
}

// ─── Content Maturity Classification ─────────────────────────────────────────

/**
 * Guidelines for tagging content maturity:
 * 
 * CLEAN:
 * - Standard vocabulary, greetings, everyday phrases
 * - School-appropriate slang (cool, awesome, fire, chido, bacano)
 * - Cultural content (food, music genres, holidays, traditions)
 * - Travel phrases, restaurant ordering, directions
 * 
 * MILD:
 * - Casual slang that's not offensive but informal
 * - Mild insults (tonto, dummy, wack)
 * - Dating/romance vocabulary (not sexual)
 * - Party/nightlife vocabulary (general)
 * - Mild drug references (420, porro — without instruction)
 * 
 * EXPLICIT:
 * - Hard cursing (f-bombs, equivalents in all languages)
 * - Sexual slang and innuendo
 * - Heavy drug vocabulary
 * - Violent slang
 * - Racial/ethnic slurs (taught for awareness, not promotion)
 * - Insults meant to deeply offend
 */

// ─── Persistence ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'user_age_profile';

/**
 * Save user age profile to AsyncStorage.
 */
export async function saveAgeProfile(profile: UserAgeProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/**
 * Load user age profile from AsyncStorage.
 */
export async function loadAgeProfile(): Promise<UserAgeProfile | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  return JSON.parse(data) as UserAgeProfile;
}

/**
 * Create a new age profile from birthday input.
 * Returns null if user is under 13.
 */
export function createAgeProfile(birthday: string): UserAgeProfile | null {
  const tier = getAgeTier(birthday);
  if (!tier) return null; // Under 13, not allowed

  return {
    birthday,
    ageTier: tier,
    cleanModeEnabled: false,
  };
}

/**
 * Toggle Clean Mode on/off.
 */
export async function toggleCleanMode(enabled: boolean): Promise<UserAgeProfile | null> {
  const profile = await loadAgeProfile();
  if (!profile) return null;

  profile.cleanModeEnabled = enabled;
  await saveAgeProfile(profile);
  return profile;
}

// ─── Parental Consent ────────────────────────────────────────────────────────

export interface ParentalConsent {
  parentEmail: string;
  consentGranted: boolean;
  consentDate: string | null; // ISO date
  reminderSent: boolean;
}

const PARENTAL_CONSENT_KEY = 'parental_consent';

/**
 * Save parental consent status.
 */
export async function saveParentalConsent(consent: ParentalConsent): Promise<void> {
  await AsyncStorage.setItem(PARENTAL_CONSENT_KEY, JSON.stringify(consent));
}

/**
 * Load parental consent status.
 */
export async function loadParentalConsent(): Promise<ParentalConsent | null> {
  const data = await AsyncStorage.getItem(PARENTAL_CONSENT_KEY);
  if (!data) return null;
  return JSON.parse(data) as ParentalConsent;
}

/**
 * Check if teen user has parental consent.
 */
export async function hasParentalConsent(): Promise<boolean> {
  const consent = await loadParentalConsent();
  return consent?.consentGranted ?? false;
}

// ─── AI Age Detection ────────────────────────────────────────────────────────

/**
 * AI Age Detection System
 * 
 * Monitors conversation patterns to detect if a user who claimed 18+
 * might actually be under 18. Signals include:
 * - School/homework references ("my teacher said", "I have class tomorrow")
 * - Age-specific slang patterns
 * - Topics discussed (prom, high school, parents' rules)
 * - Time-of-day usage patterns (active during school hours = suspicious)
 * - Self-identification ("I'm 15", "in 10th grade")
 * 
 * If flagged, content auto-filters to Teen Mode as a safety net.
 */

export interface AgeDetectionSignal {
  signal: string;
  confidence: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface AgeDetectionProfile {
  signals: AgeDetectionSignal[];
  flaggedAsMinor: boolean;
  overrideToTeenMode: boolean;
}

const AGE_DETECTION_KEY = 'age_detection_profile';

/**
 * Keywords/patterns that suggest user may be under 18.
 * Used by AI agents to flag conversations.
 */
export const MINOR_DETECTION_PATTERNS = [
  // Direct age statements
  /i('m|\s+am)\s+(1[0-7]|\d)\s*(years?\s*old|yo|y\.o)/i,
  /i('m|\s+am)\s+in\s+(\d+)(th|st|nd|rd)?\s+grade/i,
  // School references
  /my\s+(teacher|principal|counselor)/i,
  /(high\s+school|middle\s+school|8th|9th|10th|11th|12th)\s+grade/i,
  /(homework|school\s+project|prom|homecoming)/i,
  // Parent authority references
  /my\s+(mom|dad|parents?)\s+(won't|don't|doesn't)\s+(let|allow)/i,
  /past\s+my\s+bedtime/i,
  /grounded/i,
];

/**
 * Check message against minor detection patterns.
 * Returns detected signals.
 */
export function detectMinorSignals(message: string): AgeDetectionSignal[] {
  const signals: AgeDetectionSignal[] = [];
  
  for (const pattern of MINOR_DETECTION_PATTERNS) {
    if (pattern.test(message)) {
      signals.push({
        signal: pattern.source,
        confidence: message.match(/i('m|\s+am)\s+(1[0-7])/) ? 'high' : 'medium',
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  return signals;
}

/**
 * Evaluate if accumulated signals warrant flagging user as minor.
 * Threshold: 1 high-confidence signal OR 3+ medium signals.
 */
export function shouldFlagAsMinor(signals: AgeDetectionSignal[]): boolean {
  const highConfidence = signals.filter(s => s.confidence === 'high');
  const mediumConfidence = signals.filter(s => s.confidence === 'medium');
  
  return highConfidence.length >= 1 || mediumConfidence.length >= 3;
}

/**
 * Save age detection profile.
 */
export async function saveAgeDetectionProfile(profile: AgeDetectionProfile): Promise<void> {
  await AsyncStorage.setItem(AGE_DETECTION_KEY, JSON.stringify(profile));
}

/**
 * Load age detection profile.
 */
export async function loadAgeDetectionProfile(): Promise<AgeDetectionProfile | null> {
  const data = await AsyncStorage.getItem(AGE_DETECTION_KEY);
  if (!data) return null;
  return JSON.parse(data) as AgeDetectionProfile;
}

/**
 * Get effective content profile — considers both stated age AND AI detection.
 * If AI flags user as likely minor, override to Teen Mode regardless of stated age.
 */
export async function getEffectiveContentProfile(): Promise<UserAgeProfile | null> {
  const profile = await loadAgeProfile();
  if (!profile) return null;
  
  const detection = await loadAgeDetectionProfile();
  
  // If AI detected user is likely a minor, override to teen mode
  if (detection?.overrideToTeenMode && profile.ageTier === 'adult') {
    return {
      ...profile,
      ageTier: 'teen', // Force teen mode
      cleanModeEnabled: profile.cleanModeEnabled,
    };
  }
  
  return profile;
}

// ─── Agent Prompt Injection ──────────────────────────────────────────────────

/**
 * Get the content restriction instructions to inject into agent system prompts
 * based on the user's age tier.
 */
export function getAgentContentRestrictions(profile: UserAgeProfile): string {
  const allowed = getAllowedMaturityLevels(profile);

  if (allowed.includes('explicit')) {
    return `
## Content Restrictions: NONE
This user is 18+ with full access enabled. You may:
- Use explicit slang and cursing naturally when teaching street language
- Teach sexual slang if asked (with cultural context)
- Use strong language for emphasis when appropriate
- Teach insults and how to respond to them
- Cover all content without filtering
Still be respectful — teach, don't promote harmful behavior.
`;
  }

  return `
## Content Restrictions: TEEN MODE (13-17)
This user is under 18. You MUST:
- NEVER use hard cursing (f-word, s-word, or equivalents in any language)
- NEVER teach sexual slang or innuendo
- NEVER reference drugs or illegal activities
- Keep slang to mild/casual level (chido, bacano, cool, fire — OK)
- Mild insults are OK if teaching how to handle them (tonto, dummy)
- If user ASKS about explicit content, say: "That's something you'll unlock when you're 18! For now, let me teach you [alternative]"
- Focus on everyday slang, cultural content, music vocabulary, travel phrases
- You can still be fun, casual, and use real language — just keep it PG-13
`;
}

/**
 * Get the AI age detection instructions to inject into agent system prompts.
 * Agents should monitor for signals and report them.
 */
export function getAgentAgeDetectionInstructions(): string {
  return `
## AI Age Detection (Background Task)
While conversing, passively monitor for signals that this user may be younger than stated:
- Direct age statements ("I'm 15", "I'm in 10th grade")
- School references ("my teacher", "homework", "prom")
- Parental authority ("my mom won't let me", "I'm grounded")
- Time references suggesting school schedule

If you detect HIGH confidence the user is under 18:
1. Immediately switch to Teen Mode content restrictions
2. Do NOT confront the user or accuse them of lying
3. Simply adjust your language naturally (stop cursing, filter explicit content)
4. Flag the signal in your response metadata

Do this silently — never tell the user you're monitoring their age.
`;
}
