# LinguaVibe — Mobile App Interface Design

## App Concept

LinguaVibe is a comprehensive language learning platform where the centerpiece is an always-available AI voice teacher you can call anytime. The app combines song translation (with vocal isolation), structured lessons, grammar breakdowns, and real-time voice-to-voice conversations with realistic AI teacher avatars. Usage is credit-based with subscription tiers.

---

## Screen List

### Onboarding & Auth
1. **Welcome Screen** — App intro with value proposition, language selection
2. **Sign Up / Login Screen** — Email, social auth, or phone number
3. **Language Setup Screen** — Choose native language + target language(s), proficiency level
4. **Teacher Selection Screen** — Browse and pick your AI teacher (avatar, language, accent/region)

### Main Tab Navigation (5 tabs)
5. **Home / Dashboard** — Daily progress, streak, recommended lessons, quick-call teacher button
6. **Songs** — Song translation hub (upload, browse translated songs, playback)
7. **Lessons** — Structured course content (grammar, vocabulary, reading, exercises)
8. **Teacher** — Voice conversation hub (call your teacher, conversation history, schedule)
9. **Profile** — Settings, subscription, credits, progress stats

### Song Feature Screens
10. **Song Upload Screen** — Upload or search for a song to translate
11. **Song Translation Screen** — Processing view, language/dialect selection
12. **Song Player Screen** — Full player with vocal isolation toggle, lyrics display, playback modes
13. **Song Lesson Screen** — Grammar/vocabulary breakdown from the translated song

### Lesson Feature Screens
14. **Course Overview Screen** — All available courses for target language
15. **Lesson Detail Screen** — Individual lesson with exercises
16. **Quiz Screen** — Test knowledge with multiple choice, fill-in, listening exercises
17. **Progress Screen** — Detailed stats, completed lessons, weak areas

### Teacher / Voice Conversation Screens
18. **Teacher Browse Screen** — All available teachers with avatars, specialties, accents
19. **Teacher Profile Screen** — Teacher bio, reviews, language/dialect specialty
20. **Voice Call Screen** — Active conversation with teacher avatar, real-time voice
21. **Conversation Summary Screen** — Post-call breakdown (corrections, new vocabulary, score)

### Subscription & Credits
22. **Subscription Screen** — Plans comparison, upgrade options
23. **Credits Screen** — Current balance, usage history, buy more credits
24. **Course Store Screen** — One-time purchase full courses

---

## Primary Content and Functionality

### Home / Dashboard
- Daily streak counter and XP progress bar
- "Call Your Teacher" prominent floating button
- Credits remaining indicator
- Recommended next lesson card
- Recently translated songs carousel
- Quick stats (words learned, minutes practiced, songs translated)

### Songs Hub
- Search bar to find songs (by title, artist, language)
- Upload button (from device or paste link)
- Grid of translated songs with album art
- Filter by language, genre, difficulty
- Each song card shows: title, original language → translated language, difficulty level

### Song Player
- Album art / waveform visualization
- Play/pause, seek bar, speed control
- **Playback Mode Toggle**: Full Mix | Vocals Only | Instrumental Only
- Synced lyrics display (original + translated side by side)
- Tap any line to hear it repeated
- "Start Lesson" button to break down the song's grammar

### Lessons
- Course cards organized by level (Beginner → Advanced)
- Each course has 10-20 lessons
- Lesson types: Grammar, Vocabulary, Listening, Reading, Speaking
- Progress indicators per course
- Exercises: multiple choice, drag-and-drop, fill blanks, record pronunciation

### Teacher Voice Call
- Large teacher avatar (realistic human appearance)
- Voice waveform animation during speech
- Mute/unmute button
- End call button
- Real-time transcription toggle (optional subtitles)
- Timer showing credits being used
- Difficulty/topic selector before call starts

### Subscription & Credits
- Current plan display
- Credit balance with usage meter
- Plan comparison table (Free / Plus / Pro)
- "Buy Course" option for one-time purchases
- Usage history (minutes talked, songs translated, lessons completed)

---

## Key User Flows

### Flow 1: Translate a Song
1. User taps "Songs" tab → taps "+" upload button
2. Selects song from device or pastes URL
3. Chooses target language + dialect (e.g., "English" → "Dominican Spanish")
4. App processes (shows progress animation)
5. Song appears in library → user taps to play
6. Player opens with vocal isolation controls
7. User toggles between full mix / vocals only / instrumental
8. User taps "Start Lesson" → grammar breakdown screen

### Flow 2: Call Your Teacher
1. User taps floating "Call Teacher" button on Home (or Teacher tab)
2. Selects conversation topic/difficulty (or "Free Talk")
3. Call connects → teacher avatar appears with greeting
4. Real-time voice conversation (teacher corrects, teaches, responds naturally)
5. Credits tick down as conversation continues
6. User ends call → Summary screen shows corrections, new words, score
7. If credits run out → prompt to upgrade

### Flow 3: Take a Lesson
1. User taps "Lessons" tab → selects a course
2. Taps next available lesson
3. Completes exercises (reading, listening, speaking, writing)
4. Quiz at end of lesson
5. XP awarded, progress updated
6. Unlock next lesson

### Flow 4: Upgrade Subscription
1. User runs out of credits (song translation or teacher time)
2. Prompt appears: "Upgrade to continue"
3. User taps → Subscription screen
4. Compares plans (Free / Plus $9.99/mo / Pro $19.99/mo)
5. Or buys one-time course ($49.99 per language)
6. Payment processed → credits refreshed

---

## Color Choices

| Role | Color | Hex |
|------|-------|-----|
| Primary (Brand) | Deep Indigo | #1A1A2E |
| Secondary | Electric Violet | #6C63FF |
| Accent | Coral Orange | #FF6B6B |
| Success | Emerald Green | #00C9A7 |
| Background (Dark) | Midnight Blue | #16213E |
| Background (Light) | Ghost White | #F8F9FA |
| Surface Card | Soft Navy | #0F3460 |
| Text Primary | Pure White | #FFFFFF |
| Text Secondary | Silver | #B8C1CC |
| Warning/Credits | Amber Gold | #FFB800 |

The app uses a **dark-mode-first** design with vibrant accent colors to feel modern, premium, and music-oriented. The deep indigo/navy palette evokes a nighttime/studio vibe that fits the music + learning concept.

---

## Typography

- **Headings**: SF Pro Display (iOS) / Inter Bold (cross-platform), 24-32pt
- **Body**: SF Pro Text / Inter Regular, 16pt
- **Captions**: SF Pro Text / Inter Medium, 12-14pt
- **Monospace (lyrics)**: SF Mono / JetBrains Mono, 14pt

---

## Design Principles

1. **One-handed usage** — All primary actions reachable with thumb (bottom navigation, floating buttons)
2. **Music-first aesthetic** — Waveforms, album art, player controls feel native
3. **Minimal friction** — One tap to call teacher, one tap to play song
4. **Clear credit visibility** — Always know how many credits remain
5. **iOS-native feel** — Follows Apple HIG with blur effects, haptic feedback, smooth transitions
6. **Accessibility** — High contrast text, scalable fonts, VoiceOver support

---

## Language & Dialect Support

Every language worldwide with regional variants:
- Spanish: Mexican, Dominican, Colombian, Venezuelan, Argentine, Castilian
- Portuguese: Brazilian, European
- Chinese: Mandarin, Cantonese, Taiwanese
- English: American, British, Australian, South African
- French: Metropolitan, Canadian, West African
- Arabic: Egyptian, Levantine, Gulf, Moroccan
- And 100+ more languages with their regional slang variants
