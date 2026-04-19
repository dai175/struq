import { describe, expect, it } from "vitest";
import {
  aiSectionSchema,
  aiSectionsSchema,
  createSetlistInputSchema,
  createSongInputSchema,
  deleteByIdInputSchema,
  generateSectionsInputSchema,
  listInputSchema,
  listSongsForPickerInputSchema,
  reorderSetlistSongsInputSchema,
  saveSongWithSectionsInputSchema,
  sectionTypeSchema,
  setlistIdInputSchema,
  setlistSongPairInputSchema,
  songIdInputSchema,
  updateSetlistInputSchema,
  updateSongInputSchema,
} from "./schemas";

// ─── listInputSchema ───────────────────────────────────────────────────────────

describe("listInputSchema", () => {
  it("succeeds without offset", () => {
    expect(listInputSchema.parse({})).toEqual({});
  });

  it("succeeds with offset=0", () => {
    expect(listInputSchema.parse({ offset: 0 })).toEqual({ offset: 0 });
  });

  it("succeeds with offset=100", () => {
    expect(listInputSchema.parse({ offset: 100 })).toEqual({ offset: 100 });
  });

  it("throws for offset=-1", () => {
    expect(() => listInputSchema.parse({ offset: -1 })).toThrow();
  });

  it("throws for offset=1.5 (decimal)", () => {
    expect(() => listInputSchema.parse({ offset: 1.5 })).toThrow();
  });

  it("succeeds with query string", () => {
    expect(listInputSchema.parse({ query: "hello" })).toEqual({ query: "hello" });
  });

  it("trims whitespace from query", () => {
    expect(listInputSchema.parse({ query: "  hello  " })).toEqual({ query: "hello" });
  });

  it("throws when query exceeds 100 characters", () => {
    expect(() => listInputSchema.parse({ query: "a".repeat(101) })).toThrow();
  });

  it("succeeds with both offset and query", () => {
    expect(listInputSchema.parse({ offset: 30, query: "song" })).toEqual({ offset: 30, query: "song" });
  });

  it("converts empty query to undefined", () => {
    expect(listInputSchema.parse({ query: "" })).toEqual({});
  });

  it("converts whitespace-only query to undefined", () => {
    expect(listInputSchema.parse({ query: "   " })).toEqual({});
  });
});

// ─── songIdInputSchema ─────────────────────────────────────────────────────────

describe("songIdInputSchema", () => {
  it("succeeds with a valid UUID", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(songIdInputSchema.parse({ songId: id })).toEqual({ songId: id });
  });

  it("throws for a non-UUID string", () => {
    expect(() => songIdInputSchema.parse({ songId: "not-a-uuid" })).toThrow();
  });

  it("throws when songId is omitted", () => {
    expect(() => songIdInputSchema.parse({})).toThrow();
  });
});

// ─── setlistIdInputSchema ──────────────────────────────────────────────────────

describe("setlistIdInputSchema", () => {
  it("succeeds with a valid UUID", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(setlistIdInputSchema.parse({ setlistId: id })).toEqual({ setlistId: id });
  });

  it("throws for a non-UUID string", () => {
    expect(() => setlistIdInputSchema.parse({ setlistId: "not-a-uuid" })).toThrow();
  });
});

// ─── listSongsForPickerInputSchema ────────────────────────────────────────────

describe("listSongsForPickerInputSchema", () => {
  const validId = "550e8400-e29b-41d4-a716-446655440000";

  it("succeeds with setlistId only", () => {
    expect(listSongsForPickerInputSchema.parse({ setlistId: validId })).toEqual({ setlistId: validId });
  });

  it("succeeds with setlistId and query", () => {
    expect(listSongsForPickerInputSchema.parse({ setlistId: validId, query: "hello" })).toEqual({
      setlistId: validId,
      query: "hello",
    });
  });

  it("trims whitespace from query", () => {
    expect(listSongsForPickerInputSchema.parse({ setlistId: validId, query: "  hello  " })).toEqual({
      setlistId: validId,
      query: "hello",
    });
  });

  it("converts empty query to undefined", () => {
    expect(listSongsForPickerInputSchema.parse({ setlistId: validId, query: "" })).toEqual({ setlistId: validId });
  });

  it("converts whitespace-only query to undefined", () => {
    expect(listSongsForPickerInputSchema.parse({ setlistId: validId, query: "   " })).toEqual({ setlistId: validId });
  });

  it("throws when query exceeds 100 characters", () => {
    expect(() => listSongsForPickerInputSchema.parse({ setlistId: validId, query: "a".repeat(101) })).toThrow();
  });

  it("throws when setlistId is missing", () => {
    expect(() => listSongsForPickerInputSchema.parse({ query: "hello" })).toThrow();
  });

  it("throws for a non-UUID setlistId", () => {
    expect(() => listSongsForPickerInputSchema.parse({ setlistId: "bad", query: "hello" })).toThrow();
  });
});

// ─── createSongInputSchema ─────────────────────────────────────────────────────

describe("createSongInputSchema", () => {
  it("succeeds with required fields only", () => {
    const result = createSongInputSchema.parse({ title: "My Song" });
    expect(result.title).toBe("My Song");
  });

  it("succeeds with all fields specified", () => {
    const result = createSongInputSchema.parse({
      title: "My Song",
      artist: "Artist",
      bpm: 120,
      key: "C",
      referenceUrl: "https://example.com",
    });
    expect(result.title).toBe("My Song");
    expect(result.artist).toBe("Artist");
    expect(result.bpm).toBe(120);
  });

  it("throws when title is empty", () => {
    expect(() => createSongInputSchema.parse({ title: "" })).toThrow();
  });

  it("throws when title exceeds 200 characters", () => {
    expect(() => createSongInputSchema.parse({ title: "a".repeat(201) })).toThrow();
  });

  it("throws when title is whitespace only (empty after trim)", () => {
    expect(() => createSongInputSchema.parse({ title: "   " })).toThrow();
  });

  it("throws for bpm=0", () => {
    expect(() => createSongInputSchema.parse({ title: "Song", bpm: 0 })).toThrow();
  });

  it("throws for bpm=401", () => {
    expect(() => createSongInputSchema.parse({ title: "Song", bpm: 401 })).toThrow();
  });

  it("succeeds with bpm=400", () => {
    const result = createSongInputSchema.parse({ title: "Song", bpm: 400 });
    expect(result.bpm).toBe(400);
  });

  it("succeeds when referenceUrl uses http", () => {
    const result = createSongInputSchema.parse({
      title: "Song",
      referenceUrl: "http://example.com",
    });
    expect(result.referenceUrl).toBe("http://example.com");
  });

  it("throws when referenceUrl uses ftp://", () => {
    expect(() => createSongInputSchema.parse({ title: "Song", referenceUrl: "ftp://example.com" })).toThrow();
  });

  it("throws when referenceUrl is an invalid string", () => {
    expect(() => createSongInputSchema.parse({ title: "Song", referenceUrl: "not-a-url" })).toThrow();
  });

  it("converts empty artist to undefined", () => {
    const result = createSongInputSchema.parse({ title: "Song", artist: "" });
    expect(result.artist).toBeUndefined();
  });

  it("throws when artist exceeds 200 characters", () => {
    expect(() => createSongInputSchema.parse({ title: "Song", artist: "a".repeat(201) })).toThrow();
  });

  it("throws when key exceeds 32 characters", () => {
    expect(() => createSongInputSchema.parse({ title: "Song", key: "K".repeat(33) })).toThrow();
  });

  it("converts empty key to undefined", () => {
    const result = createSongInputSchema.parse({ title: "Song", key: "" });
    expect(result.key).toBeUndefined();
  });
});

// ─── updateSongInputSchema ─────────────────────────────────────────────────────

describe("updateSongInputSchema", () => {
  it("succeeds with id and title", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const result = updateSongInputSchema.parse({ id, title: "Updated" });
    expect(result.title).toBe("Updated");
  });

  it("throws when id is an invalid UUID", () => {
    expect(() => updateSongInputSchema.parse({ id: "bad-id", title: "Updated" })).toThrow();
  });

  it("throws when title is empty", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(() => updateSongInputSchema.parse({ id, title: "" })).toThrow();
  });

  it("throws when key exceeds 32 characters", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(() => updateSongInputSchema.parse({ id, title: "Updated", key: "K".repeat(33) })).toThrow();
  });
});

// ─── generateSectionsInputSchema ──────────────────────────────────────────────

describe("generateSectionsInputSchema", () => {
  it("succeeds with title and artist", () => {
    const result = generateSectionsInputSchema.parse({ title: "Song", artist: "Artist" });
    expect(result.title).toBe("Song");
  });

  it("succeeds when artist is empty string", () => {
    const result = generateSectionsInputSchema.parse({ title: "Song", artist: "" });
    expect(result.artist).toBe("");
  });

  it("throws when title is empty", () => {
    expect(() => generateSectionsInputSchema.parse({ title: "", artist: "Artist" })).toThrow();
  });

  it("throws when artist is omitted", () => {
    expect(() => generateSectionsInputSchema.parse({ title: "Song" })).toThrow();
  });

  it("succeeds with key", () => {
    const result = generateSectionsInputSchema.parse({ title: "Song", artist: "Artist", key: "Am" });
    expect(result.key).toBe("Am");
  });

  it("succeeds when key is omitted", () => {
    const result = generateSectionsInputSchema.parse({ title: "Song", artist: "Artist" });
    expect(result.key).toBeUndefined();
  });

  it("converts empty key to undefined", () => {
    const result = generateSectionsInputSchema.parse({ title: "Song", artist: "", key: "" });
    expect(result.key).toBeUndefined();
  });

  it("throws when key exceeds 32 characters", () => {
    expect(() => generateSectionsInputSchema.parse({ title: "Song", artist: "", key: "K".repeat(33) })).toThrow();
  });
});

// ─── aiSectionSchema ───────────────────────────────────────────────────────────

describe("aiSectionSchema", () => {
  it("succeeds with required fields only", () => {
    const result = aiSectionSchema.parse({ type: "verse", bars: 8 });
    expect(result.type).toBe("verse");
    expect(result.bars).toBe(8);
  });

  it("succeeds with all fields specified", () => {
    const result = aiSectionSchema.parse({
      type: "chorus",
      bars: 8,
      extra_beats: 2,
      chord_progression: "I-IV-V",
    });
    expect(result.chord_progression).toBe("I-IV-V");
  });

  it("succeeds when chord_progression is null", () => {
    const result = aiSectionSchema.parse({ type: "verse", bars: 8, chord_progression: null });
    expect(result.chord_progression).toBeNull();
  });

  it("throws for bars=0", () => {
    expect(() => aiSectionSchema.parse({ type: "verse", bars: 0 })).toThrow();
  });

  it("throws for extra_beats=8", () => {
    expect(() => aiSectionSchema.parse({ type: "verse", bars: 8, extra_beats: 8 })).toThrow();
  });

  it("succeeds with extra_beats=7", () => {
    const result = aiSectionSchema.parse({ type: "verse", bars: 8, extra_beats: 7 });
    expect(result.extra_beats).toBe(7);
  });
});

// ─── aiSectionsSchema ──────────────────────────────────────────────────────────

describe("aiSectionsSchema", () => {
  it("succeeds with an array of one item", () => {
    const result = aiSectionsSchema.parse([{ type: "verse", bars: 8 }]);
    expect(result).toHaveLength(1);
  });

  it("throws for an empty array", () => {
    expect(() => aiSectionsSchema.parse([])).toThrow();
  });

  it("throws for an array of 51 items", () => {
    const items = Array.from({ length: 51 }, () => ({ type: "verse", bars: 8 }));
    expect(() => aiSectionsSchema.parse(items)).toThrow();
  });

  it("succeeds with an array of 50 items", () => {
    const items = Array.from({ length: 50 }, () => ({ type: "verse", bars: 8 }));
    const result = aiSectionsSchema.parse(items);
    expect(result).toHaveLength(50);
  });
});

// ─── sectionTypeSchema ─────────────────────────────────────────────────────────

describe("sectionTypeSchema", () => {
  const validTypes = ["intro", "a", "b", "chorus", "bridge", "solo", "outro", "interlude", "custom"];

  for (const type of validTypes) {
    it(`succeeds for "${type}"`, () => {
      expect(sectionTypeSchema.parse(type)).toBe(type);
    });
  }

  it("throws for an invalid value", () => {
    expect(() => sectionTypeSchema.parse("invalid")).toThrow();
  });
});

// ─── saveSongWithSectionsInputSchema ──────────────────────────────────────────

describe("saveSongWithSectionsInputSchema", () => {
  const validId = "550e8400-e29b-41d4-a716-446655440000";
  const minimalSection = { type: "intro" as const, bars: 4, extraBeats: 0, sortOrder: 0 };

  it("succeeds with a valid song and sections", () => {
    const result = saveSongWithSectionsInputSchema.parse({
      song: { id: validId, title: "My Song" },
      sections: [minimalSection],
    });
    expect(result.song.id).toBe(validId);
    expect(result.sections).toHaveLength(1);
  });

  it("succeeds with an empty sections array", () => {
    const result = saveSongWithSectionsInputSchema.parse({
      song: { id: validId, title: "My Song" },
      sections: [],
    });
    expect(result.sections).toHaveLength(0);
  });

  it("throws when song id is missing", () => {
    expect(() => saveSongWithSectionsInputSchema.parse({ song: { title: "My Song" }, sections: [] })).toThrow();
  });

  it("throws when song title is empty", () => {
    expect(() => saveSongWithSectionsInputSchema.parse({ song: { id: validId, title: "" }, sections: [] })).toThrow();
  });

  it("throws for sections array with 201 items", () => {
    const sections = Array.from({ length: 201 }, (_, i) => ({ ...minimalSection, sortOrder: i }));
    expect(() =>
      saveSongWithSectionsInputSchema.parse({ song: { id: validId, title: "My Song" }, sections }),
    ).toThrow();
  });

  it("throws for an invalid section type", () => {
    expect(() =>
      saveSongWithSectionsInputSchema.parse({
        song: { id: validId, title: "My Song" },
        sections: [{ type: "invalid", bars: 4, extraBeats: 0, sortOrder: 0 }],
      }),
    ).toThrow();
  });

  it("throws for bars=0 in a section", () => {
    expect(() =>
      saveSongWithSectionsInputSchema.parse({
        song: { id: validId, title: "My Song" },
        sections: [{ type: "intro", bars: 0, extraBeats: 0, sortOrder: 0 }],
      }),
    ).toThrow();
  });
});

// ─── deleteByIdInputSchema ─────────────────────────────────────────────────────

describe("deleteByIdInputSchema", () => {
  it("succeeds with a valid UUID", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(deleteByIdInputSchema.parse({ id })).toEqual({ id });
  });

  it("throws for a non-UUID string", () => {
    expect(() => deleteByIdInputSchema.parse({ id: "not-a-uuid" })).toThrow();
  });
});

// ─── createSetlistInputSchema ──────────────────────────────────────────────────

describe("createSetlistInputSchema", () => {
  it("succeeds with title only", () => {
    const result = createSetlistInputSchema.parse({ title: "My Setlist" });
    expect(result.title).toBe("My Setlist");
  });

  it("succeeds with all fields specified", () => {
    const result = createSetlistInputSchema.parse({
      title: "My Setlist",
      description: "A description",
      sessionDate: "2024-01-15",
      venue: "Club",
    });
    expect(result.sessionDate).toBe("2024-01-15");
  });

  it("throws when title is empty", () => {
    expect(() => createSetlistInputSchema.parse({ title: "" })).toThrow();
  });

  it("throws when sessionDate has an invalid format", () => {
    expect(() => createSetlistInputSchema.parse({ title: "Setlist", sessionDate: "2024/01/15" })).toThrow();
  });

  it("succeeds when sessionDate is in YYYY-MM-DD format", () => {
    const result = createSetlistInputSchema.parse({
      title: "Setlist",
      sessionDate: "2024-12-31",
    });
    expect(result.sessionDate).toBe("2024-12-31");
  });

  it("converts empty description to undefined", () => {
    const result = createSetlistInputSchema.parse({ title: "Setlist", description: "" });
    expect(result.description).toBeUndefined();
  });

  it("converts empty venue to undefined", () => {
    const result = createSetlistInputSchema.parse({ title: "Setlist", venue: "" });
    expect(result.venue).toBeUndefined();
  });

  it("throws when description exceeds 1000 characters", () => {
    expect(() => createSetlistInputSchema.parse({ title: "Setlist", description: "d".repeat(1001) })).toThrow();
  });

  it("throws when venue exceeds 200 characters", () => {
    expect(() => createSetlistInputSchema.parse({ title: "Setlist", venue: "v".repeat(201) })).toThrow();
  });
});

// ─── updateSetlistInputSchema ──────────────────────────────────────────────────

describe("updateSetlistInputSchema", () => {
  it("succeeds with id and title", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const result = updateSetlistInputSchema.parse({ id, title: "Updated" });
    expect(result.title).toBe("Updated");
  });

  it("throws when id is an invalid UUID", () => {
    expect(() => updateSetlistInputSchema.parse({ id: "bad-id", title: "Updated" })).toThrow();
  });

  it("throws when title is empty", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(() => updateSetlistInputSchema.parse({ id, title: "" })).toThrow();
  });

  it("throws when description exceeds 1000 characters", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(() => updateSetlistInputSchema.parse({ id, title: "Updated", description: "d".repeat(1001) })).toThrow();
  });
});

// ─── setlistSongPairInputSchema ────────────────────────────────────────────────

describe("setlistSongPairInputSchema", () => {
  it("succeeds with two valid UUIDs", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const result = setlistSongPairInputSchema.parse({ setlistId: id, songId: id });
    expect(result.setlistId).toBe(id);
    expect(result.songId).toBe(id);
  });

  it("throws when songId is an invalid UUID", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(() => setlistSongPairInputSchema.parse({ setlistId: id, songId: "bad" })).toThrow();
  });
});

// ─── reorderSetlistSongsInputSchema ───────────────────────────────────────────

describe("reorderSetlistSongsInputSchema", () => {
  const validId = "550e8400-e29b-41d4-a716-446655440000";

  it("succeeds with an empty songIds array", () => {
    const result = reorderSetlistSongsInputSchema.parse({ setlistId: validId, songIds: [] });
    expect(result.songIds).toHaveLength(0);
  });

  it("succeeds with a valid UUID array", () => {
    const result = reorderSetlistSongsInputSchema.parse({
      setlistId: validId,
      songIds: [validId, validId],
    });
    expect(result.songIds).toHaveLength(2);
  });

  it("throws for songIds array with 501 items", () => {
    const ids = Array.from({ length: 501 }, () => validId);
    expect(() => reorderSetlistSongsInputSchema.parse({ setlistId: validId, songIds: ids })).toThrow();
  });

  it("succeeds for songIds array with 500 items", () => {
    const ids = Array.from({ length: 500 }, () => validId);
    const result = reorderSetlistSongsInputSchema.parse({ setlistId: validId, songIds: ids });
    expect(result.songIds).toHaveLength(500);
  });

  it("throws when songIds contains an invalid UUID", () => {
    expect(() => reorderSetlistSongsInputSchema.parse({ setlistId: validId, songIds: ["bad"] })).toThrow();
  });
});
