export type Locale = "ja" | "en";

export type SectionType =
  | "intro"
  | "a"
  | "b"
  | "chorus"
  | "bridge"
  | "solo"
  | "outro"
  | "custom";

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
  };

  setlist: {
    title: string;
    description: string;
    sessionDate: string;
    venue: string;
    songCount: string;
    noSetlists: string;
    addSong: string;
  };

  settings: {
    language: string;
    account: string;
    deleteAccount: string;
  };

  perform: {
    section: string;
    of: string;
  };
}
