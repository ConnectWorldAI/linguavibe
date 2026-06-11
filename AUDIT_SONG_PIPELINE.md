# Song Studio Pipeline Audit

## Architecture Overview

There are TWO parallel song translation paths in the app:

### Path 1: Song Translation Studio (`app/song-translation-studio.tsx`)
- **Entry**: Songs tab → "Translation Studio" card
- **Server**: `trpc.songPipeline.startPipeline` → `songTranslationPipeline.ts`
- **Status**: PARTIALLY WORKING
  - Upload audio → S3 storage ✅ (real endpoint)
  - Start pipeline → creates async job ✅
  - Vocal isolation → SIMULATED (delays only, no real stem separation)
  - Lyrics extraction → REAL (uses LLM to generate/reconstruct lyrics from title+artist)
  - Translation → REAL (uses LLM with rhythm/syllable preservation)
  - Vocal synthesis → CONDITIONAL (uses ElevenLabs if API key present, otherwise simulated)
  - Mixing → SIMULATED (delays only)
  - Job polling → REAL (getJobStatus works)
  - Result display → REAL (shows translated lyrics, quality metrics, playback comparison)
  - Export/Bounce as MP3 → MISSING (no export button on result screen)

### Path 2: Song Studio (`app/song-studio.tsx`)
- **Entry**: Not linked from anywhere (orphaned screen)
- **Server**: `trpc.songStudio.*` (all commented out in client)
- **Status**: UI ONLY / DEMO
  - All server calls are commented out
  - Uses simulated delays and placeholder data
  - Has export/bounce UI with format picker (mp3/wav/m4a)
  - Bounce shows Alert but doesn't actually export

### Path 3: WavyEQ Studio (`app/wavy-eq-studio.tsx`)
- **Entry**: Studio Hub, Song Player, Studio Library
- **Purpose**: Record user singing over translated tracks
- **Status**: PARTIALLY WORKING
  - Recording UI works ✅
  - Timer/sections tracking ✅
  - Mixing animation ✅
  - Done state → Preview + Save & Exit ✅
  - Export/Bounce as MP3 → MISSING (user requested this)

## Critical Gaps Found

1. **No MP3 bounce/export on WavyEQ Studio done screen** — User specifically asked for this
2. **No MP3 bounce/export on Song Translation Studio result screen** — Missing entirely
3. **Song Studio (path 2) is orphaned** — Not linked from anywhere, all server calls commented out
4. **No slang/dialect awareness in translation** — LLM translates without Airtable slang context
5. **Stem separation is simulated** — No real audio processing API integrated
6. **Vocal synthesis requires ElevenLabs key** — Falls back to demo mode without it
7. **No real audio mixing** — Just delays, no FFmpeg or audio processing

## Priority Fixes

1. Add MP3 bounce/export button to WavyEQ Studio done screen
2. Add MP3 bounce/export button to Song Translation Studio result screen
3. Wire slang-aware translation into the pipeline's LLM prompts
4. Remove orphaned song-studio.tsx or merge its export UI into the working paths
