export const LOCALES = ["ja", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ja";

export const SECTION_TYPES = [
  "intro",
  "a",
  "b",
  "chorus",
  "bridge",
  "solo",
  "outro",
  "custom",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export interface Translations {
  section: Record<SectionType, string>;

  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    back: string;
    reset: string;
    loading: string;
    error: string;
    retry: string;
    end: string;
    next: string;
    bars: string;
    barsWithExtra: string;
    extraBeats: string;
  };

  nav: {
    setlists: string;
    songs: string;
    settings: string;
    login: string;
    logout: string;
    newSong: string;
  };

  song: {
    title: string;
    artist: string;
    bpm: string;
    key: string;
    referenceUrl: string;
    aiGenerate: string;
    addSection: string;
    noSections: string;
    noSongs: string;
    deleteSong: string;
    confirmDelete: string;
    saved: string;
    titleRequired: string;
    customLabel: string;
    memo: string;
    chordProgression: string;
    aiError: string;
    aiConfirmReplace: string;
  };

  setlist: {
    title: string;
    description: string;
    sessionDate: string;
    venue: string;
    songCount: string;
    noSetlists: string;
    addSong: string;
    newSetlist: string;
    confirmDelete: string;
    saved: string;
    titleRequired: string;
    noSongs: string;
    removeSong: string;
  };

  settings: {
    language: string;
    account: string;
    deleteAccount: string;
  };

  perform: {
    section: string;
    of: string;
    songOf: string;
  };

  auth: {
    loginWith: string;
    accountDeleted: string;
    authFailed: string;
    loginCancelled: string;
    invalidState: string;
  };
}
