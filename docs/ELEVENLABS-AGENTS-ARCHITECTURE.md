# ElevenLabs Agents Architecture Plan for ConnectWorld AI

**Author:** Manus AI
**Date:** May 26, 2026
**Version:** 1.0

---

## 1. Executive Summary

This document defines the complete architecture for integrating ElevenLabs Conversational AI 2.0 and ElevenLabs Agents into ConnectWorld AI's language learning platform. It covers seven distinct agent types, their placement within the learning journey, the technical infrastructure required, and the pedagogical rationale behind every design decision.

ElevenLabs Agents provide a real-time voice conversation layer powered by four core components: a fine-tuned Speech-to-Text (ASR) model, a configurable Large Language Model (LLM), a low-latency Text-to-Speech engine with over 5,000 voices across 70+ languages, and a proprietary turn-taking model that handles natural conversation timing [1]. By deploying purpose-built agents at specific points in the ConnectWorld AI learning flow, students gain immersive, voice-first practice that static exercises cannot replicate.

---

## 2. Agent Roster

ConnectWorld AI will deploy seven specialized agent types. Each agent is a separate configuration on the ElevenLabs dashboard with its own system prompt, voice, knowledge base, tools, and analysis criteria.

| Agent ID | Agent Name | Primary Role | Where in App | Subscription Tier |
|----------|-----------|-------------|-------------|-------------------|
| `agent_tutor` | AI Tutor | 1-on-1 structured lessons via voice | AI Teacher tab, Lesson screens | Plus+ |
| `agent_freeconv` | Free Conversation Partner | Open-ended practice in target language | Practice Mode, Home quick-call | Plus+ |
| `agent_scenario` | Scenario Agent | Role-play real-world situations | Dream Vacation, AI Scenarios | Pro |
| `agent_pronunciation` | Pronunciation Coach | Drill and correct pronunciation | Pronunciation Drill screen | Plus+ |
| `agent_surprise` | Surprise Caller | Unscheduled calls to test readiness | Push notification → call screen | Pro |
| `agent_group` | Group Class Facilitator | Moderate multi-student voice sessions | Virtual Classroom | Pro |
| `agent_support` | Customer Support Agent | Answer app questions, troubleshoot | Settings → Help, in-app chat | Free |

---

## 3. Where Each Agent Lives in the Learning Journey

The following diagram maps the student's progression through ConnectWorld AI and shows exactly where each agent activates.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STUDENT LEARNING JOURNEY                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STAGE 1: FOUNDATION (A1-A2)                                       │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────┐            │
│  │ Lessons  │───▶│ AI Tutor     │───▶│ Pronunciation  │            │
│  │ (static) │    │ (agent_tutor)│    │ Coach          │            │
│  └──────────┘    └──────────────┘    │(agent_pronun.) │            │
│                                      └────────────────┘            │
│                                                                     │
│  STAGE 2: PRACTICE (A2-B1)                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ Free Conv.   │───▶│ Scenario     │───▶│ Surprise     │          │
│  │ Partner      │    │ Agent        │    │ Caller       │          │
│  │(agent_free.) │    │(agent_scen.) │    │(agent_surpr.)│          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                     │
│  STAGE 3: IMMERSION (B1-C2)                                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ Group Class  │───▶│ Dream Vaca.  │───▶│ Song/Culture │          │
│  │ Facilitator  │    │ Scenarios    │    │ Discussions   │          │
│  │(agent_group) │    │(agent_scen.) │    │(agent_free.) │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                     │
│  ALWAYS AVAILABLE:                                                  │
│  ┌──────────────┐                                                   │
│  │ Support Agent│  (agent_support) — Help, FAQ, troubleshooting    │
│  └──────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Detailed Agent Specifications

### 4.1 AI Tutor (`agent_tutor`)

**What it does.** The AI Tutor is the backbone of ConnectWorld AI's structured learning. It presents vocabulary, grammar rules, and cultural context through natural voice conversation rather than static text. It follows the pre-built curriculum (A1 through C2) and adapts its difficulty based on the student's real-time performance.

**When it activates.** The AI Tutor activates in two contexts: (a) when a student opens a lesson from the Lessons tab and taps "Start with AI Teacher," and (b) during scheduled 1-on-1 tutoring sessions booked through the app. Each session lasts 5 to 30 minutes depending on the lesson plan.

**Where it appears.** The AI Tutor screen replaces the current static lesson player. It renders as a full-screen voice call interface with the teacher's avatar, a speaking/listening indicator, a live transcript panel, and a "corrections" sidebar that populates in real time.

**How it works technically.**

The agent is configured on the ElevenLabs dashboard with a system prompt that includes the full lesson plan for the current unit. When the student starts a session, the app calls `startSession()` with dynamic variables injected at runtime:

```typescript
await startSession({
  agentId: "agent_tutor_id",
  dynamicVariables: {
    student_name: user.name,
    target_language: "Dominican Spanish",
    current_level: "A2",
    lesson_unit: "Unit 3: Ordering Food",
    lesson_vocabulary: JSON.stringify(lessonData.vocabulary),
    lesson_grammar: lessonData.grammarPoint,
    cultural_hint: lessonData.culturalHint,
    weak_areas: JSON.stringify(user.weakAreas),
  },
});
```

The system prompt references these variables with `{{student_name}}`, `{{target_language}}`, etc. The agent follows a structured flow: greet the student, introduce the topic, present vocabulary through conversation, quiz the student verbally, correct mistakes immediately, and summarize what was learned.

**Client tools** registered on the app side allow the agent to trigger in-app actions during the lesson:

| Client Tool | What It Does |
|-------------|-------------|
| `showVocabularyCard` | Displays a vocabulary card with image and translation on screen |
| `playPronunciationAudio` | Plays the correct native pronunciation of a word |
| `markExerciseComplete` | Updates the lesson progress in AsyncStorage |
| `showCulturalNote` | Displays a cultural context card (food, tradition, etc.) |
| `adjustDifficulty` | Tells the app to increase or decrease exercise complexity |
| `saveCorrection` | Logs a pronunciation or grammar correction to the student's profile |

**Why it is placed here.** Structured lessons are the core of language acquisition. Research consistently shows that interactive, conversational practice produces better retention than passive reading [2]. By placing the AI Tutor at the lesson level, every grammar point and vocabulary set is reinforced through spoken dialogue. The tutor also catches mistakes the moment they happen — if it makes an error itself, it sends a voice memo correction to the student afterward, following the error correction protocol.

**Voice configuration.** Each teacher in the ConnectWorld AI roster (Maria from Santo Domingo, Yuki from Tokyo, Pierre from Paris, etc.) maps to a specific ElevenLabs voice ID. The voice is selected based on the student's chosen teacher and target language/dialect. Language-specific voice overrides ensure the Dominican Spanish teacher uses a Dominican accent, not a generic Spanish voice.

**Post-call analysis.** Every tutoring session is evaluated with these criteria:

| Criterion | Description |
|-----------|-------------|
| `lesson_objectives_met` | Did the student demonstrate understanding of the lesson's vocabulary and grammar? |
| `pronunciation_quality` | Overall pronunciation accuracy during the session |
| `engagement_level` | Did the student actively participate or give minimal responses? |
| `errors_corrected` | Count of errors caught and corrected by the tutor |

Data collected from each session feeds into the student's progress profile, enabling the adaptive difficulty system to adjust future lessons.

---

### 4.2 Free Conversation Partner (`agent_freeconv`)

**What it does.** The Free Conversation Partner provides open-ended, unstructured voice practice. Unlike the AI Tutor, it has no lesson plan — it simply talks with the student about any topic in the target language, gently correcting errors along the way.

**When it activates.** Students access it from the Home screen "Quick Call" button, the Practice Mode section, or after completing a structured lesson (as a "practice what you just learned" prompt). Sessions are unlimited in length for Plus and Pro subscribers.

**Where it appears.** A dedicated call screen with the selected teacher avatar, a waveform visualizer, and a floating transcript that shows the last few exchanges. A "Topics" button lets the student suggest conversation themes.

**How it works technically.** The agent's system prompt instructs it to be a friendly conversation partner who speaks primarily in the target language, adjusts complexity to the student's level, and naturally weaves in corrections. Dynamic variables pass the student's level, interests, and recently learned vocabulary so the agent can reference them organically.

```typescript
await startSession({
  agentId: "agent_freeconv_id",
  dynamicVariables: {
    student_name: user.name,
    target_language: "French",
    dialect: "Parisian",
    proficiency_level: "B1",
    recent_vocabulary: JSON.stringify(recentWords),
    interests: "cooking, travel, football",
  },
});
```

The conversation flow is configured with **turn eagerness set to "normal"** and **interruptions enabled**, creating a natural back-and-forth rhythm. The soft timeout is set to 3 seconds with filler phrases in the target language ("Hmm, voyons..." for French, "Bueno, a ver..." for Spanish).

**Why it is placed here.** Free conversation is the bridge between structured learning and real-world fluency. Students need a safe space to practice speaking without the pressure of a curriculum. Placing it as a one-tap action from the Home screen ensures students use it frequently — the lower the friction, the more they practice.

---

### 4.3 Scenario Agent (`agent_scenario`)

**What it does.** The Scenario Agent role-plays real-world situations: ordering at a restaurant, checking into a hotel, negotiating at a market, asking for directions, going through airport customs, visiting a doctor, and dozens more. Each scenario has a defined character, setting, and objective the student must accomplish through conversation.

**When it activates.** Students access scenarios from the Dream Vacation Mode (city-specific scenarios), the AI Conversation Scenarios section, or as post-lesson practice tied to the current unit's theme (e.g., after a food vocabulary lesson, the "Order at a Dominican restaurant" scenario unlocks).

**Where it appears.** A themed call screen with a background image matching the scenario location, the character's avatar and name (e.g., "Carlos — Waiter at El Mesón"), and a mission objective displayed at the top ("Order a meal for two people, ask about the daily special, and request the check").

**How it works technically.** Each scenario is a separate agent configuration (or a single agent with heavy override usage). The system prompt defines the character's personality, the setting, what the student needs to accomplish, and how the character should respond to mistakes.

```typescript
await startSession({
  agentId: "agent_scenario_id",
  overrides: {
    agent: {
      prompt: scenarioPrompts[scenarioId],
      first_message: scenarioFirstMessages[scenarioId],
    },
    tts: {
      voice_id: scenarioVoices[scenarioId],
    },
  },
  dynamicVariables: {
    student_name: user.name,
    target_language: "Dominican Spanish",
    proficiency_level: "A2",
    scenario_objective: "Order a meal and ask for the check",
    scenario_location: "Santo Domingo, Dominican Republic",
    character_name: "Carlos",
    character_role: "Waiter",
  },
});
```

Client tools enable the agent to trigger in-app events during the scenario:

| Client Tool | What It Does |
|-------------|-------------|
| `showMenuItem` | Displays a menu item with image and price (for restaurant scenarios) |
| `showMapDirection` | Shows a map overlay (for direction scenarios) |
| `completeObjective` | Marks a scenario objective as achieved |
| `awardPassportStamp` | Awards a city stamp in the Dream Vacation passport |
| `showCulturalTip` | Displays a cultural tip relevant to the scenario |

**Post-call analysis** evaluates whether the student completed the objective, used appropriate vocabulary, and handled unexpected turns (the waiter says the daily special is sold out — can the student adapt?).

**Why it is placed here.** Scenario-based learning is the highest-impact practice for real-world readiness. A student who has practiced ordering food in Dominican Spanish 10 times with an AI waiter will feel genuinely prepared when they sit down at a real restaurant in Santo Domingo. Tying scenarios to Dream Vacation Mode and post-lesson practice creates a natural progression: learn the words → practice with the tutor → use them in a realistic situation.

---

### 4.4 Pronunciation Coach (`agent_pronunciation`)

**What it does.** The Pronunciation Coach is a specialized agent focused exclusively on pronunciation accuracy. It drills individual sounds, words, and phrases, provides detailed feedback on what the student is doing wrong (tongue placement, vowel length, stress patterns), and tracks improvement over time.

**When it activates.** Students access it from the Pronunciation Drill screen, or it is triggered automatically when the AI Tutor detects repeated pronunciation errors during a lesson (the tutor says "Let's practice that sound — I'm connecting you to the pronunciation coach").

**Where it appears.** A focused drill interface with a large waveform display, the target word/phrase displayed prominently, a visual mouth/tongue placement diagram, and a score (0-100) for each attempt.

**How it works technically.** The agent's system prompt is laser-focused on pronunciation coaching. It speaks slowly and clearly, repeats words multiple times, and uses phonetic descriptions to guide the student. The conversation flow uses **"patient" turn eagerness** so the student has ample time to practice each sound.

```typescript
await startSession({
  agentId: "agent_pronunciation_id",
  dynamicVariables: {
    target_language: "Japanese",
    problem_sounds: JSON.stringify(["r/l distinction", "long vowels", "pitch accent"]),
    current_words: JSON.stringify(["ありがとう", "料理", "旅行"]),
    student_level: "A2",
  },
});
```

Client tools:

| Client Tool | What It Does |
|-------------|-------------|
| `showMouthDiagram` | Displays tongue/lip position diagram for the current sound |
| `playSlowAudio` | Plays the word at 0.5x speed for careful listening |
| `updatePronunciationScore` | Updates the real-time score display (0-100) |
| `logProblemSound` | Records a problematic sound to the student's pronunciation profile |
| `showPhoneticBreakdown` | Displays IPA transcription of the target word |

**Why it is placed here.** Pronunciation is the most common barrier to being understood in a foreign language, yet most language apps treat it as an afterthought. By giving pronunciation its own dedicated agent with specialized tools (mouth diagrams, slow playback, phonetic breakdowns), ConnectWorld AI addresses this gap directly. The handoff from the AI Tutor to the Pronunciation Coach during lessons creates a seamless experience — the student doesn't have to navigate away; the system recognizes the need and transitions automatically.

---

### 4.5 Surprise Caller (`agent_surprise`)

**What it does.** The Surprise Caller is an unscheduled voice agent that "calls" the student at random intervals to test their readiness. It simulates the experience of receiving a phone call from someone who only speaks the target language — the student must respond in real time without preparation.

**When it activates.** The app's background task system schedules surprise calls based on the student's preferences (frequency: daily, every other day, weekly; time window: 9am-9pm). A push notification says "Incoming call from Maria!" and the student has 30 seconds to answer. If they miss it, a voice memo is sent to their inbox with what the caller would have said.

**Where it appears.** A full-screen incoming call UI (identical to a real phone call) with the teacher's avatar, name, and an Accept/Decline button. Once accepted, it transitions to the standard call interface.

**How it works technically.** The server schedules the call using the push notification system. When the student accepts, the app starts a session with the Surprise Caller agent. The agent's system prompt instructs it to act as if it's calling about something specific — asking for help with directions, inviting the student to an event, or checking in about a previous lesson topic.

```typescript
await startSession({
  agentId: "agent_surprise_id",
  dynamicVariables: {
    student_name: user.name,
    target_language: "Korean",
    call_scenario: "Calling to invite student to a friend's birthday party this weekend",
    student_level: "B1",
    recent_lessons: JSON.stringify(recentLessonTopics),
  },
});
```

**Post-call analysis** evaluates response time (how quickly the student formulated answers), vocabulary range, and whether the student successfully handled the conversation's objective.

**Why it is placed here.** Real language fluency means being able to respond without preparation. The Surprise Caller is the closest simulation to real-world spontaneous conversation. It is gated behind Pro tier because it requires server-side scheduling, push notifications, and represents a premium "immersion" feature that differentiates ConnectWorld AI from competitors. The voice memo fallback ensures even missed calls provide learning value.

---

### 4.6 Group Class Facilitator (`agent_group`)

**What it does.** The Group Class Facilitator moderates multi-student voice sessions. It presents topics, calls on individual students, manages turn-taking, corrects errors, and ensures balanced participation across 3-5 students.

**When it activates.** Students join scheduled group classes from the Virtual Classroom. The facilitator agent manages the entire session: opening with a warm-up, presenting the day's topic, facilitating group discussion, running interactive exercises, and closing with a summary.

**Where it appears.** The Virtual Classroom screen with participant avatars, a "raised hand" indicator, the facilitator's avatar prominently displayed, and a shared activity area (vocabulary cards, scenario prompts, etc.).

**How it works technically.** Group sessions require a different architecture than 1-on-1 calls. The facilitator agent connects to a shared session where multiple students' audio streams are mixed. The agent uses client tools to manage the classroom:

| Client Tool | What It Does |
|-------------|-------------|
| `callOnStudent` | Directs a question to a specific student by name |
| `muteAll` | Mutes all students during the agent's presentation |
| `showGroupActivity` | Displays a shared exercise on all students' screens |
| `awardParticipationPoint` | Gives a student a participation point |
| `startTimer` | Starts a countdown timer for timed exercises |
| `sendFollowUp` | Sends a voice memo to a student who didn't get to answer |

**Why it is placed here.** Group learning creates social accountability and motivation. Students who learn with peers are more likely to maintain their streak and continue using the app. The facilitator agent solves the scalability problem — ConnectWorld AI can offer unlimited group classes without hiring human teachers, while still providing a structured, moderated experience.

---

### 4.7 Customer Support Agent (`agent_support`)

**What it does.** The Customer Support Agent answers questions about the app, troubleshoots issues, explains features, and helps with account management. It speaks in the student's native language (not the target language).

**When it activates.** Students access it from Settings → Help & Support, or through a floating help button on any screen. It is available to all users including free tier.

**Where it appears.** A chat/voice interface in a bottom sheet or dedicated support screen. The agent can switch between text and voice modes.

**How it works technically.** The agent's knowledge base contains the full ConnectWorld AI documentation, FAQ, pricing information, and troubleshooting guides. It uses client tools to perform in-app actions:

| Client Tool | What It Does |
|-------------|-------------|
| `navigateToScreen` | Opens a specific screen in the app |
| `openSubscriptionPage` | Takes the student to the paywall |
| `resetLesson` | Resets a stuck or corrupted lesson |
| `submitBugReport` | Creates a bug report with device info |
| `connectToHuman` | Escalates to human support via email |

**Why it is placed here.** Every app needs support, and voice-based support is faster and more accessible than text-based help articles. Making it free ensures all users can get help, which reduces churn. The agent also serves as a subtle upsell channel — when a free user asks about a Pro feature, the agent explains the benefits and offers to navigate to the subscription page.

---

## 5. Integration into the Lesson Flow

This section maps exactly when each agent appears during a typical learning session.

### 5.1 A Single Lesson Session (30 minutes)

| Time | Activity | Agent | What Happens |
|------|----------|-------|-------------|
| 0:00 | Lesson opens | None | Student sees lesson overview (vocabulary list, grammar point, cultural hint) |
| 1:00 | "Start with AI Teacher" tapped | **AI Tutor** | Tutor greets student, introduces today's topic in target language |
| 3:00 | Vocabulary presentation | **AI Tutor** | Tutor introduces 8-10 new words through conversation, triggers `showVocabularyCard` for each |
| 8:00 | Pronunciation check | **AI Tutor** → **Pronunciation Coach** | Tutor detects student struggling with "rr" sound, hands off to Pronunciation Coach for 3-minute drill |
| 11:00 | Return to lesson | **AI Tutor** | Tutor resumes, references the pronunciation practice ("Great, now let's use that word in a sentence") |
| 14:00 | Grammar explanation | **AI Tutor** | Tutor explains grammar point conversationally, asks student to form sentences |
| 18:00 | Cultural context | **AI Tutor** | Tutor shares cultural note (triggers `showCulturalNote`), discusses how the grammar/vocabulary is used in real life |
| 22:00 | Verbal quiz | **AI Tutor** | Tutor quizzes student on all vocabulary and grammar from the lesson |
| 26:00 | Lesson summary | **AI Tutor** | Tutor summarizes what was learned, highlights areas to review, triggers `markExerciseComplete` |
| 27:00 | Practice prompt | None → **Free Conversation** | App suggests "Practice what you learned" — student can start a free conversation using today's vocabulary |
| 30:00 | Session ends | None | Post-call analysis runs, progress updated, corrections saved to profile |

### 5.2 A Weekly Learning Cycle

| Day | Primary Activity | Agents Involved |
|-----|-----------------|----------------|
| Monday | Structured lesson (Unit 5, Lesson 1) | AI Tutor, Pronunciation Coach |
| Tuesday | Free conversation practice (15 min) | Free Conversation Partner |
| Wednesday | Structured lesson (Unit 5, Lesson 2) | AI Tutor |
| Thursday | Scenario practice: "Order at a café" | Scenario Agent |
| Friday | Group class: "Weekend plans discussion" | Group Class Facilitator |
| Saturday | Surprise call (unscheduled) | Surprise Caller |
| Sunday | Song translation + free conversation about the song | Free Conversation Partner |

### 5.3 How Agents Hand Off to Each Other

Agents do not operate in isolation. The system supports seamless handoffs:

The **AI Tutor** can trigger a handoff to the **Pronunciation Coach** mid-lesson when it detects repeated errors. The app ends the tutor session, starts a pronunciation session with the problem sounds pre-loaded, and returns to the tutor session afterward with context preserved.

The **Scenario Agent** can escalate to the **Free Conversation Partner** if the student completes the scenario objective early and wants to keep talking. The conversation shifts from structured role-play to open discussion about the scenario's cultural context.

The **Surprise Caller** generates a post-call summary that feeds into the **AI Tutor's** next session as a dynamic variable, so the tutor can reference it ("I heard you had a great conversation about the birthday party yesterday — let's learn some party vocabulary today").

---

## 6. Technical Architecture

### 6.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     ConnectWorld AI Mobile App                      │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ ConversationProv.│  │ Agent Service    │  │ Client Tools │  │
│  │ (ElevenLabs SDK) │  │ (agent configs,  │  │ (in-app      │  │
│  │                  │  │  session mgmt,   │  │  actions)    │  │
│  │ useConversation()│  │  dynamic vars)   │  │              │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │          │
│           └─────────────────────┼────────────────────┘          │
│                                 │                               │
│                    ┌────────────▼────────────┐                  │
│                    │   WebRTC (LiveKit)      │                  │
│                    │   Real-time audio       │                  │
│                    └────────────┬────────────┘                  │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   ElevenLabs Platform      │
                    │                            │
                    │  ┌──────┐ ┌─────┐ ┌─────┐ │
                    │  │ ASR  │ │ LLM │ │ TTS │ │
                    │  └──────┘ └─────┘ └─────┘ │
                    │  ┌──────────────────────┐  │
                    │  │ Turn-Taking Model    │  │
                    │  └──────────────────────┘  │
                    │  ┌──────────────────────┐  │
                    │  │ Knowledge Base (RAG) │  │
                    │  └──────────────────────┘  │
                    │  ┌──────────────────────┐  │
                    │  │ Post-Call Analysis   │  │
                    │  └──────────────────────┘  │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │  ConnectWorld AI Server       │
                    │                            │
                    │  • Signed URL generation   │
                    │  • Post-call webhooks      │
                    │  • Progress tracking       │
                    │  • Surprise call scheduler │
                    │  • Session analytics       │
                    └────────────────────────────┘
```

### 6.2 SDK Integration Stack

The React Native integration requires these packages:

| Package | Purpose |
|---------|---------|
| `@elevenlabs/react-native` | Core SDK — ConversationProvider, hooks, session management |
| `@livekit/react-native` | WebRTC transport layer for real-time audio |
| `@livekit/react-native-webrtc` | Native WebRTC implementation |
| `livekit-client` | LiveKit client library |
| `@livekit/react-native-expo-plugin` | Expo config plugin for native modules |
| `@config-plugins/react-native-webrtc` | Expo config plugin for WebRTC permissions |

**Important constraint:** The ElevenLabs React Native SDK requires **Expo development builds** and cannot run in Expo Go. This means the QR code preview in the sandbox will not support voice agent features — they must be tested on a physical device with a development build.

### 6.3 Authentication Flow

All agents use **signed URLs** for secure client-side connections. The flow is:

1. Student taps "Start Conversation" in the app.
2. App calls ConnectWorld AI server endpoint: `POST /api/agents/signed-url`.
3. Server authenticates the user, checks subscription tier, and calls ElevenLabs API to generate a signed URL for the requested agent.
4. Server returns the signed URL to the app.
5. App uses the signed URL to start the session (valid for 15 minutes, but sessions can last longer once connected).

This ensures the ElevenLabs API key is never exposed client-side.

### 6.4 Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `ELEVENLABS_API_KEY` | Server-side API key for signed URL generation and agent management |
| `EXPO_PUBLIC_AGENT_TUTOR_ID` | Agent ID for the AI Tutor |
| `EXPO_PUBLIC_AGENT_FREECONV_ID` | Agent ID for Free Conversation Partner |
| `EXPO_PUBLIC_AGENT_SCENARIO_ID` | Agent ID for Scenario Agent |
| `EXPO_PUBLIC_AGENT_PRONUNCIATION_ID` | Agent ID for Pronunciation Coach |
| `EXPO_PUBLIC_AGENT_SURPRISE_ID` | Agent ID for Surprise Caller |
| `EXPO_PUBLIC_AGENT_GROUP_ID` | Agent ID for Group Class Facilitator |
| `EXPO_PUBLIC_AGENT_SUPPORT_ID` | Agent ID for Customer Support Agent |

---

## 7. Knowledge Base Strategy

Each agent type has a tailored knowledge base uploaded to the ElevenLabs dashboard.

| Agent | Knowledge Base Contents |
|-------|----------------------|
| AI Tutor | Full curriculum for each language/dialect (A1-C2), vocabulary lists, grammar rules, cultural notes, lesson plans |
| Free Conversation Partner | Cultural topics database, current events summaries, student interest profiles, trending slang database |
| Scenario Agent | Scenario scripts (100+ scenarios across 20+ cities), location-specific vocabulary, cultural etiquette guides |
| Pronunciation Coach | IPA charts for each language, common error patterns by native language, tongue placement descriptions, minimal pairs lists |
| Surprise Caller | Recent lesson summaries per student, conversation starter templates, cultural event calendar |
| Group Class Facilitator | Group activity templates, discussion prompts by level, participation tracking guidelines |
| Customer Support | Full app documentation, FAQ, pricing tables, troubleshooting guides, feature descriptions |

---

## 8. Voice Assignment Strategy

ConnectWorld AI's teacher roster maps directly to ElevenLabs voices. Each teacher character has a dedicated voice that matches their cultural background, accent, and personality.

| Teacher | Language/Dialect | Voice Characteristics | ElevenLabs Voice Selection Criteria |
|---------|-----------------|----------------------|-------------------------------------|
| Maria | Dominican Spanish | Warm, energetic, Caribbean accent | Female, Spanish, Dominican inflection, mid-20s |
| Carlos | Colombian Spanish | Calm, clear, Bogotá accent | Male, Spanish, Colombian neutral, early 30s |
| Yuki | Japanese | Gentle, precise, Tokyo standard | Female, Japanese, standard NHK-style, late 20s |
| Pierre | Parisian French | Sophisticated, measured | Male, French, Parisian, mid-30s |
| Amara | Haitian Creole | Warm, rhythmic, Port-au-Prince | Female, Haitian Creole/French, late 20s |
| Jin | Korean | Friendly, Seoul standard | Male, Korean, standard Seoul, early 30s |
| Giulia | Italian | Expressive, Roman accent | Female, Italian, Roman inflection, mid-20s |
| Hans | German | Clear, Berlin standard | Male, German, Hochdeutsch, early 40s |

When a student selects a teacher, all agents that interact with that student use the corresponding voice ID. The Scenario Agent is the exception — it uses character-specific voices (the waiter Carlos has a different voice than the teacher Carlos).

---

## 9. Subscription Tier Gating

| Feature | Free | Plus ($9.99/mo) | Pro ($19.99/mo) | Enterprise |
|---------|------|-----------------|-----------------|------------|
| Customer Support Agent | 5 min/day | Unlimited | Unlimited | Unlimited |
| AI Tutor | 1 lesson/week | Unlimited | Unlimited | Unlimited + custom curriculum |
| Free Conversation Partner | Not available | 30 min/day | Unlimited | Unlimited |
| Pronunciation Coach | Not available | 15 min/day | Unlimited | Unlimited |
| Scenario Agent | Not available | 3 scenarios/week | Unlimited | Unlimited + custom scenarios |
| Surprise Caller | Not available | Not available | Configurable | Configurable |
| Group Class Facilitator | Not available | Not available | 3 classes/week | Unlimited |

---

## 10. Post-Call Data Pipeline

Every agent conversation generates structured data that flows back into the learning system.

```
Agent Session Ends
       │
       ▼
┌──────────────────┐
│ ElevenLabs       │
│ Post-Call        │
│ Analysis         │
│                  │
│ • Evaluation     │
│ • Data Extract   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Webhook to       │────▶│ ConnectWorld AI     │────▶│ Student Profile  │
│ ConnectWorld Server │     │ Analytics Engine │     │ Update           │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
                                    ┌─────────────────────┼─────────────────────┐
                                    │                     │                     │
                                    ▼                     ▼                     ▼
                          ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
                          │ Weak Areas   │    │ Vocabulary   │    │ Fluency      │
                          │ Updated      │    │ Mastery      │    │ Score        │
                          │              │    │ Updated      │    │ Updated      │
                          └──────────────┘    └──────────────┘    └──────────────┘
```

**Data collected from every session:**

| Data Point | Type | Used For |
|-----------|------|----------|
| `words_used_correctly` | Array of strings | Vocabulary mastery tracking |
| `words_struggled_with` | Array of strings | Weak area identification, future lesson focus |
| `grammar_errors` | Array of {error, correction} | Grammar progress tracking |
| `pronunciation_scores` | Array of {word, score} | Pronunciation profile |
| `conversation_duration` | Number (seconds) | Engagement metrics |
| `student_initiated_topics` | Array of strings | Interest profiling for personalization |
| `objective_completed` | Boolean | Scenario/lesson completion tracking |
| `confidence_level` | "low" / "medium" / "high" | Adaptive difficulty adjustment |

---

## 11. Implementation Roadmap

The integration is divided into four phases, each building on the previous one.

### Phase 1: Foundation (Week 1-2)

Install the ElevenLabs React Native SDK and its dependencies. Build the `ConversationProvider` wrapper, the `AgentService` (manages agent configs, signed URL requests, session lifecycle), and the base call screen UI component. Create the server endpoint for signed URL generation. Set up the Customer Support Agent on the ElevenLabs dashboard as the first test agent. Deploy a development build to a physical device for testing.

### Phase 2: Core Learning Agents (Week 3-4)

Build and configure the AI Tutor and Pronunciation Coach agents on the ElevenLabs dashboard. Create the lesson-to-agent bridge (passing curriculum data as dynamic variables). Implement all client tools for the tutor (vocabulary cards, cultural notes, exercise completion). Build the pronunciation drill UI with mouth diagrams and scoring. Wire the tutor-to-pronunciation handoff flow. Test with Dominican Spanish A1 curriculum as the pilot.

### Phase 3: Practice and Immersion Agents (Week 5-6)

Build and configure the Free Conversation Partner and Scenario Agent. Create the scenario library (20 initial scenarios across 5 cities). Build the Dream Vacation scenario integration. Implement the Surprise Caller with push notification scheduling. Build the post-call webhook handler and data pipeline. Wire all post-call data into the student profile and adaptive difficulty system.

### Phase 4: Group and Polish (Week 7-8)

Build the Group Class Facilitator agent with multi-participant support. Integrate with the existing Virtual Classroom UI. Add voice assignment for all teacher characters. Implement subscription tier gating for all agent features. Performance optimization (connection time, audio quality). Comprehensive testing across all agents and languages.

---

## 12. Cost Estimation

ElevenLabs pricing is usage-based. Here are estimated costs per student per month based on typical usage patterns.

| Usage Tier | Sessions/Month | Avg Duration | Est. Monthly Cost/Student |
|-----------|---------------|-------------|--------------------------|
| Light (Free) | 4 sessions | 5 min each | ~$0.20 |
| Regular (Plus) | 20 sessions | 15 min each | ~$3.00 |
| Heavy (Pro) | 40 sessions | 20 min each | ~$8.00 |
| Intensive (Enterprise) | 60+ sessions | 25 min each | ~$15.00 |

These estimates include ASR, LLM (using cost-efficient models like Gemini Flash for routine conversations, GPT-4o for complex tutoring), and TTS costs. Actual costs will vary based on model selection and conversation complexity. The LLM cascading feature can be used to optimize costs — start with a fast, cheap model and cascade to a more powerful one only when needed.

---

## 13. What You Need to Do (Action Items)

| Step | Action | Where |
|------|--------|-------|
| 1 | Create an ElevenLabs account | [elevenlabs.io/app/sign-up](https://elevenlabs.io/app/sign-up) |
| 2 | Generate an API key | ElevenLabs Dashboard → Settings → API Keys |
| 3 | Create 7 agents on the dashboard | ElevenLabs Dashboard → Agents → New Agent (one for each type) |
| 4 | Configure system prompts for each agent | Use the prompts defined in Section 4 of this document |
| 5 | Select voices for each teacher character | ElevenLabs Voice Library → match to teacher roster |
| 6 | Upload knowledge bases | Dashboard → Agent → Knowledge Base (curriculum files, FAQ, scenarios) |
| 7 | Set up post-call webhooks | Dashboard → Agent → Webhooks → point to ConnectWorld AI server |
| 8 | Provide the API key to Manus | I will store it securely and build the server integration |
| 9 | Build a development build of the app | Required for testing (Expo Go does not support WebRTC) |

---

## References

[1]: https://elevenlabs.io/docs/eleven-agents/overview "ElevenAgents Overview — ElevenLabs Documentation"
[2]: https://www.cambridge.org/core/journals/language-teaching "Interactive Language Learning Research — Cambridge Language Teaching"

---

*This document will be updated as the integration progresses. All agent configurations, system prompts, and client tools described here will be implemented in the ConnectWorld AI codebase.*
