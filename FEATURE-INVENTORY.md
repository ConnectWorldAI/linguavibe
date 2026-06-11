# ConnectWorld AI — Complete Feature Inventory

**Date:** May 23, 2026  
**Project:** ConnectWorld AI (linguavibe)  
**Status:** Active Development  
**Total Screens:** 90+ registered routes  
**Total Implemented Features:** 350+ (checked items in todo.md)

---

## Architecture Overview

ConnectWorld AI is built with **Expo SDK 54**, **React Native 0.81**, **TypeScript 5.9**, and **NativeWind 4** (Tailwind CSS). It uses a tRPC server with PostgreSQL (Drizzle ORM) for backend capabilities, and AsyncStorage for local persistence. The app supports iOS, Android, and Web platforms.

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo Router 6 |
| Styling | NativeWind (Tailwind CSS) + Custom dark theme |
| State | React Context, AsyncStorage, tRPC/React Query |
| Backend | Express + tRPC, PostgreSQL, Drizzle ORM |
| AI/LLM | Server-side multimodal AI (built-in) |
| Auth | OAuth + Secure Store |
| Notifications | expo-notifications (local + push) |

---

## Tab Navigation (8 Primary Tabs)

| Tab | Screen | Description |
|-----|--------|-------------|
| Home | `(tabs)/index.tsx` | Dashboard with streak, milestones, daily challenge, CEFR level, customizable cards |
| Messages | `(tabs)/messages.tsx` | Conversations with teachers and friends, inline translation |
| Explore | `(tabs)/explore.tsx` | Discover features, trending content, social |
| Calls | `(tabs)/calls.tsx` | VoIP dialer, contacts, voicemail, video calls |
| Translate | `(tabs)/translate.tsx` | Universal translator (text, voice, URL, camera) |
| Songs | `(tabs)/songs.tsx` | Music library, song upload, translation |
| Learn | `(tabs)/teacher.tsx` | Learning command center with teachers, classes, courses, progress |
| Profile | `(tabs)/profile.tsx` | LinkedIn+Instagram hybrid profile with certifications |

---

## 1. AI Teacher & Conversation System

| Feature | Status | File(s) |
|---------|--------|---------|
| AI Teacher selection with realistic avatars | Done | `teacher.tsx` |
| Voice-to-voice conversation (real-time) | Done | `call-screen.tsx`, `voice-call.tsx` |
| Video call with AI teacher | Done | `video-call.tsx` |
| Real speech-to-text via expo-audio | Done | `hooks/use-speech-to-text.ts` |
| Server transcription endpoint | Done | `server/_core/voiceTranscription.ts` |
| Call duration timer with free-tier limits | Done | `call-screen.tsx` |
| Call auto-drop when limit reached | Done | `components/call-limit-paywall.tsx` |
| Call transcript (consent-based) | Done | `call-screen.tsx` |
| Screen sharing during calls | Done | `call-screen.tsx` |
| Emoji reactions during calls | Done | `call-screen.tsx` |
| Background blur/removal | Done | `call-screen.tsx` |
| Call waiting (answer/decline/merge/hold) | Done | `call-screen.tsx` |
| Live call translation | Done | `call-translator.tsx` |

---

## 2. Structured Learning System

| Feature | Status | File(s) |
|---------|--------|---------|
| Lesson path with CEFR levels (A1-C2) | Done | `lesson-path.tsx` |
| 45 lessons across all CEFR levels | Done | `lib/lesson-content.ts` |
| Interactive lesson exercises (quiz) | Done | `lesson-exercise.tsx` |
| Grammar, vocabulary, reading, writing, speaking, listening | Done | `lib/lesson-content.ts` |
| SM-2 Spaced Repetition System | Done | `lib/srs.ts` |
| XP awards scaled by CEFR level | Done | `lesson-exercise.tsx` |
| Lesson completion sync to progress tracker | Done | `lesson-exercise.tsx` |
| Unlock system (complete previous to unlock next) | Done | `lesson-path.tsx` |
| Placement test (adaptive, CEFR A1-C2) | Done | `placement-test.tsx` |
| CEFR level history tracking | Done | `placement-test.tsx` |
| Level-up celebration with confetti | Done | `placement-test.tsx` |
| Skip placement test option (defaults A1) | Done | `placement-test.tsx` |
| Adaptive test start (based on estimate) | Done | `placement-test.tsx` |

---

## 3. Flashcard & Vocabulary System

| Feature | Status | File(s) |
|---------|--------|---------|
| Flashcard review with SM-2 algorithm | Done | `flashcard-review.tsx` |
| 3D flip animation | Done | `flashcard-review.tsx` |
| Rate difficulty (Again/Hard/Good/Easy) | Done | `flashcard-review.tsx` |
| 15 Dominican Spanish vocabulary cards | Done | `flashcard-review.tsx` |
| Custom deck creation | Done | `custom-deck.tsx` |
| Quick start templates (Travel, Business, Food) | Done | `custom-deck.tsx` |
| Save slang from song analysis to flashcards | Done | `components/song-analysis.tsx` |
| Vocabulary battle game mode | Done | `vocabulary-battle.tsx` |

---

## 4. Music & Song Translation

| Feature | Status | File(s) |
|---------|--------|---------|
| Song upload and translation | Done | `upload-song.tsx` |
| Song player with vocal isolation | Done | `song-player.tsx` |
| Song analysis & cultural breakdown | Done | `components/song-analysis.tsx` |
| Slang identification with dialect origin | Done | `components/song-analysis.tsx` |
| Dialect comparison modal | Done | `components/dialect-comparison-modal.tsx` |
| Server LLM-powered analysis | Done | `server/routers.ts` |
| Song cover recording | Done | `song-cover.tsx` |
| WavyEQ Studios recording assignment flow | Done | `wavy-eq-studio.tsx` |

---

## 5. WavyEQ Studios (Pronunciation & Recording)

| Feature | Status | File(s) |
|---------|--------|---------|
| Studio UI with dark aesthetic | Done | `wavy-eq-studio.tsx` |
| Pronunciation Lab (AI grading) | Done | `studio-hub.tsx` |
| Call & Response Drills | Done | `studio-hub.tsx` |
| Shadowing Mode (compare waveforms) | Done | `studio-hub.tsx` |
| Conversation Rehearsal | Done | `studio-hub.tsx` |
| Voice Journal (daily diary) | Done | `studio-hub.tsx` |
| VU meter + gain control + monitor toggle | Done | `wavy-eq-studio.tsx` |
| Scroll-to-punch-in re-recording | Done | `wavy-eq-studio.tsx` |
| Submissions history with progress chart | Done | `submissions-history.tsx` |
| Pronunciation practice (10 multi-language words) | Done | `pronunciation-practice.tsx` |

---

## 6. Live Conversation Simulation

| Feature | Status | File(s) |
|---------|--------|---------|
| Real-time AI conversation practice | Done | `live-simulation.tsx` |
| Multiple scenarios (restaurant, airport, etc.) | Done | `live-simulation.tsx` |
| Pronunciation correction mid-conversation | Done | `live-simulation.tsx` |
| Score/grade at end of session | Done | `live-simulation.tsx` |
| Multi-language support (12 languages) | Done | `live-simulation.tsx` |
| Language-specific pronunciation tips | Done | `live-simulation.tsx` |
| Language-specific correction tips | Done | `live-simulation.tsx` |

---

## 7. Course Library (Udemy/LinkedIn Learning Style)

| Feature | Status | File(s) |
|---------|--------|---------|
| Course catalog with search and filters | Done | `course-catalog.tsx` |
| Course detail with lesson list and progress | Done | `course-detail.tsx` |
| Video lesson player (expo-video) | Done | `lesson-player.tsx` |
| Playback speed adjustment (0.5x-2x) | Done | `lesson-player.tsx` |
| Subtitle toggle (4 modes) | Done | `lesson-player.tsx` |
| Resume playback (auto-save every 5s) | Done | `lesson-player.tsx` |
| Picture-in-picture support | Done | `lesson-player.tsx` |
| Course reviews & ratings | Done | `course-detail.tsx` |
| Instructor Q&A section | Done | `course-detail.tsx` |
| Instructor bio page | Done | `instructor-bio.tsx` |
| Bookmarked lessons | Done | `saved-lessons.tsx` |
| Course completion confetti | Done | `course-detail.tsx` |
| Certificate of completion | Done | `my-certificates.tsx` |
| Certificate PDF generation (server) | Done | `server/routers.ts` |
| Certification paths | Done | `cert-path.tsx` |

---

## 8. Virtual Classroom

| Feature | Status | File(s) |
|---------|--------|---------|
| Virtual classroom (scheduled group classes) | Done | `classroom.tsx` |
| Raise hand feature | Done | `classroom.tsx` |
| Class chat/messaging during sessions | Done | `classroom.tsx` |
| Class schedule browser and sign-up | Done | `class-schedule.tsx` |
| Class recaps | Done | `class-recaps.tsx` |
| Book/schedule private tutoring | Done | `class-schedule.tsx` |

---

## 9. CloudWave AI Assistant (Siri-like Agent)

| Feature | Status | File(s) |
|---------|--------|---------|
| Animated wave/cloud orb (floating) | Done | `lib/agent-context.tsx` |
| "Connect Me" voice wake word | Done | `lib/agent-context.tsx` |
| 40+ command mappings with fuzzy matching | Done | `lib/agent-context.tsx` |
| Proactive greetings with schedule awareness | Done | `lib/agent-context.tsx` |
| Text mode (floating cloud messages) | Done | `lib/agent-context.tsx` |
| Voice mode (spoken responses) | Done | `lib/agent-context.tsx` |
| Ambient suggestions | Done | `lib/agent-context.tsx` |
| Persistent on all screens | Done | `app/_layout.tsx` |
| CloudWave guided onboarding | Done | `cloudwave-guide.tsx` |
| Real speech-to-text connection | Done | `hooks/use-speech-to-text.ts` |

---

## 10. Gamification & Progress

| Feature | Status | File(s) |
|---------|--------|---------|
| Streak counter (AsyncStorage) | Done | `(tabs)/index.tsx` |
| Streak calendar (heat-map) | Done | `streak-calendar.tsx` |
| Streak protection | Done | `streak-protection.tsx` |
| Leaderboard (4 tabs: XP, Streak, Credits, Songs) | Done | `leaderboard.tsx` |
| Achievement badges gallery | Done | `badges.tsx` |
| Badge unlock celebration animation | Done | `components/badge-unlock-celebration.tsx` |
| Daily challenge with rotation | Done | `(tabs)/index.tsx` |
| 8 daily milestones with progress bars | Done | `milestones.tsx` |
| Perfect Day streak (2x bonus) | Done | `lib/perfect-day-streak.ts` |
| Friends' activity feed | Done | `friends-activity.tsx` |
| Weekly milestones recap | Done | `weekly-recap.tsx` |
| Time capsule (voice recordings over time) | Done | `time-capsule.tsx` |
| Battle mode (1v1 vocabulary) | Done | `vocabulary-battle.tsx` |

---

## 11. Social & Communication

| Feature | Status | File(s) |
|---------|--------|---------|
| Friends list management | Done | `friends.tsx` |
| QR code scanner for connections | Done | `qr-connect.tsx` |
| QR code profile display | Done | `qr-code.tsx` |
| Discover (suggested connections) | Done | `friends.tsx` |
| AI Pen Pal messaging | Done | `pen-pal.tsx` |
| Message compose | Done | `message-compose.tsx` |
| Video messaging | Done | `video-message.tsx` |
| Social hub | Done | `social-hub.tsx` |
| In-chat inline translation | Done | `(tabs)/messages.tsx` |
| Invite-to-ConnectWorld flow | Done | `call-screen.tsx` |

---

## 12. Monetization & Credits

| Feature | Status | File(s) |
|---------|--------|---------|
| Credit system (usage-based) | Done | `lib/usage-context.tsx` |
| Subscription tiers (Free/Plus/Pro) | Done | `subscription.tsx` |
| One-time course purchase | Done | `buy-credits.tsx` |
| Credit top-up packs | Done | `buy-credits.tsx` |
| Tutoring packs | Done | `subscription.tsx` |
| Individual product pricing | Done | `subscription.tsx` |
| Payment setup screen | Done | `payment-setup.tsx` |
| Payment flow | Done | `payment-flow.tsx` |
| Transaction history | Done | `transaction-history.tsx` |
| Monthly spending chart | Done | `transaction-history.tsx` |
| Redeem code input | Done | `buy-credits.tsx` |
| Gift credits to friends | Done | `buy-credits.tsx` |
| Referral code system (+25 credits) | Done | `referral.tsx` |
| Premium guard (route protection) | Done | `components/premium-guard.tsx` |
| useSubscription hook | Done | `hooks/use-subscription.ts` |
| Free-tier usage limits | Done | `lib/usage-limits.ts` |
| Premium caps & overage alerts | Done | `lib/usage-limits.ts` |
| Usage dashboard (My Usage) | Done | `usage-dashboard.tsx` |

---

## 13. Translation Features

| Feature | Status | File(s) |
|---------|--------|---------|
| Translate tab (text/voice input) | Done | `(tabs)/translate.tsx` |
| URL content translator | Done | `url-translate.tsx` |
| Social media translation | Done | `social-translate.tsx` |
| Call translator (live) | Done | `call-translator.tsx` |
| Tiered translation access | Done | `lib/usage-limits.ts` |

---

## 14. Profile & Settings

| Feature | Status | File(s) |
|---------|--------|---------|
| LinkedIn+Instagram hybrid profile | Done | `(tabs)/profile.tsx` |
| Cover banner, photo, verified badges | Done | `(tabs)/profile.tsx` |
| Professional headline, analytics | Done | `(tabs)/profile.tsx` |
| Certifications & licenses | Done | `(tabs)/profile.tsx` |
| Photo grid (Instagram-style) | Done | `(tabs)/profile.tsx` |
| Settings screen (futuristic neon) | Done | `settings.tsx` |
| Dark/light mode toggle | Done | `settings.tsx` |
| Notification settings | Done | `notification-settings.tsx` |
| Privacy policy | Done | `privacy-policy.tsx` |
| Terms of service | Done | `terms-of-service.tsx` |
| Biometric app lock (Face ID/Touch ID) | Done | `lib/app-lock.tsx` |
| Home screen customization (reorder/hide cards) | Done | `home-customize.tsx` |
| Vacation mode | Done | `vacation-mode.tsx` |
| Offline content | Done | `offline-content.tsx` |

---

## 15. Jobs & Career

| Feature | Status | File(s) |
|---------|--------|---------|
| Jobs/Opportunities feed | Done | `jobs.tsx` |
| Job preferences | Done | `jobs.tsx` |
| Manage job alerts | Done | `jobs.tsx` |
| Job collections (Remote, Bilingual) | Done | `jobs.tsx` |
| AI trainer project alerts | Done | `jobs.tsx` |

---

## 16. Notifications & Scheduling

| Feature | Status | File(s) |
|---------|--------|---------|
| Push notifications (daily/streak/achievement/class) | Done | `lib/notification-service.ts` |
| Weekly progress digest notification | Done | `lib/weekly-summary.ts` |
| Calendar integration (Apple/Google) | Done | `calendar.tsx` |
| Auto-add events to native calendar | Done | `calendar.tsx` |
| Configurable reminder timing | Done | `notification-settings.tsx` |
| 8 PM Perfect Day reminder | Done | `lib/milestone-reminder.ts` |
| Credit expiration warnings | Done | `lib/expiration-notification.ts` |
| Low balance toast | Done | `components/low-balance-toast.tsx` |
| What's New changelog modal | Done | `components/whats-new-modal.tsx` |

---

## 17. Onboarding & First-Time Experience

| Feature | Status | File(s) |
|---------|--------|---------|
| Welcome/sign-up/language setup | Done | `onboarding.tsx` |
| Experience level selector | Done | `onboarding.tsx` |
| Onboarding → Placement test routing | Done | `onboarding.tsx` |
| CloudWave guided onboarding | Done | `cloudwave-guide.tsx` |
| Name pronunciation recording | Done | `name-recording.tsx` |
| Voice training entry point | Done | `cloudwave-guide.tsx` |
| Animated splash intro (logo + glow ring) | Done | `components/animated-splash.tsx` |

---

## 18. Accessibility

| Feature | Status | File(s) |
|---------|--------|---------|
| Screen reader labels | Done | `lib/accessibility.ts` |
| Dynamic text size support | Done | `lib/accessibility.ts` |
| High contrast mode | Done | `lib/accessibility.ts` |
| Reduced motion option | Done | `lib/accessibility.ts` |
| Keyboard navigation | Done | `lib/accessibility.ts` |

---

## 19. Internationalization

| Feature | Status | File(s) |
|---------|--------|---------|
| i18n provider with translations | Done | `lib/i18n.tsx` |
| Multi-language UI strings | Done | `lib/i18n.tsx` |
| Localized tab titles | Done | `(tabs)/_layout.tsx` |

---

## 20. Data Sync & Backend

| Feature | Status | File(s) |
|---------|--------|---------|
| User authentication (OAuth) | Done | `hooks/use-auth.ts`, `login.tsx` |
| Session persistence (Secure Store) | Done | `lib/_core/auth.ts` |
| Data sync across devices | Done | `lib/data-sync.ts` |
| Conflict resolution (latest wins) | Done | `lib/data-sync.ts` |
| Server-side LLM (multimodal AI) | Done | `server/_core/llm.ts` |
| Image generation endpoint | Done | `server/_core/imageGeneration.ts` |
| File storage (S3-compatible) | Done | `server/storage.ts` |
| Push notification delivery | Done | `server/_core/notification.ts` |

---

## 21. Additional Screens & Features

| Screen | Purpose |
|--------|---------|
| `decode-mode.tsx` | Mystery/puzzle game using translation |
| `battle-mode.tsx` | 1v1 and team live competitions |
| `voice-filter.tsx` | Accent try-on (hear yourself in different accents) |
| `watch-learn.tsx` | Learn through video clips with vocab breakdowns |
| `daily-goals.tsx` | Daily learning goals and tracking |
| `weekly-digest.tsx` | Weekly learning summary |
| `progress-dashboard.tsx` | Comprehensive progress analytics |
| `membership.tsx` | Membership management |
| `language-pack.tsx` | Downloadable language packs |
| `library.tsx` | Reading & vocabulary hub |
| `quiz-center.tsx` | Quiz/test center |
| `ai-chat.tsx` | AI chat interface |

---

## 22. UI/UX Components Library

| Component | Purpose |
|-----------|---------|
| `animated-splash.tsx` | Logo animation on app launch |
| `badge-unlock-celebration.tsx` | Full-screen confetti for badge unlocks |
| `call-limit-paywall.tsx` | Upgrade prompt when call limit reached |
| `confetti-animation.tsx` | Reusable confetti overlay |
| `confetti-overlay.tsx` | Course completion celebration |
| `dialect-comparison-modal.tsx` | Side-by-side regional variants |
| `error-boundary.tsx` | Crash recovery UI |
| `glass-card.tsx` | Glassmorphism card component |
| `globe-watermark.tsx` | Branded watermark |
| `glow-icon.tsx` | Pulsing icon for pending tasks |
| `gradient-mesh-bg.tsx` | Mesh gradient backgrounds |
| `low-balance-toast.tsx` | Credit warning notification |
| `milestone-toast.tsx` | Achievement notification |
| `neon-glow-ring.tsx` | Animated glow effect |
| `premium-guard.tsx` | Feature gating for paid tiers |
| `song-analysis.tsx` | Lyric breakdown component |
| `usage-alert-toast.tsx` | Usage limit warning |
| `usage-indicator.tsx` | Visual usage meter |
| `whats-new-modal.tsx` | Changelog popup |

---

## 23. Utility Libraries

| Library | Purpose |
|---------|---------|
| `lib/srs.ts` | SM-2 spaced repetition algorithm |
| `lib/lesson-content.ts` | 45 lessons across A1-C2 |
| `lib/data-sync.ts` | Cross-device data synchronization |
| `lib/usage-context.tsx` | Usage tracking provider |
| `lib/usage-limits.ts` | Tier-based service caps |
| `lib/agent-context.tsx` | CloudWave AI assistant state |
| `lib/app-lock.tsx` | Biometric authentication |
| `lib/i18n.tsx` | Internationalization |
| `lib/dashboard-glow.ts` | Pending task glow system |
| `lib/notification-service.ts` | Push notification management |
| `lib/streak-bonus.ts` | Usage-based streak rewards |
| `lib/perfect-day-streak.ts` | Perfect Day tracking |
| `lib/milestone-sharing.ts` | Social sharing for achievements |
| `lib/weekly-summary.ts` | Weekly digest generation |
| `lib/expiration-notification.ts` | Credit expiration alerts |
| `lib/sim-language-data.ts` | Multi-language simulation data |
| `lib/slang-flashcards.ts` | Slang-to-flashcard conversion |
| `lib/accessibility.ts` | A11y utilities |
| `lib/pip-context.tsx` | Picture-in-picture state |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total registered screens | 90+ |
| Primary tabs | 8 |
| Reusable components | 29 |
| Utility libraries | 19 |
| Hooks | 5 |
| Test files | 20 (329 passing tests) |
| Completed todo items | 350+ |
| Remaining backlog items | 200+ (future phases) |
| CEFR lesson content | 45 lessons (A1-C2) |
| Supported simulation languages | 12 |
| Daily milestones | 8 |
| Subscription tiers | 3 (Free/Plus/Pro) |

---

## Pending / Future (Requires External APIs or Backend Work)

The following major categories remain in the backlog and require external service integration:

1. **Real LLM conversation** — Connect CloudWave agent to live LLM API
2. **Voice clone** — ElevenLabs integration for singing in user's voice
3. **Music API** — Spotify/Sonos integration for curated library
4. **ConnectWorld AI World** — Virtual roaming world (Roblox-style)
5. **ConnectWorld AI TV** — AI-generated video content library
6. **Real payments** — RevenueCat/Stripe integration
7. **Social media monitoring** — Slang trend pipeline
8. **Multi-language support** — Full global language coverage
9. **AR camera translation** — Live camera mode
10. **ConnectWorld AI Kids** — Separate kids mode
