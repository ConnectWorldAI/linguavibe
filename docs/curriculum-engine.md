# ConnectWorld AI — Curriculum Engine Architecture

## Overview

The ConnectWorld AI learning system is built on a **3-Layer Architecture** that combines structured fundamentals with adaptive, real-world content. The system tracks hours, enforces pass gates, and adapts to each student's pace and interests.

---

## The 3-Layer Learning Architecture

### Layer 1: The Foundation (Static, Structured, Always There)

The textbook backbone. Everyone needs it. It doesn't change.

**Content Types:**
- ABCs, numbers, colors, greetings
- Verbs, nouns, adjectives, adverbs
- Past tense, present tense, future tense, conditional
- Pronunciation drills (powered by Hume AI scoring)
- Grammar rules and explanations
- Flashcards, multiple choice, fill-in-the-blank
- ElevenLabs voice exercises (pre-generated audio)
- Kling + ElevenLabs video lessons (pre-generated, served to all users)
- Listening comprehension exercises
- Reading passages with vocabulary highlights

**Delivery:** Pre-generated content. Created once with AI, served to all users at near-zero marginal cost.

**Cost per user:** ~$0.00 (static content, no per-use API calls)

---

### Layer 2: The Adaptive Living Content (Weekly/Biweekly Refresh)

Real-world content that makes learning exciting and relevant. Refreshed on a cadence — not a firehose.

**Content Types:**
- Real news from target countries (curated, level-appropriate)
- Music lyrics breakdowns (old terms AND new slang)
- Cultural moments — food, festivals, sports, entertainment
- Trending phrases and expressions
- Historical context for slang ("here's how they USED to say it... here's how they say it NOW")

**Refresh Cadence:** Weekly or biweekly. Digestible pace, not overwhelming.

**Level Adaptation:**
- Beginner (A1-A2): Simple headlines, basic vocabulary from articles
- Intermediate (B1-B2): Full article summaries, idiomatic expressions
- Advanced (C1-C2): Full articles with slang, regional dialects, debate topics

**Integration with Layer 1:** Layer 2 enriches Layer 1 exercises. Example: You're still learning conjugation, but your practice sentence uses a phrase from a real Dominican news story this week.

**Cost per user:** ~$0.02-0.05/month (GPT-4o processing of scraped content, shared across all users)

---

### Layer 3: The Search/Explore (Real-Time, Browse Anytime)

Everything flowing in — users can browse freely for immersion.

**Content Types:**
- Live news feed from all target countries
- TikTok/Instagram content from creators
- Music library with dual-language lyrics
- Cultural videos, travel content, food content
- Trending topics across languages

**Not part of structured lessons** — just there for discovery and immersion. Users explore at their own pace.

**Tiered Access:**
- Free: Limited browse (search tab with capped translations)
- Go: Full browse + weekly digest
- Pro: Full browse + daily updates + all languages

---

## Hour Requirements by Language (FSI-Based, AI-Adjusted)

Based on U.S. Foreign Service Institute research, adjusted 30-40% down for AI-assisted learning.

### Category I — Closest to English (Spanish, French, Portuguese, Italian)

| Level | CEFR | Cumulative Hours | What You Can Do |
|-------|------|-----------------|-----------------|
| Level 1 | A1 | 50 hours | Survive — order food, greet people, ask basic questions |
| Level 2 | A2 | 120 hours | Communicate — simple conversations, describe your life |
| Level 3 | B1 | 280 hours | Independent — travel alone, understand news, give opinions |
| Level 4 | B2 | 450 hours | Professional — work in the language, understand movies, debate |
| Level 5 | C1 | 600 hours | Advanced — nuance, humor, complex topics, near-native |
| Level 6 | C2 | 750 hours | Mastery — indistinguishable from educated native speaker |

### Category II — Medium (German, Indonesian, Swahili)

| Level | CEFR | Cumulative Hours |
|-------|------|-----------------|
| Level 1 | A1 | 65 hours |
| Level 2 | A2 | 160 hours |
| Level 3 | B1 | 380 hours |
| Level 4 | B2 | 600 hours |
| Level 5 | C1 | 800 hours |
| Level 6 | C2 | 1,000 hours |

### Category III — Hard (Russian, Hindi, Thai, Vietnamese)

| Level | CEFR | Cumulative Hours |
|-------|------|-----------------|
| Level 1 | A1 | 80 hours |
| Level 2 | A2 | 200 hours |
| Level 3 | B1 | 480 hours |
| Level 4 | B2 | 750 hours |
| Level 5 | C1 | 1,000 hours |
| Level 6 | C2 | 1,300 hours |

### Category IV — Very Hard (Japanese, Korean, Mandarin, Arabic)

| Level | CEFR | Cumulative Hours |
|-------|------|-----------------|
| Level 1 | A1 | 100 hours |
| Level 2 | A2 | 280 hours |
| Level 3 | B1 | 650 hours |
| Level 4 | B2 | 1,000 hours |
| Level 5 | C1 | 1,400 hours |
| Level 6 | C2 | 1,800 hours |

---

## Dual Gate System (Hours + Pass)

Students must meet BOTH requirements to advance:

### Gate 1: Hours

You MUST log the minimum hours before you can attempt the level assessment. No shortcuts.

**What counts as hours:**
- Lessons completed
- Conversation practice (with AI teacher)
- Flashcard sessions
- Listening exercises (news feed, audio content)
- Video lessons watched (with comprehension check)
- Quiz/test time
- Live pronunciation practice

**What does NOT count:**
- App open but idle
- Browsing explore tab without interaction
- Watching videos without completing comprehension check

### Gate 2: Pass

Once hours are met, student takes the level assessment. Must score 80%+ to advance.

---

## Grading System

### Level Assessment Scoring:

| Grade | Score | Result | What Happens |
|-------|-------|--------|--------------|
| A+ | 95-100% | PASS (Honors) | Advance + "Honors" badge, unlocks bonus content |
| A | 90-94% | PASS | Advance to next level |
| B | 80-89% | PASS | Advance, AI flags weak areas for review |
| C | 70-79% | CONDITIONAL PASS | Can advance, must complete remedial module within 7 days |
| D | 60-69% | FAIL | Cannot advance. AI prescribes drills. Retake after 48 hours. |
| F | Below 60% | FAIL | Cannot advance. Repeat last 10 lessons. Retake after 1 week. |

### Assessment Breakdown (4 Skills, Equal Weight):

| Section | Weight | Tests |
|---------|--------|-------|
| Listening | 25% | Hear audio, answer comprehension questions |
| Reading | 25% | Read passage, answer questions, vocabulary in context |
| Speaking | 25% | Pronunciation score (Hume AI), conversation fluency |
| Writing/Grammar | 25% | Fill-in-blank, sentence construction, verb conjugation |

### Daily/Weekly Activity Scoring:

| Activity | Scoring Method |
|----------|---------------|
| Flashcards | % correct per session |
| Quizzes | Letter grade (A-F) |
| Conversations | Fluency score (1-10) from Hume AI |
| Pronunciation | Accuracy % per word/phrase |
| Listening exercises | Comprehension % |

### Cumulative GPA:

| GPA | Meaning |
|-----|---------|
| 4.0 | A — Exceptional |
| 3.5 | B+ — Strong |
| 3.0 | B — Solid |
| 2.5 | C+ — Adequate |
| 2.0 | C — Needs improvement |
| Below 2.0 | At risk — AI coach intervention triggered |

### Retake Policy:

- First fail: Retake after 48 hours + complete prescribed drills
- Second fail: Retake after 1 week + complete full remedial module
- Third fail: AI coach schedules 1-on-1 conversation to identify blocker

---

## Adaptive Check-In System

Periodic pop-ups where the AI teacher genuinely checks in:

**Check-in prompts (examples):**
- "Hey, how are your classes going?"
- "What would you like to learn more about?"
- "Is there something you wish was different?"
- "What topics interest you right now?"
- "Are you feeling confident with verbs or do you want more practice?"

**The system adapts based on responses:**
- Core fundamentals stay locked (never removed)
- Focus, flavor, and content mix shifts toward student interests
- If student says "more music" → more lyrics-based exercises appear
- If student says "struggling with verbs" → extra conjugation drills added

**Tiered by membership:**
- Go: Weekly check-in, basic preference adjustment
- Pro: Anytime conversations, deep personalization, AI remembers everything

---

## Learning Agreement (Onboarding Commitment)

Presented during onboarding — student acknowledges before starting:

**What it communicates:**
1. The specific hours required for their chosen language
2. That they must pass assessments to advance (no participation trophies)
3. That the AI coaches will hold them accountable
4. That consistent effort = guaranteed results

**Where it appears:**
- Onboarding: Full agreement, student taps "I'm Ready"
- Dashboard: Always visible progress (hours logged / hours required)
- Weekly summary: Push notification with hours and pace
- Before assessment: Confirmation that hours are met
- Settings/Legal: Full terms version

---

## CSAM Coaching Integration

When students miss days or fall behind:

- "You missed 4 days. You're now 6 hours behind your B1 goal."
- "At your new pace, your assessment date moved from August 10 to August 24."
- "Want to increase daily time to get back on track? Here's a weekend intensive plan."

The AI coach adjusts timelines, prescribes catch-up plans, and never lets students silently fall off.

---

## Anti-Cheating Measures During Assessments

- Voice cloning tools disabled during speaking tests
- Translation tools disabled during all assessments
- Timer-based questions prevent looking up answers
- Randomized question pools prevent sharing answers
- Pronunciation must match student's voice profile (Hume AI verification)

---

## Content Generation Pipeline (Automated)

### One-Time Generation (Layer 1):
1. GPT-4o generates lesson scripts, exercises, vocabulary lists
2. ElevenLabs generates audio for all words, phrases, dialogues
3. Kling + fal.ai generates avatar video lessons
4. All stored as static assets — served to all users at zero marginal cost

### Weekly/Biweekly Generation (Layer 2):
1. Apify scrapes news outlets, social media, music charts
2. Content backed up to Airtable (permanent record)
3. GPT-4o processes content into level-appropriate lessons
4. New vocabulary, exercises, and cultural notes generated
5. Pushed to users as "This Week in [Language]" content

### Real-Time (Layer 3):
1. Continuous scraping of news/social feeds
2. Available in Search/Explore tab
3. No lesson processing — raw immersion content
4. Translation available (tiered by membership)

---

## Technology Stack for Curriculum:

| Component | Technology | Role |
|-----------|-----------|------|
| Lesson generation | OpenAI GPT-4o | Scripts, exercises, grammar explanations |
| Voice content | ElevenLabs | Native-quality audio in all languages |
| Video lessons | Kling LipSync via fal.ai | Avatar teacher videos |
| Pronunciation scoring | Hume AI | Real-time accuracy feedback |
| Content scraping | Apify | News, social media, creator content |
| Data backup | Airtable | Permanent record of all scraped/analyzed data |
| Progress tracking | PostgreSQL (server DB) | Hours, grades, streaks, GPA |
| Adaptive engine | OpenAI GPT-4o | Check-ins, content personalization |
