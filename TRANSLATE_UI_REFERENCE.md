# Google Translate UI Reference (from user screenshots)

## Key Design Patterns to Replicate:

### Main Translation Screen (IMG_4339):
- **Full-screen dark background** — no cards, no borders, just clean space
- **Input text is LARGE** (like 28-32pt) — "come here girls" in white
- **Blue horizontal line** separates input from output
- **Translation appears DIRECTLY below** in blue/cyan color — "Vengan aquí, chicas."
- **Action icons below translation**: Speaker (listen), Copy, Brackets (full screen?), More (...)
- **Language selector at BOTTOM** (not top): Two pill buttons "English" ↔ "Spanish" with swap arrows between
- **NO translate button** — translation appears in real-time as you type
- **Header**: Back arrow "< Home", handwriting icon, X (clear), ... (more options)
- **Mic button** in bottom-right corner of keyboard area

### Suggestions Panel (IMG_4340):
- Same layout as above but with a **"Translations of come here"** card below the action icons
- Shows **"Interjection"** category label in blue
- Lists related phrases: "come here please" → "Ven aqui, por favor"
- Each suggestion has a search icon and an arrow-up icon (to use it)

### History Screen (IMG_4337):
- Full-screen dark list
- Grouped by **"Today"** and **"Yesterday"** with colored section headers
- Each item shows: Original text (white, bold) + Translation below (gray)
- **Bookmark icon** on the right of each item
- Clean minimal layout, no cards/borders

### Empty State (IMG_4336 / IMG_4338):
- "Enter text" placeholder in large gray text
- "Paste" button visible
- Language selector at bottom
- Second screenshot shows a "Write here" handwriting area below the language selector

## Implementation Plan:
1. Remove the card-based input area
2. Make input text large and full-width (no label, no border)
3. Show translation directly below input with a blue divider line
4. Move language selector to bottom (above keyboard)
5. Remove the "Translate" button entirely — use real-time debounce only
6. Add action icons (listen, copy, share) in a row below translation
7. Keep history as a modal but style it like Google's grouped list
8. Add "Translations of..." suggestions panel below actions
