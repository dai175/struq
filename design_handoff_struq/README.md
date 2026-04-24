# Handoff: Struq — Full App Redesign (Broadcast Console)

## Overview

Struq is a rehearsal & live-stage console for musicians. It lets a performer:

1. **Map a song's structure** — intro, A, chorus, bridge, solo, etc. — each section typed, colored, and sized in bars
2. **Organize songs into setlists** for rehearsals and shows
3. **Perform** — a fullscreen, high-contrast view that drives through the song's sections in real time (bar/beat meter, chord readout, next-up preview, click track)

This handoff covers a **full app redesign** under the "Broadcast Console" visual direction — the aesthetic reference is a broadcast truck / studio rack: precise monospace meta, segment-style displays, clear zones, no decorative chrome. Every screen is provided in two form factors: **landscape (PC / iPad)** and **portrait (iPhone)**.

---

## About the Design Files

The files bundled here are **design references authored as HTML + React (inline JSX, no build step)** — prototypes that demonstrate the intended look, structure, and interactions. **They are not production code to copy directly.**

The implementation task is to **recreate these designs in the target codebase's existing environment**, using its established component library, routing, state, and design-token conventions. If no app environment exists yet, pick the most appropriate stack for the project's platform targets (React / React Native / SwiftUI / etc.) and implement there.

Colors, spacing, typography, and copy in the references are final — recreate them precisely.

## Fidelity

**High-fidelity (hifi).** All colors, typography, spacing, iconography, and copy are final and should be reproduced exactly. Layout grids (column widths, rail widths, gaps, padding) are also final — treat them as specs, not suggestions.

---

## Screens / Views

The app has **5 feature areas × 2 form factors** plus a shared design-token sheet. All screens share the Broadcast Console vocabulary documented in **Design Tokens** below.

### 01 · Authentication

#### PC · Sign in (`LoginConsole`, 1280×800)
- **Layout**: Two-column grid, `1.1fr 1fr`, divider = `1px solid rgba(255,255,255,0.08)`.
  - **Left** (identity plaque): padding `40px 56px`, `flex` column `space-between`. Header = logomark + wordmark "Struq" (Inter 22/700) + meta tag "V 2.0 · FOCUSWAVE". Middle = orange meta tag "STRUCTURE · REHEARSAL · LIVE" + hero headline "Song structures, / always at hand." (Inter 68/800, letter-spacing -0.04em, line-height 1.0; second line at `rgba(255,255,255,0.5)`). Body copy Inter 14/400 at `--dim`, max-width 460, line-height 1.6. Bottom = meta tag "EXAMPLE · LOVE ME DO / 10 SECTIONS / 60 BARS" + an inline 10-segment structure bar (height 10px, flex-weighted by `bars`) with 3-letter section abbreviations below.
  - **Right** (sign-in): padding `40px 56px`, `flex` column `space-between`. Top row = meta tags "ACCESS" / "EN / JA". Center = "Sign in" (Inter 32/700, letter-spacing -0.02em) + paragraph about Google sync + single **Continue with Google** button (full-width, `#fff` bg, `#111` text, 16×20 padding, 2px radius, Inter 14/600, real Google G SVG). Meta row below: "SECURE · NO PASSWORD · SSO". Bottom row = "STRUQ.FOCUSWAVE.CC" / "© 2026".

#### Mobile · Sign in (`LoginConsoleMobile`, 390×844)
- **Layout**: Vertical stack. Top bar with logomark + "Struq" + "V 2.0" meta. Body centers a 44px/800 hero "Song / structures, / at hand." (third line 55% white). Below: "EXAMPLE STRUCTURE" meta + structure bar. Google button identical to PC. Footer: "FOCUSWAVE" / "EN / JA".

### 02 · Setlists

#### PC · Library + Detail (`SetlistsPC`, 1440×900)
- **Layout**: 3-column — `SideRail (76px) | List (360px) | Detail (flex)`.
- **SideRail** (shared across PC screens): top = logomark. Middle = 3 nav items: SETLIST, SONGS, SETTINGS. Active item has `borderLeft: 2px solid var(--sec-a)` and `color: #fff`; inactive at `rgba(255,255,255,0.35)`. Icons 18×18, stroke 1.6. Each item vertical (icon over JBM 8/0.22em label). Bottom = 32×32 user avatar "MK" in accent color.
- **List column**: Header "Setlists" (Inter 16/700) + subtitle "05 ACTIVE · 12 ARCHIVED" + NEW button (white bg, 10/0.22em JBM). Filter row with accent dot + input + `⌘K`. List of 5 setlists; active row has 2px left accent border, bg `rgba(255,255,255,0.04)`. Each row: 2-digit index, title, date + song-count meta, and a mini 1-segment-per-song structure strip (height 3px).
- **Detail column**:
  - **TopRail**: "Spring Tour 2026 · Night 1" (Inter 20/700) + subtitle "2026.04.18 · 19:30 · SHIMOKITAZAWA CLUB QUE". Right = DUPLICATE, DELETE (coral), START PERFORM (accent bg, bold).
  - **Metadata row**: 4 big stats (SONGS 06, TOTAL SECTIONS 51, EST. DURATION 28 MIN, AVG BPM 95) — meta label above, Inter 28/700 value below.
  - **Total structure bar**: all sections of all songs, 10px tall, 1px gap; under each song a centered 2-digit index with a 1px top border.
  - **Song rows**: 7-col grid `28px 42px 1fr 220px 100px 80px 100px` — drag icon, 16/600 2-digit #, title (Inter 14/600) + artist caps meta, 5px structure strip, BPM, KEY, SEC count (right-aligned mono). First row subtly highlighted. "+ ADD SONG FROM LIBRARY" dashed button below.

#### Mobile · List (`SetlistsList`, 390×844)
- TopBar "Setlists" + "04 ACTIVE · 12 ARCHIVED" + NEW button. Filter row with accent dot + `⌘K`. Vertical list of 4 cards, each with 2-digit index, title (Inter 16/600), date + venue row (mono with Cal + Pin icons), 4px mini structure strip, song count, trash icon. Fixed `BottomNav` with SETLISTS / SONGS / SETTINGS.

#### Mobile · Detail (`SetlistDetail`, 390×844)
- TopBar "Spring Tour 2026" + "NIGHT 01 · 06 SONGS" + back button + green START button. Metadata grid (VENUE / DATE). Full-setlist structure bar "TOTAL STRUCTURE · 51 SECTIONS / ≈ 28 MIN". Song rows with drag handle, 20/600 #, title + mono meta, and a 6-segment thumbnail. "+ ADD SONG FROM LIBRARY" dashed CTA.

### 03 · Songs

#### PC · Library + Editor (`SongsPC`, 1440×900)
- **Layout**: 3-column — `SideRail (76px) | Library (360px) | Editor (flex)`.
- **Library**: Same pattern as Setlists list but with song rows (title 13/600 + BPM/KEY/SEC mono + 3px structure strip). Active row has 2px accent border-left.
- **Editor**:
  - **TopRail**: "Love Me Do" + "EDITING · 10 SECTIONS · 60 BARS". Right = DELETE (coral), SAVE CHANGES (white), PERFORM (accent).
  - **Body** splits into `380px | 1fr`:
    - **META column** (380px, right-bordered): "01 · TRACK META" section with `ConsoleField`s for Title (required), Artist, BPM (mono), Key (mono), Reference URL (mono). "02 · STRUCTURE PREVIEW" shows the 10-segment bar with abbreviations. AI · GENERATE STRUCTURE button (outlined, sparkle icon). "03 · ADD SECTION" is a 4×2 palette of type chips (intro, a, b, chorus, bridge, solo, interlude, outro) — each is a small swatch + type label.
    - **SECTIONS column**: "04 · SECTIONS · 10 TOTAL" then 10 section rows. Each row: 1px border + 3px left border in section color; grid `18px 36px 1fr 140px 90px 90px 28px` — drag, 2-digit #, label + type meta, chord progression (mono), "{n} BARS" in section color, "{n}b" beats total in dim, trash.

#### Mobile · List (`SongsList`, 390×844)
- TopBar "Songs" + "32 TOTAL · 6 SHOWN" + NEW. Search row with IconSearch + A–Z meta. List cards: 2-digit #, title + artist caps meta, 5px structure strip + "{n} SEC" label, then BPM/KEY/BARS mono row. BottomNav active=songs.

#### Mobile · Editor (`SongEdit`, 390×844)
- TopBar "Love Me Do" + "EDITING · 10 SECTIONS" + back/trash/PERFORM buttons. Scrollable body with the same 4 numbered blocks as PC editor, stacked vertically. Sticky white "SAVE CHANGES" button above the BottomNav.

### 04 · Perform (the marquee screen)

#### PC / iPad landscape (`ConsolePerform`, 1280×720)
- **Layout**: 2-column — `280px | 1fr`.
- **Left rail** (timeline):
  - LIVE badge (red dot + glow) + "ESC" meta.
  - TRACK block: title (Inter 16/600) + artist mono.
  - Scrollable section list: 2-digit #, 8×8 swatch (filled if past/current), label (bold if active), "{n}b" bars. Active row has 3px left border in section color + subtle bg.
  - Footer: BPM and KEY stats (mono 22/600).
- **Main stage** (grid `auto 1fr auto`):
  - **Meter strip**: "SECTION 03 OF 10" meta + 4px thin progress bar + % complete. Below: full-width segmented row where each section's width = `flex: s.bars` and height = 6px, past/current/future differently colored.
  - **Center readout** (2-column `1.2fr 1fr`, padding 0 40px):
    - **Left**: "● NOW" in section color + optional "← {prev}" meta. The section label rendered **huge** — Inter 160/800, line-height 0.92, letter-spacing -0.04em, with a `0 0 30px {color}33` text-shadow. Below: `cur.bars`-column grid of 22px bar cells (filled / current / future). Caption row with "BAR 03 OF 08" and "{bars*4} BEATS TOTAL".
    - **Right** — three cards:
      - `CHORD PROGRESSION` — chord string in mono 28/600, letter-spacing 0.22em.
      - `BEAT` — 4 cells (38×38), current beat filled in section color with glow, past dim, future barely visible; BPM label on the right.
      - `UP NEXT` (tone=dim, no fill) — 10×10 swatch + next section label (26/700, 85% white) + "{n} BARS".
  - **Foot**: ◁ BACK / "SPACE · TAP TO ADVANCE" / RESET, all outlined `ConsoleBtn`s.

#### iPhone portrait (`ConsolePerformMobile`, 390×844)
- Same information, stacked: header (◁, title + mono meta, ↻), section strip with "● LIVE" in section color, huge 120/800 label, bar grid, CHORD card, 4-cell beat row, UP NEXT border-top row. Footer: ◁ BACK / RESET.

### 05 · Settings

#### PC (`SettingsPC`, 1440×900)
- **Layout**: 4-column — `SideRail (76px) | Sub-nav (260px) | Main (flex)`.
- **Sub-nav**: header "Settings / SYSTEM & PREFERENCES". 6 nav items: ACCOUNT, LANGUAGE, AUDIO & CLICK (active), APPEARANCE, SHORTCUTS, ABOUT. Active has 2px left accent border, bg `rgba(255,255,255,0.04)`, `●` marker.
- **Main**: TopRail "Audio & Click / METRONOME · COUNT-IN · SOUND" + APPLY CHANGES (white). Body is a 2-col grid of `SettingRow` cards:
  - CLICK TRACK (toggle on)
  - COUNT-IN (toggle off)
  - CLICK VOLUME (span 2): slider track 4px, fill 62% in accent, 2×14 handle at 62%, value readout "062" in accent 16/600, labels MUTE/050/MAX.
  - CLICK SOUND (span 2): 4-card grid TICK / BEEP / SNAP / RIM (active = white border, accent label).
  - ACCENT DOWNBEAT (toggle on)
  - PRE-ROLL BARS (4 cell chooser 0 / 1 / 2 / 4, 0 selected).
- `SettingRow`: 1px border card, meta-label head (11/0.22em/600/white) + description (Inter 13/400/dim).
- `Toggle`: 54×28 track, 24×24 thumb. On = accent bg + black thumb right. Off = white-10 bg + white-35 thumb left. 0.15s left transition.

#### Mobile (`SettingsPanel`, 390×844)
- TopBar "Settings" + "ACCOUNT · PREFERENCES · ABOUT".
- Identity row: 48×48 accent avatar "MK", name + email meta, SIGN OUT button (coral text).
- 4 numbered sections: 01 LANGUAGE (2-card EN / JA chooser), 02 AUDIO (3 rows: click toggle, count-in toggle, volume slider with readout 062), 03 APPEARANCE (3-card DARK/AUTO/LIGHT chooser), 04 ABOUT (key–value rows: Version / Released / Channel / Made by + chip row PRIVACY / TERMS / FEEDBACK / CHANGELOG).

### 06 · System

#### Design tokens sheet (`TokenSheet`, 1280×720)
- 2-column reference card shown in the canvas. Left: type system (5 samples from display to chord). Right: section palette (8 swatches with OKLCH values), surface scale (ink / ink-2 / ink-3 / elev).

---

## Interactions & Behavior

- **Navigation**:
  - Mobile uses the `BottomNav` tab bar (Setlists / Songs / Settings) — persistent across all non-Perform screens.
  - PC uses the `SideRail`; the Setlists and Songs screens are master/detail with an active row visually anchoring the detail column.
  - **Perform** is a modal fullscreen mode entered via the PERFORM button (both Song editor and Setlist detail). It is landscape-biased but also valid in portrait.
- **Perform mode interactions**:
  - `SPACE` or tap anywhere on the stage = advance one bar (and roll into next section at end).
  - `◁ BACK` button = previous bar / previous section at section start.
  - `RESET` = jump to section 01, bar 01, beat 01.
  - `ESC` exits Perform mode.
  - The LIVE red dot has a soft glow (`box-shadow: 0 0 8px #ef4444`) — implies a subtle pulse (1–1.5s ease-in-out) if animating.
  - Beat indicator: current beat cell has a `0 0 14px {color}88` glow; on each beat it "pops" (brief 1.05 scale / 80ms).
- **Edit flows**:
  - Song editor: drag-reorder sections via the drag handle (`IconDrag`). Clicking a palette chip (03 · ADD SECTION) appends a section of that type with a default `bars` (e.g. 4).
  - Setlist detail: drag-reorder songs. "+ ADD SONG FROM LIBRARY" opens a picker from the Songs library.
- **AI · Generate Structure**: outlined button that, when clicked, triggers a backend/AI call to propose a `SECTIONS[]` array for the current song based on title/artist or reference URL. Show a skeleton/loading state in the "04 · SECTIONS" column while pending.
- **Toggles**: click to flip; animate thumb `left` over 150ms.
- **Progress bars** (per-section and overall) should update live as the user advances bars in Perform mode.
- **Audio**: if `CLICK TRACK` is on during Perform, emit a click per beat (short WebAudio envelope; selected click sound = TICK/BEEP/SNAP/RIM). Accent downbeat = beat 1 at +6 dB or with a slightly different pitch.
- **Responsive**: portrait widths < 500px use the mobile variants; landscape ≥ 1024px uses PC variants. iPad landscape (≥ 1024px) uses PC `ConsolePerform` layout.

---

## State Management

Top-level domain objects:

```ts
type SectionType =
  | "intro" | "a" | "b" | "chorus" | "bridge"
  | "solo" | "outro" | "interlude" | "custom";

interface Section {
  type: SectionType;
  label: string;       // display label, may differ from type (e.g. "A" / "Chorus")
  bars: number;        // 4 beats per bar, 4/4 time assumed
  chord: string;       // space-separated chord symbols, e.g. "G C G C G D G"
}

interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;         // e.g. "G", "Dm", "F#m"
  referenceUrl?: string;
  sections: Section[];
}

interface Setlist {
  id: string;
  title: string;
  venue?: string;
  date?: string;       // "YYYY.MM.DD"
  time?: string;       // "HH:MM"
  songIds: string[];
}

interface Settings {
  language: "EN" | "JA";
  clickTrack: boolean;
  countIn: boolean;
  clickVolume: number;       // 0–100
  clickSound: "tick" | "beep" | "snap" | "rim";
  accentDownbeat: boolean;
  preRollBars: 0 | 1 | 2 | 4;
  appearance: "dark" | "auto" | "light";
}
```

Perform runtime state:

```ts
interface PerformState {
  songId: string;
  sectionIndex: number;  // 0..sections.length-1
  barInSection: number;  // 0..section.bars-1
  beatInBar: number;     // 0..3 (assuming 4/4)
  isPlaying: boolean;    // Auto mode
  startedAt?: number;    // epoch ms, for timing drift correction
}
```

State transitions:

- `advanceBar()` → `barInSection++`; if overflow, `sectionIndex++` and `barInSection=0`; if final section overflow, enter "end of track" state.
- `prevBar()` → mirror.
- `tick()` (Auto mode, every beat based on `bpm`) → `beatInBar++` and wrap into `advanceBar()` at 4.
- `reset()` → zeros all three.

Data persistence: songs/setlists/settings sync via the backend (Struq is a signed-in, multi-device product — the Login copy mentions sync across devices). Use whatever persistence layer exists in the target codebase.

---

## Design Tokens

### Colors — surfaces

```
--ink     : #080808       /* background                 */
--ink-2   : #0d0d0e       /* secondary surface / cards  */
--ink-3   : #161618       /* tertiary surface           */
--line    : rgba(255,255,255,0.08)  /* default hairline */
--line-2  : rgba(255,255,255,0.14)  /* stronger hairline */
--text    : #e8e6e0       /* default text               */
--dim     : rgba(255,255,255,0.55)  /* secondary text   */
--dim-2   : rgba(255,255,255,0.35)  /* tertiary text    */
--dim-3   : rgba(255,255,255,0.20)  /* quaternary text  */
--accent  : var(--sec-a)  /* primary accent = section A */
```

### Colors — section palette (OKLCH, normalized L≈0.72, C≈0.14–0.18)

```css
--sec-intro    : oklch(0.72 0.02 250);   /* neutral blue-gray */
--sec-a        : oklch(0.72 0.14 250);   /* blue              */
--sec-b        : oklch(0.72 0.14 295);   /* violet            */
--sec-chorus   : oklch(0.74 0.16 65);    /* amber (accent)    */
--sec-bridge   : oklch(0.72 0.14 160);   /* teal              */
--sec-solo     : oklch(0.70 0.18 25);    /* coral             */
--sec-outro    : oklch(0.72 0.02 250);   /* neutral (= intro) */
--sec-interlude: oklch(0.72 0.12 195);   /* cyan              */
--sec-custom   : oklch(0.72 0.14 340);   /* rose              */
```

Rationale: same lightness/chroma across hues gives the progress bar a cohesive rhythm rather than a color-pencil look.

### Typography

- **Inter** (400 / 500 / 600 / 700 / 800) — UI, headlines, body
- **JetBrains Mono** (400 / 500 / 600 / 700) — numbers, labels, meta, chord symbols

Scale (Inter unless marked JBM):

| Role      | Spec                                          |
| --------- | --------------------------------------------- |
| DISPLAY   | 800 · -0.04em · 120–180px · lh 1.0            |
| HERO      | 800 · -0.04em · 44–68px  · lh 1.0             |
| TITLE     | 700 · -0.02em · 20–32px                       |
| HEADLINE  | 600 · 15–18px                                  |
| BODY      | 400 · 13–14px · lh 1.6                         |
| META      | JBM 500 · 0.22em tracking · 9–11px · UPPER    |
| CHORD     | JBM 600 · 0.22em tracking · 18–28px           |
| NUMERIC   | JBM 500–700 · 0.05–0.18em · 11–28px           |

### Spacing

- Rail gutters: 18–28px mobile, 22–36px PC
- Card padding: 14–22px
- Row padding: `14px 18px` mobile, `14px 28px` PC
- Section gaps inside forms: 10px, between sections: 20–24px

### Borders & radii

- Hairline: `1px solid rgba(255,255,255,0.08)` everywhere
- Accent left border: `2–3px solid var(--sec-*)`
- Border radius: **1–2px only** (console aesthetic — no pill buttons, no rounded cards). Avatar = square, not circle.
- Section rows have `border: 1px solid line; border-left: 3px solid <section color>`.

### Shadows / glows

- LIVE dot: `box-shadow: 0 0 8px #ef4444`
- Active beat: `box-shadow: 0 0 14px {sectionColor}88`
- Huge section label: `text-shadow: 0 0 30px {sectionColor}33`

### Iconography

All icons are **stroke-based SVG** (stroke 1.6–1.8px, fill none, 18×18 or 14×14 viewBox `0 0 24 24`). Icons defined inline in `designs/console-kit.jsx`:

- `IconBack`, `IconPlay`, `IconTrash`, `IconPlus`, `IconSearch`, `IconSparkles`, `IconDrag`, `IconExt`, `IconPin`, `IconCal`

Reuse these exactly — shapes and stroke weights carry the instrument-panel feel.

---

## Assets

No external image or font assets beyond the two Google Fonts (Inter + JetBrains Mono). The logomark is an inline SVG of 5 colored rects (one per major section color) — see `LoginConsole` / `SideRail` source for exact coordinates.

The Google sign-in button uses the official Google "G" as inline SVG (reproduced verbatim from Google's brand spec) — keep as-is.

---

## Files

Provided in this handoff bundle under `designs/`:

```
designs/
  tokens.jsx           # TokenSheet reference card + color/type inventory
  shared.jsx           # SONG + SECTIONS sample data, SEC_COLOR map
  console-kit.jsx      # Shared primitives: C (color tokens), mono/sans,
                       #   MetaTag, ConsoleField, TopBar, BottomNav, icons
  console.jsx          # ConsolePerform (PC landscape) + ConsolePerformMobile
  console-login.jsx    # LoginConsole + LoginConsoleMobile
  console-setlists.jsx # SetlistsList + SetlistDetail (mobile)
  console-songs.jsx    # SongsList + SongEdit (mobile)
  console-settings.jsx # SettingsPanel (mobile)
  console-pc.jsx       # SetlistsPC + SongsPC + SettingsPC + SideRail + TopRail

struq-full.html        # Entry — defines :root OKLCH vars, loads all JSX
app-full.jsx           # Arranges every screen in a DesignCanvas for review
design-canvas.jsx      # Pan/zoom canvas component (reference-only)
```

### Reading order for the developer

1. `struq-full.html` — see the exact Google Fonts import and the `:root` OKLCH custom properties. Replicate these in the target codebase's global stylesheet.
2. `designs/console-kit.jsx` — copy the `C` token object and the shared primitives (`MetaTag`, `ConsoleField`, `TopBar`, `BottomNav`) into your component library with the idioms of the target stack.
3. `designs/shared.jsx` — sample section data. Useful for fixtures while the backend isn't wired.
4. For each feature area, read the mobile file and the corresponding block in `console-pc.jsx` together — they share copy and data but differ in layout density.
5. `designs/console.jsx` last — Perform is the most involved screen; start with the static layout and add the bar/beat state machine once the rest of the app is running.

### Running the reference locally

Open `struq-full.html` in a browser — everything is inline JSX transpiled by Babel standalone, no build step. The `DesignCanvas` lets you pan/zoom and open any artboard fullscreen for detailed inspection.
