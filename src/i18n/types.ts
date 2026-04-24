export const LOCALES = ["ja", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ja";

export const SECTION_TYPES = ["intro", "a", "b", "chorus", "bridge", "solo", "outro", "interlude", "custom"] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export interface Translations {
  section: Record<SectionType, string>;

  common: {
    save: string;
    saveChanges: string;
    cancel: string;
    delete: string;
    edit: string;
    back: string;
    reset: string;
    close: string;
    new: string;
    loading: string;
    error: string;
    retry: string;
    end: string;
    next: string;
    bars: string;
    barsWithExtra: string;
    extraBeats: string;
    errorSaveFailed: string;
    errorDeleteFailed: string;
    errorCreateFailed: string;
    errorAddFailed: string;
    errorLoadFailed: string;
    loadMore: string;
    duplicate: string;
    comingSoon: string;
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
    createSong: string;
    deleteSong: string;
    confirmDelete: string;
    saved: string;
    titleRequired: string;
    customLabel: string;
    memo: string;
    chordProgression: string;
    aiError: string;
    aiConfirmReplace: string;
    invalidUrl: string;
    aiRateLimited: string;
    searchPlaceholder: string;
    searchNoResults: string;
    searchClear: string;
    shown: string;
    total: string;
    noMatches: string;
    selectOne: string;
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
    createSetlist: string;
    confirmDelete: string;
    saved: string;
    titleRequired: string;
    noSongs: string;
    removeSong: string;
    pickerAllAdded: string;
    addFromLibrary: string;
  };

  settings: {
    language: string;
    account: string;
    deleteAccount: string;
    clickSound: string;
    title: string;
    nav: {
      account: string;
      language: string;
      audio: string;
      appearance: string;
      shortcuts: string;
      about: string;
    };
    desc: {
      profile: string;
      session: string;
      locale: string;
      clickTrack: string;
      countIn: string;
      clickVolume: string;
      clickSoundChar: string;
      accentDownbeat: string;
      preRoll: string;
      theme: string;
      keyboard: string;
      build: string;
    };
    aria: {
      clickTrack: string;
      countIn: string;
      clickVolume: string;
      accentDownbeat: string;
    };
    soundDesc: {
      tick: string;
      beep: string;
      snap: string;
      rim: string;
    };
    shortcut: {
      advance: string;
      previous: string;
      reset: string;
      exit: string;
    };
  };

  perform: {
    section: string;
    of: string;
    songOf: string;
    start: string;
    modeSelect: {
      manual: string;
      auto: string;
      bpmRequired: string;
    };
    paused: {
      tapToResume: string;
    };
  };

  auth: {
    loginWith: string;
    tagline: string;
    accountDeleted: string;
    authFailed: string;
    loginCancelled: string;
    invalidState: string;
    heroPc: string;
    heroPcDim: string;
    heroMobile1: string;
    heroMobile2: string;
    heroMobileDim: string;
    bodyCopy: string;
    signInTitle: string;
    signInBody: string;
    continueWithGoogle: string;
  };
}
