/**
 * Seed Portuguese Content for Validation
 * 
 * Submits sample Portuguese lessons inspired by @teachersfrombrazil
 * to the content validation queue for native speaker review.
 * 
 * Run: npx tsx scripts/seed-portuguese-content.ts
 */

const SAMPLE_LESSONS = [
  {
    contentType: "lesson" as const,
    language: "Portuguese",
    dialect: "Brazilian",
    title: "Greetings & Introductions (Cultural Storytelling)",
    sourceCreator: "@teachersfrombrazil",
    content: {
      topic: "Greetings & Introductions",
      level: "A1",
      method: "Cultural Storytelling",
      exercises: [
        {
          type: "story_choice",
          title: "Meeting at a Festa Junina",
          scenario: "You arrive at a Festa Junina in São Paulo and need to greet people.",
          character: { name: "Ana", role: "Festival organizer", emoji: "🎉" },
          steps: [
            {
              prompt: "Oi! Tudo bem?",
              promptTranslation: "Hi! Everything good?",
              pronunciation: "oy! TOO-doo beng?",
              options: ["Tudo bem, e você?", "Adiós amigo", "Bonjour", "Gracias"],
              correctIndex: 0,
              correctFeedback: "Perfeito! 'Tudo bem, e você?' is the natural response.",
              wrongFeedback: "That's not Portuguese! Try 'Tudo bem, e você?' (Everything good, and you?)",
              culturalNote: "Brazilians greet with warmth — a kiss on the cheek is common between friends.",
            },
            {
              prompt: "Como você se chama?",
              promptTranslation: "What's your name?",
              pronunciation: "KO-moo vo-SAY see SHA-ma?",
              options: ["Me chamo...", "Yo me llamo...", "Je m'appelle...", "Watashi wa..."],
              correctIndex: 0,
              correctFeedback: "Muito bem! 'Me chamo' is how you say your name in Brazilian Portuguese.",
              wrongFeedback: "Remember, we're speaking Portuguese! Use 'Me chamo...' (My name is...)",
              culturalNote: "Brazilians often use nicknames — 'apelidos' — even in semi-formal settings.",
            },
          ],
          vocabularyLearned: [
            { word: "Oi", pronunciation: "oy", meaning: "Hi (informal)" },
            { word: "Tudo bem?", pronunciation: "TOO-doo beng", meaning: "Everything good? / How are you?" },
            { word: "Me chamo", pronunciation: "mee SHA-moo", meaning: "My name is" },
            { word: "Prazer", pronunciation: "pra-ZAIR", meaning: "Nice to meet you" },
          ],
        },
      ],
    },
  },
  {
    contentType: "lesson" as const,
    language: "Portuguese",
    dialect: "Brazilian",
    title: "Ordering Food at a Boteco (Contextual Immersion)",
    sourceCreator: "@teachersfrombrazil",
    content: {
      topic: "Food & Restaurants",
      level: "A2",
      method: "Contextual Immersion",
      exercises: [
        {
          type: "conversation_chain",
          title: "At the Boteco",
          scenario: "You're at a traditional Brazilian bar (boteco) in Rio and want to order food and drinks.",
          character: { name: "Carlos", role: "Waiter", emoji: "🍺" },
          steps: [
            {
              prompt: "Boa noite! O que vai querer?",
              promptTranslation: "Good evening! What would you like?",
              pronunciation: "BOH-ah NOY-chee! oo kee vai keh-RAIR?",
              options: ["Quero uma caipirinha, por favor", "Un café, s'il vous plaît", "I want a beer", "Quiero una cerveza"],
              correctIndex: 0,
              correctFeedback: "Ótimo! A caipirinha is Brazil's national cocktail — great choice!",
              wrongFeedback: "In Portuguese, say 'Quero uma caipirinha, por favor' (I want a caipirinha, please)",
              culturalNote: "Botecos are casual neighborhood bars where Brazilians socialize. They serve petiscos (snacks) with drinks.",
            },
            {
              prompt: "Quer algum petisco também?",
              promptTranslation: "Want some snacks too?",
              pronunciation: "kair al-GOOM peh-CHEES-koo tam-BENG?",
              options: ["Sim, quero uma porção de pastel", "No gracias", "Oui, merci", "Yes please"],
              correctIndex: 0,
              correctFeedback: "Perfeito! Pastel is a beloved Brazilian fried pastry — a boteco staple!",
              wrongFeedback: "Try 'Sim, quero uma porção de pastel' (Yes, I want a portion of pastel)",
              culturalNote: "Pastel is a deep-fried pastry filled with meat, cheese, or shrimp — essential boteco food.",
            },
          ],
          vocabularyLearned: [
            { word: "Boteco", pronunciation: "bo-TEH-koo", meaning: "Casual bar/pub" },
            { word: "Caipirinha", pronunciation: "kai-pee-REE-nya", meaning: "Brazilian cocktail (cachaça, lime, sugar)" },
            { word: "Petisco", pronunciation: "peh-CHEES-koo", meaning: "Snack/appetizer" },
            { word: "Porção", pronunciation: "por-SOWNG", meaning: "Portion/serving" },
            { word: "Pastel", pronunciation: "pas-TEL", meaning: "Fried pastry" },
          ],
        },
      ],
    },
  },
  {
    contentType: "phrase" as const,
    language: "Portuguese",
    dialect: "Brazilian",
    title: "Common Brazilian Slang Phrases (Carioca)",
    sourceCreator: "@teachersfrombrazil",
    content: {
      phrases: [
        { phrase: "Valeu!", pronunciation: "va-LEW", meaning: "Thanks! / Cheers!", context: "Informal thanks, used everywhere in Brazil" },
        { phrase: "Beleza!", pronunciation: "beh-LEH-za", meaning: "Cool! / Alright!", context: "Carioca way of saying 'okay' or 'sounds good'" },
        { phrase: "Tá ligado?", pronunciation: "tah lee-GAH-doo", meaning: "You know? / You feel me?", context: "Rio slang to check understanding" },
        { phrase: "Mano", pronunciation: "MA-noo", meaning: "Bro / Dude", context: "Common among young Brazilians, especially in São Paulo" },
        { phrase: "Saudade", pronunciation: "saw-DAH-jee", meaning: "Deep longing/missing someone", context: "Untranslatable Portuguese word — a core cultural concept" },
        { phrase: "Gato/Gata", pronunciation: "GA-too / GA-ta", meaning: "Hot guy/girl (literally: cat)", context: "Compliment used to describe attractive people" },
      ],
    },
  },
  {
    contentType: "rrt_phrase" as const,
    language: "Portuguese",
    dialect: "Brazilian",
    title: "RRT Drill: Essential Verbs (Present Tense)",
    sourceCreator: "@teachersfrombrazil",
    content: {
      phrases: [
        { phrase: "Eu falo português", translation: "I speak Portuguese", pronunciation: "EW FA-loo por-too-GAYS" },
        { phrase: "Você entende?", translation: "Do you understand?", pronunciation: "vo-SAY en-TEN-jee?" },
        { phrase: "Nós vamos à praia", translation: "We're going to the beach", pronunciation: "nohs VA-mohs ah PRAI-ah" },
        { phrase: "Ela mora no Rio", translation: "She lives in Rio", pronunciation: "EH-la MO-ra noo HEE-oo" },
        { phrase: "Eles trabalham muito", translation: "They work a lot", pronunciation: "EH-lees tra-BA-lyam MWEEN-too" },
      ],
    },
  },
  {
    contentType: "dictation_clip" as const,
    language: "Portuguese",
    dialect: "Brazilian",
    title: "Netflix Dictation: Everyday Conversations",
    sourceCreator: "@teachersfrombrazil",
    content: {
      clips: [
        { text: "Você quer sair hoje à noite?", translation: "Do you want to go out tonight?", speed: "normal" },
        { text: "Preciso ir ao supermercado comprar frutas", translation: "I need to go to the supermarket to buy fruits", speed: "normal" },
        { text: "O trânsito está horrível hoje", translation: "Traffic is horrible today", speed: "fast" },
        { text: "Vamos tomar um café depois do trabalho?", translation: "Let's have coffee after work?", speed: "normal" },
      ],
    },
  },
];

async function seedContent() {
  const API_URL = process.env.API_URL || "http://127.0.0.1:3000";
  
  console.log("🇧🇷 Seeding Portuguese content for validation...\n");
  
  let successCount = 0;
  let failCount = 0;

  for (const lesson of SAMPLE_LESSONS) {
    try {
      const response = await fetch(`${API_URL}/api/trpc/contentValidation.submitForReview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            contentType: lesson.contentType,
            language: lesson.language,
            dialect: lesson.dialect,
            title: lesson.title,
            content: lesson.content,
            sourceCreator: lesson.sourceCreator,
          },
        }),
      });

      const result = await response.json();
      
      if (result?.result?.data?.json?.success) {
        console.log(`✅ Submitted: "${lesson.title}" (${lesson.contentType})`);
        successCount++;
      } else {
        console.log(`⚠️  Submitted with warning: "${lesson.title}" — ${result?.result?.data?.json?.message || "unknown"}`);
        successCount++; // Still counts as submitted
      }
    } catch (err: any) {
      console.log(`❌ Failed: "${lesson.title}" — ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Results: ${successCount} submitted, ${failCount} failed`);
  console.log("📋 Check the Content Review Queue in Admin Command Center to review these lessons.");
}

seedContent().catch(console.error);
