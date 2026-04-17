# Struq MVP — Acceptance Criteria

## AC-1: Authentication
- [ ] User can log in with Google OAuth
- [ ] First-time login creates a new user record with google_id, email, name, avatar_url
- [ ] Returning user is matched by google_id
- [ ] User is redirected to /setlists after login
- [ ] Unauthenticated users are redirected to /login
- [ ] User with deleted_at set is blocked at login with appropriate message
- [ ] User can log out
- [ ] Session persists across page reloads

## AC-2: Song Creation
- [ ] User can create a new song with title (required), artist, BPM, key, reference URL
- [ ] Reference URL is displayed as a tappable link in song detail and edit views
- [ ] Song is saved to D1 database
- [ ] Empty title shows validation error

## AC-3: Section Editing
- [ ] User can add sections by tapping section palette buttons (Intro, A, B, Chorus, Bridge, Solo, Outro, Custom)
- [ ] Each section displays its type label, bar count, extra beats (if > 0), and color dot
- [ ] User can adjust bar count with preset buttons (1, 2, 4, 8, 16) or free input
- [ ] User can set extra beats (0-7) via selector
- [ ] Display format shows "8 bars + 2" when extra_beats > 0, "8 bars" when 0
- [ ] User can input chord progression as text for each section (e.g. "Am F C G")
- [ ] User can input a free-text memo for each section (e.g. "Vo合図で次へ")
- [ ] User can reorder sections via drag and drop
- [ ] User can delete a section
- [ ] Changes are saved to database

## AC-4: AI Structure Generation
- [ ] User can enter song title + artist and tap "AI生成" / "AI Generate"
- [ ] App calls Gemini Flash API and returns section structure
- [ ] Generated sections are populated in the editor
- [ ] User can edit/delete/reorder the generated sections before saving
- [ ] Loading state is shown during API call
- [ ] Error state is shown if API fails or returns invalid JSON, with option to retry or input manually
- [ ] Unknown section types in API response are normalized to "custom"
- [ ] Missing or invalid bars default to 8, extra_beats default to 0

## AC-5: Song List
- [ ] User sees a list of all their songs
- [ ] Each song shows title, artist, and mini structure preview (color bar)
- [ ] User can tap a song to edit it
- [ ] User can delete a song

## AC-6: Setlist Management
- [ ] User can create a setlist with title, description (optional), session date (optional), and venue (optional)
- [ ] User can edit setlist title, description, session date, and venue
- [ ] User can add existing songs to a setlist
- [ ] User can reorder songs within a setlist via drag and drop
- [ ] User can remove a song from a setlist
- [ ] User can delete a setlist
- [ ] Setlist displays song count, session date, and venue when present

## AC-7: Performance View
- [ ] User can enter performance view from a song or from a setlist
- [ ] Background is black (#111)
- [ ] Song title, artist, BPM, key are displayed in header
- [ ] All sections shown as colored blocks in a progress bar
- [ ] Current section name is displayed large in its assigned color
- [ ] Current section's chord progression is displayed below the section name
- [ ] Current section's bar count is displayed, with extra beats shown as "+ N" when present
- [ ] Previous section is shown above (dimmed)
- [ ] Next section is shown below with "NEXT" label
- [ ] Memo is displayed small below chord progression when present
- [ ] Tapping anywhere on screen advances to next section
- [ ] "Back" button returns to previous section
- [ ] "Reset" button returns to first section
- [ ] Section counter shows current position (e.g. "3 / 9")
- [ ] When entering from a setlist, swiping left/right navigates between songs
- [ ] "END" is displayed when on the last section
- [ ] First section + Back button: stays on first section (no-op)
- [ ] Last section + tap: shows "END" state, does not advance further
- [ ] Setlist mode: last section of last song shows "END"

## AC-8: Internationalization
- [ ] User can switch language between Japanese and English in settings
- [ ] Language preference is saved to user profile in database
- [ ] All UI text (buttons, labels, placeholders, messages) adapts to selected language
- [ ] Section labels adapt (e.g. "サビ" ↔ "Chorus", "イントロ" ↔ "Intro")

## AC-9: Responsive Design
- [ ] Song list and edit views render without horizontal scroll on iPhone (min 375px width)
- [ ] Performance view shows current section name, bar count, chord progression, and next section within a single screen on iPad landscape
- [ ] Performance view on iPhone (portrait) shows current section name, bar count, and next section within a single screen (chord progression may wrap)
- [ ] All tap targets are minimum 44px

## AC-10: Data Integrity
- [ ] Each user can only see and edit their own songs and setlists
- [ ] All deletions are logical (set deleted_at, not physical delete)
- [ ] Deleted records are hidden from all list/detail views
- [ ] Deleting a song also soft-deletes its sections and physically removes SetlistSongs entries
- [ ] Deleting a setlist does not delete the songs in it
- [ ] SetlistSongs (junction table) uses physical deletion, not soft delete
- [ ] Deleting a user soft-deletes all their songs, setlists, and sections
- [ ] Users with deleted_at set are blocked at login
- [ ] Section sort_order is maintained correctly after reordering
