# Struq — CLAUDE.md

## Overview

Struq is a web app for musicians to quickly map out song structures and reference them during sessions. Built under the focuswave brand ("apps for being, not doing"), it helps musicians glance at a song's section flow (Intro → A → B → Chorus → Solo → Outro) without the complexity of full chord chart or setlist management apps.

**URL:** struq.focuswave.cc  
**Brand:** focuswave (cc.focuswave bundle, zen/minimalist aesthetic)

## Tech Stack

- **Framework:** TanStack Start (React) + Vite
- **Deployment:** Cloudflare Workers + Pages
- **Database:** Cloudflare D1 (SQLite) + Drizzle ORM
- **Auth:** Google OAuth
- **AI:** Google Gemini Flash API (song structure generation)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript
- **i18n:** Japanese / English (user-switchable)

## Project Setup

```bash
pnpm create cloudflare@latest struq --framework=tanstack-start
```

## Data Model

### Users
- id (TEXT, PK, uuid — internal app ID)
- google_id (TEXT, UNIQUE — Google OAuth sub field)
- email (TEXT)
- name (TEXT)
- avatar_url (TEXT, nullable — Google profile image)
- locale (TEXT, "ja" | "en", default "ja")
- created_at (INTEGER, unix timestamp)
- deleted_at (INTEGER, nullable, unix timestamp)

### Setlists
- id (TEXT, PK, uuid)
- user_id (TEXT, FK → users)
- title (TEXT)
- description (TEXT, nullable)
- session_date (TEXT, nullable, e.g. "2026-04-20")
- venue (TEXT, nullable, e.g. "下北沢BBQ")
- sort_order (INTEGER)
- created_at (INTEGER)
- updated_at (INTEGER)
- deleted_at (INTEGER, nullable)

### Songs
- id (TEXT, PK, uuid)
- user_id (TEXT, FK → users)
- title (TEXT)
- artist (TEXT, nullable)
- bpm (INTEGER, nullable)
- key (TEXT, nullable, e.g. "Am", "C", "F#m")
- reference_url (TEXT, nullable, e.g. YouTube, Spotify, Apple Music link)
- created_at (INTEGER)
- updated_at (INTEGER)
- deleted_at (INTEGER, nullable)

### SetlistSongs (junction)
- setlist_id (TEXT, FK → setlists)
- song_id (TEXT, FK → songs)
- sort_order (INTEGER)
- PK: (setlist_id, song_id)

### Sections
- id (TEXT, PK, uuid)
- song_id (TEXT, FK → songs)
- type (TEXT, e.g. "intro", "a", "b", "chorus", "bridge", "solo", "outro", "custom")
- label (TEXT, display label, e.g. "Intro", "A", "サビ")
- bars (INTEGER, default 8)
- extra_beats (INTEGER, default 0, 0-7, additional beats beyond bar count)
- chord_progression (TEXT, nullable, e.g. "Am F C G")
- memo (TEXT, nullable, free text note e.g. "Vo合図で次へ", "ハーフテンポ")
- sort_order (INTEGER)
- deleted_at (INTEGER, nullable)

## Soft Delete Policy

- All tables use logical deletion via `deleted_at` (unix timestamp, null = active)
- **Exception:** SetlistSongs (junction table) uses physical deletion, not soft delete
- All queries must filter `WHERE deleted_at IS NULL` (enforce via Drizzle global filter)
- Deleting a user sets `deleted_at` on user + all their songs, setlists, sections
- Deleting a song sets `deleted_at` on the song + its sections, and physically removes SetlistSongs entries
- Deleting a setlist sets `deleted_at` on the setlist only (songs are not affected)
- Users with `deleted_at IS NOT NULL` are blocked at login

## Section Label Strategy

- For fixed section types (intro, a, b, chorus, bridge, solo, outro): display label is derived from `type` + user locale at render time, using the Section Types table below. `label` field in DB is NOT used.
- For custom sections (type = "custom"): `label` field stores the user-defined display name (e.g. "間奏", "Breakdown"). This value is used as-is regardless of locale.

## Section Types & Colors

| type     | label (ja) | label (en) | color   | default bars |
|----------|-----------|------------|---------|-------------|
| intro    | イントロ    | Intro      | #6B7280 | 4           |
| a        | A         | A          | #3B82F6 | 8           |
| b        | B         | B          | #8B5CF6 | 8           |
| chorus   | サビ       | Chorus     | #F59E0B | 8           |
| bridge   | Bridge    | Bridge     | #10B981 | 8           |
| solo     | Solo      | Solo       | #EF4444 | 8           |
| outro    | アウトロ    | Outro      | #6B7280 | 4           |
| custom   | (user)    | (user)     | #EC4899 | 8           |

## Routes

```
/                   → Landing / redirect to /setlists
/login              → Google OAuth login
/setlists           → Setlist list view
/setlists/:id       → Setlist detail (songs in order)
/songs/new          → New song (with AI generate option)
/songs/:id          → Song edit view
/songs/:id/perform  → Performance view (fullscreen, dark)
/settings           → User settings (locale, account)
```

## Key Features (MVP)

### 1. Song Registration & Editing
- Input: title, artist, BPM, key, reference URL (YouTube/Spotify/etc.)
- Reference URL displayed as tappable link in edit view
- Section palette: tap to append section
- Each section: type, bars (adjustable ±), extra beats (0-7 selector), chord progression (text input), memo (free text)
- Drag to reorder, swipe/tap to delete
- Mini structure preview (color bar)
- Display format: "8 bars" or "8 bars + 2" when extra_beats > 0

### 2. AI Structure Generation
- Input: song title + artist name
- Call Gemini Flash API with prompt to return JSON structure
- Response: array of sections with type, bars, extra_beats, chord_progression
- User reviews and edits the generated structure
- **Response validation:**
  - Parse response as JSON; if invalid JSON, show error and allow manual input
  - Validate each section's `type` against allowed types (intro, a, b, chorus, bridge, solo, outro); unknown types are normalized to "custom"
  - `bars` must be positive integer; default to 8 if missing or invalid
  - `extra_beats` must be 0-7; default to 0 if missing or invalid
- Prompt template:

```
Given the song "{title}" by "{artist}", return the song structure as a JSON array.
Each element should have:
- "type": one of "intro", "a", "b", "chorus", "bridge", "solo", "outro"
- "bars": number of bars (integer)
- "extra_beats": additional beats beyond the bar count (integer, 0 if none)
- "chord_progression": chord symbols separated by spaces (e.g. "Am F C G"), or null if unknown

Return ONLY valid JSON, no explanation.
Example: [{"type":"intro","bars":4,"extra_beats":0,"chord_progression":null},{"type":"a","bars":8,"extra_beats":2,"chord_progression":"Am F C G"}]
```

### 3. Setlist Management
- Create/edit/delete setlists with title, description (optional), session date (optional), venue (optional)
- Add songs to setlist, reorder via drag
- Display total song count, session date, and venue when present

### 4. Performance View
- Fullscreen dark mode (black background)
- Current section displayed large with section color
- Previous/next section shown smaller
- Progress bar showing all sections as colored blocks
- Tap anywhere to advance to next section
- Back button, reset button
- Song title, artist, BPM, key displayed in header
- Current section's chord progression displayed below section name
- Bar count shows extra beats when present (e.g. "8 bars + 2")
- Memo displayed small below chord progression when present
- **Edge cases:**
  - First section + Back: no-op (stay on first section)
  - Last section + tap: show "END" state, no further advance
  - Setlist mode: swipe left/right to navigate between songs; last section of last song shows "END"
  - Reset: always returns to first section of current song

### 5. i18n
- Japanese and English
- Switchable in settings
- Section labels adapt to locale
- UI text managed via translation keys

### 6. Auth
- Google OAuth via Cloudflare Workers
- Login flow: authenticate → lookup user by google_id → if not found, create new user → set session
- Users with deleted_at set are blocked at login
- Session stored in cookie
- Middleware to protect /setlists, /songs, /settings routes

## UI/UX Guidelines

- Minimal, calm aesthetic aligned with focuswave brand
- Warm neutral background (#f8f7f5) for list/edit views
- Pure black (#111) for performance view
- Sections always color-coded consistently
- Touch-first design (large tap targets)
- Performance view optimized for iPad landscape
- Edit/list views optimized for mobile (iPhone)
- No unnecessary animations, transitions should be subtle (150ms ease)
- Font: system font stack or DM Sans for body, monospace for bar counts

## Not in MVP

- Audio file analysis (copyright concerns, requires GPU backend)
- Apple Watch support
- Bluetooth pedal support
- Real-time collaboration / sharing
- Offline mode (PWA service worker)
- Export/import (JSON, PDF)
- Metronome / auto-advance by BPM

## Development Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm deploy       # Build + deploy to Cloudflare
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Apply migrations locally
pnpm db:migrate:production  # Apply to remote D1
```

## Environment Variables

```
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GEMINI_API_KEY=xxx
SESSION_SECRET=xxx
```

These should be set as Cloudflare Worker secrets via `wrangler secret put`.
