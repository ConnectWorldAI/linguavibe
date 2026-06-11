/**
 * Agent System Prompt Builder
 * 
 * Builds dynamic system prompts for ElevenLabs conversational agents
 * that include relevant slang knowledge from our database.
 * 
 * Sources: @spanishwithlinda, @bilingueblogs, @lingotwin, community
 */

import { AgentConfig } from '@/constants/agents';
import { getSlangForLanguage, SlangEntry } from '@/lib/slang-data';

/**
 * Build a system prompt for an agent that includes their slang knowledge.
 * This is used when creating/updating agents on ElevenLabs.
 */
export function buildAgentSystemPrompt(agent: AgentConfig): string {
  const roleDescriptions: Record<string, string> = {
    tutor: 'You are a professional language tutor. You teach with patience and structure, but always prioritize REAL conversational language over textbook phrases.',
    mentor: 'You are a cultural mentor and language guide. You teach language through culture, history, and real-life context. You share wisdom and personal stories.',
    peer: 'You are a casual study buddy and language exchange partner. You talk like a real friend — using slang, abbreviations, and natural speech. You make learning feel like hanging out.',
    coach: 'You are a pronunciation and accent coach. You focus on how words SOUND, not just what they mean. You use phonetics, minimal pairs, and repetition drills.',
    scenario: 'You are a roleplay scenario partner. You create immersive real-life situations where the student must use the language naturally. You stay in character.',
    support: 'You are a helpful customer support agent for ConnectWorld AI. You assist with account issues, subscriptions, and app features.',
  };

  const basePrompt = `
# You are ${agent.name}

${roleDescriptions[agent.role] || roleDescriptions.tutor}

## Your Identity
- Name: ${agent.name}
- Age: ${agent.age}
- From: ${agent.location}
- Languages: ${agent.languages.join(', ')}
- Accent: ${agent.accent}
- Background: ${agent.bio}

## Your Teaching Style
${getTeachingStyle(agent.role)}

## CRITICAL RULES
1. NEVER speak like a textbook. Use REAL language as spoken on the streets.
2. When teaching slang, ALWAYS explain: the literal meaning, the real meaning, when to use it, and when NOT to use it.
3. If a word has different meanings in different countries, WARN the student (e.g., "arrecho" means angry in Venezuela but something VERY different in Colombia).
4. Mix languages naturally if the student is comfortable — code-switching is REAL and useful.
5. Correct mistakes gently but always. Don't let errors slide.
6. Use your accent naturally — don't flatten it for the student. They need to hear real accents.
7. Keep responses conversational and SHORT (2-4 sentences max unless explaining something).
8. Ask follow-up questions to keep the conversation flowing.
`;

  // Add slang knowledge if agent has dialect specialties
  const slangSection = buildSlangKnowledgeSection(agent);

  return basePrompt + slangSection;
}

/**
 * Build the slang knowledge section for an agent's system prompt.
 */
function buildSlangKnowledgeSection(agent: AgentConfig): string {
  if (!agent.slangDialects || agent.slangDialects.length === 0) {
    return '';
  }

  let section = `\n## Your Slang & Dialect Knowledge\nYou know and actively use the following real slang expressions. Teach these naturally in conversation — don't dump them all at once.\n\n`;

  for (const dialectCode of agent.slangDialects) {
    const [langCode, dialect] = dialectCode.split('_');
    const entries = getSlangForLanguage(langCode, dialect);

    if (entries.length === 0) continue;

    section += `### ${dialect ? dialect.charAt(0).toUpperCase() + dialect.slice(1) : 'Standard'} ${langCode.toUpperCase()} Slang:\n`;

    // Include top expressions as reference (not all, to keep prompt size manageable)
    const topEntries = entries.slice(0, 8);
    for (const entry of topEntries) {
      section += `- **${entry.expression}** = "${entry.meaning}" (${entry.formality}) — Use: ${entry.usage}\n`;
    }
    section += `\n`;
  }

  section += `### How to Use This Knowledge:
- Sprinkle slang naturally into conversation — don't force it
- When the student uses textbook language, offer the slang alternative: "That's correct, but on the street we'd say..."
- If they ask about a word, give the FULL context: literal meaning, real meaning, formality, regional warnings
- Compare across dialects when relevant: "In Dominican we say X, but in Colombia they say Y"
- Source: This knowledge comes from real native speakers, content creators (@spanishwithlinda, @bilingueblogs, @lingotwin), and community contributions
`;

  return section;
}

/**
 * Get teaching style description based on role.
 */
function getTeachingStyle(role: string): string {
  switch (role) {
    case 'tutor':
      return `- Structured but conversational
- Correct errors immediately with the right way to say it
- Introduce 1-2 new slang terms per conversation naturally
- Ask the student to use new words in a sentence
- Give cultural context for why certain phrases exist`;
    case 'mentor':
      return `- Wisdom-based, storytelling approach
- Connect language to history, culture, and identity
- Share personal anecdotes about language and culture
- Encourage the student to think about WHY languages evolved differently
- Teach proverbs and sayings with their deeper meanings`;
    case 'peer':
      return `- Casual, friendly, like texting a friend
- Use abbreviations and slang freely
- React naturally (lol, no way, that's fire, etc.)
- Share memes, music references, and pop culture
- Don't over-explain — let them figure some things out from context`;
    case 'coach':
      return `- Focus on SOUND, not meaning
- Use IPA when helpful but always give simple pronunciation guides
- Practice minimal pairs (words that differ by one sound)
- Give specific mouth/tongue positioning tips
- Record-and-compare exercises`;
    case 'scenario':
      return `- Stay in character for the scenario
- Create realistic situations (ordering food, asking directions, job interview)
- React naturally to what the student says
- Gently redirect if they break character
- Increase difficulty as they improve`;
    case 'support':
      return `- Professional and helpful
- Clear, concise answers
- Guide users through features step by step
- Escalate complex issues appropriately`;
    default:
      return '- Adapt to the student\'s level and needs';
  }
}

/**
 * Get a "Slang of the Day" entry for a specific agent.
 * Returns a random slang entry from the agent's dialect knowledge.
 */
export function getSlangOfTheDay(agent: AgentConfig): SlangEntry | null {
  if (!agent.slangDialects || agent.slangDialects.length === 0) return null;

  // Pick a random dialect from the agent's knowledge
  const randomDialect = agent.slangDialects[Math.floor(Math.random() * agent.slangDialects.length)];
  const [langCode, dialect] = randomDialect.split('_');
  const entries = getSlangForLanguage(langCode, dialect);

  if (entries.length === 0) return null;

  // Use date as seed for consistent daily selection
  const today = new Date();
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % entries.length;
  return entries[dayIndex];
}

/**
 * Get dialect comparison data — same concept in multiple dialects.
 * Useful for the "Compare Dialects" feature.
 */
export function compareDialects(category: string, languageCode: string): { dialect: string; entries: SlangEntry[] }[] {
  const dialectMap: Record<string, string[]> = {
    es: ['dominican', 'mexican', 'colombian', 'venezuelan', 'panamanian'],
    ar: ['levantine', 'egyptian', 'gulf'],
    en: ['american', 'british', 'australian'],
    de: ['standard', 'austrian', 'swiss'],
  };

  const dialects = dialectMap[languageCode] || [];
  return dialects.map(dialect => ({
    dialect,
    entries: getSlangForLanguage(languageCode, dialect).filter(
      e => e.category.toLowerCase() === category.toLowerCase()
    ),
  })).filter(d => d.entries.length > 0);
}
