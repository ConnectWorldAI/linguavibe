/**
 * ConnectWorld AI — Video Script Templates
 * 
 * Production-ready script templates for each content category.
 * Each template includes timing, visual direction, dialogue structure,
 * and teaching moment placement.
 * 
 * These templates are used by the content production pipeline to generate
 * original video scripts from creator inspiration sources.
 */

// ─── Script Template Structure ───────────────────────────────────────────────

export interface ScriptTemplate {
  id: string;
  category: string;
  format: 'short' | 'medium' | 'long';
  duration: string;               // e.g., "30-60 sec", "3-5 min"
  platform: string[];             // Best platforms for this format
  structure: ScriptSection[];
  vocabularySlots: number;        // How many words to teach
  culturalMoments: number;        // How many cultural notes to include
  exampleScript: string;          // Full example for reference
}

export interface ScriptSection {
  name: string;
  timing: string;
  purpose: string;
  template: string;              // Fill-in-the-blank template
  visualDirection: string;
  audioDirection: string;
}

// ─── SHORT FORMAT (15-60 seconds) ────────────────────────────────────────────
// Best for: TikTok, Instagram Reels, YouTube Shorts

export const SHORT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'short_slang_drop',
    category: 'slang_teaching',
    format: 'short',
    duration: '15-30 sec',
    platform: ['tiktok', 'instagram', 'youtube_shorts'],
    vocabularySlots: 3,
    culturalMoments: 1,
    structure: [
      {
        name: 'Hook',
        timing: '0-3 sec',
        purpose: 'Stop the scroll immediately',
        template: '[Avatar looks at camera] "Stop saying {TEXTBOOK_PHRASE}. In {COUNTRY}, we say..."',
        visualDirection: 'Close-up face, bold text overlay with ❌ on textbook phrase',
        audioDirection: 'Upbeat background music, confident tone',
      },
      {
        name: 'The Real Way',
        timing: '3-15 sec',
        purpose: 'Teach the slang/real phrase',
        template: '[Avatar demonstrates] "{SLANG_1}" = {MEANING_1}\n"{SLANG_2}" = {MEANING_2}\n"{SLANG_3}" = {MEANING_3}',
        visualDirection: 'Split screen: avatar speaking + text overlay with pronunciation',
        audioDirection: 'Each phrase said slowly first, then at natural speed',
      },
      {
        name: 'Context/Example',
        timing: '15-25 sec',
        purpose: 'Show it in a real conversation',
        template: '[Mini scenario] Avatar uses phrase in context: "{EXAMPLE_DIALOGUE}"',
        visualDirection: 'Quick scene change, avatar in relevant setting',
        audioDirection: 'Natural conversation speed, subtitle overlay',
      },
      {
        name: 'CTA',
        timing: '25-30 sec',
        purpose: 'Drive to app or follow',
        template: '"Follow for more {LANGUAGE} that your textbook won\'t teach you. Link in bio to practice with me."',
        visualDirection: 'Avatar points to bio/link, ConnectWorld AI logo appears',
        audioDirection: 'Friendly, inviting tone',
      },
    ],
    exampleScript: `
[Carlos looks at camera, shakes head]
"Stop saying '¿Qué tal?' in the DR. Nobody says that."

[Text overlay: ❌ ¿Qué tal?]

"We say: 'Klok!' — that means 'what's up'"
[Text: Klok! = What's up 🇩🇴]

"Or: 'Dime a ver' — like 'tell me what's good'"
[Text: Dime a ver = Tell me what's good]

"Or just: '¿Qué lo que?' — the classic."
[Text: ¿Qué lo que? = What's happening?]

[Quick scene: Carlos walks up to someone]
"¡Klok, manito! ¿Qué lo que?"
"Aquí, tranquilo. ¿Y tú?"

[Back to camera]
"Follow for more Dominican Spanish. Practice with me on ConnectWorld AI — link in bio."
[Logo appears]
    `,
  },
  {
    id: 'short_survival_phrases',
    category: 'restaurant_food',
    format: 'short',
    duration: '30-45 sec',
    platform: ['tiktok', 'instagram', 'youtube_shorts'],
    vocabularySlots: 5,
    culturalMoments: 1,
    structure: [
      {
        name: 'Hook',
        timing: '0-3 sec',
        purpose: 'Urgency + relevance',
        template: '"Going to {COUNTRY}? You NEED these {NUMBER} phrases at restaurants."',
        visualDirection: 'Avatar in restaurant setting, text countdown overlay',
        audioDirection: 'Urgent/excited tone, restaurant ambience',
      },
      {
        name: 'Rapid Fire Phrases',
        timing: '3-35 sec',
        purpose: 'Teach 5 essential phrases quickly',
        template: '1. "{PHRASE_1}" = {MEANING_1}\n2. "{PHRASE_2}" = {MEANING_2}\n...',
        visualDirection: 'Number countdown, each phrase gets 5-6 seconds, bold text',
        audioDirection: 'Say each phrase clearly, pause for repetition beat',
      },
      {
        name: 'Pro Tip',
        timing: '35-40 sec',
        purpose: 'Cultural bonus that makes them feel insider',
        template: '"Pro tip: {CULTURAL_TIP}"',
        visualDirection: '💡 icon overlay, avatar leans in conspiratorially',
        audioDirection: 'Quieter, like sharing a secret',
      },
      {
        name: 'CTA',
        timing: '40-45 sec',
        purpose: 'Drive downloads',
        template: '"Save this for your trip. Practice ordering with AI on ConnectWorld AI."',
        visualDirection: 'Save icon animation, app logo',
        audioDirection: 'Friendly wrap-up',
      },
    ],
    exampleScript: `
[Valentina in a Colombian restaurant]
"Going to Colombia? You NEED these 5 phrases at restaurants."

[Countdown starts]
"1. 'La carta, por favor' — The menu, please"
"2. '¿Qué me recomienda?' — What do you recommend?"
"3. 'Sin picante' — No spice"
"4. 'La cuenta' — The check"
"5. '¿Aceptan tarjeta?' — Do you take card?"

[Leans in]
"Pro tip: In Medellín, say 'regalame' instead of 'deme.' It's softer and locals love it."

"Save this for your trip. Practice ordering with me on ConnectWorld AI."
    `,
  },
  {
    id: 'short_music_breakdown',
    category: 'music_dance',
    format: 'short',
    duration: '30-60 sec',
    platform: ['tiktok', 'instagram', 'youtube_shorts'],
    vocabularySlots: 5,
    culturalMoments: 1,
    structure: [
      {
        name: 'Hook',
        timing: '0-3 sec',
        purpose: 'Curiosity about a popular song',
        template: '"This song is everywhere right now. But do you know what {ARTIST} is actually saying?"',
        visualDirection: 'Song playing in background, lyrics on screen with ??? marks',
        audioDirection: 'Song snippet (2 sec), then avatar voice',
      },
      {
        name: 'Line-by-Line',
        timing: '3-45 sec',
        purpose: 'Break down 3-4 key lines',
        template: 'Line: "{LYRIC}"\nLiteral: "{LITERAL}"\nActual meaning: "{REAL_MEANING}"',
        visualDirection: 'Lyrics highlighted one at a time, meaning revealed below',
        audioDirection: 'Avatar says the line, then explains',
      },
      {
        name: 'Mind Blown Moment',
        timing: '45-55 sec',
        purpose: 'The one line that surprises everyone',
        template: '"And THIS line? It actually means {SURPRISING_MEANING}. {CULTURAL_CONTEXT}."',
        visualDirection: '🤯 effect, zoom in on the surprising lyric',
        audioDirection: 'Dramatic pause before reveal',
      },
      {
        name: 'CTA',
        timing: '55-60 sec',
        purpose: 'Drive to full breakdown',
        template: '"Full song breakdown on ConnectWorld AI. Learn {LANGUAGE} through the music you already love."',
        visualDirection: 'App screenshot showing song feature, logo',
        audioDirection: 'Upbeat close',
      },
    ],
    exampleScript: `
[Dembow beat playing]
"This Bad Bunny song is everywhere. But do you know what he's actually saying?"

[Lyric on screen: "Yo perreo sola"]
"'Yo perreo sola' — literally 'I twerk alone'"
"But it's really about independence. She doesn't need anyone."

[Next lyric: "Deja que fluya"]
"'Deja que fluya' — 'Let it flow'"
"Means just go with the vibe, stop overthinking."

[Dramatic pause]
"And 'safaera'? That's Puerto Rican slang for a wild party. You won't find that in any textbook."

"Full song breakdowns on ConnectWorld AI. Learn Spanish through music you already love."
    `,
  },
];

// ─── MEDIUM FORMAT (3-5 minutes) ─────────────────────────────────────────────
// Best for: YouTube, ConnectWorld AI TV in-app

export const MEDIUM_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'medium_restaurant_scenario',
    category: 'restaurant_food',
    format: 'medium',
    duration: '3-5 min',
    platform: ['youtube', 'in_app'],
    vocabularySlots: 15,
    culturalMoments: 3,
    structure: [
      {
        name: 'Hook + Setup',
        timing: '0-20 sec',
        purpose: 'Set the scene, create anticipation',
        template: '"I\'m at {RESTAURANT_TYPE} in {CITY}. I\'m going to order ENTIRELY in {LANGUAGE}. Let\'s see if I survive."',
        visualDirection: 'Exterior shot of restaurant type, avatar walking in',
        audioDirection: 'Street sounds, then interior ambience',
      },
      {
        name: 'Pre-Teach',
        timing: '20-60 sec',
        purpose: 'Teach key vocabulary before the scenario',
        template: '"Before we go in, here are 5 words you\'ll need:\n{WORD_1} = {MEANING_1}\n..."',
        visualDirection: 'Vocabulary cards appearing on screen, avatar pointing to each',
        audioDirection: 'Clear pronunciation, repeated twice each',
      },
      {
        name: 'Scenario Part 1: Entering',
        timing: '1:00-2:00',
        purpose: 'Show greeting and seating interaction',
        template: '[Avatar enters, greets host]\nAvatar: "{GREETING}"\nHost: "{RESPONSE}"\n[Subtitle + translation]',
        visualDirection: 'POV entering restaurant, conversation with host character',
        audioDirection: 'Natural conversation speed, subtitles in both languages',
      },
      {
        name: 'Scenario Part 2: Ordering',
        timing: '2:00-3:30',
        purpose: 'The main ordering interaction with menu vocabulary',
        template: '[Avatar reads menu, asks questions, orders]\nAvatar: "{ORDER_PHRASES}"\nWaiter: "{WAITER_RESPONSES}"',
        visualDirection: 'Close-up of menu items, avatar pointing, waiter interaction',
        audioDirection: 'Slower pace for learning, key phrases highlighted',
      },
      {
        name: 'Cultural Moment',
        timing: '3:30-4:00',
        purpose: 'Share a cultural insight about dining in this country',
        template: '"Fun fact: In {COUNTRY}, {CULTURAL_FACT}. So don\'t be surprised if {SITUATION}."',
        visualDirection: 'Avatar breaks fourth wall, speaks directly to camera',
        audioDirection: 'Conversational, sharing a secret',
      },
      {
        name: 'Scenario Part 3: Paying',
        timing: '4:00-4:30',
        purpose: 'Show how to ask for the check and pay',
        template: '[Avatar asks for check, handles payment]\n"{PAYMENT_PHRASES}"',
        visualDirection: 'Check arriving, payment interaction',
        audioDirection: 'Natural speed',
      },
      {
        name: 'Recap + CTA',
        timing: '4:30-5:00',
        purpose: 'Quick vocabulary recap and app promotion',
        template: '"Today you learned {X} new words. Practice this exact scenario with an AI tutor on ConnectWorld AI."',
        visualDirection: 'Vocabulary recap cards, app download animation',
        audioDirection: 'Upbeat, encouraging close',
      },
    ],
    exampleScript: `
[Exterior: colorful street in Santo Domingo]
Carlos: "I'm at a comedor in Santo Domingo. I'm ordering EVERYTHING in Dominican Spanish. No textbook allowed."

[Pre-teach section]
"Before we go in, 5 words you need:
- 'La bandera' — the flag (but it's also the national dish: rice, beans, meat)
- 'Morir soñando' — literally 'to die dreaming' (it's a drink: OJ + milk)
- 'Chin' — a little bit
- 'Vaina' — thing (everything is a vaina)
- 'Dime a ver' — tell me / what's up"

[Enters comedor]
Carlos: "¡Buenas! ¿Hay espacio pa' uno?"
Host: "¡Claro que sí! Siéntate ahí, mi amor."
[Subtitle: "Of course! Sit there, honey."]
Carlos to camera: "See? 'Mi amor' doesn't mean she loves me. Everyone says that here."

[Ordering]
Carlos: "Déjame una bandera con pollo guisado."
Waitress: "¿Con jugo o morir soñando?"
Carlos: "Morir soñando, porfa."
Carlos to camera: "She asked juice or 'die dreaming.' I'm going with die dreaming."

[Cultural moment]
"Fun fact: In the DR, you don't ask for the check. You just catch the waiter's eye and do this [hand gesture]. Saying 'la cuenta' is fine but the gesture is faster."

[Paying]
Carlos: "¿Cuánto es la vaina?"
Waitress: "Trescientos."
Carlos: "Aquí tiene. Quédese con el cambio."
[Subtitle: "How much is the thing?" / "300 pesos." / "Here. Keep the change."]

[Recap]
"Today you learned 15 Dominican words you'll NEVER find in a textbook. Practice ordering at a Dominican restaurant with me on ConnectWorld AI. Link in description."
    `,
  },
  {
    id: 'medium_cook_and_learn',
    category: 'cooking',
    format: 'medium',
    duration: '4-6 min',
    platform: ['youtube', 'in_app'],
    vocabularySlots: 20,
    culturalMoments: 3,
    structure: [
      {
        name: 'Hook',
        timing: '0-15 sec',
        purpose: 'Show the finished dish, create desire',
        template: '"This is {DISH_NAME}. It\'s the most famous {MEAL_TYPE} in {COUNTRY}. And by the end of this video, you\'ll know how to make it AND order it in {LANGUAGE}."',
        visualDirection: 'Beautiful shot of finished dish, then avatar in kitchen',
        audioDirection: 'Mouth-watering description, upbeat music',
      },
      {
        name: 'Ingredients (Vocabulary)',
        timing: '15-90 sec',
        purpose: 'Teach ingredient names in target language',
        template: '"Let\'s start with ingredients. In {LANGUAGE}:\n{INGREDIENT_1} = {NAME_1}\n..."',
        visualDirection: 'Each ingredient shown with label in target language + English',
        audioDirection: 'Clear pronunciation, pause between each',
      },
      {
        name: 'Cooking Steps (Action Verbs)',
        timing: '1:30-4:00',
        purpose: 'Teach cooking verbs while actually cooking',
        template: '"Now we {VERB_1} ({TRANSLATION}). See how I {ACTION}? In {LANGUAGE} we say {PHRASE}."',
        visualDirection: 'Overhead cooking shots, verb labels appearing as actions happen',
        audioDirection: 'Narrating each step in target language first, then English',
      },
      {
        name: 'Cultural Story',
        timing: '4:00-4:45',
        purpose: 'Share the history/culture behind this dish',
        template: '"This dish exists because {HISTORY}. In {COUNTRY}, families make this for {OCCASION}."',
        visualDirection: 'Avatar pauses cooking, speaks to camera, maybe old photos/illustrations',
        audioDirection: 'Storytelling tone, softer music',
      },
      {
        name: 'Final Dish + Recap',
        timing: '4:45-5:30',
        purpose: 'Show result, recap vocabulary',
        template: '"And there it is! {DISH_NAME}. Today you learned {X} ingredients, {Y} cooking verbs, and the story behind one of {COUNTRY}\'s most beloved dishes."',
        visualDirection: 'Beautiful final plating shot, vocabulary recap overlay',
        audioDirection: 'Proud, satisfied tone',
      },
      {
        name: 'CTA',
        timing: '5:30-6:00',
        purpose: 'Drive to app',
        template: '"Want to learn how to ORDER this at a restaurant in {CITY}? Practice with {AVATAR_NAME} on ConnectWorld AI."',
        visualDirection: 'App preview, download buttons',
        audioDirection: 'Friendly invitation',
      },
    ],
    exampleScript: `
[Beautiful plate of mangu with los tres golpes]
Mireille: "This is mangu con los tres golpes. It's THE Dominican breakfast. By the end of this video, you'll know how to make it AND talk about it in Spanish."

[Ingredients laid out]
"Plátanos verdes — green plantains (the star)"
"Mantequilla — butter"
"Cebolla roja — red onion"
"Salami — same word! Easy."
"Queso frito — fried cheese"
"Huevos — eggs"

[Cooking]
"First, we 'hervimos' (boil) the plátanos. Hervir = to boil."
[Overhead: plantains in water]
"Now we 'majamos' (mash) them. Majar = to mash. See the texture?"
[Mashing with butter]
"The secret? 'Un chin de mantequilla' — a little bit of butter. 'Un chin' is Dominican for 'a little.'"
[Frying onions]
"We 'freímos' the cebolla. Freír = to fry. These go on top."

[Cultural story]
"'Los tres golpes' means 'the three hits.' Salami, cheese, eggs — that's the three hits that come with your mangu. Every Dominican grew up eating this. Your abuela made it at 6 AM. It's not just food, it's identity."

[Final dish]
"And there it is. Mangu con los tres golpes. You just learned 20 words — ingredients, verbs, and culture. Not bad for 5 minutes."

"Want to order this at a comedor in Santo Domingo? Practice with Carlos on ConnectWorld AI. He'll teach you the Dominican way."
    `,
  },
];

// ─── LONG FORMAT (5-10 minutes) ──────────────────────────────────────────────
// Best for: YouTube main channel, ConnectWorld AI TV premium content

export const LONG_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'long_day_in_life',
    category: 'travel_city',
    format: 'long',
    duration: '7-10 min',
    platform: ['youtube', 'in_app'],
    vocabularySlots: 30,
    culturalMoments: 5,
    structure: [
      {
        name: 'Cold Open',
        timing: '0-15 sec',
        purpose: 'Cinematic hook showing the city',
        template: '[Drone/wide shot of {CITY}. Avatar voiceover:] "Today I\'m spending an entire day in {CITY}, speaking ONLY {LANGUAGE}. Every interaction. Every meal. Every conversation."',
        visualDirection: 'Cinematic city shots, golden hour, iconic landmarks',
        audioDirection: 'Ambient city sounds, then avatar voiceover',
      },
      {
        name: 'Morning Routine',
        timing: '15 sec - 2:00',
        purpose: 'Morning vocabulary: coffee, breakfast, greetings',
        template: '[Avatar at local café/breakfast spot]\n"Morning in {CITY} starts with {MORNING_RITUAL}..."',
        visualDirection: 'Cozy morning light, café interior, food close-ups',
        audioDirection: 'Calm morning music, natural conversation',
      },
      {
        name: 'Transportation',
        timing: '2:00-3:30',
        purpose: 'Getting around: directions, transit vocabulary',
        template: '[Avatar navigating public transit or streets]\n"To get to {DESTINATION}, I need to {TRANSPORT_ACTION}..."',
        visualDirection: 'POV of transit, street signs in target language, map overlays',
        audioDirection: 'City sounds, avatar narrating directions',
      },
      {
        name: 'Market/Shopping',
        timing: '3:30-5:00',
        purpose: 'Shopping vocabulary, haggling, numbers',
        template: '[Avatar at local market]\n"This market has {ITEMS}. Let me try to buy {ITEM} in {LANGUAGE}..."',
        visualDirection: 'Colorful market stalls, close-ups of products with labels',
        audioDirection: 'Market ambience, vendor interactions',
      },
      {
        name: 'Lunch',
        timing: '5:00-6:30',
        purpose: 'Restaurant vocabulary, local cuisine',
        template: '[Avatar at local restaurant]\n"For lunch, locals eat {DISH}. Let me order..."',
        visualDirection: 'Restaurant interior, menu close-ups, food beauty shots',
        audioDirection: 'Restaurant ambience, ordering conversation',
      },
      {
        name: 'Cultural Activity',
        timing: '6:30-8:00',
        purpose: 'Cultural vocabulary, history, traditions',
        template: '[Avatar at cultural site/activity]\n"This {PLACE/ACTIVITY} is famous because {HISTORY}..."',
        visualDirection: 'Cultural site shots, avatar exploring, historical context overlays',
        audioDirection: 'Reflective music, storytelling tone',
      },
      {
        name: 'Evening/Social',
        timing: '8:00-9:00',
        purpose: 'Social vocabulary, nightlife, casual conversation',
        template: '[Avatar at evening spot]\n"In the evening, people in {CITY} like to {ACTIVITY}..."',
        visualDirection: 'Evening lights, social setting, casual interactions',
        audioDirection: 'Evening ambience, upbeat music',
      },
      {
        name: 'Recap + Reflection',
        timing: '9:00-10:00',
        purpose: 'Summarize what was learned, emotional close',
        template: '"Today I learned {X} words, had {Y} conversations, and discovered {INSIGHT} about {CITY}. The best way to learn a language is to LIVE it."',
        visualDirection: 'Sunset/night city shots, vocabulary recap montage',
        audioDirection: 'Reflective, inspiring music, warm tone',
      },
    ],
    exampleScript: `
[Drone shot over Medellín at sunrise, mountains, city waking up]
Valentina (voiceover): "Today I'm spending an entire day in Medellín, speaking ONLY Colombian Spanish. Every interaction. Every meal. Every conversation. Let's see how it goes."

[Morning - café in El Poblado]
"Morning in Medellín starts with 'un tintico' — that's a small black coffee. Not 'café' like the textbook says. Tintico."
[Orders at counter] "Regálame un tintico y una almojábana, porfa."
"'Regálame' literally means 'gift me' but here it just means 'give me.' It's softer than 'deme.' Paisas are polite like that."

[Metro]
"Medellín has the only metro in Colombia. To get to the center, I say: 'Disculpe, ¿cuál estación para el centro?'"
[On the metro] "Everyone here says 'con mucho gusto' instead of 'de nada.' It means 'with much pleasure.' That's peak paisa."

[Mercado]
"This is Plaza Minorista. 3,000 vendors. Let me buy some fruit."
"'¿A cómo la libra de mango?' — How much per pound of mango?"
"Vendor: 'Tres mil, mami.' — 3,000 pesos, about 75 cents."
"'Regalame dos libras.' — Give me two pounds."
"Pro tip: always say 'vecino' (neighbor) to vendors. They love it."

[Lunch - bandeja paisa]
"THE Colombian dish: bandeja paisa. It has EVERYTHING."
[Points to each item] "Frijoles, arroz, chicharrón, carne molida, chorizo, huevo frito, tajadas, arepa, aguacate..."
"That's 9 vocabulary words in one plate."

[Comuna 13]
"This neighborhood was once the most dangerous in the world. Now it's the most colorful. The murals tell stories of resilience."
"'Resiliencia' — same word in Spanish. 'Transformación' — transformation. The people here turned pain into art."

[Evening - salsa bar]
"Medellín at night means salsa. 'Bailar' = to dance. 'La pista' = the dance floor."
[At the bar] "'Una michelada, por favor.' — That's beer with lime and salt."

[Sunset over the city]
"Today: 30+ words. 8 real conversations. 1 incredible city. You don't learn a language from a book. You learn it by living it. Practice a day in Medellín with Valentina on ConnectWorld AI."
    `,
  },
];

// ─── Template Registry ───────────────────────────────────────────────────────

export const ALL_TEMPLATES = [...SHORT_TEMPLATES, ...MEDIUM_TEMPLATES, ...LONG_TEMPLATES];

/**
 * Get the best template(s) for a given content category and desired format.
 */
export function getTemplatesForCategory(
  category: string,
  format?: 'short' | 'medium' | 'long'
): ScriptTemplate[] {
  return ALL_TEMPLATES.filter(t => {
    const categoryMatch = t.category === category;
    const formatMatch = format ? t.format === format : true;
    return categoryMatch && formatMatch;
  });
}

/**
 * Get all templates suitable for a given platform.
 */
export function getTemplatesForPlatform(platform: string): ScriptTemplate[] {
  return ALL_TEMPLATES.filter(t => t.platform.includes(platform));
}
