# ConnectWorld AI — Honest Gap Analysis Report

**Date:** May 26, 2026  
**Auditor:** Manus AI  
**Scope:** End-to-end functional audit of every core user journey

---

## Executive Summary

ConnectWorld AI has **179 screens**, **23 server router files**, **48 lib modules**, **37 components**, and **9 hooks**. The audit reveals a significant gap between the app's visual breadth and its functional depth. Of the 179 screens, only **59 have any backend/storage integration** (33%), and **120 are pure UI shells** (67%) — they render beautiful interfaces but have no real data flow, no API calls, and no persistence. Many screens that *do* have backend refs use hardcoded sample data alongside them.

**The honest answer to "Could I join a virtual class right now?"** is: **No.** The screens exist and look polished, but most core flows dead-end at the UI layer.

---

## Severity Legend

| Level | Meaning |
|-------|---------|
| **CRITICAL** | Core feature completely non-functional — user hits a dead end |
| **MAJOR** | Feature partially works but key parts are missing or use fake data |
| **MINOR** | Feature works but is missing polish, edge cases, or secondary integrations |

---

## 1. Virtual Classes & Classroom

**Verdict: CRITICAL — No real class can be joined or attended**

| Screen | Lines | Backend? | Status |
|--------|-------|----------|--------|
| virtual-classroom.tsx | 282 | No | UI shell — camera/mic toggles do nothing, no WebRTC/Hume connection |
| classroom.tsx | 473 | No | Hardcoded sample data, no real lesson streaming |
| class-schedule.tsx | 558 | No | Static schedule UI, no calendar API, no booking |
| class-chat.tsx | 178 | No | Chat UI with no messaging backend |
| class-recaps.tsx | 412 | No | Static recap cards, no real video/audio recordings |
| group-class.tsx | 192 | No | UI shell, no multi-user session management |
| class-invite.tsx | 322 | No | Invite UI with no sharing/deep-link backend |

**What's missing to make this work:**
- Hume EVI WebSocket connection wired into virtual-classroom (the hook `use-hume-voice.ts` exists and has real Hume API code, but virtual-classroom.tsx doesn't use it)
- Database tables for class sessions, enrollments, schedules
- Real-time class chat via WebSocket or polling
- Class recording storage and playback
- Calendar booking system with push notification reminders

---

## 2. Calls & Communication

**Verdict: CRITICAL — No real calls can be made**

| Screen | Lines | Backend? | Status |
|--------|-------|----------|--------|
| voice-call.tsx | ~400 | No | Simulated call with `setTimeout` — fake "connecting" then "active" state, no audio |
| video-call.tsx | ~500 | 1 trpc ref | Has `endCall` mutation but no actual video/audio stream |
| call-screen.tsx | ~300 | No | Generic call UI shell |
| call-translator.tsx | ~600 | No | Beautiful translator settings UI but no speech pipeline connected |
| live-call-translation.tsx | ~400 | No | UI only |
| hume-call.tsx | 519 | Yes (via hook) | **Best wired** — uses `use-hume-voice.ts` which has real WebSocket + Hume API. Needs HUME_API_KEY to function |
| surprise-call.tsx | 699 | Yes | Uses Hume hooks — could work with API key |

**What's missing:**
- `voice-call.tsx` and `video-call.tsx` are completely fake — they simulate calls with timers, no audio/video streams
- Need to wire Hume EVI into the main call screens (not just hume-call)
- WiFi calling between users requires WebRTC peer-to-peer or a signaling server — neither exists
- Messages tab has **MOCK DATA** — no real messaging backend, no database tables for conversations

---

## 3. Lessons & Curriculum

**Verdict: MAJOR — Curriculum data exists but lesson delivery is broken**

**What works:**
- `curriculum-data.ts` has **full A1-C2 curricula** for 20+ dialects (45 lessons each) with vocabulary, grammar, cultural hints
- `lesson-path.tsx` reads from curriculum data and shows the lesson map
- `lesson-exercise.tsx` reads curriculum data and renders exercises
- `placement-test.tsx` has real LLM-powered adaptive testing
- 5 exercise components (conversation-chain, cultural-discovery, fill-order, match-pairs, story-choice) have real interactive logic
- `flashcard-review.tsx` has AsyncStorage persistence
- `adaptive-lesson.tsx` has some backend integration

**What's broken:**

| Screen | Issue |
|--------|-------|
| lesson-player.tsx | Uses `SAMPLE_VIDEO` (Big Buck Bunny) and `SAMPLE_SUBTITLES` — no real lesson video content |
| lessons.tsx | No curriculum data import — static UI |
| lesson-detail.tsx | No curriculum data import — static UI |
| quiz-center.tsx | Has "Coming Soon" placeholder |
| srs-review.tsx | No backend/storage — UI shell |
| curriculum-drills.tsx | No backend — UI shell |

**What's missing:**
- Lesson player needs to pull real content from curriculum data or server
- No database tables for user progress, completed lessons, scores
- Quiz center needs real quiz generation from curriculum
- SRS (Spaced Repetition) needs real scheduling algorithm connected to storage

---

## 4. Translation & AI Features

**Verdict: MIXED — Translate tab works, but most translation screens are shells**

**What works:**
- `translate` tab (main translator) — **12 backend refs**, uses `trpc.translate.*` endpoints, has voice input, camera input, dialect-aware translation, slang perspectives. This is the most complete feature.
- `live-translate.tsx` — Has real `trpc.liveTranslate.*` session management
- `translateRouter.ts` on server — **7 LLM calls**, full dialect-aware translation pipeline
- `use-speech-to-text.ts` hook — Real expo-audio recording + server transcription pipeline

**What's broken:**

| Screen | Issue |
|--------|-------|
| translate-popup.tsx | No backend — static UI |
| translation-hub.tsx | **30 TODO/Mock references** — massive placeholder |
| url-translate.tsx | No backend — can't actually translate URLs |
| social-translate.tsx | No backend — UI shell |
| social-translate-browser.tsx | No backend — UI shell, not registered in layout |
| video-translate.tsx | No backend — can't translate videos |
| vocal-translator.tsx | No backend — UI shell |
| ai-chat.tsx | Has AsyncStorage but no LLM connection for chat |
| conversation-sim.tsx | Has AsyncStorage but limited backend |
| scenario-chat.tsx | No backend — UI shell |

**What's missing:**
- URL translation needs server endpoint to fetch + translate web pages
- Video translation needs video processing pipeline
- AI Chat needs to be wired to the server's LLM endpoint
- Conversation simulator needs real AI-powered dialogue

---

## 5. Pronunciation & Voice

**Verdict: MAJOR — Hooks exist but screens don't use them**

**What works:**
- `use-pronunciation-coach.ts` — Has real `trpc.pronunciation.*` mutations (analyze, generateDrill, sessionSummary)
- `use-speech-to-text.ts` — Real audio recording + transcription
- `pronunciationRouter.ts` on server — **5 LLM calls** for pronunciation analysis
- `voice-clone-training.tsx` — Has some real integration

**What's broken:**

| Screen | Issue |
|--------|-------|
| pronunciation-practice.tsx | No backend — doesn't use the pronunciation coach hook |
| pronunciation-drill.tsx | No backend — UI shell |
| practice-pronunciation.tsx | 3 TODO/Mock references |
| mouth-placement.tsx | No backend — static diagrams |
| name-recording.tsx | 1 Mock reference |
| voice-training.tsx | No backend — UI shell |

**What's missing:**
- Wire `use-pronunciation-coach` hook into pronunciation screens
- Wire `use-speech-to-text` into voice training screens
- Connect mouth placement to real phoneme analysis

---

## 6. Songs & Music Studio

**Verdict: MAJOR — Server pipelines exist but most screens are disconnected**

**What works on server:**
- `songTranslationPipeline.ts` — 4 LLM calls for song analysis
- `songReproduction.ts` — 3 LLM calls for song reproduction
- `song-player.tsx` — Has trpc integration
- `song-translate-agent.tsx` — Has trpc integration

**What's broken:**

| Screen | Issue |
|--------|-------|
| songs tab | **0 backend refs** — entirely static mock data |
| lyrics-player.tsx | No backend — static sample lyrics |
| sing-along.tsx | No backend — UI shell |
| duet-mode.tsx | No backend — UI shell |
| song-cover.tsx | 2 Mock references |
| song-lesson-breakdown.tsx | Uses SAMPLE_DATA |
| stem-separator.tsx | 1 Mock reference |
| studio.tsx | No backend — UI shell |
| studio-hub.tsx | 3 Mock references |
| studio-library.tsx | 1 Mock reference |
| wavy-eq-studio.tsx | 3 Mock references |
| upload-song.tsx | No backend — can't upload |

---

## 7. Social & Connections

**Verdict: CRITICAL — No real social features work**

| Screen | Backend? | Issue |
|--------|----------|-------|
| connections.tsx | No | 1 Mock reference, UI shell |
| friends.tsx | AsyncStorage | Local only — no server sync |
| pen-pal.tsx | AsyncStorage | Local only |
| study-groups.tsx | No | UI shell |
| study-buddy.tsx | No | UI shell |
| discover-people.tsx | No | Static mock profiles |
| friends-activity.tsx | No | Mock data |
| social-hub.tsx | No | UI shell |
| messages tab | Mock data | Fake conversations, no real messaging |

**What's missing:**
- Database tables for friendships, connections, messages
- Real-time messaging (WebSocket or polling)
- User discovery/matching system
- Group management

---

## 8. Payments & Subscriptions

**Verdict: MAJOR — RevenueCat code exists but isn't fully wired**

**What works:**
- `lib/revenuecat.ts` — Real RevenueCat SDK integration with proper entitlements (plus, pro, enterprise)
- `hooks/use-subscription.ts` — Checks RevenueCat then falls back to AsyncStorage
- `payment-setup.tsx` — Has AsyncStorage persistence

**What's broken:**

| Screen | Issue |
|--------|-------|
| subscription.tsx | No backend — static pricing UI |
| membership.tsx | No backend — UI shell |
| checkout.tsx | No backend — can't process payments |
| buy-credits.tsx | No backend — UI shell |
| family-plan.tsx | No backend — UI shell |
| enterprise-portal.tsx | No backend — UI shell |
| transaction-history.tsx | No backend — no transaction records |

**What's missing:**
- RevenueCat API keys not configured
- Subscription screens need to call RevenueCat purchase flow
- Database tables for transaction history, credits

---

## 9. Progress & Gamification

**Verdict: MAJOR — Some persistence but mostly static**

| Screen | Backend? | Issue |
|--------|----------|-------|
| progress-dashboard.tsx | No | Static UI |
| progress-milestones.tsx | No | Static UI |
| leaderboard.tsx | No | Static mock rankings |
| badges.tsx | AsyncStorage | Local only |
| milestones.tsx | No | Static UI |
| streak-calendar.tsx | No | 1 Mock reference |
| passport-stamps.tsx | No | Static UI |
| battle-mode.tsx | No | UI shell |
| vocabulary-battle.tsx | No | UI shell |
| daily-goals.tsx | AsyncStorage | Local only |

---

## 10. Database Schema Gap

The database has only **2 tables**: `users` and `push_tokens`. For the app to function, it needs at minimum:

| Missing Table | Purpose |
|---------------|---------|
| user_progress | Track completed lessons, scores, streaks |
| user_settings | Language preferences, notification settings |
| messages | Real-time messaging between users |
| conversations | Conversation threads |
| friendships | User connections/friends |
| class_sessions | Virtual class scheduling |
| class_enrollments | Who's in which class |
| transactions | Payment/credit history |
| flashcard_decks | Custom user decks |
| quiz_results | Test scores and history |
| study_groups | Group membership |
| achievements | Earned badges/stamps |

---

## 11. Unregistered Screens (8 screens exist but can't be navigated to)

| Screen | Lines | Has Backend? |
|--------|-------|-------------|
| admin-knowledge-base.tsx | 1282 | Yes (7 refs) |
| calendar.tsx | 551 | No |
| cloudwave-translator-setup.tsx | 983 | Yes (4 refs) |
| conversation-sim.tsx | 644 | Yes (3 refs) |
| dominican-slang-dictionary.tsx | 941 | Yes (10 refs) |
| marketing-studio.tsx | 1106 | No |
| progress-report-card.tsx | 762 | Yes (3 refs) |
| social-translate-browser.tsx | 468 | No |

These need to be registered in `app/_layout.tsx` to be reachable.

---

## Summary Scorecard

| Feature Area | Status | Working % |
|-------------|--------|-----------|
| Virtual Classes | CRITICAL | 0% |
| Calls (WiFi/Video) | CRITICAL | ~15% (only hume-call) |
| Lessons & Curriculum | MAJOR | ~40% (data exists, delivery broken) |
| Translation | MIXED | ~50% (main translator works, others don't) |
| Pronunciation | MAJOR | ~20% (hooks exist, screens disconnected) |
| Songs & Music | MAJOR | ~15% (server pipelines exist, UI disconnected) |
| Social & Connections | CRITICAL | ~5% (local AsyncStorage only) |
| Payments | MAJOR | ~20% (RevenueCat code exists, not wired) |
| Progress & Gamification | MAJOR | ~15% (some AsyncStorage, mostly static) |
| Database | CRITICAL | ~5% (only users + push_tokens) |

---

## Recommended Priority Order to Fill Gaps

**Phase 1 — Make the core learning loop work (highest impact):**
1. Wire lesson-player to curriculum data (replace sample video/subtitles)
2. Add user_progress database table + save/load progress
3. Wire pronunciation screens to existing pronunciation coach hook
4. Wire AI Chat to server LLM endpoint
5. Connect quiz-center to real quiz generation

**Phase 2 — Make communication work:**
6. Wire virtual-classroom to Hume EVI (the hook already exists)
7. Wire voice-call and video-call to Hume for AI teacher calls
8. Add real messaging backend (database tables + API)
9. Add class scheduling with database persistence

**Phase 3 — Make monetization work:**
10. Configure RevenueCat API keys
11. Wire subscription/checkout screens to RevenueCat purchase flow
12. Add transaction history database table

**Phase 4 — Make social features work:**
13. Add friendships/connections database tables
14. Wire social screens to real data
15. Add user discovery/matching

**Phase 5 — Connect remaining UI shells:**
16. Wire songs tab to song server pipelines
17. Wire remaining translation screens (URL, video, social)
18. Register the 8 unregistered screens
19. Replace all MOCK/SAMPLE data with real data flows
